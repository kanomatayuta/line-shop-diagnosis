// テスト用のシンプルなWebhookエンドポイント
module.exports = async (req, res) => {
  console.log('=== Webhook Test Endpoint ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // すべてのリクエストに対して200を返す
  res.status(200).json({ 
    status: 'ok',
    method: req.method,
    timestamp: new Date().toISOString()
  });
};