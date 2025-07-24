const line = require('@line/bot-sdk');

// LINE設定
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// ユーザーの診断状態を保存
const userStates = {};

module.exports = async (req, res) => {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Line-Signature');

  // OPTIONSリクエストへの対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Webhook received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  try {
    // リクエストボディの検証
    if (!req.body) {
      console.log('No body in request');
      return res.status(200).json({ message: 'OK' });
    }

    const events = req.body.events;
    
    // イベントがない場合も200を返す（LINE Webhook検証用）
    if (!events || events.length === 0) {
      console.log('No events in body');
      return res.status(200).json({ message: 'OK' });
    }

    // イベント処理
    await Promise.all(events.map(handleEvent));
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // エラーが発生しても200を返す（LINEの仕様）
    res.status(200).json({ message: 'Error occurred but returning 200' });
  }
};

async function handleEvent(event) {
  console.log('Event:', event);
  
  if (event.type === 'follow') {
    return sendWelcomeMessage(event.replyToken);
  }
  
  if (event.type === 'message' && event.message.type === 'text') {
    const text = event.message.text;
    const userId = event.source.userId;
    
    if (text === '診断開始' || text === '最初から') {
      userStates[userId] = { step: 'area' };
      return sendAreaQuestion(event.replyToken);
    }
  }
  
  if (event.type === 'postback') {
    const userId = event.source.userId;
    const data = JSON.parse(event.postback.data);
    
    switch (data.action) {
      case 'start':
        userStates[userId] = { step: 'area' };
        return sendAreaQuestion(event.replyToken);
        
      case 'area':
        if (!userStates[userId]) userStates[userId] = {};
        userStates[userId].area = data.value;
        userStates[userId].step = 'business_type';
        return sendBusinessTypeQuestion(event.replyToken);
        
      case 'business_type':
        userStates[userId].businessType = data.value;
        userStates[userId].step = 'size';
        return sendSizeQuestion(event.replyToken);
        
      case 'size':
        userStates[userId].size = data.value;
        userStates[userId].step = 'years';
        return sendYearsQuestion(event.replyToken);
        
      case 'years':
        userStates[userId].years = data.value;
        return sendDiagnosisResult(event.replyToken, userStates[userId]);
    }
  }
  
  return null;
}

function sendWelcomeMessage(replyToken) {
  const message = {
    type: 'flex',
    altText: '店舗売却LINE診断へようこそ',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '店舗売却LINE診断',
            weight: 'bold',
            size: 'xl',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'Goodbuyが運営する「店舗売却LINE診断」にご登録いただきありがとうございます。',
            size: 'sm',
            wrap: true,
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'たった1分のアンケートに回答するだけで、店舗売却可能額がいくらになるか診断いたします♪',
            size: 'sm',
            wrap: true,
            margin: 'lg'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '無料診断はこちら！',
              data: JSON.stringify({ action: 'start' }),
              displayText: '診断開始'
            }
          }
        ]
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendAreaQuestion(replyToken) {
  const message = {
    type: 'text',
    text: 'まずは、以下の簡単なご質問にお答えください。\n\nお店のエリアはどちらでしょうか？',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '東京',
            data: JSON.stringify({ action: 'area', value: 'tokyo' }),
            displayText: '東京'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '埼玉',
            data: JSON.stringify({ action: 'area', value: 'saitama' }),
            displayText: '埼玉'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '千葉',
            data: JSON.stringify({ action: 'area', value: 'chiba' }),
            displayText: '千葉'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '神奈川',
            data: JSON.stringify({ action: 'area', value: 'kanagawa' }),
            displayText: '神奈川'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: 'その他',
            data: JSON.stringify({ action: 'area', value: 'other' }),
            displayText: 'その他'
          }
        }
      ]
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendBusinessTypeQuestion(replyToken) {
  const message = {
    type: 'text',
    text: '店舗の業種を教えてください',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '飲食店',
            data: JSON.stringify({ action: 'business_type', value: 'restaurant' }),
            displayText: '飲食店'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '小売店',
            data: JSON.stringify({ action: 'business_type', value: 'retail' }),
            displayText: '小売店'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: 'サービス業',
            data: JSON.stringify({ action: 'business_type', value: 'service' }),
            displayText: 'サービス業'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: 'その他',
            data: JSON.stringify({ action: 'business_type', value: 'other' }),
            displayText: 'その他'
          }
        }
      ]
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendSizeQuestion(replyToken) {
  const message = {
    type: 'text',
    text: '店舗の広さはどのくらいですか？',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '〜20坪',
            data: JSON.stringify({ action: 'size', value: 'small' }),
            displayText: '〜20坪'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '20〜50坪',
            data: JSON.stringify({ action: 'size', value: 'medium' }),
            displayText: '20〜50坪'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '50坪以上',
            data: JSON.stringify({ action: 'size', value: 'large' }),
            displayText: '50坪以上'
          }
        }
      ]
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendYearsQuestion(replyToken) {
  const message = {
    type: 'text',
    text: '営業年数を教えてください',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '1年未満',
            data: JSON.stringify({ action: 'years', value: 'less1' }),
            displayText: '1年未満'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '1〜3年',
            data: JSON.stringify({ action: 'years', value: '1to3' }),
            displayText: '1〜3年'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '3〜5年',
            data: JSON.stringify({ action: 'years', value: '3to5' }),
            displayText: '3〜5年'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '5年以上',
            data: JSON.stringify({ action: 'years', value: 'over5' }),
            displayText: '5年以上'
          }
        }
      ]
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendDiagnosisResult(replyToken, userData) {
  let basePrice = 500;
  
  const areaMultiplier = {
    tokyo: 1.5,
    kanagawa: 1.3,
    saitama: 1.1,
    chiba: 1.1,
    other: 1.0
  };
  
  const businessMultiplier = {
    restaurant: 1.2,
    retail: 1.0,
    service: 1.1,
    other: 0.9
  };
  
  const sizeMultiplier = {
    small: 0.8,
    medium: 1.0,
    large: 1.3
  };
  
  const yearsMultiplier = {
    less1: 0.7,
    '1to3': 0.9,
    '3to5': 1.0,
    over5: 1.1
  };
  
  const estimatedPrice = Math.round(
    basePrice * 
    areaMultiplier[userData.area] * 
    businessMultiplier[userData.businessType] * 
    sizeMultiplier[userData.size] * 
    yearsMultiplier[userData.years]
  );
  
  const minPrice = Math.round(estimatedPrice * 0.8);
  const maxPrice = Math.round(estimatedPrice * 1.2);
  
  const message = {
    type: 'flex',
    altText: '診断結果',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '診断結果',
            weight: 'bold',
            size: 'xl',
            margin: 'md',
            align: 'center'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'あなたの店舗の推定売却額は',
            size: 'md',
            margin: 'lg',
            align: 'center'
          },
          {
            type: 'text',
            text: `${minPrice}万円 〜 ${maxPrice}万円`,
            weight: 'bold',
            size: 'xxl',
            margin: 'lg',
            align: 'center',
            color: '#FF6B6B'
          },
          {
            type: 'text',
            text: '※この金額は簡易診断による目安です。\n実際の売却額は詳細な査定により変動します。',
            size: 'xs',
            wrap: true,
            margin: 'lg',
            color: '#666666'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '詳細査定を申し込む',
              uri: 'https://example.com/contact'
            }
          },
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'message',
              label: 'もう一度診断する',
              text: '最初から'
            }
          }
        ]
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}