/**
 * InfiniDepth Auto Recorder
 * 
 * Automatic camera movement and zoom for smooth video recording.
 * Features:
 * - Predefined anchor points (interesting regions)
 * - Smooth interpolation between anchors
 * - Automatic zoom in/out at each anchor
 * - Configurable timing and animation curves
 */

class AutoRecorder {
    constructor(magnifier, config = {}) {
        this.magnifier = magnifier;
        
        // Configuration
        this.config = {
            // Movement settings - 更慢的速度让移动更平缓
            moveSpeed: config.moveSpeed || 0.006,         // 进一步降低移动速度 (0.008 -> 0.006)
            zoomSpeed: config.zoomSpeed || 0.012,         // 进一步降低缩放速度 (0.015 -> 0.012)
            
            // Timing settings - 增加停留时间让过渡更自然
            pauseAtAnchor: config.pauseAtAnchor || 1500,  // 增加到达锚点后的停留时间
            pauseAtZoom: config.pauseAtZoom || 2000,      // 增加最大缩放的停留时间
            pauseAfterZoomOut: config.pauseAfterZoomOut || 1000, // 增加缩放完成后的停留时间
            pauseBeforeFinish: config.pauseBeforeFinish || 2000,  // 完成所有锚点后的停留时间
            
            // Zoom settings
            maxZoomLevel: config.maxZoomLevel || 0.15,    // Maximum zoom (patch size multiplier) - DEPRECATED, use minPatchSize directly
            useMinPatchSize: config.useMinPatchSize !== false,  // Use minPatchSize directly instead of multiplier
            
            // Animation curve (easing functions) - 使用更平滑的缓动函数
            moveEasing: config.moveEasing || 'easeInOutCubic',  // Cubic 更平滑
            zoomEasing: config.zoomEasing || 'easeInOutCubic',  // Zoom 也用 Cubic
            
            // Smoothing settings - 启用更强的插值平滑
            positionSmoothing: config.positionSmoothing !== false,  // 启用位置平滑
            smoothingFactor: config.smoothingFactor || 0.18,  // 降低到 0.18 获得更平滑的效果
            zoomSmoothing: config.zoomSmoothing || 0.25,      // 缩放平滑系数
            
            // Frame rate control - 确保固定帧率
            targetFPS: config.targetFPS || 60,
            frameTime: 1000 / (config.targetFPS || 60),  // 目标帧时间
            
            // Loop control
            loopAfterComplete: config.loopAfterComplete !== false,  // 完成后是否循环（默认不循环）
            showFullImageAfterComplete: config.showFullImageAfterComplete !== false,  // 完成后展示完整图像
            
            // Warmup settings - 预热设置
            enableWarmup: config.enableWarmup !== false,  // 是否启用预热（默认启用）
            warmupCycles: config.warmupCycles || 1,       // 第一个锚点预热循环次数（默认1次）
            warmupPauseAtZoom: config.warmupPauseAtZoom || 500  // 预热时的缩放停留时间（更短）
        };
        
        // State
        this.isRecording = false;
        this.isPaused = false;
        this.currentAnchorIndex = -1;
        this.animationFrameId = null;
        this.isWarmupCycle = false;  // 标记是否是预热循环
        this.warmupCycleCount = 0;   // 预热循环计数器
        
        // Current position and zoom state
        this.currentX = 0;
        this.currentY = 0;
        this.currentPatchSize = this.magnifier.config.initialPatchSize;
        
        // Smoothed position for smoother movement
        this.smoothedX = 0;
        this.smoothedY = 0;
        
        // Animation state
        this.state = 'idle'; // idle, moving, zooming_in, paused, zooming_out
        this.stateStartTime = 0;
        this.pauseEndTime = 0;
        this.lastFrameTime = 0;  // 用于帧率控制
        this.deltaTime = 0;       // 上一帧的时间差
        
        // Anchors (will be set per scene)
        this.anchors = [];
        
        // Create UI
        this.createUI();
        
        console.log('AutoRecorder initialized');
    }
    
    /**
     * Easing functions for smooth animation
     */
    easing = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2
    };
    
    /**
     * Set anchors for current scene
     * Anchors are defined as percentage of image dimensions (0-1)
     */
    setAnchors(anchors) {
        this.anchors = anchors.map(anchor => ({
            x: anchor.x,      // X position (0-1)
            y: anchor.y,      // Y position (0-1)
            name: anchor.name || 'Anchor'
        }));
        console.log(`Set ${this.anchors.length} anchors:`, this.anchors);
    }
    
    /**
     * Create UI control panel
     */
    createUI() {
        const panel = document.createElement('div');
        panel.id = 'autoRecorderPanel';
        panel.innerHTML = `
            <div id="recorderContainer" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.97);
                border: 2px solid #4a90e2;
                border-radius: 8px;
                padding: 12px 15px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 220px;
                font-family: 'Jost', sans-serif;
                font-size: 12px;
                transition: transform 0.3s ease, opacity 0.3s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #2c3e50; font-size: 14px; font-weight: 600;">
                        🎬 Recorder
                    </h3>
                    <button id="togglePanelBtn" style="
                        background: #e8f4fd;
                        border: 1px solid #4a90e2;
                        border-radius: 3px;
                        width: 22px;
                        height: 22px;
                        cursor: pointer;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                        padding: 0;
                    " title="Toggle panel">▼</button>
                </div>
                
                <div id="recorderContent" style="transition: max-height 0.3s ease, opacity 0.3s ease; overflow: hidden;">
                
                <div id="recorderContent" style="transition: max-height 0.3s ease, opacity 0.3s ease; overflow: hidden;">
                
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px;">
                        <span style="color: #555;">Status:</span>
                        <span id="recorderStatus" style="font-weight: 600; color: #e74c3c;">Idle</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px;">
                        <span style="color: #555;">Anchor:</span>
                        <span id="recorderAnchor" style="font-weight: 600; color: #3498db;">-</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span style="color: #555;">State:</span>
                        <span id="recorderState" style="font-weight: 600; color: #95a5a6;">-</span>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-bottom: 10px;">
                    <label style="display: block; font-size: 10px; color: #555; margin-bottom: 3px;">
                        Move: <span id="moveSpeedValue">${this.config.moveSpeed.toFixed(2)}</span>
                    </label>
                    <input type="range" id="moveSpeedSlider" min="0.01" max="0.1" step="0.01" 
                           value="${this.config.moveSpeed}" 
                           style="width: 100%; margin-bottom: 6px; height: 4px;">
                    
                    <label style="display: block; font-size: 10px; color: #555; margin-bottom: 3px;">
                        Zoom: <span id="zoomSpeedValue">${this.config.zoomSpeed.toFixed(2)}</span>
                    </label>
                    <input type="range" id="zoomSpeedSlider" min="0.01" max="0.1" step="0.01" 
                           value="${this.config.zoomSpeed}" 
                           style="width: 100%; margin-bottom: 6px; height: 4px;">
                    
                    <label style="display: block; font-size: 10px; color: #555; margin-bottom: 3px;">
                        Pause: <span id="pauseAnchorValue">${this.config.pauseAtAnchor}ms</span>
                    </label>
                    <input type="range" id="pauseAnchorSlider" min="500" max="3000" step="100" 
                           value="${this.config.pauseAtAnchor}" 
                           style="width: 100%; height: 4px;">
                </div>
                
                <div style="display: flex; gap: 5px; margin-bottom: 8px;">
                    <button id="startRecordingBtn" style="
                        flex: 1;
                        padding: 6px 8px;
                        background: #27ae60;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 11px;
                        transition: background 0.2s;
                    ">▶</button>
                    
                    <button id="pauseRecordingBtn" style="
                        flex: 1;
                        padding: 6px 8px;
                        background: #f39c12;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 11px;
                        transition: background 0.2s;
                        display: none;
                    ">⏸</button>
                    
                    <button id="stopRecordingBtn" style="
                        flex: 1;
                        padding: 6px 8px;
                        background: #e74c3c;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 11px;
                        transition: background 0.2s;
                    ">⏹</button>
                </div>
                
                <div style="border-top: 1px solid #ddd; padding-top: 8px;">
                    <button id="setAnchorsVisualBtn" style="
                        width: 100%;
                        padding: 6px;
                        background: #9b59b6;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 10px;
                        transition: background 0.2s;
                        margin-bottom: 5px;
                    ">🎯 Visual</button>
                    
                    <button id="setAnchorsBtn" style="
                        width: 100%;
                        padding: 6px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 10px;
                        transition: background 0.2s;
                    ">📍 JSON</button>
                </div>
                
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Create visual anchor overlay (initially hidden)
        this.createVisualAnchorOverlay();
        
        // Bind events
        this.bindUIEvents();
    }
    
    /**
     * Bind UI events
     */
    bindUIEvents() {
        // Toggle panel
        document.getElementById('togglePanelBtn').addEventListener('click', () => this.togglePanel());
        
        // Buttons
        document.getElementById('startRecordingBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseRecordingBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('stopRecordingBtn').addEventListener('click', () => this.stop());
        document.getElementById('setAnchorsBtn').addEventListener('click', () => this.showAnchorDialog());
        document.getElementById('setAnchorsVisualBtn').addEventListener('click', () => this.enterVisualAnchorMode());
        
        // Sliders
        document.getElementById('moveSpeedSlider').addEventListener('input', (e) => {
            this.config.moveSpeed = parseFloat(e.target.value);
            document.getElementById('moveSpeedValue').textContent = this.config.moveSpeed.toFixed(2);
        });
        
        document.getElementById('zoomSpeedSlider').addEventListener('input', (e) => {
            this.config.zoomSpeed = parseFloat(e.target.value);
            document.getElementById('zoomSpeedValue').textContent = this.config.zoomSpeed.toFixed(2);
        });
        
        document.getElementById('pauseAnchorSlider').addEventListener('input', (e) => {
            this.config.pauseAtAnchor = parseInt(e.target.value);
            document.getElementById('pauseAnchorValue').textContent = this.config.pauseAtAnchor + 'ms';
        });
    }
    
    /**
     * Toggle panel collapsed/expanded
     */
    togglePanel() {
        const content = document.getElementById('recorderContent');
        const btn = document.getElementById('togglePanelBtn');
        const container = document.getElementById('recorderContainer');
        
        if (content.style.maxHeight === '0px' || content.style.maxHeight === '') {
            // Expand
            content.style.maxHeight = '1000px';
            content.style.opacity = '1';
            btn.textContent = '▼';
            btn.title = 'Collapse panel';
        } else {
            // Collapse
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
            btn.textContent = '▶';
            btn.title = 'Expand panel';
        }
    }
    
    /**
     * Create visual anchor overlay
     */
    createVisualAnchorOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'visualAnchorOverlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.3);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            " id="visualAnchorBackdrop">
                <div style="
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 20px 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 10001;
                    min-width: 400px;
                    font-family: 'Jost', sans-serif;
                    pointer-events: auto;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px; font-weight: 600;">
                        🎯 Visual Anchor Mode
                    </h3>
                    <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">
                        Click on the RGB image to set anchor points. Anchors will be numbered automatically.
                    </p>
                    <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <div style="font-size: 13px; color: #555; margin-bottom: 5px;">
                            Current anchors: <span id="anchorCount" style="font-weight: 600; color: #3498db;">0</span>
                        </div>
                        <div id="anchorList" style="font-size: 12px; color: #666; max-height: 100px; overflow-y: auto;"></div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="clearAnchorsBtn" style="
                            flex: 1;
                            padding: 10px;
                            background: #e74c3c;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 14px;
                        ">🗑️ Clear All</button>
                        <button id="undoAnchorBtn" style="
                            flex: 1;
                            padding: 10px;
                            background: #f39c12;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 14px;
                        ">↩️ Undo</button>
                        <button id="doneAnchorsBtn" style="
                            flex: 1;
                            padding: 10px;
                            background: #27ae60;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 14px;
                        ">✓ Done</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // State for visual anchor mode
        this.visualAnchors = [];
        this.visualAnchorMarkers = [];
        
        console.log('Visual anchor overlay created');
    }
    
    /**
     * Enter visual anchor mode
     */
    enterVisualAnchorMode() {
        console.log('Entering visual anchor mode...');
        
        const overlay = document.getElementById('visualAnchorOverlay');
        if (!overlay) {
            console.error('Visual anchor overlay not found!');
            return;
        }
        overlay.style.display = 'block';
        
        // Clear previous anchors and markers
        this.visualAnchors = [];
        this.clearAnchorMarkers();
        this.updateAnchorList();
        
        // Remove previous click listener if exists
        const rgbSide = this.magnifier.rgbSide;
        if (!rgbSide) {
            console.error('RGB side element not found!');
            return;
        }
        
        if (this.anchorClickHandler) {
            rgbSide.removeEventListener('click', this.anchorClickHandler);
        }
        
        // Add click listener to RGB image
        this.anchorClickHandler = (e) => this.handleAnchorClick(e);
        rgbSide.addEventListener('click', this.anchorClickHandler);
        
        // Change cursor
        rgbSide.style.cursor = 'crosshair';
        
        // Bind button events (remove old listeners first to prevent duplicates)
        const clearBtn = document.getElementById('clearAnchorsBtn');
        const undoBtn = document.getElementById('undoAnchorBtn');
        const doneBtn = document.getElementById('doneAnchorsBtn');
        
        if (clearBtn) {
            clearBtn.onclick = () => this.clearVisualAnchors();
        }
        if (undoBtn) {
            undoBtn.onclick = () => this.undoLastAnchor();
        }
        if (doneBtn) {
            doneBtn.onclick = () => this.exitVisualAnchorMode();
        }
        
        console.log('Entered visual anchor mode successfully');
    }
    
    /**
     * Exit visual anchor mode
     */
    exitVisualAnchorMode() {
        const overlay = document.getElementById('visualAnchorOverlay');
        overlay.style.display = 'none';
        
        // Remove click listener
        const rgbSide = this.magnifier.rgbSide;
        if (this.anchorClickHandler) {
            rgbSide.removeEventListener('click', this.anchorClickHandler);
        }
        
        // Restore cursor
        rgbSide.style.cursor = 'default';
        
        // Set anchors if any were created
        if (this.visualAnchors.length > 0) {
            this.setAnchors(this.visualAnchors);
            alert(`Successfully set ${this.visualAnchors.length} anchors!`);
        }
        
        console.log('Exited visual anchor mode');
    }
    
    /**
     * Handle click on RGB image to add anchor
     */
    handleAnchorClick(e) {
        console.log('Click detected at:', e.clientX, e.clientY);
        
        // Stop event propagation
        e.stopPropagation();
        e.preventDefault();
        
        const rect = this.magnifier.rgbImage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('Relative position:', x, y);
        console.log('Rect bounds:', rect);
        
        // Calculate normalized coordinates (0-1)
        const normalizedX = x / rect.width;
        const normalizedY = y / rect.height;
        
        console.log('Normalized:', normalizedX, normalizedY);
        
        // Clamp to valid range
        if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) {
            console.warn('Click outside valid range');
            return;
        }
        
        // Add anchor
        const anchorIndex = this.visualAnchors.length + 1;
        this.visualAnchors.push({
            x: normalizedX,
            y: normalizedY,
            name: `Anchor ${anchorIndex}`
        });
        
        console.log(`Added anchor ${anchorIndex}`);
        
        // Add visual marker
        this.addAnchorMarker(x, y, anchorIndex);
        
        // Update UI
        this.updateAnchorList();
        
        console.log(`Successfully added anchor ${anchorIndex} at (${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)})`);
    }
    
    /**
     * Add visual marker at anchor position
     */
    addAnchorMarker(x, y, index) {
        const marker = document.createElement('div');
        marker.className = 'anchor-marker';
        marker.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 24px;
            height: 24px;
            background: #e74c3c;
            border: 3px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 9998;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
            font-family: 'Jost', sans-serif;
            animation: anchorPulse 0.3s ease-out;
        `;
        marker.textContent = index;
        
        // Add to RGB side
        this.magnifier.rgbSide.appendChild(marker);
        this.visualAnchorMarkers.push(marker);
        
        // Add pulse animation
        const style = document.createElement('style');
        if (!document.getElementById('anchorPulseStyle')) {
            style.id = 'anchorPulseStyle';
            style.textContent = `
                @keyframes anchorPulse {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.3); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Clear all anchor markers
     */
    clearAnchorMarkers() {
        this.visualAnchorMarkers.forEach(marker => marker.remove());
        this.visualAnchorMarkers = [];
    }
    
    /**
     * Clear all visual anchors
     */
    clearVisualAnchors() {
        this.visualAnchors = [];
        this.clearAnchorMarkers();
        this.updateAnchorList();
        console.log('Cleared all anchors');
    }
    
    /**
     * Undo last anchor
     */
    undoLastAnchor() {
        if (this.visualAnchors.length === 0) return;
        
        this.visualAnchors.pop();
        const lastMarker = this.visualAnchorMarkers.pop();
        if (lastMarker) {
            lastMarker.remove();
        }
        this.updateAnchorList();
        console.log('Undid last anchor');
    }
    
    /**
     * Update anchor list display
     */
    updateAnchorList() {
        const countEl = document.getElementById('anchorCount');
        const listEl = document.getElementById('anchorList');
        
        countEl.textContent = this.visualAnchors.length;
        
        if (this.visualAnchors.length === 0) {
            listEl.innerHTML = '<em style="color: #999;">No anchors set</em>';
        } else {
            listEl.innerHTML = this.visualAnchors.map((anchor, i) => 
                `<div style="margin-bottom: 3px;">
                    ${i + 1}. ${anchor.name}: (${anchor.x.toFixed(3)}, ${anchor.y.toFixed(3)})
                </div>`
            ).join('');
        }
    }
    
    /**
     * Show dialog to set anchors
     */
    showAnchorDialog() {
        // Simple example format without pre-loaded anchors
        const exampleAnchors = [
            { x: 0.3, y: 0.4, name: "Point 1" },
            { x: 0.7, y: 0.6, name: "Point 2" }
        ];
        
        const anchorsStr = JSON.stringify(exampleAnchors, null, 2);
        
        const userInput = prompt(
            'Enter anchors as JSON array.\nEach anchor has x, y (0-1 range) and optional name:\n' +
            'Tip: Use Visual Mode (🎯 button) to set anchors by clicking on the image!\n\n' +
            'Example format:',
            anchorsStr
        );
        
        if (userInput) {
            try {
                const anchors = JSON.parse(userInput);
                this.setAnchors(anchors);
                alert(`Successfully set ${anchors.length} anchors!`);
            } catch (e) {
                alert('Invalid JSON format: ' + e.message);
            }
        }
    }
    
    /**
     * Start automatic recording
     */
    start() {
        if (this.isRecording) {
            console.log('Already recording');
            return;
        }
        
        // Check if anchors are set
        if (this.anchors.length === 0) {
            alert('Please set anchors first using Visual Mode or JSON input!');
            return;
        }
        
        // Clear visual anchor markers when starting recording
        this.clearAnchorMarkers();
        
        this.isRecording = true;
        this.isPaused = false;
        this.currentAnchorIndex = -1;
        
        // Reset warmup state
        this.isWarmupCycle = this.config.enableWarmup;
        this.warmupCycleCount = 0;
        
        // Reset to initial position (first anchor)
        const firstAnchor = this.anchors[0];
        const rect = this.magnifier.rgbImage.getBoundingClientRect();
        this.currentX = firstAnchor.x * rect.width;
        this.currentY = firstAnchor.y * rect.height;
        this.currentPatchSize = this.magnifier.config.initialPatchSize;
        
        // Update UI
        this.updateUI('Recording', '#27ae60');
        document.getElementById('startRecordingBtn').style.display = 'none';
        document.getElementById('pauseRecordingBtn').style.display = 'block';
        
        // Start animation loop
        this.moveToNextAnchor();
        
        console.log('Auto recording started' + (this.isWarmupCycle ? ' (with warmup)' : ''));
    }
    
    /**
     * Stop recording
     */
    stop() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.isPaused = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Hide magnifier lens with animation
        this.magnifier.isHovering = false;
        this.magnifier.lens.classList.remove('active');
        this.magnifier.zoomInfo.classList.remove('active');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            this.magnifier.lens.style.display = 'none';
            this.magnifier.zoomInfo.style.display = 'none';
            
            // Restore full depth image
            this.magnifier.drawFullDepth();
        }, 300);
        
        // Update UI
        this.updateUI('Idle', '#e74c3c');
        document.getElementById('startRecordingBtn').style.display = 'block';
        document.getElementById('pauseRecordingBtn').style.display = 'none';
        document.getElementById('recorderAnchor').textContent = '-';
        document.getElementById('recorderState').textContent = '-';
        
        console.log('Auto recording stopped');
    }
    
    /**
     * Toggle pause
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pauseRecordingBtn');
        btn.textContent = this.isPaused ? '▶ Resume' : '⏸ Pause';
        this.updateUI(this.isPaused ? 'Paused' : 'Recording', this.isPaused ? '#f39c12' : '#27ae60');
        console.log('Recording ' + (this.isPaused ? 'paused' : 'resumed'));
    }
    
    /**
     * Update UI status
     */
    updateUI(status, color) {
        const statusEl = document.getElementById('recorderStatus');
        statusEl.textContent = status;
        statusEl.style.color = color;
    }
    
    /**
     * Move to next anchor
     */
    moveToNextAnchor() {
        // 检查是否需要继续预热循环
        if (this.isWarmupCycle && this.currentAnchorIndex === 0) {
            // 已经在第一个锚点，检查预热次数
            if (this.warmupCycleCount < this.config.warmupCycles) {
                // 继续预热循环
                this.warmupCycleCount++;
                console.log(`Warmup cycle ${this.warmupCycleCount}/${this.config.warmupCycles} at first anchor`);
                
                const anchor = this.anchors[0];
                document.getElementById('recorderAnchor').textContent = 
                    `Warmup ${this.warmupCycleCount}/${this.config.warmupCycles} - ${anchor.name}`;
                
                // 直接进入第一个锚点的 paused 状态
                this.state = 'paused';
                this.stateStartTime = Date.now();
                this.pauseEndTime = Date.now() + this.config.pauseAtAnchor;
                this.nextState = 'zooming_in';
                
                this.animate();
                return;
            } else {
                // 预热完成，开始正式录制
                console.log('Warmup complete, starting actual recording...');
                this.isWarmupCycle = false;
                // 继续执行正常的第一个锚点流程
            }
        }
        
        this.currentAnchorIndex++;
        
        if (this.currentAnchorIndex >= this.anchors.length) {
            // Finished all anchors
            console.log('Finished all anchors!');
            
            if (this.config.showFullImageAfterComplete) {
                // 展示完整图像
                this.showFullImageAndFinish();
                return;
            } else if (this.config.loopAfterComplete) {
                // 循环模式
                console.log('Looping back to first anchor...');
                this.currentAnchorIndex = 0;
            } else {
                // 停止录制
                console.log('Auto recording complete, stopping...');
                this.stop();
                return;
            }
        }
        
        const anchor = this.anchors[this.currentAnchorIndex];
        const isFirstAnchor = this.currentAnchorIndex === 0;
        
        console.log(`Moving to anchor ${this.currentAnchorIndex + 1}/${this.anchors.length}: ${anchor.name}`);
        
        document.getElementById('recorderAnchor').textContent = 
            `${this.currentAnchorIndex + 1}/${this.anchors.length} - ${anchor.name}`;
        
        // For first anchor, skip movement and go directly to pause state
        if (isFirstAnchor) {
            console.log('First anchor - skipping movement, going directly to pause');
            const rect = this.magnifier.rgbImage.getBoundingClientRect();
            this.targetX = anchor.x * rect.width;
            this.targetY = anchor.y * rect.height;
            this.currentX = this.targetX;
            this.currentY = this.targetY;
            this.startX = this.currentX;
            this.startY = this.currentY;
            
            // Update magnifier to first position
            this.updateMagnifier();
            
            // Go directly to paused state before zooming
            this.state = 'paused';
            this.stateStartTime = Date.now();
            this.pauseEndTime = Date.now() + this.config.pauseAtAnchor;
            this.nextState = 'zooming_in';
            
            // Start animation loop
            this.animate();
            return;
        }
        
        // Normal movement for other anchors
        this.state = 'moving';
        this.stateStartTime = Date.now();
        
        // Calculate target position
        const rect = this.magnifier.rgbImage.getBoundingClientRect();
        this.targetX = anchor.x * rect.width;
        this.targetY = anchor.y * rect.height;
        this.startX = this.currentX;
        this.startY = this.currentY;
        
        // Start animation
        this.animate();
    }
    
    /**
     * Show full image and finish recording
     */
    showFullImageAndFinish() {
        console.log('Showing full image before finish...');
        
        this.state = 'finishing';
        this.stateStartTime = Date.now();
        this.pauseEndTime = Date.now() + this.config.pauseBeforeFinish;
        
        document.getElementById('recorderAnchor').textContent = 'Completed - Full View';
        document.getElementById('recorderState').textContent = 'FINISHING';
        
        // 渐变隐藏放大镜效果
        this.magnifier.isHovering = false;
        this.magnifier.lens.classList.remove('active');
        this.magnifier.zoomInfo.classList.remove('active');
        
        // 等待动画完成后隐藏并展示完整图像
        setTimeout(() => {
            this.magnifier.lens.style.display = 'none';
            this.magnifier.zoomInfo.style.display = 'none';
            
            // 恢复完整的深度图
            this.magnifier.drawFullDepth();
            
            console.log('Full image displayed');
        }, 300);
        
        // 继续动画循环以等待停止
        this.animate();
    }
    
    /**
     * Main animation loop
     */
    animate() {
        if (!this.isRecording) return;
        
        const now = Date.now();
        
        // Frame rate control - 限制帧率避免过快更新导致卡顿
        if (this.lastFrameTime > 0) {
            this.deltaTime = now - this.lastFrameTime;
            // 如果距离上一帧时间太短，跳过本帧
            if (this.deltaTime < this.config.frameTime * 0.8) {
                this.animationFrameId = requestAnimationFrame(() => this.animate());
                return;
            }
        }
        this.lastFrameTime = now;
        
        // Handle pause
        if (this.isPaused) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        // State machine
        switch (this.state) {
            case 'moving':
                this.handleMoving(now);
                break;
            case 'paused':
                this.handlePause(now);
                break;
            case 'zooming_in':
                this.handleZoomIn(now);
                break;
            case 'zooming_out':
                this.handleZoomOut(now);
                break;
            case 'finishing':
                this.handleFinishing(now);
                break;
        }
        
        // Update UI state
        document.getElementById('recorderState').textContent = this.state.replace('_', ' ').toUpperCase();
        
        // Continue animation
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Handle moving state
     */
    handleMoving(now) {
        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate progress
        const elapsed = now - this.stateStartTime;
        const duration = distance / this.config.moveSpeed; // Adaptive duration based on distance
        let progress = Math.min(1, elapsed / duration);
        
        // Apply easing
        const easingFunc = this.easing[this.config.moveEasing] || this.easing.easeInOutCubic;
        progress = easingFunc(progress);
        
        // Calculate target position based on eased progress
        const targetX = this.startX + dx * progress;
        const targetY = this.startY + dy * progress;
        
        // Apply smooth interpolation for ultra-smooth motion
        if (this.config.positionSmoothing) {
            // 使用更强的指数平滑，考虑时间差以保持帧率独立性
            const frameNormalization = this.deltaTime > 0 ? (this.deltaTime / 16.67) : 1;
            const smoothing = Math.min(1, this.config.smoothingFactor * frameNormalization);
            
            // 多级平滑：先平滑一次，再微调
            const intermediateX = this.currentX + (targetX - this.currentX) * smoothing;
            const intermediateY = this.currentY + (targetY - this.currentY) * smoothing;
            
            // 二次平滑让移动更柔和
            const secondarySmoothFactor = 0.6;
            this.currentX = this.currentX + (intermediateX - this.currentX) * secondarySmoothFactor;
            this.currentY = this.currentY + (intermediateY - this.currentY) * secondarySmoothFactor;
        } else {
            this.currentX = targetX;
            this.currentY = targetY;
        }
        
        // Update magnifier
        this.updateMagnifier();
        
        // Check if reached target with tolerance
        const remainingDistance = Math.sqrt(
            Math.pow(this.targetX - this.currentX, 2) + 
            Math.pow(this.targetY - this.currentY, 2)
        );
        
        // 当进度完成且位置足够接近时才切换状态
        if (elapsed >= duration && remainingDistance < 3) {
            console.log('Reached anchor, pausing before zoom...');
            // 平滑过渡到精确位置
            this.currentX = this.targetX;
            this.currentY = this.targetY;
            this.updateMagnifier(); // 确保最终位置准确
            
            this.state = 'paused';
            this.stateStartTime = now;
            this.pauseEndTime = now + this.config.pauseAtAnchor;
            this.nextState = 'zooming_in';
        }
    }
    
    /**
     * Handle pause state
     */
    handlePause(now) {
        if (now >= this.pauseEndTime) {
            console.log(`Pause ended, transitioning to ${this.nextState}`);
            
            // Check if we need to move to next anchor
            if (this.nextState === 'moving_to_next') {
                this.moveToNextAnchor();
                return;
            }
            
            this.state = this.nextState;
            this.stateStartTime = now;
            
            if (this.state === 'zooming_in') {
                this.startPatchSize = this.currentPatchSize;
                // Use minPatchSize directly (e.g., 32) instead of multiplier
                this.targetPatchSize = this.config.useMinPatchSize 
                    ? this.magnifier.config.minPatchSize 
                    : this.magnifier.config.minPatchSize * this.config.maxZoomLevel;
                console.log(`Zooming in from ${this.startPatchSize} to ${this.targetPatchSize}`);
            } else if (this.state === 'zooming_out') {
                this.startPatchSize = this.currentPatchSize;
                this.targetPatchSize = this.magnifier.config.initialPatchSize;
                console.log(`Zooming out from ${this.startPatchSize} to ${this.targetPatchSize}`);
            }
        }
    }
    
    /**
     * Handle zoom in state
     */
    handleZoomIn(now) {
        const elapsed = now - this.stateStartTime;
        const sizeChange = Math.abs(this.targetPatchSize - this.startPatchSize);
        const duration = sizeChange / this.config.zoomSpeed;
        let progress = Math.min(1, elapsed / duration);
        
        // Apply easing
        const easingFunc = this.easing[this.config.zoomEasing] || this.easing.easeInOutCubic;
        progress = easingFunc(progress);
        
        // Update patch size with smooth interpolation
        const targetSize = this.startPatchSize + (this.targetPatchSize - this.startPatchSize) * progress;
        
        // 应用平滑插值让缩放更柔和
        const sizeSmoothingFactor = this.config.zoomSmoothing;
        this.currentPatchSize += (targetSize - this.currentPatchSize) * sizeSmoothingFactor;
        
        // Update magnifier
        this.updateMagnifier();
        
        // Check if reached max zoom
        const remainingZoom = Math.abs(this.currentPatchSize - this.targetPatchSize);
        if (elapsed >= duration && remainingZoom < 1) {
            console.log('Reached max zoom, pausing...');
            this.currentPatchSize = this.targetPatchSize; // 确保最终大小精确
            this.updateMagnifier();
            
            this.state = 'paused';
            this.stateStartTime = now;
            
            // 预热循环使用更短的停留时间
            const pauseDuration = this.isWarmupCycle 
                ? this.config.warmupPauseAtZoom 
                : this.config.pauseAtZoom;
            this.pauseEndTime = now + pauseDuration;
            this.nextState = 'zooming_out';
        }
    }
    
    /**
     * Handle zoom out state
     */
    handleZoomOut(now) {
        const elapsed = now - this.stateStartTime;
        const sizeChange = Math.abs(this.targetPatchSize - this.startPatchSize);
        const duration = sizeChange / this.config.zoomSpeed;
        let progress = Math.min(1, elapsed / duration);
        
        // Apply easing
        const easingFunc = this.easing[this.config.zoomEasing] || this.easing.easeInOutCubic;
        progress = easingFunc(progress);
        
        // Update patch size with smooth interpolation
        const targetSize = this.startPatchSize + (this.targetPatchSize - this.startPatchSize) * progress;
        
        // 应用平滑插值让缩放更柔和
        const sizeSmoothingFactor = this.config.zoomSmoothing;
        this.currentPatchSize += (targetSize - this.currentPatchSize) * sizeSmoothingFactor;
        
        // Update magnifier
        this.updateMagnifier();
        
        // Check if reached original zoom
        const remainingZoom = Math.abs(this.currentPatchSize - this.targetPatchSize);
        if (elapsed >= duration && remainingZoom < 1) {
            console.log('Zoom out complete...');
            this.currentPatchSize = this.targetPatchSize; // 确保最终大小精确
            this.updateMagnifier();
            
            // 检查是否在预热循环中
            if (this.isWarmupCycle) {
                console.log('Warmup zoom cycle complete, repeating...');
                // 不暂停，直接回到第一个锚点继续预热
                this.moveToNextAnchor();
                return;
            }
            
            // 正常录制：暂停后移动到下一个锚点
            this.state = 'paused';
            this.stateStartTime = now;
            this.pauseEndTime = now + this.config.pauseAfterZoomOut;
            this.nextState = 'moving_to_next';  // Special state to trigger next anchor
        }
    }
    
    /**
     * Handle finishing state (showing full image)
     */
    handleFinishing(now) {
        if (now >= this.pauseEndTime) {
            console.log('Finishing state complete, stopping recording...');
            this.stop();
        }
    }
    
    /**
     * Update magnifier position and zoom
     */
    updateMagnifier() {
        const rect = this.magnifier.rgbImage.getBoundingClientRect();
        
        // Create synthetic mouse event
        const syntheticEvent = {
            clientX: rect.left + this.currentX,
            clientY: rect.top + this.currentY
        };
        
        // Update patch size
        this.magnifier.patchSize = this.currentPatchSize;
        
        // Enable magnifier lens display if not already active
        // (This should only happen once, after pre-initialization)
        if (!this.magnifier.isHovering) {
            this.magnifier.isHovering = true;
            this.magnifier.lens.style.display = 'block';
            this.magnifier.zoomInfo.style.display = 'block';
            
            // Initialize position for smooth display
            this.magnifier.targetPos = { x: this.currentX, y: this.currentY };
            this.magnifier.currentPos = { x: this.currentX, y: this.currentY };
            
            // Add active class immediately (no delay to avoid stuttering)
            this.magnifier.lens.classList.add('active');
            this.magnifier.zoomInfo.classList.add('active');
        }
        
        // Update magnifier position (this will update both lens and depth patch)
        this.magnifier.updateLensPositionDirect(syntheticEvent);
        
        // Update zoom info - 显示缩放倍数而非 patch size
        if (this.magnifier.zoomInfo) {
            const initialPatchSize = this.magnifier.config.initialPatchSize;
            const zoomFactor = initialPatchSize / this.currentPatchSize;
            this.magnifier.zoomInfo.textContent = `Zoom: ${zoomFactor.toFixed(1)}×`;
        }
    }
}

// Make it globally accessible
window.AutoRecorder = AutoRecorder;
