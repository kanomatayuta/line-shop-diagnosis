'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  MessageSquare,
  Navigation,
  Zap,
  Award,
  AlertTriangle,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
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

interface UserJourney {
  userId: string
  userName: string
  sessionId: string
  startTime: number
  endTime?: number
  totalSteps: number
  completedSteps: number
  responses: Array<{
    step: string
    question: string
    answer: string
    timestamp: number
  }>
  finalResult?: string
  conversionStatus: 'completed' | 'abandoned' | 'consultation_requested'
  completionRate: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [journeys, setJourneys] = useState<UserJourney[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<'overview' | 'journeys' | 'funnel' | 'trends'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'abandoned' | 'consultation_requested'>('all')

  useEffect(() => {
    fetchAnalytics()
    fetchJourneys()
    
    // 30秒ごとに更新
    const interval = setInterval(() => {
      fetchAnalytics()
      fetchJourneys()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics?type=summary')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAnalytics(result.data)
          setLastUpdate(new Date())
        }
      }
    } catch (error) {
      console.error('📊 Failed to fetch analytics:', error)
    }
  }

  const fetchJourneys = async () => {
    try {
      const response = await fetch('/api/analytics?type=journeys')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setJourneys(result.data)
        }
      }
    } catch (error) {
      console.error('🚶 Failed to fetch journeys:', error)
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    await Promise.all([fetchAnalytics(), fetchJourneys()])
    setIsLoading(false)
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/analytics?type=export')
      if (response.ok) {
        const result = await response.json()
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
        
        const exportFileDefaultName = `survey-analytics-${new Date().toISOString().split('T')[0]}.json`
        
        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
      }
    } catch (error) {
      console.error('📥 Export failed:', error)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}分${seconds}秒`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-ios-green" />
      case 'consultation_requested': return <Award className="w-4 h-4 text-ios-blue" />
      case 'abandoned': return <XCircle className="w-4 h-4 text-ios-red" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了'
      case 'consultation_requested': return '相談申込'
      case 'abandoned': return '離脱'
      default: return '進行中'
    }
  }

  const filteredJourneys = journeys.filter(journey => {
    const matchesSearch = journey.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         journey.userId.includes(searchTerm)
    const matchesFilter = filterStatus === 'all' || journey.conversionStatus === filterStatus
    return matchesSearch && matchesFilter
  })

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ios-gray-50 to-ios-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-ios-blue mx-auto mb-4 animate-spin" />
          <p className="text-ios-body text-gray-600">アナリティクスデータを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ios-gray-50 to-ios-gray-100 dark:from-black dark:to-ios-gray-950">
      {/* Navigation */}
      <nav className="nav-ios border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <motion.button 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-ios-md transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </Link>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-ios-blue" />
                <div>
                  <h1 className="text-ios-title-3 font-bold text-gray-900 dark:text-white">
                    📊 高度なアナリティクス
                  </h1>
                  <p className="text-ios-caption-1 text-gray-600 dark:text-gray-400">
                    アンケート回答結果の詳細分析
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-ios-green">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  データ収集中
                </div>
                <div className="text-ios-caption-2 text-gray-500">
                  最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
                </div>
              </div>
              <motion.button
                onClick={refreshData}
                disabled={isLoading}
                className="btn-ios bg-ios-blue/10 text-ios-blue hover:bg-ios-blue/20 p-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                onClick={exportData}
                className="btn-ios bg-ios-green/10 text-ios-green hover:bg-ios-green/20 p-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* View Selection */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'overview', label: '概要', icon: BarChart3 },
              { key: 'journeys', label: 'ユーザージャーニー', icon: Navigation },
              { key: 'funnel', label: 'コンバージョンファネル', icon: Target },
              { key: 'trends', label: 'トレンド分析', icon: TrendingUp }
            ].map((view) => (
              <motion.button
                key={view.key}
                onClick={() => setSelectedView(view.key as any)}
                className={`btn-ios px-4 py-2 flex items-center gap-2 ${
                  selectedView === view.key 
                    ? 'bg-ios-blue text-white' 
                    : 'bg-white/50 text-gray-700 hover:bg-white/70'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <view.icon className="w-4 h-4" />
                {view.label}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Overview */}
        {selectedView === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card-ios p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-8 h-8 text-ios-blue" />
                  <div>
                    <div className="text-ios-title-1 font-bold text-ios-blue">
                      {analytics.totalUsers.toLocaleString()}
                    </div>
                    <div className="text-ios-caption-1 text-gray-500">総ユーザー数</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-ios-green" />
                  <span className="text-ios-caption-2 text-ios-green">+{analytics.totalResponses}回答</span>
                </div>
              </div>

              <div className="card-ios p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-8 h-8 text-ios-green" />
                  <div>
                    <div className="text-ios-title-1 font-bold text-ios-green">
                      {analytics.completionRate.toFixed(1)}%
                    </div>
                    <div className="text-ios-caption-1 text-gray-500">完了率</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-ios-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analytics.completionRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="card-ios p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-8 h-8 text-ios-orange" />
                  <div>
                    <div className="text-ios-title-1 font-bold text-ios-orange">
                      {formatDuration(analytics.averageCompletionTime)}
                    </div>
                    <div className="text-ios-caption-1 text-gray-500">平均完了時間</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-ios-green" />
                  <span className="text-ios-caption-2 text-ios-green">効率的</span>
                </div>
              </div>

              <div className="card-ios p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 text-ios-purple" />
                  <div>
                    <div className="text-ios-title-1 font-bold text-ios-purple">
                      {analytics.consultationRequestRate.toFixed(1)}%
                    </div>
                    <div className="text-ios-caption-1 text-gray-500">相談申込率</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-ios-purple h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analytics.consultationRequestRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Answer Distribution */}
            <div className="card-ios p-8 mb-8">
              <h3 className="text-ios-title-2 font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <PieChart className="w-7 h-7 text-ios-blue" />
                回答分布分析
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(analytics.answerDistribution).slice(0, 4).map(([step, answers]) => (
                  <div key={step} className="bg-gray-50 dark:bg-gray-800 rounded-ios-lg p-6">
                    <h4 className="text-ios-headline font-semibold mb-4 capitalize">
                      {step.replace('_', ' ')}
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(answers).map(([answer, count]) => {
                        const total = Object.values(answers).reduce((a, b) => a + b, 0)
                        const percentage = total > 0 ? (count / total) * 100 : 0
                        return (
                          <div key={answer} className="flex items-center justify-between">
                            <span className="text-ios-subhead text-gray-700 dark:text-gray-300">
                              {answer}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-ios-blue h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-ios-caption-1 font-semibold w-12 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* User Journeys */}
        {selectedView === 'journeys' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Filters */}
            <div className="card-ios p-6 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="ユーザー名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-ios-md focus:ring-2 focus:ring-ios-blue focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-ios-md focus:ring-2 focus:ring-ios-blue focus:border-transparent"
                  >
                    <option value="all">すべて</option>
                    <option value="completed">完了</option>
                    <option value="consultation_requested">相談申込</option>
                    <option value="abandoned">離脱</option>
                  </select>
                </div>
                <div className="text-ios-caption-1 text-gray-500">
                  {filteredJourneys.length}件中を表示
                </div>
              </div>
            </div>

            {/* Journeys List */}
            <div className="space-y-4">
              {filteredJourneys.slice(0, 20).map((journey) => (
                <motion.div
                  key={journey.sessionId}
                  className="card-ios p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(journey.conversionStatus)}
                      <div>
                        <h4 className="text-ios-headline font-semibold">
                          {journey.userName}
                        </h4>
                        <p className="text-ios-caption-1 text-gray-500">
                          {formatDate(journey.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-ios-subhead font-semibold">
                        {getStatusText(journey.conversionStatus)}
                      </div>
                      <div className="text-ios-caption-1 text-gray-500">
                        完了率: {journey.completionRate.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-ios-caption-1 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {journey.responses.length}回答
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {journey.endTime 
                        ? formatDuration(journey.endTime - journey.startTime)
                        : '進行中'
                      }
                    </div>
                    {journey.finalResult && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {journey.finalResult}
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          journey.conversionStatus === 'completed' ? 'bg-ios-green' :
                          journey.conversionStatus === 'consultation_requested' ? 'bg-ios-blue' :
                          'bg-ios-orange'
                        }`}
                        style={{ width: `${journey.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Coming Soon for other views */}
        {(selectedView === 'funnel' || selectedView === 'trends') && (
          <motion.div
            className="card-ios p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Zap className="w-16 h-16 text-ios-blue mx-auto mb-4" />
            <h3 className="text-ios-title-2 font-bold text-gray-900 dark:text-white mb-2">
              {selectedView === 'funnel' ? '🎯 コンバージョンファネル分析' : '📈 トレンド分析'}
            </h3>
            <p className="text-ios-body text-gray-600 dark:text-gray-400 mb-6">
              高度な分析機能を準備中です。より詳細なインサイトを提供予定です。
            </p>
            <div className="flex items-center justify-center gap-4 text-ios-caption-1 text-gray-500">
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                リアルタイム分析
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                時系列分析
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                予測分析
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}