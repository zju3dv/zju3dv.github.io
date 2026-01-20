/**
 * Gaussian Viewer Manager
 * Handles loading and displaying interactive Gaussian Splatting HTML files in iframe
 */

class GaussianViewerManager {
    constructor() {
        this.iframe = null;
        this.loadingOverlay = null;
        this.currentSceneIndex = 0;
        this.isReady = false;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('GaussianViewerManager: Setting up...');
        this.iframe = document.getElementById('gaussian-viewer');
        this.loadingOverlay = document.getElementById('gaussian-loading');

        if (!this.iframe) {
            console.error('Gaussian viewer iframe not found');
            return;
        }

        console.log('GaussianViewerManager: iframe found', this.iframe);
        console.log('GaussianViewerManager: loading overlay found', this.loadingOverlay);

        // Listen for scene loading events
        window.addEventListener('loadGaussianScene', (event) => {
            console.log('GaussianViewerManager: Received loadGaussianScene event', event.detail);
            this.loadScene(event.detail.htmlFile);
        });

        // Setup iframe load event handlers
        this.setupIframeHandlers();

        // Setup keyboard event handling to prevent page scroll when interacting with viewer
        this.setupKeyboardHandling();

        // Mark as ready
        this.isReady = true;
        console.log('GaussianViewerManager: Ready');

        // Notify that viewer is ready
        window.dispatchEvent(new CustomEvent('gaussianViewerReady'));
    }

    setupIframeHandlers() {
        if (!this.iframe) return;

        // Listen for load events on iframe
        this.iframe.addEventListener('load', () => {
            console.log('GaussianViewerManager: Iframe loaded successfully');
            this.hideLoading();
        });

        // Handle iframe errors
        this.iframe.addEventListener('error', (e) => {
            console.error('GaussianViewerManager: Failed to load Gaussian viewer', e);
            this.hideLoading();
            this.showError();
        });
    }

    setupKeyboardHandling() {
        if (!this.iframe) return;

        let iframeHasFocus = false;

        // Create hint element if it doesn't exist
        const createHint = () => {
            let hint = document.getElementById('viewer-keyboard-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.id = 'viewer-keyboard-hint';
                hint.className = 'viewer-hint';
                hint.innerHTML = '💡 Hover over the viewer and use arrow keys to navigate (arrow keys will control the viewer, not the page)';
                const container = this.iframe.parentElement;
                container.parentElement.insertBefore(hint, container.nextSibling);
            }
            return hint;
        };

        const hint = createHint();

        // Track when user hovers over iframe (viewer becomes active)
        this.iframe.addEventListener('mouseenter', () => {
            iframeHasFocus = true;
            this.iframe.classList.add('active');
            hint.classList.add('active');
            hint.innerHTML = '🎮 Viewer active - Use arrow keys to navigate (page scroll disabled)';
            // Disable page scroll by preventing overflow
            document.body.style.overflow = 'hidden';
            console.log('GaussianViewerManager: Iframe focused, disabling page scroll');
        });

        // Track when user leaves iframe
        this.iframe.addEventListener('mouseleave', () => {
            iframeHasFocus = false;
            this.iframe.classList.remove('active');
            hint.classList.remove('active');
            hint.innerHTML = '💡 Hover over the viewer and use arrow keys to navigate (arrow keys will control the viewer, not the page)';
            // Re-enable page scroll
            document.body.style.overflow = '';
            console.log('GaussianViewerManager: Iframe unfocused, enabling page scroll');
        });

        // Prevent arrow key scrolling when iframe is in focus
        const preventArrowScroll = (e) => {
            // Check if it's an arrow key using both modern and legacy methods
            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            const arrowKeyCodes = [37, 38, 39, 40];
            const isArrowKey = arrowKeys.includes(e.key) || arrowKeyCodes.includes(e.keyCode);

            // Only prevent if iframe area has focus AND it's an arrow key
            if (iframeHasFocus && isArrowKey) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('GaussianViewerManager: Prevented arrow key scroll', e.key || e.keyCode);
                return false;
            }
        };

        // Listen to both keydown and keyup with capture phase to catch all events
        window.addEventListener('keydown', preventArrowScroll, true);
        window.addEventListener('keyup', preventArrowScroll, true);

        // Store reference for potential cleanup
        this.keydownHandler = preventArrowScroll;
    }

    loadScene(htmlFile) {
        if (!this.iframe || !htmlFile) {
            console.error('GaussianViewerManager: Cannot load scene - iframe or htmlFile missing');
            return;
        }

        console.log('GaussianViewerManager: Loading scene:', htmlFile);

        // Show loading overlay and hide iframe
        this.showLoading();
        this.iframe.classList.remove('loaded');

        // Add a one-time load handler for this specific load
        const onLoad = () => {
            console.log('GaussianViewerManager: Scene loaded via onLoad handler');

            // Wait a bit longer to ensure iframe content is fully rendered
            setTimeout(() => {
                this.hideLoading();
                this.iframe.classList.add('loaded');
            }, 800);

            this.iframe.removeEventListener('load', onLoad);
        };

        this.iframe.addEventListener('load', onLoad);

        // Load the HTML file in iframe
        this.iframe.src = htmlFile;

        // Fallback: hide loading after 3 seconds if load event doesn't fire
        setTimeout(() => {
            if (this.loadingOverlay && this.loadingOverlay.style.display !== 'none') {
                console.log('GaussianViewerManager: Fallback - hiding loading after timeout');
                this.hideLoading();
                this.iframe.classList.add('loaded');
            }
        }, 3000);
    }

    showLoading() {
        console.log('GaussianViewerManager: Showing loading overlay');
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
            this.loadingOverlay.style.opacity = '1';
        }
    }

    hideLoading() {
        console.log('GaussianViewerManager: Hiding loading overlay');
        if (this.loadingOverlay) {
            // Fade out animation
            this.loadingOverlay.style.opacity = '0';

            // Remove from DOM after transition
            setTimeout(() => {
                this.loadingOverlay.style.display = 'none';
            }, 400);
        }
    }

    showError() {
        if (this.loadingOverlay) {
            this.loadingOverlay.innerHTML = `
                <div style="text-align: center; color: #d32f2f;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <div class="loading-text">Failed to load viewer</div>
                    <div style="font-size: 0.9rem; margin-top: 8px; color: #666;">
                        Please check the HTML file path
                    </div>
                </div>
            `;
        }
    }

    // Public method to load a scene by index
    loadSceneByIndex(sceneIndex) {
        console.log('GaussianViewerManager: loadSceneByIndex called with:', sceneIndex);
        if (window.VizShowcaseConfig &&
            window.VizShowcaseConfig.nvsInteractive &&
            window.VizShowcaseConfig.nvsInteractive.scenes[sceneIndex]) {

            const scene = window.VizShowcaseConfig.nvsInteractive.scenes[sceneIndex];
            this.currentSceneIndex = sceneIndex;
            this.loadScene(scene.htmlFile);
        } else {
            console.error('GaussianViewerManager: Scene config not found');
        }
    }
}

// Initialize the viewer manager
console.log('GaussianViewerManager: Initializing...');
const gaussianViewerManager = new GaussianViewerManager();

// Export for global access
if (typeof window !== 'undefined') {
    window.gaussianViewerManager = gaussianViewerManager;
}
