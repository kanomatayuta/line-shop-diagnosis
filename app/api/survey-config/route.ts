import { NextRequest, NextResponse } from 'next/server'

// アンケート設定のメモリストレージ
let currentSurveyConfig = {
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