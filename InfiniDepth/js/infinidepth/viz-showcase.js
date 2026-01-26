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
                rgb: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb1.png',
                depth: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_depth1.png',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb1_low.png'
            },
            {
                name: 'Scene 2',
                rgb: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb_diode_1.png',
                depth: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_depth_diode_1.png',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb_low_diode_1.png'
            },
            {
                name: 'Scene 3',
                rgb: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb3.png',
                depth: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_depth3.png',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb3_low.png'
            },
            {
                name: 'Scene 4',
                rgb: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb4.png',
                depth: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_depth4.png',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb4_low.png',
            },
            {
                name: 'Scene 5',
                rgb: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb_diode_2.png',
                depth: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_depth_diode_2.png',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_rgb_low_diode_2.png'
            },
            {
                name: 'Scene 6',
                rgb: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_DSC_9260.png',
                depth: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_PromptNeuralDepth_DSC_9260_up_5_disparity.png',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_DSC_9260_low.png'
            },
            {
                name: 'Scene 7',
                rgb: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_DSC_6493.png',
                depth: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_PromptNeuralDepth_DSC_6493_up_5_disparity.png',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/interactive-depth_DSC_6493_low.png'
            },
        ]
    },

    // Point cloud visualization scenes
    pointcloud: {
        scenes: [
            {
                name: 'DIODE',
                plyFile: 'pointclouds_diode_filter.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_00019_00183_indoors_190_040_low.png'
            },
            {
                name: 'ETH',
                plyFile: 'pointclouds_eth_1.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_DSC_0219_low.png'
            },
            {
                name: 'ETH',
                plyFile: 'pointclouds_eth3dpipes__images__dslr_images__DSC_0644_filtered.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_DSC_0644_low.png'
            },
            {
                name: 'NYU',
                plyFile: 'pointclouds_nyudatasets__nyu__home_office__rgb_00555_filtered.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_rgb_555_low.png'
            },
            {
                name: 'NYU',
                plyFile: 'pointclouds_nyudatasets__nyu__home_office__rgb_00556_filtered.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_rgb_556_low.png'
            },
            {
                name: 'NYU',
                plyFile: 'pointclouds_nyudatasets__nyu__bedroom__rgb_01156_filtered.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_rgb_1156_low.png'
            },
            {
                name: 'ETH',
                plyFile: 'pointclouds_eth3delectro__images__dslr_images__DSC_9297_filtered.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_DSC_9297_low.png'
            },
            {
                name: 'DIODE',
                plyFile: 'pointclouds_PromptNeuralDepth_00019_00183_indoors_150_000_2d_uniform_up_1_disparity.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_00019_00183_indoors_150_000_low.png'
            },
            {
                name: 'DIODE',
                plyFile: 'pointclouds_PromptNeuralDepth_00019_00183_indoors_320_010_2d_uniform_up_1_disparity.ply',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/pointclouds_00019_00183_indoors_320_010_low.png'
            },
        ]
    },

    // NVS visualization scenes
    nvs: {
        scenes: [
            {
                name: 'NVS Scene 2',
                video: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/vis-nvs_12_88_orig_to_bev_transition.mp4',
                thumbnail:'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/nvs-comparison_rgb3.jpg',
            },
            {
                name: 'NVS Scene 3',
                video: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/vis-nvs_147_30_orig_to_bev_transition.mp4',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/nvs-comparison_rgb4.jpg',
            },
             {
                name: 'NVS Scene 4',
                video: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/vis-nvs_1_190_orig_to_bev_transition.mp4',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/nvs-comparison_rgb1.jpg',
            },
            {
                name: 'NVS Scene 5',
                video: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/vis-nvs_50_69_orig_to_bev_transition.mp4',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/nvs-comparison_rgb2.jpg',
            },
            {
                name: 'NVS Scene 1',
                video: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/vis-nvs_0_36_orig_to_bev_transition.mp4',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/nvs-comparison_rgb5.jpg',
            },
            {
                name: 'NVS Scene 6',
                video: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/vis-nvs_15_54_orig_to_bev_transition.mp4',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/nvs-comparison_rgb8.jpg',
            },
        ]
    },

    // Interactive NVS (Gaussian Splatting) scenes
    // Using GitHub Pages URLs for better compatibility with large files
    nvsInteractive: {
        scenes: [
            {
                name: 'Interactive Scene 1',
                // Try GitHub Pages URL (if enabled) or jsDelivr as fallback
                htmlFile: 'https://ritianyu.github.io/ProjectAssets/InfiniDepth/assets/ai_018_005_0_gaussians.html',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/18_5.png'
            },
            {
                name: 'Interactive Scene 2',
                htmlFile: 'https://ritianyu.github.io/ProjectAssets/InfiniDepth/assets/ai_031_004_30_gaussians.html',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/31_4.png'
            },
            {
                name: 'Interactive Scene 3',
                htmlFile: 'https://ritianyu.github.io/ProjectAssets/InfiniDepth/assets/ai_044_003_0_gaussians.html',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/44_3.png'
            },
            {
                name: 'Interactive Scene 4',
                htmlFile: 'https://ritianyu.github.io/ProjectAssets/InfiniDepth/assets/28_80_gaussians.html',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/28-80.png'
            },
            {
                name: 'Interactive Scene 4',
                htmlFile: 'https://ritianyu.github.io/ProjectAssets/InfiniDepth/assets/147_30_gaussians.html',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/147_30.png'
            },
            {
                name: 'Interactive Scene 5',
                htmlFile: 'https://ritianyu.github.io/ProjectAssets/InfiniDepth/assets/0_70_gaussians.html',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/0-70.png'
            },
            {
                name: 'Interactive Scene 6',
                htmlFile: 'https://ritianyu.github.io/ProjectAssets/InfiniDepth/assets/22_84_gaussians.html',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/22-84.png'
            },
            {
                name: 'Interactive Scene 7',
                htmlFile: 'https://ritianyu.github.io/ProjectAssets/InfiniDepth/assets/24_189_gaussians.html',
                thumbnail: 'https://raw.githubusercontent.com/RitianYu/ProjectAssets/main/InfiniDepth/assets/24-189.png'
            },
        ]
    }
};

class VizShowcaseManager {
    constructor() {
        this.currentScenes = {
            depth: 0,
            pointcloud: 0,
            nvs: 0,
            nvsInteractive: 0
        };

        this.maxVisible = 4; // 固定显示4张图
        this.startIndex = {
            depth: 0,
            pointcloud: 0,
            nvs: 0,
            nvsInteractive: 0
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
        this.setupInteractiveNVSShowcase();

        // Initialize first depth scene on page load
        this.initFirstDepthScene();
    }

    /**
     * Create showcase with navigation arrows
     */
    createShowcaseWithArrows(showcaseId, scenes, onClickCallback) {
        const showcase = document.getElementById(showcaseId);
        if (!showcase) return null;

        // Map showcase ID to type key - handle both dash and camelCase
        let type = showcaseId.replace('-viz-showcase', '');
        // Convert dash-case to camelCase (nvs-interactive -> nvsInteractive)
        type = type.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());

        console.log('Creating showcase for type:', type, 'with', scenes.length, 'scenes');

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

    /**
     * Setup Interactive NVS visualization showcase
     */
    setupInteractiveNVSShowcase() {
        console.log('Setting up Interactive NVS showcase');
        const scenes = VizShowcaseConfig.nvsInteractive.scenes;
        console.log('Interactive NVS scenes:', scenes);

        this.createShowcaseWithArrows('nvs-interactive-viz-showcase', scenes, (idx) => {
            this.switchInteractiveNVSScene(idx);
        });

        // Wait for gaussian viewer to be ready before loading first scene
        const loadFirstScene = () => {
            console.log('Gaussian viewer ready, loading first scene');
            this.switchInteractiveNVSScene(0);
        };

        // Check if viewer is already ready
        if (window.gaussianViewerManager && window.gaussianViewerManager.isReady) {
            console.log('Gaussian viewer already ready');
            loadFirstScene();
        } else {
            // Wait for ready event
            console.log('Waiting for gaussian viewer to be ready...');
            window.addEventListener('gaussianViewerReady', loadFirstScene, { once: true });
        }
    }

    /**
     * Switch Interactive NVS scene
     */
    switchInteractiveNVSScene(sceneIndex) {
        console.log('Switching to Interactive NVS scene:', sceneIndex);
        const scene = VizShowcaseConfig.nvsInteractive.scenes[sceneIndex];
        if (!scene) {
            console.error('Scene not found at index:', sceneIndex);
            return;
        }

        console.log('Loading scene:', scene);
        this.currentScenes.nvsInteractive = sceneIndex;

        // Trigger iframe viewer to load new HTML file
        const event = new CustomEvent('loadGaussianScene', {
            detail: { htmlFile: scene.htmlFile }
        });
        window.dispatchEvent(event);
    }
}

// Initialize the showcase manager
const vizShowcaseManager = new VizShowcaseManager();

// Export for global access
if (typeof window !== 'undefined') {
    window.vizShowcaseManager = vizShowcaseManager;
    window.VizShowcaseConfig = VizShowcaseConfig;
}
