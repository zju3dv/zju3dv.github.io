/**
 * InfiniDepth Interactive Magnifier Configuration
 * 
 * Customize these settings to adjust the interactive depth comparison behavior
 */

const InfiniDepthConfig = {
    // Multiple scenes configuration
    // NOTE: Keep this in sync with VizShowcaseConfig.depth.scenes
    scenes: [
        {
            name: 'Scene 1',
            rgbImage: 'images/pub/infinidepth/interactitve_depth/rgb1.png',
            depthImages: [
                'images/pub/infinidepth/interactitve_depth/depth1.png'
            ],
            methodLabels: [
                'InfiniDepth'
            ]
        },
        {
            name: 'Scene 2',
            rgbImage: 'images/pub/infinidepth/interactitve_depth/rgb_diode_1.png',
            depthImages: [
                'images/pub/infinidepth/interactitve_depth/depth_diode_1.png'
            ],
            methodLabels: [
                'InfiniDepth'
            ]
        },
        {
            name: 'Scene 3',
            rgbImage: 'images/pub/infinidepth/interactitve_depth/rgb3.png',
            depthImages: [
               'images/pub/infinidepth/interactitve_depth/depth3.png'
            ],
            methodLabels: [
                'InfiniDepth'
            ]
        },
        {
            name: 'Scene 4',
            rgbImage: 'images/pub/infinidepth/interactitve_depth/rgb4.png',
            depthImages: [
               'images/pub/infinidepth/interactitve_depth/depth4.png'
            ],
            methodLabels: [
                'InfiniDepth'
            ]
        },
        {
            name: 'Scene 5',
            rgbImage: 'images/pub/infinidepth/interactitve_depth/rgb_diode_2.png',
            depthImages: [
                'images/pub/infinidepth/interactitve_depth/depth_diode_2.png'
            ],
            methodLabels: [
                'InfiniDepth'
            ]
        },
        {
            name: 'Scene 6',
            rgbImage: 'images/pub/infinidepth/interactitve_depth/DSC_9260.png',
            depthImages: [
               'images/pub/infinidepth/interactitve_depth/PromptNeuralDepth_DSC_9260_up_5_disparity.png'
            ],
            methodLabels: [
                'InfiniDepth'
            ]
        },
        {
            name: 'Scene 7',
            rgbImage: 'images/pub/infinidepth/interactitve_depth/DSC_6493.png',
            depthImages: [
               'images/pub/infinidepth/interactitve_depth/PromptNeuralDepth_DSC_6493_up_5_disparity.png'
            ],
            methodLabels: [
                'InfiniDepth'
            ]
        },
    ],
    
    // Patch size settings (in pixels)
    initialPatchSize: 512,  // Initial patch size when hovering starts (zoom = 1x)
    minPatchSize: 64,       // Minimum patch size (zoom = 16x, calculated as 512/16)
    maxPatchSize: 512,      // Maximum patch size (zoom = 1x, same as initial)
    
    // Zoom behavior
    zoomStep: 0.1,          // Zoom step per mouse wheel scroll (0.05-0.2 recommended)
    
    // Visual settings
    lensColor: '#6b9ac4',   // Magnifier lens border color
    lensOpacity: 0.15,      // Magnifier lens background opacity (0-1)
    
    // Canvas settings
    canvasWidth: 512,       // Canvas width for depth rendering
    canvasHeight: 512,      // Canvas height for depth rendering
    
    // Scene transition settings
    transitionDuration: 500 // Transition animation duration in ms
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InfiniDepthConfig;
}
