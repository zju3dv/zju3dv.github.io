import {
    exampleCatalog,
    getMethodConfig,
    getSceneConfig,
    loadAsset,
    transformPointCloud,
} from './viewer-data.js';

const viewerFrame = document.getElementById('interactive-viewer');
const exampleGrid = document.getElementById('example-grid');
const viewerCaptionTitle = document.getElementById('viewer-caption-title');
const viewerCaptionNote = document.getElementById('viewer-caption-note');
const selectedExampleTitle = document.getElementById('selected-example-title');
const selectedExampleDescription = document.getElementById('selected-example-description');
const selectedScene = document.getElementById('selected-scene');
const selectedMethod = document.getElementById('selected-method');
const selectedView = document.getElementById('selected-view');
const copyBibtexButton = document.getElementById('copy-bibtex');
const targetOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
const cardRefs = new Map();
const previewCache = new Map();
const defaultExampleId = 'oxford-keble-scatt3r';

let resizeTimer;
let iframeLoaded = false;
let selectedExampleId = defaultExampleId;

const viewLabels = {
    overview: 'Overview',
    top: 'Top',
    front: 'Front',
    detail: 'Detail',
};

function formatCompactNumber(value) {
    if (value >= 1000) {
        const compact = value >= 100000 ? (value / 1000).toFixed(0) : (value / 1000).toFixed(1);
        return `${compact.replace(/\.0$/, '')}k`;
    }
    return String(value);
}

function hexToRgb(hex) {
    const normalized = hex.replace('#', '');
    const integer = Number.parseInt(normalized, 16);
    return {
        r: (integer >> 16) & 255,
        g: (integer >> 8) & 255,
        b: integer & 255,
    };
}

function getExample(exampleId) {
    return exampleCatalog.find((item) => item.id === exampleId) || exampleCatalog[0];
}

function getExampleForState(sceneId, methodId, viewId) {
    return exampleCatalog.find((item) => (
        item.sceneId === sceneId &&
        (!methodId || item.methodId === methodId) &&
        (!viewId || item.view === viewId)
    )) || exampleCatalog.find((item) => (
        item.sceneId === sceneId &&
        (!methodId || item.methodId === methodId)
    )) || exampleCatalog.find((item) => item.sceneId === sceneId);
}

function getSceneCaption(sceneConfig, example) {
    return sceneConfig.homepageDescription || [sceneConfig.summary, example.description].filter(Boolean).join(' ');
}

function getPreviewConfig(example, sceneConfig) {
    const base = sceneConfig.preview;
    if (example.view === 'top') {
        return { yaw: base.yaw + 0.06, pitch: 1.08, zoom: base.zoom * 1.24 };
    }

    if (example.view === 'front') {
        return { yaw: base.yaw + 0.56, pitch: Math.max(0.12, base.pitch * 0.6), zoom: base.zoom * 1.04 };
    }

    if (example.view === 'detail') {
        return { yaw: base.yaw + 0.22, pitch: base.pitch + 0.08, zoom: base.zoom * 1.18 };
    }

    return base;
}

function drawPreview(canvas, pointData, bbox, previewConfig, sceneConfig, methodConfig) {
    const width = Math.max(Math.round(canvas.clientWidth || 320), 1);
    const height = Math.max(Math.round(canvas.clientHeight || 200), 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const context = canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);

    const sceneRgb = hexToRgb(sceneConfig.accent);
    const methodRgb = hexToRgb(methodConfig.accent);
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, `rgba(${sceneRgb.r}, ${sceneRgb.g}, ${sceneRgb.b}, 0.34)`);
    gradient.addColorStop(1, `rgba(${methodRgb.r}, ${methodRgb.g}, ${methodRgb.b}, 0.18)`);
    context.fillStyle = '#0b1321';
    context.fillRect(0, 0, width, height);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.fillStyle = 'rgba(255, 255, 255, 0.04)';
    context.beginPath();
    context.arc(width * 0.82, height * 0.18, width * 0.22, 0, Math.PI * 2);
    context.fill();

    const center = [
        (bbox.min[0] + bbox.max[0]) * 0.5,
        (bbox.min[1] + bbox.max[1]) * 0.5,
        (bbox.min[2] + bbox.max[2]) * 0.5,
    ];
    const sceneScale = Math.max(
        bbox.max[0] - bbox.min[0],
        bbox.max[1] - bbox.min[1],
        bbox.max[2] - bbox.min[2],
    );
    const yaw = previewConfig.yaw;
    const pitch = previewConfig.pitch;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const focal = previewConfig.zoom * width * 0.76;
    const stride = Math.max(1, Math.ceil(pointData.pointCount / 4600));
    const projected = [];

    for (let index = 0; index < pointData.pointCount; index += stride) {
        const offset = index * 3;
        const x = pointData.positions[offset + 0] - center[0];
        const y = pointData.positions[offset + 1] - center[1];
        const z = pointData.positions[offset + 2] - center[2];

        const yawX = x * cosYaw - z * sinYaw;
        const yawZ = x * sinYaw + z * cosYaw;
        const pitchY = y * cosPitch - yawZ * sinPitch;
        const pitchZ = y * sinPitch + yawZ * cosPitch;
        const depth = pitchZ + sceneScale * 2.2;

        if (depth <= sceneScale * 0.18) continue;

        const screenX = width * 0.5 + (yawX * focal) / depth;
        const screenY = height * 0.58 - (pitchY * focal) / depth;

        if (screenX < -12 || screenX > width + 12 || screenY < -12 || screenY > height + 12) continue;

        projected.push({
            depth,
            x: screenX,
            y: screenY,
            size: Math.min(Math.max(sceneScale * 0.18 / depth + 0.65, 0.72), 2.8),
            r: Math.round(pointData.colors[offset + 0] * 255),
            g: Math.round(pointData.colors[offset + 1] * 255),
            b: Math.round(pointData.colors[offset + 2] * 255),
        });
    }

    projected.sort((a, b) => a.depth - b.depth);

    for (const point of projected) {
        context.fillStyle = `rgba(${point.r}, ${point.g}, ${point.b}, 0.82)`;
        context.fillRect(point.x, point.y, point.size, point.size);
    }

    context.fillStyle = 'rgba(255, 255, 255, 0.04)';
    context.fillRect(0, height - 26, width, 26);
}

function updateActiveCards(activeExampleId) {
    cardRefs.forEach(({ card }, exampleId) => {
        card.classList.toggle('is-active', exampleId === activeExampleId);
    });
}

function updateSelection(example, overrideView = example.view) {
    const sceneConfig = getSceneConfig(example.sceneId);
    const methodConfig = getMethodConfig(example.methodId);
    if (viewerCaptionTitle) viewerCaptionTitle.textContent = sceneConfig.label;
    if (viewerCaptionNote) viewerCaptionNote.textContent = getSceneCaption(sceneConfig, example);
    if (selectedExampleTitle) selectedExampleTitle.textContent = `${example.title} · ${methodConfig.label}`;
    if (selectedExampleDescription) selectedExampleDescription.textContent = example.description;
    if (selectedScene) selectedScene.textContent = sceneConfig.label;
    if (selectedMethod) selectedMethod.textContent = methodConfig.label;
    if (selectedView) selectedView.textContent = viewLabels[overrideView] || 'Overview';
    updateActiveCards(example.id);
}

function sendSelectionToViewer(example) {
    if (!viewerFrame?.contentWindow) return;

    viewerFrame.contentWindow.postMessage({ type: 'viewer:setScene', scene: example.sceneId }, targetOrigin);
    viewerFrame.contentWindow.postMessage({ type: 'viewer:setMethod', method: example.methodId }, targetOrigin);
    viewerFrame.contentWindow.postMessage({ type: 'viewer:setView', view: example.view }, targetOrigin);
}

function selectExample(exampleId, shouldSend = true) {
    const example = getExample(exampleId);
    selectedExampleId = example.id;
    updateSelection(example);

    if (shouldSend && iframeLoaded) {
        sendSelectionToViewer(example);
    }
}

function renderCardMarkup(example) {
    const sceneConfig = getSceneConfig(example.sceneId);
    const methodConfig = getMethodConfig(example.methodId);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'example-card';
    card.dataset.exampleId = example.id;
    card.innerHTML = `
        <div class="example-preview">
            <canvas class="example-canvas"></canvas>
            <div class="example-overlay">
                <span class="example-scene"><i class="fas fa-cube"></i>${sceneConfig.label}</span>
                <span class="example-method" style="background:${methodConfig.accent};">${methodConfig.label}</span>
            </div>
            <div class="example-badge-row">
                <span class="example-badge">${formatCompactNumber(sceneConfig.pointCount)} pts</span>
                <span class="example-badge">${sceneConfig.cameraCount} cams</span>
            </div>
            <span class="example-loading"><i class="fas fa-spinner fa-spin"></i>Rendering preview</span>
        </div>
        <div class="example-copy">
            <div class="example-copy-main">
                <div class="example-title">${example.title}</div>
                <div class="example-subtitle">${example.eyebrow || methodConfig.label}</div>
            </div>
            <span class="example-view-chip">${viewLabels[example.view] || 'Overview'}</span>
        </div>
    `;
    card.addEventListener('click', () => selectExample(example.id, true));
    cardRefs.set(example.id, { card, canvas: card.querySelector('.example-canvas') });
    return card;
}

async function renderExamplePreview(example) {
    const refs = cardRefs.get(example.id);
    if (!refs) return;

    let cached = previewCache.get(example.id);
    if (!cached) {
        const sceneConfig = getSceneConfig(example.sceneId);
        const methodConfig = getMethodConfig(example.methodId);
        const asset = await loadAsset(example.sceneId);
        cached = {
            sceneConfig,
            methodConfig,
            pointData: transformPointCloud(asset, methodConfig, example.sceneId),
            bbox: asset.bbox,
            previewConfig: getPreviewConfig(example, sceneConfig),
        };
        previewCache.set(example.id, cached);
    }

    drawPreview(
        refs.canvas,
        cached.pointData,
        cached.bbox,
        cached.previewConfig,
        cached.sceneConfig,
        cached.methodConfig,
    );
    refs.card.classList.add('is-ready');
}

async function preloadExamples() {
    const uniqueScenes = [...new Set(exampleCatalog.map((item) => item.sceneId))];
    await Promise.all(uniqueScenes.map((sceneId) => loadAsset(sceneId)));
    await Promise.all(exampleCatalog.map((example) => renderExamplePreview(example)));
}

function buildExampleGrid() {
    if (!exampleGrid) return;

    exampleGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    exampleCatalog.forEach((example) => {
        fragment.appendChild(renderCardMarkup(example));
    });
    exampleGrid.appendChild(fragment);
}

function setupViewerSync() {
    viewerFrame.addEventListener('load', () => {
        iframeLoaded = true;
        sendSelectionToViewer(getExample(selectedExampleId));
    });

    window.addEventListener('message', (event) => {
        if (targetOrigin !== '*' && event.origin !== window.location.origin) return;
        const data = event.data;
        if (!data || data.type !== 'viewer:state') return;

        const matchedExample = getExampleForState(data.scene, data.method, data.view) || getExample(selectedExampleId);
        selectedExampleId = matchedExample.id;
        updateSelection(matchedExample, data.view);
    });
}

function setupBibtexCopy() {
    copyBibtexButton?.addEventListener('click', async () => {
        const bibtex = document.querySelector('.bibtex-block')?.textContent || '';
        await navigator.clipboard.writeText(bibtex);
        copyBibtexButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
        window.setTimeout(() => {
            copyBibtexButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 1800);
    });
}

setupBibtexCopy();

if (window.location.protocol !== 'file:') {
    buildExampleGrid();
    setupViewerSync();
    selectExample(defaultExampleId, false);
    preloadExamples().catch((error) => {
        console.error(error);
    });

    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            preloadExamples().catch((error) => {
                console.error(error);
            });
        }, 120);
    });
}
