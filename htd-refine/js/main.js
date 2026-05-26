const pageLinksConfig = {
  authors: {
    "Dingkun Wei": "https://kune1008.github.io/",
    "Zehong Shen": "https://zehongs.github.io/",
    "Yan Xia": "https://scholar.isshikih.top/",
    "Georgios Pavlakos": "https://geopavlakos.github.io/",
    "Yujun Shen": "https://shenyujun.github.io/",
    "Xiaowei Zhou": "https://www.xzhou.me/"
  },
  buttons: {
    arxiv: "#",
    citation: "#citation",
    code: "#"
  },
  videos: {
    qualitative: [
      { src: "assets/1_demo_pamela_comparison_all_gvhmr.mp4", title: "Qualitative result 1", category: "web" },
      { src: "assets/2_demo_P6_49_outdoor_big_stairs_down_split3.mp4", title: "Qualitative result 2", category: "emdb" },
      { src: "assets/3_demo_climbing_comparison_all_gvhmr.mp4", title: "Qualitative result 3", category: "web" },
      { src: "assets/4_demo_P9_80_outdoor_walk_big_circle_split5.mp4", title: "Qualitative result 4", category: "emdb" },
      { src: "assets/5_demo_machine_comparison_all_gvhmr.mp4", title: "Qualitative result 5", category: "web" },
      { src: "assets/6_demo_P8_64_outdoor_skateboard_split0.mp4", title: "Qualitative result 6", category: "emdb" }
    ]
  }
};

const primaryVideoElement = document.getElementById("qualitative-video-primary");
const secondaryVideoElement = document.getElementById("qualitative-video-secondary");
const qualitativeVideoElements = [primaryVideoElement, secondaryVideoElement];
const videoLoading = document.getElementById("video-loading");
const videoDots = document.getElementById("video-dots");
const videoPrev = document.getElementById("video-prev");
const videoNext = document.getElementById("video-next");
const videoPrevHover = document.getElementById("video-prev-hover");
const videoNextHover = document.getElementById("video-next-hover");
const videoPlayToggle = document.getElementById("video-play-toggle");
const videoSpeedToggle = document.getElementById("video-speed-toggle");
const videoProgress = document.getElementById("video-progress");
const videoRestart = document.getElementById("video-restart");
const videoFilterWeb = document.getElementById("video-filter-web");
const videoFilterEmdb = document.getElementById("video-filter-emdb");
const videoEmpty = document.getElementById("video-empty");
const videoInteractionArea = document.querySelector(".video-interaction-area");
const abstractVideo = document.getElementById("abstract-video");
const abstractVideoPlayToggle = document.getElementById("abstract-video-play-toggle");
const abstractVideoSpeedToggle = document.getElementById("abstract-video-speed-toggle");
const abstractVideoProgress = document.getElementById("abstract-video-progress");
const abstractVideoRestart = document.getElementById("abstract-video-restart");
const citationButton = document.getElementById("hero-citation-copy");
const citationButtonLabel = document.getElementById("hero-citation-copy-label");
const citationCodeBlock = document.querySelector("#citation pre");
const sideNav = document.querySelector(".side-nav");
const navLinks = Array.from(document.querySelectorAll(".side-nav a"));
const backgroundVideoPreloads = [];
const readyVideoSources = new Set();

let allQualitativeVideos = [];
let qualitativeVideos = pageLinksConfig.videos.qualitative;
let currentVideoIndex = 0;
const videoFilters = { web: true, emdb: true };
const speedOptions = [0.5, 1, 2];
let videoSwitchToken = 0;
let activeQualitativeVideoLayerIndex = 0;
let pendingVideoLoadCleanup = null;
let videoLoadingTimer = null;

function setActiveNav(hash) {
  const shouldHideNav = hash === "#top";
  if (sideNav) {
    sideNav.classList.toggle("is-hidden", shouldHideNav);
  }
  navLinks.forEach((link) => {
    link.classList.toggle("active", !shouldHideNav && link.getAttribute("href") === hash);
  });
}

function getActiveVideoElement() {
  return qualitativeVideoElements[activeQualitativeVideoLayerIndex];
}

function getInactiveVideoElement() {
  return qualitativeVideoElements[(activeQualitativeVideoLayerIndex + 1) % qualitativeVideoElements.length];
}

function getVideoSource(video) {
  return video ? video.dataset.src || "" : "";
}

function setVideoSource(video, src) {
  if (!video || !src || getVideoSource(video) === src) {
    return;
  }
  video.dataset.src = src;
  video.src = src;
}

function markVideoSourceReady(src) {
  if (src) {
    readyVideoSources.add(src);
  }
}

function clearVideoLoadingTimer() {
  if (videoLoadingTimer) {
    window.clearTimeout(videoLoadingTimer);
    videoLoadingTimer = null;
  }
}

function syncVideoControlLabels() {
  const activeVideoElement = getActiveVideoElement();
  videoPlayToggle.textContent = activeVideoElement.paused ? "Play" : "Pause";
  videoSpeedToggle.textContent = "Speed: " + activeVideoElement.playbackRate + "x";
  videoPlayToggle.classList.toggle("is-active", activeVideoElement.paused);
  videoSpeedToggle.classList.remove("is-active");
}

function syncVideoProgress() {
  const activeVideoElement = getActiveVideoElement();
  if (!Number.isFinite(activeVideoElement.duration) || activeVideoElement.duration <= 0) {
    videoProgress.value = 0;
    return;
  }
  videoProgress.value = (activeVideoElement.currentTime / activeVideoElement.duration) * 100;
}

function finalizeVideoSwitch(nextVideoElement, currentToken) {
  if (currentToken !== videoSwitchToken) {
    return;
  }

  const previousVideoElement = getActiveVideoElement();
  const shouldResumePlayback = !previousVideoElement.paused;

  nextVideoElement.playbackRate = previousVideoElement.playbackRate;
  if (shouldResumePlayback) {
    const playPromise = nextVideoElement.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } else {
    nextVideoElement.pause();
  }

  nextVideoElement.classList.add("is-active");
  previousVideoElement.classList.remove("is-active");
  previousVideoElement.pause();
  previousVideoElement.currentTime = 0;
  activeQualitativeVideoLayerIndex = qualitativeVideoElements.indexOf(nextVideoElement);
  clearVideoLoadingTimer();
  setLoading(false);
  syncVideoControlLabels();
  syncVideoProgress();
}

function setupRefineRowDeltas() {
  const refineRows = Array.from(document.querySelectorAll(".results-table tbody tr.refine-row"));
  refineRows.forEach((row) => {
    const baselineRow = row.previousElementSibling;
    if (!baselineRow) {
      return;
    }

    const baselineCells = Array.from(baselineRow.querySelectorAll("td"));
    const refineCells = Array.from(row.querySelectorAll("td"));

    for (let cellIndex = 1; cellIndex < refineCells.length; cellIndex += 1) {
      const baselineValue = Number.parseFloat(baselineCells[cellIndex]?.textContent.trim());
      const refineValue = Number.parseFloat(refineCells[cellIndex]?.textContent.trim());

      if (!Number.isFinite(baselineValue) || !Number.isFinite(refineValue) || baselineValue === 0) {
        continue;
      }

      const percent = ((baselineValue - refineValue) / baselineValue) * 100;
      const delta = document.createElement("span");
      delta.className = "metric-delta";

      if (Math.abs(percent) < 0.05) {
        delta.classList.add("neutral");
        delta.textContent = " 0.0%=";
      } else if (percent > 0) {
        delta.classList.add("better");
        delta.textContent = " " + percent.toFixed(1) + "%↓";
      } else {
        delta.classList.add("worse");
        delta.textContent = " " + Math.abs(percent).toFixed(1) + "%↑";
      }

      refineCells[cellIndex].appendChild(delta);
    }
  });
}

function syncAbstractVideoControlLabels() {
  if (!abstractVideo || !abstractVideoPlayToggle || !abstractVideoSpeedToggle) {
    return;
  }
  abstractVideoPlayToggle.textContent = abstractVideo.paused ? "Play" : "Pause";
  abstractVideoSpeedToggle.textContent = "Speed: " + abstractVideo.playbackRate + "x";
  abstractVideoPlayToggle.classList.toggle("is-active", abstractVideo.paused);
  abstractVideoSpeedToggle.classList.remove("is-active");
}

function syncAbstractVideoProgress() {
  if (!abstractVideo || !abstractVideoProgress) {
    return;
  }
  if (!Number.isFinite(abstractVideo.duration) || abstractVideo.duration <= 0) {
    abstractVideoProgress.value = 0;
    return;
  }
  abstractVideoProgress.value = (abstractVideo.currentTime / abstractVideo.duration) * 100;
}

function setLoading(isLoading, failed = false) {
  if (failed) {
    videoLoading.innerHTML = '<div class="spinner" aria-hidden="true"></div><div>Video failed to load</div>';
    videoLoading.classList.remove("hidden");
    return;
  }
  videoLoading.innerHTML = '<div class="spinner" aria-hidden="true"></div><div>Video loading...</div>';
  videoLoading.classList.toggle("hidden", !isLoading);
}

function waitForInitialVideoReady() {
  const activeVideoElement = getActiveVideoElement();
  if (activeVideoElement.readyState >= 2) {
    markVideoSourceReady(getVideoSource(activeVideoElement));
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      activeVideoElement.removeEventListener("loadeddata", handleReady);
      activeVideoElement.removeEventListener("error", handleReady);
    };
    activeVideoElement.addEventListener("loadeddata", handleReady);
    activeVideoElement.addEventListener("error", handleReady);
  });
}

function waitForAllImages() {
  const images = Array.from(document.querySelectorAll("img"));
  if (!images.length) {
    return Promise.resolve();
  }
  return Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const handleSettled = () => {
          image.removeEventListener("load", handleSettled);
          image.removeEventListener("error", handleSettled);
          resolve();
        };
        image.addEventListener("load", handleSettled);
        image.addEventListener("error", handleSettled);
      });
    })
  );
}

function preloadVideoSource(src) {
  if (!src || readyVideoSources.has(src)) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const preloadVideo = document.createElement("video");
    preloadVideo.preload = "auto";
    preloadVideo.muted = true;
    preloadVideo.playsInline = true;
    preloadVideo.src = src;
    preloadVideo.style.position = "absolute";
    preloadVideo.style.width = "1px";
    preloadVideo.style.height = "1px";
    preloadVideo.style.opacity = "0";
    preloadVideo.style.pointerEvents = "none";
    preloadVideo.style.left = "-9999px";
    backgroundVideoPreloads.push(preloadVideo);
    document.body.appendChild(preloadVideo);

    const handleReady = () => {
      preloadVideo.removeEventListener("loadeddata", handleReady);
      preloadVideo.removeEventListener("canplaythrough", handleReady);
      preloadVideo.removeEventListener("error", handleError);
      markVideoSourceReady(src);
      resolve();
    };

    const handleError = () => {
      preloadVideo.removeEventListener("loadeddata", handleReady);
      preloadVideo.removeEventListener("canplaythrough", handleReady);
      preloadVideo.removeEventListener("error", handleError);
      resolve();
    };

    preloadVideo.addEventListener("loadeddata", handleReady);
    preloadVideo.addEventListener("canplaythrough", handleReady);
    preloadVideo.addEventListener("error", handleError);
    preloadVideo.load();
  });
}

async function preloadRemainingVideos() {
  const remainingSources = allQualitativeVideos
    .slice(1)
    .map((item) => item && item.src)
    .filter(Boolean)
    .filter((src, index, items) => items.indexOf(src) === index);

  for (const src of remainingSources) {
    await preloadVideoSource(src);
  }
}

function normalizeVideos(items) {
  if (!Array.isArray(items) || !items.length) {
    return pageLinksConfig.videos.qualitative;
  }
  return items.map((item, index) => {
    if (typeof item === "string") {
      return {
        src: item,
        title: "Qualitative result " + (index + 1),
        category: index % 2 === 0 ? "web" : "emdb"
      };
    }
    return {
      src: item.src || pageLinksConfig.videos.qualitative[0].src,
      title: item.title || "Qualitative result " + (index + 1),
      category: item.category || (index % 2 === 0 ? "web" : "emdb")
    };
  });
}

function getFilteredQualitativeVideos() {
  return allQualitativeVideos.filter((item) => {
    if (item.category === "web") {
      return videoFilters.web;
    }
    if (item.category === "emdb") {
      return videoFilters.emdb;
    }
    return true;
  });
}

function syncVideoFilterButtons() {
  if (videoFilterWeb) {
    videoFilterWeb.classList.toggle("is-active", videoFilters.web);
    videoFilterWeb.setAttribute("aria-pressed", String(videoFilters.web));
  }
  if (videoFilterEmdb) {
    videoFilterEmdb.classList.toggle("is-active", videoFilters.emdb);
    videoFilterEmdb.setAttribute("aria-pressed", String(videoFilters.emdb));
  }
}

function setVideoEmptyState(isEmpty) {
  if (videoEmpty) {
    videoEmpty.classList.toggle("hidden", !isEmpty);
  }
  if (videoInteractionArea) {
    videoInteractionArea.classList.toggle("is-empty", isEmpty);
  }
  if (isEmpty) {
    qualitativeVideoElements.forEach((videoElement) => {
      videoElement.classList.remove("is-active");
      videoElement.pause();
    });
    clearVideoLoadingTimer();
    setLoading(false);
  }
}

function refreshQualitativeVideoList(options = {}) {
  const preserveSource = options.preserveSource !== false;
  const previousSrc = preserveSource && qualitativeVideos[currentVideoIndex]
    ? qualitativeVideos[currentVideoIndex].src
    : null;

  qualitativeVideos = getFilteredQualitativeVideos();

  if (!qualitativeVideos.length) {
    currentVideoIndex = 0;
    renderVideoDots();
    setVideoEmptyState(true);
    return;
  }

  setVideoEmptyState(false);

  let nextIndex = 0;
  if (previousSrc) {
    const foundIndex = qualitativeVideos.findIndex((item) => item.src === previousSrc);
    if (foundIndex >= 0) {
      nextIndex = foundIndex;
    }
  }

  updateVideo(nextIndex);
}

function toggleVideoFilter(category) {
  videoFilters[category] = !videoFilters[category];
  syncVideoFilterButtons();
  refreshQualitativeVideoList({ preserveSource: true });
}

function renderVideoDots() {
  videoDots.innerHTML = "";
  qualitativeVideos.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot" + (index === currentVideoIndex ? " active" : "");
    dot.setAttribute("aria-label", "Go to video " + (index + 1));
    dot.addEventListener("click", () => updateVideo(index));
    videoDots.appendChild(dot);
  });
}

function updateVideo(index) {
  if (!qualitativeVideos.length) {
    return;
  }

  currentVideoIndex = (index + qualitativeVideos.length) % qualitativeVideos.length;
  const item = qualitativeVideos[currentVideoIndex];
  renderVideoDots();
  syncVideoControlLabels();
  syncVideoProgress();

  const activeVideoElement = getActiveVideoElement();
  if (getVideoSource(activeVideoElement) === item.src) {
    activeVideoElement.classList.add("is-active");
    getInactiveVideoElement().classList.remove("is-active");
    setLoading(false);
    return;
  }

  if (pendingVideoLoadCleanup) {
    pendingVideoLoadCleanup();
    pendingVideoLoadCleanup = null;
  }

  const switchToken = ++videoSwitchToken;
  const nextVideoElement = getInactiveVideoElement();
  clearVideoLoadingTimer();
  if (!readyVideoSources.has(item.src)) {
    videoLoadingTimer = window.setTimeout(() => {
      if (switchToken === videoSwitchToken) {
        setLoading(true);
      }
    }, 120);
  } else {
    setLoading(false);
  }

  nextVideoElement.pause();
  nextVideoElement.currentTime = 0;
  nextVideoElement.playbackRate = activeVideoElement.playbackRate;

  const cleanup = () => {
    nextVideoElement.removeEventListener("loadeddata", handleReady);
    nextVideoElement.removeEventListener("error", handleError);
  };

  const handleReady = () => {
    cleanup();
    pendingVideoLoadCleanup = null;
    markVideoSourceReady(item.src);
    finalizeVideoSwitch(nextVideoElement, switchToken);
  };

  const handleError = () => {
    cleanup();
    pendingVideoLoadCleanup = null;
    if (switchToken !== videoSwitchToken) {
      return;
    }
    clearVideoLoadingTimer();
    setLoading(false, true);
  };

  pendingVideoLoadCleanup = cleanup;
  nextVideoElement.addEventListener("loadeddata", handleReady);
  nextVideoElement.addEventListener("error", handleError);
  setVideoSource(nextVideoElement, item.src);
  nextVideoElement.load();

  if (nextVideoElement.readyState >= 2) {
    handleReady();
  }
}

function applyLinks(config) {
  document.querySelectorAll("[data-author]").forEach((node) => {
    const key = node.getAttribute("data-author");
    const href = config.authors && config.authors[key];
    if (href) {
      node.href = href;
    }
  });

  document.querySelectorAll("[data-link]").forEach((node) => {
    const key = node.getAttribute("data-link");
    const href = config.buttons && config.buttons[key];
    if (!href || href === "#") {
      node.removeAttribute("href");
      node.classList.add("is-disabled");
      node.setAttribute("aria-disabled", "true");
      node.addEventListener("click", (event) => event.preventDefault());
      return;
    }
    node.href = href;
  });
}

async function copyCitationToClipboard() {
  if (!citationCodeBlock) {
    return false;
  }
  const citationText = citationCodeBlock.textContent;
  if (!citationText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(citationText);
    return true;
  } catch (error) {
    const fallbackInput = document.createElement("textarea");
    fallbackInput.value = citationText;
    fallbackInput.setAttribute("readonly", "");
    fallbackInput.style.position = "fixed";
    fallbackInput.style.opacity = "0";
    fallbackInput.style.pointerEvents = "none";
    document.body.appendChild(fallbackInput);
    fallbackInput.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (fallbackError) {
      copied = false;
    }
    document.body.removeChild(fallbackInput);
    return copied;
  }
}

async function loadPageConfig() {
  applyLinks(pageLinksConfig);
  allQualitativeVideos = normalizeVideos(pageLinksConfig.videos && pageLinksConfig.videos.qualitative);
  qualitativeVideos = getFilteredQualitativeVideos();
  syncVideoFilterButtons();
  const initialVideo = qualitativeVideos[0];
  if (initialVideo && initialVideo.src) {
    setVideoSource(primaryVideoElement, initialVideo.src);
  }
  const initialVideoReady = qualitativeVideos.length ? waitForInitialVideoReady() : Promise.resolve();
  const imagesReady = waitForAllImages();
  renderVideoDots();
  setVideoEmptyState(!qualitativeVideos.length);
  syncVideoControlLabels();
  syncVideoProgress();
  await Promise.all([initialVideoReady, imagesReady]);
  window.setTimeout(() => {
    preloadRemainingVideos();
  }, 0);
}

qualitativeVideoElements.forEach((videoElement) => {
  videoElement.dataset.src = videoElement.getAttribute("src") || "";
  videoElement.addEventListener("loadeddata", () => {
    markVideoSourceReady(getVideoSource(videoElement));
    if (videoElement !== getActiveVideoElement()) {
      return;
    }
    clearVideoLoadingTimer();
    setLoading(false);
    syncVideoControlLabels();
    syncVideoProgress();
  });

  videoElement.addEventListener("error", () => {
    if (videoElement !== getActiveVideoElement()) {
      return;
    }
    clearVideoLoadingTimer();
    setLoading(false, true);
  });

  videoElement.addEventListener("play", () => {
    if (videoElement === getActiveVideoElement()) {
      syncVideoControlLabels();
    }
  });
  videoElement.addEventListener("pause", () => {
    if (videoElement === getActiveVideoElement()) {
      syncVideoControlLabels();
    }
  });
  videoElement.addEventListener("ratechange", () => {
    if (videoElement === getActiveVideoElement()) {
      syncVideoControlLabels();
    }
  });
  videoElement.addEventListener("timeupdate", () => {
    if (videoElement === getActiveVideoElement()) {
      syncVideoProgress();
    }
  });
  videoElement.addEventListener("loadedmetadata", () => {
    if (videoElement === getActiveVideoElement()) {
      syncVideoProgress();
    }
  });
});

function goToPrevVideo() {
  updateVideo(currentVideoIndex - 1);
}

function goToNextVideo() {
  updateVideo(currentVideoIndex + 1);
}

if (videoFilterWeb) {
  videoFilterWeb.addEventListener("click", () => toggleVideoFilter("web"));
}
if (videoFilterEmdb) {
  videoFilterEmdb.addEventListener("click", () => toggleVideoFilter("emdb"));
}
videoPrev.addEventListener("click", goToPrevVideo);
videoNext.addEventListener("click", goToNextVideo);
if (videoPrevHover) {
  videoPrevHover.addEventListener("click", goToPrevVideo);
}
if (videoNextHover) {
  videoNextHover.addEventListener("click", goToNextVideo);
}
videoPlayToggle.addEventListener("click", async () => {
  const activeVideoElement = getActiveVideoElement();
  if (activeVideoElement.paused) {
    try {
      await activeVideoElement.play();
    } catch (error) {}
  } else {
    activeVideoElement.pause();
  }
  syncVideoControlLabels();
});
videoProgress.addEventListener("input", () => {
  const activeVideoElement = getActiveVideoElement();
  if (!Number.isFinite(activeVideoElement.duration) || activeVideoElement.duration <= 0) {
    return;
  }
  activeVideoElement.currentTime = (Number(videoProgress.value) / 100) * activeVideoElement.duration;
});
videoSpeedToggle.addEventListener("click", () => {
  const activeVideoElement = getActiveVideoElement();
  const currentIndex = speedOptions.indexOf(activeVideoElement.playbackRate);
  const nextIndex = (currentIndex + 1 + speedOptions.length) % speedOptions.length;
  activeVideoElement.playbackRate = speedOptions[nextIndex];
  syncVideoControlLabels();
});
videoRestart.addEventListener("click", async () => {
  const activeVideoElement = getActiveVideoElement();
  activeVideoElement.currentTime = 0;
  try {
    await activeVideoElement.play();
  } catch (error) {}
  syncVideoControlLabels();
  syncVideoProgress();
});

if (abstractVideo && abstractVideoPlayToggle && abstractVideoSpeedToggle && abstractVideoProgress && abstractVideoRestart) {
  abstractVideo.addEventListener("play", syncAbstractVideoControlLabels);
  abstractVideo.addEventListener("pause", syncAbstractVideoControlLabels);
  abstractVideo.addEventListener("ratechange", syncAbstractVideoControlLabels);
  abstractVideo.addEventListener("timeupdate", syncAbstractVideoProgress);
  abstractVideo.addEventListener("loadedmetadata", syncAbstractVideoProgress);

  abstractVideoPlayToggle.addEventListener("click", async () => {
    if (abstractVideo.paused) {
      try {
        await abstractVideo.play();
      } catch (error) {}
    } else {
      abstractVideo.pause();
    }
    syncAbstractVideoControlLabels();
  });

  abstractVideoProgress.addEventListener("input", () => {
    if (!Number.isFinite(abstractVideo.duration) || abstractVideo.duration <= 0) {
      return;
    }
    abstractVideo.currentTime = (Number(abstractVideoProgress.value) / 100) * abstractVideo.duration;
  });

  abstractVideoSpeedToggle.addEventListener("click", () => {
    const currentIndex = speedOptions.indexOf(abstractVideo.playbackRate);
    const nextIndex = (currentIndex + 1 + speedOptions.length) % speedOptions.length;
    abstractVideo.playbackRate = speedOptions[nextIndex];
    syncAbstractVideoControlLabels();
  });

  abstractVideoRestart.addEventListener("click", async () => {
    abstractVideo.currentTime = 0;
    try {
      await abstractVideo.play();
    } catch (error) {}
    syncAbstractVideoControlLabels();
    syncAbstractVideoProgress();
  });
}

const observedSections = ["top", "abstract", "methods", "qualitative", "results", "citation"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function syncNavAtPageEdges() {
  const scrollBottom = window.scrollY + window.innerHeight;
  const pageBottom = document.documentElement.scrollHeight;
  if (pageBottom - scrollBottom <= 12) {
    setActiveNav("#citation");
  } else if (window.scrollY <= 8) {
    setActiveNav("#top");
  }
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visibleEntries.length) {
      setActiveNav("#" + visibleEntries[0].target.id);
      syncNavAtPageEdges();
    }
  },
  {
    rootMargin: "-20% 0px -55% 0px",
    threshold: [0.15, 0.3, 0.6]
  }
);

observedSections.forEach((section) => sectionObserver.observe(section));

if (window.location.hash) {
  setActiveNav(window.location.hash);
} else {
  setActiveNav("#top");
}

window.addEventListener("scroll", syncNavAtPageEdges, { passive: true });
window.addEventListener("resize", syncNavAtPageEdges);

if (citationButton) {
  const defaultCitationButtonText = citationButtonLabel ? citationButtonLabel.textContent : "Citation";
  citationButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const copied = await copyCitationToClipboard();
    if (citationButtonLabel) {
      citationButtonLabel.textContent = copied ? "Copied!" : "Copy failed";
    }
    window.setTimeout(() => {
      if (citationButtonLabel) {
        citationButtonLabel.textContent = defaultCitationButtonText;
      }
    }, 1200);
  });
}

setupRefineRowDeltas();
syncVideoControlLabels();
syncAbstractVideoControlLabels();
syncAbstractVideoProgress();
syncNavAtPageEdges();

loadPageConfig();
