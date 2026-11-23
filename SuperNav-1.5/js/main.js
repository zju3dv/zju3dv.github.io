/* SuperNav-1.5: local assets, recorded paths, no runtime dependencies. */
"use strict";

// Keep large videos in the dedicated assets repository, never in this site repo.
const VIDEO_BASE = "https://raw.githubusercontent.com/bugByteMe/SuperNav-1.5-assets/main/";
const videoURL = source => new URL(source, VIDEO_BASE).href;

const galleryPlayers = new Set();
const overviewPlayer = document.querySelector(".opening-video");
if (overviewPlayer) {
  galleryPlayers.add(overviewPlayer);
  overviewPlayer.addEventListener("play", () => {
    for (const player of galleryPlayers) if (player !== overviewPlayer) player.pause();
  });
}

class DemoGallery {
  constructor(catalog) {
    const groups = catalog.groups.map(group => ({
      ...group,
      videos: group.videos.map(video => ({ ...video, category: group.title })),
    }));
    this.catalog = {
      ...catalog,
      groups: [{ title: "All", videos: groups.flatMap(group => group.videos) }, ...groups],
    };
    this.groupIndex = 0;
    this.videoIndex = 0;
    this.mount = document.getElementById(catalog.mount);
    this.mount.replaceChildren();
    this.mount.innerHTML = `<div class="gallery-tabs" role="tablist"></div>
      <div class="gallery-layout" role="tabpanel" tabindex="0">
        <div class="gallery-stage">
          <div class="gallery-stage-heading"><h3 class="gallery-now"></h3><span class="gallery-counter"></span></div>
          <div class="gallery-screen">
            <video controls playsinline preload="metadata"></video>
            <div class="gallery-placeholder" hidden><span aria-hidden="true">▷</span><p></p><span class="eyebrow">Video coming soon</span></div>
          </div>
          <p class="gallery-status" role="status"></p>
          <div class="gallery-error" role="status" hidden>Unable to load this video. <a>Open the MP4</a><button type="button">Retry</button></div>
        </div>
        <aside class="gallery-rail"><div class="gallery-list-heading"><h3>Choose a demo</h3><span></span></div><ul class="gallery-list"></ul></aside>
      </div>`;
    this.tabs = this.mount.querySelector(".gallery-tabs");
    this.tabs.setAttribute("aria-label", `${catalog.label} categories`);
    this.content = this.mount.querySelector(".gallery-layout");
    this.content.id = `${catalog.id}-gallery-content`;
    this.player = this.mount.querySelector("video");
    this.placeholder = this.mount.querySelector(".gallery-placeholder");
    this.status = this.mount.querySelector(".gallery-status");
    this.error = this.mount.querySelector(".gallery-error");
    this.list = this.mount.querySelector(".gallery-list");
    this.catalog.groups.forEach((group, index) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.id = `${catalog.id}-category-${index}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", this.content.id);
      const name = document.createElement("span");
      name.textContent = group.title;
      const count = document.createElement("span");
      count.className = "gallery-tab-count";
      count.textContent = group.videos.length;
      tab.append(name, count);
      tab.addEventListener("click", () => this.selectCategory(index));
      tab.addEventListener("keydown", event => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % this.catalog.groups.length;
        if (event.key === "ArrowLeft") next = (index + this.catalog.groups.length - 1) % this.catalog.groups.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = this.catalog.groups.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          this.selectCategory(next);
          this.tabs.children[next].focus();
        }
      });
      this.tabs.append(tab);
    });
    galleryPlayers.add(this.player);
    this.player.addEventListener("play", () => {
      for (const player of galleryPlayers) if (player !== this.player) player.pause();
    });
    this.player.addEventListener("waiting", () => { this.status.textContent = "Loading video…"; });
    this.player.addEventListener("playing", () => { this.status.textContent = ""; });
    this.player.addEventListener("canplay", () => { this.status.textContent = ""; });
    this.player.addEventListener("error", () => {
      if (!this.currentVideo.src) return;
      this.status.textContent = "";
      this.error.hidden = false;
    });
    this.error.querySelector("button").addEventListener("click", () => this.selectVideo(this.videoIndex, true));
    this.selectCategory(0);
  }

  selectCategory(index) {
    this.groupIndex = index;
    const group = this.catalog.groups[index];
    [...this.tabs.children].forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    this.content.setAttribute("aria-labelledby", this.tabs.children[index].id);
    this.list.setAttribute("aria-label", `${group.title} videos`);
    this.mount.querySelector(".gallery-list-heading>span").textContent = `${group.videos.length} videos`;
    this.list.replaceChildren();
    group.videos.forEach((video, videoIndex) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-item";
      const thumb = document.createElement("span");
      thumb.className = "gallery-thumb";
      if (video.poster) {
        const image = document.createElement("img");
        image.src = video.poster;
        image.alt = "";
        image.loading = "lazy";
        thumb.append(image);
      } else {
        thumb.classList.add("pending-thumb");
        thumb.textContent = String(videoIndex + 1).padStart(2, "0");
      }
      const copy = document.createElement("span");
      copy.className = "gallery-item-copy";
      const title = document.createElement("strong");
      title.textContent = video.title;
      const label = document.createElement("span");
      label.textContent = video.src ? video.category : "Coming soon";
      copy.append(title, label);
      button.append(thumb, copy);
      button.addEventListener("click", () => this.selectVideo(videoIndex, true));
      item.append(button);
      this.list.append(item);
    });
    this.selectVideo(0);
  }

  selectVideo(index, play = false) {
    this.player.pause();
    this.videoIndex = index;
    const group = this.catalog.groups[this.groupIndex];
    const video = group.videos[index];
    this.currentVideo = video;
    this.error.hidden = true;
    this.status.textContent = "";
    this.mount.querySelector(".gallery-now").textContent = video.title;
    this.mount.querySelector(".gallery-counter").textContent = `${index + 1} / ${group.videos.length}`;
    this.player.setAttribute("aria-label", video.title);
    [...this.list.children].forEach((item, i) => item.firstElementChild.setAttribute("aria-current", String(i === index)));
    this.player.hidden = !video.src;
    this.placeholder.hidden = Boolean(video.src);
    if (video.src) {
      this.player.src = videoURL(video.src);
      this.player.poster = video.poster || "";
      this.error.querySelector("a").href = videoURL(video.src);
    } else {
      this.player.removeAttribute("src");
      this.player.removeAttribute("poster");
      this.placeholder.querySelector("p").textContent = video.title;
    }
    this.player.load();
    if (video.src && play) this.player.play().catch(() => {
      if (this.currentVideo === video && this.error.hidden) this.status.textContent = "Press play to watch this demo.";
    });
  }
}

async function loadGalleries() {
  try {
    const response = await fetch("assets/demos.json");
    if (!response.ok) throw new Error(`Demo catalog: HTTP ${response.status}`);
    for (const catalog of await response.json()) new DemoGallery(catalog);
  } catch (error) {
    for (const mount of document.querySelectorAll(".demo-gallery")) {
      const message = document.createElement("p");
      message.textContent = "The demo list could not be loaded. ";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "Try again";
      retry.addEventListener("click", loadGalleries);
      message.append(retry);
      mount.replaceChildren(message);
    }
    console.error(error);
  }
}

loadGalleries();

function initResultTabs() {
  const tabs = [...document.querySelectorAll(".result-tabs [role='tab']")];
  const select = index => {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = i !== index;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        select(next);
        tabs[next].focus();
      }
    });
  });
}

initResultTabs();

const svgNS = "http://www.w3.org/2000/svg";
function svgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

class TrajectoryPlayer {
  constructor(cases) {
    this.cases = cases;
    this.index = 0;
    this.elapsed = 0;
    this.duration = 12000;
    this.hold = 2000;
    this.frame = null;
    this.lastTime = null;
    this.visible = false;
    this.paused = false;
    this.motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.container = document.getElementById("comparison");
    this.panels = document.getElementById("trajectory-panels");
    this.progress = document.getElementById("playback-progress");
    this.pauseButton = document.getElementById("pause-playback");
    this.dots = document.getElementById("case-dots");
    cases.forEach((item, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "case-dot";
      dot.setAttribute("aria-label", `Comparison ${index + 1}: ${item.comparison}, ${item.goal}`);
      dot.addEventListener("click", () => this.select(index));
      this.dots.append(dot);
    });
    document.getElementById("previous-case").addEventListener("click", () => this.select(this.index - 1));
    document.getElementById("next-case").addEventListener("click", () => this.select(this.index + 1));
    this.pauseButton.addEventListener("click", () => {
      this.paused = !this.paused;
      this.updateButton();
      this.syncPlayback();
    });
    this.motionPreference.addEventListener("change", () => {
      this.render();
      this.syncPlayback();
    });
    document.addEventListener("visibilitychange", () => this.syncPlayback());
    const observer = new IntersectionObserver(entries => {
      this.visible = entries[0].isIntersecting;
      this.syncPlayback();
    }, { threshold: 0.05 });
    observer.observe(this.container);
    this.render();
  }

  select(index) {
    this.index = (index + this.cases.length) % this.cases.length;
    this.elapsed = 0;
    this.lastTime = null;
    this.render();
    this.syncPlayback();
  }

  render() {
    const item = this.cases[this.index];
    document.getElementById("case-count").textContent = `${String(this.index + 1).padStart(2, "0")} / ${String(this.cases.length).padStart(2, "0")}`;
    document.getElementById("comparison-title").textContent = item.kind === "memory" ? "Second Session Navigation" : "First Session Multi-Object Navigation";
    document.getElementById("comparison-type").textContent = item.comparison;
    const goal = document.getElementById("trace-goal");
    const label = document.createElement("span");
    label.textContent = "Goal";
    goal.replaceChildren(label, document.createTextNode(item.goal));
    document.getElementById("trace-note").textContent = (item.kind === "harness"
      ? "Memory-design comparison in the shared SuperNav runtime. " : "")
      + "";
    [...this.dots.children].forEach((dot, index) => dot.setAttribute("aria-current", String(index === this.index)));
    this.panels.replaceChildren();
    this.routes = item.panels.map((panel, index) => {
      const card = document.createElement("section");
      card.className = `trajectory-panel${index ? " baseline" : ""}`;
      card.setAttribute("aria-label", panel.label);
      const header = document.createElement("div");
      header.className = "panel-header";
      const name = document.createElement("span");
      name.className = "panel-name";
      const swatch = document.createElement("i");
      swatch.className = "panel-swatch";
      swatch.setAttribute("aria-hidden", "true");
      name.append(swatch, document.createTextNode(panel.label));
      const completion = document.createElement("span");
      completion.className = "completion";
      completion.textContent = "✓ Done";
      completion.setAttribute("aria-hidden", "true");
      header.append(name, completion);
      const map = document.createElement("div");
      map.className = "map-area";
      const svg = svgElement("svg", { viewBox: `-8 -8 ${panel.width + 16} ${panel.height + 16}`, role: "img" });
      const title = svgElement("title");
      title.textContent = `${panel.label}: recorded ${panel.pathLength.toFixed(1)} m path, SPL ${panel.spl.toFixed(3)}, successful run. White circles mark targets.`;
      svg.append(title, svgElement("image", { href: panel.map, width: panel.width, height: panel.height }));
      const commands = panel.points.map(([x, y], point) => `${point ? "L" : "M"}${x},${y}`);
      const distances = [0];
      for (let i = 1; i < panel.points.length; i++) {
        const [x, y] = panel.points[i];
        const [previousX, previousY] = panel.points[i - 1];
        distances.push(distances[i - 1] + Math.hypot(x - previousX, y - previousY));
      }
      const path = svgElement("path", { d: commands[0], class: "route" });
      svg.append(path);
      panel.targets.forEach(([x, y], target) => {
        svg.append(svgElement("circle", { cx: x, cy: y, r: 5.5, class: "target" }));
        if (panel.targets.length > 1) {
          const text = svgElement("text", { x, y, class: "target-label" });
          text.textContent = target + 1;
          svg.append(text);
        }
      });
      const [startX, startY] = panel.points[0];
      svg.append(svgElement("circle", { cx: startX, cy: startY, r: 3, class: "start" }));
      const agent = svgElement("circle", { cx: startX, cy: startY, r: 4, class: "agent" });
      svg.append(agent);
      map.append(svg);
      const metrics = document.createElement("div");
      metrics.className = "panel-metrics";
      metrics.innerHTML = `<span><b>${panel.pathLength.toFixed(1)}</b> m</span><span>SPL <b>${panel.spl.toFixed(3)}</b></span>`;
      card.append(header, map, metrics);
      this.panels.append(card);
      const length = distances[distances.length - 1];
      return { path, agent, card, completion, length, commands, distances, data: panel };
    });
    this.updateButton();
    this.draw();
  }

  updateButton() {
    const reduced = this.motionPreference.matches;
    this.pauseButton.disabled = reduced;
    this.pauseButton.textContent = reduced ? "Static view" : this.paused ? "Play ▷" : "Pause Ⅱ";
    this.pauseButton.setAttribute("aria-label", reduced ? "Static trajectories, reduced motion enabled" : this.paused ? "Resume trajectory playback" : "Pause trajectory playback");
    this.pauseButton.setAttribute("aria-pressed", String(this.paused || reduced));
  }

  draw() {
    const maxDistance = Math.max(...this.routes.map(route => route.data.pathLength));
    const distance = this.motionPreference.matches ? maxDistance : this.elapsed / this.duration * maxDistance;
    for (const route of this.routes) {
      const fraction = Math.min(1, distance / route.data.pathLength);
      // Grow the geometry itself, using exactly the same endpoint for the dot.
      // SVG dash lengths with non-scaling strokes use a different scale from
      // getPointAtLength, which previously made the stroke run ahead of its dot.
      const travelled = route.length * fraction;
      let endpoint;
      if (fraction >= 1) {
        endpoint = route.data.points[route.data.points.length - 1];
        route.path.setAttribute("d", route.commands.join(" "));
      } else {
        let low = 1;
        let high = route.distances.length - 1;
        while (low < high) {
          const middle = Math.floor((low + high) / 2);
          if (route.distances[middle] <= travelled) low = middle + 1;
          else high = middle;
        }
        const start = route.data.points[low - 1];
        const end = route.data.points[low];
        const segmentLength = route.distances[low] - route.distances[low - 1];
        const t = segmentLength > 0 ? (travelled - route.distances[low - 1]) / segmentLength : 0;
        endpoint = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
        route.path.setAttribute("d", `${route.commands.slice(0, low).join(" ")} L${endpoint[0]},${endpoint[1]}`);
      }
      route.agent.setAttribute("cx", endpoint[0]);
      route.agent.setAttribute("cy", endpoint[1]);
      const complete = fraction >= 1 && route.data.success;
      route.card.classList.toggle("complete", complete);
      route.completion.setAttribute("aria-hidden", String(!complete));
    }
    this.progress.style.width = `${Math.min(100, distance / maxDistance * 100)}%`;
  }

  syncPlayback() {
    const shouldPlay = this.visible && !document.hidden && !this.paused && !this.motionPreference.matches;
    if (!shouldPlay) {
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      this.frame = null;
      this.lastTime = null;
      return;
    }
    if (this.frame === null) this.frame = requestAnimationFrame(time => this.tick(time));
  }

  tick(time) {
    // Recheck before every frame so a preference change stops motion immediately,
    // including browsers that deliver MediaQueryList change events late.
    if (this.motionPreference.matches) {
      this.updateButton();
      this.draw();
      this.frame = null;
      this.lastTime = null;
      return;
    }
    if (this.lastTime !== null) this.elapsed += Math.min(time - this.lastTime, 100);
    this.lastTime = time;
    if (this.elapsed >= this.duration + this.hold) {
      this.index = (this.index + 1) % this.cases.length;
      this.elapsed = 0;
      this.render();
    }
    this.draw();
    this.frame = requestAnimationFrame(nextTime => this.tick(nextTime));
  }
}

async function loadComparisons() {
  const panels = document.getElementById("trajectory-panels");
  try {
    const response = await fetch("assets/trajectories/cases.json");
    if (!response.ok) throw new Error(`Trajectory assets: HTTP ${response.status}`);
    const cases = await response.json();
    if (!Array.isArray(cases) || cases.length === 0) throw new Error("No comparison cases available");
    new TrajectoryPlayer(cases);
  } catch (error) {
    panels.replaceChildren();
    const message = document.createElement("div");
    message.className = "trace-error";
    message.setAttribute("role", "status");
    message.textContent = "The recorded paths could not be loaded.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Try again";
    retry.addEventListener("click", loadComparisons);
    message.append(retry);
    panels.append(message);
    console.error(error);
  }
}

loadComparisons();
