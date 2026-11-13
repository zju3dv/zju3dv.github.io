const topbar = document.querySelector("[data-topbar]");
const hero = document.querySelector("[data-topbar-trigger]");
const sections = [...document.querySelectorAll("main section[id], main .hero-demo[id]")];
const navLinks = [...document.querySelectorAll(".topbar__link")];

let frameRequested = false;

function updateTopbar() {
  if (!topbar || !hero) return;
  const pinAt = Math.min(180, window.innerHeight * 0.2);
  const pinned = hero.getBoundingClientRect().bottom <= pinAt;
  topbar.classList.toggle("is-pinned", pinned);
  topbar.querySelector(".topbar__pill").inert = !pinned;
}

function updateActiveSection() {
  if (sections.length === 0) return;

  const anchor = Math.min(window.innerHeight * 0.38, 320);
  let active = sections[0];

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= anchor) active = section;
  }

  for (const link of navLinks) {
    const isActive = link.getAttribute("href") === `#${active.id}`;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

function updatePageChrome() {
  frameRequested = false;
  updateTopbar();
  updateActiveSection();
}

function requestChromeUpdate() {
  if (frameRequested) return;
  frameRequested = true;
  window.requestAnimationFrame(updatePageChrome);
}

function setupResultsGallery() {
  const gallery = document.querySelector("[data-results-gallery]");
  if (!gallery) return;

  const pages = [...gallery.querySelectorAll(".gallery-page")];
  const tabs = [...gallery.querySelectorAll('[role="tab"]')];
  const previous = gallery.querySelector("[data-gallery-previous]");
  const next = gallery.querySelector("[data-gallery-next]");
  const syncToggle = gallery.querySelector("[data-gallery-sync]");
  const videos = [...gallery.querySelectorAll("video")];
  const state = new Map(videos.map(video => [video, {
    expectedPlaying: false, wantsPlay: true, seekTarget: null, ready: null
  }]));
  let currentPage = 0;
  let synchronized = syncToggle.checked;
  let groupPlaying = true;
  let visible = !("IntersectionObserver" in window);
  let needsRestart = true;
  let restarting = false;
  let revision = 0;
  let frame = 0;
  let leader = videos[0];

  const activeVideos = () => [...pages[currentPage].querySelectorAll("video")];
  const canWatch = () => visible && !document.hidden;

  function setPlaying(video, playing) {
    state.get(video).expectedPlaying = playing;
    if (playing && video.paused) {
      video.play().catch(() => {
        if (!video.paused || !state.get(video).expectedPlaying) return;
        state.get(video).expectedPlaying = false;
        if (synchronized && activeVideos().includes(video)) {
          groupPlaying = false;
          applyPlayback();
        }
      });
    } else if (!playing && !video.paused) video.pause();
  }

  function seek(video, time) {
    if (!Number.isFinite(video.duration) || Math.abs(video.currentTime - time) < .01) return;
    state.get(video).seekTarget = time;
    video.currentTime = time;
  }

  function alignTo(source) {
    if (!Number.isFinite(source.duration) || source.duration <= 0) return;
    leader = source;
    const progress = source.currentTime / source.duration;
    for (const video of activeVideos()) {
      if (video !== source) seek(video, progress * video.duration);
    }
  }

  function correctDrift() {
    frame = 0;
    const group = activeVideos();
    if (!synchronized || !groupPlaying || !canWatch() || restarting || needsRestart
      || group.some(video => video.seeking || video.readyState < 3)) return;
    const progress = leader.currentTime / leader.duration;
    for (const video of group) {
      if (video === leader) continue;
      // Compare circular progress so a normal loop boundary is not a large jump.
      const difference = ((video.currentTime / video.duration - progress + 1.5) % 1) - .5;
      if (Math.abs(difference * video.duration) > .08) seek(video, progress * video.duration);
    }
    frame = window.requestAnimationFrame(correctDrift);
  }

  function ready(video) {
    if (video.readyState >= 3) return Promise.resolve();
    const media = state.get(video);
    if (!media.ready) media.ready = new Promise((resolve, reject) => {
      function cleanup() {
        video.removeEventListener("canplay", loaded);
        video.removeEventListener("error", failed);
      }
      function loaded() { cleanup(); resolve(); }
      function failed() { cleanup(); reject(video.error); }
      video.addEventListener("canplay", loaded);
      video.addEventListener("error", failed);
      video.preload = "auto";
      if (video.error) failed();
      else if (video.readyState === 0 && video.networkState !== 2) video.load();
    });
    return media.ready;
  }

  async function restartGroup() {
    const token = ++revision;
    const group = activeVideos();
    restarting = true;
    for (const video of group) setPlaying(video, false);
    try {
      await Promise.all(group.map(ready));
      if (token !== revision) return;
      await Promise.all(group.map(video => {
        video.playbackRate = 1;
        seek(video, 0);
        if (!video.seeking) return Promise.resolve();
        return new Promise(resolve => video.addEventListener("seeked", resolve, { once: true }));
      }));
      if (token !== revision) return;
      leader = group[0];
      needsRestart = false;
    } catch {
      if (token !== revision) return;
      groupPlaying = false;
      needsRestart = false;
    } finally {
      if (token === revision) {
        restarting = false;
        applyPlayback();
      }
    }
  }

  function applyPlayback() {
    const group = activeVideos();
    if (synchronized && needsRestart && canWatch() && groupPlaying) {
      if (!restarting) restartGroup();
      return;
    }
    const runGroup = groupPlaying && !restarting
      && group.every(video => video.readyState >= 3 && !video.seeking);
    for (const video of group) {
      setPlaying(video, canWatch() && (synchronized ? runGroup : state.get(video).wantsPlay));
    }
    if (synchronized && canWatch() && runGroup) {
      if (!frame) frame = window.requestAnimationFrame(correctDrift);
    } else {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  for (const video of videos) {
    video.muted = true;
    for (const event of ["play", "pause"]) video.addEventListener(event, () => {
      if ((event === "play") === video.paused) return;
      const playing = !video.paused;
      const media = state.get(video);
      if (media.expectedPlaying === playing) return;
      media.expectedPlaying = playing;
      if (!activeVideos().includes(video)) {
        setPlaying(video, false);
        return;
      }
      media.wantsPlay = playing;
      if (synchronized) {
        groupPlaying = playing;
        for (const peer of activeVideos()) state.get(peer).wantsPlay = playing;
        if (playing && !needsRestart && !restarting) alignTo(video);
      }
      applyPlayback();
    });
    video.addEventListener("seeking", () => {
      const media = state.get(video);
      if (media.seekTarget !== null && Math.abs(video.currentTime - media.seekTarget) < .02) return;
      media.seekTarget = null;
      if (synchronized && !needsRestart && !restarting && activeVideos().includes(video)) {
        alignTo(video);
        applyPlayback();
      }
    });
    video.addEventListener("seeked", () => {
      state.get(video).seekTarget = null;
      if (activeVideos().includes(video)) applyPlayback();
    });
    for (const event of ["canplay", "waiting"]) video.addEventListener(event, () => {
      if (activeVideos().includes(video)) applyPlayback();
    });
    video.addEventListener("ratechange", () => {
      if (!synchronized || !activeVideos().includes(video)) return;
      for (const peer of activeVideos()) {
        if (peer.playbackRate !== video.playbackRate) peer.playbackRate = video.playbackRate;
      }
    });
  }

  syncToggle.addEventListener("change", () => {
    revision += 1;
    restarting = false;
    synchronized = syncToggle.checked;
    needsRestart = synchronized;
    if (synchronized) {
      groupPlaying = true;
      for (const video of activeVideos()) {
        state.get(video).wantsPlay = true;
        setPlaying(video, false);
      }
    } else {
      for (const video of activeVideos()) state.get(video).wantsPlay = groupPlaying;
    }
    applyPlayback();
  });

  function showPage(index) {
    if (index < 0 || index >= pages.length || index === currentPage) return;
    revision += 1;
    restarting = false;
    for (const video of activeVideos()) setPlaying(video, false);
    currentPage = index;
    leader = activeVideos()[0];
    groupPlaying = true;
    needsRestart = synchronized;
    visible = !("IntersectionObserver" in window);
    for (const [pageIndex, page] of pages.entries()) {
      const active = pageIndex === index;
      page.hidden = !active;
      tabs[pageIndex].setAttribute("aria-selected", String(active));
      tabs[pageIndex].tabIndex = active ? 0 : -1;
    }
    previous.disabled = index === 0;
    next.disabled = index === pages.length - 1;
    applyPlayback();
  }

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => showPage(index));
    tab.addEventListener("keydown", (event) => {
      let target;
      if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") target = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = tabs.length - 1;
      else return;
      event.preventDefault();
      showPage(target);
      tabs[target].focus();
    });
  }
  previous.addEventListener("click", () => showPage(currentPage - 1));
  next.addEventListener("click", () => showPage(currentPage + 1));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target !== pages[currentPage]) continue;
        visible = entry.isIntersecting && entry.intersectionRatio >= .35;
        if (!visible) {
          revision += 1;
          restarting = false;
        }
        applyPlayback();
      }
    }, { threshold: [0, .35] });
    for (const page of pages) observer.observe(page);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      revision += 1;
      restarting = false;
    }
    applyPlayback();
  });
  applyPlayback();
}

window.addEventListener("scroll", requestChromeUpdate, { passive: true });
window.addEventListener("resize", requestChromeUpdate);

setupResultsGallery();
updatePageChrome();

const demoVideo = document.querySelector("#demo-video");
const demoToggle = document.querySelector("[data-demo-toggle]");
function updateDemoPlayback() {
  if (demoToggle && demoVideo) demoToggle.textContent = demoVideo.paused ? "Play demo" : "Pause demo";
}
demoToggle?.addEventListener("click", () => {
  if (!demoVideo) return;
  if (demoVideo.paused) demoVideo.play().catch(updateDemoPlayback);
  else demoVideo.pause();
});
for (const event of ["play", "pause", "ended"]) demoVideo?.addEventListener(event, updateDemoPlayback);

const citationCopy = document.querySelector("[data-copy-citation]");
const citationCode = document.querySelector("#citation-bibtex");
const citationLabel = document.querySelector("[data-copy-label]");
let citationReset;

citationCopy?.addEventListener("click", async () => {
  if (!citationCode || !citationLabel) return;
  window.clearTimeout(citationReset);
  citationCopy.disabled = true;
  let copied = false;

  try {
    await navigator.clipboard.writeText(citationCode.textContent.trim());
    copied = true;
  } catch {
    const range = document.createRange();
    range.selectNodeContents(citationCode);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    if (copied) selection?.removeAllRanges();
  } finally {
    citationCopy.disabled = false;
  }

  citationCopy.dataset.state = copied ? "copied" : "selected";
  const modifier = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";
  citationLabel.textContent = copied ? "Copied" : `Press ${modifier}C`;
  citationCopy.setAttribute("aria-label", copied ? "BibTeX copied" : "Copy the selected BibTeX citation using your keyboard");

  if (copied) {
    citationReset = window.setTimeout(() => {
      delete citationCopy.dataset.state;
      citationLabel.textContent = "Copy";
      citationCopy.setAttribute("aria-label", "Copy BibTeX");
    }, 2500);
  }
});
