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

document.addEventListener("DOMContentLoaded", function() {
  initGalleryShowcase();
  
  // Initialize intro video carousel
  initIntroCarousel();

  // Initialize Mesh vs GS comparison
  initVideoComparison();

  // Lazy-load non-hero videos
  initLazyVideos();

  // Defer heavy sections until they are near the viewport
  initDeferredSections();
});

function initGalleryShowcase() {
  var band = document.getElementById("gallery-showcase-band");
  var showcase = document.getElementById("gallery-showcase");
  var preview = showcase ? showcase.querySelector(".gallery-showcase-preview") : null;
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
  var defaultPreviewSrc = "./static/videos/noinput_videos/preview.png";
  var loadingPreviewSrc = "./static/images/loading.svg";
  var defaultPreviewAlt = "Preview image for the Habitat-GS gallery scenes";

  function applyPlaybackRate() {
    video.defaultPlaybackRate = 0.45;
    video.playbackRate = 0.45;
  }

  function setLoadingPlaceholder(isLoading) {
    preview.setAttribute("src", isLoading ? loadingPreviewSrc : defaultPreviewSrc);
    preview.setAttribute("alt", isLoading ? "Loading gallery scene" : defaultPreviewAlt);
    preview.classList.toggle("is-loading", isLoading);
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
    if (!expanded) {
      setLoadingPlaceholder(false);
      return;
    }

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
      if (expanded) {
        setLoadingPlaceholder(true);
      }
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
    pendingAutoplay = false;
    video.pause();
    if (video.currentTime) {
      video.currentTime = 0;
    }
    setLoadingPlaceholder(false);
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
      if (!expanded) return;
      var index = parseInt(dot.dataset.index, 10);
      if (Number.isNaN(index)) return;
      updateScene(index, true);
    });
  });

  video.addEventListener("loadedmetadata", applyPlaybackRate);

  updateScene(0, false);
  updateChrome();
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
