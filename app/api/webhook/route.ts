import { NextRequest, NextResponse } from 'next/server'
import { Client, Message, WebhookEvent, MessageEvent, PostbackEvent } from '@line/bot-sdk'
import { validateSignature } from '../../../lib/line-signature'

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
}

const client = new Client(config)

// ライブエンジンから最新フローを取得
async function getCurrentFlow() {
  try {
    const response = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/live-engine`)
    const data = await response.json()
    return data.flows?.flows?.professional_diagnosis?.nodes || {}
  } catch (error) {
    console.error('Failed to fetch flow data:', error)
    return null
  }
}

// フレックスメッセージを生成
function createFlexMessage(node: any): Message {
  const buttons = node.buttons?.map((btn: any) => ({
    type: 'button',
    action: {
      type: 'postback',
      label: btn.label,
      data: JSON.stringify({
        action: btn.action,
        value: btn.value,
        next: btn.next
      })
    },
    style: btn.style === 'primary' ? 'primary' : 'secondary'
  })) || []

  return {
    type: 'flex',
    altText: node.title || 'メッセージ',
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
            color: '#FFFFFF'
          }
        ],
        backgroundColor: node.style?.background || '#007AFF',
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
            color: '#333333'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: buttons.slice(0, 4),
        spacing: 'sm',
        paddingAll: '20px'
      }
    }
  }
}

// ユーザー状態管理（簡易版）
const userStates = new Map<string, { currentNode: string; flowData: any }>()

// メッセージイベント処理
async function handleMessage(event: MessageEvent, flowNodes: any) {
  const userId = event.source.userId!
  const userMessage = event.message.type === 'text' ? event.message.text : ''

  // 新規ユーザーまたはリスタート
  if (!userStates.has(userId) || userMessage.includes('スタート') || userMessage.includes('開始')) {
    userStates.set(userId, { 
      currentNode: 'welcome',
      flowData: flowNodes
    })
    
    const welcomeNode = flowNodes.welcome
    if (welcomeNode) {
      return createFlexMessage(welcomeNode)
    }
  }

  // 既存ユーザーの継続
  const userState = userStates.get(userId)
  if (userState?.currentNode && flowNodes[userState.currentNode]) {
    return createFlexMessage(flowNodes[userState.currentNode])
  }

  // デフォルトメッセージ
  return {
    type: 'text',
    text: '🚀 LINE Flow Designer Pro\n\n「スタート」と送信して診断を開始してください！'
  }
}

// ポストバックイベント処理
async function handlePostback(event: PostbackEvent, flowNodes: any) {
  const userId = event.source.userId!
  
  try {
    const data = JSON.parse(event.postback.data)
    const { action, value, next } = data

    // ユーザー状態更新
    if (next && flowNodes[next]) {
      userStates.set(userId, {
        currentNode: next,
        flowData: flowNodes
      })
      
      return createFlexMessage(flowNodes[next])
    }

    // アクション処理
    switch (action) {
      case 'restart':
        userStates.set(userId, {
          currentNode: 'welcome',
          flowData: flowNodes
        })
        return createFlexMessage(flowNodes.welcome)
      
      case 'view_report':
      case 'view_strategy':
      case 'view_plan':
      case 'view_comprehensive':
        return {
          type: 'text',
          text: `📊 ${value}の詳細レポートを準備中です...\n\n✨ 分析結果をお届けします！\n\n🔄 「スタート」で再診断できます。`
        }
      
      default:
        // 次のノードへ進む
        const currentState = userStates.get(userId)
        if (currentState?.currentNode && flowNodes[currentState.currentNode]) {
          return createFlexMessage(flowNodes[currentState.currentNode])
        }
    }
  } catch (error) {
    console.error('Postback handling error:', error)
  }

  return {
    type: 'text',
    text: '処理中にエラーが発生しました。「スタート」で再開してください。'
  }
}

// Webhook処理
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // 署名検証（本番環境）
    if (process.env.NODE_ENV === 'production' && config.channelSecret) {
      const isValid = validateSignature(body, config.channelSecret, signature)
      if (!isValid) {
        console.error('❌ Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const events: WebhookEvent[] = JSON.parse(body).events
    
    // 最新フローデータを取得
    const flowNodes = await getCurrentFlow()
    if (!flowNodes) {
      throw new Error('Failed to load flow data')
    }

    // 各イベントを処理
    const promises = events.map(async (event) => {
      console.log('📨 Processing event:', event.type)

      let replyMessage: Message | null = null

      switch (event.type) {
        case 'message':
          replyMessage = await handleMessage(event, flowNodes)
          break
        
        case 'postback':
          replyMessage = await handlePostback(event, flowNodes)
          break
        
        case 'follow':
          // フォロー時のウェルカムメッセージ
          const userId = event.source.userId!
          userStates.set(userId, {
            currentNode: 'welcome',
            flowData: flowNodes
          })
          replyMessage = createFlexMessage(flowNodes.welcome)
          break
      }

      // メッセージ送信
      if (replyMessage && event.replyToken) {
        try {
          await client.replyMessage(event.replyToken, replyMessage)
          console.log('✅ Message sent successfully')
        } catch (error) {
          console.error('❌ Failed to send message:', error)
        }
      }
    })

    await Promise.all(promises)

    return NextResponse.json({ 
      success: true, 
      message: 'Events processed',
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