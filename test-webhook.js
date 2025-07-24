// Webhook URLのテストツール
const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/webhook';
const CHANNEL_SECRET = process.env.CHANNEL_SECRET || '7395bdad9a9f0af504d92f9ac4f84e24';

// テスト用のfollowイベント
const testFollowEvent = {
  destination: 'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  events: [
    {
      type: 'follow',
      timestamp: Date.now(),
      source: {
        type: 'user',
        userId: 'Utestuser1234567890'
      },
      replyToken: 'testreplytoken1234567890'
    }
  ]
};

// Webhookをテスト
async function testWebhook() {
  try {
    console.log('Testing webhook with follow event...');
    const response = await axios.post(WEBHOOK_URL, testFollowEvent, {
      headers: {
        'Content-Type': 'application/json',
        'X-Line-Signature': 'test-signature' // 実際の環境では署名検証が必要
      }
    });
    console.log('Response:', response.status, response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testWebhook();