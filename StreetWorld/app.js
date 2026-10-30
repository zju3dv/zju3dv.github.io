import {
  startVisuals,
  visualState,
  cameraRigs,
  camerasFor,
} from "./visuals.js?v=4d04bb434ba2";
import { synchronizeVideos } from "./media-sync.js?v=3efaf08eff74";
import { loadMedia } from "./media-cache.js?v=f051d8ff7aec";

const chapters = [...document.querySelectorAll(".chapter")];
const names = [
  "Overview",
  "Street Gallery",
  "AD Policy Evaluation",
  "Traffic Simulation",
  "Renderer Variants",
  "Leaderboard",
  "Framework",
  "Comparison",
  "BibTeX",
];
const scenes = { gallery: 0, policy: 0, traffic: 0, renderer: 0 };
const cameraNames = cameraRigs.nuScenes.map((camera) => camera.name);
const galleryAssetBase = "./assets/project-page-dist/asset-present";
const galleryMediaVersion = "d158a10883aa";
const sceneThumbnailBase = "./assets/project-page-dist/thumbnails";
const sceneThumbnailVersion = "af176815cd1f";
const gallerySceneSets = {
  nuScenes: {
    directory: "nuscenes",
    channels: [
      "FRONT_LEFT",
      "FRONT",
      "FRONT_RIGHT",
      "BACK_LEFT",
      "BACK",
      "BACK_RIGHT",
    ],
    scenes: [
      "0002",
      "0004",
      "0039",
      "0045",
      "0062",
      "0132",
      "0880",
      "1012",
    ],
  },
  Waymo: {
    directory: "waymo",
    channels: {
      0: "FRONT_LEFT",
      1: "FRONT",
      2: "FRONT_RIGHT",
      3: "SIDE_LEFT",
      5: "SIDE_RIGHT",
    },
    scenes: [
      "147-segment-990914685337955114",
      "267-segment-1022527355599519580",
      "274-segment-1191788760630624072",
      "279-segment-1306458236359471795",
      "484-segment-6150191934425217908",
      "578-segment-8487809726845917818",
      "609-segment-9175749307679169289",
      "624-segment-9509506420470671704",
    ],
  },
  NuRec: {
    directory: "nurec",
    channels: [
      "camera_cross_left_120fov",
      "camera_front_wide_120fov",
      "camera_cross_right_120fov",
      "camera_rear_left_70fov",
      "camera_front_tele_30fov",
      "camera_rear_right_70fov",
    ],
    scenes: [
      "21254445-877f-43d0-a92c-a9c1e9694f9f",
      "7c05aee0-88f1-4338-a48b-5cbe24d5b888",
      "55cc9873-fd30-419a-a8ef-8f8f287f4c30",
      "cb09cf43-efa4-4a46-bd25-6173a6bfa05b",
      "f6de0321-2272-42ff-a50a-4edea5168565",
      "2726cee4-301c-4d59-ad14-64fad8032e87",
      "0aed52b3-1394-4dc3-8553-c60929e6acf8",
      "6daecfe1-621c-4a24-adbc-f7c879ed491b",
    ],
  },
};
const chapterAssetBase = "./assets/project-page-dist";
const chapterCameraVersion = "ac89b551d903";
const chapterScenes = {
  policy: ["0013", "0001", "0204", "0230"],
  traffic: ["0018", "0104", "0202", "0891"],
  renderer: ["0017", "0277", "waymo-670", "waymo-718"],
};
const policyDirectories = {
  Expert: "expert",
  UniAD: "uniad",
  VAD: "vad",
  DiffusionDrive: "diffusiondrive",
  OpenDriveVLA: "opendrivevla",
  AutoVLA: "autovla",
  Epona: "epona",
  "ST-P3": "stp3",
};
const rendererDirectories = {
  "Street GS": "streetgs",
  OmniRe: "omnire",
  InfiniSplat: "infinisplat",
};
const rail = document.querySelector(".chapter-rail");
const chapterDuration = 580;
let activeIndex = 0;
let transitioning = false;
let pendingNavigation = null;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

chapters.forEach((chapter, index) => {
  const link = document.createElement("a");
  link.href = `#${chapter.id}`;
  link.setAttribute("aria-label", `${index + 1}. ${names[index]}`);
  link.innerHTML = `<span>${names[index]}</span>`;
  rail.append(link);
});

function updateNavigation() {
  const current = chapters[activeIndex];
  rail.querySelectorAll("a").forEach((link, i) => {
    link.classList.toggle("active", i === activeIndex);
    if (i === activeIndex) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
  document.querySelectorAll(".top-nav a").forEach((link) => {
    const section = link.hash.slice(1);
    const selected =
      section === current.id ||
      (section === "gallery" && activeIndex >= 1 && activeIndex <= 4);
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
  visualState.active = current.id;
  updateGalleryMedia();
  Object.keys(chapterScenes).forEach(updateChapterMedia);
  preloadNearbyMedia();
}

async function goTo(index, updateHash = true) {
  if (index < 0 || index >= chapters.length) return;
  if (index === activeIndex) {
    pendingNavigation = null;
    return;
  }
  if (transitioning) {
    pendingNavigation = { index, updateHash };
    return;
  }
  transitioning = true;
  const previous = chapters[activeIndex];
  const next = chapters[index];
  const forward = index > activeIndex;
  const covering = (forward ? next : previous).dataset.transition === "cover";
  const duration = reducedMotion.matches ? 0 : chapterDuration;
  previous.inert = true;
  next.inert = false;
  next.style.visibility = "visible";
  next.scrollTop = 0;
  previous.style.zIndex = forward ? "1" : "2";
  next.style.zIndex = forward ? "2" : "1";
  const rest = { transform: "translateY(0) scale(1)", opacity: 1 };
  const tucked = { transform: "translateY(-8%) scale(.96)", opacity: 0.3 };
  const above = { transform: "translateY(-100%) scale(1)", opacity: 1 };
  const below = { transform: "translateY(100%) scale(1)", opacity: 1 };
  const timing = {
    duration,
    easing: "cubic-bezier(.65, 0, .2, 1)",
    fill: "both",
  };
  const outgoing = previous.animate(
    forward ? [rest, covering ? tucked : above] : [rest, below],
    timing,
  );
  const incoming = next.animate(
    forward ? [below, rest] : [covering ? tucked : above, rest],
    timing,
  );
  activeIndex = index;
  if (updateHash) history.replaceState(null, "", `#${next.id}`);
  await Promise.all([outgoing.finished, incoming.finished]);
  previous.classList.remove("active");
  next.classList.add("active");
  previous.style.zIndex = "";
  next.style.zIndex = "";
  next.style.visibility = "";
  outgoing.cancel();
  incoming.cancel();
  updateNavigation();
  const heading = next.querySelector("h1, h2");
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  document.querySelector("#announcement").textContent =
    `${names[index]}, chapter ${index + 1} of ${chapters.length}`;
  transitioning = false;
  if (pendingNavigation) {
    const pending = pendingNavigation;
    pendingNavigation = null;
    goTo(pending.index, pending.updateHash);
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest('a[href^="#"]');
  if (!target) return;
  const id = target.hash.slice(1);
  const index = chapters.findIndex((chapter) => chapter.id === id);
  if (index !== -1) {
    event.preventDefault();
    goTo(index);
  }
});

function canScrollInside(target, direction) {
  let node = target instanceof Element ? target : target.parentElement;
  while (node && node !== document.body) {
    if (
      node.scrollHeight > node.clientHeight + 2 &&
      /auto|scroll/.test(getComputedStyle(node).overflowY)
    ) {
      if (
        direction > 0 &&
        node.scrollTop + node.clientHeight < node.scrollHeight - 2
      )
        return true;
      if (direction < 0 && node.scrollTop > 2) return true;
    }
    node = node.parentElement;
  }
  return false;
}

// An idle gap or renewed input starts a gesture. Decaying momentum belongs to
// the previous gesture, even after the chapter animation has finished.
const wheel = {
  total: 0,
  action: null,
  last: -Infinity,
  started: 0,
  direction: 0,
  magnitude: 0,
  decelerated: false,
  rise: 0,
  risingEvents: 0,
};
document.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
      return;
    const delta =
      event.deltaY *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (!delta) return;
    const now = performance.now();
    const direction = Math.sign(delta);
    const magnitude = Math.abs(delta);
    const reversed = direction !== wheel.direction;
    if (!reversed && magnitude < wheel.magnitude) wheel.decelerated = true;
    const rising = !reversed && magnitude > wheel.magnitude;
    wheel.rise = rising ? wheel.rise + magnitude : 0;
    wheel.risingEvents = rising ? wheel.risingEvents + 1 : 0;
    const input = reversed ? delta : direction * wheel.rise;
    // A new swipe accelerates after the preceding input has slowed down.
    // Sustained acceleration rejects isolated spikes and a long first swipe.
    const renewed =
      !transitioning &&
      now - wheel.started >= chapterDuration &&
      ((reversed && magnitude >= 40) ||
        (wheel.decelerated && wheel.risingEvents >= 2 && wheel.rise >= 40));
    if (now - wheel.last > 240 || renewed) {
      wheel.total = 0;
      wheel.action = null;
      wheel.started = now;
      wheel.decelerated = false;
      wheel.rise = 0;
      wheel.risingEvents = 0;
    }
    wheel.last = now;
    wheel.magnitude = magnitude;
    if (reversed) wheel.total = 0;
    wheel.direction = direction;
    if (wheel.action === "chapter") {
      event.preventDefault();
      return;
    }
    if (canScrollInside(event.target, delta) && !transitioning) {
      wheel.action = "content";
      return;
    }
    event.preventDefault();
    if (wheel.action === "content") return;
    wheel.total += renewed ? input : delta;
    if (Math.abs(wheel.total) < 40) return;
    const nextIndex = activeIndex + direction;
    if (nextIndex < 0 || nextIndex >= chapters.length) return;
    wheel.action = "chapter";
    goTo(nextIndex);
  },
  { passive: false },
);

document.addEventListener("keydown", (event) => {
  if (event.target.closest("input, select, textarea, [contenteditable]"))
    return;
  const actions = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };
  if (event.key in actions) {
    if (canScrollInside(event.target, actions[event.key])) return;
    event.preventDefault();
    goTo(activeIndex + actions[event.key]);
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    goTo(event.key === "Home" ? 0 : chapters.length - 1);
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    const chapter = chapters[activeIndex].id;
    if (!(chapter in scenes) || event.target.closest("button, a")) return;
    event.preventDefault();
    changeScene(chapter, event.key === "ArrowRight" ? 1 : -1);
  }
});

let touchStart = null;
document.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) {
      touchStart = null;
      return;
    }
    const touch = event.touches[0];
    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      target: event.target,
      scrollTop: chapters[activeIndex].scrollTop,
    };
  },
  { passive: true },
);
document.addEventListener(
  "touchmove",
  (event) => {
    if (!touchStart || event.touches.length !== 1) return;
    const dy = touchStart.y - event.touches[0].clientY;
    const dx = touchStart.x - event.touches[0].clientX;
    if (Math.abs(dy) > Math.abs(dx) && !canScrollInside(touchStart.target, dy))
      event.preventDefault();
  },
  { passive: false },
);
document.addEventListener(
  "touchend",
  (event) => {
    if (!touchStart) return;
    const end = event.changedTouches[0];
    const dx = touchStart.x - end.clientX;
    const dy = touchStart.y - end.clientY;
    const chapter = chapters[activeIndex];
    if (
      Math.abs(dx) > 55 &&
      Math.abs(dx) > Math.abs(dy) * 1.3 &&
      touchStart.target.closest(".scene-surface")
    ) {
      changeScene(chapter.id, Math.sign(dx));
    } else if (
      Math.abs(dy) > 55 &&
      Math.abs(dy) > Math.abs(dx) &&
      Math.abs(chapter.scrollTop - touchStart.scrollTop) < 3 &&
      !canScrollInside(touchStart.target, dy)
    ) {
      goTo(activeIndex + Math.sign(dy));
    }
    touchStart = null;
  },
  { passive: true },
);

function cameraMarkup(index, chapter, mode = 0) {
  const galleryCamera = chapter === "gallery";
  const video = `<video class="${galleryCamera ? "gallery-camera" : "chapter-camera"}" data-camera="${index}" muted playsinline preload="none" aria-label="${cameraNames[index].toLowerCase()} camera view"></video>`;
  const canvas = galleryCamera
    ? `<canvas data-visual="camera" data-camera="${index}" data-owner="gallery" data-mode="${mode}" aria-label="Illustrative ${cameraNames[index].toLowerCase()} camera view"></canvas>`
    : "";
  const collision =
    chapter === "traffic"
      ? '<span class="collision-label">Collision</span>'
      : "";
  return `<div class="camera-view">${video}${canvas}<div class="camera-label"><span>${cameraNames[index]}</span></div>${collision}</div>`;
}
document.querySelectorAll("[data-camera-grid]").forEach((grid) => {
  grid.innerHTML = cameraNames
    .map((_, i) => cameraMarkup(i, grid.dataset.cameraGrid))
    .join("");
});

const gallery = document.querySelector("#gallery");
const galleryRig = document.querySelector("[data-gallery-rig]");
const galleryRigLoader = document.querySelector("[data-gallery-rig-loader]");
const galleryVideos = [...gallery.querySelectorAll("video")];
let galleryPlaying = false;
let gallerySelection = null;
let stopGallery = null;
let galleryImageRequest = 0;

function updateGalleryMedia() {
  const config = gallerySceneSets[visualState.dataset];
  const sceneId = config.scenes[scenes.gallery];
  const selection = `${config.directory}/${sceneId}`;
  gallery.dataset.actualScene = "true";
  if (selection !== gallerySelection) {
    stopGallery?.();
    stopGallery = null;
    galleryRig.hidden = true;
    galleryRigLoader.hidden = false;
    galleryRig.removeAttribute("src");
    gallerySelection = selection;
    galleryPlaying = false;
    const sceneNumber = String(scenes.gallery + 1).padStart(2, "0");
    const cameras = cameraRigs[visualState.dataset];
    galleryRig.alt = `${visualState.dataset} scene ${sceneNumber}: ${cameras.length} camera views arranged around the vehicle`;
    galleryVideos.forEach((video) => {
      const index = Number(video.dataset.camera);
      if (video.closest(".camera-view").hidden) {
        delete video.dataset.source;
        video.removeAttribute("src");
        video.load();
        return;
      }
      setVideoSource(video, `${galleryAssetBase}/${selection}/${config.channels[index]}.mp4?v=${galleryMediaVersion}`);
      const height =
        visualState.dataset === "Waymo" ? (index < 3 ? 354 : 244) : 300;
      setCameraSize(video, 532, height);
      const camera = cameras.find((camera) => camera.camera === index);
      video.setAttribute(
        "aria-label",
        `${visualState.dataset} scene ${sceneNumber} ${camera.name.toLowerCase()} camera view`,
      );
    });
  }
  const playing = visualState.active === "gallery";
  if (playing === galleryPlaying) return;
  galleryPlaying = playing;
  stopGallery?.();
  stopGallery = playing
    ? synchronizeVideos(
        galleryVideos.filter((video) => video.hasAttribute("data-source")),
        gallery.querySelector("[data-play-videos]"),
      )
    : null;
  const request = ++galleryImageRequest;
  if (playing) {
    const source = `${galleryAssetBase}/${selection}/RIG.gif?v=${galleryMediaVersion}`;
    galleryRig.dataset.source = source;
    loadMedia(source).then((url) => {
      if (request !== galleryImageRequest) return;
      galleryRig.onload = () => {
        if (request !== galleryImageRequest) return;
        galleryRig.hidden = false;
        galleryRigLoader.hidden = true;
      };
      galleryRig.src = url;
    });
  } else {
    galleryRig.hidden = true;
    galleryRigLoader.hidden = false;
    delete galleryRig.dataset.source;
    galleryRig.removeAttribute("src");
  }
}

function updateCameraLayout(owner) {
  const cameras = camerasFor(owner);
  const grid = document.querySelector(`[data-camera-grid="${owner}"]`);
  grid.dataset.cameras = cameras.length;
  grid.querySelectorAll(".camera-view").forEach((view) => {
    const index = Number(view.querySelector("video").dataset.camera);
    const camera = cameras.find((camera) => camera.camera === index);
    view.hidden = !camera;
    if (camera) {
      view.querySelector(".camera-label span").textContent = camera.name;
      if (owner === "gallery") {
        view.querySelector("canvas").setAttribute(
          "aria-label",
          `Illustrative ${camera.name.toLowerCase()} camera view`,
        );
      }
    }
  });
  if (owner === "gallery") {
    updateGalleryMedia();
    document
      .querySelector('[data-visual="rig"]')
      .setAttribute(
        "aria-label",
        `Vehicle viewed directly from above and behind, with ${cameras.map((camera) => camera.name.toLowerCase()).join(", ")} flat rectangular camera panels arranged around a shared ring in their corresponding directions`,
      );
  }
}
["gallery", "policy", "renderer"].forEach(updateCameraLayout);

const trafficModes = [
  { name: "Replay", directory: "replay" },
  { name: "Trajectory IDM", directory: "trajectory-idm" },
  { name: "IDM", directory: "idm" },
];
document.querySelector("#traffic-rows").innerHTML = trafficModes
  .map(
    (mode, i) =>
      `<div class="traffic-row" data-traffic-mode="${mode.directory}"><div class="traffic-row-label"><h3>${mode.name}</h3></div><div class="map-slot"><div class="traffic-map-view"><video class="traffic-map" data-map muted playsinline preload="none" aria-label="${mode.name} traffic map"></video><span class="collision-label">Collision</span></div></div>${[0, 1, 2].map((index) => cameraMarkup(index, "traffic", i)).join("")}</div>`,
  )
  .join("");

document.querySelectorAll("#traffic-rows video").forEach((video) => {
  const view = video.closest(".camera-view, .traffic-map-view");
  const update = () =>
    view.classList.toggle("collision", video.currentTime >= video.duration);
  ["ended", "timeupdate", "seeking"].forEach((event) =>
    video.addEventListener(event, update),
  );
  video.addEventListener("loadstart", () => view.classList.remove("collision"));
});

const chapterMedia = Object.fromEntries(
  Object.keys(chapterScenes).map((owner) => [
    owner,
    { selection: null, playing: false, stop: null },
  ]),
);

function setVideoSource(video, source) {
  video.dataset.source = source;
  video.removeAttribute("src");
  video.load();
}

function setCameraSize(video, width, height) {
  video.width = width;
  video.height = height;
  video.style.aspectRatio = `${width} / ${height}`;
}

function updateChapterMedia(owner) {
  const chapter = document.querySelector(`#${owner}`);
  const state = chapterMedia[owner];
  const scene = chapterScenes[owner][scenes[owner]];
  const variant =
    owner === "policy"
      ? policyDirectories[visualState.policy]
      : owner === "renderer"
        ? rendererDirectories[visualState.renderer]
        : "";
  const selection = `${scene}/${variant}`;
  const videos = [...chapter.querySelectorAll("video")];
  if (selection !== state.selection) {
    state.stop?.();
    state.stop = null;
    if (owner === "traffic") {
      const channels = ["BACK_LEFT", "BACK", "BACK_RIGHT"];
      chapter.querySelectorAll("[data-traffic-mode]").forEach((row) => {
        const mode = row.dataset.trafficMode;
        const base = `${chapterAssetBase}/traffic-sim/${scene}`;
        setVideoSource(row.querySelector("[data-map]"), `${base}/${mode}-map.mp4?v=${chapterCameraVersion}`);
        row.querySelectorAll(".chapter-camera").forEach((video, index) => {
          setVideoSource(video, `${base}/${mode}/${channels[index]}.mp4?v=${chapterCameraVersion}`);
          setCameraSize(video, 480, 270);
          const label = channels[index]
            .replace("BACK", "REAR")
            .replaceAll("_", " ");
          video.setAttribute(
            "aria-label",
            `${scene} ${mode} ${label.toLowerCase()} camera view`,
          );
          video
            .closest(".camera-view")
            .querySelector(".camera-label span").textContent = label;
        });
      });
    } else {
      const base =
        owner === "policy"
          ? `${chapterAssetBase}/policy-eval/${variant}/${scene}`
          : `${chapterAssetBase}/renderer-interface/${variant}-${scene}`;
      const map =
        owner === "policy"
          ? `${base}/bev.mp4`
          : `${chapterAssetBase}/renderer-interface/map-${scene}.mp4`;
      setVideoSource(chapter.querySelector("[data-map]"), `${map}?v=${chapterCameraVersion}`);
      const waymo = owner === "renderer" && scene.startsWith("waymo-");
      const cameraSize =
        owner === "policy"
          ? [532, 300]
          : variant === "infinisplat"
            ? [518, 294]
            : waymo
              ? [480, 320]
              : [534, 300];
      const channels =
        waymo
          ? {
              0: "FRONT_LEFT",
              1: "FRONT",
              2: "FRONT_RIGHT",
              3: "SIDE_LEFT",
              5: "SIDE_RIGHT",
            }
          : gallerySceneSets.nuScenes.channels;
      chapter.querySelectorAll(".chapter-camera").forEach((video) => {
        const index = Number(video.dataset.camera);
        if (video.closest(".camera-view").hidden) {
          delete video.dataset.source;
          video.removeAttribute("src");
          video.load();
          return;
        }
        setVideoSource(video, `${base}/${channels[index]}.mp4?v=${chapterCameraVersion}`);
        const height =
          waymo && variant !== "infinisplat" && index >= 3
            ? 222
            : cameraSize[1];
        setCameraSize(video, cameraSize[0], height);
        const camera = camerasFor(owner).find((camera) => camera.camera === index);
        video.setAttribute(
          "aria-label",
          `${scene} ${variant} ${camera.name.toLowerCase()} camera view`,
        );
      });
    }
    state.selection = selection;
    state.playing = false;
  }
  const playing = visualState.active === owner;
  if (playing === state.playing) return;
  state.playing = playing;
  state.stop?.();
  state.stop = playing
    ? synchronizeVideos(
        videos.filter((video) => video.hasAttribute("data-source")),
        chapter.querySelector("[data-play-videos]"),
      )
    : null;
}

function sceneCount(owner) {
  if (owner === "gallery") {
    return gallerySceneSets[visualState.dataset].scenes.length;
  }
  return chapterScenes[owner].length;
}

function sceneMediaURLs(owner, index) {
  if (owner === "gallery") {
    const config = gallerySceneSets[visualState.dataset];
    const base = `${galleryAssetBase}/${config.directory}/${config.scenes[index]}`;
    return [...Object.values(config.channels).map((channel) => `${base}/${channel}.mp4?v=${galleryMediaVersion}`), `${base}/RIG.gif?v=${galleryMediaVersion}`];
  }
  const scene = chapterScenes[owner][index];
  if (owner === "traffic") {
    const base = `${chapterAssetBase}/traffic-sim/${scene}`;
    return trafficModes.flatMap(({ directory }) => [
      `${base}/${directory}-map.mp4?v=${chapterCameraVersion}`,
      ...["BACK_LEFT", "BACK", "BACK_RIGHT"].map((channel) => `${base}/${directory}/${channel}.mp4?v=${chapterCameraVersion}`),
    ]);
  }
  if (owner === "policy") {
    const base = `${chapterAssetBase}/policy-eval/${policyDirectories[visualState.policy]}/${scene}`;
    return ["bev", ...gallerySceneSets.nuScenes.channels].map((channel) => `${base}/${channel}.mp4?v=${chapterCameraVersion}`);
  }
  const base = `${chapterAssetBase}/renderer-interface`;
  const variant = rendererDirectories[visualState.renderer];
  const channels = scene.startsWith("waymo-")
    ? Object.values(gallerySceneSets.Waymo.channels)
    : gallerySceneSets.nuScenes.channels;
  return [
    `${base}/map-${scene}.mp4?v=${chapterCameraVersion}`,
    ...channels.map((channel) => `${base}/${variant}-${scene}/${channel}.mp4?v=${chapterCameraVersion}`),
  ];
}

let preloadGeneration = 0;

async function preloadNearbyMedia() {
  const generation = ++preloadGeneration;
  const chapter = chapters[activeIndex];
  const owner = chapter.id;
  const hasMedia = owner === "gallery" || owner in chapterScenes;
  const current = hasMedia ? sceneMediaURLs(owner, scenes[owner]) : [];
  const neighbors = [];
  if (hasMedia) {
    const count = sceneCount(owner);
    for (const direction of [-1, 1]) {
      neighbors.push(...sceneMediaURLs(owner, (scenes[owner] + direction + count) % count));
    }
  }
  for (const direction of [-1, 1]) {
    const adjacent = chapters[activeIndex + direction];
    if (adjacent && (adjacent.id === "gallery" || adjacent.id in chapterScenes)) {
      neighbors.push(...sceneMediaURLs(adjacent.id, scenes[adjacent.id]));
    }
  }
  await Promise.all(current.map(loadMedia));
  await document.fonts.ready;
  const images = chapter.querySelectorAll('img[src]:not([loading="lazy"]):not([data-gallery-rig])');
  await Promise.all([...images].map((image) => {
    if (image.complete) {
      if (!image.naturalWidth) throw new Error(`Image failed: ${image.src}`);
      return;
    }
    return new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", () => reject(new Error(`Image failed: ${image.src}`)), { once: true });
    });
  }));
  const pending = new Set(neighbors);
  current.forEach((url) => pending.delete(url));
  for (const url of pending) {
    if (generation !== preloadGeneration) return;
    await loadMedia(url);
  }
}

function updateSceneFooter(owner) {
  const group = document.querySelector(
    `[data-scene-controls="${owner}"] .scene-thumbnails`,
  );
  const config = owner === "gallery" ? gallerySceneSets[visualState.dataset] : null;
  const directory = owner === "gallery" ? `gallery/${config.directory}` : owner;
  const ids = owner === "gallery" ? config.scenes : chapterScenes[owner];
  if (group.dataset.collection !== directory) {
    group.innerHTML = ids
      .map((id, index) => {
        const number = String(index + 1).padStart(2, "0");
        return `<button class="scene-thumbnail" type="button" data-scene="${index}" aria-label="Scene ${number}: ${id}"><img src="${sceneThumbnailBase}/${directory}/${id}.webp?v=${sceneThumbnailVersion}" width="320" height="180" alt="" loading="lazy" decoding="async"></button>`;
      })
      .join("");
    group.dataset.collection = directory;
  }
  group.querySelectorAll("[data-scene]").forEach((button) => {
    const selected = Number(button.dataset.scene) === scenes[owner];
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

document.querySelectorAll("[data-scene-controls]").forEach((footer) => {
  const owner = footer.dataset.sceneControls;
  footer.innerHTML = `<div class="scene-thumbnails" role="group" aria-label="${names[chapters.findIndex((chapter) => chapter.id === owner)]} scenes"></div><button class="media-play-button" data-play-videos type="button" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" /></svg><span>Play videos</span></button>`;
  document
    .querySelector(`#${owner} .section-heading`)
    .after(footer.querySelector("[data-play-videos]"));
  footer.querySelector(".scene-thumbnails").addEventListener("click", (event) => {
    const button = event.target.closest("[data-scene]");
    if (button) selectScene(owner, Number(button.dataset.scene));
  });
  updateSceneFooter(owner);
});

function changeScene(owner, direction) {
  selectScene(
    owner,
    (scenes[owner] + direction + sceneCount(owner)) % sceneCount(owner),
  );
}

function selectScene(owner, index) {
  if (index === scenes[owner]) return;
  scenes[owner] = index;
  visualState.scenes[owner] = index;
  if (owner === "gallery" || owner === "renderer") updateCameraLayout(owner);
  if (owner in chapterScenes) updateChapterMedia(owner);
  const sceneNumber = String(scenes[owner] + 1).padStart(2, "0");
  updateSceneFooter(owner);
  const surface = document.querySelector(`#${owner} .scene-surface`);
  surface.animate([{ opacity: 0.35 }, { opacity: 1 }], {
    duration: reducedMotion.matches ? 0 : 380,
  });
  const title =
    owner === "gallery"
      ? `${visualState.dataset} scene ${sceneNumber}`
      : chapterScenes[owner][scenes[owner]];
  document.querySelector("#announcement").textContent =
    `${names[chapters.findIndex((chapter) => chapter.id === owner)]}, scene ${sceneNumber}: ${title}`;
  preloadNearbyMedia();
}

document.querySelectorAll("[data-switch]").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    group.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("selected", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    const key = group.dataset.switch;
    visualState[key] = button.dataset.value;
    if (key === "dataset") {
      scenes.gallery = 0;
      visualState.scenes.gallery = 0;
      updateCameraLayout("gallery");
      updateSceneFooter("gallery");
    }
    if (key === "policy" || key === "renderer") updateChapterMedia(key);
    if (key === "frequency") updateFilterSummary();
    if (["dataset", "policy", "renderer"].includes(key)) preloadNearbyMedia();
  });
});

const leaderboardData = fetch(
  "./assets/project-page-dist/leaderboard/nuscenes.json",
  { cache: "no-cache" },
).then((response) => {
  if (!response.ok) throw new Error(`Leaderboard download failed: ${response.status}`);
  return response.json();
});

// Category and scenario labels follow catalog/nuScenes.yaml.
const categories = {
  "All categories": ["All scenarios"],
  "Road Area": [
    "Construction Zone",
    "Signalized Intersection",
    "Unsignalized Intersection",
    "Roundabout",
    "Parking Area",
    "Curbside Corridor",
    "Transit Stop Area",
    "Residential Local Road",
    "Special Road",
    "Ordinary Urban Road",
    "Other/Unknown",
  ],
  "Traffic Density": ["Dense", "Low", "Other/Unknown"],
  "Obstructed Obstacle": ["Exists", "Does Not Exist", "Other/Unknown"],
  Time: ["Daytime", "Other/Unknown"],
  Weather: ["Clear", "Rain/Wet", "Other/Unknown"],
  "Ego Behavior": [
    "Avoid or Deviate",
    "Overtake",
    "Lane Change or Merge",
    "Turn",
    "Wait or Stop",
    "Follow",
    "Straight or Cruise",
    "Other/Unknown",
  ],
  "Participant Behavior": [
    "Crossing Path",
    "Cut In or Overtaking",
    "Turning Conflict",
    "Oncoming",
    "Brake",
    "Stop",
    "Unspecified",
    "Other/Unknown",
  ],
};
const categoryFilter = document.querySelector("#category-filter");
const scenarioFilter = document.querySelector("#scenario-filter");
const leaderboardSortButtons = [...document.querySelectorAll("[data-leaderboard-sort]")];
const leaderboardSort = { column: "RC", direction: "descending" };
function filterOptions(name, values) {
  return values
    .map(
      (value, index) =>
        `<label class="filter-chip"><input type="radio" name="${name}" value="${value}" ${index === 0 ? "checked" : ""}><span>${value.startsWith("All ") ? "All" : value}</span></label>`,
    )
    .join("");
}
categoryFilter.innerHTML = filterOptions("category", Object.keys(categories));
function selectedFilter(group) {
  return group.querySelector("input:checked").value;
}
function updateScenarios() {
  const category = selectedFilter(categoryFilter);
  document.querySelector("#scenario-group").hidden =
    category === "All categories";
  const scenarios =
    category === "All categories"
      ? ["All scenarios"]
      : ["All scenarios", ...categories[category]];
  scenarioFilter.innerHTML = filterOptions("scenario", scenarios);
  updateFilterSummary();
}
async function updateFilterSummary() {
  const data = await leaderboardData;
  const category = selectedFilter(categoryFilter);
  const scenario = selectedFilter(scenarioFilter);
  const results = data.results[visualState.frequency];
  const table = scenario === "All scenarios"
    ? results.all
    : results.categories[category][scenario];
  const label = category === "All categories"
    ? "All scenarios"
    : `${category} / ${scenario}`;
  const summary = `${label} · ${visualState.frequency} · ${table.scene_count} scenes`;
  document.querySelector("#filter-summary").textContent = summary;
  document.querySelector("#leaderboard-caption").textContent = summary;
  const rows = [...table.rows].sort((a, b) => {
    const { column, direction } = leaderboardSort;
    const difference = column === "policy"
      ? data.policies[a.policy].name.localeCompare(data.policies[b.policy].name, "en")
      : a[column] - b[column];
    return direction === "ascending" ? difference : -difference;
  });
  leaderboardSortButtons.forEach((button) => {
    const column = button.dataset.leaderboardSort;
    const active = column === leaderboardSort.column;
    const header = button.closest("th");
    if (active) header.setAttribute("aria-sort", leaderboardSort.direction);
    else header.removeAttribute("aria-sort");
    const nextDirection = active
      ? (leaderboardSort.direction === "descending" ? "ascending" : "descending")
      : (column === "policy" ? "ascending" : "descending");
    button.setAttribute("aria-label", `Sort by ${column === "policy" ? "AD policy" : column} in ${nextDirection} order`);
  });
  document.querySelector("#leaderboard-body").innerHTML = rows.map((row, index) => {
    const policy = data.policies[row.policy];
    const values = data.metrics.map((metric) => `<td>${row[metric].toFixed(2)}</td>`).join("");
    return `<tr><td>${index + 1}</td><td><a href="${policy.url}">${policy.name}</a></td>${values}</tr>`;
  }).join("");
}
categoryFilter.addEventListener("change", updateScenarios);
scenarioFilter.addEventListener("change", updateFilterSummary);
leaderboardSortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const column = button.dataset.leaderboardSort;
    if (column === leaderboardSort.column) {
      leaderboardSort.direction = leaderboardSort.direction === "descending" ? "ascending" : "descending";
    } else {
      leaderboardSort.column = column;
      leaderboardSort.direction = column === "policy" ? "ascending" : "descending";
    }
    updateFilterSummary();
  });
});
updateScenarios();

document
  .querySelector("#copy-citation")
  .addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await navigator.clipboard.writeText(
      document.querySelector("#bibtex").textContent,
    );
    button.innerHTML = "COPIED <span>✓</span>";
    document.querySelector("#announcement").textContent =
      "BibTeX copied.";
    setTimeout(() => {
      button.innerHTML = "COPY <span>⧉</span>";
    }, 2000);
  });

// The same four corner marks frame static panels and generated camera views.
document
  .querySelectorAll(".hud-panel, .camera-view, .framework-node")
  .forEach((panel) => {
    const corners = document.createElement("span");
    corners.className = "hud-corners";
    corners.setAttribute("aria-hidden", "true");
    corners.innerHTML = "<i></i><i></i><i></i><i></i>";
    panel.append(corners);
  });

window.addEventListener("hashchange", () => {
  const index = chapters.findIndex(
    (chapter) => chapter.id === location.hash.slice(1),
  );
  if (index !== -1) goTo(index, false);
});
const initialIndex = chapters.findIndex(
  (chapter) => chapter.id === location.hash.slice(1),
);
if (initialIndex > 0) {
  chapters[0].classList.remove("active");
  chapters[0].inert = true;
  activeIndex = initialIndex;
  chapters[activeIndex].classList.add("active");
  chapters[activeIndex].inert = false;
}
updateNavigation();
startVisuals();
