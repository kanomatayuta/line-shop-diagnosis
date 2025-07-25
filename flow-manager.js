class FlowManager {
    constructor() {
        this.canvas = document.getElementById('flowCanvas');
        this.selectedNode = null;
        this.flowConfig = null;
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        
        this.initializeCanvas();
        this.loadFlowConfig();
        this.setupEventListeners();
    }
    
    async loadFlowConfig() {
        try {
            const response = await fetch('/api/flow-config');
            this.flowConfig = await response.json();
            this.renderFlow();
            this.updateStatus('フロー設定を読み込みました');
        } catch (error) {
            console.error('フロー設定の読み込みに失敗しました:', error);
            this.updateStatus('フロー設定の読み込みに失敗しました', 'error');
        }
    }
    
    initializeCanvas() {
        this.canvas.innerHTML = `
            <svg id="connections" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#304992" />
                    </marker>
                </defs>
            </svg>
        `;
    }
    
    setupEventListeners() {
        // Canvas panning
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.target === this.canvas || e.target.id === 'connections') {
                this.isDragging = true;
                this.dragStart = { x: e.clientX - this.translateX, y: e.clientY - this.translateY };
                this.canvas.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.translateX = e.clientX - this.dragStart.x;
                this.translateY = e.clientY - this.dragStart.y;
                this.updateCanvasTransform();
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
            this.scale *= delta;
            this.scale = Math.max(0.3, Math.min(3, this.scale));
            this.updateCanvasTransform();
        });
    }
    
    updateCanvasTransform() {
        const nodes = this.canvas.querySelectorAll('.node');
        nodes.forEach(node => {
            const originalX = parseFloat(node.dataset.x);
            const originalY = parseFloat(node.dataset.y);
            node.style.transform = `translate(${originalX * this.scale + this.translateX}px, ${originalY * this.scale + this.translateY}px) scale(${this.scale})`;
        });
        this.drawConnections();
    }
    
    renderFlow() {
        if (!this.flowConfig || !this.flowConfig.flowConfig) return;
        
        // Clear existing nodes
        const existingNodes = this.canvas.querySelectorAll('.node');
        existingNodes.forEach(node => node.remove());
        
        // Render nodes
        Object.values(this.flowConfig.flowConfig).forEach(node => {
            this.createNodeElement(node);
        });
        
        this.drawConnections();
        this.updateNodeCount();
    }
    
    createNodeElement(nodeData) {
        const nodeEl = document.createElement('div');
        nodeEl.className = `node ${nodeData.type}`;
        nodeEl.dataset.id = nodeData.id;
        nodeEl.dataset.x = nodeData.position.x;
        nodeEl.dataset.y = nodeData.position.y;
        
        const stepText = nodeData.stepNumber ? `Step ${nodeData.stepNumber}` : nodeData.type;
        
        nodeEl.innerHTML = `
            <div class="node-header">${this.getTypeIcon(nodeData.type)} ${stepText}</div>
            <div class="node-title">${nodeData.title}</div>
            <div class="node-content">${this.truncateText(nodeData.message, 100)}</div>
            ${this.renderNodeButtons(nodeData.buttons)}
        `;
        
        nodeEl.style.transform = `translate(${nodeData.position.x * this.scale + this.translateX}px, ${nodeData.position.y * this.scale + this.translateY}px) scale(${this.scale})`;
        
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(nodeData.id);
        });
        
        this.canvas.appendChild(nodeEl);
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
                ${buttons.map(btn => `<div class="node-button">${btn.label}</div>`).join('')}
            </div>
        `;
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    drawConnections() {
        const svg = document.getElementById('connections');
        svg.innerHTML = `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#304992" />
                </marker>
            </defs>
        `;
        
        if (!this.flowConfig || !this.flowConfig.flowConfig) return;
        
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
        
        const svg = document.getElementById('connections');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        
        line.setAttribute('x1', fromRect.x);
        line.setAttribute('y1', fromRect.y);
        line.setAttribute('x2', toRect.x);
        line.setAttribute('y2', toRect.y);
        line.setAttribute('stroke', '#304992');
        line.setAttribute('stroke-width', '2');
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
    
    selectNode(nodeId) {
        // Remove previous selection
        const prevSelected = this.canvas.querySelector('.node.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }
        
        // Select new node
        const nodeEl = this.canvas.querySelector(`[data-id="${nodeId}"]`);
        if (nodeEl) {
            nodeEl.classList.add('selected');
            this.selectedNode = nodeId;
            this.showNodeEditor(nodeId);
        }
    }
    
    showNodeEditor(nodeId) {
        const nodeData = this.flowConfig.flowConfig[nodeId];
        if (!nodeData) return;
        
        const editor = document.getElementById('nodeEditor');
        editor.innerHTML = `
            <div class="form-group">
                <label>タイトル:</label>
                <input type="text" id="nodeTitle" value="${nodeData.title || ''}" onchange="flowManager.updateNodeProperty('title', this.value)">
            </div>
            
            <div class="form-group">
                <label>メッセージ:</label>
                <textarea id="nodeMessage" onchange="flowManager.updateNodeProperty('message', this.value)">${nodeData.message || ''}</textarea>
            </div>
            
            ${nodeData.stepNumber ? `
            <div class="form-group">
                <label>ステップ番号:</label>
                <input type="number" id="nodeStep" value="${nodeData.stepNumber}" onchange="flowManager.updateNodeProperty('stepNumber', parseInt(this.value))">
            </div>
            ` : ''}
            
            ${nodeData.buttons ? `
            <div class="form-group">
                <label>ボタン:</label>
                <div class="button-list">
                    ${nodeData.buttons.map((btn, index) => `
                        <div class="button-item">
                            <div>
                                <input type="text" value="${btn.label}" onchange="flowManager.updateButtonProperty(${index}, 'label', this.value)" style="width: 100%; margin-bottom: 5px;">
                                <select onchange="flowManager.updateButtonProperty(${index}, 'next', this.value)" style="width: 100%;">
                                    <option value="">次のノードを選択...</option>
                                    ${Object.keys(this.flowConfig.flowConfig).map(id => 
                                        `<option value="${id}" ${btn.next === id ? 'selected' : ''}>${this.flowConfig.flowConfig[id].title}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <button class="btn btn-danger btn-small" onclick="flowManager.removeButton(${index})">削除</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary btn-small" onclick="flowManager.addButton()" style="margin-top: 10px;">ボタン追加</button>
            </div>
            ` : ''}
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
            this.renderFlow();
            this.updateStatus(`ボタン${property}を更新しました`);
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
    
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.style.color = type === 'error' ? '#ff6b6b' : 'white';
        
        setTimeout(() => {
            statusEl.textContent = '準備完了';
            statusEl.style.color = 'white';
        }, 3000);
    }
    
    updateNodeCount() {
        const count = Object.keys(this.flowConfig?.flowConfig || {}).length;
        document.getElementById('nodeCount').textContent = `ノード数: ${count}`;
    }
    
    // Toolbar functions
    zoomIn() {
        this.scale *= 1.2;
        this.scale = Math.min(3, this.scale);
        this.updateCanvasTransform();
    }
    
    zoomOut() {
        this.scale *= 0.8;
        this.scale = Math.max(0.3, this.scale);
        this.updateCanvasTransform();
    }
    
    resetZoom() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateCanvasTransform();
    }
}

// Global functions
let flowManager;

document.addEventListener('DOMContentLoaded', () => {
    flowManager = new FlowManager();
});

function addNode() {
    // TODO: Implement add node functionality
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
        document.getElementById('nodeEditor').innerHTML = '<p>ノードを選択してください</p>';
        flowManager.renderFlow();
        flowManager.updateStatus('ノードを削除しました');
    }
}

function saveFlow() {
    if (!flowManager.flowConfig) {
        alert('保存するフローがありません');
        return;
    }
    
    // Update metadata
    flowManager.flowConfig.metadata.lastUpdated = new Date().toISOString().split('T')[0];
    
    const dataStr = JSON.stringify(flowManager.flowConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flow-config.json';
    link.click();
    
    URL.revokeObjectURL(url);
    flowManager.updateStatus('フロー設定を保存しました');
}

function exportFlow() {
    saveFlow(); // Same as save for now
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

function zoomIn() {
    flowManager.zoomIn();
}

function zoomOut() {
    flowManager.zoomOut();
}

function resetZoom() {
    flowManager.resetZoom();
}