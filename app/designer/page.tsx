'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Save, 
  Folder, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Target,
  Palette,
  Settings,
  BarChart3,
  Home,
  Smartphone,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Types
interface FlowNode {
  id: string
  type: 'entry' | 'selection' | 'questionnaire' | 'result'
  title: string
  message: string
  position: { x: number; y: number }
  buttons?: Array<{
    label: string
    action: string
    value: string
    next?: string
  }>
}

interface FlowState {
  nodes: Record<string, FlowNode>
  connections: Array<{ from: string; to: string }>
  selectedNode: string | null
}

// Node Component
const FlowNodeComponent = ({ 
  node, 
  isSelected, 
  onSelect, 
  onDrag 
}: { 
  node: FlowNode
  isSelected: boolean
  onSelect: () => void
  onDrag: (id: string, position: { x: number; y: number }) => void
}) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'entry': return <Home className="w-5 h-5" />
      case 'selection': return <MessageSquare className="w-5 h-5" />
      case 'questionnaire': return <AlertCircle className="w-5 h-5" />
      case 'result': return <CheckCircle className="w-5 h-5" />
      default: return <MessageSquare className="w-5 h-5" />
    }
  }

  const getNodeColors = (type: string) => {
    switch (type) {
      case 'entry': return 'border-ios-green text-ios-green bg-ios-green/5'
      case 'selection': return 'border-ios-blue text-ios-blue bg-ios-blue/5'
      case 'questionnaire': return 'border-ios-orange text-ios-orange bg-ios-orange/5'
      case 'result': return 'border-ios-purple text-ios-purple bg-ios-purple/5'
      default: return 'border-gray-300 text-gray-600 bg-gray-50'
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    })
    onSelect()
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      }
      onDrag(node.id, newPosition)
    }
  }, [isDragging, dragOffset, node.id, onDrag])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <motion.div
      ref={nodeRef}
      className={`
        absolute flow-node p-4 cursor-move select-none
        ${getNodeColors(node.type)}
        ${isSelected ? 'ring-4 ring-ios-blue/20 border-ios-blue' : ''}
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        minWidth: '200px'
      }}
      onMouseDown={handleMouseDown}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2 mb-3">
        {getNodeIcon(node.type)}
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {node.title || 'Untitled Node'}
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {node.message || 'No message'}
      </p>
      
      {node.buttons && node.buttons.length > 0 && (
        <div className="space-y-1">
          {node.buttons.slice(0, 3).map((button, index) => (
            <div 
              key={index}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
            >
              {button.label}
            </div>
          ))}
          {node.buttons.length > 3 && (
            <div className="text-xs text-gray-500">
              +{node.buttons.length - 3} more...
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Node Editor Component
const NodeEditor = ({ 
  selectedNode, 
  onUpdate, 
  onDelete 
}: { 
  selectedNode: FlowNode | null
  onUpdate: (id: string, updates: Partial<FlowNode>) => void
  onDelete: (id: string) => void
}) => {
  if (!selectedNode) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-ios-headline font-semibold mb-2">ノードを選択</h3>
        <p className="text-ios-subhead">
          キャンバスからノードをクリックして編集を開始してください
        </p>
      </div>
    )
  }

  return (
    <motion.div 
      className="p-6 space-y-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-ios-title-3 font-semibold flex items-center gap-2">
        <Settings className="w-5 h-5 text-ios-blue" />
        ノード編集
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-ios-footnote font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            タイトル
          </label>
          <input
            type="text"
            value={selectedNode.title}
            onChange={(e) => onUpdate(selectedNode.id, { title: e.target.value })}
            className="input-ios"
            placeholder="ノードのタイトル"
          />
        </div>
        
        <div>
          <label className="block text-ios-footnote font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            メッセージ
          </label>
          <textarea
            value={selectedNode.message}
            onChange={(e) => onUpdate(selectedNode.id, { message: e.target.value })}
            className="textarea-ios"
            placeholder="ノードの説明・メッセージ"
            rows={4}
          />
        </div>
        
        <div>
          <label className="block text-ios-footnote font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            タイプ
          </label>
          <select
            value={selectedNode.type}
            onChange={(e) => onUpdate(selectedNode.id, { type: e.target.value as FlowNode['type'] })}
            className="input-ios"
          >
            <option value="entry">エントリー</option>
            <option value="selection">選択</option>
            <option value="questionnaire">質問</option>
            <option value="result">結果</option>
          </select>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          onClick={() => onDelete(selectedNode.id)}
          className="btn-danger w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Trash2 className="w-4 h-4" />
          このノードを削除
        </motion.button>
      </div>
    </motion.div>
  )
}

// Main Designer Component
export default function Designer() {
  const [flowState, setFlowState] = useState<FlowState>({
    nodes: {},
    connections: [],
    selectedNode: null
  })
  
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('準備完了')
  const [nodeCounter, setNodeCounter] = useState(0)
  
  const canvasRef = useRef<HTMLDivElement>(null)

  // Load from Live Engine
  const loadFromLiveEngine = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/live-engine')
      const data = await response.json()
      
      if (data.success && data.flows?.flows?.professional_diagnosis?.nodes) {
        const nodes = data.flows.flows.professional_diagnosis.nodes
        const convertedNodes: Record<string, FlowNode> = {}
        
        Object.entries(nodes).forEach(([id, nodeData]: [string, any]) => {
          convertedNodes[id] = {
            id,
            type: nodeData.type || 'selection',
            title: nodeData.title || 'Untitled',
            message: nodeData.message || '',
            position: nodeData.position || { x: 100, y: 100 },
            buttons: nodeData.buttons || []
          }
        })
        
        setFlowState(prev => ({ ...prev, nodes: convertedNodes }))
        setStatus('ライブエンジンから読み込みました')
      }
    } catch (error) {
      console.error('Failed to load from live engine:', error)
      setStatus('読み込みエラー')
    } finally {
      setIsLoading(false)
    }
  }

  // Save to Live Engine
  const saveToLiveEngine = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/live-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: 'professional_diagnosis',
          nodes: flowState.nodes
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStatus('保存完了')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      setStatus('保存エラー')
    } finally {
      setIsLoading(false)
    }
  }

  // Add new node
  const addNode = () => {
    const newId = `node_${nodeCounter + 1}`
    setNodeCounter(prev => prev + 1)
    
    const newNode: FlowNode = {
      id: newId,
      type: 'selection',
      title: '新しいノード',
      message: 'ノードの説明を入力してください',
      position: {
        x: (window.innerWidth / 2 - offset.x) / scale - 100,
        y: (window.innerHeight / 2 - offset.y) / scale - 50
      }
    }
    
    setFlowState(prev => ({
      ...prev,
      nodes: { ...prev.nodes, [newId]: newNode },
      selectedNode: newId
    }))
    setStatus('ノードを追加しました')
  }

  // Update node
  const updateNode = (id: string, updates: Partial<FlowNode>) => {
    setFlowState(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [id]: { ...prev.nodes[id], ...updates }
      }
    }))
  }

  // Delete node
  const deleteNode = (id: string) => {
    setFlowState(prev => {
      const newNodes = { ...prev.nodes }
      delete newNodes[id]
      return {
        ...prev,
        nodes: newNodes,
        selectedNode: prev.selectedNode === id ? null : prev.selectedNode
      }
    })
    setStatus('ノードを削除しました')
  }

  // Handle node drag
  const handleNodeDrag = (id: string, position: { x: number; y: number }) => {
    updateNode(id, { position })
  }

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(2, prev * 1.2))
  const zoomOut = () => setScale(prev => Math.max(0.5, prev * 0.8))
  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  // Clear all
  const clearAll = () => {
    if (confirm('すべてのノードをクリアしますか？')) {
      setFlowState({ nodes: {}, connections: [], selectedNode: null })
      setStatus('フローをクリアしました')
    }
  }

  // Load initial data
  useEffect(() => {
    loadFromLiveEngine()
  }, [])

  // Auto-save status timeout
  useEffect(() => {
    if (status !== '準備完了') {
      const timeout = setTimeout(() => setStatus('準備完了'), 3000)
      return () => clearTimeout(timeout)
    }
  }, [status])

  const nodeCount = Object.keys(flowState.nodes).length
  const selectedNodeData = flowState.selectedNode ? flowState.nodes[flowState.selectedNode] : null

  return (
    <div className="h-screen flex flex-col bg-ios-gray-50 dark:bg-black">
      {/* Navigation */}
      <nav className="nav-ios">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-ios-blue hover:text-ios-blue-dark transition-colors">
                <Home className="w-5 h-5" />
                <span className="font-semibold">ホーム</span>
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Palette className="w-6 h-6 text-ios-blue" />
                <h1 className="text-ios-title-3 font-bold">Flow Designer</h1>
              </div>
            </div>
            <div className="status-online">
              <div className="status-dot bg-ios-green"></div>
              ライブエンジン接続中
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white dark:bg-ios-gray-900 border-r border-gray-200 dark:border-ios-gray-800 flex flex-col">
          {/* Stats */}
          <div className="p-6 border-b border-gray-200 dark:border-ios-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-ios-title-2 font-bold text-ios-blue">{nodeCount}</div>
                <div className="text-ios-caption-1 text-gray-500 uppercase tracking-wide">Nodes</div>
              </div>
              <div className="text-center">
                <div className="text-ios-title-2 font-bold text-ios-blue">{flowState.connections.length}</div>
                <div className="text-ios-caption-1 text-gray-500 uppercase tracking-wide">Connections</div>
              </div>
            </div>
          </div>

          {/* Node Editor */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <NodeEditor
              selectedNode={selectedNodeData}
              onUpdate={updateNode}
              onDelete={deleteNode}
            />
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-ios-gray-800 space-y-3">
            <motion.button
              onClick={saveToLiveEngine}
              disabled={isLoading}
              className="btn-success w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="w-4 h-4" />
              {isLoading ? '保存中...' : 'フローを保存'}
            </motion.button>
            <motion.button
              onClick={loadFromLiveEngine}
              disabled={isLoading}
              className="btn-primary w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Folder className="w-4 h-4" />
              フローを読み込み
            </motion.button>
            <motion.button
              onClick={clearAll}
              className="btn-danger w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="w-4 h-4" />
              クリア
            </motion.button>
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white dark:bg-ios-gray-900 border-b border-gray-200 dark:border-ios-gray-800 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={addNode}
                  className="btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  ノード追加
                </motion.button>
                <motion.button
                  onClick={() => setStatus('自動配置機能は開発中です')}
                  className="btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Target className="w-4 h-4" />
                  自動配置
                </motion.button>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button onClick={zoomOut} className="btn-secondary" whileHover={{ scale: 1.05 }}>
                  <ZoomOut className="w-4 h-4" />
                </motion.button>
                <span className="text-ios-footnote text-gray-500 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <motion.button onClick={zoomIn} className="btn-secondary" whileHover={{ scale: 1.05 }}>
                  <ZoomIn className="w-4 h-4" />
                </motion.button>
                <motion.button onClick={resetView} className="btn-secondary" whileHover={{ scale: 1.05 }}>
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 relative overflow-hidden bg-ios-gray-50 dark:bg-black"
            style={{
              backgroundImage: 'radial-gradient(circle, #00000010 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: `${offset.x}px ${offset.y}px`
            }}
          >
            <div
              className="absolute inset-0 origin-top-left transition-transform duration-200"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
              }}
            >
              <AnimatePresence>
                {Object.values(flowState.nodes).map(node => (
                  <FlowNodeComponent
                    key={node.id}
                    node={node}
                    isSelected={flowState.selectedNode === node.id}
                    onSelect={() => setFlowState(prev => ({ ...prev, selectedNode: node.id }))}
                    onDrag={handleNodeDrag}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-white dark:bg-ios-gray-900 border-t border-gray-200 dark:border-ios-gray-800 px-6 py-2">
            <div className="flex items-center justify-between text-ios-footnote text-gray-500">
              <span>{status}</span>
              <span>{Math.round(scale * 100)}% • {offset.x},{offset.y}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}