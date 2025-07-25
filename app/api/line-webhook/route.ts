import { NextRequest, NextResponse } from 'next/server'
import { Client, Message, WebhookEvent, MessageEvent, PostbackEvent, FollowEvent } from '@line/bot-sdk'

console.log('🔥 ULTRA WEBHOOK - 限界を越えたLINE Bot')

// 確実なLINE Bot設定
const LINE_CONFIG = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
}

console.log('⚡ LINE CONFIG STATUS:', {
  hasToken: !!LINE_CONFIG.channelAccessToken,
  tokenLength: LINE_CONFIG.channelAccessToken.length,
  hasSecret: !!LINE_CONFIG.channelSecret,
  secretLength: LINE_CONFIG.channelSecret.length,
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

// 限界を越えた超高速アンケートフロー
const ULTIMATE_SURVEY = {
  welcome: {
    title: "🎯 限界突破診断",
    message: "友だち登録ありがとうございます！🚀\n\n限界を越えた超高速診断をお届けします✨\n\n今すぐ開始しましょう！",
    buttons: [
      { label: "🚀 限界突破開始", action: "start", next: "category" }
    ]
  },
  category: {
    title: "📋 究極の選択",
    message: "あなたが求める診断は？\n\n✨ 限界を越えた分析をお届けします",
    buttons: [
      { label: "💼 ビジネス戦略", action: "select", value: "business", next: "business" },
      { label: "🎯 キャリア設計", action: "select", value: "career", next: "career" },
      { label: "🚀 スキル強化", action: "select", value: "skills", next: "skills" }
    ]
  },
  business: {
    title: "💼 ビジネス戦略診断",
    message: "あなたのビジネスの立地は？\n\n🔥 最適戦略を分析します",
    buttons: [
      { label: "🌆 都市部", action: "area", value: "urban", next: "result" },
      { label: "🏘️ 郊外", action: "area", value: "suburban", next: "result" },
      { label: "🌄 地方", action: "area", value: "rural", next: "result" }
    ]
  },
  career: {
    title: "🎯 キャリア設計診断",
    message: "あなたの理想のキャリアは？\n\n✨ 成功への道筋を示します",
    buttons: [
      { label: "📈 経営層", action: "goal", value: "executive", next: "result" },
      { label: "🔬 専門家", action: "goal", value: "expert", next: "result" },
      { label: "🚀 起業家", action: "goal", value: "entrepreneur", next: "result" }
    ]
  },
  skills: {
    title: "🚀 スキル強化診断",
    message: "伸ばしたいスキルは？\n\n💪 最強の成長戦略を提供します",
    buttons: [
      { label: "💻 テクノロジー", action: "skill", value: "tech", next: "result" },
      { label: "🤝 リーダーシップ", action: "skill", value: "leadership", next: "result" },
      { label: "📊 戦略思考", action: "skill", value: "strategy", next: "result" }
    ]
  },
  result: {
    title: "🎉 診断完了！",
    message: "🔥 限界を越えた分析が完了しました！\n\n✨ あなたの可能性は無限大です\n\n📈 成功への第一歩を踏み出しましょう",
    buttons: [
      { label: "📊 詳細レポート", action: "report", value: "detail" },
      { label: "🔄 再診断", action: "restart", next: "welcome" }
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

  // スタート系のワード
  if (!userSessions.has(userId) || 
      text.includes('スタート') || 
      text.includes('開始') ||
      text.includes('はじめ') ||
      text.includes('診断')) {
    
    console.log(`🚀 ULTIMATE START for ${userId}`)
    userSessions.set(userId, { currentStep: 'welcome', data: {} })
    return createUltimateFlexMessage(ULTIMATE_SURVEY.welcome)
  }

  // 現在の状態を確認
  const session = userSessions.get(userId)
  if (session?.currentStep && ULTIMATE_SURVEY[session.currentStep as keyof typeof ULTIMATE_SURVEY]) {
    return createUltimateFlexMessage(ULTIMATE_SURVEY[session.currentStep as keyof typeof ULTIMATE_SURVEY])
  }

  // デフォルト
  return {
    type: 'text',
    text: '🚀 限界を越えた診断を開始するには\n「スタート」と送信してください！\n\n✨ 究極の分析をお届けします'
  }
}

// 究極のポストバック処理
async function handleUltimatePostback(event: PostbackEvent): Promise<Message> {
  const userId = event.source.userId!
  
  console.log(`🔘 ULTIMATE POSTBACK from ${userId}: ${event.postback.data}`)
  
  try {
    const data = JSON.parse(event.postback.data)
    const { action, value, next } = data

    // 次のステップに進む
    if (next && ULTIMATE_SURVEY[next as keyof typeof ULTIMATE_SURVEY]) {
      console.log(`➡️ ULTIMATE MOVE to: ${next}`)
      userSessions.set(userId, { currentStep: next, data: { ...data } })
      return createUltimateFlexMessage(ULTIMATE_SURVEY[next as keyof typeof ULTIMATE_SURVEY])
    }

    // 特別なアクション
    switch (action) {
      case 'restart':
        userSessions.set(userId, { currentStep: 'welcome', data: {} })
        return createUltimateFlexMessage(ULTIMATE_SURVEY.welcome)
      
      case 'report':
        return {
          type: 'text',
          text: `🎉 限界突破レポート準備中！\n\n✨ あなたの分析結果：\n📊 データ処理中...\n🚀 成功への道筋を計算中...\n\n💪 限界を越えた可能性を発見しました！\n\n🔄 再診断は「スタート」で！`
        }
      
      case 'start':
        userSessions.set(userId, { currentStep: 'category', data: {} })
        return createUltimateFlexMessage(ULTIMATE_SURVEY.category)
      
      default:
        return {
          type: 'text',
          text: `✅ 回答記録完了！\n\n📝 ${action}: ${value}\n\n🔥 限界を越えた分析を実行中...\n\n🚀 続行は「スタート」で！`
        }
    }
  } catch (error) {
    console.error('❌ ULTIMATE POSTBACK ERROR:', error)
    return {
      type: 'text',
      text: '⚡ エラーが発生しました\n「スタート」で再開してください！'
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
          ultimateMessage = createUltimateFlexMessage(ULTIMATE_SURVEY.welcome)
          break
          
        default:
          console.log(`❓ Unknown event: ${event.type}`)
      }

      // 限界を越えたメッセージ送信
      if (ultimateMessage && 'replyToken' in event && event.replyToken) {
        try {
          console.log('🚀 SENDING ULTIMATE MESSAGE...')
          await lineClient.replyMessage(event.replyToken, ultimateMessage)
          console.log('✅ ULTIMATE MESSAGE SENT SUCCESSFULLY!')
        } catch (error) {
          console.error('❌ ULTIMATE SEND FAILED:', error)
          console.error('🔍 Client status:', {
            hasClient: !!lineClient,
            hasToken: !!LINE_CONFIG.channelAccessToken,
            tokenStart: LINE_CONFIG.channelAccessToken.substring(0, 10)
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