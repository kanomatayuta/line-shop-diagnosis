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

// iOS Design System Colors
const iosColors = {
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemOrange: '#FF9500',
  systemRed: '#FF3B30',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',
  systemYellow: '#FFCC00',
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  tertiaryBackground: '#FFFFFF',
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
      className="bg-white rounded-2xl p-6 shadow-sm"
      style={{ 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(0, 0, 0, 0.04)'
      }}
    >
      <h3 className="text-sm font-medium mb-1" style={{ color: iosColors.systemGray }}>{title}</h3>
      <p className="text-4xl font-semibold" style={{ color }}>{value}</p>
    </motion.div>
  )

  const StepChart = ({ title, data, colors }: { title: string, data: { [key: string]: number }, colors: string[] }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0)
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
        style={{ 
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.04)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
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
                  <span className="font-medium" style={{ color: '#000000' }}>{key}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span style={{ color: iosColors.systemGray }}>{value}件</span>
                  <span className="text-sm" style={{ color: iosColors.systemGray2 }}>({percentage.toFixed(1)}%)</span>
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: iosColors.background }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full"
          style={{ 
            border: `3px solid ${iosColors.systemGray5}`,
            borderTopColor: iosColors.systemBlue
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: iosColors.background }}>
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#000000' }}>フローチャート</h1>
          <p className="text-lg" style={{ color: iosColors.systemGray }}>店舗売却診断フロー管理システム</p>
          
          {/* タブナビゲーション */}
          <div className="flex justify-center mt-6">
            <div className="bg-white rounded-lg p-1 shadow-sm" style={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.04)'
            }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'text-white'
                    : 'text-gray-600'
                }`}
                style={{
                  backgroundColor: activeTab === 'dashboard' ? iosColors.systemBlue : 'transparent',
                  color: activeTab === 'dashboard' ? 'white' : iosColors.systemGray
                }}
              >
                ダッシュボード
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'editor'
                    ? 'text-white'
                    : 'text-gray-600'
                }`}
                style={{
                  backgroundColor: activeTab === 'editor' ? iosColors.systemBlue : 'transparent',
                  color: activeTab === 'editor' ? 'white' : iosColors.systemGray
                }}
              >
                フローエディター
              </button>
            </div>
          </div>
        </motion.div>

        {/* コンテンツエリア */}
        {activeTab === 'dashboard' ? (
          <>
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title="総回答数" value={stats.totalResponses} color={iosColors.systemBlue} />
              <StatCard title="ステップ1完了" value={Object.values(stats.step1Stats).reduce((a, b) => a + b, 0)} color={iosColors.systemGreen} />
              <StatCard title="ステップ2完了" value={Object.values(stats.step2Stats).reduce((a, b) => a + b, 0)} color={iosColors.systemOrange} />
              <StatCard title="ステップ3完了" value={Object.values(stats.step3Stats).reduce((a, b) => a + b, 0)} color={iosColors.systemRed} />
            </div>

        {/* チャート */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StepChart 
            title="ステップ1: 基本情報"
            data={stats.step1Stats}
            colors={[iosColors.systemBlue, iosColors.systemGreen, iosColors.systemOrange, iosColors.systemRed]}
          />
          <StepChart 
            title="ステップ2: 目標設定"
            data={stats.step2Stats}
            colors={[iosColors.systemPurple, iosColors.systemPink, iosColors.systemYellow, iosColors.systemOrange, iosColors.systemRed]}
          />
          <StepChart 
            title="ステップ3: 行動スタイル"
            data={stats.step3Stats}
            colors={[iosColors.systemBlue, iosColors.systemGreen, iosColors.systemOrange, iosColors.systemRed]}
          />
        </div>

        {/* システム情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-2xl p-6 shadow-sm"
          style={{ 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.04)'
          }}
        >
          <h3 className="text-lg font-semibold mb-4">システム情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p style={{ color: iosColors.systemGray }}><span className="font-medium">バージョン:</span> v3.0.0</p>
              <p style={{ color: iosColors.systemGray }}><span className="font-medium">診断形式:</span> 店舗売却診断</p>
              <p style={{ color: iosColors.systemGray }}><span className="font-medium">応答時間:</span> 0.2ms</p>
            </div>
            <div className="space-y-2">
              <p style={{ color: iosColors.systemGray }}><span className="font-medium">稼働率:</span> 99.9%</p>
              <p style={{ color: iosColors.systemGray }}><span className="font-medium">環境:</span> Production</p>
              <p style={{ color: iosColors.systemGray }}><span className="font-medium">最終更新:</span> {new Date().toLocaleString('ja-JP')}</p>
            </div>
          </div>
        </motion.div>

        {/* アンケートフロー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-2xl p-6 shadow-sm"
          style={{ 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.04)'
          }}
        >
          <h3 className="text-lg font-semibold mb-4">診断フロー</h3>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2" style={{ backgroundColor: iosColors.systemBlue }}>1</div>
              <p className="text-sm font-medium">基本情報</p>
              <p className="text-xs" style={{ color: iosColors.systemGray2 }}>職業・立場</p>
            </div>
            <div className="hidden md:block" style={{ color: iosColors.systemGray3 }}>→</div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2" style={{ backgroundColor: iosColors.systemGreen }}>2</div>
              <p className="text-sm font-medium">目標設定</p>
              <p className="text-xs" style={{ color: iosColors.systemGray2 }}>重視する分野</p>
            </div>
            <div className="hidden md:block" style={{ color: iosColors.systemGray3 }}>→</div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2" style={{ backgroundColor: iosColors.systemPurple }}>3</div>
              <p className="text-sm font-medium">行動スタイル</p>
              <p className="text-xs" style={{ color: iosColors.systemGray2 }}>取り組み方</p>
            </div>
            <div className="hidden md:block" style={{ color: iosColors.systemGray3 }}>→</div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2" style={{ backgroundColor: iosColors.systemOrange }}>📊</div>
              <p className="text-sm font-medium">分析結果</p>
              <p className="text-xs" style={{ color: iosColors.systemGray2 }}>詳細レポート</p>
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
                className="text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-all"
                style={{ 
                  backgroundColor: iosColors.systemBlue,
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                {isSaving ? '保存中...' : '設定を保存'}
              </button>
            </div>

            {/* ステップ選択 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.04)'
            }}>
              <h3 className="text-lg font-semibold mb-4">編集するステップを選択</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.keys(surveyConfig).map((stepKey) => (
                  <button
                    key={stepKey}
                    onClick={() => setSelectedStep(stepKey)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedStep === stepKey
                        ? 'text-white'
                        : ''
                    }`}
                    style={{
                      backgroundColor: selectedStep === stepKey ? iosColors.systemBlue : iosColors.systemGray6,
                      color: selectedStep === stepKey ? 'white' : iosColors.systemGray,
                      borderColor: selectedStep === stepKey ? iosColors.systemBlue : iosColors.systemGray5
                    }}
                  >
                    {stepKey}
                  </button>
                ))}
              </div>
            </div>

            {/* ステップエディター */}
            {surveyConfig[selectedStep] && (
              <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.04)'
              }}>
                <h3 className="text-lg font-semibold mb-6">
                  {selectedStep} を編集
                </h3>
                
                <div className="space-y-6">
                  {/* タイトル編集 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: iosColors.systemGray }}>
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={surveyConfig[selectedStep]?.title || ''}
                      onChange={(e) => updateStep(selectedStep, 'title', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: iosColors.systemGray6,
                        border: `1px solid ${iosColors.systemGray5}`,
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* メッセージ編集 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: iosColors.systemGray }}>
                      メッセージ
                    </label>
                    <textarea
                      value={surveyConfig[selectedStep]?.message || ''}
                      onChange={(e) => updateStep(selectedStep, 'message', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: iosColors.systemGray6,
                        border: `1px solid ${iosColors.systemGray5}`,
                        outline: 'none',
                        resize: 'none'
                      }}
                    />
                  </div>

                  {/* ボタン編集 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: iosColors.systemGray }}>
                      ボタン設定
                    </label>
                    <div className="space-y-3">
                      {surveyConfig[selectedStep]?.buttons?.map((button, index) => (
                        <div key={index} className="flex space-x-3 items-center p-3 rounded-lg" style={{ backgroundColor: iosColors.systemGray6 }}>
                          <input
                            type="text"
                            value={button.label}
                            onChange={(e) => {
                              const newButtons = [...(surveyConfig[selectedStep]?.buttons || [])]
                              newButtons[index] = { ...newButtons[index], label: e.target.value }
                              updateStep(selectedStep, 'buttons', newButtons)
                            }}
                            placeholder="ボタンラベル"
                            className="flex-1 px-3 py-2 rounded-md text-sm"
                            style={{
                              backgroundColor: 'white',
                              border: `1px solid ${iosColors.systemGray5}`,
                              outline: 'none'
                            }}
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
                            className="w-24 px-3 py-2 rounded-md text-sm"
                            style={{
                              backgroundColor: 'white',
                              border: `1px solid ${iosColors.systemGray5}`,
                              outline: 'none'
                            }}
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
                            className="w-32 px-3 py-2 rounded-md text-sm"
                            style={{
                              backgroundColor: 'white',
                              border: `1px solid ${iosColors.systemGray5}`,
                              outline: 'none'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* フローチャート可視化 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.04)'
            }}>
              <h3 className="text-lg font-semibold mb-4">フロー図</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                {Object.entries(surveyConfig).map(([stepKey, step], index) => (
                  <motion.div
                    key={stepKey}
                    className={`p-4 rounded-lg border max-w-xs`}
                    style={{
                      backgroundColor: selectedStep === stepKey ? iosColors.systemGray6 : 'white',
                      borderColor: selectedStep === stepKey ? iosColors.systemBlue : iosColors.systemGray5,
                      borderWidth: selectedStep === stepKey ? '2px' : '1px'
                    }}
                    onClick={() => setSelectedStep(stepKey)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h4 className="font-semibold text-sm mb-2">{step.title}</h4>
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: iosColors.systemGray }}>{step.message}</p>
                    <div className="text-xs" style={{ color: iosColors.systemBlue }}>
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