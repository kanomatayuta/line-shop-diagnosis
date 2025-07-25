import { NextRequest, NextResponse } from 'next/server'
import { Client, Message, WebhookEvent, MessageEvent, PostbackEvent, FollowEvent } from '@line/bot-sdk'

console.log('🔥 ULTRA WEBHOOK - 限界を越えたLINE Bot')

// 確実なLINE Bot設定
const LINE_CONFIG = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
}

console.log('⚡ DETAILED LINE CONFIG STATUS:', {
  hasToken: !!LINE_CONFIG.channelAccessToken,
  tokenLength: LINE_CONFIG.channelAccessToken.length,
  tokenPreview: LINE_CONFIG.channelAccessToken.substring(0, 20) + '...',
  hasSecret: !!LINE_CONFIG.channelSecret,
  secretLength: LINE_CONFIG.channelSecret.length,
  secretPreview: LINE_CONFIG.channelSecret.substring(0, 8) + '...',
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
})

// LINE Clientを確実に初期化
let lineClient: Client | null = null
if (LINE_CONFIG.channelAccessToken && LINE_CONFIG.channelSecret) {
  try {
    lineClient = new Client(LINE_CONFIG)
    console.log('✅ LINE Client initialized successfully')
  } catch (error) {
    console.error('❌ LINE Client initialization failed:', error)
  }
} else {
  console.error('🚨 Missing LINE credentials!')
}

// ステップ形式のアンケートシステム
const STEP_BY_STEP_SURVEY = {
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

// ユーザー状態管理
const userSessions = new Map<string, { currentStep: string; data: any }>()

// 究極のフレックスメッセージ作成
function createUltimateFlexMessage(step: any): Message {
  console.log(`🎨 Creating ULTIMATE flex for: ${step.title}`)
  
  const buttons = step.buttons?.map((btn: any) => ({
    type: 'button',
    action: {
      type: 'postback',
      label: btn.label,
      data: JSON.stringify({
        action: btn.action,
        value: btn.value || '',
        next: btn.next || ''
      })
    },
    style: 'primary',
    color: '#FF6B35',
    height: 'sm'
  })) || []

  return {
    type: 'flex',
    altText: step.title,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: step.title,
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF',
            wrap: true,
            align: 'center'
          }
        ],
        backgroundColor: '#FF6B35',
        paddingAll: '20px',
        spacing: 'md'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: step.message,
            wrap: true,
            size: 'md',
            color: '#333333',
            lineSpacing: '5px',
            align: 'center'
          }
        ],
        paddingAll: '20px',
        spacing: 'md'
      },
      footer: buttons.length > 0 ? {
        type: 'box',
        layout: 'vertical',
        contents: buttons,
        spacing: 'sm',
        paddingAll: '20px'
      } : undefined,
      styles: {
        footer: {
          separator: true
        }
      }
    }
  }
}

// 究極のメッセージ処理
async function handleUltimateMessage(event: MessageEvent): Promise<Message> {
  const userId = event.source.userId!
  const text = event.message.type === 'text' ? event.message.text : ''
  
  console.log(`🔥 ULTIMATE MESSAGE from ${userId}: ${text}`)

  // スタート系のワード（無料診断も追加）
  if (!userSessions.has(userId) || 
      text.includes('スタート') || 
      text.includes('開始') ||
      text.includes('はじめ') ||
      text.includes('診断') ||
      text.includes('無料診断') ||
      text.includes('無料') ||
      text.includes('START') ||
      text.includes('start')) {
    
    console.log(`🚀 ULTIMATE START for ${userId} with trigger: ${text}`)
    userSessions.set(userId, { currentStep: 'welcome', data: {} })
    return createUltimateFlexMessage(STEP_BY_STEP_SURVEY.welcome)
  }

  // 現在の状態を確認
  const session = userSessions.get(userId)
  if (session?.currentStep && STEP_BY_STEP_SURVEY[session.currentStep as keyof typeof STEP_BY_STEP_SURVEY]) {
    return createUltimateFlexMessage(STEP_BY_STEP_SURVEY[session.currentStep as keyof typeof STEP_BY_STEP_SURVEY])
  }

  // デフォルト
  return {
    type: 'text',
    text: '🚀 限界を越えた診断を開始するには\n「スタート」または「無料診断」と送信してください！\n\n✨ 究極の分析をお届けします\n\n📱 キーワード例:\n・スタート\n・無料診断\n・診断\n・開始'
  }
}

// 究極のポストバック処理
async function handleUltimatePostback(event: PostbackEvent): Promise<Message> {
  const userId = event.source.userId!
  
  console.log(`🔘 ULTIMATE POSTBACK from ${userId}: ${event.postback.data}`)
  
  try {
    const data = JSON.parse(event.postback.data)
    const { action, value, next } = data

    // 回答データを保存して次のステップに進む
    if (next && STEP_BY_STEP_SURVEY[next as keyof typeof STEP_BY_STEP_SURVEY]) {
      console.log(`➡️ ULTIMATE MOVE to: ${next}`)
      
      // 現在のセッションデータを取得
      const currentSession = userSessions.get(userId) || { currentStep: '', data: {} }
      
      // 回答データを保存
      const updatedData = { ...currentSession.data }
      if (action && value) {
        updatedData[action] = value
      }
      
      userSessions.set(userId, { currentStep: next, data: updatedData })
      return createUltimateFlexMessage(STEP_BY_STEP_SURVEY[next as keyof typeof STEP_BY_STEP_SURVEY])
    }

    // 特別なアクション
    switch (action) {
      case 'restart':
        userSessions.set(userId, { currentStep: 'welcome', data: {} })
        return createUltimateFlexMessage(STEP_BY_STEP_SURVEY.welcome)
      
      case 'report':
        return {
          type: 'text',
          text: `📊 詳細レポート準備中！\n\n✨ あなたの診断結果：\n📋 ステップ1: ${userSessions.get(userId)?.data?.step1 || '未回答'}\n🎯 ステップ2: ${userSessions.get(userId)?.data?.step2 || '未回答'}\n⚡ ステップ3: ${userSessions.get(userId)?.data?.step3 || '未回答'}\n\n🔥 AIが分析した結果をお届け中...\n💎 あなた専用のアドバイスを準備中\n\n🔄 再診断は「スタート」で！`
        }
      
      case 'consultation':
        return {
          type: 'text',
          text: `💬 個別相談お申し込みありがとうございます！\n\n📋 診断結果を基に、専門スタッフが\n🎯 あなたに最適なプランをご提案します\n\n📞 近日中にご連絡させていただきます\n\n✨ より詳しい分析をお待ちください！`
        }
      
      case 'start':
        userSessions.set(userId, { currentStep: 'step1', data: {} })
        return createUltimateFlexMessage(STEP_BY_STEP_SURVEY.step1)
      
      default:
        return {
          type: 'text',
          text: `✅ 回答記録完了！\n\n📝 ${action}: ${value}\n\n🔥 限界を越えた分析を実行中...\n\n🚀 続行は「スタート」または「無料診断」で！`
        }
    }
  } catch (error) {
    console.error('❌ ULTIMATE POSTBACK ERROR:', error)
    return {
      type: 'text',
      text: '⚡ エラーが発生しました\n「スタート」または「無料診断」で再開してください！'
    }
  }
}

// 究極のWebhook処理
export async function POST(request: NextRequest) {
  console.log('🔥 ULTIMATE WEBHOOK TRIGGERED!')
  console.log('🎯 Time:', new Date().toISOString())
  
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature')
    
    console.log('📦 Body length:', body.length)
    console.log('🔑 Has signature:', !!signature)

    if (!signature) {
      console.error('❌ No signature - blocking request')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    if (!lineClient) {
      console.error('🚨 LINE CLIENT NOT INITIALIZED!')
      return NextResponse.json({ 
        error: 'LINE client not configured',
        hasToken: !!LINE_CONFIG.channelAccessToken,
        hasSecret: !!LINE_CONFIG.channelSecret
      }, { status: 500 })
    }

    const events: WebhookEvent[] = JSON.parse(body).events
    console.log(`🚀 PROCESSING ${events.length} ULTIMATE EVENTS`)

    // 限界を越えた処理
    for (const event of events) {
      console.log(`⚡ Event: ${event.type}`)
      
      let ultimateMessage: Message | null = null

      switch (event.type) {
        case 'message':
          console.log('💬 ULTIMATE MESSAGE EVENT')
          ultimateMessage = await handleUltimateMessage(event as MessageEvent)
          break
        
        case 'postback':
          console.log('🔘 ULTIMATE POSTBACK EVENT')
          ultimateMessage = await handleUltimatePostback(event as PostbackEvent)
          break
        
        case 'follow':
          console.log('👋 ULTIMATE FOLLOW EVENT - AUTO SURVEY!')
          const userId = event.source.userId!
          userSessions.set(userId, { currentStep: 'welcome', data: {} })
          ultimateMessage = createUltimateFlexMessage(STEP_BY_STEP_SURVEY.welcome)
          break
          
        default:
          console.log(`❓ Unknown event: ${event.type}`)
      }

      // 限界を越えたメッセージ送信
      if (ultimateMessage && 'replyToken' in event && event.replyToken) {
        try {
          console.log('🚀 SENDING ULTIMATE MESSAGE...')
          console.log('📤 Message type:', ultimateMessage.type)
          console.log('🎯 Reply token:', event.replyToken)
          console.log('👤 User ID:', event.source.userId)
          
          await lineClient.replyMessage(event.replyToken, ultimateMessage)
          
          console.log('✅ ULTIMATE MESSAGE SENT SUCCESSFULLY!')
          console.log('🎊 Message delivered to user:', event.source.userId)
          
        } catch (error) {
          console.error('❌ ULTIMATE SEND FAILED:', error)
          console.error('🔍 Detailed error info:', {
            hasClient: !!lineClient,
            hasToken: !!LINE_CONFIG.channelAccessToken,
            tokenStart: LINE_CONFIG.channelAccessToken.substring(0, 10),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            replyToken: event.replyToken,
            userId: event.source.userId
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
      message: '🔥 ULTIMATE PROCESSING COMPLETE',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('🚨 ULTIMATE WEBHOOK ERROR:', error)
    return NextResponse.json({
      error: 'Ultimate webhook error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 究極のヘルスチェック
export async function GET() {
  return NextResponse.json({
    status: '🔥 ULTIMATE READY',
    service: 'ULTIMATE LINE Bot Webhook',
    version: 'BEYOND_LIMITS_1.0',
    endpoint: '/api/line-webhook',
    description: '限界を越えたLINE Bot - 究極のパフォーマンス',
    config: {
      hasToken: !!LINE_CONFIG.channelAccessToken,
      hasSecret: !!LINE_CONFIG.channelSecret,
      clientReady: !!lineClient,
      environment: process.env.NODE_ENV || 'development'
    },
    message: '🚀 Ready to break all limits!',
    timestamp: new Date().toISOString()
  })
}