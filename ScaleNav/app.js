const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const modal = $('#media-dialog');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let manualPause = reducedMotion.matches;
let lastFocus;
let expandedVideo;
const individuallyPaused = new WeakSet();

function playVisibleVideos() {
  $$('.demo-video').forEach(video => {
    if (!manualPause && !modal.open && !document.hidden && video.dataset.inView === 'true' && !individuallyPaused.has(video) && !video.closest('[hidden]')) video.play().catch(() => {});
    else video.pause();
  });
}
function openMedia(title, description, kind, src, origin) {
  lastFocus = document.activeElement;
  expandedVideo = origin;
  $('#dialog-title').textContent = title;
  $('#dialog-description').textContent = description;
  const el = document.createElement(kind);
  el.src = src;
  if (kind === 'video') {
    el.controls = true;
    el.playsInline = true;
    el.autoplay = true;
    el.preload = 'metadata';
    el.muted = true;
    if (origin) el.addEventListener('loadedmetadata', () => { el.currentTime = origin.currentTime; }, {once: true});
  } else el.alt = description;
  $('#dialog-content').replaceChildren(el);
  modal.showModal();
  playVisibleVideos();
  document.body.classList.add('modal-open');
  $('.dialog-close').focus();
}
function closeMedia() { modal.close(); }
$('.dialog-close').addEventListener('click', closeMedia);
modal.addEventListener('click', e => {
  if (e.target !== modal) return;
  const r = modal.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeMedia();
});
modal.addEventListener('close', () => {
  const video = $('#dialog-content video');
  if (expandedVideo && video && Number.isFinite(video.currentTime)) expandedVideo.currentTime = video.currentTime;
  expandedVideo = null;
  $('#dialog-content').replaceChildren();
  document.body.classList.remove('modal-open');
  lastFocus?.focus({preventScroll: true});
  playVisibleVideos();
});
$$('[data-full-demo]').forEach(b => b.addEventListener('click', () => openMedia('ScaleNav — the complete demonstration', 'Real-world quadruped navigation, HabitatGS-LN, and Short-Horizon OVON.', 'video', 'assets/scalenav-demo.mp4')));
$$('[data-figure]').forEach(b => b.addEventListener('click', () => openMedia(b.dataset.figureTitle, b.dataset.caption, 'img', b.dataset.figure)));

const videoObserver = new IntersectionObserver(entries => {
  entries.forEach(({target: video, isIntersecting}) => {
    const visible = isIntersecting && !video.closest('[hidden]');
    video.dataset.inView = String(visible);
    if (visible && !video.getAttribute('src')) video.src = video.dataset.src;
  });
  playVisibleVideos();
}, {threshold: .15});
function updateMotion() {
  $('#motion-toggle').textContent = manualPause ? 'Play videos ▷' : 'Pause videos Ⅱ';
  $('#motion-toggle').setAttribute('aria-pressed', String(manualPause));
  playVisibleVideos();
}
$('#motion-toggle').addEventListener('click', () => {
  manualPause = !manualPause;
  if (!manualPause) $$('.demo-video').forEach(v => individuallyPaused.delete(v));
  updateMotion();
});
reducedMotion.addEventListener('change', e => { manualPause = e.matches; updateMotion(); });
document.addEventListener('visibilitychange', playVisibleVideos);
updateMotion();

const groups = [
  {domain: 'Real robot', id: 'real-robot', title: 'Real-world navigation'},
  {id: 'simulation', title: 'Simulated navigation', benchmarks: [
    {domain: 'Habitat-GS', id: 'habitat-gs', title: 'HabitatGS-LN'},
    {domain: 'HM3D', id: 'short-horizon-ovon', title: 'Short-Horizon OVON'}
  ]}
];
function createDemoCard(d, index, total, headingTag) {
  const card = document.createElement('article');
  card.className = 'demo-card';
  card.dataset.demoId = d.id;
  card.id = `${d.id}-slide`;
  card.setAttribute('role', 'group');
  card.setAttribute('aria-roledescription', 'slide');
  card.setAttribute('aria-label', `${index + 1} of ${total}: ${d.title}`);
  const media = document.createElement('div');
  media.className = 'demo-media';
  const video = document.createElement('video');
  video.className = 'demo-video';
  video.dataset.src = d.video;
  video.poster = d.poster;
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = true;
  video.preload = 'none';
  video.setAttribute('aria-label', `${d.title} — edited demonstration`);
  video.addEventListener('pause', () => {
    if (video.dataset.inView === 'true' && !manualPause && !modal.open && !document.hidden) individuallyPaused.add(video);
  });
  video.addEventListener('play', () => individuallyPaused.delete(video));
  media.append(video);
  const info = document.createElement('div');
  info.className = 'demo-info';
  const counter = document.createElement('span');
  counter.className = 'demo-counter';
  counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  counter.setAttribute('aria-label', `Video ${index + 1} of ${total}`);
  const title = document.createElement(headingTag);
  title.className = 'demo-title';
  title.textContent = d.title;
  const instruction = document.createElement('p');
  instruction.className = 'sr-only';
  instruction.id = `${d.id}-instruction`;
  video.setAttribute('aria-describedby', instruction.id);
  instruction.textContent = '“' + d.instruction.charAt(0).toUpperCase() + d.instruction.slice(1) + '”';
  const expand = document.createElement('button');
  expand.className = 'demo-expand';
  expand.textContent = 'Expand ↗';
  expand.setAttribute('aria-label', `Expand ${d.title} demonstration`);
  expand.addEventListener('click', () => openMedia(d.title, d.instruction, 'video', d.video, video));
  info.append(counter, title, instruction, expand);
  card.append(media, info);
  videoObserver.observe(video);
  return card;
}
function createCarousel(items, group) {
  const carousel = document.createElement('div');
  carousel.className = 'demo-carousel';
  const stage = document.createElement('div');
  stage.className = 'carousel-stage';
  const cards = items.map((d, i) => {
    const card = createDemoCard(d, i, items.length, group.cardHeading || 'h4');
    card.hidden = true;
    stage.append(card);
    return card;
  });
  const makeArrow = (direction, name, path) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `carousel-arrow carousel-${direction}`;
    button.setAttribute('aria-label', `${name} video in ${group.title}`);
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
    return button;
  };
  const previous = makeArrow('previous', 'Previous', 'm14 5-7 7 7 7');
  const next = makeArrow('next', 'Next', 'm10 5 7 7-7 7');
  const controls = document.createElement('div');
  controls.className = 'carousel-controls';
  controls.append(previous, next);
  const thumbnails = document.createElement('div');
  thumbnails.className = 'carousel-thumbnails';
  thumbnails.setAttribute('role', 'group');
  thumbnails.setAttribute('aria-label', `Choose a ${group.title} demonstration`);
  const status = document.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  let activeIndex = -1;
  const choices = items.map((d, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'carousel-thumbnail';
    button.setAttribute('aria-label', `Show video ${i + 1} of ${items.length}: ${d.title}`);
    button.setAttribute('aria-controls', `${d.id}-slide`);
    button.setAttribute('aria-pressed', 'false');
    const image = document.createElement('img');
    image.src = d.poster;
    image.alt = '';
    image.loading = 'lazy';
    image.width = 160;
    image.height = 90;
    const text = document.createElement('span');
    text.className = 'thumbnail-caption';
    const title = document.createElement('span');
    title.className = 'thumbnail-title';
    title.textContent = d.title;
    text.append(title);
    button.append(image, text);
    button.addEventListener('click', () => select(i));
    thumbnails.append(button);
    return button;
  });
  function select(requestedIndex, announce = true) {
    const index = (requestedIndex + items.length) % items.length;
    if (index === activeIndex) return;
    cards.forEach((card, i) => {
      const video = card.querySelector('video');
      if (i !== index) {
        video.dataset.inView = 'false';
        video.pause();
      }
      card.hidden = i !== index;
      choices[i].classList.toggle('is-active', i === index);
      choices[i].setAttribute('aria-pressed', String(i === index));
    });
    const video = cards[index].querySelector('video');
    if (video.readyState > 0) video.currentTime = 0;
    individuallyPaused.delete(video);
    activeIndex = index;
    carousel.dataset.activeIndex = String(index);
    if (announce) status.textContent = `Video ${index + 1} of ${items.length}: ${items[index].title}`;
    playVisibleVideos();
  }
  previous.addEventListener('click', () => select(activeIndex - 1));
  next.addEventListener('click', () => select(activeIndex + 1));
  carousel.addEventListener('keydown', e => {
    // Leave native video seeking keys intact.
    const control = e.target.closest('.carousel-thumbnail, .carousel-arrow');
    if (!control) return;
    const index = {ArrowLeft: activeIndex - 1, ArrowRight: activeIndex + 1, Home: 0, End: items.length - 1}[e.key];
    if (index === undefined) return;
    e.preventDefault();
    select(index);
    if (control.classList.contains('carousel-thumbnail')) choices[activeIndex].focus({preventScroll: true});
  });
  carousel.append(controls, stage, thumbnails, status);
  select(0, false);
  return carousel;
}

function renderDemos(demos) {
  const container = $('#demo-groups');
  container.replaceChildren();
  groups.forEach(group => {
    const section = document.createElement('section');
    section.className = 'demo-group';
    section.id = group.id;
    section.setAttribute('aria-labelledby', `${group.id}-title`);
    const heading = document.createElement('div');
    heading.className = 'demo-group-heading';
    const title = document.createElement('h3');
    title.id = `${group.id}-title`;
    title.textContent = group.title;
    heading.append(title);
    section.append(heading);
    if (group.benchmarks) {
      heading.classList.add('simulation-heading');
      const description = document.createElement('p');
      description.textContent = 'ScaleNav on two simulation benchmarks.';
      heading.append(description);
      const tablist = document.createElement('div');
      tablist.className = 'benchmark-tabs';
      tablist.setAttribute('role', 'tablist');
      tablist.setAttribute('aria-label', 'Simulation benchmark');
      section.append(tablist);
      const tabs = [];
      const panels = [];
      group.benchmarks.forEach((benchmark, index) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'benchmark-tab';
        tab.id = `${benchmark.id}-tab`;
        tab.textContent = benchmark.title;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', benchmark.id);
        tab.addEventListener('click', () => selectBenchmark(index));
        tablist.append(tab);
        tabs.push(tab);
        const subsection = document.createElement('section');
        subsection.id = benchmark.id;
        subsection.className = 'demo-benchmark';
        subsection.setAttribute('role', 'tabpanel');
        subsection.setAttribute('aria-labelledby', tab.id);
        subsection.tabIndex = 0;
        subsection.hidden = index !== 0;
        subsection.append(createCarousel(demos.filter(d => d.domain === benchmark.domain), benchmark));
        panels.push(subsection);
        section.append(subsection);
      });
      function selectBenchmark(index) {
        tabs.forEach((tab, i) => {
          const selected = i === index;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          panels[i].hidden = !selected;
          if (!selected) panels[i].querySelectorAll('video').forEach(video => {
            video.dataset.inView = 'false';
            video.pause();
          });
        });
        playVisibleVideos();
      }
      tablist.addEventListener('keydown', e => {
        const index = tabs.indexOf(e.target);
        if (index === -1) return;
        const next = {ArrowLeft: (index + tabs.length - 1) % tabs.length, ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1}[e.key];
        if (next === undefined) return;
        e.preventDefault();
        selectBenchmark(next);
        tabs[next].focus({preventScroll: true});
      });
      selectBenchmark(0);
    } else {
      section.setAttribute('aria-roledescription', 'carousel');
      section.append(createCarousel(demos.filter(d => d.domain === group.domain), group));
    }
    container.append(section);
  });
  container.setAttribute('aria-busy', 'false');
  prepareReveals(container.querySelectorAll('.demo-group'));
}
fetch('assets/demos.json').then(r => {
  if (!r.ok) throw new Error('Demo index unavailable');
  return r.json();
}).then(renderDemos).catch(() => {
  $('#demo-groups').setAttribute('aria-busy', 'false');
  $('#demo-groups').innerHTML = '<p>The gallery could not load. <a href="assets/scalenav-demo.mp4">Watch the full demonstration.</a></p>';
});

const sectionLinks = $$('.header nav a');
const sectionAnchors = sectionLinks.map(link => document.querySelector(link.getAttribute('href')));
let navigationFrame;
function updateNavigation() {
  navigationFrame = undefined;
  const scrollRange = document.documentElement.scrollHeight - innerHeight;
  $('.reading-progress').style.transform = `scaleX(${scrollRange > 0 ? Math.min(1, scrollY / scrollRange) : 0})`;
  const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  let active = null;
  sectionAnchors.forEach((section, index) => {
    if (!section || section.id === 'resources') return;
    const anchorLine = scrollPadding + (parseFloat(getComputedStyle(section).scrollMarginTop) || 0) + 2;
    if (section.getBoundingClientRect().top <= anchorLine) active = sectionLinks[index];
  });
  sectionLinks.forEach(link => {
    if (link === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (navigationFrame === undefined) navigationFrame = requestAnimationFrame(updateNavigation);
}, {passive: true});
window.addEventListener('resize', updateNavigation);
updateNavigation();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(({target, isIntersecting}) => {
    if (!isIntersecting) return;
    target.dataset.reveal = 'visible';
    revealObserver.unobserve(target);
  });
}, {rootMargin: '0px 0px -35px 0px', threshold: 0});
function prepareReveals(elements) {
  if (reducedMotion.matches) return;
  elements.forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight - 35) return;
    element.dataset.reveal = 'pending';
    revealObserver.observe(element);
  });
}
prepareReveals($$('.section-heading, .overview-copy, .paper-figure, .stages, .result-metrics'));
reducedMotion.addEventListener('change', event => {
  if (event.matches) $$('[data-reveal]').forEach(element => {
    element.dataset.reveal = 'visible';
    revealObserver.unobserve(element);
  });
});
