'use strict';
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const video = document.querySelector('#demo-video');
const playbackStatus = document.querySelector('#playback-status');
const videoError = document.querySelector('#video-error');
video.addEventListener('error', () => { videoError.hidden = false; });
video.querySelector('source').addEventListener('error', () => { videoError.hidden = false; });
video.addEventListener('playing', () => { videoError.hidden = true; });

// Gallery: one player, many complete runs. Each card is a link to its MP4, so
// without JavaScript it still opens the video; with it, the card loads the player.
const galleryItems = [...document.querySelectorAll('.gallery-item')];
const galleryTitle = document.querySelector('#gallery-now');
const galleryCount = document.querySelector('.stage-count b');
let currentItem = galleryItems.find(item => item.hasAttribute('aria-current')) ?? galleryItems[0];
const shownItems = () => galleryItems.filter(item => !item.parentElement.hidden);
function selectVideo(item, play) {
  if (item !== currentItem) {
    currentItem.removeAttribute('aria-current');
    currentItem.classList.remove('is-playing');
    currentItem.style.removeProperty('--played');
    currentItem = item;
    item.setAttribute('aria-current', 'true');
    const src = item.getAttribute('href');
    video.poster = item.dataset.poster;
    video.querySelector('source').src = src;
    videoError.hidden = true;
    videoError.querySelector('a').href = src;
    video.preload = 'metadata';
    video.load();
    galleryTitle.textContent = item.dataset.title;
    galleryCount.textContent = galleryItems.indexOf(item) + 1;
  }
  if (play) {
    playbackStatus.textContent = `Playing ${item.dataset.title}.`;
    video.play().catch(() => {
      playbackStatus.textContent = `Selected ${item.dataset.title}. Use the video controls to start playback.`;
    });
  }
}
function stepVideo(offset, play) {
  const list = shownItems();
  const index = list.indexOf(currentItem);
  const next = list[index === -1 ? 0 : index + offset];
  if (next) selectVideo(next, play);
  return Boolean(next);
}
if (galleryItems.length) {
  galleryItems.forEach(item => item.addEventListener('click', event => {
    event.preventDefault();
    selectVideo(item, true);
    // Bring the player into view when it has scrolled away above the cards.
    const rect = video.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > innerHeight) {
      video.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center'});
    }
  }));
  const stageNav = document.querySelector('.stage-nav');
  stageNav.hidden = false;
  stageNav.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
    stepVideo(Number(button.dataset.step), !video.paused);
  }));
  // Continue with the next run in the current list once one finishes.
  video.addEventListener('ended', () => { stepVideo(1, true); });
  video.addEventListener('play', () => currentItem.classList.add('is-playing'));
  video.addEventListener('pause', () => currentItem.classList.remove('is-playing'));
  video.addEventListener('timeupdate', () => {
    if (video.duration) currentItem.style.setProperty('--played', (video.currentTime / video.duration).toFixed(4));
  });

  const filter = document.querySelector('.gallery-filter');
  filter.hidden = false;
  filter.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    filter.querySelectorAll('button').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    const kind = button.dataset.filter;
    galleryItems.forEach(item => { item.parentElement.hidden = kind !== 'all' && item.parentElement.dataset.kind !== kind; });
  }));
}

// Scroll-linked state: reading progress and the current section in the header.
const progressBar = document.querySelector('.scroll-progress span');
const navLinks = [...document.querySelectorAll('.nav-links a')]
  .map(link => [link, document.querySelector(link.hash)])
  .filter(([, section]) => section);
let scrollQueued = false;
function syncScroll() {
  scrollQueued = false;
  const scrollable = root.scrollHeight - innerHeight;
  progressBar.style.setProperty('--progress', scrollable > 0 ? Math.min(scrollY / scrollable, 1).toFixed(4) : 0);
  let current = null;
  navLinks.forEach(([link, section]) => { if (section.getBoundingClientRect().top <= innerHeight * .4) current = link; });
  // The last section is short, so it becomes current once the page bottom is reached.
  if (scrollable > 0 && scrollY >= scrollable - 2) current = navLinks.at(-1)[0];
  navLinks.forEach(([link]) => link.classList.toggle('is-active', link === current));
}
function queueScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(syncScroll);
}
addEventListener('scroll', queueScroll, {passive: true});
addEventListener('resize', queueScroll);

// The title's walking robot: runs only while the hero is on screen, and holds a still
// frame (robot at its goal) when reduced motion is requested.
const wordmarkArt = document.querySelector('.wordmark-art');
if (wordmarkArt && typeof wordmarkArt.pauseAnimations === 'function') {
  let onScreen = true;
  const syncWordmark = () => {
    if (reducedMotion.matches) {
      wordmarkArt.pauseAnimations();
      wordmarkArt.setCurrentTime(Number(wordmarkArt.dataset.still));
    } else if (onScreen) wordmarkArt.unpauseAnimations();
    else wordmarkArt.pauseAnimations();
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; syncWordmark(); }).observe(wordmarkArt);
  }
  reducedMotion.addEventListener('change', syncWordmark);
  syncWordmark();
}

// Results: tabs show one benchmark table at a time. Arrow keys move between tabs.
const resultTabs = [...document.querySelectorAll('.results-tabs [role="tab"]')];
const resultsTitle = document.querySelector('#results-now');
function selectResult(tab, focus) {
  resultTabs.forEach(other => {
    const selected = other === tab;
    other.setAttribute('aria-selected', String(selected));
    other.tabIndex = selected ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
  });
  resultsTitle.textContent = `${tab.querySelector('strong').textContent} · ${tab.dataset.setting}`;
  // On phones the tabs are a sideways row; keep the chosen one in view.
  tab.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest', inline: 'nearest'});
  if (focus) tab.focus({preventScroll: true});
}
document.querySelectorAll('.table-scroll').forEach(scroller => scroller.addEventListener('scroll', () => {
  scroller.classList.toggle('is-scrolled-end', scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2);
}, {passive: true}));
resultTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectResult(tab, false));
  tab.addEventListener('keydown', event => {
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[event.key];
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? resultTabs.length - 1
      : step ? (index + step + resultTabs.length) % resultTabs.length : null;
    if (target === null) return;
    event.preventDefault();
    selectResult(resultTabs[target], true);
  });
});

// Paper figures open full size in a modal viewer.
const lightbox = document.querySelector('#lightbox');
if (lightbox && typeof lightbox.showModal === 'function') {
  const lightboxImage = lightbox.querySelector('img');
  const lightboxTitle = lightbox.querySelector('#lightbox-title');
  function openFigure(figure) {
    const image = figure.querySelector('.paper-figure');
    const index = document.createElement('b');
    index.textContent = figure.querySelector('.figure-index').textContent;
    lightboxTitle.replaceChildren(index, figure.querySelector('figcaption > span:last-child').textContent);
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightbox.showModal();
  }
  root.classList.add('has-lightbox');
  document.querySelectorAll('.figure-card').forEach(figure => {
    const zoom = figure.querySelector('.figure-zoom');
    zoom.hidden = false;
    zoom.addEventListener('click', () => openFigure(figure));
    figure.querySelector('.paper-figure').addEventListener('click', () => openFigure(figure));
  });
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox || event.target.classList.contains('lightbox-body')) lightbox.close();
  });
}

// Sections enter and leave repeatedly without capturing scroll or changing playback.
const revealDefinitions = [
  ['.section-head, .video-shell, .gallery-list, .figure-card, .results-tabs, .results-window, .citation-block', 'up']
];
revealDefinitions.forEach(([selector, direction]) => {
  document.querySelectorAll(selector).forEach(element => element.dataset.reveal = direction);
});
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      // Separate entry and exit thresholds prevent flicker near viewport edges.
      if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
        entry.target.classList.add('is-visible');
      } else if (!entry.isIntersecting || entry.intersectionRatio <= 0.01) {
        entry.target.classList.remove('is-visible');
        // Leaving over the top slips upward; leaving at the bottom sinks back down.
        entry.target.classList.toggle('is-above', entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0));
      }
    });
  }, { threshold: [0, 0.01, 0.08], rootMargin: '-48px 0px -48px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
  root.classList.add('motion-ready');
  // Keyboard navigation must never focus a visually hidden element.
  document.addEventListener('focusin', event => {
    const target = event.target.closest('[data-reveal]');
    if (target) target.classList.add('is-visible');
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      root.classList.remove('motion-ready');
    }
  });
}

syncScroll();

// Play only the visible short clips; respect reduced motion and the gallery player.
const highlights = [...document.querySelectorAll('.highlight-video')];
const previewToggles = [...document.querySelectorAll('.preview-toggle')];
const visibleHighlights = new Set();
let previewsEnabled = !reducedMotion.matches;
function syncPreviews() {
  highlights.forEach(clip => {
    if (previewsEnabled && visibleHighlights.has(clip) && !document.hidden && video.paused) {
      clip.play().catch(() => {}); // Native controls remain available if autoplay is blocked.
    } else clip.pause();
  });
  previewToggles.forEach(toggle => {
    toggle.querySelector('span').textContent = previewsEnabled ? 'Pause previews' : 'Play previews';
    toggle.querySelector('use').setAttribute('href', 'assets/icons/supernav.svg#' + (previewsEnabled ? 'pause' : 'play'));
    toggle.setAttribute('aria-pressed', String(!previewsEnabled));
  });
}
if (previewToggles.length && 'IntersectionObserver' in window) {
  const clipObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      // The overview peeks below the hero text, so it starts once a sliver is visible.
      const minimum = entry.target.classList.contains('overview-video') ? 0.1 : 0.3;
      if (entry.isIntersecting && entry.intersectionRatio >= minimum) visibleHighlights.add(entry.target);
      else visibleHighlights.delete(entry.target);
    });
    syncPreviews();
  }, {threshold: [0, 0.1, 0.3]});
  highlights.forEach(clip => clipObserver.observe(clip));
  previewToggles.forEach(toggle => {
    toggle.hidden = false;
    toggle.addEventListener('click', () => { previewsEnabled = !previewsEnabled; syncPreviews(); });
  });
  document.addEventListener('visibilitychange', syncPreviews);
  video.addEventListener('play', syncPreviews);
  video.addEventListener('pause', syncPreviews);
  reducedMotion.addEventListener('change', event => { previewsEnabled = !event.matches; syncPreviews(); });
  syncPreviews();
}
