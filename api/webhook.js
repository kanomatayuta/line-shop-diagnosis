const line = require('@line/bot-sdk');

// LINE設定
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// 環境変数チェック
console.log('Environment check:', {
  hasToken: !!process.env.CHANNEL_ACCESS_TOKEN,
  hasSecret: !!process.env.CHANNEL_SECRET
});

// ユーザーの診断状態を保存
const userStates = {};

module.exports = async (req, res) => {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Line-Signature');

  // GETリクエストへの対応（ブラウザアクセス用）
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok',
      message: 'LINE Webhook endpoint is ready',
      method: 'Please use POST method for webhook'
    });
  }

  // OPTIONSリクエストへの対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== Webhook POST Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    // LINE署名検証をスキップして、まず200を返すことを優先
    
    // リクエストボディの検証
    if (!req.body) {
      console.log('No body in request - returning 200');
      return res.status(200).json({ status: 'ok', message: 'No body' });
    }

    const events = req.body.events;
    
    // イベントがない場合も200を返す（LINE Webhook検証用）
    if (!events || events.length === 0) {
      console.log('No events in body - returning 200 for verification');
      return res.status(200).json({ status: 'ok', message: 'Verification successful' });
    }

    // イベント処理
    console.log('Processing events:', events.length);
    await Promise.all(events.map(handleEvent));
    
    console.log('All events processed - returning 200');
    res.status(200).json({ status: 'ok', events: events.length });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // エラーが発生しても200を返す（LINEの仕様）
    res.status(200).json({ status: 'ok', message: 'Error occurred but returning 200' });
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
    
    // ユーザー状態の初期化
    if (!userStates[userId]) {
      userStates[userId] = { step: 'start', processing: false };
    }
    
    // 処理中の場合は無視
    if (userStates[userId].processing) {
      console.log('Processing in progress, ignoring duplicate request');
      return null;
    }
    
    // 処理開始フラグを設定
    userStates[userId].processing = true;
    
    try {
      switch (data.action) {
        case 'start':
          // 既に診断が開始されている場合は無視
          if (userStates[userId].step !== 'start' && userStates[userId].step !== 'completed') {
            console.log('Diagnosis already in progress');
            return null;
          }
          userStates[userId] = { step: 'area', processing: true };
          return sendAreaQuestion(event.replyToken);
          
        case 'area':
          // 既にエリアが選択されている場合は無視
          if (userStates[userId].step !== 'area') {
            console.log('Area already selected or wrong step');
            return null;
          }
          userStates[userId].area = data.value;
          
          // エリアが「その他」の場合は直接結果表示
          if (data.value === 'other') {
            userStates[userId].step = 'completed';
            return sendOtherAreaResult(event.replyToken);
          }
          
          // 一都三県の場合は経営状況を質問
          userStates[userId].step = 'business_status';
          return sendBusinessStatusQuestion(event.replyToken);
          
        case 'business_status':
          if (userStates[userId].step !== 'business_status') {
            console.log('Business status already selected or wrong step');
            return null;
          }
          userStates[userId].businessStatus = data.value;
          
          if (data.value === 'profitable') {
            // 黒字の場合は営業利益を質問
            userStates[userId].step = 'profit';
            return sendProfitQuestion(event.replyToken);
          } else {
            // 赤字の場合は階数を質問
            userStates[userId].step = 'floor';
            return sendFloorQuestion(event.replyToken);
          }
          
        case 'profit':
          if (userStates[userId].step !== 'profit') {
            console.log('Profit already selected or wrong step');
            return null;
          }
          userStates[userId].profit = data.value;
          userStates[userId].step = 'completed';
          return sendProfitableResult(event.replyToken, userStates[userId]);
          
        case 'floor':
          if (userStates[userId].step !== 'floor') {
            console.log('Floor already selected or wrong step');
            return null;
          }
          userStates[userId].floor = data.value;
          
          if (data.value === 'first') {
            // 1階の場合は結果表示
            userStates[userId].step = 'completed';
            return sendProfitableResult(event.replyToken, userStates[userId]);
          } else {
            // 1階以外の場合は商業施設を質問
            userStates[userId].step = 'commercial';
            return sendCommercialQuestion(event.replyToken);
          }
          
        case 'commercial':
          if (userStates[userId].step !== 'commercial') {
            console.log('Commercial already selected or wrong step');
            return null;
          }
          userStates[userId].commercial = data.value;
          
          if (data.value === 'yes') {
            // 商業施設の場合は結果表示
            userStates[userId].step = 'completed';
            return sendProfitableResult(event.replyToken, userStates[userId]);
          } else {
            // 商業施設以外の場合は固定資産を質問
            userStates[userId].step = 'assets';
            return sendAssetsQuestion(event.replyToken);
          }
          
        case 'assets':
          if (userStates[userId].step !== 'assets') {
            console.log('Assets already selected or wrong step');
            return null;
          }
          userStates[userId].assets = data.value;
          
          if (data.value === 'fixed_assets') {
            // 固定資産ありの場合は従業員を質問
            userStates[userId].step = 'employees';
            return sendEmployeesQuestion(event.replyToken);
          } else {
            // その他の場合は結果表示
            userStates[userId].step = 'completed';
            return sendLowValueResult(event.replyToken, userStates[userId]);
          }
          
        case 'employees':
          if (userStates[userId].step !== 'employees') {
            console.log('Employees already selected or wrong step');
            return null;
          }
          userStates[userId].employees = data.value;
          userStates[userId].step = 'completed';
          return sendLowValueResult(event.replyToken, userStates[userId]);
          
        case 'consultation':
          // 相談希望の処理
          userStates[userId].consultation = data.value;
          if (data.value === 'yes') {
            return sendConsultationLink(event.replyToken, userStates[userId]);
          } else {
            return sendConsultationDecline(event.replyToken);
          }
          
        default:
          console.log('Unknown action:', data.action);
          return null;
      }
    } finally {
      // 処理完了後にフラグをリセット
      if (userStates[userId]) {
        userStates[userId].processing = false;
      }
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
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🏪',
            size: '4xl',
            align: 'center',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '店舗売却LINE診断',
            weight: 'bold',
            size: 'xl',
            align: 'center',
            color: '#304992',
            margin: 'md'
          }
        ],
        backgroundColor: '#F8F9FA',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'Goodbuyが運営する「店舗売却LINE診断」\nご登録いただきありがとうございます！',
            size: 'md',
            wrap: true,
            color: '#333333',
            margin: 'md',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'たった1分のアンケートに回答するだけで、店舗売却額可能額がいくらになるか診断いたします💡',
            size: 'sm',
            wrap: true,
            color: '#333333',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'まずは、以下の簡単なご質問にお答えください😊',
            size: 'sm',
            wrap: true,
            color: '#304992',
            margin: 'lg',
            weight: 'bold'
          }
        ],
        spacing: 'md',
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'md',
            color: '#304992',
            action: {
              type: 'postback',
              label: '無料診断はこちら！',
              data: JSON.stringify({ action: 'start' }),
              displayText: '診断開始'
            }
          },
          {
            type: 'text',
            text: '※タップしてスタート',
            size: 'xs',
            color: '#666666',
            align: 'center',
            margin: 'sm'
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendAreaQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: 'エリア選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📍 Step 1/4',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'お店のエリアはどちらですか？',
            size: 'lg',
            weight: 'bold',
            color: '#333333',
            margin: 'md'
          }
        ],
        backgroundColor: '#F8F9FA',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'md',
            color: '#304992',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🗼 東京',
              data: JSON.stringify({ action: 'area', value: 'tokyo' }),
              displayText: '東京'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🏞️ 埼玉',
              data: JSON.stringify({ action: 'area', value: 'saitama' }),
              displayText: '埼玉'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🌊 千葉',
              data: JSON.stringify({ action: 'area', value: 'chiba' }),
              displayText: '千葉'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🗻 神奈川',
              data: JSON.stringify({ action: 'area', value: 'kanagawa' }),
              displayText: '神奈川'
            }
          },
          {
            type: 'button',
            style: 'link',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '📍 その他',
              data: JSON.stringify({ action: 'area', value: 'other' }),
              displayText: 'その他'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendBusinessTypeQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '業種選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🏢 Step 2/4',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '店舗の業種を教えてください',
            size: 'lg',
            weight: 'bold',
            color: '#333333',
            margin: 'md'
          }
        ],
        backgroundColor: '#F8F9FA',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'md',
            color: '#304992',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🍴 飲食店',
              data: JSON.stringify({ action: 'business_type', value: 'restaurant' }),
              displayText: '飲食店'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🛍️ 小売店',
              data: JSON.stringify({ action: 'business_type', value: 'retail' }),
              displayText: '小売店'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '💼 サービス業',
              data: JSON.stringify({ action: 'business_type', value: 'service' }),
              displayText: 'サービス業'
            }
          },
          {
            type: 'button',
            style: 'link',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🏪 その他',
              data: JSON.stringify({ action: 'business_type', value: 'other' }),
              displayText: 'その他'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendSizeQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '店舗の広さ選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📏 Step 3/4',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '店舗の広さはどのくらいですか？',
            size: 'lg',
            weight: 'bold',
            color: '#333333',
            margin: 'md'
          }
        ],
        backgroundColor: '#F8F9FA',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'md',
            color: '#304992',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🏠 〜20坪',
              data: JSON.stringify({ action: 'size', value: 'small' }),
              displayText: '〜20坪'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🏢 20〜50坪',
              data: JSON.stringify({ action: 'size', value: 'medium' }),
              displayText: '20〜50坪'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🏬 50坪以上',
              data: JSON.stringify({ action: 'size', value: 'large' }),
              displayText: '50坪以上'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendYearsQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '営業年数選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📅 Step 4/4',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '営業年数を教えてください',
            size: 'lg',
            weight: 'bold',
            color: '#333333',
            margin: 'md'
          }
        ],
        backgroundColor: '#F8F9FA',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'md',
            color: '#304992',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🌱 1年未満',
              data: JSON.stringify({ action: 'years', value: 'less1' }),
              displayText: '1年未満'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🌳 1〜3年',
              data: JSON.stringify({ action: 'years', value: '1to3' }),
              displayText: '1〜3年'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🌲 3〜5年',
              data: JSON.stringify({ action: 'years', value: '3to5' }),
              displayText: '3〜5年'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🌴 5年以上',
              data: JSON.stringify({ action: 'years', value: 'over5' }),
              displayText: '5年以上'
            }
          }
        ],
        paddingAll: '20px'
      }
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
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎉',
            size: '4xl',
            align: 'center',
            margin: 'md'
          },
          {
            type: 'text',
            text: '診断完了！',
            weight: 'bold',
            size: 'xl',
            align: 'center',
            color: '#304992',
            margin: 'sm'
          }
        ],
        backgroundColor: '#F8F9FA',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'あなたの店舗の推定売却額',
            size: 'lg',
            weight: 'bold',
            align: 'center',
            color: '#333333',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `${minPrice}万円`,
                weight: 'bold',
                size: 'xl',
                align: 'center',
                color: '#304992'
              },
              {
                type: 'text',
                text: '〜',
                size: 'lg',
                align: 'center',
                color: '#304992',
                margin: 'sm'
              },
              {
                type: 'text',
                text: `${maxPrice}万円`,
                weight: 'bold',
                size: 'xl',
                align: 'center',
                color: '#304992'
              }
            ],
            backgroundColor: '#E3F2FD',
            paddingAll: '20px',
            cornerRadius: '10px',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '💡 診断のポイント',
                size: 'md',
                weight: 'bold',
                color: '#304992',
                margin: 'md'
              },
              {
                type: 'text',
                text: '• エリアの立地条件\n• 業種による需要度\n• 店舗規模と収益性\n• 営業実績と安定性',
                size: 'sm',
                color: '#666666',
                margin: 'sm',
                wrap: true
              }
            ]
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '※この金額は簡易診断による目安です。実際の売却額は詳細な査定により変動します。',
            size: 'xs',
            wrap: true,
            margin: 'lg',
            color: '#999999',
            align: 'center'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'md',
            color: '#304992',
            action: {
              type: 'uri',
              label: '📞 詳細査定を申し込む',
              uri: 'https://example.com/contact'
            }
          },
          {
            type: 'button',
            style: 'link',
            height: 'md',
            action: {
              type: 'message',
              label: '🔄 もう一度診断する',
              text: '最初から'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}