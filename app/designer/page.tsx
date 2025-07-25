'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SurveyStats {
  totalResponses: number
  step1Stats: { [key: string]: number }
  step2Stats: { [key: string]: number }
  step3Stats: { [key: string]: number }
}

interface SurveyStep {
  title: string
  message: string
  buttons: Array<{
    label: string
    action: string
    value?: string
    next?: string
  }>
}

interface SurveyConfig {
  [key: string]: SurveyStep
}

export default function DesignerPage() {
  const [stats, setStats] = useState<SurveyStats>({
    totalResponses: 0,
    step1Stats: {},
    step2Stats: {},
    step3Stats: {}
  })
  const [surveyConfig, setSurveyConfig] = useState<SurveyConfig>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>('dashboard')
  const [selectedStep, setSelectedStep] = useState<string>('welcome')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // 統計データと設定の取得
    const loadData = async () => {
      try {
        // アンケート設定を取得
        const configResponse = await fetch('/api/survey-config')
        const configData = await configResponse.json()
        if (configData.success) {
          setSurveyConfig(configData.config)
        }

        // 統計データの取得（模擬データ）
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
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // 設定を保存
  const saveSurveyConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/survey-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: surveyConfig }),
      })

      const data = await response.json()
      if (data.success) {
        alert('設定が保存されました！')
      } else {
        alert('保存に失敗しました: ' + data.error)
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // ステップ編集
  const updateStep = (stepKey: string, field: keyof SurveyStep, value: any) => {
    setSurveyConfig(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [field]: value
      }
    }))
  }

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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚀 フローチャート</h1>
          <p className="text-lg text-gray-600">店舗売却診断フロー管理システム</p>
          
          {/* タブナビゲーション */}
          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📊 ダッシュボード
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              ✏️ フローエディター
            </button>
          </div>
        </motion.div>

        {/* コンテンツエリア */}
        {activeTab === 'dashboard' ? (
          <>
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
              <p className="text-gray-600"><span className="font-semibold">診断形式:</span> 店舗売却診断</p>
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
          <h3 className="text-xl font-bold text-gray-800 mb-4">診断フロー</h3>
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
          </>
        ) : (
          /* フローエディター */
          <div className="space-y-6">
            {/* 保存ボタン */}
            <div className="flex justify-end">
              <button
                onClick={saveSurveyConfig}
                disabled={isSaving}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '💾 設定を保存'}
              </button>
            </div>

            {/* ステップ選択 */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">編集するステップを選択</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.keys(surveyConfig).map((stepKey) => (
                  <button
                    key={stepKey}
                    onClick={() => setSelectedStep(stepKey)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedStep === stepKey
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {stepKey}
                  </button>
                ))}
              </div>
            </div>

            {/* ステップエディター */}
            {surveyConfig[selectedStep] && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  ✏️ {selectedStep} を編集
                </h3>
                
                <div className="space-y-6">
                  {/* タイトル編集 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={surveyConfig[selectedStep]?.title || ''}
                      onChange={(e) => updateStep(selectedStep, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* メッセージ編集 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージ
                    </label>
                    <textarea
                      value={surveyConfig[selectedStep]?.message || ''}
                      onChange={(e) => updateStep(selectedStep, 'message', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* ボタン編集 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ボタン設定
                    </label>
                    <div className="space-y-3">
                      {surveyConfig[selectedStep]?.buttons?.map((button, index) => (
                        <div key={index} className="flex space-x-3 items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={button.label}
                            onChange={(e) => {
                              const newButtons = [...(surveyConfig[selectedStep]?.buttons || [])]
                              newButtons[index] = { ...newButtons[index], label: e.target.value }
                              updateStep(selectedStep, 'buttons', newButtons)
                            }}
                            placeholder="ボタンラベル"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={button.value || ''}
                            onChange={(e) => {
                              const newButtons = [...(surveyConfig[selectedStep]?.buttons || [])]
                              newButtons[index] = { ...newButtons[index], value: e.target.value }
                              updateStep(selectedStep, 'buttons', newButtons)
                            }}
                            placeholder="値"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={button.next || ''}
                            onChange={(e) => {
                              const newButtons = [...(surveyConfig[selectedStep]?.buttons || [])]
                              newButtons[index] = { ...newButtons[index], next: e.target.value }
                              updateStep(selectedStep, 'buttons', newButtons)
                            }}
                            placeholder="次のステップ"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* フローチャート可視化 */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 フロー図</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                {Object.entries(surveyConfig).map(([stepKey, step], index) => (
                  <motion.div
                    key={stepKey}
                    className={`p-4 rounded-lg border-2 max-w-xs ${
                      selectedStep === stepKey ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedStep(stepKey)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h4 className="font-bold text-sm mb-2">{step.title}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{step.message}</p>
                    <div className="text-xs text-blue-600">
                      {step.buttons?.length || 0} ボタン
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}