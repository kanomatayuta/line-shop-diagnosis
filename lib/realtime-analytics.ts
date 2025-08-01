// 🎯 最高峰リアルタイムアナリティクス - LINEアンケート運用最適化システム
import { EventEmitter } from 'events'

export interface RealTimeResponse {
  id: string
  userId: string
  userName: string
  timestamp: number
  step: string
  question: string
  answer: string
  answerValue: string
  nextStep: string
  sessionId: string
  responseTime: number
  isNewUser: boolean
  previousStep?: string
  userAgent?: string
  location?: string
}

export interface LiveInsight {
  id: string
  type: 'conversion' | 'abandonment' | 'optimization' | 'alert' | 'trend'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  data: any
  timestamp: number
  actionable: boolean
  suggestedAction?: string
}

export interface RealTimeMetrics {
  activeUsers: number
  responsesPerMinute: number
  currentConversionRate: number
  averageResponseTime: number
  topExitPoints: Array<{step: string, count: number, percentage: number}>
  popularAnswers: Array<{question: string, answer: string, count: number}>
  regionDistribution: Record<string, number>
  deviceTypes: Record<string, number>
  timeOnStep: Record<string, number>
  consultationTrends: {
    hourly: number[]
    currentHour: number
    prediction: number
  }
}

export interface UserBehaviorPattern {
  pattern: string
  frequency: number
  conversionRate: number
  averageTime: number
  description: string
  optimization: string
}

export interface OperationalAlert {
  id: string
  type: 'high_abandonment' | 'conversion_drop' | 'slow_response' | 'technical_issue' | 'opportunity'
  severity: 'info' | 'warning' | 'error' | 'success'
  message: string
  data: any
  timestamp: number
  resolved: boolean
  actionTaken?: string
}

// リアルタイムイベントエミッター
export const realtimeEmitter = new EventEmitter()

// リアルタイムデータストレージ
let realtimeData = {
  activeResponses: new Map<string, RealTimeResponse>(),
  liveInsights: [] as LiveInsight[],
  currentMetrics: {} as RealTimeMetrics,
  behaviorPatterns: [] as UserBehaviorPattern[],
  operationalAlerts: [] as OperationalAlert[],
  responseStream: [] as RealTimeResponse[],
  lastUpdate: Date.now()
}

// リアルタイム回答処理
export function processRealTimeResponse(response: Omit<RealTimeResponse, 'id' | 'responseTime' | 'isNewUser'>): void {
  const now = Date.now()
  const responseTime = now - response.timestamp
  
  // 新規ユーザーかチェック
  const existingResponses = Array.from(realtimeData.activeResponses.values())
  const isNewUser = !existingResponses.some(r => r.userId === response.userId)
  
  const fullResponse: RealTimeResponse = {
    ...response,
    id: `${response.userId}-${response.timestamp}`,
    responseTime,
    isNewUser
  }
  
  // データ保存
  realtimeData.activeResponses.set(fullResponse.id, fullResponse)
  realtimeData.responseStream.unshift(fullResponse)
  
  // ストリーム制限（最新1000件）
  if (realtimeData.responseStream.length > 1000) {
    realtimeData.responseStream = realtimeData.responseStream.slice(0, 1000)
  }
  
  // リアルタイムメトリクス更新
  updateRealTimeMetrics()
  
  // インサイト生成
  generateLiveInsights(fullResponse)
  
  // アラート生成
  checkOperationalAlerts(fullResponse)
  
  // イベント発火
  realtimeEmitter.emit('newResponse', fullResponse)
  realtimeEmitter.emit('metricsUpdate', realtimeData.currentMetrics)
  
  console.log(`📊 Real-time response processed: ${response.userName} -> ${response.step}`)
}

// リアルタイムメトリクス計算
function updateRealTimeMetrics(): void {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  const oneHourAgo = now - 3600000
  
  const recentResponses = realtimeData.responseStream.filter(r => r.timestamp > oneMinuteAgo)
  const hourlyResponses = realtimeData.responseStream.filter(r => r.timestamp > oneHourAgo)
  
  // アクティブユーザー数（過去10分）
  const tenMinutesAgo = now - 600000
  const activeUserIds = new Set(
    realtimeData.responseStream
      .filter(r => r.timestamp > tenMinutesAgo)
      .map(r => r.userId)
  )
  
  // レスポンス/分
  const responsesPerMinute = recentResponses.length
  
  // 現在のコンバージョン率
  const completedResponses = hourlyResponses.filter(r => 
    r.nextStep.startsWith('consultation_yes') || r.nextStep.startsWith('result_')
  )
  const currentConversionRate = hourlyResponses.length > 0 
    ? (completedResponses.length / hourlyResponses.length) * 100 
    : 0
  
  // 平均回答時間
  const avgResponseTime = hourlyResponses.length > 0
    ? hourlyResponses.reduce((sum, r) => sum + r.responseTime, 0) / hourlyResponses.length
    : 0
  
  // 離脱ポイント分析
  const stepCounts = new Map<string, number>()
  const exitCounts = new Map<string, number>()
  
  hourlyResponses.forEach(response => {
    stepCounts.set(response.step, (stepCounts.get(response.step) || 0) + 1)
    
    // 次のステップがない場合は離脱とみなす
    const nextStepExists = hourlyResponses.some(r => 
      r.userId === response.userId && r.timestamp > response.timestamp
    )
    if (!nextStepExists && !response.nextStep.startsWith('result_') && !response.nextStep.startsWith('consultation_')) {
      exitCounts.set(response.step, (exitCounts.get(response.step) || 0) + 1)
    }
  })
  
  const topExitPoints = Array.from(exitCounts.entries())
    .map(([step, count]) => ({
      step,
      count,
      percentage: stepCounts.get(step) ? (count / stepCounts.get(step)!) * 100 : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
  
  // 人気の回答
  const answerCounts = new Map<string, number>()
  hourlyResponses.forEach(response => {
    const key = `${response.question}:${response.answer}`
    answerCounts.set(key, (answerCounts.get(key) || 0) + 1)
  })
  
  const popularAnswers = Array.from(answerCounts.entries())
    .map(([key, count]) => {
      const [question, answer] = key.split(':')
      return { question, answer, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // 相談申込トレンド
  const consultationResponses = hourlyResponses.filter(r => 
    r.nextStep.startsWith('consultation_yes')
  )
  
  const consultationTrends = {
    hourly: Array(24).fill(0),
    currentHour: consultationResponses.length,
    prediction: Math.round(consultationResponses.length * 1.2) // 簡易予測
  }
  
  realtimeData.currentMetrics = {
    activeUsers: activeUserIds.size,
    responsesPerMinute,
    currentConversionRate,
    averageResponseTime: avgResponseTime,
    topExitPoints,
    popularAnswers,
    regionDistribution: {}, // TODO: 地域データ
    deviceTypes: {}, // TODO: デバイスデータ
    timeOnStep: {}, // TODO: ステップ滞在時間
    consultationTrends
  }
  
  realtimeData.lastUpdate = now
}

// ライブインサイト生成
function generateLiveInsights(response: RealTimeResponse): void {
  const insights: LiveInsight[] = []
  
  // コンバージョンインサイト
  if (response.nextStep.startsWith('consultation_yes')) {
    insights.push({
      id: `conversion-${response.id}`,
      type: 'conversion',
      severity: 'high',
      title: '🎯 新規相談申込',
      message: `${response.userName}さんが相談を申し込みました！`,
      data: { userId: response.userId, step: response.step },
      timestamp: Date.now(),
      actionable: true,
      suggestedAction: 'すぐにフォローアップの準備をしましょう'
    })
  }
  
  // 離脱インサイト
  if (response.responseTime > 30000) { // 30秒以上
    insights.push({
      id: `slow-${response.id}`,
      type: 'optimization',
      severity: 'medium',
      title: '⚠️ 回答時間が長い',
      message: `${response.step}での回答に${Math.round(response.responseTime/1000)}秒かかりました`,
      data: { step: response.step, time: response.responseTime },
      timestamp: Date.now(),
      actionable: true,
      suggestedAction: 'このステップの質問文を簡潔にすることを検討してください'
    })
  }
  
  // 新規ユーザーインサイト
  if (response.isNewUser) {
    insights.push({
      id: `newuser-${response.id}`,
      type: 'trend',
      severity: 'low',
      title: '👋 新規ユーザー',
      message: `新しいユーザー${response.userName}さんがアンケートを開始しました`,
      data: { userId: response.userId, isFirstTime: true },
      timestamp: Date.now(),
      actionable: false
    })
  }
  
  // インサイトを保存
  realtimeData.liveInsights.unshift(...insights)
  
  // インサイト制限（最新100件）
  if (realtimeData.liveInsights.length > 100) {
    realtimeData.liveInsights = realtimeData.liveInsights.slice(0, 100)
  }
  
  // イベント発火
  insights.forEach(insight => {
    realtimeEmitter.emit('newInsight', insight)
  })
}

// 運用アラート監視
function checkOperationalAlerts(response: RealTimeResponse): void {
  const now = Date.now()
  const recentResponses = realtimeData.responseStream.filter(r => r.timestamp > now - 300000) // 5分間
  
  // 高い離脱率アラート
  const stepResponses = recentResponses.filter(r => r.step === response.step)
  const nextStepResponses = recentResponses.filter(r => r.previousStep === response.step)
  
  if (stepResponses.length >= 5 && nextStepResponses.length / stepResponses.length < 0.5) {
    const alert: OperationalAlert = {
      id: `abandonment-${response.step}-${now}`,
      type: 'high_abandonment',
      severity: 'warning',
      message: `${response.step}ステップで離脱率が50%を超えています`,
      data: { 
        step: response.step, 
        rate: (1 - nextStepResponses.length / stepResponses.length) * 100 
      },
      timestamp: now,
      resolved: false
    }
    
    realtimeData.operationalAlerts.unshift(alert)
    realtimeEmitter.emit('operationalAlert', alert)
  }
  
  // コンバージョン機会アラート
  if (response.step === 'result_2000' && !response.nextStep.startsWith('consultation_yes')) {
    const alert: OperationalAlert = {
      id: `opportunity-${response.id}`,
      type: 'opportunity',
      severity: 'info',
      message: `高額査定ユーザーが相談申込せずに終了しました`,
      data: { userId: response.userId, result: response.step },
      timestamp: now,
      resolved: false
    }
    
    realtimeData.operationalAlerts.unshift(alert)
    realtimeEmitter.emit('operationalAlert', alert)
  }
}

// 行動パターン分析
export function analyzeBehaviorPatterns(): UserBehaviorPattern[] {
  const responses = realtimeData.responseStream.slice(0, 500) // 最新500件
  const patterns = new Map<string, {responses: RealTimeResponse[], conversions: number}>()
  
  // パターン集計
  responses.forEach(response => {
    const pattern = `${response.step}->${response.nextStep}`
    if (!patterns.has(pattern)) {
      patterns.set(pattern, {responses: [], conversions: 0})
    }
    patterns.get(pattern)!.responses.push(response)
    
    if (response.nextStep.startsWith('consultation_yes')) {
      patterns.get(pattern)!.conversions++
    }
  })
  
  // 分析結果生成
  return Array.from(patterns.entries())
    .filter(([_, data]) => data.responses.length >= 3) // 最低3回以上のパターン
    .map(([pattern, data]) => ({
      pattern,
      frequency: data.responses.length,
      conversionRate: (data.conversions / data.responses.length) * 100,
      averageTime: data.responses.reduce((sum, r) => sum + r.responseTime, 0) / data.responses.length,
      description: getPatternDescription(pattern),
      optimization: getOptimizationSuggestion(pattern, data.conversions / data.responses.length)
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20)
}

function getPatternDescription(pattern: string): string {
  const [from, to] = pattern.split('->')
  return `${from}から${to}への遷移`
}

function getOptimizationSuggestion(pattern: string, conversionRate: number): string {
  if (conversionRate > 0.8) {
    return 'このパターンは高いコンバージョン率を示しています。類似パターンを増やすことを検討してください。'
  } else if (conversionRate < 0.2) {
    return 'このパターンは低いコンバージョン率です。フローの改善や質問文の見直しを検討してください。'
  }
  return 'このパターンは標準的な結果です。継続的な監視をお勧めします。'
}

// リアルタイムデータ取得
export function getRealTimeData() {
  return {
    responses: realtimeData.responseStream.slice(0, 50), // 最新50件
    insights: realtimeData.liveInsights.slice(0, 20), // 最新20件
    metrics: realtimeData.currentMetrics,
    alerts: realtimeData.operationalAlerts.filter(a => !a.resolved).slice(0, 10),
    behaviorPatterns: analyzeBehaviorPatterns().slice(0, 10),
    lastUpdate: realtimeData.lastUpdate
  }
}

// ライブストリーム用データ
export function getStreamingData() {
  return {
    activeUsers: realtimeData.currentMetrics.activeUsers || 0,
    responsesPerMinute: realtimeData.currentMetrics.responsesPerMinute || 0,
    conversionRate: realtimeData.currentMetrics.currentConversionRate || 0,
    latestResponse: realtimeData.responseStream[0] || null,
    criticalAlerts: realtimeData.operationalAlerts.filter(a => !a.resolved && a.severity === 'error').length,
    timestamp: Date.now()
  }
}

// アラート解決
export function resolveAlert(alertId: string, actionTaken?: string): boolean {
  const alert = realtimeData.operationalAlerts.find(a => a.id === alertId)
  if (alert) {
    alert.resolved = true
    alert.actionTaken = actionTaken
    realtimeEmitter.emit('alertResolved', alert)
    return true
  }
  return false
}

// データクリーンアップ（古いデータ削除）
setInterval(() => {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24時間
  
  // 古いレスポンスを削除
  realtimeData.responseStream = realtimeData.responseStream.filter(r => 
    now - r.timestamp < maxAge
  )
  
  // 古いインサイトを削除
  realtimeData.liveInsights = realtimeData.liveInsights.filter(i => 
    now - i.timestamp < maxAge
  )
  
  // 古いアラートを削除（解決済みのもの）
  realtimeData.operationalAlerts = realtimeData.operationalAlerts.filter(a => 
    !a.resolved || (now - a.timestamp < maxAge)
  )
  
  console.log('🧹 Real-time data cleanup completed')
}, 60 * 60 * 1000) // 1時間ごと

export default realtimeEmitter