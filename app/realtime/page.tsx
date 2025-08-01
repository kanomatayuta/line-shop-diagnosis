'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Activity,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bell,
  BellRing,
  Eye,
  Target,
  MessageSquare,
  RefreshCw,
  Pause,
  Play,
  Settings,
  Filter,
  Download,
  Wifi,
  WifiOff
} from 'lucide-react'
import Link from 'next/link'

interface RealTimeResponse {
  id: string
  userId: string
  userName: string
  timestamp: number
  step: string
  question: string
  answer: string
  responseTime: number
  isNewUser: boolean
}

interface LiveInsight {
  id: string
  type: 'conversion' | 'abandonment' | 'optimization' | 'alert' | 'trend'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: number
  actionable: boolean
  suggestedAction?: string
}

interface RealTimeMetrics {
  activeUsers: number
  responsesPerMinute: number
  currentConversionRate: number
  averageResponseTime: number
  topExitPoints: Array<{step: string, count: number, percentage: number}>
  popularAnswers: Array<{question: string, answer: string, count: number}>
}

interface OperationalAlert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: number
  resolved: boolean
}

export default function RealTimePage() {
  const [responses, setResponses] = useState<RealTimeResponse[]>([])
  const [insights, setInsights] = useState<LiveInsight[]>([])
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [alerts, setAlerts] = useState<OperationalAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [newResponseCount, setNewResponseCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // 通知音の初期化
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUYrTp66hVFApGn+DyvmwhBCiY4vDDJSIsAIVcwAAHE')
    
    if (!isPaused) {
      connectToRealTimeStream()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [isPaused])

  const connectToRealTimeStream = () => {
    // 初期データ取得
    fetchInitialData()
    
    // Server-Sent Events接続
    eventSourceRef.current = new EventSource('/api/realtime?stream=true')
    
    eventSourceRef.current.onopen = () => {
      setIsConnected(true)
      console.log('🔴 Real-time connection established')
    }
    
    eventSourceRef.current.onerror = () => {
      setIsConnected(false)
      console.error('❌ Real-time connection error')
      
      // 再接続を試行
      setTimeout(() => {
        if (!isPaused && eventSourceRef.current?.readyState === EventSource.CLOSED) {
          connectToRealTimeStream()
        }
      }, 5000)
    }
    
    eventSourceRef.current.addEventListener('newResponse', (event) => {
      const newResponse: RealTimeResponse = JSON.parse(event.data)
      setResponses(prev => [newResponse, ...prev.slice(0, 49)])
      setNewResponseCount(prev => prev + 1)
      playNotificationSound()
      setLastUpdate(new Date())
    })
    
    eventSourceRef.current.addEventListener('newInsight', (event) => {
      const newInsight: LiveInsight = JSON.parse(event.data)
      setInsights(prev => [newInsight, ...prev.slice(0, 19)])
      if (newInsight.severity === 'high' || newInsight.severity === 'critical') {
        playNotificationSound()
      }
    })
    
    eventSourceRef.current.addEventListener('operationalAlert', (event) => {
      const newAlert: OperationalAlert = JSON.parse(event.data)
      setAlerts(prev => [newAlert, ...prev])
      playNotificationSound()
    })
  }

  const fetchInitialData = async () => {
    try {
      const response = await fetch('/api/realtime?type=data')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setResponses(result.data.responses || [])
          setInsights(result.data.insights || [])
          setMetrics(result.data.metrics || {})
          setAlerts(result.data.alerts || [])
          setLastUpdate(new Date())
        }
      }
    } catch (error) {
      console.error('📊 Failed to fetch initial data:', error)
    }
  }

  const playNotificationSound = () => {
    if (audioRef.current && !isPaused) {
      audioRef.current.play().catch(() => {
        // ブラウザの自動再生ポリシーでブロックされた場合は無視
      })
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      connectToRealTimeStream()
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      setIsConnected(false)
    }
  }

  const resolveAlert = async (alertId: string, actionTaken?: string) => {
    try {
      const response = await fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, actionTaken })
      })
      
      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      }
    } catch (error) {
      console.error('❌ Failed to resolve alert:', error)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-ios-red bg-ios-red/10 border-ios-red/20'
      case 'high': return 'text-ios-orange bg-ios-orange/10 border-ios-orange/20'
      case 'medium': return 'text-ios-blue bg-ios-blue/10 border-ios-blue/20'
      case 'low': return 'text-ios-green bg-ios-green/10 border-ios-green/20'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-ios-red bg-ios-red/10 border-ios-red/20'
      case 'warning': return 'text-ios-orange bg-ios-orange/10 border-ios-orange/20'
      case 'info': return 'text-ios-blue bg-ios-blue/10 border-ios-blue/20'
      case 'success': return 'text-ios-green bg-ios-green/10 border-ios-green/20'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
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
                <Activity className="w-8 h-8 text-ios-red" />
                <div>
                  <h1 className="text-ios-title-3 font-bold text-gray-900 dark:text-white">
                    🔴 リアルタイム監視
                  </h1>
                  <p className="text-ios-caption-1 text-gray-600 dark:text-gray-400">
                    ライブアンケート分析システム
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                {isConnected ? (
                  <div className="flex items-center gap-2 text-ios-green">
                    <Wifi className="w-4 h-4" />
                    <span>接続中</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-ios-red">
                    <WifiOff className="w-4 h-4" />
                    <span>切断</span>
                  </div>
                )}
                <div className="text-ios-caption-2 text-gray-500">
                  最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
                </div>
              </div>
              <motion.button
                onClick={togglePause}
                className={`btn-ios p-2 ${isPaused ? 'bg-ios-green/10 text-ios-green' : 'bg-ios-red/10 text-ios-red'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Real-time Metrics */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-ios p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-8 h-8 text-ios-blue" />
                <div>
                  <div className="text-ios-title-1 font-bold text-ios-blue">
                    {metrics?.activeUsers || 0}
                  </div>
                  <div className="text-ios-caption-1 text-gray-500">アクティブユーザー</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-ios-blue animate-pulse" />
                <span className="text-ios-caption-2 text-ios-blue">ライブ</span>
              </div>
            </div>

            <div className="card-ios p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-8 h-8 text-ios-green" />
                <div>
                  <div className="text-ios-title-1 font-bold text-ios-green">
                    {metrics?.responsesPerMinute || 0}
                  </div>
                  <div className="text-ios-caption-1 text-gray-500">回答/分</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-ios-green" />
                <span className="text-ios-caption-2 text-ios-green">+{newResponseCount} 新規</span>
              </div>
            </div>

            <div className="card-ios p-6">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-8 h-8 text-ios-purple" />
                <div>
                  <div className="text-ios-title-1 font-bold text-ios-purple">
                    {metrics?.currentConversionRate?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="text-ios-caption-1 text-gray-500">コンバージョン率</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-ios-purple h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics?.currentConversionRate || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="card-ios p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-8 h-8 text-ios-orange" />
                <div>
                  <div className="text-ios-title-1 font-bold text-ios-orange">
                    {metrics?.averageResponseTime ? `${(metrics.averageResponseTime / 1000).toFixed(1)}s` : '0.0s'}
                  </div>
                  <div className="text-ios-caption-1 text-gray-500">平均回答時間</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-ios-orange" />
                <span className="text-ios-caption-2 text-ios-orange">リアルタイム</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Live Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Live Responses */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="card-ios p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-ios-title-3 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-ios-blue" />
                  ライブ回答ストリーム
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-ios-red rounded-full animate-pulse"></div>
                  <span className="text-ios-caption-2 text-gray-500">LIVE</span>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {responses.slice(0, 10).map((response) => (
                    <motion.div
                      key={response.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-ios-md p-4"
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {response.isNewUser && (
                            <span className="px-2 py-1 bg-ios-green/10 text-ios-green text-xs rounded-full">
                              NEW
                            </span>
                          )}
                          <span className="font-semibold text-ios-headline">
                            {response.userName}
                          </span>
                        </div>
                        <span className="text-ios-caption-2 text-gray-500">
                          {formatTime(response.timestamp)}
                        </span>
                      </div>
                      <div className="text-ios-subhead text-gray-700 dark:text-gray-300 mb-1">
                        {response.question}
                      </div>
                      <div className="text-ios-body font-medium text-ios-blue">
                        → {response.answer}
                      </div>
                      <div className="text-ios-caption-2 text-gray-500 mt-2">
                        回答時間: {(response.responseTime / 1000).toFixed(1)}秒
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {responses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>回答を待機中...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Live Insights */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="card-ios p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-ios-title-3 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Eye className="w-6 h-6 text-ios-purple" />
                  ライブインサイト
                </h3>
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-ios-purple" />
                  <span className="text-ios-caption-2 text-gray-500">{insights.length}件</span>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {insights.slice(0, 10).map((insight) => (
                    <motion.div
                      key={insight.id}
                      className={`rounded-ios-md p-4 border ${getSeverityColor(insight.severity)}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-ios-headline">
                          {insight.title}
                        </h4>
                        <span className="text-ios-caption-2 text-gray-500">
                          {formatTime(insight.timestamp)}
                        </span>
                      </div>
                      <p className="text-ios-subhead mb-2">{insight.message}</p>
                      {insight.actionable && insight.suggestedAction && (
                        <div className="text-ios-caption-1 bg-white/50 rounded p-2 mt-2">
                          💡 {insight.suggestedAction}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {insights.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>インサイトを分析中...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Operational Alerts */}
        {alerts.length > 0 && (
          <motion.section 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="card-ios p-6">
              <h3 className="text-ios-title-3 font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-ios-orange" />
                運用アラート
              </h3>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <motion.div
                    key={alert.id}
                    className={`rounded-ios-md p-4 border ${getAlertColor(alert.severity)}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-ios-headline mb-1">
                          {alert.message}
                        </p>
                        <p className="text-ios-caption-2 text-gray-500">
                          {formatTime(alert.timestamp)}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => resolveAlert(alert.id, '確認済み')}
                        className="btn-ios bg-white/50 text-gray-700 hover:bg-white/70 px-3 py-1 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        解決
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  )
}