# LINE Bot通知修正手順

## 問題
- LINEチャットbotに通知が来ない
- Vercelで環境変数が設定されていない

## 解決方法

### 1. Vercel環境変数設定
```bash
# Vercelダッシュボードで設定
https://vercel.com/dashboard → プロジェクト選択 → Settings → Environment Variables

# 追加する環境変数:
LINE_CHANNEL_ACCESS_TOKEN=s0lQLyVcTmCUr/RwwI4C2CN1+UMV75VUPPv17Lh82f75onA/JyVqLCQ5qIvwgIvnXG2z7ciDLo2bFu687OZm598s6I6hnYX7mFkOU/CSZlSyraGpB/GkcGsBuf1aahbJAFo8pokH24ADKVCCOPpEfAdB04t89/1O/w1cDnyilFU=

LINE_CHANNEL_SECRET=7395bdad9a9f0af504d92f9ac4f84e24
```

### 2. LINE Developers Console設定確認
```
https://developers.line.biz/console/
```
- Webhook URL: https://line-shop-diagnosis.vercel.app/api/line-webhook
- Webhook: 有効
- SSL証明書の検証: 有効

### 3. 確認方法
```bash
# Webhook動作確認
curl https://line-shop-diagnosis.vercel.app/api/line-webhook

# 環境変数確認（設定後）
hasToken: true
hasSecret: true
clientReady: true
```

## 現在の状況
- ✅ サーバー動作正常
- ✅ SSL証明書有効
- ❌ 環境変数未設定（Vercel）
- ❌ LINE通知未動作

## 設定完了後の確認事項
1. Webhook URLにアクセスして設定確認
2. LINE Botに「スタート」メッセージ送信
3. アンケートフローが開始されるか確認