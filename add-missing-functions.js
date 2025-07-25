// 不足している質問関数を追加するスクリプト
const fs = require('fs');

const missingFunctions = `

// 新しい質問関数群
function sendBusinessStatusQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '経営状況選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💼 Step 2',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '経営状況を教えてください',
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
              label: '📈 黒字',
              data: JSON.stringify({ action: 'business_status', value: 'profitable' }),
              displayText: '黒字'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '📉 赤字',
              data: JSON.stringify({ action: 'business_status', value: 'loss' }),
              displayText: '赤字'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendProfitQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '営業利益選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💰 Step 3',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '年間の営業利益について教えてください',
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
              label: '💵 0〜300万円',
              data: JSON.stringify({ action: 'profit', value: 'low' }),
              displayText: '0〜300万円'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '💴 300万円〜1,000万円',
              data: JSON.stringify({ action: 'profit', value: 'medium' }),
              displayText: '300万円〜1,000万円'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '💸 1,000万円以上',
              data: JSON.stringify({ action: 'profit', value: 'high' }),
              displayText: '1,000万円以上'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendFloorQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '階数選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🏢 Step 3',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'お店の階数について教えてください',
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
              label: '1️⃣ 1階ですか？',
              data: JSON.stringify({ action: 'floor', value: 'first' }),
              displayText: '1階'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🏢 1階以外（地下 or 2階以上）ですか？',
              data: JSON.stringify({ action: 'floor', value: 'other' }),
              displayText: '1階以外'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendCommercialQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '商業施設選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🏪 Step 4',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '商業施設に出店されていますか？',
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
              label: '✅ はい',
              data: JSON.stringify({ action: 'commercial', value: 'yes' }),
              displayText: 'はい'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '❌ いいえ',
              data: JSON.stringify({ action: 'commercial', value: 'no' }),
              displayText: 'いいえ'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendAssetsQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '固定資産選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🏛️ Step 5',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '固定資産はありますか？',
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
              label: '🏗️ 引き継げる固定資産がある',
              data: JSON.stringify({ action: 'assets', value: 'fixed_assets' }),
              displayText: '引き継げる固定資産がある'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '🔧 固定資産もリースもある',
              data: JSON.stringify({ action: 'assets', value: 'mixed' }),
              displayText: '固定資産もリースもある'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '📄 リースのみで運営しており固定資産はない',
              data: JSON.stringify({ action: 'assets', value: 'lease_only' }),
              displayText: 'リースのみで運営'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}

function sendEmployeesQuestion(replyToken) {
  const message = {
    type: 'flex',
    altText: '従業員選択',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '👥 Step 6',
            size: 'sm',
            color: '#304992',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '従業員（アルバイト含む）について教えてください',
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
              label: '👨‍💼 引き継げる従業員がいる',
              data: JSON.stringify({ action: 'employees', value: 'available' }),
              displayText: '引き継げる従業員がいる'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'md',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '❌ 従業員は引き継ぎ不可',
              data: JSON.stringify({ action: 'employees', value: 'unavailable' }),
              displayText: '従業員は引き継ぎ不可'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  };
  
  return client.replyMessage(replyToken, message);
}
`;

// webhook.jsの最後に関数を追加
fs.appendFileSync('/Users/kanomatayuta/line-shop-diagnosis/api/webhook.js', missingFunctions);
console.log('Missing functions added to webhook.js');