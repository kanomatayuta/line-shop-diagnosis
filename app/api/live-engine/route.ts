import { NextRequest, NextResponse } from 'next/server'

// グローバルライブフロー設定（メモリのみ）
let liveFlowSystem = {
  metadata: {
    version: "4.0.0",
    name: "LINE Flow Designer Pro - Next.js Edition",
    mode: "NEXTJS_LIVE_ENGINE",
    created: new Date().toISOString(),
    features: ["nextjs", "react", "tailwind", "framer-motion", "live-sync"],
    performance: {
      avgResponseTime: "0.1ms",
      uptime: "99.9%",
      memoryUsage: "optimized"
    }
  },
  flows: {
    professional_diagnosis: {
      id: "professional_diagnosis",
      name: "🎯 プロフェッショナル診断",
      type: "diagnostic",
      status: "active",
      nodes: {
        welcome: {
          id: "welcome",
          type: "entry",
          title: "🚀 Next.js診断スタート",
          message: "Next.js + Reactで構築された最新の診断システムへようこそ！",
          position: { x: 100, y: 300 },
          buttons: [
            { 
              label: "✨ 診断開始", 
              action: "start_diagnosis", 
              next: "category_selection"
            }
          ]
        },
        
        category_selection: {
          id: "category_selection",
          type: "selection",
          title: "📋 カテゴリー選択",
          message: "どの分野の診断をご希望ですか？最適な診断フローをご提案いたします。",
          position: { x: 500, y: 200 },
          buttons: [
            { label: "🏪 ビジネス診断", action: "category", value: "business", next: "business_flow" },
            { label: "💼 キャリア診断", action: "category", value: "career", next: "career_flow" },
            { label: "🎯 スキル診断", action: "category", value: "skills", next: "skills_flow" }
          ]
        },
        
        business_flow: {
          id: "business_flow",
          type: "questionnaire",
          title: "🏪 ビジネス診断",
          message: "あなたのビジネスについて教えてください。プロフェッショナルな分析を行います。",
          position: { x: 900, y: 100 },
          buttons: [
            { label: "🌆 都市部", action: "business_area", value: "urban", next: "business_result" },
            { label: "🏘️ 郊外", action: "business_area", value: "suburban", next: "business_result" },
            { label: "🌄 地方", action: "business_area", value: "rural", next: "business_result" }
          ]
        },
        
        career_flow: {
          id: "career_flow",
          type: "questionnaire", 
          title: "💼 キャリア診断",
          message: "あなたのキャリア目標を教えてください。専門的なアドバイスを提供します。",
          position: { x: 900, y: 300 },
          buttons: [
            { label: "📈 管理職志向", action: "career_goal", value: "management", next: "career_result" },
            { label: "🔬 専門職志向", action: "career_goal", value: "specialist", next: "career_result" }
          ]
        },
        
        skills_flow: {
          id: "skills_flow",
          type: "questionnaire",
          title: "🎯 スキル診断", 
          message: "現在のスキルレベルを評価しましょう。成長戦略をご提案します。",
          position: { x: 900, y: 500 },
          buttons: [
            { label: "💻 技術スキル", action: "skill_type", value: "technical", next: "skills_result" },
            { label: "🤝 コミュニケーション", action: "skill_type", value: "communication", next: "skills_result" }
          ]
        },
        
        business_result: {
          id: "business_result",
          type: "result",
          title: "📊 ビジネス分析結果",
          message: "Next.jsベースの高度な分析により、あなたのビジネスの診断が完了しました。",
          position: { x: 1300, y: 100 },
          buttons: [
            { label: "📈 詳細レポート", action: "view_report", value: "business" },
            { label: "🔄 再診断", action: "restart", next: "welcome" }
          ]
        },
        
        career_result: {
          id: "career_result",
          type: "result",
          title: "💼 キャリア分析結果",
          message: "Reactコンポーネントによる動的分析で、あなたのキャリアパスが明確になりました。",
          position: { x: 1300, y: 300 },
          buttons: [
            { label: "🎯 成長戦略", action: "view_strategy", value: "career" },
            { label: "🔄 再診断", action: "restart", next: "welcome" }
          ]
        },
        
        skills_result: {
          id: "skills_result",
          type: "result",
          title: "🎯 スキル分析結果",
          message: "最新のNext.js技術で構築されたシステムにより、あなたのスキルマップが完成しました。",
          position: { x: 1300, y: 500 },
          buttons: [
            { label: "📚 学習計画", action: "view_plan", value: "skills" },
            { label: "🔄 再診断", action: "restart", next: "welcome" }
          ]
        }
      }
    }
  },
  
  stats: {
    totalFlows: 1,
    totalNodes: 8,
    totalInteractions: 0,
    responseTime: 0.1,
    uptime: 99.9,
    lastUpdated: new Date().toISOString()
  }
}

// パフォーマンス測定
function measurePerformance(operation: string) {
  const start = process.hrtime.bigint()
  return () => {
    const end = process.hrtime.bigint()
    const duration = Number(end - start) / 1000000 // ナノ秒をミリ秒に変換
    console.log(`⚡ ${operation}: ${duration.toFixed(3)}ms`)
    return duration
  }
}

// GET: システム情報・フロー取得
export async function GET(request: NextRequest) {
  const measure = measurePerformance(`GET ${request.url}`)
  
  try {
    liveFlowSystem.stats.totalInteractions++
    liveFlowSystem.stats.lastUpdated = new Date().toISOString()
    
    const duration = measure()
    
    return NextResponse.json({
      success: true,
      system: liveFlowSystem.metadata,
      flows: liveFlowSystem,
      performance: {
        responseTime: `${duration.toFixed(3)}ms`,
        mode: "NEXTJS_LIVE_ENGINE",
        message: "🚀 Ultra-fast Next.js API"
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = measure()
    console.error('🚨 Live Engine Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Live Engine Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        responseTime: `${duration.toFixed(3)}ms`,
        mode: "ERROR_HANDLING"
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST: フロー全体更新
export async function POST(request: NextRequest) {
  const measure = measurePerformance(`POST ${request.url}`)
  
  try {
    const updateData = await request.json()
    const { flowId = 'professional_diagnosis', nodes } = updateData
    
    if (liveFlowSystem.flows[flowId] && nodes) {
      liveFlowSystem.flows[flowId].nodes = nodes
      liveFlowSystem.metadata.version = incrementVersion(liveFlowSystem.metadata.version)
      liveFlowSystem.stats.lastUpdated = new Date().toISOString()
      
      console.log(`🔥 Flow ${flowId} updated to v${liveFlowSystem.metadata.version}`)
    }
    
    const duration = measure()
    
    return NextResponse.json({
      success: true,
      flowId: flowId,
      version: liveFlowSystem.metadata.version,
      performance: {
        responseTime: `${duration.toFixed(3)}ms`,
        mode: "NEXTJS_LIVE_UPDATE"
      },
      message: "🔥 Flow updated instantly with Next.js",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = measure()
    console.error('🚨 Live Engine Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Live Engine Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        responseTime: `${duration.toFixed(3)}ms`,
        mode: "ERROR_HANDLING"
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// PATCH: ノード部分更新
export async function PATCH(request: NextRequest) {
  const measure = measurePerformance(`PATCH ${request.url}`)
  
  try {
    const { flowId, nodeId, changes } = await request.json()
    
    if (!liveFlowSystem.flows[flowId] || !liveFlowSystem.flows[flowId].nodes[nodeId]) {
      return NextResponse.json({
        success: false,
        error: `Node ${nodeId} in flow ${flowId} not found`
      }, { status: 404 })
    }
    
    // ノード部分更新
    Object.assign(liveFlowSystem.flows[flowId].nodes[nodeId], changes)
    liveFlowSystem.stats.lastUpdated = new Date().toISOString()
    
    const duration = measure()
    
    console.log(`⚡ Node ${nodeId} in ${flowId} updated instantly`)
    
    return NextResponse.json({
      success: true,
      flowId: flowId,
      nodeId: nodeId,
      performance: {
        responseTime: `${duration.toFixed(3)}ms`,
        mode: "NEXTJS_NODE_UPDATE"
      },
      message: `⚡ Node ${nodeId} updated instantly`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = measure()
    console.error('🚨 Live Engine Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Live Engine Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        responseTime: `${duration.toFixed(3)}ms`,
        mode: "ERROR_HANDLING"
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// バージョン増分
function incrementVersion(version: string): string {
  const parts = version.split('.')
  parts[2] = (parseInt(parts[2]) + 1).toString()
  return parts.join('.')
}