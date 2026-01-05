/**
 * Visualization Showcase Manager
 * Handles scene switching for depth, point cloud, and NVS visualizations
 */

// Scene configuration for visualization showcase
const VizShowcaseConfig = {
    // Depth visualization scenes
    // NOTE: Keep this in sync with InfiniDepthConfig.scenes
    depth: {
        scenes: [
            {
                name: 'Scene 1',
                rgb: 'images/pub/infinidepth/interactitve_depth/rgb1.png',
                depth: 'images/pub/infinidepth/interactitve_depth/depth1.png',
                thumbnail: 'images/pub/infinidepth/interactitve_depth/rgb1_low.png'
            },
            {
                name: 'Scene 2',
                rgb: 'images/pub/infinidepth/interactitve_depth/rgb_diode_1.png',
                depth: 'images/pub/infinidepth/interactitve_depth/depth_diode_1.png',
                thumbnail: 'images/pub/infinidepth/interactitve_depth/rgb_low_diode_1.png'
            },
            {
                name: 'Scene 3',
                rgb: 'images/pub/infinidepth/interactitve_depth/rgb3.png',
                depth: 'images/pub/infinidepth/interactitve_depth/depth3.png',
                thumbnail: 'images/pub/infinidepth/interactitve_depth/rgb3_low.png'
            },
            {
                name: 'Scene 4',
                rgb: 'images/pub/infinidepth/interactitve_depth/rgb4.png',
                depth: 'images/pub/infinidepth/interactitve_depth/depth4.png',
                thumbnail: 'images/pub/infinidepth/interactitve_depth/rgb4_low.png',
            },
            {
                name: 'Scene 5',
                rgb: 'images/pub/infinidepth/interactitve_depth/rgb_diode_2.png',
                depth: 'images/pub/infinidepth/interactitve_depth/depth_diode_2.png',
                thumbnail: 'images/pub/infinidepth/interactitve_depth/rgb_low_diode_2.png'
            },
            {
                name: 'Scene 6',
                rgb: 'images/pub/infinidepth/interactitve_depth/DSC_9260.png',
                depth: 'images/pub/infinidepth/interactitve_depth/PromptNeuralDepth_DSC_9260_up_5_disparity.png',
                thumbnail: 'images/pub/infinidepth/interactitve_depth/DSC_9260_low.png'
            },
            {
                name: 'Scene 7',
                rgb: 'images/pub/infinidepth/interactitve_depth/DSC_6493.png',
                depth: 'images/pub/infinidepth/interactitve_depth/PromptNeuralDepth_DSC_6493_up_5_disparity.png',
                thumbnail: 'images/pub/infinidepth/interactitve_depth/DSC_6493_low.png'
            },
        ]
    },

    // Point cloud visualization scenes
    pointcloud: {
        scenes: [
            {
                name: 'DIODE',
                plyFile: 'diode_filter.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/00019_00183_indoors_190_040_low.png'
            },
            {
                name: 'ETH',
                plyFile: 'eth_1.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/DSC_0219_low.png'
            },
            {
                name: 'ETH',
                plyFile: 'eth3dpipes__images__dslr_images__DSC_0644_filtered.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/DSC_0644_low.png'
            },
            {
                name: 'NYU',
                plyFile: 'nyudatasets__nyu__home_office__rgb_00555_filtered.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/rgb_555_low.png'
            },
            {
                name: 'NYU',
                plyFile: 'nyudatasets__nyu__home_office__rgb_00556_filtered.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/rgb_556_low.png'
            },
            {
                name: 'NYU',
                plyFile: 'nyudatasets__nyu__bedroom__rgb_01156_filtered.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/rgb_1156_low.png'
            },
            {
                name: 'ETH',
                plyFile: 'eth3delectro__images__dslr_images__DSC_9297_filtered.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/DSC_9297_low.png'
            },
            {
                name: 'DIODE',
                plyFile: 'PromptNeuralDepth_00019_00183_indoors_150_000_2d_uniform_up_1_disparity.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/00019_00183_indoors_150_000_low.png'
            },
            {
                name: 'DIODE',
                plyFile: 'PromptNeuralDepth_00019_00183_indoors_320_010_2d_uniform_up_1_disparity.ply',
                thumbnail: 'images/pub/infinidepth/pointclouds/00019_00183_indoors_320_010_low.png'
            },
        ]
    },

    // NVS visualization scenes
    nvs: {
        scenes: [
            {
                name: 'NVS Scene 2',
                video: 'images/pub/infinidepth/vis_nvs/12_88_orig_to_bev_transition.mp4',
                thumbnail:'images/pub/infinidepth/nvs_compare/rgb3.jpg',
            },
            {
                name: 'NVS Scene 3',
                video: 'images/pub/infinidepth/vis_nvs/147_30_orig_to_bev_transition.mp4',
                thumbnail: 'images/pub/infinidepth/nvs_compare/rgb4.jpg',
            },
             {
                name: 'NVS Scene 4',
                video: 'images/pub/infinidepth/vis_nvs/1_190_orig_to_bev_transition.mp4',
                thumbnail: 'images/pub/infinidepth/nvs_compare/rgb1.jpg',
            },
            {
                name: 'NVS Scene 5',
                video: 'images/pub/infinidepth/vis_nvs/50_69_orig_to_bev_transition.mp4',
                thumbnail: 'images/pub/infinidepth/nvs_compare/rgb2.jpg',
            },
            {
                name: 'NVS Scene 1',
                video: 'images/pub/infinidepth/vis_nvs/0_36_orig_to_bev_transition.mp4',
                thumbnail: 'images/pub/infinidepth/nvs_compare/rgb5.jpg',
            },            
            {
                name: 'NVS Scene 6',
                video: 'images/pub/infinidepth/vis_nvs/15_54_orig_to_bev_transition.mp4',
                thumbnail: 'images/pub/infinidepth/nvs_compare/rgb8.jpg',
            },
        ]
    }
};

class VizShowcaseManager {
    constructor() {
        this.currentScenes = {
            depth: 0,
            pointcloud: 0,
            nvs: 0
        };

        this.maxVisible = 4; // 固定显示4张图
        this.startIndex = {
            depth: 0,
            pointcloud: 0,
            nvs: 0
        };

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
        this.setupDepthShowcase();
        this.setupPointCloudShowcase();
        this.setupNVSShowcase();

        // Initialize first depth scene on page load
        this.initFirstDepthScene();
    }

    /**
     * Create showcase with navigation arrows
     */
    createShowcaseWithArrows(showcaseId, scenes, onClickCallback) {
        const showcase = document.getElementById(showcaseId);
        if (!showcase) return null;

        const type = showcaseId.replace('-viz-showcase', '');

        // Create container and arrows
        const container = document.createElement('div');
        container.className = 'showcase-container';

        const leftArrow = document.createElement('div');
        leftArrow.className = 'showcase-arrow showcase-arrow-left';
        leftArrow.innerHTML = '&#9664;'; // ◀

        const rightArrow = document.createElement('div');
        rightArrow.className = 'showcase-arrow showcase-arrow-right';
        rightArrow.innerHTML = '&#9654;'; // ▶

        // Replace showcase with container
        const parent = showcase.parentNode;
        parent.replaceChild(container, showcase);
        container.appendChild(leftArrow);
        container.appendChild(showcase);
        container.appendChild(rightArrow);

        const renderThumbs = () => {
            showcase.innerHTML = '';
            const startIdx = this.startIndex[type];
            const endIdx = Math.min(startIdx + this.maxVisible, scenes.length);
            const visibleScenes = scenes.slice(startIdx, endIdx);

            visibleScenes.forEach((scene, idx) => {
                const actualIdx = startIdx + idx;
                const thumb = document.createElement('img');
                thumb.src = scene.thumbnail;
                thumb.className = 'showcase-thumb' + (actualIdx === 0 && startIdx === 0 ? ' active' : '');
                thumb.alt = scene.name;
                thumb.dataset.index = actualIdx;

                thumb.addEventListener('click', () => {
                    showcase.querySelectorAll('.showcase-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    onClickCallback(actualIdx);
                });

                showcase.appendChild(thumb);
            });

            updateArrows();
        };

        const updateArrows = () => {
            leftArrow.style.display = 'flex';
            rightArrow.style.display = 'flex';

            if (this.startIndex[type] === 0) {
                leftArrow.classList.add('disabled');
            } else {
                leftArrow.classList.remove('disabled');
            }

            if (this.startIndex[type] + this.maxVisible >= scenes.length) {
                rightArrow.classList.add('disabled');
            } else {
                rightArrow.classList.remove('disabled');
            }
        };

        leftArrow.addEventListener('click', () => {
            if (this.startIndex[type] > 0) {
                this.startIndex[type]--;
                renderThumbs();
            }
        });

        rightArrow.addEventListener('click', () => {
            if (this.startIndex[type] + this.maxVisible < scenes.length) {
                this.startIndex[type]++;
                renderThumbs();
            }
        });

        renderThumbs();
        return { showcase, renderThumbs };
    }

    /**
     * Initialize first depth scene on page load
     */
    initFirstDepthScene() {
        // Wait a short delay to ensure DOM is fully ready
        setTimeout(() => {
            this.switchDepthScene(0);
        }, 100);
    }

    /**
     * Setup depth visualization showcase
     */
    setupDepthShowcase() {
        const scenes = VizShowcaseConfig.depth.scenes;
        this.createShowcaseWithArrows('depth-viz-showcase', scenes, (idx) => {
            this.switchDepthScene(idx);
        });
    }

    /**
     * Switch depth visualization scene
     */
    switchDepthScene(sceneIndex) {
        const scene = VizShowcaseConfig.depth.scenes[sceneIndex];
        if (!scene) return;

        this.currentScenes.depth = sceneIndex;

        // Show loading overlay
        const loadingOverlay = document.getElementById('depthLoading');
        const interactiveComparison = document.querySelector('.interactive-comparison');

        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }

        if (interactiveComparison) {
            interactiveComparison.classList.add('loading');
        }

        // Track both image loading states
        let rgbLoaded = false;
        let depthLoaded = false;

        const checkBothLoaded = () => {
            if (rgbLoaded && depthLoaded) {
                // Both images loaded, hide loading overlay after a short delay
                setTimeout(() => {
                    if (loadingOverlay) {
                        loadingOverlay.classList.remove('active');
                        // Remove inline styles to allow CSS transitions
                        loadingOverlay.style.opacity = '';
                        loadingOverlay.style.visibility = '';
                    }
                    if (interactiveComparison) {
                        interactiveComparison.classList.remove('loading');
                        // Remove inline styles to allow CSS transitions
                        interactiveComparison.style.opacity = '';
                    }
                }, 200);
            }
        };

        // Update RGB image
        const rgbImage = document.getElementById('rgbImage');
        if (rgbImage) {
            const newRgbImage = new Image();
            newRgbImage.src = scene.rgb;

            newRgbImage.onload = () => {
                rgbImage.src = scene.rgb;
                rgbLoaded = true;
                checkBothLoaded();
            };

            newRgbImage.onerror = () => {
                console.error('Failed to load RGB image:', scene.rgb);
                rgbImage.src = scene.rgb;
                rgbLoaded = true;
                checkBothLoaded();
            };
        } else {
            rgbLoaded = true;
            checkBothLoaded();
        }

        // Preload depth image before triggering magnifier
        const depthImage = new Image();
        depthImage.src = scene.depth;

        depthImage.onload = () => {
            depthLoaded = true;

            // Directly load the depth image using loadDepthImages
            if (window.depthMagnifier && typeof window.depthMagnifier.loadDepthImages === 'function') {
                window.depthMagnifier.loadDepthImages([scene.depth]);
            }

            checkBothLoaded();
        };

        depthImage.onerror = () => {
            console.error('Failed to load depth image:', scene.depth);
            depthLoaded = true;

            // Still trigger magnifier even if depth failed
            if (window.depthMagnifier && typeof window.depthMagnifier.loadDepthImages === 'function') {
                window.depthMagnifier.loadDepthImages([scene.depth]);
            }

            checkBothLoaded();
        };
    }

    /**
     * Setup point cloud visualization showcase
     */
    setupPointCloudShowcase() {
        const scenes = VizShowcaseConfig.pointcloud.scenes;
        this.createShowcaseWithArrows('pointcloud-viz-showcase', scenes, (idx) => {
            this.switchPointCloudScene(idx);
        });
    }

    /**
     * Switch point cloud scene
     */
    switchPointCloudScene(sceneIndex) {
        const scene = VizShowcaseConfig.pointcloud.scenes[sceneIndex];
        if (!scene) return;

        this.currentScenes.pointcloud = sceneIndex;

        // Trigger point cloud viewer to load new PLY file
        // This will be handled by pointcloud-viewer.js
        const event = new CustomEvent('loadPointCloud', {
            detail: { plyFile: scene.plyFile }
        });
        window.dispatchEvent(event);
    }

    /**
     * Setup NVS visualization showcase
     */
    setupNVSShowcase() {
        const scenes = VizShowcaseConfig.nvs.scenes;
        this.createShowcaseWithArrows('nvs-viz-showcase', scenes, (idx) => {
            this.switchNVSScene(idx);
        });

        // Load first scene automatically
        this.switchNVSScene(0);
    }

    /**
     * Switch NVS scene
     */
    switchNVSScene(sceneIndex) {
        const scene = VizShowcaseConfig.nvs.scenes[sceneIndex];
        if (!scene) return;

        this.currentScenes.nvs = sceneIndex;

        // Update video source
        const video = document.getElementById('nvs-video');
        if (video) {
            const container = video.parentElement;

            // Show loading overlay
            let overlay = container.querySelector('.video-loading-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'video-loading-overlay';
                overlay.innerHTML = `
                    <div class="image-spinner"></div>
                `;
                container.style.position = 'relative';
                container.appendChild(overlay);
            } else {
                // Make sure overlay is visible
                overlay.classList.remove('hidden');
            }

            const source = video.querySelector('source');
            if (source) {
                source.src = scene.video;

                // Ensure video has autoplay, loop, and muted attributes
                video.loop = true;
                video.muted = true;

                video.load(); // Reload video with new source

                // Hide loading overlay when video is ready
                const hideLoading = () => {
                    setTimeout(() => {
                        if (overlay) {
                            overlay.classList.add('hidden');
                        }
                    }, 200);
                };

                // Auto-play video after it's loaded
                video.addEventListener('loadeddata', function autoPlay() {
                    hideLoading();
                    video.play().catch(err => {
                        console.log('Auto-play prevented:', err);
                    });
                    // Remove the event listener after first play
                    video.removeEventListener('loadeddata', autoPlay);
                }, { once: true });

                // Also handle error case
                video.addEventListener('error', () => {
                    hideLoading();
                }, { once: true });
            }
        }
    }
}

// Initialize the showcase manager
const vizShowcaseManager = new VizShowcaseManager();

// Export for global access
if (typeof window !== 'undefined') {
    window.vizShowcaseManager = vizShowcaseManager;
    window.VizShowcaseConfig = VizShowcaseConfig;
}
