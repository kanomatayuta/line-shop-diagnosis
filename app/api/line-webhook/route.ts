import { NextRequest, NextResponse } from 'next/server'
import { Client, Message, WebhookEvent, MessageEvent, PostbackEvent, FollowEvent } from '@line/bot-sdk'
import { getSurveyConfig } from '../../../lib/shared-config'
import { UserSession, RateLimitInfo } from '../../../types/survey'

// 🎯 完全版LINEアンケートツール - 設定を直接取得
function getCurrentSurveyConfig() {
  const config = getSurveyConfig()
  console.log('📋 Config loaded from shared storage:', { 
    stepCount: Object.keys(config).length,
    timestamp: new Date().toISOString()
  })
  return config
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
    ],
    displaySettings: {
      layout: 'vertical',
      buttonSize: 'md'
    }
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
    message: "◯◯さん、承知しました。\nそれでは電話で実施させていただきますので、以下のボタンからご希望の日時をお選びください 😌",
    buttons: [
      { label: "📅 予約ページを開く", action: "uri", uri: "https://timerex.net/s/rendan/bae2d85d" },
      { label: "🔄 最初からやり直す", action: "restart", next: "welcome" }
    ]
  },
  consultation_yes_5ec7367d: {
    title: "無料相談予約",
    message: "◯◯さん、承知しました。\nそれでは電話で実施させていただきますので、以下のボタンからご希望の日時をお選びください 😌",
    buttons: [
      { label: "📅 予約ページを開く", action: "uri", uri: "https://timerex.net/s/rendan/5ec7367d" },
      { label: "🔄 最初からやり直す", action: "restart", next: "welcome" }
    ]
  },
  consultation_yes_38dfc57a: {
    title: "無料相談予約",
    message: "◯◯さん、承知しました。\nそれでは電話で実施させていただきますので、以下のボタンからご希望の日時をお選びください 😌",
    buttons: [
      { label: "📅 予約ページを開く", action: "uri", uri: "https://timerex.net/s/rendan/38dfc57a" },
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

// 🛡️ 高度なユーザーセッション管理とレート制限
const userSessions = new Map<string, UserSession>()
const rateLimits = new Map<string, RateLimitInfo>()

// レート制限設定
const RATE_LIMIT_WINDOW = 10000 // 10秒
const MAX_REQUESTS_PER_WINDOW = 3 // 10秒間に3リクエストまで
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30分でセッションタイムアウト

// レート制限チェック
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimits.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    // 新しいウィンドウまたは期限切れ
    rateLimits.set(userId, {
      requests: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }
  
  if (userLimit.requests >= MAX_REQUESTS_PER_WINDOW) {
    console.log(`🚫 Rate limit exceeded for user ${userId}`)
    return false
  }
  
  userLimit.requests++
  return true
}

// 🛡️ 強化されたセッション管理
function getOrCreateSession(userId: string): UserSession {
  const now = Date.now()
  let session = userSessions.get(userId)
  
  if (!session || (now - session.lastActivity) > SESSION_TIMEOUT) {
    session = {
      currentStep: 'welcome',
      data: {},
      lastActivity: now,
      requestCount: 1
    }
    userSessions.set(userId, session)
    console.log(`🆕 New session created for user ${userId}`)
  } else {
    session.lastActivity = now
    session.requestCount = (session.requestCount || 0) + 1
    
    // セッションデータの整合性チェック
    if (!session.data) session.data = {}
    if (!session.currentStep) session.currentStep = 'welcome'
    
    console.log(`♻️ Session refreshed for user ${userId} (requests: ${session.requestCount})`)
  }
  
  return session
}

// 👤 ユーザープロフィール取得
async function getUserProfile(userId: string): Promise<string> {
  try {
    if (!lineClient) {
      console.error('❌ LINE client not initialized')
      return 'お客様'
    }
    
    const profile = await lineClient.getProfile(userId)
    console.log(`👤 User profile fetched: ${profile.displayName}`)
    return profile.displayName || 'お客様'
  } catch (error) {
    console.error('❌ Failed to get user profile:', error)
    return 'お客様'
  }
}

// 🧹 強化されたクリーンアップシステム
function cleanupOldData() {
  const now = Date.now()
  let cleanedSessions = 0
  let cleanedRateLimits = 0
  let cleanedPostbacks = 0
  
  // 古いセッションを削除
  for (const [userId, session] of Array.from(userSessions.entries())) {
    if ((now - session.lastActivity) > SESSION_TIMEOUT) {
      userSessions.delete(userId)
      cleanedSessions++
    }
  }
  
  // 期限切れのレート制限データを削除
  for (const [userId, limit] of Array.from(rateLimits.entries())) {
    if (now > limit.resetTime) {
      rateLimits.delete(userId)
      cleanedRateLimits++
    }
  }
  
  // 古いポストバックデータを削除（30分以上古いものを削除）
  for (const [userId, postbacks] of Array.from(processedPostbacks.entries())) {
    const validPostbacks = postbacks.filter(pb => {
      return (now - pb.timestamp) < POSTBACK_EXPIRY_TIME
    })
    
    if (validPostbacks.length === 0) {
      processedPostbacks.delete(userId)
      cleanedPostbacks++
    } else if (validPostbacks.length !== postbacks.length) {
      processedPostbacks.set(userId, validPostbacks)
    }
  }
  
  if (cleanedSessions > 0 || cleanedRateLimits > 0 || cleanedPostbacks > 0) {
    console.log(`🧹 Cleanup completed: ${cleanedSessions} sessions, ${cleanedRateLimits} rate limits, ${cleanedPostbacks} postback caches`)
  }
}

// 定期的なクリーンアップ（5分ごと）
setInterval(cleanupOldData, 5 * 60 * 1000)

// 強化された動的アンケート設定を取得
async function getDynamicSurveyConfig() {
  try {
    console.log('🔄 Fetching dynamic survey configuration...')
    const config = await getCurrentSurveyConfig()
    
    if (config && typeof config === 'object') {
      const stepCount = Object.keys(config).length
      console.log(`✅ Dynamic config loaded successfully with ${stepCount} steps`)
      
      // 設定の検証
      const hasWelcome = 'welcome' in config
      const hasValidSteps = Object.values(config).every((step: any) => 
        step && typeof step === 'object' && 'title' in step && 'message' in step
      )
      
      if (!hasWelcome) {
        console.warn('⚠️ Warning: No welcome step found in dynamic config')
      }
      
      if (!hasValidSteps) {
        console.warn('⚠️ Warning: Some steps in dynamic config are invalid')
      }
      
      return config
    }
    
    throw new Error('Invalid config structure')
  } catch (error) {
    console.error('❌ Failed to get dynamic config, using fallback:', error)
    console.log('🔄 Fallback config has', Object.keys(STEP_BY_STEP_SURVEY).length, 'steps')
    return STEP_BY_STEP_SURVEY
  }
}

// iOS Design System Colors
const iosColors = {
  primary: '#304992',           // メインカラー
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPurple: '#AF52DE',
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  quaternaryLabel: '#3C3C432E',
  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  tertiaryBackground: '#FFFFFF',
}

// 💬 メッセージに名前を挿入
function personalizeMessage(message: string, userName: string): string {
  return message.replace(/◯◯さん/g, `${userName}さん`)
}

// 🌟 限界を越えたシンプル美学メッセージ作成
function createUltimateSimpleMessage(step: any, userName?: string): Message {
  console.log(`🎯 Creating ultra-simple message: ${step.title}`)
  
  // 表示設定に基づくレイアウト判定
  const displaySettings = step.displaySettings || { layout: 'vertical', buttonSize: 'sm' }
  const useCarousel = displaySettings.layout === 'carousel' && step.buttons && step.buttons.length > 4
  
  if (useCarousel) {
    return createUltimateSimpleCarousel(step, userName)
  }
  
  // メッセージの個人化
  const personalizedMessage = userName ? personalizeMessage(step.message, userName) : step.message
  
  // 表示設定を反映したボタン作成
  const buttonHeight = displaySettings.buttonSize || 'sm'
  const buttons = step.buttons?.map((btn: any, index: number) => {
    // URIアクションの場合
    if (btn.action === 'uri' && btn.uri) {
      return {
        type: 'button',
        action: {
          type: 'uri',
          label: btn.label,
          uri: btn.uri
        },
        style: 'primary',
        color: '#007AFF',
        height: buttonHeight
      }
    }
    
    // 通常のポストバックアクション
    return {
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
      color: '#007AFF',
      height: buttonHeight
    }
  }) || []

  return {
    type: 'flex',
    altText: step.title,
    contents: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: step.title,
            weight: 'bold',
            size: 'lg',
            color: '#000000',
            margin: 'none'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: personalizedMessage,
            wrap: true,
            size: 'md',
            color: '#333333',
            margin: 'md',
            lineSpacing: '6px'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#FFFFFF'
      },
      footer: buttons.length > 0 ? {
        type: 'box',
        layout: 'vertical',
        contents: buttons,
        spacing: 'sm',
        paddingAll: '20px',
        backgroundColor: '#FFFFFF'
      } : undefined,
      styles: {
        body: { separator: false },
        footer: { separator: false }
      }
    }
  }
}

// 🎯 極限シンプルカルーセル（多数のボタン用）
function createUltimateSimpleCarousel(step: any, userName?: string): Message {
  const personalizedMessage = userName ? personalizeMessage(step.message, userName) : step.message
  const buttonsPerCard = 2
  const cards = []
  
  for (let i = 0; i < step.buttons.length; i += buttonsPerCard) {
    const cardButtons = step.buttons.slice(i, i + buttonsPerCard).map((btn: any) => {
      // URIアクションの場合
      if (btn.action === 'uri' && btn.uri) {
        return {
          type: 'button',
          action: {
            type: 'uri',
            label: btn.label,
            uri: btn.uri
          },
          style: 'primary',
          color: '#007AFF',
          height: 'sm'
        }
      }
      
      // 通常のポストバックアクション
      return {
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
        color: '#007AFF',
        height: 'sm'
      }
    })

    cards.push({
      type: 'bubble',
      size: 'micro',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          ...(i === 0 ? [
            {
              type: 'text',
              text: step.title,
              weight: 'bold',
              size: 'md',
              color: '#000000',
              margin: 'none'
            },
            {
              type: 'separator',
              margin: 'sm'
            },
            {
              type: 'text',
              text: personalizedMessage,
              wrap: true,
              size: 'sm',
              color: '#333333',
              margin: 'sm'
            }
          ] : [
            {
              type: 'text',
              text: '選択してください',
              weight: 'bold',
              size: 'md',
              color: '#000000',
              align: 'center'
            }
          ])
        ],
        paddingAll: '16px',
        backgroundColor: '#FFFFFF'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: cardButtons,
        spacing: 'sm',
        paddingAll: '16px',
        backgroundColor: '#FFFFFF'
      },
      styles: {
        body: { separator: false },
        footer: { separator: false }
      }
    })
  }

  return {
    type: 'flex',
    altText: step.title,
    contents: {
      type: 'carousel',
      contents: cards
    }
  }
}

// 🎯 完全版メッセージ処理（レート制限付き）
async function handleCompleteMessage(event: MessageEvent): Promise<Message | null> {
  const userId = event.source.userId!
  const text = event.message.type === 'text' ? event.message.text : ''
  
  console.log(`📨 Message from ${userId}: ${text}`)
  
  // レート制限チェック
  if (!checkRateLimit(userId)) {
    return {
      type: 'text',
      text: '⏰ 少し間をおいてから再度お試しください。\n\n連続でのご利用を制限させていただいております。'
    }
  }

  // セッション取得または作成
  const session = getOrCreateSession(userId)
  
  // ユーザー名を取得（初回のみ）
  if (!session.userName) {
    session.userName = await getUserProfile(userId)
    console.log(`📝 User name stored: ${session.userName}`)
  }
  
  // スタート系のワード（無料診断も追加）
  if (text.includes('スタート') || 
      text.includes('開始') ||
      text.includes('はじめ') ||
      text.includes('診断') ||
      text.includes('無料診断') ||
      text.includes('無料') ||
      text.includes('START') ||
      text.includes('start')) {
    
    console.log(`🚀 Starting survey for ${userId} with trigger: ${text}`)
    const config = getCurrentSurveyConfig()
    session.currentStep = 'welcome'
    session.data = {}
    return createUltimateSimpleMessage(config.welcome, session.userName)
  }

  // 現在のステップを継続
  const config = getCurrentSurveyConfig()
  const currentStep = config[session.currentStep]
  if (currentStep) {
    return createUltimateSimpleMessage(currentStep, session.userName)
  }

  // 🎯 極限シンプルなデフォルトメッセージ
  return {
    type: 'flex',
    altText: '店舗売却診断',
    contents: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '店舗売却診断',
            weight: 'bold',
            size: 'lg',
            color: '#000000',
            margin: 'none'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'たった1分で店舗の売却可能額を診断します。\n\n以下のボタンから開始してください。',
            wrap: true,
            size: 'md',
            color: '#333333',
            margin: 'md',
            lineSpacing: '6px'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#FFFFFF'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '診断を開始する',
              data: JSON.stringify({
                action: 'start',
                value: 'start',
                next: 'welcome'
              })
            },
            style: 'primary',
            color: '#007AFF',
            height: 'sm'
          }
        ],
        spacing: 'sm',
        paddingAll: '20px',
        backgroundColor: '#FFFFFF'
      },
      styles: {
        body: { separator: false },
        footer: { separator: false }
      }
    }
  }
}

// 🛡️ 強化された重複押下防止システム
const processedPostbacks = new Map<string, Array<{data: string, timestamp: number, step: string}>>()
const POSTBACK_EXPIRY_TIME = 30 * 60 * 1000 // 30分間は重複として扱う

// 有効なステップ遷移をチェック
function isValidTransition(currentStep: string, targetStep: string): boolean {
  const config = getCurrentSurveyConfig()
  const current = config[currentStep]
  
  if (!current || !current.buttons) return false
  
  // 現在のステップのボタンから遷移可能なステップかチェック
  return current.buttons.some(button => button.next === targetStep)
}

// 🎯 完全版ポストバック処理（強化された重複防止・レート制限付き）
async function handleCompletePostback(event: PostbackEvent): Promise<Message | null> {
  const userId = event.source.userId!
  const postbackData = event.postback.data
  const currentTime = Date.now()
  
  console.log(`🔘 Postback from ${userId}: ${postbackData}`)
  
  // セッション取得（現在のステップ情報に必要）
  const session = getOrCreateSession(userId)
  
  // ユーザーのポストバック履歴を取得
  const userPostbacks = processedPostbacks.get(userId) || []
  
  // 期限切れのポストバックを削除
  const validPostbacks = userPostbacks.filter(pb => 
    currentTime - pb.timestamp < POSTBACK_EXPIRY_TIME
  )
  
  // ポストバックデータをパース
  let parsedData: any
  try {
    parsedData = JSON.parse(postbackData)
  } catch (error) {
    console.log(`⚠️ Invalid postback data: ${postbackData}`)
    return null
  }
  
  // 厳密な重複・古いステップチェック
  const isDuplicateData = validPostbacks.some(pb => pb.data === postbackData)
  
  // 現在のステップと異なるステップへの遷移を試みる古いボタンをチェック
  const isInvalidTransition = parsedData.next && 
                             session.currentStep !== 'welcome' && // ウェルカムステップは常に許可
                             parsedData.next !== session.currentStep &&
                             !isValidTransition(session.currentStep, parsedData.next)
  
  if (isDuplicateData) {
    console.log(`🚫 Duplicate postback data ignored for ${userId}: ${postbackData}`)
    return {
      type: 'text',
      text: '⚠️ このボタンは既に処理済みです。\n\n最新のメッセージから操作をお願いします。'
    }
  }
  
  if (isInvalidTransition) {
    console.log(`🚫 Invalid transition attempt for ${userId}. Current: ${session.currentStep}, Target: ${parsedData.next}`)
    return {
      type: 'text',
      text: '⚠️ 古いメッセージのボタンが押されました。\n\n現在の質問に回答してください。'
    }
  }
  
  // レート制限チェック
  if (!checkRateLimit(userId)) {
    return {
      type: 'text',
      text: '⏰ 少し間をおいてから再度お試しください。\n\n連続でのご利用を制限させていただいております。'
    }
  }
  
  // 新しいポストバックを記録
  validPostbacks.push({
    data: postbackData,
    timestamp: currentTime,
    step: session.currentStep
  })
  processedPostbacks.set(userId, validPostbacks)
  
  // ポストバック履歴の上限チェック（20個以上になったら古いものを削除）
  if (validPostbacks.length > 20) {
    const sortedPostbacks = validPostbacks.sort((a, b) => b.timestamp - a.timestamp)
    processedPostbacks.set(userId, sortedPostbacks.slice(0, 20))
  }
  
  try {
    const { action, value, next } = parsedData
    
    // ユーザー名を取得（初回のみ）
    if (!session.userName) {
      session.userName = await getUserProfile(userId)
      console.log(`📝 User name stored: ${session.userName}`)
    }

    // 回答データを保存して次のステップに進む
    if (next) {
      const config = getCurrentSurveyConfig()
      const nextStep = config[next]
      
      if (nextStep) {
        console.log(`➡️ Moving to step: ${next}`)
        
        // 回答データを保存
        if (action && value) {
          session.data[action] = value
        }
        
        session.currentStep = next
        return createUltimateSimpleMessage(nextStep, session.userName)
      }
    }

    // 特別なアクション
    switch (action) {
      case 'restart':
        const config = getCurrentSurveyConfig()
        session.currentStep = 'welcome'
        session.data = {}
        return createUltimateSimpleMessage(config.welcome, session.userName)
      
      case 'report':
        return {
          type: 'text',
          text: `📊 診断レポート\n\n✨ ${session.userName}さんの回答結果：\n📍 エリア: ${session.data.area || '未回答'}\n💼 経営状況: ${session.data.business_status || '未回答'}\n💰 営業利益: ${session.data.annual_profit || '未回答'}\n🏢 階数: ${session.data.floor_level || '未回答'}\n🏪 商業施設: ${session.data.commercial_facility || '未回答'}\n📦 固定資産: ${session.data.fixed_assets || '未回答'}\n👥 従業員: ${session.data.employees || '未回答'}\n\n🔄 再診断は「診断開始」で！`
        }
      
      case 'consultation':
        return {
          type: 'text',
          text: `💬 ${session.userName}さん、個別相談のお申し込みありがとうございます！\n\n📋 診断結果を基に専門スタッフがご提案いたします。\n📞 近日中にご連絡させていただきます。`
        }
      
      case 'start':
        const startConfig = getCurrentSurveyConfig()
        session.currentStep = 'area'
        session.data = {}
        return createUltimateSimpleMessage(startConfig.area, session.userName)
      
      default:
        return {
          type: 'text',
          text: `✅ 回答を記録しました\n\n📝 ${action}: ${value}\n\n続行は「スタート」で！`
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
  console.log('🌐 Request URL:', request.url)
  console.log('📍 Method:', request.method)
  
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature')
    
    console.log('📦 Body length:', body.length)
    console.log('🔑 Has signature:', !!signature)
    
    // 基本的なボディ検証
    if (!body || body.length === 0) {
      console.error('❌ Empty request body')
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }

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

    let parsedBody
    try {
      parsedBody = JSON.parse(body)
    } catch (parseError) {
      console.error('❌ Invalid JSON body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    
    const events: WebhookEvent[] = parsedBody.events || []
    console.log(`🚀 PROCESSING ${events.length} ULTIMATE EVENTS`)
    
    if (events.length === 0) {
      console.log('ℹ️ No events to process')
      return NextResponse.json({ success: true, message: 'No events' })
    }

    // 限界を越えた処理
    for (const event of events) {
      console.log(`⚡ Event: ${event.type}`)
      
      let ultimateMessage: Message | null = null

      switch (event.type) {
        case 'message':
          console.log('💬 Message event')
          ultimateMessage = await handleCompleteMessage(event as MessageEvent)
          break
        
        case 'postback':
          console.log('🔘 Postback event')
          ultimateMessage = await handleCompletePostback(event as PostbackEvent)
          break
        
        case 'follow':
          console.log('👋 Follow event - Starting survey')
          const userId = event.source.userId!
          const session = getOrCreateSession(userId)
          
          // ユーザー名を取得
          session.userName = await getUserProfile(userId)
          console.log(`📝 User name stored: ${session.userName}`)
          
          const config = getCurrentSurveyConfig()
          session.currentStep = 'welcome'
          session.data = {}
          ultimateMessage = createUltimateSimpleMessage(config.welcome, session.userName)
          break
          
        default:
          console.log(`❓ Unknown event: ${event.type}`)
      }

      // 🛡️ 完全版メッセージ送信（nullチェック付き）
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
            tokenStart: LINE_CONFIG.channelAccessToken?.substring(0, 10) || 'NO_TOKEN',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            replyToken: event.replyToken,
            userId: event.source.userId
          })
        }
      } else if (ultimateMessage === null) {
        // null の場合（重複ボタン押下など）は何もしない
        console.log('🚫 Message skipped (null response - likely duplicate postback)')
      } else if (!ultimateMessage) {
        console.log('⚠️ No message to send')
      } else if (!('replyToken' in event) || !event.replyToken) {
        console.log('⚠️ No reply token available')
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