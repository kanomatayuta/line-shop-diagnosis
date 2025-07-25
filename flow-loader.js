const fs = require('fs');
const path = require('path');

class FlowLoader {
  constructor() {
    this.flowConfig = null;
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, 'flow-config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      this.flowConfig = JSON.parse(configData);
      console.log('Flow configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load flow configuration:', error);
      // Fallback to default configuration
      this.flowConfig = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      flowConfig: {
        start: {
          id: "start",
          type: "welcome",
          title: "ウェルカムメッセージ",
          message: "🏪 店舗売却診断へようこそ！\n\n簡単な質問にお答えいただくことで、あなたの店舗の売却可能性を診断いたします。\n\n診断には約2分かかります。",
          buttons: [
            {
              label: "🚀 診断開始",
              action: "start",
              next: "area"
            }
          ]
        }
      }
    };
  }

  getNode(nodeId) {
    return this.flowConfig?.flowConfig?.[nodeId] || null;
  }

  getAllNodes() {
    return this.flowConfig?.flowConfig || {};
  }

  getNodeMessage(nodeId, userData = {}) {
    const node = this.getNode(nodeId);
    if (!node) return null;

    let message = node.message;

    // Handle dynamic content for result nodes
    if (node.type === 'result' && node.sellPriceLogic && userData.profit) {
      const sellPrice = node.sellPriceLogic[userData.profit] || 500;
      message = message.replace('{sellPrice}', sellPrice);
    }

    return message;
  }

  getNodeButtons(nodeId) {
    const node = this.getNode(nodeId);
    return node?.buttons || [];
  }

  getConsultationUrl(nodeId, userData = {}) {
    const node = this.getNode(nodeId);
    if (!node?.consultationUrl) return null;

    // For other_result, use different URL
    if (nodeId === 'other_result') {
      return node.consultationUrl || "https://timerex.net/s/rendan/38dfc57a";
    }

    return node.consultationUrl || "https://timerex.net/s/rendan/bae2d85d";
  }

  createFlexMessage(nodeId, userData = {}) {
    const node = this.getNode(nodeId);
    if (!node) return null;

    if (node.type === 'welcome') {
      return this.createWelcomeMessage(node);
    } else if (node.type === 'question') {
      return this.createQuestionMessage(node);
    }

    return null;
  }

  createWelcomeMessage(node) {
    return {
      type: 'flex',
      altText: node.title,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🏪 店舗売却診断',
              size: 'xl',
              weight: 'bold',
              color: '#FFFFFF'
            }
          ],
          backgroundColor: '#304992',
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: node.message,
              size: 'md',
              color: '#333333',
              wrap: true,
              margin: 'md'
            },
            ...node.buttons.map(button => ({
              type: 'button',
              style: 'primary',
              height: 'md',
              color: '#304992',
              margin: 'lg',
              action: {
                type: 'postback',
                label: button.label,
                data: JSON.stringify({ action: button.action, value: button.value || 'start' }),
                displayText: button.label.replace(/🚀 /, '')
              }
            }))
          ],
          paddingAll: '20px'
        }
      }
    };
  }

  createQuestionMessage(node) {
    return {
      type: 'flex',
      altText: node.title,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `💼 Step ${node.stepNumber}`,
              size: 'sm',
              color: '#304992',
              weight: 'bold'
            },
            {
              type: 'text',
              text: node.message,
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
          contents: node.buttons.map((button, index) => ({
            type: 'button',
            style: index === 0 ? 'primary' : 'secondary',
            height: 'md',
            color: index === 0 ? '#304992' : undefined,
            margin: 'sm',
            action: {
              type: 'postback',
              label: button.label,
              data: JSON.stringify({ action: button.action, value: button.value }),
              displayText: button.label.replace(/🗼|🌸|🌊|🏔️|🏞️|📈|📉|💵|💴|💸|1️⃣|🏢|✅|❌|🏗️|🔧|📄|👨‍💼/g, '').trim()
            }
          })),
          paddingAll: '20px'
        }
      }
    };
  }

  reloadConfig() {
    this.loadConfig();
  }
}

module.exports = FlowLoader;