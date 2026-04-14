// Robot Manipulation scenes
var robotScenes = [
  { id: "fabric", label: "Fold Fabric", prompt: 'Text prompt: "Grab one end of the fabric and fold it."', video: "fabric.mp4" },
  { id: "lamp", label: "Lower Lamp", prompt: 'Text prompt: "Lower the head of the lamp."', video: "lamp.mp4" },
  { id: "laptop", label: "Close Laptop", prompt: 'Text prompt: "Close the lid of the laptop."', video: "laptop.mp4" },
  { id: "microwave", label: "Close Microwave", prompt: 'Text prompt: "Close the door of the microwave."', video: "microwave.mp4" },
  { id: "banana", label: "Pick Banana", prompt: 'Text prompt: "Pick up the banana and put it in the blue plate."', video: "banana.mp4" }
];

// Comparison scenes
var comparisonConfigs = [
  {
    id: "multi",
    buttonSelector: "#comparison-scene-buttons-multi",
    promptSelector: "#comparison-scene-prompt-multi",
    gridSelector: "#comparison-grid-multi",
    scenes: [
      { id: "man_dog", label: "Man & Dog" },
      { id: "man_man", label: "Man & Man" },
      { id: "sealion_ball", label: "Sea Lion & Ball" },
      { id: "tramp_brick", label: "Trampoline & Block" },
      { id: "robot_brick", label: "Robot & Block" },
      { id: "cat_cushion", label: "Cat & Cushion" }
    ]
  },
  {
    id: "single",
    buttonSelector: "#comparison-scene-buttons-single",
    promptSelector: "#comparison-scene-prompt-single",
    gridSelector: "#comparison-grid-single",
    scenes: [
      { id: "lamp_lower", label: "Lamp Lower" },
      { id: "chest_close", label: "Chest Close" },
      { id: "scissor_cross", label: "Scissor Cross" },
      { id: "tiger_walk", label: "Tiger Walk" },
      { id: "tiger_sit", label: "Tiger Sit" }
    ]
  }
];

var scenePrompts = {
  man_dog: 'Text prompt: "A man petting a dog."',
  man_man: 'Text prompt: "Two men are hugging each other."',
  sealion_ball: 'Text prompt: "A sealion nudging a ball."',
  tramp_brick: 'Text prompt: "A block falling on a trampoline."',
  robot_brick: 'Text prompt: "A robot arm is picking up a wooden block."',
  cat_cushion: 'Text prompt: "A cat stepping on a cushion."',
  lamp_lower: 'Text prompt: "The head of a lamp is lowering."',
  chest_close: 'Text prompt: "The lid of a chest is closing shut."',
  scissor_cross: 'Text prompt: "The blades of a pair of scissors is crossing."',
  tiger_walk: 'Text prompt: "The tiger is walking."',
  tiger_sit: 'Text prompt: "The tiger is sitting down."'
};

var methods = [
  { id: "a3d", label: "Animate3D" },
  { id: "aam", label: "AnimateAnyMesh" },
  { id: "md", label: "MotionDreamer (Original)" },
  { id: "md_wan", label: "MotionDreamer (Wan 2.2)" },
  { id: "tc", label: "TrajectoryCrafter" },
  { id: "ours", label: "Ours" }
];

var views = [
  { id: "view1", label: "View 1" },
  { id: "view2", label: "View 2" }
];

var galleryShowcaseScenes = [
  {
    video: "./static/videos/noinput_videos/0001.mp4",
    caption: "Girl in green dress wandering in a bookstore."
  },
  {
    video: "./static/videos/noinput_videos/0002.mp4",
    caption: "Man in brown shirt walking by a house."
  },
  {
    video: "./static/videos/noinput_videos/0003.mp4",
    caption: "Woman in blue dress walking around in living room."
  },
  {
    video: "./static/videos/noinput_videos/0004.mp4",
    caption: "Student walking across the overpass."
  },
  {
    video: "./static/videos/noinput_videos/0005.mp4",
    caption: "On a commercial street of an ancient town."
  }
];

var habitatAgentStages = [
  {
    id: "how-it-works",
    label: "How It Works",
    tag: "MCP Surface",
    start: 3.4,
    end: 10.1,
    title: "From chat to photoreal observation.",
    summary: "One hab_* tool surface lets any MCP client ask for a scene observation. The bridge forwards the call and Habitat-GS returns RGB and depth outputs from the same simulator state.",
    bullets: [
      "Same request surface across Claude, Codex, Feishu, and internal tools.",
      "Scene init and sensor rendering stay inside one continuous loop."
    ],
    statusLabel: "Stage loop: request -> bridge -> observation",
    demoHtml: `
      <div class="agent-showcase agent-showcase--flow-vertical">
        <div class="agent-flow-step">
          <span class="agent-chip">Any MCP Client</span>
          <strong>Claude Code / Codex / Feishu</strong>
          <p>Different entry points, one shared request surface.</p>
        </div>
        <div class="agent-flow-step">
          <span class="agent-chip">Bridge</span>
          <strong>MCP server + HTTP relay</strong>
          <p>Forwards hab_* calls into Habitat-GS.</p>
        </div>
        <div class="agent-flow-step">
          <span class="agent-chip">GS Simulator</span>
          <strong>RGB / depth</strong>
          <p>Returns the observation from the current scene state.</p>
        </div>
      </div>
    `
  },
  {
    id: "basic-capability",
    label: "Basic Capability",
    tag: "Look Around",
    start: 10.1,
    end: 16.6,
    title: "Same behavior from any driver.",
    summary: "Built-in TUI, Claude Code, and Codex all call the same panorama action and get the same room-aware response.",
    bullets: [
      "The driver changes, but the tool call stays the same.",
      "Responses are grounded in the live simulator state."
    ],
    statusLabel: "Stage loop: shared observation behavior",
    demoHtml: `
      <div class="agent-showcase">
        <div class="agent-mini-card">
          <span class="agent-chip">Observation</span>
          <span class="agent-mini-card__header">Room-aware answer</span>
          <div class="agent-terminal-window">
            <div class="agent-terminal-window__bar"><span></span><span></span><span></span></div>
            <div class="agent-terminal-window__body">
              <div class="agent-terminal-line agent-terminal-line--typing"><span class="agent-prompt">&gt;</span>hab_panorama --scan</div>
              <div class="agent-terminal-line">sensor sweep: RGB + depth</div>
              <div class="agent-terminal-line">semantic tags: desk / doorway / hallway</div>
              <div class="agent-terminal-line">free space detected near right-side passage</div>
              <div class="agent-terminal-line">status: observation ready</div>
            </div>
          </div>
          <div class="agent-observation-list">
            <div class="agent-observation-pill">desk and shelving visible ahead</div>
            <div class="agent-observation-pill">dark-framed doorway on the right</div>
            <div class="agent-observation-pill">hallway remains visible in the panorama</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "navloop-triggers",
    label: "NavLoop Triggers",
    tag: "External Trigger",
    start: 16.6,
    end: 23.4,
    title: "Four entry points. Same agent.",
    summary: "CLI and phone chat can both start one running navloop. Status queries keep pointing at that same active loop.",
    bullets: [
      "Telegram and Feishu enter through the same OpenClaw MCP bridge.",
      "Follow-up queries resolve against the active loop id."
    ],
    statusLabel: "Stage loop: external trigger + live status",
    demoHtml: `
      <div class="agent-showcase">
        <div class="agent-mini-card">
          <span class="agent-chip">Telegram / Feishu</span>
          <span class="agent-mini-card__header">Chat clients can launch the same navloop</span>
          <div class="agent-chat-thread">
            <div class="agent-chat-message agent-chat-message--incoming">Start a navloop to the reachable teatable and keep it running.</div>
            <div class="agent-chat-message agent-chat-message--outgoing agent-chat-message--glow">Navloop started. Reachable scene-graph target selected.</div>
            <div class="agent-chat-message agent-chat-message--incoming">Use only reachable targets and avoid blocked areas.</div>
            <div class="agent-chat-message agent-chat-message--outgoing">Confirmed. Navmesh route locked to the reachable teatable.</div>
            <div class="agent-chat-message agent-chat-message--incoming">check navloop status</div>
            <div class="agent-chat-message agent-chat-message--outgoing">running · phase navigating · no stop requested</div>
            <div class="agent-chat-message agent-chat-message--incoming">send the latest progress</div>
            <div class="agent-chat-message agent-chat-message--outgoing">target still active · moving along planned path · telemetry streaming</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "scene-graph",
    label: "Scene Graph",
    tag: "Scene Graph + Navmesh",
    start: 23.4,
    end: 31.0,
    title: "Scene graph query -> reachable target -> collision-free path.",
    summary: "The scene graph chooses a reachable teatable, then the navmesh planner drives execution while RGB, depth, and BEV stay in sync.",
    bullets: [
      "Language instructions become room and object graph queries.",
      "Reachability is checked before the route is executed."
    ],
    statusLabel: "Stage loop: scene graph query + route planning",
    demoHtml: `
      <div class="agent-showcase">
        <div class="agent-mini-card agent-mini-card--viz">
          <span class="agent-chip">Scene Graph</span>
          <span class="agent-mini-card__header">Select one reachable target from the room graph</span>
          <div class="agent-viz-panel agent-scene-viz">
            <div class="agent-scene-viz__query">query: reachable teatable</div>
            <div class="agent-scene-viz__body">
              <div class="agent-scene-list">
                <div class="agent-scene-row">
                  <span class="agent-scene-row__step">01</span>
                  <div class="agent-scene-row__body">
                    <strong>room_1</strong>
                    <span>query current room graph</span>
                  </div>
                </div>
                <div class="agent-scene-row">
                  <span class="agent-scene-row__step">02</span>
                  <div class="agent-scene-row__body">
                    <strong>table cluster</strong>
                    <span>expand candidate objects</span>
                  </div>
                </div>
                <div class="agent-scene-row agent-scene-row--target">
                  <span class="agent-scene-row__step">03</span>
                  <div class="agent-scene-row__body">
                    <strong>reachable teatable</strong>
                    <span>selected target</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

document.addEventListener("DOMContentLoaded", function() {
  initGalleryShowcase();
  
  // Initialize intro video carousel
  initIntroCarousel();

  // Initialize Mesh vs GS comparison
  initVideoComparison();

  // Keep loading placeholders visible until deferred videos are playable.
  initLoadingShellVideos();

  // HabitatAgent stage explorer
  initHabitatAgentDemo();

  // Lazy-load non-hero videos
  initLazyVideos();

  // Defer heavy sections until they are near the viewport
  initDeferredSections();
});

function initGalleryShowcase() {
  var band = document.getElementById("gallery-showcase-band");
  var showcase = document.getElementById("gallery-showcase");
  var preview = showcase ? showcase.querySelector(".gallery-showcase-preview") : null;
  var loadingOverlay = document.getElementById("gallery-showcase-loading");
  var video = document.getElementById("gallery-showcase-video");
  var toggle = document.getElementById("gallery-showcase-toggle");
  var toggleIcon = document.getElementById("gallery-showcase-toggle-icon");
  var toggleLabel = document.getElementById("gallery-showcase-toggle-label");
  var caption = document.getElementById("gallery-showcase-caption");
  var dots = Array.prototype.slice.call(document.querySelectorAll(".gallery-showcase-dot"));

  if (!band || !showcase || !preview || !video || !toggle || !toggleIcon || !toggleLabel || !caption || !dots.length) {
    return;
  }

  var currentIndex = 0;
  var expanded = false;
  var pendingAutoplay = false;
  var loadRequestId = 0;

  function applyPlaybackRate() {
    video.defaultPlaybackRate = 0.45;
    video.playbackRate = 0.45;
  }

  function setLoadingPlaceholder(isLoading) {
    if (loadingOverlay) {
      loadingOverlay.classList.toggle("is-visible", isLoading);
    }
    showcase.classList.toggle("is-video-loading", isLoading);
  }

  function playCurrentVideo() {
    if (!pendingAutoplay) return;
    pendingAutoplay = false;

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function() {});
    }
  }

  function handleVideoReady(requestId) {
    if (requestId !== loadRequestId) return;
    setLoadingPlaceholder(false);
    applyPlaybackRate();
    playCurrentVideo();
  }

  function waitForVideoReady(requestId) {
    if (video.readyState >= 2) {
      handleVideoReady(requestId);
      return;
    }

    setLoadingPlaceholder(true);

    var done = false;

    function cleanup() {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
    }

    function onReady() {
      if (done) return;
      done = true;
      cleanup();
      handleVideoReady(requestId);
    }

    function onError() {
      if (done) return;
      done = true;
      cleanup();
      pendingAutoplay = false;
      setLoadingPlaceholder(false);
    }

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError);
  }

  function updateChrome() {
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.setAttribute("aria-label", expanded ? "Collapse gallery preview" : "Expand gallery preview");
    toggleIcon.textContent = expanded ? "-" : "+";
    toggleLabel.textContent = expanded ? "Collapse" : "Expand";
    band.classList.toggle("is-expanded", expanded);
    showcase.classList.toggle("is-expanded", expanded);
  }

  function updateScene(index, shouldPlay) {
    var scene = galleryShowcaseScenes[index];
    if (!scene) return;

    currentIndex = index;
    caption.textContent = scene.caption;

    dots.forEach(function(dot) {
      var dotIndex = parseInt(dot.dataset.index, 10);
      var isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    pendingAutoplay = shouldPlay;
    var requestId = ++loadRequestId;

    if (video.getAttribute("src") !== scene.video) {
      video.pause();
      setLoadingPlaceholder(true);
      video.setAttribute("src", scene.video);
      video.load();
    }

    applyPlaybackRate();
    waitForVideoReady(requestId);
  }

  function expandShowcase() {
    expanded = true;
    updateChrome();
    updateScene(currentIndex, true);
  }

  function collapseShowcase() {
    expanded = false;
    updateChrome();
  }

  toggle.addEventListener("click", function() {
    if (expanded) {
      collapseShowcase();
    } else {
      expandShowcase();
    }
  });

  dots.forEach(function(dot) {
    dot.addEventListener("click", function() {
      var index = parseInt(dot.dataset.index, 10);
      if (Number.isNaN(index)) return;
      updateScene(index, true);
    });
  });

  video.addEventListener("loadedmetadata", applyPlaybackRate);

  updateScene(0, true);
  updateChrome();
}

function initHabitatAgentDemo() {
  var expandBtn = document.getElementById("agent-demo-expand");
  var previewVideo = document.getElementById("agent-video-preview");
  var modal = document.getElementById("agent-demo-modal");
  var sidebar = modal ? modal.querySelector(".agent-demo-sidebar") : null;
  var closeBtn = document.getElementById("agent-demo-close");
  var stageMarkers = document.getElementById("agent-demo-stage-markers");
  var stageShell = document.getElementById("agent-stage-shell");
  var stageStatus = document.getElementById("agent-stage-status");
  var stageStatusLabel = document.getElementById("agent-demo-stage-status-label");
  var stageVideo = document.getElementById("agent-video-stage");
  var stageKicker = document.getElementById("agent-demo-stage-kicker");
  var stageTitle = document.getElementById("agent-demo-stage-title");
  var stageSummary = document.getElementById("agent-demo-stage-summary");
  var stageBullets = document.getElementById("agent-demo-stage-bullets");
  var stageShowcase = document.getElementById("agent-demo-stage-showcase");
  var stageTag = document.getElementById("agent-demo-stage-tag");
  var progressBar = document.getElementById("agent-demo-progress");
  var stageInfoPanel = stageKicker ? stageKicker.closest(".agent-demo-sidebar__panel") : null;

  if (!expandBtn || !previewVideo || !modal || !sidebar || !closeBtn || !stageMarkers || !stageShell || !stageStatus || !stageVideo || !stageKicker || !stageTitle || !stageSummary || !stageBullets || !stageShowcase || !stageTag || !progressBar || !stageInfoPanel) {
    return;
  }

  var activeStage = habitatAgentStages[0];
  var modalOpen = false;
  var pendingStageStart = null;

  function ensureVideoSource(video) {
    var source = video.querySelector("source");
    if (!source) return;
    var dataSrc = source.getAttribute("data-src");
    if (dataSrc && !source.getAttribute("src")) {
      source.setAttribute("src", dataSrc);
      video.load();
    }
  }

  function playVideo(video) {
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function() {});
    }
  }

  function formatIndex(index) {
    return index < 9 ? "0" + (index + 1) : String(index + 1);
  }

  function findStageById(stageId) {
    return habitatAgentStages.find(function(stage) {
      return stage.id === stageId;
    }) || habitatAgentStages[0];
  }

  function findStageForTime(time) {
    for (var i = 0; i < habitatAgentStages.length; i += 1) {
      var stage = habitatAgentStages[i];
      if (time >= stage.start && time < stage.end) {
        return stage;
      }
    }
    if (time < habitatAgentStages[0].start) {
      return habitatAgentStages[0];
    }
    return habitatAgentStages[habitatAgentStages.length - 1];
  }

  function updateProgress() {
    if (!activeStage) return;
    var ratio = 0;
    if (stageVideo.readyState >= 1) {
      var elapsed = stageVideo.currentTime - activeStage.start;
      var duration = activeStage.end - activeStage.start;
      ratio = Math.min(1, Math.max(0, elapsed / duration));
    }
    progressBar.style.transform = "scaleX(" + ratio + ")";
  }

  function applyPendingStageStart() {
    if (pendingStageStart === null || stageVideo.readyState < 1) {
      return;
    }
    try {
      stageVideo.currentTime = pendingStageStart;
      pendingStageStart = null;
    } catch (error) {
      // Ignore seek failures until metadata is fully ready.
    }
  }

  function syncStagePlayback() {
    if (!activeStage) return;

    ensureVideoSource(stageVideo);
    pendingStageStart = activeStage.start + 0.02;
    stageStatus.textContent = "Loading stage playback...";
    stageShell.classList.add("is-loading");
    applyPendingStageStart();

    if (stageVideo.readyState >= 2) {
      stageShell.classList.remove("is-loading");
      playVideo(stageVideo);
    }

    updateProgress();
  }

  function updateStageButtons() {
    var markers = stageMarkers.querySelectorAll("[data-agent-stage]");
    markers.forEach(function(button) {
      button.classList.toggle("is-active", button.dataset.agentStage === activeStage.id);
    });
  }

  function syncSidebarInfoHeight() {
    stageInfoPanel.style.height = "auto";
    sidebar.style.removeProperty("--agent-demo-sidebar-top-height");

    var nextHeight = Math.ceil(stageInfoPanel.scrollHeight) + 2;
    sidebar.style.setProperty("--agent-demo-sidebar-top-height", nextHeight + "px");
  }

  function requestSidebarInfoHeightSync() {
    window.requestAnimationFrame(syncSidebarInfoHeight);
  }

  function renderStage(stage, options) {
    activeStage = stage;
    stageKicker.textContent = stage.label;
    stageTitle.textContent = stage.title;
    stageSummary.textContent = stage.summary;
    stageTag.textContent = stage.tag;
    stageStatusLabel.textContent = stage.statusLabel;
    stageBullets.innerHTML = stage.bullets.map(function(item) {
      return "<li>" + item + "</li>";
    }).join("");
    stageShowcase.innerHTML = stage.demoHtml;

    updateStageButtons();
    requestSidebarInfoHeightSync();
    updateProgress();

    if (!options || options.syncPlayback !== false) {
      syncStagePlayback();
    }
  }

  function cycleStage(direction) {
    var currentIndex = habitatAgentStages.findIndex(function(stage) {
      return stage.id === activeStage.id;
    });
    var nextIndex = (currentIndex + direction + habitatAgentStages.length) % habitatAgentStages.length;
    renderStage(habitatAgentStages[nextIndex]);
  }

  function openModal() {
    modalOpen = true;
    var stageFromPreview = findStageForTime(previewVideo.currentTime || 0);

    document.body.classList.add("agent-demo-modal-open");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    expandBtn.setAttribute("aria-expanded", "true");

    previewVideo.pause();
    renderStage(stageFromPreview);
    closeBtn.focus();
  }

  function closeModal() {
    modalOpen = false;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    expandBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("agent-demo-modal-open");
    stageVideo.pause();

    if (previewVideo.readyState >= 2) {
      playVideo(previewVideo);
    }
  }

  habitatAgentStages.forEach(function(stage, index) {
    var marker = document.createElement("button");
    marker.type = "button";
    marker.className = "agent-demo-player__stage";
    marker.dataset.agentStage = stage.id;
    marker.innerHTML =
      '<span class="agent-demo-player__stage-index">' + formatIndex(index) + '</span>' +
      '<span class="agent-demo-player__stage-label">' + stage.label + '</span>';
    stageMarkers.appendChild(marker);
  });

  renderStage(habitatAgentStages[0], { syncPlayback: false });

  expandBtn.addEventListener("click", openModal);

  modal.addEventListener("click", function(event) {
    var closeTarget = event.target.closest("[data-agent-close]");
    if (closeTarget) {
      closeModal();
    }
  });

  stageMarkers.addEventListener("click", function(event) {
    var button = event.target.closest("[data-agent-stage]");
    if (!button) return;
    renderStage(findStageById(button.dataset.agentStage));
  });

  document.addEventListener("keydown", function(event) {
    if (!modalOpen) return;
    if (event.key === "Escape") {
      closeModal();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      cycleStage(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      cycleStage(-1);
    }
  });

  window.addEventListener("resize", function() {
    requestSidebarInfoHeightSync();
  });

  stageVideo.addEventListener("loadedmetadata", function() {
    applyPendingStageStart();
    updateProgress();
  });

  stageVideo.addEventListener("loadeddata", function() {
    stageShell.classList.remove("is-loading");
    applyPendingStageStart();
    if (modalOpen) {
      playVideo(stageVideo);
    }
    updateProgress();
  });

  stageVideo.addEventListener("canplay", function() {
    stageShell.classList.remove("is-loading");
    applyPendingStageStart();
    if (modalOpen) {
      playVideo(stageVideo);
    }
  });

  stageVideo.addEventListener("timeupdate", function() {
    if (!activeStage) return;

    if (stageVideo.currentTime >= activeStage.end - 0.04 || stageVideo.currentTime < activeStage.start - 0.15) {
      pendingStageStart = activeStage.start + 0.02;
      applyPendingStageStart();
      if (modalOpen) {
        playVideo(stageVideo);
      }
    }

    updateProgress();
  });

  stageVideo.addEventListener("error", function() {
    stageStatus.textContent = "Unable to load stage playback right now.";
    stageShell.classList.add("is-loading");
  });
}

function initVideoComparison() {
  var container = document.getElementById('video-comparison');
  if (!container) return;

  var items = container.querySelectorAll('.video-comparison-item');
  if (items.length === 0) return;

  // Magnifier settings
  var MAGNIFIER_RADIUS = 80; // px – radius of the magnified circle
  var ZOOM = 2;              // magnification factor
  var CANVAS_SIZE = MAGNIFIER_RADIUS * 2;

  function syncPlaybackState(item, video) {
    if (!video) return;
    item.classList.toggle('is-paused', video.paused);
  }

  function toggleVideoPlayback(item) {
    var video = item.querySelector('video');
    if (!video) return;

    if (video.paused) {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function() {});
      }
    } else {
      video.pause();
    }

    syncPlaybackState(item, video);
  }

  // Click-to-emphasize and pause/play
  items.forEach(function(item) {
    var video = item.querySelector('video');

    if (video) {
      syncPlaybackState(item, video);
      video.addEventListener('play', function() {
        syncPlaybackState(item, video);
      });
      video.addEventListener('pause', function() {
        syncPlaybackState(item, video);
      });
    }

    item.addEventListener('click', function() {
      if (!item.classList.contains('active')) {
        items.forEach(function(it) {
          it.classList.remove('active');
        });
        item.classList.add('active');
        container.classList.add('has-active');
      }

      toggleVideoPlayback(item);
    });
  });

  // Magnifier for each item
  items.forEach(function(item) {
    var mediaWrap = item.querySelector('.video-comparison-media');
    var video = mediaWrap.querySelector('video');
    var canvas = mediaWrap.querySelector('.magnifier-canvas');
    if (!video || !canvas) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    canvas.style.width = CANVAS_SIZE + 'px';
    canvas.style.height = CANVAS_SIZE + 'px';
    var ctx = canvas.getContext('2d');

    mediaWrap.addEventListener('mousemove', function(e) {
      var rect = mediaWrap.getBoundingClientRect();
      var mouseX = e.clientX - rect.left;
      var mouseY = e.clientY - rect.top;

      // Position canvas centred on cursor
      canvas.style.left = (mouseX - MAGNIFIER_RADIUS) + 'px';
      canvas.style.top = (mouseY - MAGNIFIER_RADIUS) + 'px';
      canvas.style.display = 'block';

      // Map mouse position to video intrinsic coordinates
      var vidW = video.videoWidth;
      var vidH = video.videoHeight;
      if (!vidW || !vidH) return;

      var scaleX = vidW / rect.width;
      var scaleY = vidH / rect.height;

      var srcX = mouseX * scaleX;
      var srcY = mouseY * scaleY;

      // Source rectangle in video coordinates
      var srcRadius = MAGNIFIER_RADIUS * scaleX; // approximate
      var sx = srcX - srcRadius / ZOOM;
      var sy = srcY - (MAGNIFIER_RADIUS * scaleY) / ZOOM;
      var sw = (srcRadius * 2) / ZOOM;
      var sh = ((MAGNIFIER_RADIUS * scaleY) * 2) / ZOOM;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.save();

      // Clip to circle
      ctx.beginPath();
      ctx.arc(MAGNIFIER_RADIUS, MAGNIFIER_RADIUS, MAGNIFIER_RADIUS, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw magnified video
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Glass highlight – subtle radial gradient overlay
      var grad = ctx.createRadialGradient(
        MAGNIFIER_RADIUS * 0.65, MAGNIFIER_RADIUS * 0.45, MAGNIFIER_RADIUS * 0.15,
        MAGNIFIER_RADIUS, MAGNIFIER_RADIUS, MAGNIFIER_RADIUS
      );
      grad.addColorStop(0, 'rgba(255,255,255,0.18)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
      grad.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    });

    mediaWrap.addEventListener('mouseleave', function() {
      canvas.style.display = 'none';
    });
  });
}

function initIntroCarousel() {
  var track = document.querySelector('.intro-carousel-track');
  var slides = document.querySelectorAll('.intro-carousel-slide');
  var prevBtn = document.getElementById('intro-carousel-prev');
  var nextBtn = document.getElementById('intro-carousel-next');
  var dots = document.querySelectorAll('.carousel-dot');
  
  if (!track || slides.length === 0) return;
  
  var currentIndex = 0;
  var totalSlides = slides.length;

  function ensureVideoSource(video) {
    var source = video.querySelector('source');
    if (!source) return;
    var dataSrc = source.getAttribute('data-src');
    if (dataSrc && !source.getAttribute('src')) {
      source.setAttribute('src', dataSrc);
      video.load();
    }
  }

  function clearVideoSource(video) {
    var source = video.querySelector('source');
    if (!source) return;
    if (source.getAttribute('src')) {
      source.removeAttribute('src');
      video.load();
    }
  }

  function activateSlideVideo(slide) {
    var video = slide.querySelector('video');
    if (!video) return;
    ensureVideoSource(video);
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function() {});
    }
  }

  function deactivateSlideVideo(slide) {
    var video = slide.querySelector('video');
    if (!video) return;
    video.pause();
    clearVideoSource(video);
  }

  function syncVideoPlayback() {
    slides.forEach(function(slide, i) {
      if (i === currentIndex) {
        activateSlideVideo(slide);
      } else {
        deactivateSlideVideo(slide);
      }
    });
  }
  
  function updateSlideClasses() {
    slides.forEach(function(slide, i) {
      slide.classList.remove('active', 'prev', 'next');
      
      if (i === currentIndex) {
        slide.classList.add('active');
      } else if (i === (currentIndex - 1 + totalSlides) % totalSlides) {
        slide.classList.add('prev');
      } else if (i === (currentIndex + 1) % totalSlides) {
        slide.classList.add('next');
      }
    });
  }
  
  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentIndex = index;
    
    updateSlideClasses();
    syncVideoPlayback();
    
    // Update dots
    dots.forEach(function(dot, i) {
      dot.classList.toggle('active', i === currentIndex);
    });

    // Update per-slide description
    var descItems = document.querySelectorAll('.nav-episode-desc-item');
    descItems.forEach(function(item, i) {
      item.classList.toggle('active', i === currentIndex);
    });
  }
  
  // Initialize
  goToSlide(0);
  
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      goToSlide(currentIndex - 1);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      goToSlide(currentIndex + 1);
    });
  }
  
  // Click on slide to go to it
  slides.forEach(function(slide, i) {
    slide.addEventListener('click', function() {
      if (i !== currentIndex) {
        goToSlide(i);
      }
    });
  });
  
  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      var index = parseInt(dot.dataset.index, 10);
      goToSlide(index);
    });
  });
  
}

function initLazyVideos() {
  var lazyVideos = document.querySelectorAll('video[data-lazy="true"]');
  if (!lazyVideos.length) return;

  function loadVideo(video) {
    var source = video.querySelector('source');
    if (source) {
      var dataSrc = source.getAttribute('data-src');
      if (dataSrc && !source.getAttribute('src')) {
        source.setAttribute('src', dataSrc);
      }
    } else {
      var dataSrc = video.getAttribute('data-src');
      if (dataSrc && !video.getAttribute('src')) {
        video.setAttribute('src', dataSrc);
      }
    }
    video.load();
    if (video.autoplay) {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function() {});
      }
    }
  }

  if (!("IntersectionObserver" in window)) {
    lazyVideos.forEach(loadVideo);
    return;
  }

  var observer = new IntersectionObserver(function(entries, obs) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      loadVideo(entry.target);
      obs.unobserve(entry.target);
    });
  }, { rootMargin: "200px 0px", threshold: 0.01 });

  lazyVideos.forEach(function(video) {
    observer.observe(video);
  });
}

function initLoadingShellVideos() {
  var shellVideos = document.querySelectorAll('video[data-loading-shell]');
  if (!shellVideos.length) return;

  shellVideos.forEach(function(video) {
    var shell = document.getElementById(video.dataset.loadingShell);
    var status = video.dataset.loadingStatus ? document.getElementById(video.dataset.loadingStatus) : null;
    var errorMessage = video.dataset.loadingError || "Unable to load this video right now.";

    if (!shell) {
      return;
    }

    var resolved = false;

    function cleanup() {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
    }

    function onReady() {
      if (resolved) return;
      resolved = true;
      cleanup();
      shell.classList.remove("is-loading");
    }

    function onError() {
      if (resolved) return;
      resolved = true;
      cleanup();
      if (status) {
        status.textContent = errorMessage;
      }
      shell.classList.add("is-loading");
    }

    if (video.readyState >= 2) {
      shell.classList.remove("is-loading");
      return;
    }

    shell.classList.add("is-loading");
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError);
  });
}

function initDeferredSections() {
  var robotSection = document.getElementById("robot");
  var comparisonsSection = document.getElementById("comparisons");
  var robotInitialized = false;
  var comparisonsInitialized = false;

  function startRobot() {
    if (robotInitialized) return;
    robotInitialized = true;
    initRobotSection();
  }

  function startComparisons() {
    if (comparisonsInitialized) return;
    comparisonsInitialized = true;
    comparisonConfigs.forEach(function(config) {
      initComparisonSection(config);
    });
  }

  if (!("IntersectionObserver" in window)) {
    startRobot();
    startComparisons();
    return;
  }

  var observer = new IntersectionObserver(function(entries, obs) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      if (entry.target === robotSection) {
        startRobot();
        obs.unobserve(entry.target);
      }
      if (entry.target === comparisonsSection) {
        startComparisons();
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: "200px 0px", threshold: 0.01 });

  if (robotSection) {
    observer.observe(robotSection);
  }
  if (comparisonsSection) {
    observer.observe(comparisonsSection);
  }
}

function initRobotSection() {
  var buttonContainer = document.getElementById("robot-scene-buttons");
  var promptEl = document.getElementById("robot-scene-prompt");
  var videoEl = document.getElementById("robot-video");
  
  if (!buttonContainer || !videoEl) return;
  
  // Create buttons
  robotScenes.forEach(function(scene, index) {
    var btn = document.createElement("button");
    btn.className = "button is-light comparison-scene-button";
    btn.textContent = scene.label;
    btn.dataset.scene = scene.id;
    if (index === 0) btn.classList.add("is-primary");
    buttonContainer.appendChild(btn);
  });
  
  // Button click handler
  buttonContainer.addEventListener("click", function(e) {
    if (e.target.classList.contains("comparison-scene-button")) {
      var sceneId = e.target.dataset.scene;
      selectRobotScene(sceneId);
    }
  });
  
  // Select first scene
  selectRobotScene(robotScenes[0].id);
  
  function selectRobotScene(sceneId) {
    var scene = robotScenes.find(function(s) { return s.id === sceneId; });
    if (!scene) return;
    
    // Update button states
    var buttons = buttonContainer.querySelectorAll(".comparison-scene-button");
    buttons.forEach(function(btn) {
      btn.classList.remove("is-primary");
      if (btn.dataset.scene === sceneId) {
        btn.classList.add("is-primary");
      }
    });
    
    // Update prompt
    if (promptEl) {
      promptEl.textContent = scene.prompt;
    }
    
    // Update video
    var source = videoEl.querySelector("source");
    if (source) {
      source.src = "./static/videos/robot_demo/" + scene.video;
    } else {
      videoEl.src = "./static/videos/robot_demo/" + scene.video;
    }
    videoEl.load();
    videoEl.play().catch(function() {});
  }
}

function initComparisonSection(config) {
  var buttonContainer = document.querySelector(config.buttonSelector);
  var gridContainer = document.querySelector(config.gridSelector);
  var promptEl = document.querySelector(config.promptSelector);
  
  if (!buttonContainer || !gridContainer) return;
  
  // Create buttons
  config.scenes.forEach(function(scene, index) {
    var btn = document.createElement("button");
    btn.className = "button is-light comparison-scene-button";
    btn.textContent = scene.label;
    btn.dataset.scene = scene.id;
    if (index === 0) btn.classList.add("is-primary");
    buttonContainer.appendChild(btn);
  });
  
  // Button click handler
  buttonContainer.addEventListener("click", function(e) {
    if (e.target.classList.contains("comparison-scene-button")) {
      var sceneId = e.target.dataset.scene;
      selectComparisonScene(sceneId);
    }
  });
  
  // Select first scene
  if (config.scenes.length > 0) {
    selectComparisonScene(config.scenes[0].id);
  }
  
  function selectComparisonScene(sceneId) {
    // Update button states
    var buttons = buttonContainer.querySelectorAll(".comparison-scene-button");
    buttons.forEach(function(btn) {
      btn.classList.remove("is-primary");
      if (btn.dataset.scene === sceneId) {
        btn.classList.add("is-primary");
      }
    });
    
    // Update prompt
    if (promptEl && scenePrompts[sceneId]) {
      promptEl.textContent = scenePrompts[sceneId];
    }
    
    // Clear and rebuild grid
    gridContainer.innerHTML = "";
    gridContainer.style.gridTemplateColumns = "120px repeat(" + methods.length + ", minmax(0, 1fr))";
    
    // Add view rows with videos
    views.forEach(function(view) {
      // View label
      var viewLabel = document.createElement("div");
      viewLabel.className = "comparison-view-label";
      viewLabel.textContent = view.label;
      gridContainer.appendChild(viewLabel);
      
      // Videos for each method
      methods.forEach(function(method) {
        var wrapper = document.createElement("div");
        wrapper.className = "comparison-video-wrapper";
        
        var video = document.createElement("video");
        video.className = "comparison-video";
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute("muted", "muted");
        video.setAttribute("loop", "loop");
        video.setAttribute("autoplay", "autoplay");
        video.setAttribute("playsinline", "playsinline");
        
        var source = document.createElement("source");
        source.src = "./static/videos/comparison/" + method.id + "/" + sceneId + "/" + view.id + ".mp4";
        source.type = "video/mp4";
        
        video.appendChild(source);
        wrapper.appendChild(video);
        gridContainer.appendChild(wrapper);
        
        video.play().catch(function() {});
      });
    });
    
    // Add bottom corner spacer
    var bottomCorner = document.createElement("div");
    bottomCorner.className = "comparison-bottom-corner";
    gridContainer.appendChild(bottomCorner);
    
    // Add method labels
    methods.forEach(function(method) {
      var methodLabel = document.createElement("div");
      methodLabel.className = "comparison-method-label";
      methodLabel.textContent = method.label;
      gridContainer.appendChild(methodLabel);
    });
  }
}
