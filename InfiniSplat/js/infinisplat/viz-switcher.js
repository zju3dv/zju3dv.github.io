/**
 * Visualization Mode Switcher
 * Handles switching between different visualization modes (Depth, Point Cloud, NVS)
 */

const ASSET_BASE_URL = 'https://assets.pluswave.top/v1';

function assetUrl(path) {
    if (/^https?:\/\//.test(path)) return path;
    return `${ASSET_BASE_URL}/${path}`;
}

function setupVizSwitch(section) {
    const btns = section.querySelectorAll('.viz-btn');
    const contents = section.querySelectorAll('.viz-content');
    const descs = section.querySelectorAll('.viz-desc');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.viz;

            // Update buttons
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content
            contents.forEach(c => c.classList.remove('active'));
            const show = section.querySelector(`#viz-${target}`);
            if (show) show.classList.add('active');

            // Update description
            descs.forEach(d => {
                if (d.dataset.viz === target) {
                    d.classList.add('active');
                } else {
                    d.classList.remove('active');
                }
            });
        });
    });
}

function setupDemoStageButtons() {
    const video = document.getElementById('demo-video');
    const loadingOverlay = document.getElementById('demo-loading-overlay');
    const buttons = document.querySelectorAll('[data-demo-time]');

    if (!video || buttons.length === 0) return;

    let loadingTimer = null;

    function showVideoLoading() {
        if (!loadingOverlay) return;
        window.clearTimeout(loadingTimer);
        loadingOverlay.classList.add('active');
        loadingOverlay.setAttribute('aria-hidden', 'false');
    }

    function hideVideoLoading() {
        if (!loadingOverlay) return;
        window.clearTimeout(loadingTimer);
        loadingTimer = window.setTimeout(() => {
            loadingOverlay.classList.remove('active');
            loadingOverlay.setAttribute('aria-hidden', 'true');
        }, 120);
    }

    video.addEventListener('waiting', showVideoLoading);
    video.addEventListener('seeking', showVideoLoading);
    video.addEventListener('stalled', showVideoLoading);
    video.addEventListener('canplay', hideVideoLoading);
    video.addEventListener('canplaythrough', hideVideoLoading);
    video.addEventListener('seeked', hideVideoLoading);
    video.addEventListener('playing', hideVideoLoading);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTime = Number(btn.dataset.demoTime);
            if (!Number.isFinite(targetTime)) return;

            buttons.forEach(item => item.classList.remove('active'));
            btn.classList.add('active');

            showVideoLoading();
            video.currentTime = targetTime;
            video.play().catch(error => {
                console.warn('Demo video playback was not started automatically.', error);
                hideVideoLoading();
            });
            video.focus({ preventScroll: true });
        });
    });
}

function setupV2PreviewLoading() {
    const frame = document.getElementById('v2-viewer-frame');
    const loadingOverlay = document.getElementById('v2-loading-overlay');

    if (!frame || !loadingOverlay) return;

    frame.addEventListener('load', () => {
        window.setTimeout(() => {
            loadingOverlay.classList.remove('active');
            loadingOverlay.setAttribute('aria-hidden', 'true');
        }, 160);
    });
}

const gsGalleryItems = [
    {
        id: 'new-living-room',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Living Room',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/living_room.jpg',
        src: 'images/gs/in-the-wild-gs/living_room.html',
        aspectRatio: 1080 / 1440
    },
    {
        id: 'new-bedroom',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Bedroom',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/bedroom.jpg',
        src: 'images/gs/in-the-wild-gs/bedroom.html',
        aspectRatio: 1080 / 1340
    },
    {
        id: 'new-my-bedroom',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'My Bedroom',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/my_bedroom.JPG',
        src: 'images/gs/in-the-wild-gs/my_bedroom.html',
        aspectRatio: 5712 / 4284
    },
    {
        id: 'new-old-living-room',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Old Living Room',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/old_livingroom.png',
        src: 'images/gs/in-the-wild-gs/old_livingroom.html',
        aspectRatio: 916 / 1226
    },
    {
        id: 'new-gym',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Gym',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/gym.png',
        src: 'images/gs/in-the-wild-gs/gym.html',
        aspectRatio: 1202 / 774
    },
    {
        id: 'new-sofa-ai',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Sofa AI',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/sofa_ai.jpg',
        src: 'images/gs/in-the-wild-gs/sofa_ai.html',
        aspectRatio: 1935 / 1080
    },
    {
        id: 'new-flower-room',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Flower Room',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/flower_room.jpg',
        src: 'images/gs/in-the-wild-gs/flower_room.html',
        aspectRatio: 1080 / 1620
    },
    {
        id: 'new-painting-room',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Painting Room',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/painting_room.jpg',
        src: 'images/gs/in-the-wild-gs/painting_room.html',
        aspectRatio: 950 / 1200
    },
    {
        id: 'new-summer-room',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Summer Room',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/summer_room.jpg',
        src: 'images/gs/in-the-wild-gs/summer_room.html',
        aspectRatio: 1080 / 1440
    },
    {
        id: 'new-ghibli-room',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Ghibli Room',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/ghibli_room.jpg',
        src: 'images/gs/in-the-wild-gs/ghibli_room.html',
        aspectRatio: 1800 / 1080
    },
    {
        id: 'new-ghibli-real-room',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Ghibli Real Room',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/ghibli_realroom.jpg',
        src: 'images/gs/in-the-wild-gs/ghibli_realroom.html',
        aspectRatio: 1080 / 1440
    },
    {
        id: 'new-animate-room',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Animated Room',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/animate_room.jpg',
        src: 'images/gs/in-the-wild-gs/animate_room.html',
        aspectRatio: 1143 / 1080
    },
    {
        id: 'new-beggar-home',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        title: 'Beggar Home',
        detail: 'In-the-wild RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/beggar_home.jpg',
        src: 'images/gs/in-the-wild-gs/beggar_home.html',
        aspectRatio: 1
    },
    {
        id: 'rgb-eth3d-relief',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'ETH3D',
        detail: 'RGB input',
        thumbnail: 'images/gs/rgb-gs/eth3d_relief_DSC_0440.JPG',
        src: 'images/gs/rgb-gs/eth3d_relief_DSC_0440.html'
    },
    {
        id: 'rgb-eth3d-pipes-0641',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'ETH3D',
        detail: 'RGB input',
        thumbnail: 'images/gs/rgb-gs/eth3d_pipes_DSC_0641.JPG',
        src: 'images/gs/rgb-gs/eth3d_pipes_DSC_0641.html'
    },
    {
        id: 'rgb-scannetpp-7b37cccb03',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'ScanNet++',
        detail: 'RGB input',
        thumbnail: 'images/gs/rgb-gs/scannetpp_7b37cccb03_DSC06984.JPG',
        src: 'images/gs/rgb-gs/scannetpp_7b37cccb03_DSC06984.html'
    },
    {
        id: 'rgb-scannetpp-ccdc33dc2a',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'ScanNet++',
        detail: 'RGB input',
        thumbnail: 'images/gs/rgb-gs/scannetpp_ccdc33dc2a_DSC07699.JPG',
        src: 'images/gs/rgb-gs/scannetpp_ccdc33dc2a_DSC07699.html'
    },
    {
        id: 'rgb-dl3dv-frame-00100',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'DL3DV',
        detail: 'RGB input',
        thumbnail: 'images/gs/rgb-gs/DL3DV_b93f5691ba1cc8890d0b0fb5792668d8c8e084e3b3ae1a476fc5e2c1e38b79aeb93f5691ba1cc8890d0b0fb5792668d8c8e084e3b3ae1a476fc5e2c1e38b79ae_frame_00100.png',
        src: 'images/gs/rgb-gs/DL3DV_b93f5691ba1cc8890d0b0fb5792668d8c8e084e3b3ae1a476fc5e2c1e38b79aeb93f5691ba1cc8890d0b0fb5792668d8c8e084e3b3ae1a476fc5e2c1e38b79ae_frame_00100.html'
    },
    // {
    //     id: 'rgb-tandt-church-000495',
    //     category: 'rgb',
    //     categoryLabel: 'RGB',
    //     source: 'Tanks and Temples',
    //     detail: 'RGB input',
    //     thumbnail: 'images/gs/rgb-gs/Tanks_and_Temples_Church_000495.jpg',
    //     src: 'images/gs/rgb-gs/Tanks_and_Temples_Church_000495.html'
    // },
    {
        id: 'rgb-tandt-meetingroom-000369',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'Tanks and Temples',
        detail: 'RGB input',
        thumbnail: 'images/gs/rgb-gs/Tanks_and_Temples_Meetingroom_000369.jpg',
        src: 'images/gs/rgb-gs/Tanks_and_Temples_Meetingroom_000369.html'
    },
    {
        id: 'lidar-eth3d-kicker-6506',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'ETH3D',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/eth3d_kicker_DSC_6506.JPG',
        src: 'images/gs/lidar-gs/eth3d_kicker_DSC_6506.html'
    },
    {
        id: 'lidar-eth3d-kicker-6520',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'ETH3D',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/eth3d_kicker_DSC_6520.JPG',
        src: 'images/gs/lidar-gs/eth3d_kicker_DSC_6520.html'
    },
    {
        id: 'lidar-eth3d-courtyard-0292',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'ETH3D',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/eth3d_courtyard_DSC_0292.JPG',
        src: 'images/gs/lidar-gs/eth3d_courtyard_DSC_0292.html'
    },
    {
        id: 'lidar-eth3d-office-0219',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'ETH3D',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/eth3d_office_DSC_0219.JPG',
        src: 'images/gs/lidar-gs/eth3d_office_DSC_0219.html'
    },
    {
        id: 'lidar-eth3d-pipes-0634',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'ETH3D',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/eth3d_pipes_DSC_0634.JPG',
        src: 'images/gs/lidar-gs/eth3d_pipes_DSC_0634.html'
    },
    {
        id: 'lidar-eth3d-terrace-0266',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'ETH3D',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/eth3d_terrace_DSC_0266.JPG',
        src: 'images/gs/lidar-gs/eth3d_terrace_DSC_0266.html'
    },
    {
        id: 'lidar-waymo-9-0-1',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'Waymo',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/waymo_9_0_1.png',
        src: 'images/gs/lidar-gs/waymo_9_0_1.html'
    },
    {
        id: 'lidar-waymo-147-30',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'Waymo',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/waymo_147_30.png',
        src: 'images/gs/lidar-gs/waymo_147_30.html'
    },
    {
        id: 'lidar-waymo-testing-003-000000-1',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'Waymo',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/waymo_testing_003_000000_1.png',
        src: 'images/gs/lidar-gs/waymo_testing_003_000000_1.html'
    },
    {
        id: 'lidar-waymo-testing-140-000004-1',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'Waymo',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/waymo_testing_140_000004_1.png',
        src: 'images/gs/lidar-gs/waymo_testing_140_000004_1.html'
    },
    {
        id: 'lidar-waymo-testing-148-000000-2',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'Waymo',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/waymo_testing_148_000000_2.png',
        src: 'images/gs/lidar-gs/waymo_testing_148_000000_2.html'
    },
    {
        id: 'lidar-waymo-validation-196-000052-0',
        category: 'lidar',
        categoryLabel: 'LiDAR-conditioned',
        source: 'Waymo',
        detail: 'RGB-LiDAR input',
        thumbnail: 'images/gs/lidar-gs/waymo_validation_196_000052_0.png',
        src: 'images/gs/lidar-gs/waymo_validation_196_000052_0.html'
    },
    {
        id: 'wild-0001',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        detail: 'RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/0001.jpg',
        src: 'images/gs/in-the-wild-gs/0001.html',
        aspectRatio: 898 / 1200
    },
    {
        id: 'wild-0004',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        detail: 'RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/0004.jpg',
        src: 'images/gs/in-the-wild-gs/0004.html',
        aspectRatio: 900 / 1200
    },
    {
        id: 'wild-0018',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        detail: 'RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/0018.jpg',
        src: 'images/gs/in-the-wild-gs/0018.html',
        aspectRatio: 791 / 1200
    },
    {
        id: 'wild-2027',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        detail: 'RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/2027.jpg',
        src: 'images/gs/in-the-wild-gs/2027.html',
        aspectRatio: 904 / 1200
    },
    {
        id: 'wild-2067',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        detail: 'RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/2067.jpg',
        src: 'images/gs/in-the-wild-gs/2067.html',
        aspectRatio: 903 / 1200
    },
    {
        id: 'wild-2079',
        category: 'rgb',
        categoryLabel: 'RGB',
        source: 'In-the-wild',
        detail: 'RGB input',
        thumbnail: 'images/gs/in-the-wild-gs/2079.jpg',
        src: 'images/gs/in-the-wild-gs/2079.html',
        aspectRatio: 903 / 1200
    }
];

const gsDefaultItemIds = {
    rgb: 'new-summer-room',
    lidar: 'lidar-waymo-testing-003-000000-1'
};

const gsRgbItemOrder = [
    'new-summer-room',
    'new-living-room',
    'new-bedroom',
    'wild-2079',
    'new-sofa-ai',
    'new-my-bedroom',
    'new-ghibli-room',
    'rgb-eth3d-relief',
    'wild-2067',
    'new-old-living-room',
    'new-gym',
    'rgb-scannetpp-7b37cccb03',
    'wild-0004',
    'new-flower-room',
    'new-painting-room',
    'rgb-eth3d-pipes-0641',
    'wild-0018',
    'new-ghibli-real-room',
    'new-animate-room',
    'rgb-dl3dv-frame-00100',
    'wild-2027',
    'new-beggar-home',
    'rgb-scannetpp-ccdc33dc2a',
    'wild-0001',
    'rgb-tandt-meetingroom-000369'
];

function getGsItemRank(item) {
    const rgbRank = gsRgbItemOrder.indexOf(item.id);
    if (rgbRank !== -1) return rgbRank;
    if (item.id === gsDefaultItemIds[item.category]) return -2;
    if (item.category === 'lidar' && item.source === 'Waymo') return -1;
    return 200;
}

function getGsCardAspectRatio(item) {
    const ratio = Number.isFinite(item.aspectRatio) ? item.aspectRatio : 1.5;
    const displayRatio = item.category === 'lidar'
        ? ratio * 0.85
        : item.category === 'rgb' && item.source !== 'In-the-wild' ? ratio * 0.64 : ratio;
    const minRatio = item.category === 'rgb' && item.source === 'In-the-wild' ? 1 : 0.88;
    return Math.min(1.55, Math.max(minRatio, displayRatio));
}

function setupGsGallery() {
    const gallery = document.getElementById('gs-gallery');
    const frame = document.getElementById('gs-viewer-frame');
    const source = document.getElementById('gs-stage-source');
    const kicker = document.getElementById('gs-stage-kicker');
    const loadingOverlay = document.getElementById('gs-loading-overlay');
    const grid = document.getElementById('gs-card-grid');
    const filterButtons = document.querySelectorAll('[data-gs-filter]');

    if (!gallery || !frame || !source || !kicker || !grid || filterButtons.length === 0) return;

    let activeFilter = 'rgb';
    let activeItem = gsGalleryItems.find(item => item.id === gsDefaultItemIds.rgb) || gsGalleryItems[0];
    let loadingTimer = null;
    let lastGridWidth = 0;

    function showViewerLoading() {
        if (!loadingOverlay) return;
        window.clearTimeout(loadingTimer);
        loadingOverlay.classList.add('active');
        loadingOverlay.setAttribute('aria-hidden', 'false');
    }

    function hideViewerLoading() {
        if (!loadingOverlay) return;
        window.clearTimeout(loadingTimer);
        loadingTimer = window.setTimeout(() => {
            loadingOverlay.classList.remove('active');
            loadingOverlay.setAttribute('aria-hidden', 'true');
        }, 160);
    }

    frame.addEventListener('load', hideViewerLoading);

    function getVisibleItems() {
        return gsGalleryItems
            .filter(item => item.category === activeFilter)
            .sort((a, b) => getGsItemRank(a) - getGsItemRank(b));
    }

    function selectItem(item) {
        activeItem = item;
        source.textContent = item.detail;
        kicker.textContent = item.source;

        const frameSrc = assetUrl(item.src);
        if (frame.getAttribute('src') !== frameSrc) {
            showViewerLoading();
            frame.src = frameSrc;
        }

        grid.querySelectorAll('.gs-card').forEach(card => {
            card.classList.toggle('active', card.dataset.gsId === item.id);
        });
    }

    function createCard(item) {
        const card = document.createElement('button');
        card.className = 'gs-card';
        card.type = 'button';
        card.dataset.gsId = item.id;
        card.dataset.aspectRatio = getGsCardAspectRatio(item);
        card.setAttribute('aria-label', `Open ${item.categoryLabel} Gaussian visualization from ${item.title || item.source}`);

        const thumb = document.createElement('img');
        thumb.src = assetUrl(item.thumbnail);
        thumb.alt = `${item.title || item.source} input image`;
        thumb.loading = 'lazy';

        const category = document.createElement('span');
        category.className = 'gs-card-category';
        category.textContent = item.source;

        card.appendChild(thumb);
        card.appendChild(category);
        card.addEventListener('click', () => selectItem(item));
        return card;
    }

    function partitionCards(cards, rowCount) {
        const rows = [];
        let offset = 0;
        let remainingRatio = cards.reduce((sum, card) => sum + Number(card.dataset.aspectRatio), 0);

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
            const remainingRows = rowCount - rowIndex;
            const maxEnd = cards.length - (remainingRows - 1);
            const targetRatio = remainingRatio / remainingRows;
            const row = [];
            let rowRatio = 0;

            while (offset < maxEnd) {
                const card = cards[offset];
                const ratio = Number(card.dataset.aspectRatio);
                const nextDifference = Math.abs(targetRatio - (rowRatio + ratio));
                const currentDifference = Math.abs(targetRatio - rowRatio);
                if (row.length > 0 && nextDifference > currentDifference) break;

                row.push(card);
                rowRatio += ratio;
                offset += 1;
            }

            rows.push(row);
            remainingRatio -= rowRatio;
        }

        return rows;
    }

    function layoutCards() {
        const cards = Array.from(grid.querySelectorAll('.gs-card'));
        const gridWidth = grid.clientWidth;
        if (cards.length === 0 || gridWidth === 0) return;

        const gap = Number.parseFloat(window.getComputedStyle(grid).rowGap) || 0;
        const targetHeight = gridWidth > 900 ? 142 : gridWidth > 600 ? 134 : gridWidth > 420 ? 122 : 108;
        const totalRatio = cards.reduce((sum, card) => sum + Number(card.dataset.aspectRatio), 0);
        const rowCount = Math.max(1, Math.round((totalRatio * targetHeight + gap * cards.length) / (gridWidth + gap)));
        const rows = partitionCards(cards, rowCount);
        const fragment = document.createDocumentFragment();

        rows.forEach(rowCards => {
            const row = document.createElement('div');
            const rowRatio = rowCards.reduce((sum, card) => sum + Number(card.dataset.aspectRatio), 0);
            const availableWidth = gridWidth - gap * (rowCards.length - 1);
            row.className = 'gs-card-row';
            row.style.height = `${availableWidth / rowRatio}px`;

            rowCards.forEach(card => {
                card.style.flex = `${card.dataset.aspectRatio} 1 0`;
                row.appendChild(card);
            });
            fragment.appendChild(row);
        });

        grid.replaceChildren(fragment);
    }

    function renderCards() {
        const visibleItems = getVisibleItems();
        grid.innerHTML = '';
        visibleItems.forEach(item => {
            grid.appendChild(createCard(item));
        });
        layoutCards();

        if (!visibleItems.includes(activeItem)) {
            const defaultItem = visibleItems.find(item => item.id === gsDefaultItemIds[activeFilter]);
            selectItem(defaultItem || visibleItems[0]);
        } else {
            selectItem(activeItem);
        }
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.gsFilter;
            filterButtons.forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            renderCards();
        });
    });

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(() => {
            const gridWidth = grid.clientWidth;
            if (Math.abs(gridWidth - lastGridWidth) < 1) return;
            lastGridWidth = gridWidth;
            layoutCards();
        });
        resizeObserver.observe(grid);
    }

    renderCards();
}

const rgbComparisonScenes = [
    {
        id: 'scene-01-eth3d-terrains',
        input: 'images/compare-rgb/scene-01-eth3d-terrains-input.png',
        methods: [
            { label: 'Ours', src: 'images/compare-rgb/scene-01-eth3d-terrains-ours.png' },
            { label: 'SHARP', src: 'images/compare-rgb/scene-01-eth3d-terrains-sharp.png' },
            { label: 'Flash3D', src: 'images/compare-rgb/scene-01-eth3d-terrains-flash3d.png' }
        ]
    },
    {
        id: 'scene-02-eth3d-delivery-0688',
        input: 'images/compare-rgb/scene-02-eth3d-delivery-0688-input.png',
        methods: [
            { label: 'Ours', src: 'images/compare-rgb/scene-02-eth3d-delivery-0688-ours.png' },
            { label: 'SHARP', src: 'images/compare-rgb/scene-02-eth3d-delivery-0688-sharp.png' },
            { label: 'Flash3D', src: 'images/compare-rgb/scene-02-eth3d-delivery-0688-flash3d.png' }
        ]
    },
    {
        id: 'scene-03-hypersim-024-007-00',
        input: 'images/compare-rgb/scene-03-hypersim-024-007-00-input.png',
        methods: [
            { label: 'Ours', src: 'images/compare-rgb/scene-03-hypersim-024-007-00-ours.png' },
            { label: 'SHARP', src: 'images/compare-rgb/scene-03-hypersim-024-007-00-sharp.png' },
            { label: 'Flash3D', src: 'images/compare-rgb/scene-03-hypersim-024-007-00-flash3d.png' }
        ]
    },
    {
        id: 'scene-04-hypersim-024-007-01',
        input: 'images/compare-rgb/scene-04-hypersim-024-007-01-input.png',
        methods: [
            { label: 'Ours', src: 'images/compare-rgb/scene-04-hypersim-024-007-01-ours.png' },
            { label: 'SHARP', src: 'images/compare-rgb/scene-04-hypersim-024-007-01-sharp.png' },
            { label: 'Flash3D', src: 'images/compare-rgb/scene-04-hypersim-024-007-01-flash3d.png' }
        ]
    },
    {
        id: 'scene-05-eth3d-delivery-0694',
        input: 'images/compare-rgb/scene-05-eth3d-delivery-0694-input.png',
        methods: [
            { label: 'Ours', src: 'images/compare-rgb/scene-05-eth3d-delivery-0694-ours.png' },
            { label: 'SHARP', src: 'images/compare-rgb/scene-05-eth3d-delivery-0694-sharp.png' },
            { label: 'Flash3D', src: 'images/compare-rgb/scene-05-eth3d-delivery-0694-flash3d.png' }
        ]
    },
    {
        id: 'scene-06-000045-3',
        input: 'images/compare-rgb/scene-06-000045-3-input.png',
        methods: [
            { label: 'Ours', src: 'images/compare-rgb/scene-06-000045-3-ours.png' },
            { label: 'SHARP', src: 'images/compare-rgb/scene-06-000045-3-sharp.png' },
            { label: 'Flash3D', src: 'images/compare-rgb/scene-06-000045-3-flash3d.png' }
        ]
    },
    {
        id: 'scene-07-waymo-147-30',
        input: 'images/compare-rgb/scene-07-waymo-147-30-input.png',
        methods: [
            { label: 'Ours', src: 'images/compare-rgb/scene-07-waymo-147-30-ours.png' },
            { label: 'SHARP', src: 'images/compare-rgb/scene-07-waymo-147-30-sharp.png' },
            { label: 'Flash3D', src: 'images/compare-rgb/scene-07-waymo-147-30-flash3d.png' }
        ]
    }
];

function setupComparisonViewer(gridId, stripId, scenes, selectorLabel) {
    const grid = document.getElementById(gridId);
    const strip = document.getElementById(stripId);

    if (!grid || !strip || scenes.length === 0) return;

    function createComparisonCard(label, src) {
        const card = document.createElement('figure');
        card.className = 'comparison-card';

        const badge = document.createElement('figcaption');
        badge.className = 'comparison-label';
        badge.textContent = label;

        const img = document.createElement('img');
        img.src = assetUrl(src);
        img.alt = `${label} qualitative comparison image`;
        img.loading = 'lazy';

        card.appendChild(badge);
        card.appendChild(img);
        return card;
    }

    function renderScene(scene, activeButton) {
        grid.innerHTML = '';
        scene.methods.forEach(method => {
            grid.appendChild(createComparisonCard(method.label, method.src));
        });

        strip.querySelectorAll('.comparison-scene-btn').forEach(btn => {
            btn.classList.toggle('active', btn === activeButton);
        });
    }

    scenes.forEach((scene, index) => {
        const button = document.createElement('button');
        button.className = 'comparison-scene-btn';
        button.type = 'button';
        button.dataset.sceneId = scene.id;

        button.setAttribute('aria-label', `Select ${selectorLabel} scene ${index + 1}`);
        button.title = `Scene ${index + 1}`;

        const thumb = document.createElement('img');
        thumb.src = assetUrl(scene.input);
        thumb.alt = `Input scene ${index + 1}`;
        thumb.loading = 'lazy';

        button.appendChild(thumb);
        button.addEventListener('click', () => renderScene(scene, button));
        strip.appendChild(button);

        if (index === 0) {
            renderScene(scene, button);
        }
    });
}

function setupRgbComparisonViewer() {
    setupComparisonViewer('rgb-comparison-grid', 'rgb-scene-strip', rgbComparisonScenes, 'RGB comparison');
}

const lidarComparisonSceneIds = [
    'scene-04-000-000083-1',
    'scene-11-035-000045-3',
    'scene-13-035-000065-0',
    'scene-15-035-000174-1',
    'scene-16-040-000008-1',
    'scene-17-040-000048-2',
    'scene-18-040-000109-2',
    'scene-19-040-000150-2'
];

const lidarComparisonScenes = lidarComparisonSceneIds.map(id => ({
    id,
    input: `images/conpare-lidar/${id}-input.png`,
    methods: [
        { label: 'Ours-LiDAR', src: `images/conpare-lidar/${id}-ours-lidar.png` },
        { label: 'ADGaussian', src: `images/conpare-lidar/${id}-adgaussian.png` }
    ]
}));

function setupLidarComparisonViewer() {
    setupComparisonViewer('lidar-comparison-grid', 'lidar-scene-strip', lidarComparisonScenes, 'LiDAR comparison');
}

function getHashTarget() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;

    try {
        return document.getElementById(decodeURIComponent(hash));
    } catch (error) {
        return document.getElementById(hash);
    }
}

function scrollToHashTarget() {
    const target = getHashTarget();
    if (!target) return;

    const scrollMarginTop = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - scrollMarginTop;
    window.scrollTo({ top: targetTop, behavior: 'auto' });
}

function stabilizeInitialHashScroll() {
    if (!window.location.hash) return;

    requestAnimationFrame(scrollToHashTarget);
    [120, 300, 700, 1400, 2400].forEach(delay => {
        window.setTimeout(scrollToHashTarget, delay);
    });

    window.addEventListener('load', () => {
        scrollToHashTarget();
        window.setTimeout(scrollToHashTarget, 600);
    }, { once: true });
}

// Initialize all visualization switchers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    stabilizeInitialHashScroll();
    document.querySelectorAll('.section-card').forEach(card => {
        if (card.querySelector('.viz-switch')) {
            setupVizSwitch(card);
        }
    });
    setupDemoStageButtons();
    setupV2PreviewLoading();
    setupGsGallery();
    setupRgbComparisonViewer();
    setupLidarComparisonViewer();
});

window.addEventListener('hashchange', () => {
    window.setTimeout(scrollToHashTarget, 0);
});
