/**
 * Loading Effects Manager
 * Handles page loading, image transitions, videos, and point clouds
 */

class LoadingManager {
    constructor() {
        this.init();
    }

    init() {
        // Page loader is now in HTML, no need to create it
        // this.createPageLoader();

        // Setup image loading transitions
        this.setupImageLoadingTransitions();

        // Enhance point cloud loading
        this.enhancePointCloudLoading();

        // Video loading will be setup after page loader finishes
        // this.setupVideoLoading();

        // Start page load
        this.startPageLoad();
    }

    createPageLoader() {
        // Deprecated: Page loader is now created in HTML
        // This method is kept for backward compatibility but does nothing
    }

    startPageLoad() {
        // Wait for DOM content loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    onDOMReady() {
        // Simple 0.5 second delay for initial load animation
        setTimeout(() => {
            this.hidePageLoader();
        }, 500);
    }

    hidePageLoader() {
        const loader = document.getElementById('page-loader');

        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }

        // Remove loading class from body to show content
        document.body.classList.remove('loading');

        // Add fade-in animation to sections
        document.querySelectorAll('section').forEach((section, idx) => {
            setTimeout(() => {
                section.classList.add('fade-in');
            }, idx * 100);
        });

        // Start video loading after page loader finishes (after fade-out completes)
        setTimeout(() => {
            this.setupVideoLoading();
        }, 500);
    }

    setupVideoLoading() {
        const video = document.getElementById('overviewVideo');
        const overlay = document.getElementById('video-loading-overlay');

        if (!video || !overlay) return;

        const barFill = overlay.querySelector('.video-loading-bar-fill');

        // Show loading overlay
        overlay.classList.remove('hidden');

        // Initialize bar at 0%
        barFill.style.width = '0%';

        // Flag to ensure we only start video once
        let videoStarted = false;
        let currentDisplayPercentage = 0;
        let targetPercentage = 0;
        let animationFrameId = null;
        let progressCheckInterval = null;
        let startTime = Date.now();
        let minLoadingTime = 2000; // Minimum 2 seconds for loading animation visibility
        let metadataLoaded = false;

        // Smoothly animate progress bar
        const animateProgress = () => {
            if (currentDisplayPercentage < targetPercentage) {
                // Smoothly increment display percentage with slower rate for better visibility
                const increment = (targetPercentage - currentDisplayPercentage) * 0.08;
                currentDisplayPercentage += Math.max(increment, 0.3);

                if (currentDisplayPercentage > targetPercentage) {
                    currentDisplayPercentage = targetPercentage;
                }

                barFill.style.width = currentDisplayPercentage + '%';
            }

            if (!videoStarted) {
                animationFrameId = requestAnimationFrame(animateProgress);
            }
        };

        // Start animation immediately
        animateProgress();

        // Function to start video playback
        const startVideoPlayback = () => {
            if (videoStarted) return;

            // Ensure minimum loading time has passed
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < minLoadingTime) {
                setTimeout(() => startVideoPlayback(), minLoadingTime - elapsedTime);
                return;
            }

            videoStarted = true;

            // Stop checking progress
            if (progressCheckInterval) {
                clearInterval(progressCheckInterval);
            }

            // Cancel any pending animation
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            // Ensure we show 100% before hiding
            currentDisplayPercentage = 100;
            targetPercentage = 100;
            barFill.style.width = '100%';

            setTimeout(() => {
                overlay.classList.add('hidden');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    // Reset video to beginning and play
                    video.currentTime = 0;
                    video.play().catch(err => console.log('Video autoplay failed:', err));
                }, 600);
            }, 300);
        };

        // More accurate and reliable progress tracking
        const updateProgress = () => {
            // If metadata not loaded yet, simulate progress to 10%
            if (!metadataLoaded) {
                if (targetPercentage < 50) {
                    targetPercentage = Math.min(targetPercentage + 0.5, 50);
                }
                return;
            }

            if (!video.duration || video.duration === 0) {
                return;
            }

            const buffered = video.buffered;
            if (buffered.length > 0) {
                // Get the end of the last buffered range (most accurate for sequential loading)
                let maxBufferedEnd = 0;
                for (let i = 0; i < buffered.length; i++) {
                    const end = buffered.end(i);
                    if (end > maxBufferedEnd) {
                        maxBufferedEnd = end;
                    }
                }

                const percentage = Math.min((maxBufferedEnd / video.duration) * 100, 100);

                // Update target percentage for smooth animation
                if (percentage > targetPercentage) {
                    targetPercentage = percentage;
                    console.log('Video buffered:', Math.round(percentage) + '%', 'Duration:', video.duration, 'Buffered end:', maxBufferedEnd, 'ReadyState:', video.readyState);
                }

                // Only start playback when truly ready (sufficient buffering and can play through)
                if (percentage >= 95 && video.readyState >= 3 && !videoStarted) {
                    console.log('Video ready to play - buffered and readyState:', video.readyState);
                    // Ensure target is 100% for final animation
                    targetPercentage = 100;
                    setTimeout(() => {
                        if (!videoStarted) {
                            startVideoPlayback();
                        }
                    }, 500);
                }
            }
        };

        // Start polling progress immediately
        progressCheckInterval = setInterval(updateProgress, 100);

        // Listen to metadata loaded event
        const onMetadataLoaded = () => {
            console.log('Video metadata loaded, duration:', video.duration);
            metadataLoaded = true;
            // Jump to at least 20% when metadata loads
            if (targetPercentage < 50) {
                targetPercentage = 50;
            }
            updateProgress();
        };

        if (video.readyState >= 1) {
            // Metadata already loaded
            onMetadataLoaded();
        } else {
            // Wait for metadata to load
            video.addEventListener('loadedmetadata', onMetadataLoaded, { once: true });
        }

        // Listen to video events
        video.addEventListener('progress', () => {
            updateProgress();
        });

        video.addEventListener('canplay', () => {
            console.log('Video can play, readyState:', video.readyState);
            updateProgress();
        });

        video.addEventListener('canplaythrough', () => {
            console.log('Video can play through, readyState:', video.readyState);
            if (!videoStarted) {
                targetPercentage = 100;
                // Wait for animation to catch up
                setTimeout(() => {
                    if (!videoStarted) {
                        startVideoPlayback();
                    }
                }, 800);
            }
        });

        // Fallback: force playback after reasonable time
        setTimeout(() => {
            if (!videoStarted) {
                console.log('Video loading timeout, forcing playback. Current progress:', targetPercentage + '%');
                targetPercentage = 100;
                setTimeout(startVideoPlayback, 800);
            }
        }, 10000);

        // Initial check
        setTimeout(updateProgress, 100);
    }

    setupImageLoadingTransitions() {
        // Monitor all showcase galleries for image changes
        this.setupShowcaseImageTransitions();
    }

    setupShowcaseImageTransitions() {
        // Find all main images in comparison sections
        const mainImages = [
            { id: 'depth-main-img', type: 'image' },
            { id: 'pcd-main-img', type: 'image' },
            { id: 'nvs-main-img', type: 'image' }
        ];

        mainImages.forEach(({ id, type }) => {
            const img = document.getElementById(id);
            if (!img) return;

            // Create loading overlay for this image
            const container = img.parentElement;
            if (!container) return;

            // Ensure container has relative positioning
            container.style.position = 'relative';

            // Override image src setter to add loading effect
            const originalSrc = img.src;
            let currentOverlay = null;

            // Use MutationObserver to detect src changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                        const newSrc = img.src;
                        if (newSrc && newSrc !== originalSrc && !newSrc.includes('blob:')) {
                            this.showImageLoadingOverlay(img, container);
                        }
                    }
                });
            });

            observer.observe(img, { attributes: true });
        });
    }

    showImageLoadingOverlay(img, container) {
        // Remove existing overlay if any
        const existingOverlay = container.querySelector('.image-loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'image-loading-overlay';
        overlay.innerHTML = `
            <div class="image-spinner"></div>
        `;

        container.appendChild(overlay);

        // Wait for image to load
        const onLoad = () => {
            setTimeout(() => {
                overlay.classList.add('hidden');
                setTimeout(() => overlay.remove(), 300);
            }, 200);
        };

        if (img.complete) {
            onLoad();
        } else {
            img.addEventListener('load', onLoad, { once: true });
            img.addEventListener('error', () => {
                overlay.classList.add('hidden');
                setTimeout(() => overlay.remove(), 300);
            }, { once: true });
        }
    }

    enhancePointCloudLoading() {
        const loadingDiv = document.getElementById('pointcloud-loading');
        if (!loadingDiv) return;

        // Replace with spinner (consistent with qualitative comparison)
        loadingDiv.innerHTML = `
            <div class="image-spinner"></div>
        `;
    }

    // Public method to show loading for dynamic content
    static showLoading(element, message = 'Loading') {
        const overlay = document.createElement('div');
        overlay.className = 'image-loading-overlay';
        overlay.innerHTML = `
            <div class="image-spinner"></div>
        `;
        element.style.position = 'relative';
        element.appendChild(overlay);
        return overlay;
    }

    static hideLoading(overlay) {
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => overlay.remove(), 300);
        }
    }
}

// Initialize loading manager when script loads
const loadingManager = new LoadingManager();

// Export for global access
if (typeof window !== 'undefined') {
    window.LoadingManager = LoadingManager;
    window.loadingManager = loadingManager;
}
