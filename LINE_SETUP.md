# 🚀 LINE Bot セットアップガイド

## 1. LINE Developers Console設定

### チャンネル作成
1. [LINE Developers Console](https://developers.line.biz/) にアクセス
2. 新しいプロバイダーまたは既存のプロバイダーを選択
3. 「Messaging API」チャンネルを作成

### 必要な設定値
以下の情報をコピーしてください：
- **Channel Access Token** (長期)
- **Channel Secret**

### Webhook URL設定
Messaging API設定で以下のURLを設定：
```
https://line-shop-diagnosis.vercel.app/api/webhook
```

## 2. 環境変数設定

Vercelの環境変数に以下を設定：

```bash
LINE_CHANNEL_ACCESS_TOKEN=your_actual_channel_access_token
LINE_CHANNEL_SECRET=your_actual_channel_secret
VERCEL_URL=line-shop-diagnosis.vercel.app
NODE_ENV=production
```

## 3. Bot設定

### 基本設定
- **応答メッセージ**: オフ
- **Webhook**: オン
- **グループトーク参加**: お好みで

### 機能
- **リッチメニュー**: 任意
- **友だち追加時あいさつメッセージ**: システムが自動処理

## 4. テスト方法

### 手動テスト
1. LINE公式アカウントを友だち追加
2. 「スタート」と送信
3. フローが開始されることを確認

### デバッグ
Vercelのログで以下を確認：
- `📨 Processing event: message`
- `✅ Message sent successfully`

## 5. トラブルシューティング

### よくある問題

**通知が来ない場合**
1. Channel Access Tokenが正しく設定されているか確認
2. Webhook URLが正しく設定されているか確認
3. Vercelの環境変数が正しく設定されているか確認

**エラーが発生する場合**
1. Vercelのログを確認
2. LINE Developers Consoleのエラーログを確認
3. 署名検証エラーがないか確認

### ログ確認方法
```bash
# Vercelのログを確認
vercel logs line-shop-diagnosis
```

## 6. 管理画面アクセス

- **ダッシュボード**: https://line-shop-diagnosis.vercel.app/
- **フローデザイナー**: https://line-shop-diagnosis.vercel.app/designer
- **API**: https://line-shop-diagnosis.vercel.app/api/live-engine

## 7. カスタマイズ

フローの内容は `/app/api/live-engine/route.ts` または管理画面から変更可能です。
変更は即座にLINE Botに反映されます。