import { NextRequest, NextResponse } from 'next/server'

// アンケート設定のメモリストレージ
let currentSurveyConfig = {
  welcome: {
    title: "🎉 無料診断スタート",
    message: "友だち登録ありがとうございます！🎊\n\n📋 3つのステップで診断を行います\n⏱️ 所要時間：約3分\n📊 詳細な分析結果をお届け\n\n今すぐ開始しましょう！",
    buttons: [
      { label: "🚀 ステップ1へ進む", action: "start", next: "step1" }
    ]
  },
  step1: {
    title: "📋 ステップ1／3：基本情報",
    message: "まず、あなたの現在の状況について教えてください。\n\n💼 どちらに最も当てはまりますか？",
    buttons: [
      { label: "👔 会社員・公務員", action: "step1", value: "employee", next: "step2" },
      { label: "💼 経営者・役員", action: "step1", value: "executive", next: "step2" },
      { label: "🎓 学生", action: "step1", value: "student", next: "step2" },
      { label: "🏠 フリーランス・個人事業主", action: "step1", value: "freelancer", next: "step2" }
    ]
  },
  step2: {
    title: "🎯 ステップ2／3：目標設定",
    message: "次に、あなたの今後の目標について教えてください。\n\n🚀 最も重視したい分野は？",
    buttons: [
      { label: "💰 収入アップ", action: "step2", value: "income", next: "step3" },
      { label: "📈 スキル向上", action: "step2", value: "skills", next: "step3" },
      { label: "🏢 キャリアアップ", action: "step2", value: "career", next: "step3" },
      { label: "⚖️ ワークライフバランス", action: "step2", value: "balance", next: "step3" },
      { label: "🌟 自己実現", action: "step2", value: "self_actualization", next: "step3" }
    ]
  },
  step3: {
    title: "⚡ ステップ3／3：行動スタイル",
    message: "最後に、あなたの行動スタイルについて教えてください。\n\n🤔 新しいことに取り組む時、どのタイプですか？",
    buttons: [
      { label: "🔥 すぐに行動開始", action: "step3", value: "action_first", next: "analysis" },
      { label: "📚 しっかり計画してから", action: "step3", value: "plan_first", next: "analysis" },
      { label: "👥 人と相談してから", action: "step3", value: "consult_first", next: "analysis" },
      { label: "📊 データを集めてから", action: "step3", value: "research_first", next: "analysis" }
    ]
  },
  analysis: {
    title: "🔄 分析中...",
    message: "📊 あなたの回答を分析しています\n\n✨ ステップ1：基本情報 ✅\n🎯 ステップ2：目標設定 ✅\n⚡ ステップ3：行動スタイル ✅\n\n🔥 AIが最適なアドバイスを準備中...",
    buttons: [
      { label: "📋 診断結果を見る", action: "get_result", next: "result" }
    ]
  },
  result: {
    title: "🎉 診断結果完了！",
    message: "🔥 あなたの診断が完了しました！\n\n✨ あなたの可能性は無限大です\n📈 成功への具体的なステップをお伝えします\n\n💎 パーソナライズされた結果をご確認ください",
    buttons: [
      { label: "📊 詳細レポートを見る", action: "report", value: "detail" },
      { label: "🔄 もう一度診断する", action: "restart", next: "welcome" },
      { label: "💬 個別相談を申し込む", action: "consultation", value: "request" }
    ]
  }
}

// GET: 現在の設定を取得
export async function GET() {
  console.log('🔍 Survey config requested')
  return NextResponse.json({
    success: true,
    config: currentSurveyConfig,
    timestamp: new Date().toISOString()
  })
}

// POST: 設定を更新
export async function POST(request: NextRequest) {
  console.log('🔄 Survey config update requested')
  
  try {
    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Config is required'
      }, { status: 400 })
    }

    // 設定を更新
    currentSurveyConfig = { ...config }
    
    console.log('✅ Survey config updated successfully')
    console.log('📋 New config keys:', Object.keys(currentSurveyConfig))

    return NextResponse.json({
      success: true,
      message: 'Survey config updated successfully',
      config: currentSurveyConfig,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Survey config update failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update survey config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 現在の設定を取得する関数（他のファイルから使用）
export function getCurrentSurveyConfig() {
  return currentSurveyConfig
}