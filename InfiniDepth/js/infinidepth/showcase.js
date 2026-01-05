/**
 * Showcase Image Gallery
 * Handles thumbnail selection and main image display
 */

// Image data configuration
const depthMainImgs = [
    'images/pub/infinidepth/depth/depth1.jpg',
    'images/pub/infinidepth/depth/depth2.jpg',
    'images/pub/infinidepth/depth/depth3.jpg',
    'images/pub/infinidepth/depth/depth4.jpg',
];

const depthThumbs = [
    'images/pub/infinidepth/depth/rgb1.jpg',
    'images/pub/infinidepth/depth/rgb2.jpg',
    'images/pub/infinidepth/depth/rgb3.jpg',
    'images/pub/infinidepth/depth/rgb4.jpg',
];

const pcdMainImgs = [
    'images/pub/infinidepth/vis_pcd/pcd2.jpg',
    'images/pub/infinidepth/vis_pcd/pcd1.jpg',
    'images/pub/infinidepth/vis_pcd/pcd3.jpg',
    'images/pub/infinidepth/vis_pcd/pcd4.jpg',
];

const pcdThumbs = [
    'images/pub/infinidepth/vis_pcd/rgb2.jpg',
    'images/pub/infinidepth/vis_pcd/rgb1.jpg',
    'images/pub/infinidepth/vis_pcd/rgb3.jpg',
    'images/pub/infinidepth/vis_pcd/rgb4.jpg',
];

const nvsMainImgs = [
    'images/pub/infinidepth/nvs_compare/nvs5.jpg',
    'images/pub/infinidepth/nvs_compare/nvs3.jpg',
    'images/pub/infinidepth/nvs_compare/nvs4.jpg',
    'images/pub/infinidepth/nvs_compare/nvs1.jpg',
    'images/pub/infinidepth/nvs_compare/nvs2.jpg',
    // 'images/pub/infinidepth/nvs_compare/nvs7.jpg',
    'images/pub/infinidepth/nvs_compare/nvs8.jpg',
];

const nvsThumbs = [
    'images/pub/infinidepth/nvs_compare/rgb5.jpg',
    'images/pub/infinidepth/nvs_compare/rgb3.jpg',
    'images/pub/infinidepth/nvs_compare/rgb4.jpg',
    'images/pub/infinidepth/nvs_compare/rgb1.jpg',
    'images/pub/infinidepth/nvs_compare/rgb2.jpg',
    // 'images/pub/infinidepth/nvs_compare/rgb7.jpg',
    'images/pub/infinidepth/nvs_compare/rgb8.jpg',
];

/**
 * Setup showcase gallery with navigation arrows
 * @param {string} mainImgId - ID of the main image element
 * @param {string} showcaseId - ID of the showcase container
 * @param {Array} mainList - Array of main image URLs
 * @param {Array} thumbList - Array of thumbnail URLs
 */
function setupShowcase(mainImgId, showcaseId, mainList, thumbList) {
    const mainImg = document.getElementById(mainImgId);
    const showcase = document.getElementById(showcaseId);

    if (!mainImg || !showcase) return;

    const maxVisible = 4; // 固定显示4张图
    let startIndex = 0; // 当前显示的起始索引

    // 创建容器和箭头
    const container = document.createElement('div');
    container.className = 'showcase-container';

    const leftArrow = document.createElement('div');
    leftArrow.className = 'showcase-arrow showcase-arrow-left';
    leftArrow.innerHTML = '&#9664;'; // ◀

    const rightArrow = document.createElement('div');
    rightArrow.className = 'showcase-arrow showcase-arrow-right';
    rightArrow.innerHTML = '&#9654;'; // ▶

    // 将showcase移到container中
    const parent = showcase.parentNode;
    parent.replaceChild(container, showcase);
    container.appendChild(leftArrow);
    container.appendChild(showcase);
    container.appendChild(rightArrow);

    // 渲染缩略图
    function renderThumbs() {
        showcase.innerHTML = '';

        const endIndex = Math.min(startIndex + maxVisible, thumbList.length);
        const visibleThumbs = thumbList.slice(startIndex, endIndex);

        visibleThumbs.forEach((src, idx) => {
            const actualIdx = startIndex + idx;
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.className = 'showcase-thumb' + (actualIdx === 0 && startIndex === 0 ? ' active' : '');
            thumb.alt = 'Showcase Thumb ' + (actualIdx + 1);
            thumb.dataset.index = actualIdx;

            thumb.addEventListener('click', function() {
                // Update main image
                if (mainList[actualIdx]) mainImg.src = mainList[actualIdx];

                // Update active thumbnail
                showcase.querySelectorAll('.showcase-thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });

            showcase.appendChild(thumb);
        });

        // 更新箭头状态
        updateArrows();
    }

    // 更新箭头启用/禁用状态
    function updateArrows() {
        // 箭头始终显示
        leftArrow.style.display = 'flex';
        rightArrow.style.display = 'flex';

        // 根据滚动位置设置禁用状态
        if (startIndex === 0) {
            leftArrow.classList.add('disabled');
        } else {
            leftArrow.classList.remove('disabled');
        }

        if (startIndex + maxVisible >= thumbList.length) {
            rightArrow.classList.add('disabled');
        } else {
            rightArrow.classList.remove('disabled');
        }
    }

    // 左箭头点击事件
    leftArrow.addEventListener('click', function() {
        if (startIndex > 0) {
            startIndex--;
            renderThumbs();
        }
    });

    // 右箭头点击事件
    rightArrow.addEventListener('click', function() {
        if (startIndex + maxVisible < thumbList.length) {
            startIndex++;
            renderThumbs();
        }
    });

    // 初始化
    renderThumbs();
    if (mainList[0]) mainImg.src = mainList[0];
}

// Initialize showcases when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupShowcase('depth-main-img', 'depth-showcase', depthMainImgs, depthThumbs);
    setupShowcase('pcd-main-img', 'pcd-showcase', pcdMainImgs, pcdThumbs);
    setupShowcase('nvs-main-img', 'nvs-showcase', nvsMainImgs, nvsThumbs);
});
