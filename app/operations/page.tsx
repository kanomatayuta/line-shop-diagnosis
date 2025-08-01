'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Target,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Zap,
  Bot,
  Bell,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  Workflow
} from 'lucide-react'
import Link from 'next/link'

interface OperationInsight {
  id: string
  type: 'optimization' | 'alert' | 'suggestion' | 'trend' | 'success'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  actionItems: string[]
  expectedImprovement: string
  difficulty: 'easy' | 'medium' | 'hard'
  timestamp: number
  implemented?: boolean
}

interface AutomatedSuggestion {
  id: string
  category: 'message' | 'flow' | 'timing' | 'targeting'
  suggestion: string
  reasoning: string
  expectedImpact: string
  confidence: number
  data: any
}

interface PerformanceMetric {
  metric: string
  current: number
  target: number
  trend: 'up' | 'down' | 'stable'
  improvement: string
  priority: 'high' | 'medium' | 'low'
}

export default function OperationsPage() {
  const [insights, setInsights] = useState<OperationInsight[]>([
    {
      id: '1',
      type: 'optimization',
      priority: 'high',
      title: '質問順序の最適化',
      description: '「経営状況」の質問を最初に移すことで、早期離脱を15%削減できます',
      impact: 'コンバージョン率 +3.2% 期待',
      actionItems: [
        'フロー順序を変更：area → business_status → area',
        'A/Bテストで効果を検証',
        'ユーザーフィードバックを収集'
      ],
      expectedImprovement: '月間相談申込 +12件',
      difficulty: 'easy',
      timestamp: Date.now() - 3600000,
      implemented: false
    },
    {
      id: '2',
      type: 'alert',
      priority: 'medium',
      title: '平日午後の離脱率上昇',
      description: '平日14-16時の離脱率が通常の1.8倍に上昇しています',
      impact: '潜在的売上機会損失：約8万円/月',
      actionItems: [
        'この時間帯のメッセージ内容を見直し',
        'より簡潔な質問文に変更',
        'プッシュ通知タイミングを調整'
      ],
      expectedImprovement: '離脱率 -7% 改善',
      difficulty: 'medium',
      timestamp: Date.now() - 7200000,
      implemented: false
    },
    {
      id: '3',
      type: 'success',
      priority: 'low',
      title: '営業利益質問の効果確認',
      description: '営業利益の質問順序変更により、回答率が12%向上しました',
      impact: '実装済み改善の成功事例',
      actionItems: [
        'この成功パターンを他の質問にも適用',
        'ベストプラクティスとして文書化',
        'チーム内で知識共有'
      ],
      expectedImprovement: '継続的改善の基盤構築',
      difficulty: 'easy',
      timestamp: Date.now() - 10800000,
      implemented: true
    }
  ])

  const [suggestions, setSuggestions] = useState<AutomatedSuggestion[]>([
    {
      id: '1',
      category: 'message',
      suggestion: 'ウェルカムメッセージに個人化要素を追加',
      reasoning: '時間帯に応じた挨拶（おはようございます/こんにちは）で親近感を向上',
      expectedImpact: 'エンゲージメント +8%',
      confidence: 87,
      data: { timeBasedGreeting: true, personalizedContent: true }
    },
    {
      id: '2',
      category: 'flow',
      suggestion: '高額査定ユーザーに専用フローを追加',
      reasoning: '2000万円以上の査定ユーザーには、より詳細な情報収集を行い、コンバージョン率を向上',
      expectedImpact: 'プレミアム相談率 +25%',
      confidence: 93,
      data: { premiumFlow: true, detailedAssessment: true }
    },
    {
      id: '3',
      category: 'timing',
      suggestion: '回答時間に基づく動的メッセージ調整',
      reasoning: '回答に15秒以上かかっている場合、「お時間をかけていただきありがとうございます」メッセージを表示',
      expectedImpact: '離脱率 -12%',
      confidence: 78,
      data: { dynamicMessaging: true, timeThreshold: 15000 }
    }
  ])

  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      metric: 'コンバージョン率',
      current: 23.5,
      target: 28.0,
      trend: 'up',
      improvement: '+1.2% (先週比)',
      priority: 'high'
    },
    {
      metric: '平均完了時間',
      current: 3.2,
      target: 2.8,
      trend: 'down',
      improvement: '-0.3分 (目標達成)',
      priority: 'medium'
    },
    {
      metric: '離脱率',
      current: 18.7,
      target: 15.0,
      trend: 'down',
      improvement: '-2.1% (改善中)',
      priority: 'high'
    },
    {
      metric: 'ユーザー満足度',
      current: 4.3,
      target: 4.5,
      trend: 'up',
      improvement: '+0.1点 (先月比)',
      priority: 'medium'
    },
    {
      metric: '相談申込率',
      current: 31.2,
      target: 35.0,
      trend: 'stable',
      improvement: '±0% (横ばい)',
      priority: 'high'
    }
  ])

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [isLoading, setIsLoading] = useState(false)

  const filteredInsights = insights.filter(insight => 
    selectedFilter === 'all' || insight.priority === selectedFilter
  )

  const implementSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    // ここで実際の実装ロジックを追加
    console.log(`Implementing suggestion: ${suggestionId}`)
  }

  const markAsImplemented = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, implemented: true }
        : insight
    ))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-ios-red bg-ios-red/10 border-ios-red/20'
      case 'high': return 'text-ios-orange bg-ios-orange/10 border-ios-orange/20'
      case 'medium': return 'text-ios-blue bg-ios-blue/10 border-ios-blue/20'
      case 'low': return 'text-ios-green bg-ios-green/10 border-ios-green/20'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <CheckCircle className="w-4 h-4 text-ios-green" />
      case 'medium': return <Clock className="w-4 h-4 text-ios-orange" />
      case 'hard': return <AlertCircle className="w-4 h-4 text-ios-red" />
      default: return <Settings className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-ios-green" />
      case 'down': return <TrendingUp className="w-4 h-4 text-ios-red rotate-180" />
      case 'stable': return <div className="w-4 h-1 bg-gray-400 rounded"></div>
      default: return null
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
                <Workflow className="w-8 h-8 text-ios-purple" />
                <div>
                  <h1 className="text-ios-title-3 font-bold text-gray-900 dark:text-white">
                    🎯 LINE運用最適化
                  </h1>
                  <p className="text-ios-caption-1 text-gray-600 dark:text-gray-400">
                    AIによる自動最適化提案システム
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-ios-md focus:ring-2 focus:ring-ios-blue focus:border-transparent text-sm"
                >
                  <option value="all">すべて</option>
                  <option value="high">高優先度</option>
                  <option value="medium">中優先度</option>
                  <option value="low">低優先度</option>
                </select>
              </div>
              <Link href="/realtime">
                <motion.button 
                  className="btn-ios bg-ios-red/10 text-ios-red hover:bg-ios-red/20 px-4 py-2 text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    リアルタイム監視
                  </div>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Performance Metrics Overview */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="card-ios p-8">
            <h2 className="text-ios-title-2 font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-ios-blue" />
              パフォーマンス ダッシュボード
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.metric}
                  className="bg-white/50 dark:bg-gray-800/50 rounded-ios-lg p-6 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-ios-caption-1 text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">
                      {metric.metric}
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="text-ios-title-1 font-bold text-gray-900 dark:text-white mb-1">
                    {metric.current}
                    {metric.metric.includes('率') && '%'}
                    {metric.metric.includes('時間') && '分'}
                    {metric.metric.includes('満足度') && '/5'}
                  </div>
                  <div className="text-ios-caption-2 text-gray-500 mb-2">
                    目標: {metric.target}
                    {metric.metric.includes('率') && '%'}
                    {metric.metric.includes('時間') && '分'}
                    {metric.metric.includes('満足度') && '/5'}
                  </div>
                  <div className="text-ios-caption-2 text-ios-green font-medium">
                    {metric.improvement}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        metric.current >= metric.target ? 'bg-ios-green' : 'bg-ios-blue'
                      }`}
                      style={{ width: `${Math.min((metric.current / metric.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Automated Suggestions */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="card-ios p-8">
            <h2 className="text-ios-title-2 font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Bot className="w-7 h-7 text-ios-green" />
              AI自動最適化提案
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-ios-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-ios-orange" />
                      <span className="text-ios-caption-1 font-semibold uppercase tracking-wide text-gray-600">
                        {suggestion.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-ios-orange" />
                      <span className="text-ios-caption-2 font-semibold">
                        信頼度 {suggestion.confidence}%
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-ios-headline font-semibold mb-3 text-gray-900 dark:text-white">
                    {suggestion.suggestion}
                  </h3>
                  
                  <p className="text-ios-subhead text-gray-700 dark:text-gray-300 mb-3">
                    {suggestion.reasoning}
                  </p>
                  
                  <div className="bg-ios-blue/10 rounded-ios-md p-3 mb-4">
                    <div className="text-ios-caption-1 font-semibold text-ios-blue mb-1">
                      期待される効果
                    </div>
                    <div className="text-ios-subhead text-ios-blue">
                      {suggestion.expectedImpact}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => implementSuggestion(suggestion.id)}
                      className="btn-ios bg-ios-green text-white hover:bg-ios-green/90 flex-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        実装
                      </div>
                    </motion.button>
                    <motion.button
                      className="btn-ios bg-gray-100 text-gray-700 hover:bg-gray-200 px-4"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Operation Insights */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="card-ios p-8">
            <h2 className="text-ios-title-2 font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Target className="w-7 h-7 text-ios-purple" />
              運用インサイト & 最適化提案
            </h2>
            <div className="space-y-6">
              {filteredInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  className={`rounded-ios-lg p-6 border ${getPriorityColor(insight.priority)} ${
                    insight.implemented ? 'opacity-60' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-ios-headline font-semibold">
                          {insight.title}
                        </h3>
                        {insight.implemented && (
                          <span className="px-2 py-1 bg-ios-green/20 text-ios-green text-xs rounded-full font-semibold">
                            実装済み
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs rounded-full font-semibold uppercase">
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-ios-subhead text-gray-700 dark:text-gray-300 mb-3">
                        {insight.description}
                      </p>
                      <div className="text-ios-body font-medium text-ios-blue mb-4">
                        📈 {insight.impact}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getDifficultyIcon(insight.difficulty)}
                      <span className="text-ios-caption-2 text-gray-500 capitalize">
                        {insight.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 rounded-ios-md p-4 mb-4">
                    <h4 className="text-ios-subhead font-semibold mb-2">実行項目:</h4>
                    <ul className="space-y-1">
                      {insight.actionItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-ios-subhead text-gray-700 dark:text-gray-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-ios-blue rounded-full mt-2 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-ios-caption-1 text-gray-600">
                      <span className="font-semibold">期待改善: </span>
                      {insight.expectedImprovement}
                    </div>
                    {!insight.implemented && (
                      <motion.button
                        onClick={() => markAsImplemented(insight.id)}
                        className="btn-ios bg-ios-purple text-white hover:bg-ios-purple/90 px-4 py-2 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          実装完了
                        </div>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  )
}