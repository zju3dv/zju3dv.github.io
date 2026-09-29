'use strict';
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const allGalleryPlayers = new Set();
const connection = navigator.connection;
const saveData = () => connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '');

function initGallery(gallery) {
  let video = gallery.querySelector('[data-player]');
  const playbackStatus = gallery.querySelector('[data-playback-status]');
  const videoError = gallery.querySelector('[data-error]');
  const loadingPanel = gallery.querySelector('[data-loading]');
  const loadingProgress = loadingPanel.querySelector('progress');
  const loadingDetail = loadingPanel.querySelector('.loading-detail');
  const galleryItems = [...gallery.querySelectorAll('.gallery-item')];
  const galleryTitle = gallery.querySelector('[data-now]');
  const galleryCount = gallery.querySelector('.stage-count b');
  let currentItem = galleryItems.find(item => item.hasAttribute('aria-current')) ?? galleryItems[0];
  const shownItems = () => galleryItems.filter(item => !item.parentElement.hidden);
  const players = new Map();
  let selection = 0;
  let background = null;
  let warmTimer;
  const warmed = new Set();

  function bufferedFraction(player) {
    if (!Number.isFinite(player.duration) || player.duration <= 0) return null;
    let seconds = 0;
    for (let i = 0; i < player.buffered.length; i++) {
      seconds += player.buffered.end(i) - player.buffered.start(i);
    }
    return Math.min(1, seconds / player.duration);
  }
  function updateLoadingProgress() {
    const fraction = bufferedFraction(video);
    if (fraction === null || !video.buffered.length) {
      loadingProgress.removeAttribute('value');
      loadingDetail.textContent = 'Connecting…';
    } else {
      const percent = Math.floor(fraction * 100);
      loadingProgress.value = percent;
      loadingDetail.textContent = `${percent}% buffered`;
    }
  }
  function showLoading(show) {
    loadingPanel.hidden = !show;
    video.setAttribute('aria-busy', String(show));
    if (show) updateLoadingProgress();
  }

  // Retain each media element so a selection uses its existing native buffer.
  // MP4 Range requests allow playback and seeking before the full file arrives.
  function preparePlayer(item) {
    if (players.has(item)) return players.get(item);
    const player = item === currentItem && !players.size ? video : video.cloneNode(true);
    if (player !== video) {
      player.removeAttribute('id');
      player.removeAttribute('data-player');
      player.removeAttribute('aria-busy');
      player.hidden = true;
      player.preload = 'none';
      player.poster = item.dataset.poster;
      player.querySelector('source').src = item.href;
      player.querySelector('a').href = item.href;
      videoError.before(player);
    }
    // Match each clip's native framing, including the new 4:3 simulation demos.
    player.style.aspectRatio = item.dataset.aspectRatio ?? '16 / 9';
    const fail = () => {
      if (player === video) {
        showLoading(false);
        videoError.hidden = false;
        playbackStatus.textContent = 'Unable to load this video. Try again or open the MP4 directly.';
      }
      if (background?.player === player) finishWarmup();
    };
    player.addEventListener('error', fail);
    player.querySelector('source').addEventListener('error', fail);
    ['progress', 'loadedmetadata', 'durationchange'].forEach(event => player.addEventListener(event, () => {
      if (player === video) updateLoadingProgress();
      if (background?.player === player && bufferedFraction(player) >= .99) finishWarmup();
    }));
    player.addEventListener('suspend', () => {
      // Browsers may finish their chosen preload before buffering the entire file.
      if (background?.player === player && player.readyState >= 2) finishWarmup();
    });
    ['waiting', 'seeking'].forEach(event => player.addEventListener(event, () => {
      if (player !== video) return;
      if (!player.paused || player.seeking) showLoading(true);
      stopWarmup();
    }));
    ['canplay', 'seeked'].forEach(event => player.addEventListener(event, () => {
      if (player !== video) return;
      if (player.readyState >= 3) showLoading(false);
      scheduleWarmup();
    }));
    player.addEventListener('playing', () => {
      if (player !== video) return;
      videoError.hidden = true;
      showLoading(false);
      scheduleWarmup();
    });
    player.addEventListener('play', () => {
      if (player !== video) return;
      allGalleryPlayers.forEach(other => { if (other !== player) other.pause(); });
      item.classList.add('is-playing');
      if (player.readyState < 3) showLoading(true);
      syncPreviews();
    });
    player.addEventListener('pause', () => {
      item.classList.remove('is-playing');
      if (player !== video) return;
      if (!player.seeking) showLoading(false);
      syncPreviews();
      scheduleWarmup();
    });
    player.addEventListener('ended', () => { if (player === video) stepVideo(1, true); });
    player.addEventListener('timeupdate', () => {
      if (player === video && player.duration) item.style.setProperty('--played', (player.currentTime / player.duration).toFixed(4));
    });
    allGalleryPlayers.add(player);
    players.set(item, player);
    return player;
  }

  function stopWarmup() {
    clearTimeout(warmTimer);
    if (!background) return;
    clearTimeout(background.timer);
    // A hint to stop speculative loading; keep the element and its existing buffer.
    if (background.player !== video) background.player.preload = 'none';
    background = null;
  }
  function finishWarmup() {
    if (!background) return;
    warmed.add(background.item);
    stopWarmup();
    scheduleWarmup();
  }
  function scheduleWarmup() {
    clearTimeout(warmTimer);
    warmTimer = setTimeout(warmNext, 1200);
  }
  function warmNext() {
    if (background || document.hidden || saveData() || !loadingPanel.hidden || video.readyState < 3) return;
    // Give an actively playing video enough headroom before sharing bandwidth.
    if (!video.paused) {
      let ahead = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= video.currentTime && video.buffered.end(i) >= video.currentTime) ahead = video.buffered.end(i) - video.currentTime;
      }
      if (ahead < Math.min(10, video.duration - video.currentTime)) { scheduleWarmup(); return; }
    }
    const ordered = [...shownItems(), ...galleryItems];
    const item = ordered.find(item => item !== currentItem && !warmed.has(item));
    if (!item) return;
    const player = preparePlayer(item);
    if (player.error || player.networkState === 3) { warmed.add(item); scheduleWarmup(); return; }
    background = {item, player, timer: setTimeout(finishWarmup, 15000)};
    player.preload = 'auto';
    if (!player.currentSrc) player.load();
  }

  function selectVideo(item, play) {
    const request = ++selection;
    stopWarmup();
    if (item !== currentItem) {
      const next = preparePlayer(item);
      const previous = video;
      previous.pause();
      previous.hidden = true;
      previous.preload = 'none';
      previous.removeAttribute('id');
      previous.removeAttribute('data-player');
      currentItem.removeAttribute('aria-current');
      currentItem.classList.remove('is-playing');
      currentItem.style.removeProperty('--played');
      currentItem = item;
      video = next;
      video.id = `${gallery.id}-player`;
      video.setAttribute('data-player', '');
      video.hidden = false;
      video.volume = previous.volume;
      video.muted = previous.muted;
      video.playbackRate = previous.playbackRate;
      if (video.readyState >= 1) video.currentTime = 0;
      item.setAttribute('aria-current', 'true');
      galleryTitle.textContent = item.dataset.title;
      galleryCount.textContent = galleryItems.indexOf(item) + 1;
    }
    videoError.hidden = true;
    videoError.querySelector('a').href = item.href;
    video.preload = 'auto';
    if (video.error || video.networkState === 3) video.load();
    showLoading(play && video.readyState < 3);
    if (play) {
      const selectedPlayer = video;
      playbackStatus.textContent = `Loading ${item.dataset.title}.`;
      selectedPlayer.play().then(() => {
        if (request === selection) playbackStatus.textContent = `Playing ${item.dataset.title}.`;
      }).catch(() => {
        if (request !== selection) return;
        showLoading(false);
        playbackStatus.textContent = `Selected ${item.dataset.title}. Use the video controls to start playback.`;
      });
    }
    scheduleWarmup();
  }
  function stepVideo(offset, play) {
    const list = shownItems();
    const index = list.indexOf(currentItem);
    const next = list[index === -1 ? 0 : index + offset];
    if (next) selectVideo(next, play);
    return Boolean(next);
  }
  if (galleryItems.length) {
    preparePlayer(currentItem);
    video.preload = saveData() ? 'none' : 'auto';
    galleryItems.forEach(item => {
      let start = null;
      let dragged = false;
      item.addEventListener('pointerdown', event => {
        start = {x: event.clientX, y: event.clientY};
        dragged = false;
      }, {passive: true});
      item.addEventListener('pointermove', event => {
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) dragged = true;
      }, {passive: true});
      item.addEventListener('pointercancel', () => { start = null; dragged = true; }, {passive: true});
      item.addEventListener('pointerup', () => { start = null; }, {passive: true});
      item.addEventListener('click', event => {
        event.preventDefault();
        // Preserve native swiping; keyboard activation has detail === 0.
        if (event.detail !== 0 && dragged) return;
        selectVideo(item, true);
        const rect = video.getBoundingClientRect();
        const desktopPointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (desktopPointer && (rect.top < 0 || rect.bottom > innerHeight)) {
          video.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center'});
        }
      });
    });
    gallery.querySelector('[data-retry]').addEventListener('click', () => selectVideo(currentItem, true));
    const stageNav = gallery.querySelector('.stage-nav');
    stageNav.hidden = false;
    stageNav.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => stepVideo(Number(button.dataset.step), !video.paused)));
    const filter = gallery.querySelector('.gallery-filter');
    if (filter) {
    filter.hidden = false;
    filter.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      filter.querySelectorAll('button').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      galleryItems.forEach(item => { item.parentElement.hidden = button.dataset.filter !== 'all' && item.parentElement.dataset.task !== button.dataset.filter; });
      if (currentItem.parentElement.hidden && shownItems().length) selectVideo(shownItems()[0], false);
    }));
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopWarmup();
      else scheduleWarmup();
    });
    connection?.addEventListener?.('change', () => { stopWarmup(); scheduleWarmup(); });
    scheduleWarmup();
  }

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
    if (previewsEnabled && visibleHighlights.has(clip) && !document.hidden && [...allGalleryPlayers].every(player => player.paused)) {
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
  reducedMotion.addEventListener('change', event => { previewsEnabled = !event.matches; syncPreviews(); });
  syncPreviews();
}

// Each demo section owns its playlist and player; only one demo plays at a time.
document.querySelectorAll('[data-gallery]').forEach(initGallery);
