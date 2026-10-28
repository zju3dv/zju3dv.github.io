(() => {
  "use strict";

  const DATA = window.PAGE_DATA;
  const GALLERY_ROWS = [2, 3, 3];
  const GALLERY_HOVER_ZOOM = 1.15;
  const COMPARISON_FPS = 10;

  const el = (tag, className, attrs = {}) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    }
    return node;
  };

  const prettyName = (name) =>
    name
      .replace(/_cropped$/, "")
      .replace(/-+$/, "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const tryPlay = (video) => {
    const p = video.play();
    if (p && p.catch) {
      p.catch((err) => {
        // Audible autoplay is blocked until the visitor interacts with the page; fall back to muted.
        if (err.name === "NotAllowedError" && !video.muted && "audioFallback" in video.dataset) {
          video.muted = true;
          video.dispatchEvent(new Event("autoplaymuted"));
          tryPlay(video);
        }
      });
    }
  };

  // Lazily attaches the source when a video approaches the viewport and pauses it when off-screen.
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      for (const { target: video, isIntersecting } of entries) {
        if (isIntersecting) {
          if (!video.getAttribute("src") && video.dataset.src) {
            video.src = video.dataset.src;
          }
          if (!video.dataset.userPaused) tryPlay(video);
        } else if (!video.paused) {
          video.dataset.autoPaused = "1";
          video.pause();
        }
      }
    },
    { rootMargin: "120px 0px", threshold: 0.15 }
  );

  const trackUserPause = (video) => {
    video.addEventListener("pause", () => {
      if (video.dataset.autoPaused) delete video.dataset.autoPaused;
      else if (document.visibilityState === "visible" && video.isConnected) video.dataset.userPaused = "1";
    });
    video.addEventListener("play", () => delete video.dataset.userPaused);
  };

  function buildSpeedToggle(video, label, startFast = false) {
    const btn = el("button", "speed-toggle", { type: "button", "aria-label": `Play ${label} at 2x speed` });
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5v11l7-5.5zM12 6.5v11l7-5.5z"/></svg><span>×2</span>';
    const setFast = (fast) => {
      btn.setAttribute("aria-pressed", String(fast));
      // defaultPlaybackRate survives src changes, which reset playbackRate.
      video.defaultPlaybackRate = fast ? 2 : 1;
      video.playbackRate = fast ? 2 : 1;
    };
    btn.addEventListener("click", () => setFast(btn.getAttribute("aria-pressed") !== "true"));
    setFast(startFast);
    return btn;
  }

  /* ---------- Gallery ---------- */

  function buildGallery() {
    const root = document.getElementById("gallery-grid");
    if (!root) return;
    const items = [...DATA.gallery].sort((a, b) => b.duration - a.duration);

    const rows = [];
    let cursor = 0;
    for (const size of GALLERY_ROWS) {
      if (cursor < items.length) rows.push(items.slice(cursor, (cursor += size)));
    }
    while (cursor < items.length) rows.push(items.slice(cursor, (cursor += 3)));

    // Every row after the first shares the widest later row's column count, so a short trailing
    // row keeps the same tile size (centred) instead of stretching.
    const cols = Math.max(...rows.slice(1).map((r) => r.length), 1);
    rows.forEach((rowItems, i) => {
      const row = el("div", "g-row");
      row.style.setProperty("--cols", i === 0 ? rowItems.length : cols);
      rowItems.forEach((item) => row.append(buildGalleryTile(item)));
      root.append(row);
    });

    // Hovered videos all grow to the same width: that of a first-row video enlarged by GALLERY_HOVER_ZOOM.
    const tiles = [...root.querySelectorAll(".g-item")];
    const mediaWidth = (tile) => tile.querySelector(".g-media").offsetWidth;
    const sizeHover = () => {
      const target = mediaWidth(tiles[0]) * GALLERY_HOVER_ZOOM;
      for (const tile of tiles) {
        const w = mediaWidth(tile);
        if (w) tile.style.setProperty("--hover-scale", (target / w).toFixed(4));
      }
    };
    if (tiles.length) new ResizeObserver(sizeHover).observe(root);
  }

  function buildGalleryTile(item) {
    const tile = el("figure", "g-item");

    const title = prettyName(item.name);
    const media = el("div", "g-media");
    const video = el("video", "", {
      muted: "",
      loop: "",
      playsinline: "",
      preload: "none",
      poster: item.poster,
      "data-src": item.video,
      "aria-label": title,
    });
    video.muted = true;

    media.append(video, buildSpeedToggle(video, title, true), buildProgressBar(tile, video, item, title));
    visibilityObserver.observe(video);

    const caption = el("figcaption", "g-caption");
    caption.append(el("span", "g-title", { text: title }));
    const prompt = el("p", "g-prompt", { tabindex: "0", text: item.prompt });
    const promptWrap = el("div", "g-prompt-wrap");
    promptWrap.append(prompt);
    caption.append(promptWrap);

    tile.append(media, caption);
    return tile;
  }

  const formatTime = (s) => {
    const t = Math.max(0, Math.floor(s || 0));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  };

  function buildProgressBar(tile, video, item, title) {
    const wrap = el("div", "g-progress");
    const time = el("span", "g-time", { "aria-hidden": "true" });
    const bar = el("div", "g-bar", {
      role: "slider",
      tabindex: "0",
      "aria-label": `${title} playback position`,
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": "0",
    });
    const buffered = el("span", "g-bar-buffered");
    const fill = el("span", "g-bar-fill");
    bar.append(buffered, fill);
    wrap.append(time, bar);

    const total = () => (Number.isFinite(video.duration) && video.duration > 0 ? video.duration : item.duration);

    const render = () => {
      const d = total();
      const frac = Math.min(1, video.currentTime / d || 0);
      fill.style.transform = `scaleX(${frac})`;
      const b = video.buffered;
      buffered.style.transform = `scaleX(${b.length ? Math.min(1, b.end(b.length - 1) / d) : 0})`;
      time.textContent = `${formatTime(video.currentTime)} / ${formatTime(d)}`;
      bar.setAttribute("aria-valuenow", String(Math.round(frac * 100)));
      bar.setAttribute("aria-valuetext", time.textContent);
    };

    // Only animate while the bar is visible; timeupdate alone is too coarse for a smooth fill.
    let raf = 0;
    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    tile.addEventListener("mouseenter", () => {
      if (!raf) loop();
    });
    tile.addEventListener("mouseleave", () => {
      cancelAnimationFrame(raf);
      raf = 0;
    });
    video.addEventListener("timeupdate", () => {
      if (!raf) render();
    });
    video.addEventListener("loadedmetadata", render);

    const seekTo = (clientX) => {
      const rect = bar.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      if (video.readyState >= 1) video.currentTime = frac * total();
      render();
    };
    bar.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      wrap.classList.add("is-seeking");
      seekTo(e.clientX);
    });
    bar.addEventListener("pointermove", (e) => {
      if (bar.hasPointerCapture(e.pointerId)) seekTo(e.clientX);
    });
    const endSeek = (e) => {
      if (bar.hasPointerCapture(e.pointerId)) bar.releasePointerCapture(e.pointerId);
      wrap.classList.remove("is-seeking");
    };
    bar.addEventListener("pointerup", endSeek);
    bar.addEventListener("pointercancel", endSeek);
    bar.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      video.currentTime = Math.min(total(), Math.max(0, video.currentTime + (e.key === "ArrowRight" ? 5 : -5)));
      render();
    });

    render();
    return wrap;
  }

  /* ---------- Comparison viewers ---------- */

  // Frame-accurate scrubber: dragging pauses the video on the frame under the pointer.
  function buildScrubber(video, fps) {
    const wrap = el("div", "scrub");
    const play = el("button", "scrub-play", { type: "button", "aria-label": "Pause" });
    const track = el("div", "scrub-track", {
      role: "slider",
      tabindex: "0",
      "aria-label": "Frame position",
      "aria-valuemin": "1",
      "aria-valuemax": "1",
      "aria-valuenow": "1",
    });
    const buffered = el("span", "scrub-buffered");
    const fill = el("span", "scrub-fill");
    const handle = el("span", "scrub-handle");
    track.append(buffered, fill, handle);
    wrap.append(play, track);

    const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke-width="1.6" d="M8 5.5v13l10.5-6.5z"/></svg>';
    const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5v13M15.5 5.5v13"/></svg>';

    const frameCount = () => (Number.isFinite(video.duration) && video.duration > 0 ? Math.max(1, Math.round(video.duration * fps)) : 0);
    const frameAt = (t) => Math.min(Math.max(frameCount() - 1, 0), Math.floor(t * fps + 1e-3));

    let pending = -1;
    const render = () => {
      const n = frameCount();
      const f = pending >= 0 ? pending : frameAt(video.currentTime);
      const frac = n > 1 ? f / (n - 1) : 0;
      fill.style.transform = `scaleX(${frac})`;
      handle.style.left = `${frac * 100}%`;
      const b = video.buffered;
      buffered.style.transform = `scaleX(${n && b.length ? Math.min(1, b.end(b.length - 1) / video.duration) : 0})`;
      track.setAttribute("aria-valuemax", String(Math.max(n, 1)));
      track.setAttribute("aria-valuenow", String(f + 1));
      track.setAttribute("aria-valuetext", n ? `Frame ${f + 1} of ${n}` : "Not loaded");
    };
    const syncPlay = () => {
      play.innerHTML = video.paused ? PLAY_ICON : PAUSE_ICON;
      play.setAttribute("aria-label", video.paused ? "Play" : "Pause");
    };

    let raf = 0;
    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    video.addEventListener("play", () => {
      syncPlay();
      if (!raf) loop();
    });
    video.addEventListener("pause", () => {
      syncPlay();
      cancelAnimationFrame(raf);
      raf = 0;
      render();
    });
    ["loadedmetadata", "seeked", "progress", "emptied"].forEach((type) => video.addEventListener(type, render));

    const goToFrame = (f) => {
      const n = frameCount();
      if (!n) return;
      f = Math.min(n - 1, Math.max(0, f));
      if (!video.paused) video.pause();
      pending = f;
      // Seeking to the middle of the frame avoids landing on the previous one due to rounding.
      video.currentTime = Math.min(video.duration, (f + 0.5) / fps);
      render();
    };
    video.addEventListener("seeked", () => {
      pending = -1;
    });

    const frameFromPointer = (clientX) => {
      const rect = track.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return Math.round(frac * (frameCount() - 1));
    };
    let dragId = null;
    track.addEventListener("pointerdown", (e) => {
      if (!frameCount()) return;
      e.preventDefault();
      dragId = e.pointerId;
      track.setPointerCapture(e.pointerId);
      wrap.classList.add("is-dragging");
      goToFrame(frameFromPointer(e.clientX));
    });
    track.addEventListener("pointermove", (e) => {
      if (e.pointerId !== dragId) return;
      const f = frameFromPointer(e.clientX);
      if (f !== pending && f !== frameAt(video.currentTime)) goToFrame(f);
    });
    const endDrag = (e) => {
      if (e.pointerId !== dragId) return;
      dragId = null;
      if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
      wrap.classList.remove("is-dragging");
    };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 10 : 1;
      const cur = pending >= 0 ? pending : frameAt(video.currentTime);
      if (e.key === "ArrowRight") goToFrame(cur + step);
      else if (e.key === "ArrowLeft") goToFrame(cur - step);
      else if (e.key === "Home") goToFrame(0);
      else if (e.key === "End") goToFrame(frameCount() - 1);
      else return;
      e.preventDefault();
    });

    video.addEventListener("emptied", () => {
      pending = -1;
    });
    play.addEventListener("click", () => {
      if (!video.paused) {
        video.pause();
        return;
      }
      if (!video.getAttribute("src") && video.dataset.src) video.src = video.dataset.src;
      tryPlay(video);
    });

    syncPlay();
    render();
    return wrap;
  }

  function buildComparison(root) {
    const items = DATA[root.dataset.dataset];
    if (!items || !items.length) return;
    const hasCamera = items.some((it) => it.camera);
    const labelOf = (it) => it.label || prettyName(it.name);

    const thumbs = el("div", `thumbs${items.length <= 4 ? " thumbs--few" : ""}`, {
      role: "group",
      "aria-label": "Choose a scene",
    });
    const buttons = items.map((item, i) => {
      const btn = el("button", "thumb", { type: "button", "aria-pressed": "false", "aria-label": labelOf(item) });
      const img = el("img", "", { src: item.thumb, alt: "", loading: "lazy", decoding: "async", width: "416", height: "240" });
      btn.append(img, el("span", "thumb-label", { text: labelOf(item) }));
      btn.addEventListener("click", () => select(i, true));
      thumbs.append(btn);
      return btn;
    });

    const viewer = el("div", "viewer");
    const bar = el("div", "viewer-bar");
    const title = el("p", "viewer-title");
    const nav = el("div", "viewer-nav");
    const prev = el("button", "viewer-arrow", { type: "button", "aria-label": "Previous scene" });
    prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>';
    const counter = el("span", "viewer-counter");
    const next = el("button", "viewer-arrow", { type: "button", "aria-label": "Next scene" });
    next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>';
    nav.append(prev, counter, next);
    bar.append(title, nav);

    const mediaRow = el("div", `viewer-media${hasCamera ? " with-camera" : ""}`);
    const videoWrap = el("div", "viewer-video is-loading");
    const video = el("video", "", { controls: "", muted: "", loop: "", playsinline: "", preload: "none" });
    video.muted = true;
    videoWrap.append(video, el("span", "spinner", { "aria-hidden": "true" }));
    if (root.hasAttribute("data-speed-toggle")) {
      videoWrap.append(buildSpeedToggle(video, "comparison video", root.dataset.speedToggle === "fast"));
    }
    const videoCol = el("div", "viewer-main");
    videoCol.append(buildScrubber(video, COMPARISON_FPS), videoWrap);
    mediaRow.append(videoCol);
    video.addEventListener("loadeddata", () => videoWrap.classList.remove("is-loading"));
    video.addEventListener("waiting", () => videoWrap.classList.add("is-loading"));
    video.addEventListener("playing", () => videoWrap.classList.remove("is-loading"));
    trackUserPause(video);

    let cameraImg = null;
    let cameraLink = null;
    if (hasCamera) {
      const fig = el("figure", "viewer-camera");
      cameraLink = el("a", "", { target: "_blank", rel: "noopener", "aria-label": "Open camera trajectory plot in a new tab" });
      cameraImg = el("img", "", { alt: "Camera trajectories estimated by ViPE (blue) versus ground truth (red) for each method", decoding: "async" });
      cameraLink.append(cameraImg);
      fig.append(cameraLink);
      mediaRow.append(fig);
    }

    viewer.append(bar, mediaRow);
    root.append(thumbs, viewer);

    let current = -1;
    let activated = false;

    function select(i, userInitiated) {
      i = (i + items.length) % items.length;
      if (i === current) return;
      current = i;
      const item = items[i];
      buttons.forEach((b, j) => {
        b.classList.toggle("is-active", j === i);
        b.setAttribute("aria-pressed", String(j === i));
      });
      title.textContent = labelOf(item);
      counter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
      videoWrap.classList.add("is-loading");
      video.poster = item.thumb;
      video.dataset.src = item.video;
      delete video.dataset.userPaused;
      if (activated || userInitiated) {
        activated = true;
        video.src = item.video;
        tryPlay(video);
      }
      if (cameraImg) {
        cameraImg.src = item.camera;
        cameraLink.href = item.camera;
      }
    }

    prev.addEventListener("click", () => select(current - 1, true));
    next.addEventListener("click", () => select(current + 1, true));
    thumbs.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      select(current + (e.key === "ArrowRight" ? 1 : -1), true);
      buttons[current].focus();
    });

    select(0, false);
    new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) activated = true;
      },
      { rootMargin: "120px 0px" }
    ).observe(videoWrap);
    visibilityObserver.observe(video);
  }

  /* ---------- Standalone videos ---------- */

  // Narrated videos autoplay with sound. If the browser forces a muted start, the first click or key
  // press elsewhere on the page unmutes them; turning audio on restarts the narration.
  function initNarratedVideo(figure) {
    const video = figure.querySelector("video");
    const hint = figure.querySelector(".audio-hint");
    let autoMuted = false;

    const unmute = () => {
      autoMuted = false;
      if (!video.muted) return;
      video.muted = false;
      if (!video.paused) video.currentTime = 0;
    };
    const onGesture = (e) => {
      document.removeEventListener("click", onGesture, true);
      document.removeEventListener("keydown", onGesture, true);
      // Inside the figure, the viewer is already choosing audio via its own buttons or controls.
      if (autoMuted && !figure.contains(e.target)) unmute();
      autoMuted = false;
    };
    video.addEventListener("autoplaymuted", () => {
      autoMuted = true;
      document.addEventListener("click", onGesture, true);
      document.addEventListener("keydown", onGesture, true);
    });

    const playWithAudio = () => {
      if (!video.getAttribute("src") && video.dataset.src) video.src = video.dataset.src;
      unmute();
      tryPlay(video);
    };
    figure.querySelector(".narrated-overlay").addEventListener("click", playWithAudio);
    hint.addEventListener("click", () => (!video.paused && !video.muted ? video.pause() : playWithAudio()));
    const sync = () => {
      const audible = !video.paused && !video.muted;
      figure.classList.toggle("is-playing", !video.paused);
      figure.classList.toggle("is-audible", audible);
      hint.setAttribute("aria-pressed", String(audible));
    };
    for (const type of ["play", "pause", "ended", "volumechange"]) video.addEventListener(type, sync);
  }

  function initLoopVideo(video) {
    trackUserPause(video);
    visibilityObserver.observe(video);
  }

  /* ---------- Table of contents ---------- */

  function initToc() {
    const toc = document.getElementById("toc");
    const toggle = document.querySelector(".toc-toggle");
    const links = [...toc.querySelectorAll("a[data-target]")];
    const sections = links.map((a) => document.getElementById(a.dataset.target)).filter(Boolean);

    const setOpen = (open) => {
      toc.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close table of contents" : "Open table of contents");
    };
    toggle.addEventListener("click", () => setOpen(!toc.classList.contains("is-open")));
    links.forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("click", (e) => {
      if (toc.classList.contains("is-open") && !toc.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    let ticking = false;
    const update = () => {
      ticking = false;
      const marker = window.innerHeight * 0.3;
      let active = null;
      for (const s of sections) if (s.getBoundingClientRect().top <= marker) active = s;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) active = sections[sections.length - 1];
      links.forEach((a) => {
        const on = !!active && a.dataset.target === active.id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      const max = document.documentElement.scrollHeight - window.innerHeight;
      toc.style.setProperty("--progress", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : "0");
      toc.classList.toggle("is-stuck", window.scrollY > 4);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  buildGallery();
  document.querySelectorAll(".compare[data-dataset]").forEach(buildComparison);
  document.querySelectorAll(".narrated").forEach(initNarratedVideo);
  document.querySelectorAll(".media-figure video[data-src]").forEach(initLoopVideo);
  initToc();

  // The gallery is built after the browser's initial hash jump, so re-apply it once layout settles.
  if (location.hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: "instant" }));
  }
})();
