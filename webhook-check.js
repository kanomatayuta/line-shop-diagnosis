// LINE Bot設定確認ツール
const https = require('https');

console.log('🔍 LINE Bot設定確認ツール');
console.log('=====================================');

// Webhook URL確認
const webhookUrl = 'https://line-shop-diagnosis.vercel.app/api/line-webhook';
console.log('📡 Webhook URL:', webhookUrl);

// SSL証明書確認
https.get(webhookUrl, (res) => {
  console.log('✅ SSL接続: 成功');
  console.log('📊 ステータスコード:', res.statusCode);
  console.log('🔒 SSL証明書: 有効');
  
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('💡 応答データ:', {
        status: result.status || '不明',
        service: result.service || '不明',
        hasToken: result.config?.hasToken || false,
        hasSecret: result.config?.hasSecret || false,
        clientReady: result.config?.clientReady || false
      });
    } catch (e) {
      console.log('⚠️ 応答解析エラー');
    }
  });
}).on('error', (err) => {
  console.error('❌ 接続エラー:', err.message);
});

// 設定情報表示
console.log('\n🔧 必要な設定:');
console.log('1. LINE Developers Console:');
console.log('   https://developers.line.biz/console/');
console.log('2. Webhook URL設定:');
console.log('   ' + webhookUrl);
console.log('3. Webhook: 有効にする');
console.log('4. SSL証明書の検証: 有効にする');