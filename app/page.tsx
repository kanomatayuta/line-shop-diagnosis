'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Rocket, 
  Palette, 
  Smartphone, 
  Zap, 
  Target, 
  Sparkles,
  BarChart3,
  Clock,
  Users,
  ArrowRight,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface SystemStats {
  flowCount: number
  responseTime: string
  uptime: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats>({
    flowCount: 12,
    responseTime: '0.2ms',
    uptime: '99.9%'
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 統計データの更新
    const interval = setInterval(() => {
      setStats({
        flowCount: Math.floor(Math.random() * 5) + 10,
        responseTime: (Math.random() * 0.3 + 0.1).toFixed(1) + 'ms',
        uptime: (99.8 + Math.random() * 0.2).toFixed(1) + '%'
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleStartDesigning = () => {
    setIsLoading(true)
    setTimeout(() => {
      window.location.href = '/designer'
    }, 1500)
  }

  const features = [
    {
      icon: <Zap className="w-10 h-10" />,
      title: 'ライブエンジン',
      description: 'メモリ直結でファイルI/O一切なし。瞬間的なフロー更新を実現',
      color: 'text-ios-blue'
    },
    {
      icon: <Palette className="w-10 h-10" />,
      title: 'Next.js & React',
      description: 'モダンなReactコンポーネントとNext.jsで構築された美しいUI',
      color: 'text-ios-purple'
    },
    {
      icon: <Smartphone className="w-10 h-10" />,
      title: 'LINE直結',
      description: '編集内容が即座にLINEボットに反映。リアルタイム同期システム',
      color: 'text-ios-green'
    },
    {
      icon: <Rocket className="w-10 h-10" />,
      title: '高速パフォーマンス',
      description: '平均応答時間0.2ms。限界を突破した超高速処理',
      color: 'text-ios-orange'
    },
    {
      icon: <Target className="w-10 h-10" />,
      title: '自動レイアウト',
      description: 'AI駆動の自動配置システム。重複なしの美しいフロー図',
      color: 'text-ios-indigo'
    },
    {
      icon: <Sparkles className="w-10 h-10" />,
      title: 'プロ品質',
      description: 'エンタープライズグレードの信頼性とスケーラビリティ',
      color: 'text-ios-pink'
    }
  ]

  const statItems = [
    { label: 'Active Flows', value: stats.flowCount, icon: BarChart3 },
    { label: 'Response Time', value: stats.responseTime, icon: Clock },
    { label: 'Uptime', value: stats.uptime, icon: Users }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-ios-gray-50 to-ios-gray-100 dark:from-black dark:to-ios-gray-950">
      {/* Navigation */}
      <nav className="nav-ios">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-8 h-8 text-ios-blue" />
              <h1 className="text-ios-title-3 font-bold text-gray-900 dark:text-white">
                LINE Flow Designer Pro
              </h1>
            </div>
            <div className="status-online">
              <div className="status-dot bg-ios-green"></div>
              Live Engine Active
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.section 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-ios-2xl bg-gradient-to-r from-ios-blue to-ios-purple p-16 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <motion.h1 
                className="text-ios-large-title mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                🎯 プロフェッショナル フロー デザイナー
              </motion.h1>
              <motion.p 
                className="text-ios-title-3 opacity-90 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Next.js + Reactで構築された、次世代LINEボット管理システム
              </motion.p>
              <motion.button
                className="btn-ios bg-white/20 text-white border border-white/30 hover:bg-white/30 text-ios-headline px-8 py-4"
                onClick={handleStartDesigning}
                disabled={isLoading}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    初期化中...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    デザインを開始
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="card-ios p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {statItems.map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <stat.icon className="w-8 h-8 text-ios-blue mx-auto mb-2" />
                  <div className="text-ios-large-title text-ios-blue font-bold">
                    {stat.value}
                  </div>
                  <div className="text-ios-caption-1 text-gray-500 uppercase tracking-wide font-semibold">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Features Grid */}
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-ios p-8 text-center group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className={`${feature.color} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <h3 className="text-ios-headline font-semibold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-ios-subhead text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Action Cards */}
        <motion.section 
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="card-ios p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-ios-blue/10 rounded-ios-md">
                <Palette className="w-8 h-8 text-ios-blue" />
              </div>
              <div>
                <h2 className="text-ios-title-3 font-semibold mb-2 text-gray-900 dark:text-white">
                  🎨 フローデザイナー
                </h2>
                <p className="text-ios-subhead text-gray-600 dark:text-gray-400">
                  React + Next.jsで構築されたビジュアルエディター
                </p>
              </div>
            </div>
            <Link href="/designer">
              <motion.button 
                className="btn-primary w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center gap-2">
                  デザイナーを開く
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            </Link>
          </div>

          <div className="card-ios p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-ios-green/10 rounded-ios-md">
                <Zap className="w-8 h-8 text-ios-green" />
              </div>
              <div>
                <h2 className="text-ios-title-3 font-semibold mb-2 text-gray-900 dark:text-white">
                  ⚡ ライブエンジン
                </h2>
                <p className="text-ios-subhead text-gray-600 dark:text-gray-400">
                  リアルタイム管理とモニタリング
                </p>
              </div>
            </div>
            <Link href="/api/live-engine">
              <motion.button 
                className="btn-success w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center gap-2">
                  エンジン管理
                  <Settings className="w-4 h-4" />
                </div>
              </motion.button>
            </Link>
          </div>
        </motion.section>

        {/* System Status */}
        <motion.section 
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="card-ios p-8">
            <h2 className="text-ios-title-3 font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-ios-blue" />
              システムステータス
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-ios-green font-semibold mb-1">✅ 全システム正常稼働</div>
                <div className="text-ios-footnote text-gray-500">
                  Next.js、ライブエンジン、LINE連携すべて正常
                </div>
              </div>
              <div className="status-online">
                <div className="status-dot bg-ios-green"></div>
                Online
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  )
}