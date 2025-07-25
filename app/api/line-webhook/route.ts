import { NextRequest, NextResponse } from 'next/server'
import { Client, Message, WebhookEvent, MessageEvent, PostbackEvent, FollowEvent } from '@line/bot-sdk'

// 動的設定の取得（ローカル関数として実装）
async function getCurrentSurveyConfig() {
  try {
    // API エンドポイントから設定を取得
    const response = await fetch(`${process.env.VERCEL_URL || 'https://line-shop-diagnosis.vercel.app'}/api/survey-config`)
    const data = await response.json()
    if (data.success) {
      return data.config
    }
  } catch (error) {
    console.error('Failed to fetch dynamic config:', error)
  }
  
  // フォールバック設定
  return STEP_BY_STEP_SURVEY
}

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

// ステップ形式のアンケートシステム（店舗売却診断）
const STEP_BY_STEP_SURVEY = {
  welcome: {
    title: "店舗売却LINE診断",
    message: "Goodbuyが運営する\n「店舗売却LINE診断」に\nご登録いただきありがとうございます🌼\n\nたった1分のアンケートに回答するだけで、\n店舗売却額可能額がいくらになるか診断いたします 📈\n\nまずは、以下の簡単なご質問にお答えください😊\n\n無料診断はこちら！\n※タップしてスタート",
    buttons: [
      { label: "診断開始", action: "start", next: "area" }
    ]
  },
  area: {
    title: "エリア選択",
    message: "お店のエリアはどちらでしょうか？",
    buttons: [
      { label: "東京", action: "area", value: "tokyo", next: "business_status" },
      { label: "埼玉", action: "area", value: "saitama", next: "business_status" },
      { label: "千葉", action: "area", value: "chiba", next: "business_status" },
      { label: "神奈川", action: "area", value: "kanagawa", next: "business_status" },
      { label: "その他", action: "area", value: "other", next: "rejection_other" }
    ]
  },
  business_status: {
    title: "経営状況",
    message: "経営状況を教えてください",
    buttons: [
      { label: "黒字", action: "business_status", value: "profit", next: "annual_profit" },
      { label: "赤字", action: "business_status", value: "loss", next: "floor_level" }
    ]
  },
  annual_profit: {
    title: "営業利益",
    message: "年間の営業利益について教えてください",
    buttons: [
      { label: "0〜300万円", action: "annual_profit", value: "0-300", next: "result_500" },
      { label: "300万円〜1,000万円", action: "annual_profit", value: "300-1000", next: "result_1000" },
      { label: "1,000万円以上", action: "annual_profit", value: "1000+", next: "result_2000" }
    ]
  },
  floor_level: {
    title: "階数",
    message: "お店の階数について教えてください",
    buttons: [
      { label: "1階ですか？", action: "floor_level", value: "first", next: "result_500" },
      { label: "1階以外(地下 or 2階以上)ですか？", action: "floor_level", value: "other", next: "commercial_facility" }
    ]
  },
  commercial_facility: {
    title: "商業施設",
    message: "商業施設に出店されていますか？",
    buttons: [
      { label: "はい", action: "commercial_facility", value: "yes", next: "result_1000" },
      { label: "いいえ", action: "commercial_facility", value: "no", next: "fixed_assets" }
    ]
  },
  fixed_assets: {
    title: "固定資産",
    message: "固定資産はありますか？",
    buttons: [
      { label: "引き継げる固定資産がある", action: "fixed_assets", value: "inheritable", next: "employees" },
      { label: "固定資産もリースもある", action: "fixed_assets", value: "mixed", next: "employees" },
      { label: "リースのみで運営しており固定資産はない", action: "fixed_assets", value: "lease_only", next: "rejection_lease" }
    ]
  },
  employees: {
    title: "従業員",
    message: "従業員(アルバイト含む)について教えてください",
    buttons: [
      { label: "引き継げる従業員がいる", action: "employees", value: "inheritable", next: "result_300" },
      { label: "従業員は引き継ぎ不可", action: "employees", value: "not_inheritable", next: "result_300" }
    ]
  },
  result_500: {
    title: "診断結果",
    message: "🙌 ご回答ありがとうございます！\n\n◯◯さんの回答結果を踏まえて、過去事例に照らすと、以下になります。\n\n売却可能額 500万円以上\n\n※あくまでも簡易推計です。ご参考までにご覧ください。\n\n店舗売却には抑えるべきポイントが複数ございます💡\n\n経営状況🔎 が良いだけでは売却を成功することはできません。\n購入希望者にアプローチするにあたり必要なものや、押さえるべきポイントを押さえるだけでスムーズに売却が可能です。\n\n現在アンケートにお答え頂いた方限定で、5分ほどお電話でオーナー様の出口戦略についてお伝えしております。\nご相談の段階で当社への費用は一切かかりませんので、お気軽にお問い合わせくださいませ😊",
    buttons: [
      { label: "無料相談を希望する", action: "consultation", value: "yes", next: "consultation_yes_bae2d85d" },
      { label: "無料相談を希望しない", action: "consultation", value: "no", next: "consultation_no" }
    ]
  },
  result_1000: {
    title: "診断結果",
    message: "🙌 ご回答ありがとうございます！\n\n◯◯さんの回答結果を踏まえて、過去事例に照らすと、以下になります。\n\n売却可能額 1,000万円以上\n\n※あくまでも簡易推計です。ご参考までにご覧ください。\n\n店舗売却には抑えるべきポイントが複数ございます 💡\n\n経営状況🔎 が良いだけでは売却を成功することはできません。\n購入希望者にアプローチするにあたり必要なものや、押さえるべきポイントを押さえるだけでスムーズに売却が可能です。\n\n現在アンケートにお答え頂いた方限定で、5分ほどお電話でオーナー様の出口戦略についてお伝えしております。\nご相談の段階で当社への費用は一切かかりませんので、お気軽にお問い合わせくださいませ 😊",
    buttons: [
      { label: "無料相談を希望する", action: "consultation", value: "yes", next: "consultation_yes_bae2d85d" },
      { label: "無料相談を希望しない", action: "consultation", value: "no", next: "consultation_no" }
    ]
  },
  result_2000: {
    title: "診断結果",
    message: "🙌 ご回答ありがとうございます！\n\n◯◯さんの回答結果を踏まえて、過去事例に照らすと、以下になります。\n\n売却可能額 2,000万円以上\n\n※あくまでも簡易推計です。ご参考までにご覧ください。\n\n店舗売却には抑えるべきポイントが複数ございます 💡\n\n経営状況🔎 が良いだけでは売却を成功することはできません。\n購入希望者にアプローチするにあたり必要なものや、押さえるべきポイントを押さえるだけでスムーズに売却が可能です。\n\n現在アンケートにお答え頂いた方限定で、5分ほどお電話でオーナー様の出口戦略についてお伝えしております。\nご相談の段階で当社への費用は一切かかりませんので、お気軽にお問い合わせくださいませ 😊",
    buttons: [
      { label: "無料相談を希望する", action: "consultation", value: "yes", next: "consultation_yes_bae2d85d" },
      { label: "無料相談を希望しない", action: "consultation", value: "no", next: "consultation_no" }
    ]
  },
  result_300: {
    title: "診断結果",
    message: "🙌 ご回答ありがとうございます！\n\n◯◯さんの回答結果を踏まえて、過去事例に照らすと、以下になります。\n\n売却可能額 300万円以上\n\n※あくまでも簡易推計です。ご参考までにご覧ください。\n\n店舗売却には抑えるべきポイントが複数ございます 💡\n\n経営状況🔎 が良いだけでは売却を成功することはできません。\n購入希望者にアプローチするにあたり必要なものや、押さえるべきポイントを押さえるだけでスムーズに売却が可能です。\n\n現在アンケートにお答え頂いた方限定で、5分ほどお電話でオーナー様の出口戦略についてお伝えしております。\nご相談の段階で当社への費用は一切かかりませんので、お気軽にお問い合わせくださいませ 😊",
    buttons: [
      { label: "無料相談を希望する", action: "consultation", value: "yes", next: "consultation_yes_bae2d85d" },
      { label: "無料相談を希望しない", action: "consultation", value: "no", next: "consultation_no" }
    ]
  },
  rejection_lease: {
    title: "お断り",
    message: "◯◯さん、アンケートのご回答ありがとうございます！\n\n大変申し訳ありませんが、店舗の所在地の関係で店舗売却の可能性が低い結果となりました。。\nしかし、店舗の状況次第では売却可能性が出てくる場合もございます。\n\n閉店する際に、退去費用などがかかり気軽に撤退できない方がたくさんいらっしゃいます 😊\n現在アンケートにお答え頂いた方限定で、5分ほど店舗オーナーの方の出口戦略についてお伝えしております ⭐️\n\nご興味がございましたらお気軽にお問い合わせくださいませ 💡",
    buttons: [
      { label: "無料相談を希望する", action: "consultation", value: "yes", next: "consultation_yes_5ec7367d" },
      { label: "無料相談を希望しない", action: "consultation", value: "no", next: "consultation_no" }
    ]
  },
  rejection_other: {
    title: "お断り",
    message: "◯◯さん、アンケートのご回答ありがとうございます！\n\n大変申し訳ありませんが、店舗の所在地の関係で店舗売却の可能性が低い結果となりました。。\nしかし、店舗の状況次第では売却可能性が出てくる場合もございます。\n\n閉店する際に、退去費用などがかかり気軽に撤退できない方がたくさんいらっしゃいます😊\n現在アンケートにお答え頂いた方限定で、5分ほど店舗オーナーの方の出口戦略についてお伝えしております⭐️\n\nご興味がございましたらお気軽にお問い合わせくださいませ💡",
    buttons: [
      { label: "無料相談を希望する", action: "consultation", value: "yes", next: "consultation_yes_38dfc57a" },
      { label: "無料相談を希望しない", action: "consultation", value: "no", next: "consultation_no" }
    ]
  },
  consultation_yes_bae2d85d: {
    title: "無料相談予約",
    message: "◯◯さん、承知しました。\nそれでは電話で実施させていたきますので、以下のリンクからご希望の日時をお選びください 😌\n\nhttps://timerex.net/s/rendan/bae2d85d",
    buttons: [
      { label: "🔄 最初からやり直す", action: "restart", next: "welcome" }
    ]
  },
  consultation_yes_5ec7367d: {
    title: "無料相談予約",
    message: "◯◯さん、承知しました。\nそれでは電話で実施させていたきますので、以下のリンクからご希望の日時をお選びください 😌\n\nhttps://timerex.net/s/rendan/5ec7367d",
    buttons: [
      { label: "🔄 最初からやり直す", action: "restart", next: "welcome" }
    ]
  },
  consultation_yes_38dfc57a: {
    title: "無料相談予約",
    message: "◯◯さん、承知しました。\nそれでは電話で実施させていたきますので、以下のリンクからご希望の日時をお選びください 😌\n\nhttps://timerex.net/s/rendan/38dfc57a",
    buttons: [
      { label: "🔄 最初からやり直す", action: "restart", next: "welcome" }
    ]
  },
  consultation_no: {
    title: "完了",
    message: "◯◯さん、ご回答ありがとうございました！\n\nもしご興味があればいつでもお問い合わせくださいませ。",
    buttons: [
      { label: "🔄 最初からやり直す", action: "restart", next: "welcome" }
    ]
  }
}

// ユーザー状態管理
const userSessions = new Map<string, { currentStep: string; data: any }>()

// 動的アンケート設定を取得
async function getDynamicSurveyConfig() {
  try {
    return await getCurrentSurveyConfig()
  } catch (error) {
    console.error('❌ Failed to get dynamic config, using fallback:', error)
    return STEP_BY_STEP_SURVEY
  }
}

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
    const dynamicConfig = await getDynamicSurveyConfig()
    userSessions.set(userId, { currentStep: 'welcome', data: {} })
    return createUltimateFlexMessage(dynamicConfig.welcome)
  }

  // 現在の状態を確認
  const session = userSessions.get(userId)
  if (session?.currentStep) {
    const dynamicConfig = await getDynamicSurveyConfig()
    const currentStep = dynamicConfig[session.currentStep as keyof typeof dynamicConfig]
    if (currentStep) {
      return createUltimateFlexMessage(currentStep)
    }
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
    if (next) {
      const dynamicConfig = await getDynamicSurveyConfig()
      const nextStep = dynamicConfig[next as keyof typeof dynamicConfig]
      
      if (nextStep) {
        console.log(`➡️ ULTIMATE MOVE to: ${next}`)
        
        // 現在のセッションデータを取得
        const currentSession = userSessions.get(userId) || { currentStep: '', data: {} }
        
        // 回答データを保存
        const updatedData = { ...currentSession.data }
        if (action && value) {
          updatedData[action] = value
        }
        
        userSessions.set(userId, { currentStep: next, data: updatedData })
        return createUltimateFlexMessage(nextStep)
      }
    }

    // 特別なアクション
    switch (action) {
      case 'restart':
        const dynamicConfig = await getDynamicSurveyConfig()
        userSessions.set(userId, { currentStep: 'welcome', data: {} })
        return createUltimateFlexMessage(dynamicConfig.welcome)
      
      case 'report':
        const userData = userSessions.get(userId)?.data || {}
        return {
          type: 'text',
          text: `📊 詳細診断レポート\n\n✨ あなたの回答結果：\n📍 エリア: ${userData.area || '未回答'}\n💼 経営状況: ${userData.business_status || '未回答'}\n💰 営業利益: ${userData.annual_profit || '未回答'}\n🏢 階数: ${userData.floor_level || '未回答'}\n🏪 商業施設: ${userData.commercial_facility || '未回答'}\n📦 固定資産: ${userData.fixed_assets || '未回答'}\n👥 従業員: ${userData.employees || '未回答'}\n\n🔥 店舗売却の専門家が分析中...\n\n🔄 再診断は「診断開始」で！`
        }
      
      case 'consultation':
        return {
          type: 'text',
          text: `💬 個別相談お申し込みありがとうございます！\n\n📋 診断結果を基に、専門スタッフが\n🎯 あなたに最適なプランをご提案します\n\n📞 近日中にご連絡させていただきます\n\n✨ より詳しい分析をお待ちください！`
        }
      
      case 'start':
        const startConfig = await getDynamicSurveyConfig()
        userSessions.set(userId, { currentStep: 'area', data: {} })
        return createUltimateFlexMessage(startConfig.area)
      
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
          const followConfig = await getDynamicSurveyConfig()
          userSessions.set(userId, { currentStep: 'welcome', data: {} })
          ultimateMessage = createUltimateFlexMessage(followConfig.welcome)
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