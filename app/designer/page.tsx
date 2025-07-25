'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SurveyStats {
  totalResponses: number
  step1Stats: { [key: string]: number }
  step2Stats: { [key: string]: number }
  step3Stats: { [key: string]: number }
}

export default function DesignerPage() {
  const [stats, setStats] = useState<SurveyStats>({
    totalResponses: 0,
    step1Stats: {},
    step2Stats: {},
    step3Stats: {}
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 統計データの取得（模擬データ）
    setTimeout(() => {
      setStats({
        totalResponses: 127,
        step1Stats: {
          'employee': 45,
          'executive': 23,
          'student': 31,
          'freelancer': 28
        },
        step2Stats: {
          'income': 38,
          'skills': 42,
          'career': 25,
          'balance': 15,
          'self_actualization': 7
        },
        step3Stats: {
          'action_first': 52,
          'plan_first': 35,
          'consult_first': 25,
          'research_first': 15
        }
      })
      setIsLoading(false)
    }, 1000)
  }, [])

  const StatCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
    </motion.div>
  )

  const StepChart = ({ title, data, colors }: { title: string, data: { [key: string]: number }, colors: string[] }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0)
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value], index) => {
            const percentage = total > 0 ? (value / total) * 100 : 0
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-gray-700 font-medium">{key}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{value}件</span>
                  <span className="text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚀 LINE Bot Designer</h1>
          <p className="text-lg text-gray-600">ステップ形式アンケート管理ダッシュボード</p>
        </motion.div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="総回答数" value={stats.totalResponses} color="#3B82F6" />
          <StatCard title="ステップ1完了" value={Object.values(stats.step1Stats).reduce((a, b) => a + b, 0)} color="#10B981" />
          <StatCard title="ステップ2完了" value={Object.values(stats.step2Stats).reduce((a, b) => a + b, 0)} color="#F59E0B" />
          <StatCard title="ステップ3完了" value={Object.values(stats.step3Stats).reduce((a, b) => a + b, 0)} color="#EF4444" />
        </div>

        {/* チャート */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StepChart 
            title="📋 ステップ1: 基本情報"
            data={stats.step1Stats}
            colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
          />
          <StepChart 
            title="🎯 ステップ2: 目標設定"
            data={stats.step2Stats}
            colors={['#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899']}
          />
          <StepChart 
            title="⚡ ステップ3: 行動スタイル"
            data={stats.step3Stats}
            colors={['#6366F1', '#14B8A6', '#F59E0B', '#EF4444']}
          />
        </div>

        {/* システム情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">システム情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-gray-600"><span className="font-semibold">バージョン:</span> v3.0.0</p>
              <p className="text-gray-600"><span className="font-semibold">アンケート形式:</span> ステップ1-3形式</p>
              <p className="text-gray-600"><span className="font-semibold">応答時間:</span> 0.2ms</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600"><span className="font-semibold">稼働率:</span> 99.9%</p>
              <p className="text-gray-600"><span className="font-semibold">環境:</span> Production</p>
              <p className="text-gray-600"><span className="font-semibold">最終更新:</span> {new Date().toLocaleString('ja-JP')}</p>
            </div>
          </div>
        </motion.div>

        {/* アンケートフロー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">アンケートフロー</h3>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">1</div>
              <p className="text-sm font-semibold text-gray-700">基本情報</p>
              <p className="text-xs text-gray-500">職業・立場</p>
            </div>
            <div className="hidden md:block text-gray-400">→</div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">2</div>
              <p className="text-sm font-semibold text-gray-700">目標設定</p>
              <p className="text-xs text-gray-500">重視する分野</p>
            </div>
            <div className="hidden md:block text-gray-400">→</div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">3</div>
              <p className="text-sm font-semibold text-gray-700">行動スタイル</p>
              <p className="text-xs text-gray-500">取り組み方</p>
            </div>
            <div className="hidden md:block text-gray-400">→</div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">📊</div>
              <p className="text-sm font-semibold text-gray-700">分析結果</p>
              <p className="text-xs text-gray-500">詳細レポート</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}