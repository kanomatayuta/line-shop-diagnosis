// 🎯 最高峰アンケート分析システム - 完全なデータ収集と分析
export interface SurveyResponse {
  userId: string
  userName: string
  timestamp: number
  step: string
  question: string
  answer: string
  answerValue: string
  nextStep: string
  sessionId: string
  completionTime?: number
  userAgent?: string
  region?: string
}

export interface UserJourney {
  userId: string
  userName: string
  sessionId: string
  startTime: number
  endTime?: number
  totalSteps: number
  completedSteps: number
  responses: SurveyResponse[]
  finalResult?: string
  conversionStatus: 'completed' | 'abandoned' | 'consultation_requested'
  abandonedAt?: string
  completionRate: number
}

export interface AnalyticsData {
  totalResponses: number
  totalUsers: number
  completionRate: number
  averageCompletionTime: number
  popularPaths: Array<{path: string, count: number, percentage: number}>
  stepConversionRates: Record<string, {entered: number, completed: number, rate: number}>
  answerDistribution: Record<string, Record<string, number>>
  consultationRequestRate: number
  abandonnmentPoints: Record<string, number>
  userDemographics: {
    totalUsers: number
    returningUsers: number
    newUsers: number
    averageSessionTime: number
  }
  timeAnalysis: {
    hourlyDistribution: Record<string, number>
    dailyDistribution: Record<string, number>
    weeklyTrends: Array<{date: string, responses: number, completions: number}>
  }
}

// メモリ上のアンケートデータストレージ
let surveyData = {
  responses: [] as SurveyResponse[],
  journeys: new Map<string, UserJourney>(),
  sessions: new Map<string, {userId: string, startTime: number, currentStep: string}>(),
  lastCleanup: Date.now()
}

// ユーザージャーニー開始
export function startUserJourney(userId: string, userName: string, sessionId: string): void {
  const journey: UserJourney = {
    userId,
    userName,
    sessionId,
    startTime: Date.now(),
    totalSteps: 0,
    completedSteps: 0,
    responses: [],
    conversionStatus: 'abandoned',
    completionRate: 0
  }
  
  surveyData.journeys.set(sessionId, journey)
  surveyData.sessions.set(sessionId, {
    userId,
    startTime: Date.now(),
    currentStep: 'welcome'
  })
  
  console.log(`🎯 Journey started for user: ${userName} (${userId})`)
}

// アンケート回答記録
export function recordSurveyResponse(response: Omit<SurveyResponse, 'timestamp'>): void {
  const fullResponse: SurveyResponse = {
    ...response,
    timestamp: Date.now()
  }
  
  surveyData.responses.push(fullResponse)
  
  // ユーザージャーニー更新
  const journey = surveyData.journeys.get(response.sessionId)
  if (journey) {
    journey.responses.push(fullResponse)
    journey.completedSteps++
    journey.totalSteps = Math.max(journey.totalSteps, journey.completedSteps)
    journey.completionRate = (journey.completedSteps / getExpectedStepCount()) * 100
    
    // 最終結果の判定
    if (response.step.startsWith('result_')) {
      journey.finalResult = response.step
      journey.conversionStatus = 'completed'
      journey.endTime = Date.now()
    } else if (response.step.startsWith('consultation_yes')) {
      journey.conversionStatus = 'consultation_requested'
      journey.endTime = Date.now()
    }
    
    surveyData.journeys.set(response.sessionId, journey)
  }
  
  // セッション情報更新
  const session = surveyData.sessions.get(response.sessionId)
  if (session) {
    session.currentStep = response.nextStep
    surveyData.sessions.set(response.sessionId, session)
  }
  
  console.log(`📊 Response recorded: ${response.userName} -> ${response.step}: ${response.answer}`)
}

// ユーザージャーニー完了
export function completeUserJourney(sessionId: string, finalStep: string): void {
  const journey = surveyData.journeys.get(sessionId)
  if (journey) {
    journey.endTime = Date.now()
    journey.finalResult = finalStep
    
    if (finalStep.includes('consultation_yes')) {
      journey.conversionStatus = 'consultation_requested'
    } else if (finalStep.includes('result_')) {
      journey.conversionStatus = 'completed'
    }
    
    const completionTime = journey.endTime - journey.startTime
    journey.responses.forEach(response => {
      if (!response.completionTime) {
        response.completionTime = completionTime
      }
    })
    
    surveyData.journeys.set(sessionId, journey)
    console.log(`✅ Journey completed: ${journey.userName} -> ${finalStep}`)
  }
}

// 期待される総ステップ数（フロー分析用）
function getExpectedStepCount(): number {
  return 8 // welcome -> area -> business_status -> ... -> result
}

// 包括的なアナリティクスデータ生成
export function generateAnalytics(): AnalyticsData {
  const now = Date.now()
  const responses = surveyData.responses
  const journeys = Array.from(surveyData.journeys.values())
  
  // 基本統計
  const totalResponses = responses.length
  const totalUsers = new Set(responses.map(r => r.userId)).size
  const completedJourneys = journeys.filter(j => j.conversionStatus !== 'abandoned')
  const completionRate = totalUsers > 0 ? (completedJourneys.length / totalUsers) * 100 : 0
  
  // 平均完了時間
  const completionTimes = completedJourneys
    .filter(j => j.endTime)
    .map(j => j.endTime! - j.startTime)
  const averageCompletionTime = completionTimes.length > 0 
    ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
    : 0
  
  // 人気のパス分析
  const pathCounts = new Map<string, number>()
  journeys.forEach(journey => {
    const path = journey.responses.map(r => r.step).join(' -> ')
    if (path) {
      pathCounts.set(path, (pathCounts.get(path) || 0) + 1)
    }
  })
  
  const popularPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({
      path,
      count,
      percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0
    }))
  
  // ステップ別コンバージョン率
  const stepConversionRates: Record<string, {entered: number, completed: number, rate: number}> = {}
  const stepCounts = new Map<string, {entered: number, completed: number}>()
  
  responses.forEach(response => {
    const step = response.step
    if (!stepCounts.has(step)) {
      stepCounts.set(step, {entered: 0, completed: 0})
    }
    stepCounts.get(step)!.entered++
    if (response.nextStep && response.nextStep !== step) {
      stepCounts.get(step)!.completed++
    }
  })
  
  stepCounts.forEach((counts, step) => {
    stepConversionRates[step] = {
      entered: counts.entered,
      completed: counts.completed,
      rate: counts.entered > 0 ? (counts.completed / counts.entered) * 100 : 0
    }
  })
  
  // 回答分布分析
  const answerDistribution: Record<string, Record<string, number>> = {}
  responses.forEach(response => {
    if (!answerDistribution[response.step]) {
      answerDistribution[response.step] = {}
    }
    const answer = response.answerValue || response.answer
    answerDistribution[response.step][answer] = (answerDistribution[response.step][answer] || 0) + 1
  })
  
  // 相談申込率
  const consultationRequests = journeys.filter(j => j.conversionStatus === 'consultation_requested').length
  const consultationRequestRate = totalUsers > 0 ? (consultationRequests / totalUsers) * 100 : 0
  
  // 離脱ポイント分析
  const abandonnmentPoints: Record<string, number> = {}
  journeys.filter(j => j.conversionStatus === 'abandoned').forEach(journey => {
    const lastStep = journey.responses[journey.responses.length - 1]?.step || 'welcome'
    abandonnmentPoints[lastStep] = (abandonnmentPoints[lastStep] || 0) + 1
  })
  
  // 時間分析
  const hourlyDistribution: Record<string, number> = {}
  const dailyDistribution: Record<string, number> = {}
  
  responses.forEach(response => {
    const date = new Date(response.timestamp)
    const hour = date.getHours().toString().padStart(2, '0')
    const day = date.toISOString().split('T')[0]
    
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
    dailyDistribution[day] = (dailyDistribution[day] || 0) + 1
  })
  
  // 週次トレンド（過去7日）
  const weeklyTrends = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dayResponses = responses.filter(r => {
      const responseDate = new Date(r.timestamp).toISOString().split('T')[0]
      return responseDate === date
    }).length
    const dayCompletions = journeys.filter(j => {
      if (!j.endTime) return false
      const completionDate = new Date(j.endTime).toISOString().split('T')[0]
      return completionDate === date
    }).length
    
    weeklyTrends.push({
      date,
      responses: dayResponses,
      completions: dayCompletions
    })
  }
  
  return {
    totalResponses,
    totalUsers,
    completionRate,
    averageCompletionTime,
    popularPaths,
    stepConversionRates,
    answerDistribution,
    consultationRequestRate,
    abandonnmentPoints,
    userDemographics: {
      totalUsers,
      returningUsers: 0, // TODO: 実装
      newUsers: totalUsers,
      averageSessionTime: averageCompletionTime
    },
    timeAnalysis: {
      hourlyDistribution,
      dailyDistribution,
      weeklyTrends
    }
  }
}

// 個別ユーザーの詳細ジャーニー取得
export function getUserJourney(userId: string): UserJourney | null {
  const journey = Array.from(surveyData.journeys.values()).find(j => j.userId === userId)
  return journey || null
}

// 全ジャーニーリスト取得
export function getAllJourneys(): UserJourney[] {
  return Array.from(surveyData.journeys.values())
    .sort((a, b) => b.startTime - a.startTime) // 新しい順
}

// データクリーンアップ（古いデータを削除）
export function cleanupOldData(): void {
  const now = Date.now()
  const maxAge = 30 * 24 * 60 * 60 * 1000 // 30日
  
  // 古いレスポンスを削除
  surveyData.responses = surveyData.responses.filter(r => 
    now - r.timestamp < maxAge
  )
  
  // 古いジャーニーを削除
  surveyData.journeys.forEach((journey, sessionId) => {
    if (now - journey.startTime > maxAge) {
      surveyData.journeys.delete(sessionId)
    }
  })
  
  // 古いセッションを削除
  surveyData.sessions.forEach((session, sessionId) => {
    if (now - session.startTime > 24 * 60 * 60 * 1000) { // 24時間
      surveyData.sessions.delete(sessionId)
    }
  })
  
  surveyData.lastCleanup = now
  console.log('🧹 Analytics data cleanup completed')
}

// 定期クリーンアップ設定
setInterval(() => {
  cleanupOldData()
}, 60 * 60 * 1000) // 1時間ごと

// エクスポート用のデータ取得
export function exportAnalyticsData(): {
  responses: SurveyResponse[]
  journeys: UserJourney[]
  analytics: AnalyticsData
} {
  return {
    responses: surveyData.responses,
    journeys: getAllJourneys(),
    analytics: generateAnalytics()
  }
}

// 開発用：データリセット
export function resetAnalyticsData(): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false
  }
  
  surveyData = {
    responses: [],
    journeys: new Map(),
    sessions: new Map(),
    lastCleanup: Date.now()
  }
  
  console.log('🔄 Analytics data reset')
  return true
}