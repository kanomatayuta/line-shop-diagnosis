'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

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
  const [surveyConfig, setSurveyConfig] = useState<SurveyConfig>({})
  const [selectedStep, setSelectedStep] = useState<string>('welcome')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{stepKey: string, field: string, buttonIndex?: number} | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveSurveyConfig()
      }, 3000) // Auto-save after 3 seconds of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [hasUnsavedChanges])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            if (hasUnsavedChanges) saveSurveyConfig()
            break
          case 'd':
            e.preventDefault()
            duplicateStep(selectedStep)
            break
          case 'n':
            e.preventDefault()
            createNewStep()
            break
        }
      }
      if (e.key === 'Escape') {
        setEditingField(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges, selectedStep])

  useEffect(() => {
    const loadData = async () => {
      try {
        const configResponse = await fetch('/api/survey-config')
        const configData = await configResponse.json()
        if (configData.success) {
          setSurveyConfig(configData.config)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const saveSurveyConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/survey-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: surveyConfig }),
      })

      const data = await response.json()
      if (data.success) {
        setHasUnsavedChanges(false)
        setLastSavedTime(new Date())
        
        // Subtle success notification
        const notification = document.createElement('div')
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded text-sm shadow-lg z-50 animate-pulse'
        notification.innerHTML = '✓ 自動保存完了'
        document.body.appendChild(notification)
        setTimeout(() => {
          notification.style.opacity = '0'
          setTimeout(() => notification.remove(), 300)
        }, 2000)
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateStep = (stepKey: string, field: keyof SurveyStep, value: any) => {
    setSurveyConfig(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [field]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  const duplicateStep = (stepKey: string) => {
    if (!surveyConfig[stepKey]) return
    
    const newStepId = `${stepKey}_copy_${Date.now()}`
    const originalStep = surveyConfig[stepKey]
    
    setSurveyConfig(prev => ({
      ...prev,
      [newStepId]: {
        ...originalStep,
        title: `${originalStep.title} (コピー)`
      }
    }))
    setSelectedStep(newStepId)
    setHasUnsavedChanges(true)
  }

  const createNewStep = () => {
    const newStepId = `step_${Date.now()}`
    setSurveyConfig(prev => ({
      ...prev,
      [newStepId]: {
        title: '新しいステップ',
        message: 'メッセージを入力してください',
        buttons: []
      }
    }))
    setSelectedStep(newStepId)
    setHasUnsavedChanges(true)
  }

  const deleteStep = (stepKey: string) => {
    if (stepKey === 'welcome') return // Don't delete welcome step
    
    if (confirm(`"${surveyConfig[stepKey]?.title}"を削除しますか？`)) {
      setSurveyConfig(prev => {
        const newConfig = { ...prev }
        delete newConfig[stepKey]
        
        // Remove references to deleted step
        Object.keys(newConfig).forEach(key => {
          if (newConfig[key].buttons) {
            newConfig[key].buttons = newConfig[key].buttons.map(button => 
              button.next === stepKey ? { ...button, next: '' } : button
            )
          }
        })
        
        return newConfig
      })
      
      // Select another step
      const stepKeys = Object.keys(surveyConfig).filter(key => key !== stepKey)
      if (stepKeys.length > 0) {
        setSelectedStep(stepKeys[0])
      }
      setHasUnsavedChanges(true)
    }
  }

  const getStepType = (stepKey: string) => {
    if (stepKey === 'welcome') return 'start'
    if (stepKey.startsWith('result_') || stepKey.startsWith('rejection_') || stepKey.startsWith('consultation_')) return 'end'
    return 'question'
  }

  const getStepColor = (stepKey: string) => {
    const type = getStepType(stepKey)
    if (type === 'start') return '#3b82f6'
    if (type === 'end') return stepKey.startsWith('result_') ? '#10b981' : '#ef4444'
    return '#8b5cf6'
  }

  const filteredSteps = Object.entries(surveyConfig).filter(([stepKey, step]) =>
    stepKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    step.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Inline editing component
  const InlineEdit = ({ 
    value, 
    onSave, 
    stepKey, 
    field, 
    buttonIndex, 
    multiline = false,
    placeholder = ''
  }: {
    value: string
    onSave: (value: string) => void
    stepKey: string
    field: string
    buttonIndex?: number
    multiline?: boolean
    placeholder?: string
  }) => {
    const [editValue, setEditValue] = useState(value)
    const [isEditing, setIsEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [isEditing])

    const handleSave = () => {
      onSave(editValue)
      setIsEditing(false)
      setEditingField(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') {
        setEditValue(value)
        setIsEditing(false)
        setEditingField(null)
      }
    }

    if (isEditing) {
      return multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded resize-none"
          rows={3}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
        />
      )
    }

    return (
      <div
        onClick={() => {
          setIsEditing(true)
          setEditingField({ stepKey, field, buttonIndex })
        }}
        className="cursor-text hover:bg-gray-50 px-2 py-1 rounded transition-colors"
        title="クリックして編集"
      >
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">フローエディター</h1>
            <p className="text-xs text-gray-500 mt-1">
              ショートカット: Ctrl+S(保存) | Ctrl+D(複製) | Ctrl+N(新規) | ESC(キャンセル)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                保存中...
              </div>
            )}
            {hasUnsavedChanges && !isSaving && (
              <span className="text-sm text-orange-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                未保存 (3秒後に自動保存)
              </span>
            )}
            {lastSavedTime && !hasUnsavedChanges && (
              <span className="text-sm text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                保存済み {lastSavedTime.toLocaleTimeString('ja-JP')}
              </span>
            )}
            <button
              onClick={saveSurveyConfig}
              disabled={isSaving || !hasUnsavedChanges}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              手動保存
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ステップを検索..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={createNewStep}
                className="flex-1 text-xs bg-green-100 text-green-700 px-2 py-2 rounded hover:bg-green-200 transition-colors"
              >
                + 新しいステップ
              </button>
              <button
                onClick={() => duplicateStep(selectedStep)}
                className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-2 rounded hover:bg-blue-200 transition-colors"
                disabled={!selectedStep}
              >
                📄 複製
              </button>
            </div>
            
            <h2 className="text-sm font-semibold text-gray-900 mb-3">ステップ一覧 ({filteredSteps.length})</h2>
            
            {/* Step List */}
            <div className="space-y-1">
              {filteredSteps
                .sort(([a], [b]) => {
                  const order = ['welcome', 'area', 'business_status', 'annual_profit', 'floor_level']
                  const aIndex = order.indexOf(a)
                  const bIndex = order.indexOf(b)
                  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
                  if (aIndex !== -1) return -1
                  if (bIndex !== -1) return 1
                  return a.localeCompare(b)
                })
                .map(([stepKey, step]) => {
                  const isSelected = selectedStep === stepKey
                  const stepColor = getStepColor(stepKey)
                  const type = getStepType(stepKey)
                  
                  return (
                    <div key={stepKey}>
                      <div
                        className={`group relative p-2 rounded border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedStep(stepKey)}
                        onMouseEnter={() => setHoveredPath(stepKey)}
                        onMouseLeave={() => setHoveredPath(null)}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: stepColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {step.title}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span>{type === 'start' ? '🚀' : type === 'end' ? '🎯' : '❓'}</span>
                              <span>{step.buttons?.length || 0}個の選択肢</span>
                            </div>
                          </div>
                          
                          {/* Quick Actions */}
                          {isSelected && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  duplicateStep(stepKey)
                                }}
                                className="p-1 text-xs text-blue-600 hover:bg-blue-100 rounded"
                                title="複製"
                              >
                                📄
                              </button>
                              {stepKey !== 'welcome' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteStep(stepKey)
                                  }}
                                  className="p-1 text-xs text-red-600 hover:bg-red-100 rounded"
                                  title="削除"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Flow paths preview */}
                        {(isSelected || hoveredPath === stepKey) && step.buttons && step.buttons.length > 0 && (
                          <div className="mt-2 pl-4 space-y-1">
                            {step.buttons.slice(0, 3).map((button, btnIndex) => (
                              <div key={btnIndex} className="flex items-center gap-2 text-xs text-gray-600">
                                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                <span className="truncate max-w-20">{button.label}</span>
                                {button.next && (
                                  <>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-blue-600 truncate max-w-20">
                                      {surveyConfig[button.next]?.title || button.next}
                                    </span>
                                  </>
                                )}
                              </div>
                            ))}
                            {step.buttons.length > 3 && (
                              <div className="text-xs text-gray-400 pl-3">
                                +{step.buttons.length - 3}個の分岐...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-sm text-gray-900 mb-2">統計情報</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">総ステップ数</span>
                  <span className="font-medium">{Object.keys(surveyConfig).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">総分岐数</span>
                  <span className="font-medium">
                    {Object.values(surveyConfig).reduce((sum, step) => sum + (step.buttons?.length || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">終了ステップ</span>
                  <span className="font-medium">
                    {Object.values(surveyConfig).filter(step => 
                      !step.buttons || step.buttons.length === 0 || 
                      !step.buttons.some(btn => btn.next)
                    ).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {surveyConfig[selectedStep] ? (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                {/* Step Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getStepColor(selectedStep) }}
                    />
                    <h2 className="text-xl font-bold text-gray-900">{selectedStep}</h2>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded uppercase">
                      {getStepType(selectedStep)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    フィールドをクリックして直接編集できます
                  </p>
                </div>

                {/* Step Content */}
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイトル
                    </label>
                    <InlineEdit
                      value={surveyConfig[selectedStep]?.title || ''}
                      onSave={(value) => updateStep(selectedStep, 'title', value)}
                      stepKey={selectedStep}
                      field="title"
                      placeholder="ステップのタイトルを入力"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージ
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 bg-white">
                      <textarea
                        value={surveyConfig[selectedStep]?.message || ''}
                        onChange={(e) => updateStep(selectedStep, 'message', e.target.value)}
                        placeholder="ユーザーに表示するメッセージを入力"
                        className="w-full border-0 resize-none focus:ring-0 focus:outline-none"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        選択肢ボタン ({surveyConfig[selectedStep]?.buttons?.length || 0})
                      </label>
                      <button
                        onClick={() => {
                          const newButtons = [...(surveyConfig[selectedStep]?.buttons || []), { label: '新しい選択肢', action: '', value: '', next: '' }]
                          updateStep(selectedStep, 'buttons', newButtons)
                        }}
                        className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                      >
                        + 選択肢を追加
                      </button>
                    </div>

                    <div className="space-y-3">
                      {surveyConfig[selectedStep]?.buttons?.map((button, index) => (
                        <motion.div 
                          key={index} 
                          className="bg-white border border-gray-200 rounded-lg p-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center">
                                {index + 1}
                              </span>
                              選択肢 {index + 1}
                            </span>
                            <button
                              onClick={() => {
                                const newButtons = surveyConfig[selectedStep]?.buttons?.filter((_, i) => i !== index) || []
                                updateStep(selectedStep, 'buttons', newButtons)
                              }}
                              className="text-sm text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                            >
                              削除
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                ボタンテキスト
                              </label>
                              <InlineEdit
                                value={button.label}
                                onSave={(value) => {
                                  const newButtons = [...(surveyConfig[selectedStep]?.buttons || [])]
                                  newButtons[index] = { ...newButtons[index], label: value }
                                  updateStep(selectedStep, 'buttons', newButtons)
                                }}
                                stepKey={selectedStep}
                                field="buttonLabel"
                                buttonIndex={index}
                                placeholder="ボタンに表示するテキスト"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                次のステップ
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={button.next || ''}
                                  onChange={(e) => {
                                    const newButtons = [...(surveyConfig[selectedStep]?.buttons || [])]
                                    newButtons[index] = { ...newButtons[index], next: e.target.value }
                                    updateStep(selectedStep, 'buttons', newButtons)
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">選択してください</option>
                                  {Object.keys(surveyConfig)
                                    .filter(key => key !== selectedStep)
                                    .map(stepKey => (
                                    <option key={stepKey} value={stepKey}>
                                      {surveyConfig[stepKey]?.title} ({stepKey})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    const newStepId = `step_${Date.now()}`
                                    const newButtons = [...(surveyConfig[selectedStep]?.buttons || [])]
                                    newButtons[index] = { ...newButtons[index], next: newStepId }
                                    updateStep(selectedStep, 'buttons', newButtons)
                                    setSurveyConfig(prev => ({
                                      ...prev,
                                      [newStepId]: {
                                        title: '新しいステップ',
                                        message: 'メッセージを入力してください',
                                        buttons: []
                                      }
                                    }))
                                    setSelectedStep(newStepId)
                                  }}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors whitespace-nowrap"
                                >
                                  新規作成
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Preview */}
                          <div className="mt-3 p-2 bg-gray-50 rounded border">
                            <div className="text-xs text-gray-500 mb-1">プレビュー:</div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-1 bg-blue-500 text-white rounded shadow-sm">
                                {button.label || '(空)'}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className={`px-2 py-1 rounded ${
                                button.next && surveyConfig[button.next] 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {button.next 
                                  ? (surveyConfig[button.next]?.title || button.next)
                                  : '未設定'
                                }
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {(!surveyConfig[selectedStep]?.buttons || surveyConfig[selectedStep]?.buttons?.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="mb-2">選択肢がありません</p>
                          <button
                            onClick={() => {
                              const newButtons = [{ label: '新しい選択肢', action: '', value: '', next: '' }]
                              updateStep(selectedStep, 'buttons', newButtons)
                            }}
                            className="text-sm bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition-colors"
                          >
                            最初の選択肢を追加
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-500">
                <p className="mb-4">左側からステップを選択してください</p>
                <button
                  onClick={createNewStep}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  新しいステップを作成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}