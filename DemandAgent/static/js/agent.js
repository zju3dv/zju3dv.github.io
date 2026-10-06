'use strict';

const art = document.querySelector('.agent-art');
const header = document.querySelector('.publication-header');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const gallery = document.querySelector('[data-gallery]');
if (gallery) {
  const video = gallery.querySelector('[data-player]');
  const source = video.querySelector('source');
  const items = [...gallery.querySelectorAll('.gallery-item')];
  const title = gallery.querySelector('[data-now]');
  const count = gallery.querySelector('.stage-count b');
  const loading = gallery.querySelector('[data-loading]');
  const error = gallery.querySelector('[data-error]');
  const status = gallery.querySelector('[data-playback-status]');
  const steps = [...gallery.querySelectorAll('[data-step]')];
  let current = items[0];
  let selection = 0;

  function showLoading(show) {
    loading.hidden = !show;
    video.setAttribute('aria-busy', String(show));
  }

  function selectVideo(item, play) {
    const request = ++selection;
    video.pause();
    if (item !== current) {
      current.removeAttribute('aria-current');
      current.classList.remove('is-playing');
      current.style.removeProperty('--played');
      current = item;
      source.src = item.href;
      video.poster = item.dataset.poster;
      video.querySelector('a').href = item.href;
      video.load();
    }
    current.setAttribute('aria-current', 'true');
    title.textContent = title.title = item.dataset.title;
    const index = items.indexOf(item);
    count.textContent = index + 1;
    steps.forEach(button => { button.disabled = !items[index + Number(button.dataset.step)]; });
    error.hidden = true;
    error.querySelector('a').href = item.href;
    showLoading(play && video.readyState < 3);
    status.textContent = `Selected ${item.dataset.title}`;
    if (play) video.play().catch(() => {
      if (request !== selection) return;
      showLoading(false);
      status.textContent = `Selected ${item.dataset.title}. Use the video controls to start playback.`;
    });
  }

  items.forEach(item => {
    let start;
    let dragged = false;
    item.addEventListener('pointerdown', event => {
      start = { x: event.clientX, y: event.clientY };
      dragged = false;
    }, { passive: true });
    item.addEventListener('pointermove', event => {
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) dragged = true;
    }, { passive: true });
    item.addEventListener('pointerup', () => { start = null; }, { passive: true });
    item.addEventListener('pointercancel', () => { start = null; dragged = true; }, { passive: true });
    item.addEventListener('click', event => {
      event.preventDefault();
      if (event.detail !== 0 && dragged) return;
      selectVideo(item, true);
    });
  });
  gallery.querySelector('.stage-nav').hidden = false;
  steps.forEach(button => button.addEventListener('click', () => {
    const next = items[items.indexOf(current) + Number(button.dataset.step)];
    if (next) selectVideo(next, !video.paused);
  }));
  gallery.querySelector('[data-retry]').addEventListener('click', () => {
    video.load();
    selectVideo(current, true);
  });
  video.addEventListener('play', () => {
    current.classList.add('is-playing');
    showLoading(video.readyState < 3);
  });
  video.addEventListener('pause', () => {
    current.classList.remove('is-playing');
    if (!video.seeking) showLoading(false);
  });
  video.addEventListener('waiting', () => { if (!video.paused) showLoading(true); });
  video.addEventListener('playing', () => {
    current.classList.add('is-playing');
    error.hidden = true;
    showLoading(false);
    status.textContent = `Playing ${current.dataset.title}`;
  });
  video.addEventListener('canplay', () => showLoading(false));
  function showError() {
    showLoading(false);
    current.classList.remove('is-playing');
    error.hidden = false;
    status.textContent = 'Unable to load this video. Retry or open the MP4 directly.';
  }
  video.addEventListener('error', showError);
  source.addEventListener('error', showError);
  video.addEventListener('timeupdate', () => {
    if (Number.isFinite(video.duration) && video.duration > 0) current.style.setProperty('--played', video.currentTime / video.duration);
  });
  video.addEventListener('ended', () => {
    const next = items[items.indexOf(current) + 1];
    if (next) selectVideo(next, true);
  });
}

if (art && typeof art.pauseAnimations === 'function') {
  const steps = [...header.querySelectorAll('.agent-loop li')];
  const stages = [...header.querySelectorAll('[data-stage]')];
  const cycleSeconds = parseFloat(art.querySelector('animateMotion').getAttribute('dur'));
  const phaseSeconds = cycleSeconds / steps.length;
  let onScreen = true;
  let frame = 0;

  function updatePhase() {
    const index = Math.floor((art.getCurrentTime() % cycleSeconds) / phaseSeconds);
    const phase = steps[index].dataset.stage;
    if (art.dataset.phase !== phase) {
      art.dataset.phase = phase;
      stages.forEach(stage => stage.classList.toggle('is-active', stage.dataset.stage === phase));
    }
  }

  function tick() {
    updatePhase();
    frame = requestAnimationFrame(tick);
  }

  function syncAnimation() {
    const paused = !onScreen || document.hidden || reducedMotion.matches;
    header.classList.toggle('motion-paused', paused);
    if (paused) {
      art.pauseAnimations();
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      art.unpauseAnimations();
      if (!frame) frame = requestAnimationFrame(tick);
    }
    if (reducedMotion.matches) art.setCurrentTime(0);
    updatePhase();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncAnimation();
    }).observe(art);
  }
  reducedMotion.addEventListener('change', syncAnimation);
  document.addEventListener('visibilitychange', syncAnimation);
  syncAnimation();
}

const dialog = document.querySelector('#figure-dialog');
if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('.zoomable-figure').forEach(figure => {
    const image = figure.querySelector('.publication-figure');
    const button = figure.querySelector('.figure-expand');
    function openFigure() {
      dialog.querySelector('img').src = image.currentSrc || image.src;
      dialog.querySelector('img').alt = image.alt;
      dialog.querySelector('#figure-dialog-title').textContent = image.alt;
      dialog.querySelector('#figure-original').href = image.currentSrc || image.src;
      if (!dialog.open) dialog.showModal();
    }
    button.hidden = false;
    figure.classList.add('can-zoom');
    button.addEventListener('click', openFigure);
    image.addEventListener('click', openFigure);
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}

const root = document.documentElement;
const progressBar = document.querySelector('.scroll-progress span');
const navLinks = [...document.querySelectorAll('.nav-links a')]
  .map(link => [link, document.querySelector(link.hash)]);
let scrollQueued = false;

function syncScroll() {
  scrollQueued = false;
  const scrollable = root.scrollHeight - innerHeight;
  progressBar.style.setProperty('--progress', scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0);
  let current = null;
  navLinks.forEach(([link, section]) => {
    if (section.getBoundingClientRect().top <= innerHeight * 0.4) current = link;
  });
  if (scrollable > 0 && scrollY >= scrollable - 2) current = navLinks.at(-1)[0];
  navLinks.forEach(([link]) => {
    link.classList.toggle('is-active', link === current);
    if (link === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function queueScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(syncScroll);
}
addEventListener('scroll', queueScroll, { passive: true });
addEventListener('resize', queueScroll);
syncScroll();

if ('IntersectionObserver' in window) {
  const revealElements = [...document.querySelectorAll('[data-reveal]')];
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
        entry.target.classList.add('is-visible');
      } else if (!entry.isIntersecting || entry.intersectionRatio <= 0.01) {
        entry.target.classList.remove('is-visible');
        entry.target.classList.toggle('is-above', entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0));
      }
    });
  }, { threshold: [0, 0.01, 0.08], rootMargin: '-48px 0px -48px 0px' });

  function syncReveals() {
    revealObserver.disconnect();
    root.classList.toggle('motion-ready', !reducedMotion.matches);
    if (!reducedMotion.matches) revealElements.forEach(element => revealObserver.observe(element));
  }
  reducedMotion.addEventListener('change', syncReveals);
  document.addEventListener('focusin', event => {
    const target = event.target.closest('[data-reveal]');
    if (target) target.classList.add('is-visible');
  });
  syncReveals();
}
