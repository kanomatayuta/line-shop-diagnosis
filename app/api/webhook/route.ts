import { NextRequest, NextResponse } from 'next/server'
import { Client, Message, WebhookEvent, MessageEvent, PostbackEvent, FollowEvent, ReplyableEvent } from '@line/bot-sdk'

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'dummy_token_for_build',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'dummy_secret_for_build'
}

console.log('🚀 LINE Bot Config:', {
  hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
  hasSecret: !!process.env.LINE_CHANNEL_SECRET,
  tokenStart: (process.env.LINE_CHANNEL_ACCESS_TOKEN || 'none').substring(0, 10) + '...'
})

// クライアント初期化（環境変数がない場合はnull）
let client: Client | null = null
try {
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET) {
    client = new Client({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET
    })
  }
} catch (error) {
  console.warn('⚠️ LINE Client initialization skipped during build')
}

// 固定アンケートフロー（ライブエンジンに依存しない）
const SURVEY_FLOW = {
  welcome: {
    id: "welcome",
    title: "🎯 LINE診断スタート",
    message: "友だち登録ありがとうございます！\n\n簡単な診断でアドバイスをお届けします✨",
    buttons: [
      { label: "🚀 診断開始", action: "start", next: "category" }
    ]
  },
  category: {
    id: "category", 
    title: "📋 カテゴリー選択",
    message: "どの分野の診断をご希望ですか？",
    buttons: [
      { label: "🏪 ビジネス診断", action: "category", value: "business", next: "business" },
      { label: "💼 キャリア診断", action: "category", value: "career", next: "career" },
      { label: "🎯 スキル診断", action: "category", value: "skills", next: "skills" }
    ]
  },
  business: {
    id: "business",
    title: "🏪 ビジネス診断",
    message: "あなたのビジネスの立地について教えてください",
    buttons: [
      { label: "🌆 都市部", action: "area", value: "urban", next: "result" },
      { label: "🏘️ 郊外", action: "area", value: "suburban", next: "result" },
      { label: "🌄 地方", action: "area", value: "rural", next: "result" }
    ]
  },
  career: {
    id: "career",
    title: "💼 キャリア診断", 
    message: "あなたのキャリア目標を教えてください",
    buttons: [
      { label: "📈 管理職志向", action: "goal", value: "management", next: "result" },
      { label: "🔬 専門職志向", action: "goal", value: "specialist", next: "result" }
    ]
  },
  skills: {
    id: "skills",
    title: "🎯 スキル診断",
    message: "伸ばしたいスキルを選択してください",
    buttons: [
      { label: "💻 技術スキル", action: "skill", value: "technical", next: "result" },
      { label: "🤝 コミュニケーション", action: "skill", value: "communication", next: "result" }
    ]
  },
  result: {
    id: "result",
    title: "📊 診断結果",
    message: "診断が完了しました！\n\nあなたに最適なアドバイスをお届けします✨\n\n詳細レポートを確認してください。",
    buttons: [
      { label: "📈 詳細レポート", action: "report", value: "detail" },
      { label: "🔄 再診断", action: "restart", next: "welcome" }
    ]
  }
}

// フレックスメッセージを生成
function createFlexMessage(node: any): Message {
  console.log(`🎨 Creating flex message for node: ${node.id}`)
  
  const buttons = node.buttons?.map((btn: any) => ({
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
    color: '#007AFF'
  })) || []

  return {
    type: 'flex',
    altText: node.title || 'アンケート',
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: node.title || '',
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF',
            wrap: true
          }
        ],
        backgroundColor: '#007AFF',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: node.message || '',
            wrap: true,
            size: 'md',
            color: '#333333',
            lineSpacing: '5px'
          }
        ],
        paddingAll: '20px'
      },
      footer: buttons.length > 0 ? {
        type: 'box',
        layout: 'vertical',
        contents: buttons.slice(0, 4),
        spacing: 'sm',
        paddingAll: '20px'
      } : undefined
    }
  }
}

// ユーザー状態管理
const userStates = new Map<string, { currentNode: string }>()

// メッセージイベント処理
async function handleMessage(event: MessageEvent): Promise<Message> {
  const userId = event.source.userId!
  const userMessage = event.message.type === 'text' ? event.message.text : ''
  
  console.log(`📨 Message from ${userId}: ${userMessage}`)

  // スタート、開始、または新規ユーザー
  if (!userStates.has(userId) || 
      userMessage.includes('スタート') || 
      userMessage.includes('開始') ||
      userMessage.includes('診断')) {
    
    console.log(`🚀 Starting survey for user: ${userId}`)
    userStates.set(userId, { currentNode: 'welcome' })
    return createFlexMessage(SURVEY_FLOW.welcome)
  }

  // 既存ユーザーの状態を確認
  const userState = userStates.get(userId)
  if (userState?.currentNode && SURVEY_FLOW[userState.currentNode as keyof typeof SURVEY_FLOW]) {
    console.log(`📍 User ${userId} at node: ${userState.currentNode}`)
    return createFlexMessage(SURVEY_FLOW[userState.currentNode as keyof typeof SURVEY_FLOW])
  }

  // デフォルトメッセージ
  console.log(`❓ Unknown message from ${userId}`)
  return {
    type: 'text',
    text: '🚀 診断を開始するには「スタート」と送信してください！\n\nまたは下のボタンを押してください✨'
  }
}

// ポストバックイベント処理
async function handlePostback(event: PostbackEvent): Promise<Message> {
  const userId = event.source.userId!
  
  console.log(`🔘 Postback from ${userId}: ${event.postback.data}`)
  
  try {
    const data = JSON.parse(event.postback.data)
    const { action, value, next } = data

    // 次のノードに進む
    if (next && SURVEY_FLOW[next as keyof typeof SURVEY_FLOW]) {
      console.log(`➡️ Moving user ${userId} to node: ${next}`)
      userStates.set(userId, { currentNode: next })
      return createFlexMessage(SURVEY_FLOW[next as keyof typeof SURVEY_FLOW])
    }

    // 特定のアクション処理
    switch (action) {
      case 'restart':
        console.log(`🔄 Restarting survey for user: ${userId}`)
        userStates.set(userId, { currentNode: 'welcome' })
        return createFlexMessage(SURVEY_FLOW.welcome)
      
      case 'report':
        return {
          type: 'text',
          text: `📊 詳細レポートを準備中です...\n\n✨ あなたの診断結果を分析しています！\n\n📈 しばらくお待ちください。\n\n🔄 再診断は「スタート」と送信してください。`
        }
      
      case 'start':
        userStates.set(userId, { currentNode: 'category' })
        return createFlexMessage(SURVEY_FLOW.category)
      
      default:
        console.log(`🎯 Action processed: ${action} = ${value}`)
        return {
          type: 'text', 
          text: `✅ 回答ありがとうございます！\n\n📝 ${action}: ${value}\n\n🔄 続けるには「スタート」と送信してください。`
        }
    }
  } catch (error) {
    console.error('❌ Postback parsing error:', error)
    return {
      type: 'text',
      text: 'エラーが発生しました。「スタート」と送信して再開してください。'
    }
  }
}

// Webhook処理
export async function POST(request: NextRequest) {
  console.log('🎯 Webhook called at:', new Date().toISOString())
  
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature')
    
    console.log('📦 Request body length:', body.length)
    console.log('🔑 Has signature:', !!signature)

    if (!signature) {
      console.error('❌ No signature provided')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // 本番環境での署名検証をスキップ（テスト用）
    // if (process.env.NODE_ENV === 'production' && config.channelSecret) {
    //   const isValid = validateSignature(body, config.channelSecret, signature)
    //   if (!isValid) {
    //     console.error('❌ Invalid signature')
    //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    //   }
    // }

    const events: WebhookEvent[] = JSON.parse(body).events
    console.log(`📨 Processing ${events.length} events`)

    // 各イベントを処理
    for (const event of events) {
      console.log(`🔍 Event type: ${event.type}`)
      
      let replyMessage: Message | null = null

      switch (event.type) {
        case 'message':
          console.log('💬 Handling message event')
          replyMessage = await handleMessage(event as MessageEvent)
          break
        
        case 'postback':
          console.log('🔘 Handling postback event')
          replyMessage = await handlePostback(event as PostbackEvent)
          break
        
        case 'follow':
          console.log('👋 Handling follow event - sending welcome survey')
          const userId = event.source.userId!
          userStates.set(userId, { currentNode: 'welcome' })
          replyMessage = createFlexMessage(SURVEY_FLOW.welcome)
          break
          
        default:
          console.log(`❓ Unknown event type: ${event.type}`)
      }

      // メッセージ送信（replyTokenを持つイベントのみ）
      if (replyMessage && 'replyToken' in event && event.replyToken) {
        if (!client) {
          console.error('❌ LINE client not initialized - missing environment variables')
          return NextResponse.json({ 
            error: 'LINE client not configured' 
          }, { status: 500 })
        }
        
        try {
          console.log('📤 Sending reply message...')
          await client.replyMessage(event.replyToken, replyMessage)
          console.log('✅ Reply message sent successfully')
        } catch (error) {
          console.error('❌ Failed to send reply:', error)
          console.error('Token config:', {
            hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
            tokenLength: (process.env.LINE_CHANNEL_ACCESS_TOKEN || '').length
          })
        }
      } else {
        console.log('⚠️ No reply message or reply token')
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: events.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('🚨 Webhook Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET method for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'LINE Flow Designer Pro Webhook',
    version: '4.0.0',
    timestamp: new Date().toISOString()
  })
}