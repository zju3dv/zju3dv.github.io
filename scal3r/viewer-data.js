const assetCache = new Map();

export const sceneCatalog = [
    {
        id: 'zju-zjg',
        label: 'ZJU ZJG',
        url: 'https://raw.githubusercontent.com/xbillowy/assets/main/scal3r.github.io.assets/demo/zju-zjg.json',
        pointCount: 72000,
        cameraCount: 180,
        accent: '#0f8b8d',
        kicker: 'Campus Capture',
        summary: 'Long campus-scale walk with dense facades, foliage, and extended trajectory coverage.',
        homepageDescription: 'A long campus-scale walk with dense facades, foliage, and extended trajectory coverage. The embedded preview loads a local GLB, recovered cameras, and a synchronized source-video overlay for quick inspection.',
        preview: { yaw: -0.88, pitch: 0.28, zoom: 1.88 }
    },
    {
        id: 'pubg-taego',
        label: 'PUBG Taego',
        url: 'https://raw.githubusercontent.com/xbillowy/assets/main/scal3r.github.io.assets/demo/pubg-taego.json',
        pointCount: 72000,
        cameraCount: 180,
        accent: '#3f9b59',
        kicker: 'Game World',
        summary: 'Large-scale outdoor game-world route with long roads, foliage, and broad horizon structure.',
        homepageDescription: 'Large-scale outdoor PUBG route with long roads, sparse structures, and broad vegetation coverage. This local preview ships as a GLB with recovered cameras and a looping gameplay clip, so the scene can be inspected fully offline.',
        preview: { yaw: -0.96, pitch: 0.26, zoom: 1.9 }
    },
    {
        id: 'oxford-keble',
        label: 'Oxford Keble',
        url: 'https://raw.githubusercontent.com/xbillowy/assets/main/scal3r.github.io.assets/demo/oxford-keble.json',
        pointCount: 72000,
        cameraCount: 180,
        accent: '#0f8b8d',
        kicker: 'Oxford Spires',
        summary: 'Outdoor Oxford Spires walk with facades, trees, and long-range loop structure.',
        homepageDescription: 'Outdoor Oxford Spires walk with collegiate facades, trees, and a long loop structure. This is the most complete local example on the homepage, with the full point cloud, recovered cameras, and the matching scene video loaded together.',
        preview: { yaw: -1.08, pitch: 0.26, zoom: 1.94 }
    },
    {
        id: 'kitti-00',
        label: 'KITTI 00',
        url: 'https://raw.githubusercontent.com/xbillowy/assets/main/scal3r.github.io.assets/demo/kitti-00.json',
        pointCount: 72000,
        cameraCount: 180,
        accent: '#2563eb',
        kicker: 'Driving',
        summary: 'Large autonomous-driving route with long depth range and dense roadside layout.',
        homepageDescription: 'A long autonomous-driving route with strong forward motion, deep road geometry, and dense roadside structure. The web preview uses a local GLB plus recovered cameras to keep large-scale geometry inspection lightweight.',
        preview: { yaw: -0.98, pitch: 0.24, zoom: 1.72 }
    },
    {
        id: 'cyberpunk-1',
        label: 'Cyberpunk 1',
        url: 'https://raw.githubusercontent.com/xbillowy/assets/main/scal3r.github.io.assets/demo/cyberpunk-1.json',
        pointCount: 72000,
        cameraCount: 180,
        accent: '#ec4899',
        kicker: 'Synthetic',
        summary: 'Synthetic neon-lit scene with high-frequency structures and dense color variation.',
        homepageDescription: 'A synthetic neon-lit environment with dense high-frequency detail and aggressive color variation. The local viewer keeps the scene responsive with a downsampled GLB, recovered cameras, and an aligned source-video preview.',
        preview: { yaw: 0.64, pitch: 0.3, zoom: 2.22 }
    },
    {
        id: 'kitti-05',
        label: 'KITTI 05',
        url: 'https://raw.githubusercontent.com/xbillowy/assets/main/scal3r.github.io.assets/demo/kitti-05.json',
        pointCount: 72000,
        cameraCount: 180,
        accent: '#2563eb',
        kicker: 'Driving',
        summary: 'Urban autonomous-driving corridor with long straight motion and broad scene extent.',
        homepageDescription: 'An urban autonomous-driving corridor with long straight motion, repeated crossings, and broad scene extent. Recovered cameras and the scene video make it easy to compare vehicle motion against the reconstructed point cloud.',
        preview: { yaw: -0.9, pitch: 0.25, zoom: 1.78 }
    },
    {
        id: 'oxford-observatory',
        label: 'Oxford Observatory',
        url: 'https://raw.githubusercontent.com/xbillowy/assets/main/scal3r.github.io.assets/demo/oxford-observatory.json',
        pointCount: 72000,
        cameraCount: 180,
        accent: '#f97316',
        kicker: 'Oxford Spires',
        summary: 'Compact Oxford route with denser local facade detail, recovered cameras, and a local GLB export.',
        homepageDescription: 'A compact Oxford route with denser facade detail around the observatory. This local scene uses a GLB export, recovered cameras, and a synchronized preview video built from the completed image set.',
        preview: { yaw: -0.8, pitch: 0.26, zoom: 1.84 }
    },
    {
        id: 'kitti-07',
        label: 'KITTI 07',
        url: 'https://raw.githubusercontent.com/xbillowy/assets/main/scal3r.github.io.assets/demo/kitti-07.json',
        pointCount: 72000,
        cameraCount: 180,
        accent: '#2563eb',
        kicker: 'Driving',
        summary: 'Long autonomous-driving corridor with dense roadside geometry and strong forward motion.',
        homepageDescription: 'A long KITTI corridor with dense roadside geometry and persistent forward motion. The local viewer focuses on quick inspection of overall scene structure, camera placement, and source-video alignment.',
        preview: { yaw: -0.94, pitch: 0.24, zoom: 1.72 }
    }
];

export const methodCatalog = [
    {
        id: 'scatt3r',
        label: 'Scal3R',
        cameraColor: '#60a5fa',
        pathColor: '#22c55e',
        accent: '#2563eb'
    }
];

export const exampleCatalog = [
    {
        id: 'zju-zjg-scatt3r',
        sceneId: 'zju-zjg',
        methodId: 'scatt3r',
        view: 'overview',
        title: 'ZJU ZJG',
        eyebrow: 'Campus',
        description: 'Downsampled directly from data/datasets/zju/zjg/xyz.ply for fast web inspection.'
    },
    {
        id: 'pubg-taego-scatt3r',
        sceneId: 'pubg-taego',
        methodId: 'scatt3r',
        view: 'overview',
        title: 'PUBG Taego',
        eyebrow: 'Game World',
        description: 'Downsampled directly from data/datasets/pubg/taego/xyz.ply for fast web inspection.'
    },
    {
        id: 'oxford-keble-scatt3r',
        sceneId: 'oxford-keble',
        methodId: 'scatt3r',
        view: 'detail',
        title: 'Oxford Keble',
        eyebrow: 'Oxford Spires',
        description: 'Offline Oxford scene with the full point cloud and recovered cameras loaded together for static inspection.'
    },
    {
        id: 'kitti-00-scatt3r',
        sceneId: 'kitti-00',
        methodId: 'scatt3r',
        view: 'overview',
        title: 'KITTI 00',
        eyebrow: 'Driving',
        description: 'Downsampled directly from data/datasets/kitti/00/xyz.ply for fast web inspection.'
    },
    {
        id: 'cyberpunk-1-scatt3r',
        sceneId: 'cyberpunk-1',
        methodId: 'scatt3r',
        view: 'overview',
        title: 'Cyberpunk 1',
        eyebrow: 'Synthetic',
        description: 'Downsampled from data/datasets/vggt-long/cyberpunk_1/xyz.ply to keep the page responsive.'
    },
    {
        id: 'kitti-05-scatt3r',
        sceneId: 'kitti-05',
        methodId: 'scatt3r',
        view: 'overview',
        title: 'KITTI 05',
        eyebrow: 'Driving',
        description: 'Downsampled directly from data/datasets/kitti/05/xyz.ply for fast web inspection.'
    },
    {
        id: 'oxford-observatory-scatt3r',
        sceneId: 'oxford-observatory',
        methodId: 'scatt3r',
        view: 'overview',
        title: 'Oxford Observatory',
        eyebrow: 'Oxford Spires',
        description: 'Static Oxford observatory point-cloud GLB plus recovered cameras and source-video overlay from the completed image set.'
    },
    {
        id: 'kitti-07-scatt3r',
        sceneId: 'kitti-07',
        methodId: 'scatt3r',
        view: 'overview',
        title: 'KITTI 07',
        eyebrow: 'Driving',
        description: 'Downsampled directly from data/datasets/kitti/07/xyz.ply for fast web inspection.'
    }
];

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function getSceneConfig(id) {
    return sceneCatalog.find((item) => item.id === id) || sceneCatalog[0];
}

export function getMethodConfig(id) {
    return methodCatalog.find((item) => item.id === id) || methodCatalog[0];
}

export async function loadAsset(sceneId) {
    if (assetCache.has(sceneId)) return assetCache.get(sceneId);

    const response = await fetch(getSceneConfig(sceneId).url);
    if (!response.ok) {
        throw new Error(`Failed to load point cloud asset: ${response.status}`);
    }

    const payload = await response.json();
    const colors = Uint8Array.from(payload.colors);
    const normalizedColors = new Float32Array(colors.length);
    for (let index = 0; index < colors.length; index += 1) {
        normalizedColors[index] = colors[index] / 255;
    }

    const asset = {
        ...payload,
        positions: Float32Array.from(payload.positions),
        colors,
        normalizedColors
    };

    assetCache.set(sceneId, asset);
    return asset;
}

export function transformPointCloud(asset) {
    return {
        positions: asset.positions,
        colors: asset.normalizedColors,
        pointCount: asset.positions.length / 3
    };
}

export function transformedCameras(asset) {
    return asset.cameras;
}
