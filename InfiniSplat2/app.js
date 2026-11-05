'use strict';
const presentation = {"floaters":[{"title":"Birds","aspect_ratio":1.3518518518518519,"before":"assets/points/01/points.webp","after":"assets/points/01/gaussians.webp"},{"title":"Smurf","aspect_ratio":1.3518518518518519,"before":"assets/points/02/points.webp","after":"assets/points/02/gaussians.webp"},{"title":"Japanese living room","aspect_ratio":1.3214285714285714,"before":"assets/points/03/points.webp","after":"assets/points/03/gaussians.webp"},{"title":"White living room","aspect_ratio":1.3214285714285714,"before":"assets/points/04/points.webp","after":"assets/points/04/gaussians.webp"},{"title":"Red kitchen","aspect_ratio":1.3214285714285714,"before":"assets/points/05/points.webp","after":"assets/points/05/gaussians.webp"},{"title":"Sunlit bedroom","aspect_ratio":1.3214285714285714,"before":"assets/points/06/points.webp","after":"assets/points/06/gaussians.webp"},{"title":"Wooden kitchen","aspect_ratio":1.3214285714285714,"before":"assets/points/07/points.webp","after":"assets/points/07/gaussians.webp"},{"title":"Staircase","aspect_ratio":1.3214285714285714,"before":"assets/points/08/points.webp","after":"assets/points/08/gaussians.webp"},{"title":"Kicker","aspect_ratio":1.48,"before":"assets/points/09/points.webp","after":"assets/points/09/gaussians.webp"}],"gallery":[{"id":"scene-01","label":"Scene 1","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/01/poster.jpg","preview_video":"assets/previews/01/revised.mp4","viewer":"assets/scenes/01/viewer.html"},{"id":"scene-02","label":"Scene 2","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/02/poster.jpg","preview_video":"assets/previews/02/revised.mp4","viewer":"assets/scenes/02/viewer.html"},{"id":"scene-03","label":"Scene 3","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/03/poster.jpg","preview_video":"assets/previews/03/revised.mp4","viewer":"assets/scenes/03/viewer.html"},{"id":"scene-04","label":"Scene 4","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/04/poster.jpg","preview_video":"assets/previews/04/revised.mp4","viewer":"assets/scenes/04/viewer.html"},{"id":"scene-05","label":"Scene 5","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/05/poster.jpg","preview_video":"assets/previews/05/revised.mp4","viewer":"assets/scenes/05/viewer.html"},{"id":"scene-06","label":"Scene 6","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/06/poster.jpg","preview_video":"assets/previews/06/revised.mp4","viewer":"assets/scenes/06/viewer.html"},{"id":"scene-07","label":"Scene 7","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/07/poster.jpg","preview_video":"assets/previews/07/revised.mp4","viewer":"assets/scenes/07/viewer.html"},{"id":"scene-08","label":"Scene 8","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/08/poster.jpg","preview_video":"assets/previews/08/revised.mp4","viewer":"assets/scenes/08/viewer.html"},{"id":"scene-09","label":"Scene 9","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/09/poster.jpg","preview_video":"assets/previews/09/revised.mp4","viewer":"assets/scenes/09/viewer.html"},{"id":"scene-10","label":"Scene 10","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/10/poster.jpg","preview_video":"assets/previews/10/revised.mp4","viewer":"assets/scenes/10/viewer.html"},{"id":"scene-11","label":"Scene 11","aspect_ratio":1.2333333333333334,"viewer_available":true,"poster":"assets/scenes/11/poster.jpg","preview_video":"assets/previews/11/revised.mp4","viewer":"assets/scenes/11/viewer.html"},{"id":"scene-12","label":"Scene 12","aspect_ratio":1.5098039215686274,"viewer_available":true,"poster":"assets/scenes/12/poster.jpg","preview_video":"assets/previews/12/revised.mp4","viewer":"assets/scenes/12/viewer.html"},{"id":"scene-13","label":"Scene 13","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/13/poster.jpg","preview_video":"assets/previews/13/revised.mp4","viewer":"assets/scenes/13/viewer.html"},{"id":"scene-14","label":"Scene 14","aspect_ratio":1.48,"viewer_available":true,"poster":"assets/scenes/14/poster.jpg","preview_video":"assets/previews/14/revised.mp4","viewer":"assets/scenes/14/viewer.html"},{"id":"scene-15","label":"Scene 15","aspect_ratio":1.5,"viewer_available":true,"poster":"assets/scenes/15/poster.jpg","preview_video":"assets/previews/15/revised.mp4","viewer":"assets/scenes/15/viewer.html"},{"id":"scene-16","label":"Scene 16","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/16/poster.jpg","preview_video":"assets/previews/16/revised.mp4","viewer":"assets/scenes/16/viewer.html"},{"id":"scene-17","label":"Scene 17","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/17/poster.jpg","preview_video":"assets/previews/17/revised.mp4","viewer":"assets/scenes/17/viewer.html"},{"id":"scene-18","label":"Scene 18","aspect_ratio":1.3214285714285714,"viewer_available":true,"poster":"assets/scenes/18/poster.jpg","preview_video":"assets/previews/18/revised.mp4","viewer":"assets/scenes/18/viewer.html"}]};
const $ = id => document.getElementById(id);
function asset(path) {
  if (typeof path !== 'string' || !path.startsWith('assets/') || path.includes('..') || /[\\?#]/.test(path)) throw Error('Invalid asset path');
  const meta = (path.startsWith('assets/previews/') || path.endsWith('/viewer.html') || /^assets\/points\/\d{2}\/(points|gaussians)\.webp$/.test(path)) ? 'infinisplat-viewer-base' : 'infinisplat-asset-base';
  const base = document.querySelector('meta[name="' + meta + '"]')?.content;
  if (!base) return path;
  const url = new URL(base);
  if (!["https:", "http:"].includes(url.protocol) || url.search || url.hash) throw Error("Invalid asset base");
  return new URL(path, url.href.replace(/\/?$/, "/")).href;
}
function mark(container, id) {
  document.querySelectorAll(`#${container} button`).forEach(b => {
    const active = b.dataset.id === id;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
}
function card(scene, image, callback, showLabel = true) {
  const b = document.createElement('button');
  b.className = 'case-card'; b.dataset.id = scene.id;
  const im = document.createElement('img'); im.src = asset(image); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
  const title = document.createElement('span'); title.textContent = scene.label;
  b.append(im); if (showLabel) b.append(title); b.onclick = () => callback(scene); return b;
}
const comparison = $('comparison');
const slider = $('slider');
function setSplit(value) {
  const split = Math.max(0, Math.min(100, Math.round(value)));
  slider.value = split;
  slider.setAttribute('aria-valuetext', `${split}% Point Clouds, ${100 - split}% Gaussians`);
  comparison.style.setProperty('--split', `${split}%`);
}
slider.addEventListener('input', () => setSplit(Number(slider.value)));
function splitAtPointer(event) {
  const rect = comparison.getBoundingClientRect();
  setSplit(100 * (event.clientX - rect.left) / rect.width);
}
slider.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  event.preventDefault();
  slider.focus({ preventScroll: true });
  slider.setPointerCapture(event.pointerId);
  splitAtPointer(event);
});
slider.addEventListener('pointermove', event => {
  if (slider.hasPointerCapture(event.pointerId)) splitAtPointer(event);
});
slider.addEventListener('pointerup', event => {
  if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
});
const decodedImages = new Map();
function decodeImage(src, priority = 'high') {
  let entry = decodedImages.get(src);
  if (entry) { decodedImages.delete(src); decodedImages.set(src, entry); return entry.promise; }
  const image = new Image(); image.fetchPriority = priority; image.src = src;
  entry = { image, promise: image.decode().catch(error => { decodedImages.delete(src); throw error; }) };
  decodedImages.set(src, entry);
  while (decodedImages.size > 6) decodedImages.delete(decodedImages.keys().next().value);
  return entry.promise;
}
function preloadAdjacentScenes(scene, selection) {
  if (navigator.connection?.saveData) return;
  const run = async () => {
    const scenes = presentation.floaters; const index = scenes.indexOf(scene);
    for (const offset of [1, -1]) {
      if (selection !== floaterSelection) return;
      const next = scenes[(index + offset + scenes.length) % scenes.length];
      await Promise.all(['before', 'after'].map(key => decodeImage(asset(next[key]), 'low'))).catch(() => {});
    }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1000 });
  else setTimeout(run, 100);
}
let floaterSelection = 0;
async function chooseFloater(scene) {
  const selection = ++floaterSelection;
  const firstImage = !$('after').hasAttribute('src');
  comparison.setAttribute('aria-busy', 'true');
  $('empty-result').hidden = !firstImage;
  $('empty-result').textContent = 'Loading comparison…';
  try {
    const sources = ['before', 'after'].map(id => asset(scene[id]));
    await Promise.all(sources.map(src => decodeImage(src)));
    if (selection !== floaterSelection) return;
    comparison.style.aspectRatio = scene.aspect_ratio;
    setSplit(50);
    for (const [index, id] of ['before', 'after'].entries()) {
      $(id).alt = `${scene.title} — ${id === 'before' ? 'Point Clouds' : 'Gaussians'}`;
      $(id).src = sources[index];
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        $(id).getAnimations().forEach(animation => animation.cancel());
        $(id).animate([{ opacity: 0.8 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      }
    }
    comparison.setAttribute('aria-busy', 'false');
    $('empty-result').hidden = true;
    preloadAdjacentScenes(scene, selection);
  } catch (error) {
    if (selection !== floaterSelection) return;
    comparison.setAttribute('aria-busy', 'false');
    $('empty-result').hidden = false;
    $('empty-result').textContent = 'Image unavailable. Try another scene.';
  }
}
function galleryLabel(scene) {
  return scene.label;
}
let activeScene;
let galleryGeneration = 0;
let galleryVisible = false;
let interactiveScene = false;
const previewVideo = $('gallery-preview');
const viewerButton = $('viewer-button');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function playPreview() {
  if (galleryVisible && !interactiveScene && !document.hidden && !reducedMotion.matches) previewVideo.play().catch(() => {});
  else previewVideo.pause();
}
function chooseGallery(scene) {
  activeScene = scene;
  galleryGeneration++;
  interactiveScene = false;
  document.querySelector('.viewer-wrap').style.aspectRatio = scene.aspect_ratio;
  const previous = $('scene-viewer');
  const next = previous.cloneNode(false);
  next.removeAttribute('src'); next.hidden = false;
  next.setAttribute('aria-hidden', 'true'); next.tabIndex = -1;
  previous.replaceWith(next);
  document.querySelector('.viewer-wrap').classList.remove('is-interactive');
  $('gallery-title').textContent = ''; $('close-viewer').hidden = true;
  viewerButton.hidden = false;
  $('viewer-poster').src = asset(scene.poster);
  previewVideo.pause(); previewVideo.poster = asset(scene.poster);
  previewVideo.src = asset(scene.preview_video); previewVideo.load();
  previewVideo.hidden = false;
  if (scene.viewer) $('standalone-link').href = asset(scene.viewer);
  else $('standalone-link').removeAttribute('href');
  $('standalone-link').hidden = scene.viewer_available === false;
  viewerButton.hidden = scene.viewer_available === false;
  viewerButton.onclick = () => {
    interactiveScene = true;
    if (!next.hasAttribute('src')) next.src = asset(scene.viewer);
    next.removeAttribute('aria-hidden'); next.removeAttribute('tabindex');
    document.querySelector('.viewer-wrap').classList.add('is-interactive');
    previewVideo.pause(); previewVideo.hidden = true;
    viewerButton.hidden = true; $('close-viewer').hidden = false;
    next.focus();
  };
  const generation = galleryGeneration;
  previewVideo.onloadeddata = () => {
    if (generation !== galleryGeneration) return;
    playPreview();
  };
  previewVideo.onerror = () => { if (generation === galleryGeneration) previewVideo.hidden = true; };
  mark('gallery-cards', scene.id);
  playPreview();
}
new IntersectionObserver(entries => {
  galleryVisible = entries.some(entry => entry.isIntersecting);
  playPreview();
}, { rootMargin: '100px' }).observe(document.querySelector('.viewer-wrap'));
document.addEventListener('visibilitychange', playPreview);
reducedMotion.addEventListener('change', playPreview);


Promise.resolve(presentation).then(data => {
  if (!data.floaters.length || !data.gallery.length) throw Error('Empty selection');
  let caseIndex = 0;
  function moveCase(direction) {
    caseIndex = (caseIndex + direction + data.floaters.length) % data.floaters.length;
    chooseFloater(data.floaters[caseIndex]);
  }
  $('previous-case').onclick = () => moveCase(-1);
  $('next-case').onclick = () => moveCase(1);
  $('previous-case').disabled = $('next-case').disabled = data.floaters.length < 2;
  for (const scene of data.gallery) {
    const button = card(scene, scene.poster, selected => {
      chooseGallery(selected);
      document.querySelector('.viewer-wrap').scrollIntoView({ block: 'nearest' });
    }, false);
    button.setAttribute('aria-label', `Explore ${galleryLabel(scene)} in 3D`);
    $('gallery-cards').append(button);
  }
  const floaterObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      if (floaterSelection === 0) chooseFloater(data.floaters[0]);
      floaterObserver.disconnect();
    }
  }, { rootMargin: '250px' });
  floaterObserver.observe(comparison);
  chooseGallery(data.gallery[0]);
  if (data.demo_url) {
    const u = new URL(data.demo_url); if (!['http:', 'https:'].includes(u.protocol)) throw Error('Invalid demo URL');
    $('demo-link').href = u.href; $('demo-link').removeAttribute('aria-disabled'); $('demo-link').classList.remove('resource-pending');
  }
}).catch(error => { $('empty-result').hidden = false; $('empty-result').textContent = 'Results could not be loaded. Please reload.'; console.error(error); });


$('close-viewer').onclick = () => { if (activeScene) chooseGallery(activeScene); };

document.querySelectorAll('video:not(#gallery-preview)').forEach(video => video.addEventListener('play', () => document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); })));
previewVideo.addEventListener('play', () => document.querySelectorAll('video:not(#gallery-preview)').forEach(other => other.pause()));

$('copy-citation').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('citation-code').textContent);
    $('copy-citation').textContent = 'Copied';
    $('citation-copy-status').textContent = 'Citation copied to clipboard.';
    setTimeout(() => { $('copy-citation').textContent = 'Copy'; }, 2000);
  } catch {
    const selection = window.getSelection(); const range = document.createRange();
    range.selectNodeContents($('citation-code')); selection.removeAllRanges(); selection.addRange(range);
    $('citation-copy-status').textContent = 'Citation selected. Use your browser copy command.';
  }
});

// Keep comparison method names visible and aligned during horizontal scrolling.
const comparisonScroll = document.querySelector('.comparison-scroll');
const methodGrid = document.createElement('div');
methodGrid.className = 'comparison-method-grid';
document.querySelectorAll('.comparison-grid > .method-name').forEach(node => methodGrid.append(node));
const methodHeader = document.createElement('div');
methodHeader.className = 'comparison-methods';
methodHeader.append(methodGrid);
comparisonScroll.before(methodHeader);
comparisonScroll.addEventListener('scroll', () => { methodHeader.scrollLeft = comparisonScroll.scrollLeft; }, { passive: true });

const navigationLinks = [...document.querySelectorAll('.nav-links a')];
function updateNavigation() {
  const boundary = document.querySelector('.site-nav').getBoundingClientRect().bottom + 90;
  let selected;
  for (const link of navigationLinks) {
    const section = document.querySelector(link.getAttribute('href'));
    if (section.getBoundingClientRect().top <= boundary) selected = link;
  }
  for (const link of navigationLinks) {
    if (link === selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
let navigationPending = false;
window.addEventListener('scroll', () => {
  if (navigationPending) return;
  navigationPending = true;
  requestAnimationFrame(() => { updateNavigation(); navigationPending = false; });
}, { passive: true });
updateNavigation();
