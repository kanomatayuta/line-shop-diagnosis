# LINE店舗売却診断ボット

LINEで簡単に店舗売却額を診断できるチャットボットです。

## 機能

- ウェルカムメッセージと診断開始ボタン
- 4つの質問による簡易診断
  - エリア（東京、埼玉、千葉、神奈川、その他）
  - 業種（飲食店、小売店、サービス業、その他）
  - 店舗の広さ（〜20坪、20〜50坪、50坪以上）
  - 営業年数（1年未満、1〜3年、3〜5年、5年以上）
- 推定売却額の表示

## デプロイ方法

### 1. LINE Developersの設定
1. [LINE Developers](https://developers.line.biz/)でプロバイダーとチャネルを作成
2. Messaging APIを有効化
3. チャネルアクセストークンとチャネルシークレットを取得

### 2. Vercelへのデプロイ
1. このリポジトリをGitHubにプッシュ
2. [Vercel](https://vercel.com)でプロジェクトをインポート
3. 環境変数を設定：
   - `CHANNEL_ACCESS_TOKEN`: LINEのチャネルアクセストークン
   - `CHANNEL_SECRET`: LINEのチャネルシークレット

### 3. Webhook URLの設定
1. Vercelのデプロイ完了後、プロジェクトURLをコピー
2. LINE DevelopersでWebhook URLを設定：`https://your-project.vercel.app/webhook`
3. Webhookを有効化

## ローカル開発

```bash
# 依存関係のインストール
npm install

# .envファイルを作成して環境変数を設定
cp .env.example .env

# 開発サーバーの起動
npm run dev
```

## 注意事項

- `.env`ファイルには実際の認証情報が含まれているため、Gitにコミットしないでください
- 本番環境では、診断ロジックをより詳細に実装することをお勧めします