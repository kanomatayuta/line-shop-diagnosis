class FlowManagerIOS {
    constructor() {
        this.canvas = document.getElementById('flowCanvas');
        this.selectedNode = null;
        this.flowConfig = null;
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        
        this.init();
    }
    
    async init() {
        this.initCanvas();
        this.setupEventListeners();
        await this.loadFlowConfig();
    }
    
    async loadFlowConfig() {
        try {
            this.updateStatus('設定を読み込み中...', 'loading');
            
            const response = await fetch('/api/flow-config');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.flowConfig = await response.json();
            
            if (!this.flowConfig?.flowConfig || Object.keys(this.flowConfig.flowConfig).length === 0) {
                throw new Error('フロー設定が空です');
            }
            
            await this.renderFlow();
            this.updateStatus('読み込み完了');
            
        } catch (error) {
            console.error('設定読み込みエラー:', error);
            this.updateStatus('読み込みに失敗しました', 'error');
            this.showErrorState(error.message);
        }
    }
    
    initCanvas() {
        this.canvas.innerHTML = `
            <svg class="flow-connection" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
                <defs>
                    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#007AFF" opacity="0.6" />
                    </marker>
                </defs>
            </svg>
        `;
    }
    
    async renderFlow() {
        if (!this.flowConfig?.flowConfig) return;
        
        // Clear existing nodes
        const existingNodes = this.canvas.querySelectorAll('.flow-node');
        existingNodes.forEach(node => {
            node.style.opacity = '0';
            node.style.transform += ' scale(0.8)';
            setTimeout(() => node.remove(), 200);
        });
        
        // Create nodes with staggered animation
        const nodes = Object.values(this.flowConfig.flowConfig);
        for (let i = 0; i < nodes.length; i++) {
            setTimeout(() => {
                this.createNode(nodes[i]);
            }, i * 100);
        }
        
        // Draw connections after nodes are created
        setTimeout(() => {
            this.drawConnections();
            this.autoFit();
        }, nodes.length * 100 + 200);
        
        this.updateNodeCount();
    }
    
    createNode(nodeData) {
        const nodeEl = document.createElement('div');
        nodeEl.className = `flow-node ${nodeData.type}`;
        nodeEl.dataset.id = nodeData.id;
        nodeEl.dataset.x = nodeData.position.x;
        nodeEl.dataset.y = nodeData.position.y;
        
        // Create node content
        const stepText = nodeData.stepNumber ? `Step ${nodeData.stepNumber}` : this.getTypeDisplayName(nodeData.type);
        const icon = this.getTypeIcon(nodeData.type);
        
        nodeEl.innerHTML = `
            <div class="node-badge">
                ${icon} ${stepText}
            </div>
            <div class="node-title">${nodeData.title}</div>
            <div class="node-content">${this.truncateText(nodeData.message, 60)}</div>
            ${this.renderNodeButtons(nodeData.buttons)}
        `;
        
        // Position node
        this.positionNode(nodeEl, nodeData.position);
        
        // Add event listeners
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(nodeData.id);
        });
        
        // Add with animation
        nodeEl.style.opacity = '0';
        nodeEl.style.transform += ' scale(0.8)';
        this.canvas.appendChild(nodeEl);
        
        // Animate in
        requestAnimationFrame(() => {
            nodeEl.style.opacity = '1';
            nodeEl.style.transform = nodeEl.style.transform.replace('scale(0.8)', 'scale(1)');
            nodeEl.classList.add('slide-up');
        });
    }
    
    positionNode(nodeEl, position) {
        const x = position.x * this.scale + this.translateX;
        const y = position.y * this.scale + this.translateY;
        nodeEl.style.transform = `translate(${x}px, ${y}px) scale(${this.scale})`;
        nodeEl.style.transformOrigin = 'top left';
    }
    
    drawConnections() {
        const svg = this.canvas.querySelector('.flow-connection');
        if (!svg) return;
        
        // Clear existing connections
        svg.innerHTML = `
            <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#007AFF" opacity="0.6" />
                </marker>
            </defs>
        `;
        
        if (!this.flowConfig?.flowConfig) return;
        
        Object.values(this.flowConfig.flowConfig).forEach(node => {
            if (node.buttons) {
                node.buttons.forEach(button => {
                    if (button.next) {
                        this.drawConnection(node.id, button.next);
                    }
                });
            }
        });
    }
    
    drawConnection(fromId, toId) {
        const fromNode = this.canvas.querySelector(`[data-id="${fromId}"]`);
        const toNode = this.canvas.querySelector(`[data-id="${toId}"]`);
        
        if (!fromNode || !toNode) return;
        
        const fromRect = this.getNodeCenter(fromNode);
        const toRect = this.getNodeCenter(toNode);
        const svg = this.canvas.querySelector('.flow-connection');
        
        // Simple straight line for clean look
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromRect.x);
        line.setAttribute('y1', fromRect.y);
        line.setAttribute('x2', toRect.x);
        line.setAttribute('y2', toRect.y);
        line.setAttribute('stroke', '#007AFF');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.4');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        svg.appendChild(line);
    }
    
    getNodeCenter(nodeEl) {
        const rect = nodeEl.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        return {
            x: rect.left + rect.width / 2 - canvasRect.left,
            y: rect.top + rect.height / 2 - canvasRect.top
        };
    }
    
    setupEventListeners() {
        // Canvas panning
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.target === this.canvas || e.target.tagName === 'svg') {
                this.isDragging = true;
                this.dragStart = { x: e.clientX - this.translateX, y: e.clientY - this.translateY };
                this.canvas.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.translateX = e.clientX - this.dragStart.x;
                this.translateY = e.clientY - this.dragStart.y;
                this.updateTransform();
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        // Zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale = Math.max(0.3, Math.min(2, this.scale * delta));
            this.updateTransform();
        });
        
        // Deselect on canvas click
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas || e.target.tagName === 'svg') {
                this.deselectNode();
            }
        });
    }
    
    updateTransform() {
        const nodes = this.canvas.querySelectorAll('.flow-node');
        nodes.forEach(node => {
            const x = parseFloat(node.dataset.x);
            const y = parseFloat(node.dataset.y);
            this.positionNode(node, { x, y });
        });
        this.drawConnections();
    }
    
    selectNode(nodeId) {
        // Remove previous selection
        const prevSelected = this.canvas.querySelector('.flow-node.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }
        
        // Select new node
        const nodeEl = this.canvas.querySelector(`[data-id="${nodeId}"]`);
        if (nodeEl) {
            nodeEl.classList.add('selected');
            this.selectedNode = nodeId;
            this.showNodeEditor(nodeId);
            
            // Gentle selection animation
            nodeEl.style.transform += ' scale(1.02)';
            setTimeout(() => {
                if (nodeEl.classList.contains('selected')) {
                    nodeEl.style.transform = nodeEl.style.transform.replace('scale(1.02)', 'scale(1)');
                }
            }, 200);
        }
    }
    
    deselectNode() {
        const selected = this.canvas.querySelector('.flow-node.selected');
        if (selected) {
            selected.classList.remove('selected');
        }
        this.selectedNode = null;
        this.showEmptyEditor();
    }
    
    showNodeEditor(nodeId) {
        const nodeData = this.flowConfig.flowConfig[nodeId];
        if (!nodeData) return;
        
        const editor = document.getElementById('nodeEditor');
        editor.innerHTML = `
            <div class="form-group">
                <label class="form-label">タイトル</label>
                <input type="text" class="form-input" value="${nodeData.title || ''}" 
                       onchange="flowManager.updateNodeProperty('title', this.value)">
            </div>
            
            <div class="form-group">
                <label class="form-label">メッセージ</label>
                <textarea class="form-textarea" 
                          onchange="flowManager.updateNodeProperty('message', this.value)">${nodeData.message || ''}</textarea>
            </div>
            
            ${nodeData.stepNumber ? `
            <div class="form-group">
                <label class="form-label">ステップ番号</label>
                <input type="number" class="form-input" value="${nodeData.stepNumber}" 
                       onchange="flowManager.updateNodeProperty('stepNumber', parseInt(this.value))">
            </div>
            ` : ''}
            
            ${nodeData.buttons ? `
            <div class="form-group">
                <label class="form-label">ボタン</label>
                <div style="display: flex; flex-direction: column; gap: var(--ios-spacing-8);">
                    ${nodeData.buttons.map((btn, index) => `
                        <div style="display: flex; gap: var(--ios-spacing-8); align-items: center;">
                            <input type="text" class="form-input" value="${btn.label}" 
                                   onchange="flowManager.updateButtonProperty(${index}, 'label', this.value)"
                                   style="flex: 1;">
                            <button class="btn btn-danger" onclick="flowManager.removeButton(${index})" style="padding: var(--ios-spacing-8);">
                                🗑️
                            </button>
                        </div>
                    `).join('')}
                    <button class="btn btn-secondary" onclick="flowManager.addButton()">
                        ➕ ボタン追加
                    </button>
                </div>
            </div>
            ` : ''}
        `;
        
        editor.classList.add('fade-in');
    }
    
    showEmptyEditor() {
        const editor = document.getElementById('nodeEditor');
        editor.innerHTML = `
            <div class="error-state">
                <div class="error-icon">👆</div>
                <div class="error-title">ノードを選択</div>
                <div class="error-message">フローチャートからノードをクリックして編集を開始してください</div>
            </div>
        `;
    }
    
    updateNodeProperty(property, value) {
        if (!this.selectedNode) return;
        
        this.flowConfig.flowConfig[this.selectedNode][property] = value;
        this.renderFlow();
        this.updateStatus(`${property}を更新しました`);
    }
    
    updateButtonProperty(buttonIndex, property, value) {
        if (!this.selectedNode) return;
        
        const node = this.flowConfig.flowConfig[this.selectedNode];
        if (node.buttons && node.buttons[buttonIndex]) {
            node.buttons[buttonIndex][property] = value;
            this.updateStatus('ボタンを更新しました');
        }
    }
    
    addButton() {
        if (!this.selectedNode) return;
        
        const node = this.flowConfig.flowConfig[this.selectedNode];
        if (!node.buttons) node.buttons = [];
        
        node.buttons.push({
            label: '新しいボタン',
            action: node.id,
            value: 'new_value',
            next: ''
        });
        
        this.showNodeEditor(this.selectedNode);
        this.updateStatus('ボタンを追加しました');
    }
    
    removeButton(buttonIndex) {
        if (!this.selectedNode) return;
        
        const node = this.flowConfig.flowConfig[this.selectedNode];
        if (node.buttons && node.buttons[buttonIndex]) {
            node.buttons.splice(buttonIndex, 1);
            this.showNodeEditor(this.selectedNode);
            this.renderFlow();
            this.updateStatus('ボタンを削除しました');
        }
    }
    
    autoFit() {
        if (!this.flowConfig?.flowConfig) return;
        
        const nodes = Object.values(this.flowConfig.flowConfig);
        if (nodes.length === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        nodes.forEach(node => {
            const x = node.position.x;
            const y = node.position.y;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + 240);
            maxY = Math.max(maxY, y + 100);
        });
        
        const padding = 40;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        
        const scaleX = canvasRect.width / contentWidth;
        const scaleY = canvasRect.height / contentHeight;
        this.scale = Math.min(scaleX, scaleY, 1);
        
        this.translateX = (canvasRect.width - contentWidth * this.scale) / 2 - minX * this.scale;
        this.translateY = (canvasRect.height - contentHeight * this.scale) / 2 - minY * this.scale;
        
        this.updateTransform();
    }
    
    zoomIn() {
        this.scale = Math.min(2, this.scale * 1.2);
        this.updateTransform();
    }
    
    zoomOut() {
        this.scale = Math.max(0.3, this.scale * 0.8);
        this.updateTransform();
    }
    
    resetZoom() {
        this.autoFit();
    }
    
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        const statusDot = document.querySelector('.status-dot');
        
        statusEl.textContent = message;
        
        if (type === 'loading') {
            statusDot.className = 'status-dot active';
        } else if (type === 'error') {
            statusDot.className = 'status-dot';
            statusDot.style.background = '#FF3B30';
        } else {
            statusDot.className = 'status-dot';
            statusDot.style.background = 'rgba(255, 255, 255, 0.8)';
        }
        
        if (type !== 'loading') {
            setTimeout(() => {
                statusEl.textContent = 'システム準備完了';
                statusDot.className = 'status-dot';
                statusDot.style.background = 'rgba(255, 255, 255, 0.8)';
            }, 3000);
        }
    }
    
    updateNodeCount() {
        const count = Object.keys(this.flowConfig?.flowConfig || {}).length;
        document.getElementById('nodeCount').textContent = `ノード: ${count}`;
    }
    
    showErrorState(message) {
        this.canvas.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-title">読み込みエラー</div>
                <div class="error-message">${message}</div>
                <button class="btn btn-primary" onclick="location.reload()">
                    🔄 再読み込み
                </button>
            </div>
        `;
    }
    
    // Helper methods
    getTypeDisplayName(type) {
        const names = {
            'welcome': 'ウェルカム',
            'question': '質問',
            'result': '結果'
        };
        return names[type] || type;
    }
    
    getTypeIcon(type) {
        const icons = {
            'welcome': '🏪',
            'question': '❓',
            'result': '📊'
        };
        return icons[type] || '⚪';
    }
    
    renderNodeButtons(buttons) {
        if (!buttons || buttons.length === 0) return '';
        
        return `
            <div class="node-buttons">
                ${buttons.slice(0, 3).map(btn => `
                    <div class="node-button">${btn.label}</div>
                `).join('')}
                ${buttons.length > 3 ? `<div class="node-button">他 ${buttons.length - 3} 個...</div>` : ''}
            </div>
        `;
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

// Global functions
let flowManager;

document.addEventListener('DOMContentLoaded', () => {
    flowManager = new FlowManagerIOS();
});

function addNode() {
    alert('ノード追加機能は開発中です');
}

function deleteNode() {
    if (!flowManager.selectedNode) {
        alert('削除するノードを選択してください');
        return;
    }
    
    if (confirm('選択したノードを削除しますか？')) {
        delete flowManager.flowConfig.flowConfig[flowManager.selectedNode];
        flowManager.selectedNode = null;
        flowManager.showEmptyEditor();
        flowManager.renderFlow();
        flowManager.updateStatus('ノードを削除しました');
    }
}

function saveFlow() {
    if (!flowManager.flowConfig) {
        flowManager.updateStatus('保存するフローがありません', 'error');
        return;
    }
    
    const saveBtn = event.target;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '💾 保存中...';
    saveBtn.disabled = true;
    
    setTimeout(() => {
        flowManager.flowConfig.metadata.lastUpdated = new Date().toISOString().split('T')[0];
        
        const dataStr = JSON.stringify(flowManager.flowConfig, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flow-config.json';
        link.click();
        
        URL.revokeObjectURL(url);
        
        saveBtn.textContent = '✅ 完了';
        saveBtn.style.background = '#34C759';
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            saveBtn.style.background = '';
        }, 1500);
        
        flowManager.updateStatus('フロー設定を保存しました');
    }, 500);
}

function fitToScreen() {
    flowManager.autoFit();
}

function zoomIn() {
    flowManager.zoomIn();
}

function zoomOut() {
    flowManager.zoomOut();
}

function resetZoom() {
    flowManager.resetZoom();
}

function importFlow() {
    document.getElementById('fileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedFlow = JSON.parse(e.target.result);
            flowManager.flowConfig = importedFlow;
            flowManager.renderFlow();
            flowManager.updateStatus('フロー設定をインポートしました');
        } catch (error) {
            alert('無効なJSONファイルです');
            flowManager.updateStatus('インポートに失敗しました', 'error');
        }
    };
    reader.readAsText(file);
}