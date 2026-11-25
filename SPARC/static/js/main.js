(() => {
  "use strict";

  const DATA = window.PAGE_DATA;
  const el = (tag, className, attrs = {}) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    return node;
  };
  const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
  const tryPlay = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };

  /* ---------- videos: muted loops play on screen and pause off it; every download goes through one queue ---------- */
  const onScreen = new WeakSet();
  const autoplays = (v) => v.muted && !v.dataset.userPaused;
  const pauseAuto = (v) => { if (!v.paused) { v.dataset.autoPaused = "1"; v.pause(); } };
  const visible = new IntersectionObserver((entries) => {
    for (const { target: v, isIntersecting } of entries) {
      if (isIntersecting) {
        onScreen.add(v);
        if (v.getAttribute("src") && autoplays(v)) tryPlay(v);
      } else {
        onScreen.delete(v);
        pauseAuto(v);
      }
    }
    loader.schedule();
  }, { rootMargin: "120px 0px", threshold: 0.15 });

  // One download at a time, so each video finishes quickly instead of all of them sharing the bandwidth.
  // Priority: what the visitor asked for, then what is on screen, then page order. A download pushed aside resumes
  // later from where it stopped. Videos marked data-stream (the long overview video) are streamed by the browser and
  // leave the queue as soon as they can start playing.
  const loader = (() => {
    const CAN_FETCH = /^https?:$/.test(location.protocol);
    const entries = [];
    const byVideo = new WeakMap();
    const blobs = new Map();
    let urgentSeq = 0;
    let pumping = false;
    const mb = (b) => (b / 1048576).toFixed(1);
    const rank = (e) => (e.urgent ? 0 : onScreen.has(e.video) ? 1 : 2);
    const byPriority = (a, b) => rank(a) - rank(b) || b.urgent - a.urgent ||
      (a.video.compareDocumentPosition(b.video) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

    function render(e, place) {
      const { video, state } = e;
      e.host.classList.toggle("is-ready", state === "ready");
      e.overlay.dataset.state = state;
      let frac = null;
      if (e.total) frac = Math.min(1, e.received / e.total);
      else if (e.native && video.duration > 0 && video.buffered.length) {
        frac = Math.min(1, video.buffered.end(video.buffered.length - 1) / video.duration);
      }
      e.overlay.classList.toggle("is-indeterminate", state === "loading" && frac === null);
      e.fill.style.transform = `scaleX(${state === "loading" ? frac || 0 : 0})`;
      e.status.textContent = state === "failed" ? "Failed to load video" : state === "loading" ? "Loading video"
        : place ? `Queued · #${place}` : "Queued";
      e.pct.textContent = state === "loading" && frac !== null ? `${Math.round(frac * 100)}%` : "";
      e.size.textContent = e.total ? `${mb(e.received)} / ${mb(e.total)} MB` : e.received ? `${mb(e.received)} MB`
        : state === "queued" ? "click to load first" : "";
      if (frac === null) e.overlay.removeAttribute("aria-valuenow");
      else e.overlay.setAttribute("aria-valuenow", String(Math.round(frac * 100)));
    }

    const wantsPlay = (e) => e.urgent || (onScreen.has(e.video) && autoplays(e.video));

    function attach(e, src) {
      const play = wantsPlay(e);
      e.state = "ready";
      e.urgent = 0;
      e.video.preload = "auto";
      e.video.src = src;
      render(e);
      if (play) tryPlay(e.video);
    }

    // data-stream videos, file:// pages and failed fetches: the browser streams the file itself
    function streamNatively(e) {
      e.native = true;
      e.total = e.received = 0;
      e.chunks = [];
      e.state = "loading";
      e.video.preload = "auto";
      e.video.src = e.url;
      render(e);
    }

    async function start(e) {
      e.state = "loading";
      render(e);
      if (!CAN_FETCH || e.stream) return streamNatively(e);
      const ctrl = (e.ctrl = new AbortController());
      const url = e.url;
      try {
        const res = await fetch(url, { headers: e.received ? { Range: `bytes=${e.received}-` } : {}, signal: ctrl.signal });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        if (res.status === 206) {
          e.total = Number((res.headers.get("content-range") || "").split("/")[1]) || 0;
        } else {
          e.chunks = [];
          e.received = 0;
          e.total = res.headers.get("content-encoding") ? 0 : Number(res.headers.get("content-length")) || 0;
        }
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (ctrl.signal.aborted) return;
          if (done) break;
          e.chunks.push(value);
          e.received += value.length;
          render(e);
        }
        const blobUrl = URL.createObjectURL(new Blob(e.chunks, { type: res.headers.get("content-type") || "video/mp4" }));
        blobs.set(url, blobUrl);
        e.chunks = [];
        attach(e, blobUrl);
      } catch {
        if (!ctrl.signal.aborted) streamNatively(e);
      } finally {
        if (e.ctrl === ctrl) e.ctrl = null;
        schedule();
      }
    }

    function suspend(e) {
      e.ctrl.abort();
      e.ctrl = null;
      e.state = "queued";
      render(e);
    }

    function pump() {
      const queued = entries.filter((e) => e.state === "queued").sort(byPriority);
      for (const next of queued) {
        const active = entries.filter((e) => e.state === "loading");
        if (!active.length) {
          start(next);
          continue;
        }
        const victim = active.filter((e) => e.ctrl && rank(e) > rank(next)).sort(byPriority).pop();
        if (!victim) break;
        suspend(victim);
        start(next);
      }
      entries.filter((e) => e.state === "queued").sort(byPriority).forEach((e, i) => render(e, i + 1));
    }

    function schedule() {
      if (pumping) return;
      pumping = true;
      queueMicrotask(() => { pumping = false; pump(); });
    }

    function add(video, host, url = video.dataset.src) {
      const overlay = el("div", "vload", { role: "progressbar", "aria-label": "Video loading progress",
                                           "aria-valuemin": "0", "aria-valuemax": "100" });
      const head = el("div", "vload-head");
      const status = el("span", "vload-status");
      const pctEl = el("span", "vload-pct");
      head.append(status, pctEl);
      const bar = el("div", "vload-bar");
      const fill = el("span", "vload-fill");
      bar.append(fill);
      const size = el("span", "vload-size");
      const panel = el("div", "vload-panel");
      panel.append(head, bar, size);
      overlay.append(panel);
      host.append(overlay);

      const e = { video, host, overlay, status, pct: pctEl, fill, size, url: null, state: "idle", urgent: 0, chunks: [],
                  received: 0, total: 0, native: false, stream: "stream" in video.dataset, ctrl: null };
      entries.push(e);
      byVideo.set(video, e);
      overlay.addEventListener("click", (ev) => { ev.stopPropagation(); prioritize(video); });

      video.addEventListener("loadeddata", () => {
        if (!e.native || e.state !== "loading") return;
        const play = wantsPlay(e);
        e.state = "ready";
        e.urgent = 0;
        render(e);
        if (play) tryPlay(video);
        schedule();
      });
      video.addEventListener("progress", () => { if (e.native && e.state === "loading") render(e); });
      video.addEventListener("error", () => {
        if (!video.getAttribute("src") || (e.state !== "ready" && e.state !== "loading")) return;
        if (!e.native) {
          blobs.delete(e.url);
          streamNatively(e);
        } else {
          e.state = "failed";
          render(e);
          schedule();
        }
      });

      render(e);
      if (url) setSource(video, url);
    }

    // points a registered video at a new file; `urgent` jumps the queue (the visitor asked for it)
    function setSource(video, url, urgent = false) {
      const e = byVideo.get(video);
      if (e.url === url) return urgent ? prioritize(video) : undefined;
      if (e.ctrl) e.ctrl.abort();
      e.ctrl = null;
      e.url = url;
      e.chunks = [];
      e.received = e.total = 0;
      e.native = false;
      e.urgent = urgent ? ++urgentSeq : 0;
      pauseAuto(video);
      const cached = blobs.get(url);
      if (cached) {
        attach(e, cached);
      } else {
        if (video.getAttribute("src")) {
          video.removeAttribute("src");
          video.load();
        }
        e.state = "queued";
        render(e);
      }
      schedule();
    }

    function prioritize(video) {
      const e = byVideo.get(video);
      if (!e || (e.state !== "queued" && e.state !== "loading")) return;
      e.urgent = ++urgentSeq;
      schedule();
    }

    const isReady = (video) => (byVideo.get(video) || {}).state === "ready";

    return { add, setSource, prioritize, schedule, isReady };
  })();

  function lazyVideo(v, host = v.closest(".media-frame, .b-media, .viewer-video") || v.parentElement) {
    v.muted = v.hasAttribute("muted");
    v.addEventListener("pause", () => {
      if (v.dataset.autoPaused) delete v.dataset.autoPaused;
      else if (document.visibilityState === "visible" && !v.ended) v.dataset.userPaused = "1";
    });
    v.addEventListener("play", () => delete v.dataset.userPaused);
    loader.add(v, host);
    visible.observe(v);
  }

  /* ---------- title: Blender render with alpha (HEVC .mov for WebKit, VP9 .webm elsewhere); CSS animation if neither plays ---------- */
  function initTitle() {
    const host = document.getElementById("title-anim");
    if (!host) return;
    const video = host.querySelector("video");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fallback = () => {
      video.remove();
      if (reduced) { host.append(el("img", "", { src: video.poster, alt: "" })); return; }
      const t = document.createElement("sparc-title");
      host.append(t);
      host.addEventListener("click", () => t.play && t.play());
    };
    const ua = navigator.userAgent;
    const webkit = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Android/.test(ua);
    const sources = [...video.querySelectorAll("source")];
    const hevc = sources.find((s) => s.type.includes("hvc1"));
    // WebKit drops the VP9 alpha plane, and some iOS shells answer "" to the MOV type probe yet play it
    if (webkit && hevc) { video.src = hevc.src; video.addEventListener("error", fallback, { once: true }); }
    else if (!sources.some((s) => video.canPlayType(s.type))) return fallback();
    if (reduced) { video.removeAttribute("autoplay"); video.currentTime = 999; return; }

    const still = new Image();
    still.src = video.poster;
    let rest;
    video.addEventListener("ended", () => {
      if (rest === undefined && still.complete && still.naturalWidth) rest = titleRest(still);
      if (rest) { host.append(rest); host.classList.add("is-resting"); }
    });
    const start = () => tryPlay(video);
    if (video.readyState >= 2) start(); else video.addEventListener("loadeddata", start, { once: true });
    host.addEventListener("click", () => {
      if (!video.isConnected) return;
      host.classList.remove("is-resting");
      if (rest) rest.remove();
      video.currentTime = 0;
      tryPlay(video);
    });
  }

  /* the last title frame (= poster) cut into one layer per letter plus its ground shadow, so letters can idle and hop */
  function titleRest(img) {
    const W = img.naturalWidth, H = img.naturalHeight;
    const src = el("canvas", "", { width: W, height: H });
    const ctx = src.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    let px;
    try { px = ctx.getImageData(0, 0, W, H).data; } catch { return null; }
    const top = new Int32Array(W).fill(H);
    let bottom = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (px[(y * W + x) * 4 + 3] < 128) continue;
        if (y < top[x]) top[x] = y;
        bottom = y;
      }
    }
    const runs = [];
    for (let x = 0; x < W; x++) {
      if (top[x] === H) continue;
      const last = runs[runs.length - 1];
      if (last && x - last.x1 < W * 0.01) last.x1 = x + 1; else runs.push({ x0: x, x1: x + 1 });
    }
    if (!runs.length) return null;

    const cut = Math.min(H - 1, bottom + 2);
    const piece = (cls, x, y, w, h) => {
      const box = el("div", cls);
      const cv = el("canvas", "", { width: w, height: h });
      cv.getContext("2d").drawImage(src, x, y, w, h, 0, 0, w, h);
      Object.assign(box.style, { left: pct(x / W, 3), top: pct(y / H, 3), width: pct(w / W, 3), height: pct(h / H, 3) });
      box.append(cv);
      return box;
    };
    const layer = el("div", "title-rest", { "aria-hidden": "true" });
    runs.forEach((r, i) => {
      const x0 = i ? Math.round((runs[i - 1].x1 + r.x0) / 2) : 0;
      const x1 = i < runs.length - 1 ? Math.round((r.x1 + runs[i + 1].x0) / 2) : W;
      const pad = Math.round(H * 0.04);
      const lx0 = Math.max(x0, r.x0 - pad), lx1 = Math.min(x1, r.x1 + pad);
      let y0 = H;
      for (let x = r.x0; x < r.x1; x++) y0 = Math.min(y0, top[x]);
      y0 = Math.max(0, y0 - pad);

      let sw = 0, sx = 0, sy = 0;
      for (let y = cut; y < H; y++) {
        for (let x = x0; x < x1; x++) {
          const a = px[(y * W + x) * 4 + 3];
          sw += a; sx += a * (x - x0); sy += a * (y - cut);
        }
      }
      const letter = piece("tr-letter", lx0, y0, lx1 - lx0, cut - y0);
      const shadow = piece("tr-shadow", x0, cut, x1 - x0, H - cut);
      const lift = (r.x1 - r.x0) / 5 / (cut - y0) * 100;
      letter.style.setProperty("--i", i);
      letter.style.setProperty("--lift", `${lift.toFixed(2)}%`);
      shadow.style.setProperty("--i", i);
      if (sw) shadow.style.setProperty("--o", `${pct(sx / sw / (x1 - x0))} ${pct(sy / sw / (H - cut))}`);
      letter.addEventListener("pointerenter", () => {
        if (letter.getAnimations().length) return;
        const opt = { duration: 700, easing: "ease-in-out" };
        letter.animate([
          { transform: "none" },
          { transform: `translateY(${lift * 0.25}%) scale(1.06,.9)`, offset: 0.15 },
          { transform: `translateY(${-lift * 1.1}%) scale(.96,1.05)`, offset: 0.5 },
          { transform: `translateY(${lift * 0.15}%) scale(1.05,.94)`, offset: 0.82 },
          { transform: "none" },
        ], opt);
        shadow.animate([
          { transform: "none", opacity: 1 },
          { transform: "scale(.6)", opacity: 0.45, offset: 0.5 },
          { transform: "none", opacity: 1 },
        ], opt);
      });
      layer.append(shadow, letter);
    });
    return layer;
  }

  /* ---------- hero: a faint token grid being pruned ---------- */
  function initTokenField() {
    const field = document.getElementById("token-field");
    if (!field || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const n = Math.ceil(window.innerWidth / 40) * Math.ceil(760 / 40);
    const cells = Array.from({ length: n }, () => field.appendChild(el("i")));
    setInterval(() => {
      for (let k = 0; k < 10; k++) {
        const c = cells[(Math.random() * cells.length) | 0];
        c.className = Math.random() < 0.55 ? "cut" : "on";
        setTimeout(() => { c.className = ""; }, 2400 + Math.random() * 2400);
      }
    }, 420);
  }

  /* ---------- gallery: uniform grid, 2x playback, hover zooms every tile to the same size ---------- */
  const GALLERY_SPEED = 2;
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  function galleryTile(item) {
    const tile = el("article", "b-item");
    const media = el("div", "b-media");
    const v = el("video", "", { "data-src": item.video, poster: item.poster, muted: "", loop: "", playsinline: "",
                                preload: "none", "aria-label": item.title });
    const setRate = () => { v.defaultPlaybackRate = GALLERY_SPEED; v.playbackRate = GALLERY_SPEED; };
    v.addEventListener("loadedmetadata", setRate);
    v.addEventListener("play", () => { if (v.playbackRate !== GALLERY_SPEED) setRate(); });
    const bar = el("div", "b-progress", { role: "slider", tabindex: "0", "aria-label": `Seek ${item.title}`, "aria-valuemin": "0",
                                          "aria-valuemax": String(Math.round(item.duration)), "aria-valuenow": "0" });
    const fill = el("span");
    const knob = el("i");
    bar.append(fill, knob);
    const time = el("span", "b-time", { text: `0:00 / ${clock(item.duration)}` });
    const show = (t) => {
      const d = v.duration || item.duration;
      const f = Math.min(1, t / d);
      fill.style.transform = `scaleX(${f})`;
      knob.style.left = `${f * 100}%`;
      time.textContent = `${clock(t)} / ${clock(d)}`;
      bar.setAttribute("aria-valuenow", String(Math.round(t)));
    };
    let scrubbing = false;
    let resume = false;
    v.addEventListener("timeupdate", () => { if (!scrubbing) show(v.currentTime); });
    const seekTo = (e) => {
      if (!v.duration) return;
      const r = bar.getBoundingClientRect();
      const t = Math.min(v.duration - 0.1, v.duration * Math.max(0, (e.clientX - r.left) / r.width));
      v.currentTime = t;
      show(t);
    };
    const onMove = (e) => seekTo(e);
    const endScrub = () => {
      if (!scrubbing) return;
      scrubbing = false;
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", endScrub);
      removeEventListener("pointercancel", endScrub);
      tile.classList.remove("is-scrubbing");
      if (resume) tryPlay(v);
    };
    bar.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      try { bar.setPointerCapture(e.pointerId); } catch (_) { /* pointer no longer active */ }
      scrubbing = true;
      resume = !v.paused;
      if (resume) v.pause();
      tile.classList.add("is-scrubbing");
      addEventListener("pointermove", onMove);
      addEventListener("pointerup", endScrub);
      addEventListener("pointercancel", endScrub);
      seekTo(e);
    });
    bar.addEventListener("click", (e) => e.stopPropagation());
    bar.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: -5, ArrowRight: 5 }[e.key];
      if (!step || !v.duration) return;
      e.preventDefault();
      v.currentTime = Math.min(v.duration, Math.max(0, v.currentTime + step));
      show(v.currentTime);
    });
    media.append(v, el("span", "b-badge", { text: `${Math.round(item.duration)} s` }),
                 el("span", "b-speed", { text: `×${GALLERY_SPEED}`, title: `Playing at ${GALLERY_SPEED}× speed` }), time, bar);
    const cap = el("div", "b-caption");
    cap.append(el("span", "b-title", { text: item.title }), el("p", "b-prompt", { text: item.prompt }));
    tile.title = `${item.title}: ${item.prompt}`;
    tile.append(media, cap);
    lazyVideo(v);
    return tile;
  }

  function buildGallery() {
    const grid = document.getElementById("gallery-grid");
    if (!grid || !DATA) return;
    const tiles = DATA.gallery.map((it) => galleryTile(it));
    grid.append(...tiles);
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { target.classList.add("is-in"); reveal.unobserve(target); }
      });
    }, { threshold: 0.12 });
    tiles.forEach((t, i) => {
      t.style.transitionDelay = `${i * 70}ms`;
      t.addEventListener("transitionend", () => { t.style.transitionDelay = ""; }, { once: true });
      reveal.observe(t);
    });
  }

  /* ---------- comparison viewers ---------- */
  function buildComparison(root) {
    const items = DATA[root.dataset.dataset];
    if (!items || !items.length) return;
    const hasCamera = items.some((it) => it.camera);
    const speeds = [1, 2, 4];
    // data-baked: speed-up already encoded in the files; the switch shows real-time speed, playbackRate = speed / baked.
    const baked = parseFloat(root.dataset.baked || "1");
    let speed = parseFloat(root.dataset.speed || String(baked));
    const rate = () => speed / baked;

    const thumbs = el("div", "thumbs", { role: "group", "aria-label": "Choose a scene" });
    thumbs.style.setProperty("--cols", items.length <= 9 ? items.length : Math.ceil(items.length / Math.ceil(items.length / 9)));
    const buttons = items.map((item, i) => {
      const b = el("button", "thumb", { type: "button", "aria-pressed": "false", "aria-label": item.label });
      b.append(el("img", "", { src: item.thumb, alt: "", loading: "lazy", decoding: "async", width: "416", height: "240" }),
               el("span", "thumb-label", { text: item.label }));
      b.addEventListener("click", () => select(i, true));
      thumbs.append(b);
      return b;
    });

    const viewer = el("div", "viewer");
    const bar = el("div", "viewer-bar");
    const title = el("p", "viewer-title");
    const tools = el("div", "viewer-tools");
    const sw = el("div", "speed", { role: "group", "aria-label": "Playback speed" });
    const swButtons = speeds.map((s) => {
      const b = el("button", "", { type: "button", text: `${s}×` });
      b.addEventListener("click", () => setSpeed(s));
      sw.append(b);
      return b;
    });
    const nav = el("div", "viewer-nav");
    const prev = el("button", "viewer-arrow", { type: "button", "aria-label": "Previous scene",
                                                 html: '<svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg>' });
    const counter = el("span", "viewer-counter");
    const next = el("button", "viewer-arrow", { type: "button", "aria-label": "Next scene",
                                                 html: '<svg viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>' });
    nav.append(prev, counter, next);
    tools.append(sw, nav);
    bar.append(title, tools);

    const media = el("div", "viewer-media");
    const main = el("div", "viewer-main");
    const wrap = el("div", "viewer-video");
    const video = el("video", "", { muted: "", loop: "", playsinline: "", controls: "", preload: "none" });
    video.muted = true;
    wrap.append(video);
    const prog = el("div", "viewer-progress");
    const progFill = el("span");
    prog.append(progFill);
    video.addEventListener("timeupdate", () => { progFill.style.transform = `scaleX(${video.currentTime / (video.duration || 1)})`; });
    prog.addEventListener("click", (e) => {
      const r = prog.getBoundingClientRect();
      if (video.duration) video.currentTime = video.duration * (e.clientX - r.left) / r.width;
    });
    video.addEventListener("loadedmetadata", () => { video.playbackRate = rate(); });
    video.addEventListener("play", () => { if (video.playbackRate !== rate()) video.playbackRate = rate(); });
    main.append(wrap, prog);
    media.append(main);
    let camImg = null;
    let camLink = null;
    if (hasCamera) {
      const fig = el("figure", "viewer-camera");
      camLink = el("a", "", { target: "_blank", rel: "noopener", "aria-label": "Open the per-method trajectory plot" });
      camImg = el("img", "", { alt: "ViPE-estimated (blue) versus ground-truth (red) camera trajectories", decoding: "async",
                               width: "1876", height: "390" });
      camLink.append(camImg);
      fig.append(el("figcaption", "", { html: 'Camera trajectories estimated from each video by ViPE (top-down view): ' +
        '<b style="color:#e5484d">ground truth</b> vs. <b style="color:#2f7fd8">estimated, Sim(3) aligned</b>.' }), camLink);
      main.append(fig);
    }
    const prompt = items.some((it) => it.prompt) ? el("p", "viewer-prompt") : null;
    viewer.append(bar, media);
    if (prompt) viewer.append(prompt);
    root.append(thumbs, viewer);
    lazyVideo(video, wrap);

    function setSpeed(s) {
      speed = s;
      video.defaultPlaybackRate = rate();
      video.playbackRate = rate();
      swButtons.forEach((b, j) => b.classList.toggle("is-on", speeds[j] === s));
    }
    let current = -1;
    function select(i, user) {
      i = (i + items.length) % items.length;
      if (i === current) return;
      current = i;
      const item = items[i];
      buttons.forEach((b, j) => { b.classList.toggle("is-active", j === i); b.setAttribute("aria-pressed", String(j === i)); });
      title.textContent = item.label;
      counter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
      video.poster = item.poster;
      delete video.dataset.userPaused;
      loader.setSource(video, item.video, user);
      if (camImg) { camImg.src = item.camera; camLink.href = item.cameraFull || item.camera; }
      if (prompt) prompt.innerHTML = `<b>Prompt.</b> ${item.prompt}`;
    }
    prev.addEventListener("click", () => select(current - 1, true));
    next.addEventListener("click", () => select(current + 1, true));
    setSpeed(speed);
    select(0, false);
  }

  /* ---------- method tabs + per-chunk mask explorer ---------- */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach((box) => {
      const tabs = [...box.querySelectorAll(".tab")];
      const panels = [...box.querySelectorAll(".tab-panel")];
      tabs.forEach((t) => t.addEventListener("click", () => {
        tabs.forEach((x) => { x.classList.toggle("is-active", x === t); x.setAttribute("aria-selected", String(x === t)); });
        panels.forEach((p) => {
          const on = p.dataset.panel === t.dataset.tab;
          p.hidden = !on;
          p.querySelectorAll("video").forEach((v) => {
            if (!on) pauseAuto(v);
            else if (loader.isReady(v)) tryPlay(v);
            else loader.prioritize(v);
          });
        });
      }));
    });
  }

  function buildMaskExplorer() {
    const root = document.getElementById("mask-explorer");
    const masks = DATA && DATA.chunkMasks;
    if (!root || !masks) return;
    const img = el("img", "", { alt: "Attention mask of the selected chunk", width: "724", height: "724" });
    const side = el("div", "mx-side");
    side.append(el("h3", "", { text: "Pruned attention mask, chunk by chunk" }),
                el("p", "", { html: "Exact query × key mask of each chunk, built from its correspondence cache: rows are queries, columns are keys over the 9 retrieved history latents <b style='color:#2f6fde'>H</b> and the 18 target latents <b style='color:#f07a1a'>T</b>." }));
    const label = el("div", "mx-chunk");
    const slider = el("input", "mx-slider", { type: "range", min: "1", max: String(masks.length), value: String(masks.length),
                                              "aria-label": "Chunk" });
    const hist = el("div", "mx-hist");
    const stats = el("div", "mx-stats");
    const legend = el("div", "legend", { html: [["#f59e0b", "matched history + bias"], ["#7fa3f0", "intra-frame history"],
      ["#a5c2f5", "local window"], ["#bea8ee", "dense (unobserved)"], ["#f1f4f9", "pruned"]]
      .map(([c, t]) => `<span><i style="background:${c};border:1px solid #dce9f8"></i>${t}</span>`).join("") });
    side.append(label, slider, hist, stats, legend);
    root.append(el("div", "", {}), side);
    root.firstChild.append(img);
    const show = (k) => {
      const m = masks[k - 1];
      img.src = m.image;
      label.textContent = `Chunk ${String(m.chunk).padStart(2, "0")} · target frames #${m.target[0]}–#${m.target[1]}`;
      hist.innerHTML = m.history.map((h) => `<span class="${h.role}">#${h.frame} · ${h.role}</span>`).join("");
      stats.innerHTML = `<div><b>${pct(m.observed)}</b><span>target tokens observed</span></div>` +
        `<div><b>${pct(m.pruned)}</b><span>query–key pairs pruned</span></div>`;
    };
    slider.addEventListener("input", () => show(+slider.value));
    show(masks.length);
  }

  /* ---------- ablation ---------- */
  function buildAblation() {
    const a = DATA && DATA.ablation;
    if (!a) return;
    const conds = document.getElementById("abl-conds");
    if (conds) {
      conds.append(el("span", "lbl", { text: "History conditions" }));
      a.conditions.forEach((c, i) => {
        const box = el("div", `abl-cond${i === 0 ? " first" : ""}`);
        box.append(el("img", "", { src: c.image, alt: c.label, loading: "lazy" }), el("span", "", { text: c.label }));
        conds.append(box);
      });
    }
    const cards = document.getElementById("abl-cards");
    if (cards) {
      a.variants.forEach((v) => {
        const card = el("article", `abl-card${v.key === "ours" ? " ours" : ""}`);
        const bar = el("div", "abl-bar");
        bar.append(el("span", "", { style: `width:${(v.pruned * 100).toFixed(1)}%` }));
        card.append(el("img", "", { src: v.mask, alt: `Attention mask: ${v.label}`, loading: "lazy" }),
                    el("span", "abl-name", { text: v.label }),
                    el("span", "abl-meta", { text: `PSNR ${v.psnr.toFixed(2)} · LPIPS ${v.lpips.toFixed(3)} · ATE ${v.ate.toFixed(3)}` }),
                    bar,
                    el("span", `abl-sparsity${v.pruned > 0 ? "" : " zero"}`,
                       { text: v.pruned > 0 ? `${pct(v.pruned)} pairs pruned` : "dense · nothing pruned" }));
        cards.append(card);
      });
    }
    const order = document.getElementById("rope-order");
    if (order) order.textContent = `[${a.rope.shuffled.map((g) => `GT ${g}`).join(", ")}]`;
  }

  /* ---------- table of contents ---------- */
  function initToc() {
    const toc = document.getElementById("toc");
    const links = [...document.querySelectorAll(".toc-links a")];
    const sections = links.map((a) => document.getElementById(a.dataset.target)).filter(Boolean);
    const toggle = toc.querySelector(".toc-toggle");
    const list = document.getElementById("toc-links");
    toggle.addEventListener("click", () => {
      const open = list.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.forEach((a) => a.addEventListener("click", () => list.classList.remove("is-open")));
    const update = () => {
      const y = scrollY + innerHeight * 0.3;
      let active = null;
      for (const s of sections) if (s.offsetTop <= y) active = s;
      links.forEach((a) => a.classList.toggle("is-active", !!active && a.dataset.target === active.id));
      const max = document.documentElement.scrollHeight - innerHeight;
      toc.style.setProperty("--progress", max > 0 ? scrollY / max : 0);
      toc.classList.toggle("is-stuck", scrollY > 8);
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- BibTeX copy button ---------- */
  function initBibtex() {
    const btn = document.getElementById("bibtex-copy");
    const code = document.getElementById("bibtex-code");
    if (!btn || !code) return;
    const label = btn.querySelector("span");
    let timer = 0;
    btn.addEventListener("click", async () => {
      const textValue = code.textContent.trim();
      try {
        await navigator.clipboard.writeText(textValue);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
      }
      btn.classList.add("is-done");
      label.textContent = "Copied";
      clearTimeout(timer);
      timer = setTimeout(() => { btn.classList.remove("is-done"); label.textContent = "Copy"; }, 1600);
    });
  }

  document.querySelectorAll("video[data-src]").forEach((v) => lazyVideo(v));
  initTitle();
  initTokenField();
  buildGallery();
  document.querySelectorAll(".compare[data-dataset]").forEach(buildComparison);
  initTabs();
  buildMaskExplorer();
  buildAblation();
  initToc();
  initBibtex();
})();
