document.querySelectorAll('.resource-links a[href="#"]').forEach((link) => {
  link.setAttribute('aria-disabled', 'true');
  link.addEventListener('click', (event) => event.preventDefault());
});

const demoVideo = document.querySelector('.demo-video');
const demoLoading = document.querySelector('.demo-loading');
const hideDemoLoading = () => { demoLoading.hidden = true; };
['loadeddata', 'playing', 'error'].forEach((event) => demoVideo.addEventListener(event, hideDemoLoading, { once: true }));
if (demoVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || demoVideo.error) hideDemoLoading();

const sectionLinks = [...document.querySelectorAll('.side-nav a[href^="#"]:not(.nav-footer)')]
  .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
  .filter(({ section }) => section);

function updateActiveNav() {
  const marker = window.innerHeight * 0.35;
  let active = sectionLinks[0];
  for (const item of sectionLinks) {
    if (item.section.getBoundingClientRect().top <= marker) active = item;
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    active = sectionLinks[sectionLinks.length - 1];
  }
  for (const item of sectionLinks) {
    item.link.classList.toggle('is-active', item === active);
    if (item === active) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  }
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
window.addEventListener('resize', updateActiveNav);
updateActiveNav();

const comparisonCase = document.querySelector('.comparison-case');
const mediaBase = 'https://raw.githubusercontent.com/cxzhou35/projects/main/realme/assets/';
const videoGrid = comparisonCase.querySelector('.video-grid');
const comparisonVideos = videoGrid.querySelectorAll('video');
const oursVideo = videoGrid.querySelector('[data-method="ours"]');
const autoplayToggle = document.querySelector('.autoplay-toggle');
let comparisonVisible = false;
let completedLoops = 0;
let sceneReady = true;
let sceneVersion = 0;
function playComparison() {
  if (!sceneReady || !comparisonVisible || autoplayToggle.getAttribute('aria-checked') !== 'true') return;
  comparisonVideos.forEach((video) => {
    video.muted = true;
    video.play().catch(() => {});
  });
}

autoplayToggle.addEventListener('click', () => {
  const enabled = autoplayToggle.getAttribute('aria-checked') !== 'true';
  autoplayToggle.setAttribute('aria-checked', enabled);
  autoplayToggle.querySelector('.autoplay-state').textContent = enabled ? 'On' : 'Off';
  if (enabled) playComparison();
  else comparisonVideos.forEach((video) => video.pause());
});

new IntersectionObserver(([entry]) => {
  comparisonVisible = entry.intersectionRatio >= 0.25;
  if (comparisonVisible) playComparison();
  else comparisonVideos.forEach((video) => video.pause());
}, { threshold: 0.25 }).observe(comparisonCase);

async function selectScene(button) {
  const version = ++sceneVersion;
  sceneReady = false;
  completedLoops = 0;
  videoGrid.dataset.scene = button.dataset.scene;
  const ready = [...comparisonVideos].map((video) => new Promise((resolve) => {
    video.pause();
    video.poster = `${mediaBase}images/${button.dataset.scene}-${video.dataset.method}.jpg`;
    video.src = `${mediaBase}videos/${button.dataset.scene}-${video.dataset.method}.mp4`;
    video.setAttribute('aria-label', `${video.closest('figure').querySelector('figcaption').textContent.trim()} ${button.getAttribute('aria-label')} result`);
    video.preload = 'auto';
    const finish = () => {
      video.removeEventListener('canplay', finish);
      video.removeEventListener('error', finish);
      resolve();
    };
    video.addEventListener('canplay', finish);
    video.addEventListener('error', finish);
    video.load();
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA || video.error) finish();
  }));
  button.closest('.scene-switcher').querySelectorAll('[data-scene]').forEach((scene) => {
    scene.setAttribute('aria-pressed', scene === button);
  });
  button.closest('.scene-list').querySelector('.scene-selection').style.transform = `translateX(${button.offsetLeft}px)`;
  await Promise.all(ready);
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (version !== sceneVersion) return;
  sceneReady = true;
  playComparison();
}

document.querySelectorAll('.scene-list [data-scene]').forEach((button) => {
  button.addEventListener('click', () => selectScene(button));
});

function handleOursEnded() {
  if (!comparisonVisible || autoplayToggle.getAttribute('aria-checked') !== 'true') return;
  completedLoops += 1;
  if (completedLoops < 2) {
    comparisonVideos.forEach((video) => { video.currentTime = 0; });
    playComparison();
  } else {
    document.querySelector('.scene-switcher:not([hidden]) .scene-arrow[data-direction="1"]').click();
  }
}
oursVideo.addEventListener('ended', handleOursEnded);

function centerScene(button, behavior) {
  const list = button.closest('.scene-list');
  list.scrollTo({ left: button.offsetLeft + button.offsetWidth / 2 - list.clientWidth / 2, behavior });
}

document.querySelectorAll('.scene-arrow').forEach((arrow) => {
  arrow.addEventListener('click', () => {
    const scenes = [...arrow.closest('.scene-switcher').querySelectorAll('[data-scene]')];
    const current = scenes.findIndex((scene) => scene.getAttribute('aria-pressed') === 'true');
    const next = scenes[(current + Number(arrow.dataset.direction) + scenes.length) % scenes.length];
    selectScene(next);
    centerScene(next, 'smooth');
  });
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.scene-switcher:not([hidden]) .scene-list').forEach((list) => {
    const selected = list.querySelector('[data-scene][aria-pressed="true"]');
    list.querySelector('.scene-selection').style.transform = `translateX(${selected.offsetLeft}px)`;
    centerScene(selected, 'auto');
  });
});

const datasetButtons = document.querySelectorAll('.dataset-switcher button');
datasetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    datasetButtons.forEach((datasetButton) => {
      datasetButton.setAttribute('aria-pressed', datasetButton === button);
    });
    document.querySelectorAll('.scene-switcher').forEach((switcher) => {
      switcher.hidden = switcher.dataset.dataset !== button.dataset.dataset;
      if (!switcher.hidden) {
        const selected = switcher.querySelector('[data-scene][aria-pressed="true"]');
        selectScene(selected);
        centerScene(selected, 'auto');
      }
    });
  });
});

if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.detail-grid a').forEach((link) => {
    const image = link.querySelector('img');
    const moveZoom = (event) => {
      const bounds = link.getBoundingClientRect();
      image.style.transformOrigin = `${(event.clientX - bounds.left) / bounds.width * 100}% ${(event.clientY - bounds.top) / bounds.height * 100}%`;
    };
    link.addEventListener('pointerenter', moveZoom);
    link.addEventListener('pointermove', moveZoom);
  });
}

const copyButton = document.querySelector('.bibtex-copy');
const copyStatus = document.querySelector('.bibtex-copy-status');
let copyResetTimer;
copyButton.addEventListener('click', async () => {
  const citation = document.querySelector('.bibtex code').textContent.trim();
  let copied = false;
  try {
    await navigator.clipboard.writeText(citation);
    copied = true;
  } catch {
    const field = document.createElement('textarea');
    field.value = citation;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    try { copied = document.execCommand('copy'); } catch {}
    field.remove();
  }
  clearTimeout(copyResetTimer);
  const [copyIcon, checkIcon] = copyButton.querySelectorAll('svg');
  copyIcon.toggleAttribute('hidden', copied);
  checkIcon.toggleAttribute('hidden', !copied);
  copyStatus.textContent = copied ? 'Copied!' : 'Copy failed';
  copyResetTimer = setTimeout(() => {
    copyIcon.removeAttribute('hidden');
    checkIcon.setAttribute('hidden', '');
    copyStatus.textContent = '';
  }, 2600);
});
