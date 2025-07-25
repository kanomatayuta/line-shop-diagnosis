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
        
        // Render nodes with improved positioning
        Object.values(this.flowConfig.flowConfig).forEach(node => {
            this.createNodeElement(node);
        });
        
        // Wait for DOM update before drawing connections
        setTimeout(() => {
            this.drawConnections();
        }, 100);
        
        this.updateNodeCount();
        
        // Auto-fit canvas to show all nodes
        this.autoFitCanvas();
    }
    
    createNodeElement(nodeData) {
        const nodeEl = document.createElement('div');
        nodeEl.className = `node ${nodeData.type}`;
        nodeEl.dataset.id = nodeData.id;
        nodeEl.dataset.x = nodeData.position.x;
        nodeEl.dataset.y = nodeData.position.y;
        
        const stepText = nodeData.stepNumber ? `Step ${nodeData.stepNumber}` : this.getTypeDisplayName(nodeData.type);
        
        nodeEl.innerHTML = `
            <div class="node-header">${this.getTypeIcon(nodeData.type)} ${stepText}</div>
            <div class="node-title">${nodeData.title}</div>
            <div class="node-content">${this.truncateText(nodeData.message, 80)}</div>
            ${this.renderNodeButtons(nodeData.buttons)}
        `;
        
        // Improved positioning with proper scaling
        const x = nodeData.position.x * this.scale + this.translateX;
        const y = nodeData.position.y * this.scale + this.translateY;
        const scale = this.scale;
        
        nodeEl.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        nodeEl.style.transformOrigin = 'top left';
        
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(nodeData.id);
        });
        
        // Add to canvas with proper z-index
        nodeEl.style.zIndex = '10';
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
    
    getTypeDisplayName(type) {
        const names = {
            'welcome': 'ウェルカム',
            'question': '質問',
            'result': '結果'
        };
        return names[type] || type;
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
        
        // Create curved path instead of straight line for better visual flow
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const deltaX = toRect.x - fromRect.x;
        const deltaY = toRect.y - fromRect.y;
        
        // Control points for cubic bezier curve
        const cp1x = fromRect.x + deltaX * 0.3;
        const cp1y = fromRect.y;
        const cp2x = toRect.x - deltaX * 0.3;
        const cp2y = toRect.y;
        
        const pathData = `M ${fromRect.x} ${fromRect.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toRect.x} ${toRect.y}`;
        
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', 'var(--ios-blue)');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        path.setAttribute('opacity', '0.8');
        
        svg.appendChild(path);
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
        // Remove previous selection with animation
        const prevSelected = this.canvas.querySelector('.node.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
            prevSelected.style.transform = prevSelected.style.transform.replace('scale(1.02)', 'scale(1)');
        }
        
        // Select new node with iOS-style animation
        const nodeEl = this.canvas.querySelector(`[data-id="${nodeId}"]`);
        if (nodeEl) {
            nodeEl.classList.add('selected');
            this.selectedNode = nodeId;
            
            // Add selection animation
            nodeEl.style.transition = 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            requestAnimationFrame(() => {
                nodeEl.style.transform = nodeEl.style.transform + ' scale(1.02)';
            });
            
            this.showNodeEditor(nodeId);
            
            // Haptic feedback simulation (visual pulse)
            nodeEl.style.boxShadow = '0 0 0 6px rgba(0, 122, 255, 0.3), var(--ios-shadow-lg)';
            setTimeout(() => {
                nodeEl.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.2), var(--ios-shadow-lg)';
            }, 200);
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
        
        // Add loading state
        const editor = document.getElementById('nodeEditor');
        editor.classList.add('loading');
        
        setTimeout(() => {
            this.flowConfig.flowConfig[this.selectedNode][property] = value;
            this.renderFlow();
            
            // Remove loading and add success state
            editor.classList.remove('loading');
            editor.classList.add('success');
            
            setTimeout(() => {
                editor.classList.remove('success');
            }, 1000);
            
            this.updateStatus(`${property}を更新しました`);
        }, 200);
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
        
        // iOS-style status animation
        statusEl.style.opacity = '0';
        statusEl.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            statusEl.textContent = message;
            statusEl.style.color = type === 'error' ? 'var(--ios-red)' : 'white';
            statusEl.style.opacity = '1';
            statusEl.style.transform = 'translateY(0)';
            statusEl.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 150);
        
        setTimeout(() => {
            statusEl.style.opacity = '0';
            statusEl.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                statusEl.textContent = '準備完了';
                statusEl.style.color = 'white';
                statusEl.style.opacity = '1';
                statusEl.style.transform = 'translateY(0)';
            }, 300);
        }, 3000);
    }
    
    updateNodeCount() {
        const count = Object.keys(this.flowConfig?.flowConfig || {}).length;
        document.getElementById('nodeCount').textContent = `ノード数: ${count}`;
    }
    
    autoFitCanvas() {
        if (!this.flowConfig || !this.flowConfig.flowConfig) return;
        
        const nodes = Object.values(this.flowConfig.flowConfig);
        if (nodes.length === 0) return;
        
        // Calculate bounds of all nodes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        nodes.forEach(node => {
            const x = node.position.x;
            const y = node.position.y;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + 320); // Node width estimate
            maxY = Math.max(maxY, y + 200); // Node height estimate
        });
        
        // Add padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        // Calculate scale to fit content
        const canvasRect = this.canvas.getBoundingClientRect();
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        
        const scaleX = canvasRect.width / contentWidth;
        const scaleY = canvasRect.height / contentHeight;
        this.scale = Math.min(scaleX, scaleY, 1); // Don't scale larger than 1
        
        // Center content
        this.translateX = (canvasRect.width - contentWidth * this.scale) / 2 - minX * this.scale;
        this.translateY = (canvasRect.height - contentHeight * this.scale) / 2 - minY * this.scale;
        
        this.updateCanvasTransform();
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
        this.autoFitCanvas();
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
        flowManager.updateStatus('保存するフローがありません', 'error');
        return;
    }
    
    // Add saving animation to save button
    const saveBtn = event.target;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '💾 保存中...';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.6';
    
    setTimeout(() => {
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
        
        // Success animation
        saveBtn.textContent = '✅ 保存完了';
        saveBtn.style.backgroundColor = 'var(--ios-green)';
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.backgroundColor = '';
        }, 1500);
        
        flowManager.updateStatus('フロー設定を保存しました');
    }, 500);
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

function fitToScreen() {
    flowManager.autoFitCanvas();
}