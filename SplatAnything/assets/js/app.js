(() => {
  "use strict";

  const content = window.SPLAT_CONTENT || {};
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [
    ...parent.querySelectorAll(selector),
  ];
  const text = (tag, className, value = "") => {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value;
    return element;
  };
  const pad = (value) => String(value).padStart(2, "0");
  const sceneName = (scene, index) => scene?.name || `Scene ${pad(index + 1)}`;
  const methodName = (method, index) =>
    method?.name || `Model ${String.fromCharCode(65 + index)}`;
  const announce = (message) => {
    $("#announcer").textContent = message;
  };

  // Do not turn blank asset paths into requests for the current HTML document.
  function assetURL(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value.trim(), document.baseURI);
      return ["http:", "https:", "file:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  // `viewer` is a SuperSplat standalone HTML: a full URL, a site path starting
  // with "/", "./" or "../", or a path inside `viewerBase` (e.g. a HuggingFace
  // dataset). Pages on another origin are fetched by assets/viewer/loader.html,
  // so nothing is downloaded before "Explore in 3D". Without viewerBase,
  // localViewer supplies an optional local export for validation.
  function viewerURL(data) {
    const value = typeof data.viewer === "string" ? data.viewer.trim() : "";
    const base = assetURL(content.viewerBase);
    const sitePath = /^(?:[a-z][a-z\d+.-]*:|\/|\.\.?\/)/i.test(value);
    if (!value) return "";
    // Resolve the current HTML in the same numbered dataset folder on click.
    // Filenames and sizes can change when the dataset owner reorders cases.
    const dataset = base && new URL(base);
    const repository = dataset?.hostname === "huggingface.co"
      && /^\/datasets\/([^/]+\/[^/]+)\/resolve\//.exec(dataset.pathname)?.[1];
    if (!sitePath && repository && /^[a-z]+\/\d+$/.test(data.viewerDirectory || "")) {
      const loader = new URL("assets/viewer/loader.html", document.baseURI);
      loader.searchParams.set("repo", repository);
      loader.searchParams.set("directory", data.viewerDirectory);
      if (data.label) loader.searchParams.set("label", data.label);
      return loader.href;
    }
    let url;
    try {
      if (sitePath) url = new URL(value, document.baseURI);
      else if (base) url = new URL(value, base.replace(/\/?$/, "/"));
      else {
        const local = assetURL(data.localViewer);
        if (!local) return "";
        url = new URL(local);
      }
    } catch {
      return "";
    }
    if (!["http:", "https:", "file:"].includes(url.protocol)) return "";
    if (url.origin === location.origin) return url.href;
    const loader = new URL("assets/viewer/loader.html", document.baseURI);
    loader.searchParams.set("src", url.href);
    if (Number.isFinite(data.viewerBytes) && data.viewerBytes > 0)
      loader.searchParams.set("bytes", String(data.viewerBytes));
    if (data.label) loader.searchParams.set("label", data.label);
    return loader.href;
  }

  function icon(name, className = "icon") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#icon-${name}`);
    svg.append(use);
    return svg;
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.hidden = true;
    }, 4200);
  }

  function setupProject() {
    const project = content.project || {};
    if (project.name) {
      document.title = project.name;
      $$(".project-name").forEach((element) => {
        if (
          element.closest("#project-title") &&
          project.name === "SplatAnything"
        )
          return;
        element.textContent = project.name;
      });
    }
    if (project.subtitle) $("#project-subtitle").textContent = project.subtitle;
    const subtitle = $("#project-subtitle");
    const subtitleText = subtitle.textContent.replace(/\s+/g, " ").trim();
    const phrase = "Gaussian Spacing Normalization";
    const phraseIndex = subtitleText.indexOf(phrase);
    if (phraseIndex !== -1) {
      subtitle.replaceChildren(
        document.createTextNode(subtitleText.slice(0, phraseIndex)),
        text("mark", "subtitle-highlight", phrase),
        document.createTextNode(
          subtitleText.slice(phraseIndex + phrase.length),
        ),
      );
    }
    if (project.authors?.length) {
      const authors = $("#authors");
      authors.replaceChildren();
      project.authors.forEach((author, index) => {
        const url = assetURL(author.url);
        const element = text(
          url ? "a" : "span",
          "author-name",
          author.name || "",
        );
        if (url) {
          element.href = url;
          element.target = "_blank";
          element.rel = "noopener noreferrer";
        }
        const markers = [author.affiliation, author.corresponding ? "✉" : ""]
          .filter(Boolean)
          .join(",");
        if (markers) {
          const superscript = text("sup", "", markers);
          if (author.corresponding) superscript.title = "Corresponding author";
          element.append(superscript);
        }
        authors.append(element);
      });
    }
    $("#author-note").hidden = !project.authors?.some(
      (author) => author.corresponding,
    );
    if (project.affiliations?.length) {
      const affiliations = $("#affiliations");
      affiliations.replaceChildren();
      project.affiliations.forEach((name, index) => {
        const element = text("span", "affiliation-item");
        element.append(
          text("sup", "", String(index + 1)),
          document.createTextNode(name),
        );
        affiliations.append(element);
      });
    }
    $$("[data-resource]").forEach((link) => {
      const url = assetURL(project.links?.[link.dataset.resource]);
      if (url) {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.removeAttribute("aria-disabled");
        link.removeAttribute("title");
      }
    });
    // A list of points becomes a numbered list; a string stays one paragraph.
    const points = [content.tldr].flat().filter(Boolean);
    const rich = (tag, value) => {
      const element = text(tag, "");
      element.append(...emphasis(value, project.name || "SplatAnything"));
      return element;
    };
    if (points.length > 1) {
      const list = text("ol", "tldr-list");
      list.append(...points.map((point) => rich("li", point)));
      $("#tldr-copy").replaceChildren(list);
    } else if (points.length)
      $("#tldr-copy").replaceChildren(rich("p", points[0]));
  }

  // Plain text with **bold** spans; the project name is set in the title font.
  function emphasis(value, name) {
    const nodes = [];
    String(value)
      .split(/(\*\*[^*]+\*\*)/)
      .forEach((part) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          nodes.push(text("strong", "", part.slice(2, -2)));
          return;
        }
        part.split(name).forEach((piece, index) => {
          if (index) nodes.push(text("strong", "project-name", name));
          if (piece) nodes.push(document.createTextNode(piece));
        });
      });
    return nodes;
  }

  // Muted scene previews yield to the demo film while it plays.
  const previewViewers = [];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let filmPlaying = false;
  const syncPreviews = () =>
    previewViewers.forEach((viewer) => viewer.syncPlayback());

  function setupVideo() {
    const video = content.video || {};
    const source = assetURL(video.src);
    const embed = assetURL(video.embed);
    const poster = assetURL(video.poster);
    const stage = $("#film-stage");
    // The wide placeholder frame gives way to the real video's proportions.
    if (source || embed)
      stage.style.setProperty("--film-ratio", video.aspectRatio || "16 / 9");
    if (source) {
      const player = document.createElement("video");
      player.id = "demo-player";
      player.controls = false;
      player.playsInline = true;
      player.preload = "auto";
      player.setAttribute("aria-label", "SplatAnything demo video");
      if (poster) player.poster = poster;

      const loading = $("#video-loading");
      const loadingStatus = $("#video-loading-status");
      const loadingPercent = $("#video-loading-percent");
      const progress = $("#video-loading-progress");
      const chapterList = $("#video-chapters");
      const chapters = (video.chapters || [])
        .filter((chapter) => Number.isFinite(chapter.time) && chapter.time >= 0)
        .sort((a, b) => a.time - b.time);
      let downloadController = null;
      let objectURL = "";
      let downloaded = false;
      let ready = false;
      let failed = false;
      let received = 0;
      let total = 0;

      function updateLoading() {
        loading.hidden = ready || failed;
        stage.setAttribute("aria-busy", String(!ready && !failed));
        const percent = downloaded
          ? 100
          : total > 0 ? Math.min(99, Math.floor((received / total) * 100)) : 0;
        if (total > 0 || downloaded) {
          progress.value = percent;
          progress.setAttribute("aria-valuetext", `${percent}% downloaded`);
        } else {
          progress.removeAttribute("value");
          progress.setAttribute(
            "aria-valuetext",
            `${(received / 1024 / 1024).toFixed(1)} MB downloaded`,
          );
        }
        loadingPercent.textContent = `${percent}%`;
        const message = ready
          ? "Video ready"
          : downloaded ? "Preparing video…" : "Downloading video…";
        if (loadingStatus.textContent !== message)
          loadingStatus.textContent = message;
      }

      const chapterButtons = chapters.map((chapter) => {
        const button = text("button", "video-chapter");
        button.type = "button";
        button.disabled = true;
        button.dataset.category = chapter.id;
        button.setAttribute("aria-controls", player.id);
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", `Play ${chapter.label}`);
        button.append(icon(chapter.id), text("span", "", chapter.label));
        button.addEventListener("click", () => {
          if (!ready) return;
          player.currentTime = Math.min(
            chapter.time,
            Math.max(0, player.duration - 0.01),
          );
          player.play().catch((error) => {
            if (error.name === "NotAllowedError")
              showToast("Press play to watch the selected chapter.");
          });
        });
        return button;
      });
      chapterList.replaceChildren(...chapterButtons);
      chapterList.hidden = chapterButtons.length === 0;

      function updateChapter() {
        let active = -1;
        chapters.forEach((chapter, index) => {
          if (player.currentTime >= chapter.time) active = index;
        });
        chapterButtons.forEach((button, index) =>
          button.setAttribute("aria-pressed", String(index === active)),
        );
      }

      player.addEventListener("canplay", () => {
        if (!downloaded || failed) return;
        ready = true;
        player.controls = true;
        chapterButtons.forEach((button) => {
          button.disabled = false;
        });
        updateLoading();
      });
      player.addEventListener("seeked", updateChapter);
      player.addEventListener("timeupdate", updateChapter);

      function showVideoError() {
        if (failed) return;
        failed = true;
        ready = false;
        downloadController?.abort();
        player.pause();
        player.controls = false;
        filmPlaying = false;
        syncPreviews();
        updateLoading();
        chapterButtons.forEach((button) => {
          button.disabled = true;
        });
        const fallback = text("div", "video-error");
        fallback.append(text("p", "", "The video is unavailable."));
        const retry = text("button", "button", "Retry video");
        retry.type = "button";
        retry.addEventListener("click", downloadVideo);
        const link = text("a", "mono", "Open video ↗");
        link.href = source;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        fallback.append(retry, link);
        stage.replaceChildren(fallback);
      }

      player.addEventListener("error", () => {
        if (downloaded) showVideoError();
      });

      async function downloadVideo() {
        downloadController?.abort();
        const controller = new AbortController();
        downloadController = controller;
        downloaded = false;
        ready = false;
        failed = false;
        received = 0;
        total = 0;
        player.pause();
        player.controls = false;
        player.removeAttribute("src");
        player.load();
        if (objectURL) URL.revokeObjectURL(objectURL);
        objectURL = "";
        chapterButtons.forEach((button) => {
          button.disabled = true;
        });
        stage.replaceChildren(player, loading);
        updateChapter();
        updateLoading();

        try {
          // Native preload can stop early. Fetch the complete file before the
          // player receives a source, so playback and seeking use local bytes.
          const response = await fetch(source, { signal: controller.signal });
          if (!response.ok) throw new Error(`Video download: ${response.status}`);
          total = Number(response.headers.get("Content-Length")) || 0;
          updateLoading();
          let blob;
          if (response.body) {
            const reader = response.body.getReader();
            const parts = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              parts.push(value);
              received += value.byteLength;
              updateLoading();
            }
            blob = new Blob(parts, {
              type: response.headers.get("Content-Type") || "video/mp4",
            });
          } else {
            blob = await response.blob();
            received = blob.size;
          }
          if (controller.signal.aborted) return;
          if (
            !blob.size ||
            (total && !response.headers.get("Content-Encoding") && received !== total)
          )
            throw new Error("Incomplete video download");
          objectURL = URL.createObjectURL(blob);
          downloaded = true;
          updateLoading();
          player.src = objectURL;
        } catch (error) {
          if (!controller.signal.aborted) showVideoError();
        }
      }

      window.addEventListener("pagehide", (event) => {
        if (event.persisted) return;
        downloadController?.abort();
        if (objectURL) URL.revokeObjectURL(objectURL);
      });
      player.addEventListener("play", () => {
        filmPlaying = true;
        syncPreviews();
      });
      for (const type of ["pause", "ended"])
        player.addEventListener(type, () => {
          filmPlaying = false;
          syncPreviews();
        });
      downloadVideo();
    } else if (embed) {
      const frame = document.createElement("iframe");
      frame.title = "SplatAnything demo video";
      frame.loading = "lazy";
      frame.allow = "fullscreen; picture-in-picture; encrypted-media";
      frame.allowFullscreen = true;
      frame.src = embed;
      stage.replaceChildren(frame);
    }
    if (video.caption) {
      $("#video-caption").textContent = video.caption;
      $("#video-caption").hidden = false;
    }
  }

  // These line drawings are neutral template artwork, not research results.
  const categoryArtwork = { object: 0, street: 1, indoor: 2, aerial: 3, rig: 1, pano: 2 };
  function thumbnailGeometry(index, category) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 240 95");
    svg.setAttribute("class", "thumbnail-geometry");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svg.namespaceURI, "path");
    const shapes = [
      "M120 13 160 34 120 57 80 35Z M80 35v28l40 23 40-23V34 M120 57v29 M100 24l40 22v28 M140 24l-40 22v28 M80 49l40 23 40-23",
      "M70 61 109 82 174 46 135 25Z M70 61V28l39 21v33 M70 28l65-16 39 21v13 M109 49l65-16 M90 71V39 M132 68V42 M153 58V38 M70 44l39 21 65-26",
      "M59 66 120 85 182 64 122 44Z M59 66V41l63-20 60 18v25 M59 41l61 21 62-23 M120 62v23 M90 31l61 20v24 M152 30 90 52v24 M70 55l51 17 51-17",
      "M50 68 118 86 190 61 123 42Z M75 74V35l26 7v39 M75 35l23-8 26 8v43 M101 42l23-7 M137 79V20l22 7v45 M137 20l20-7 22 7v45 M159 27l20-7 M50 68l73-26",
    ];
    path.setAttribute("d", shapes[categoryArtwork[category] ?? index % 4]);
    svg.append(path);
    return svg;
  }

  function sceneButton(scene, index, category, onSelect) {
    const name = sceneName(scene, index);
    const button = text("button", "scene-card");
    button.type = "button";
    button.dataset.sceneId = scene.id;
    button.setAttribute(
      "aria-label",
      `Select ${name}${scene.dataset ? `, ${scene.dataset}` : ""}`,
    );
    button.setAttribute("aria-pressed", "false");
    const thumbnail = text("span", "scene-thumb");
    const artwork = thumbnailGeometry(index, category);
    const placeholderLabel = text(
      "span",
      "thumb-placeholder-label",
      ["rig", "pano"].includes(category) ? "PREVIEW COMING SOON" : "IMAGE PLACEHOLDER",
    );
    thumbnail.append(artwork, placeholderLabel);
    const url = assetURL(scene.thumbnail || scene.poster || scene.ours?.poster);
    if (url) {
      const image = document.createElement("img");
      image.alt = ""; // The surrounding button already supplies the scene name.
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("load", () => {
        artwork.remove();
        placeholderLabel.hidden = true;
      });
      image.addEventListener(
        "error",
        () => {
          image.remove();
        },
        { once: true },
      );
      image.src = url;
      thumbnail.append(image);
    }
    const caption = text("span", "scene-card-caption");
    caption.append(
      text("span", "", name),
      text("span", "scene-number", pad(index + 1)),
    );
    button.append(thumbnail, caption, text("span", "scene-active-dot", "✓"));
    button.addEventListener("click", (event) => onSelect(index, event));
    return button;
  }

  function selectThumbnail(grid, index) {
    $$(".scene-card", grid).forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
  }

  function setupGridKeys(grid) {
    grid.addEventListener("keydown", (event) => {
      const buttons = $$(".scene-card", grid);
      const index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      // Up and down move by one visual row of the responsive grid.
      const columns =
        getComputedStyle(grid).gridTemplateColumns.split(" ").length || 1;
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
      if (event.key === "ArrowLeft")
        next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === "ArrowDown")
        next = Math.min(index + columns, buttons.length - 1);
      if (event.key === "ArrowUp") next = Math.max(index - columns, 0);
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      buttons[next].focus({ preventScroll: true });
      buttons[next].scrollIntoView({ block: "nearest", behavior: "instant" });
      buttons[next].click();
    });
  }

  // A scene shows its poster and looping preview first; the SuperSplat iframe
  // is only created after "Explore in 3D", as on the InfiniSplat v2 page.
  class Viewer {
    constructor(id) {
      this.stage = document.getElementById(id);
      this.resetButton = $(`[data-reset="${id}"]`);
      this.backButton = $(`[data-back="${id}"]`);
      this.openLink = $(`[data-standalone="${id}"]`);
      this.closeButton = text("button", "fullscreen-close", "Close view ×");
      this.closeButton.type = "button";
      this.closeButton.addEventListener("click", closeExpanded);
      this.generation = 0;
      this.data = {};
      this.url = "";
      this.interactive = false;
      this.visible = false;
      this.video = null;
      this.onExplore = () =>
        this.set(this.data, { interactive: true, focus: true });
      this.onBack = () => {
        this.set(this.data, { interactive: false });
        $(".explore-button", this.stage)?.focus({ preventScroll: true });
      };
      this.resetButton?.addEventListener("click", () =>
        this.set(this.data, { interactive: true, force: true }),
      );
      this.backButton?.addEventListener("click", () => this.onBack());
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (entries) => {
            this.visible = entries.some((entry) => entry.isIntersecting);
            this.syncPlayback();
          },
          { rootMargin: "120px" },
        ).observe(this.stage);
      } else this.visible = true;
      previewViewers.push(this);
    }

    set(data, { interactive = false, force = false, focus = false } = {}) {
      const url = viewerURL(data);
      interactive = interactive && Boolean(url);
      // Avoid reloading the unchanged side when only the baseline model changes.
      const same =
        data.key === this.data.key &&
        url === this.url &&
        interactive === this.interactive;
      if (!force && same && this.stage.children.length) return;
      this.data = data;
      this.url = url;
      this.interactive = interactive;
      this.generation += 1;
      this.video = null;
      clearTimeout(this.timer);
      // Stop the previous scene's download before replacing its iframe.
      $("iframe", this.stage)?.contentWindow?.postMessage(
        { type: "splatanything-cancel-download" },
        location.origin === "null" ? "*" : location.origin,
      );
      this.stage.replaceChildren(); // Removing the iframe releases the previous scene.
      this.stage.setAttribute("aria-label", data.label || "3D scene viewer");
      this.stage.setAttribute("aria-busy", "false");
      this.stage.dataset.scene = data.key || "";
      this.stage.classList.toggle("is-interactive", interactive);
      if (data.aspectRatio)
        this.stage.style.setProperty("--stage-ratio", data.aspectRatio);
      else this.stage.style.removeProperty("--stage-ratio");
      if (this.resetButton) this.resetButton.disabled = !interactive;
      if (this.backButton) this.backButton.hidden = !interactive;
      if (this.openLink) {
        if (url) {
          this.openLink.href = url;
          this.openLink.target = "_blank";
          this.openLink.rel = "noopener noreferrer";
          this.openLink.removeAttribute("aria-disabled");
        } else {
          this.openLink.removeAttribute("href");
          this.openLink.setAttribute("aria-disabled", "true");
        }
      }
      this.stage.append(this.closeButton);
      if (interactive) {
        const loading = text("div", "viewer-loading");
        loading.append(
          text("span", "loading-ring"),
          text("span", "", "Opening 3D viewer"),
        );
        this.stage.append(loading);
        this.mountFrame(this.generation, loading, focus);
      } else if (url || data.poster || data.preview) this.showPreview(data);
      else this.showEmpty(data);
    }

    showPreview(data) {
      const preview = text("div", "viewer-preview");
      const poster = assetURL(data.poster);
      const source = assetURL(data.preview);
      if (poster) {
        // A blurred copy fills the stage when the poster's aspect ratio differs.
        const backdrop = document.createElement("img");
        backdrop.className = "preview-backdrop";
        backdrop.alt = "";
        backdrop.decoding = "async";
        backdrop.addEventListener("error", () => backdrop.remove(), {
          once: true,
        });
        backdrop.src = poster;
        preview.append(backdrop);
        const image = document.createElement("img");
        image.className = "preview-poster";
        image.alt = "";
        image.decoding = "async";
        image.addEventListener("error", () => image.remove(), { once: true });
        image.src = poster;
        preview.append(image);
      }
      if (source) {
        const video = document.createElement("video");
        video.className = "preview-video";
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "none";
        video.setAttribute("aria-hidden", "true");
        video.dataset.src = source;
        // Hide the frame until it can paint, so the poster never flashes black.
        video.addEventListener("loadeddata", () =>
          video.classList.add("is-ready"),
        );
        video.addEventListener("error", () => video.remove(), { once: true });
        preview.append(video);
        this.video = video;
      }
      if (!poster && !source) {
        preview.classList.add("is-blank");
        const orbit = text("div", "empty-orbit");
        orbit.setAttribute("aria-hidden", "true");
        orbit.append(icon("cube", "empty-cube"));
        preview.append(orbit);
        if (this.stage.id === "application-viewer")
          preview.append(text("span", "preview-pending", "Preview coming soon"));
      }
      if (this.url) {
        const explore = text("button", "explore-button");
        explore.type = "button";
        explore.append(
          document.createTextNode("Explore in 3D"),
          icon("diagonal"),
        );
        explore.setAttribute("aria-label", `Explore ${data.label} in 3D`);
        explore.title = "Download this scene’s HTML viewer and explore in 3D";
        if (["qualitative-viewer", "application-viewer"].includes(this.stage.id))
          explore.setAttribute("aria-describedby", this.stage.id.replace("-viewer", "-download-hint"));
        explore.addEventListener("click", () => this.onExplore(this));
        preview.append(explore);
      } else
        preview.append(text("span", "preview-badge mono", "3D VIEWER SOON"));
      this.stage.append(preview);
      this.syncPlayback();
    }

    syncPlayback() {
      const video = this.video;
      if (!video?.isConnected) return;
      if (!this.visible) {
        video.pause();
        return;
      }
      // Load lazily, but keep a still first frame for reduced-motion visitors.
      if (!video.getAttribute("src")) {
        video.preload = "auto";
        video.src = video.dataset.src;
      }
      if (!document.hidden && !reducedMotion.matches && !filmPlaying)
        video.play().catch(() => {});
      else video.pause();
    }

    showEmpty(data) {
      const empty = text("div", "viewer-empty");
      const orbit = text("div", "empty-orbit");
      orbit.setAttribute("aria-hidden", "true");
      orbit.append(icon("cube", "empty-cube"));
      empty.append(
        orbit,
        text(
          "span",
          "empty-title",
          data.emptyTitle || "A scene, waiting to be explored.",
        ),
        text("span", "empty-description", "3D scene coming soon"),
        text("span", "empty-scene-id mono", data.label || "SCENE PLACEHOLDER"),
      );
      for (const corner of ["tl", "tr", "bl", "br"]) {
        const element = text("i", `viewport-corner ${corner}`);
        element.setAttribute("aria-hidden", "true");
        empty.append(element);
      }
      this.stage.append(empty);
    }

    mountFrame(generation, loading, focus) {
      const frame = document.createElement("iframe");
      frame.title = `${this.data.label} — interactive SuperSplat viewer`;
      frame.allow = "fullscreen; xr-spatial-tracking";
      frame.allowFullscreen = true;
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      this.stage.setAttribute("aria-busy", "true");
      const settle = () => {
        if (generation !== this.generation) return false;
        clearTimeout(this.timer);
        this.stage.setAttribute("aria-busy", "false");
        return true;
      };
      frame.addEventListener(
        "load",
        () => {
          if (!settle()) return;
          // iframe load means the viewer page is open; SuperSplat handles asset progress.
          loading.remove();
        },
        { once: true },
      );
      frame.addEventListener(
        "error",
        () => {
          if (settle())
            this.showLoadHelp(loading, "This viewer could not be opened.");
        },
        { once: true },
      );
      this.timer = setTimeout(() => {
        if (settle())
          this.showLoadHelp(
            loading,
            "The viewer is taking longer than expected.",
          );
      }, 30000);
      frame.src = this.url;
      this.stage.prepend(frame);
      // WASD fly controls need keyboard focus inside the viewer.
      if (focus) frame.focus({ preventScroll: true });
    }

    showLoadHelp(overlay, message) {
      overlay.replaceChildren(
        text("span", "", message),
        text("p", "", "Try again, or open the scene in its own window."),
      );
      const retry = text("button", "", "Try again");
      retry.type = "button";
      retry.addEventListener("click", () =>
        this.set(this.data, { interactive: true, force: true }),
      );
      const open = text("a", "", "Open viewer ↗");
      open.href = this.url;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      const show = text("button", "", "Show viewer");
      show.type = "button";
      show.addEventListener("click", () => overlay.remove());
      overlay.append(retry, open, show);
    }
  }

  // Category tabs + scene grid shared by the gallery and the comparison.
  const categoryIcons = ["object", "indoor", "street", "aerial", "rig", "pano"];
  function setupCategories({ prefix, groups, onScene, emptyText }) {
    const tabs = $(`#${prefix}-tabs`);
    const grid = $(`#${prefix}-scenes`);
    const panel = $(`#${prefix}-panel`);
    const selections = new Map();
    let current;
    function chooseScene(index, event) {
      const scene = current?.scenes?.[index];
      if (!scene) return;
      selections.set(current.id, index);
      selectThumbnail(grid, index);
      onScene(current, scene, index, true);
      // Cards sit below the viewer; bring it back into view after a pointer click.
      if (event?.detail)
        panel.firstElementChild.scrollIntoView({
          block: "nearest",
          behavior: reducedMotion.matches ? "instant" : "smooth",
        });
    }
    function chooseGroup(index, notify = true) {
      current = groups[index];
      if (!current) return;
      $$(".category-tab", tabs).forEach((button, i) => {
        button.setAttribute("aria-selected", String(i === index));
        button.tabIndex = i === index ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", `${prefix}-tab-${index}`);
      panel.dataset.category = current.id;
      const scenes = current.scenes || [];
      const count = $(`#${prefix}-count`);
      if (count)
        count.textContent =
          `${pad(scenes.length)} SCENE${scenes.length === 1 ? "" : "S"}`;
      grid.replaceChildren(
        ...scenes.map((scene, i) =>
          sceneButton(scene, i, current.id, chooseScene),
        ),
      );
      if (scenes.length) {
        const selected = Math.min(
          selections.get(current.id) || 0,
          scenes.length - 1,
        );
        selectThumbnail(grid, selected);
        onScene(current, scenes[selected], selected, notify);
      } else {
        grid.append(text("p", "empty-scenes", emptyText));
        onScene(current, null, -1, notify);
      }
    }
    groups.forEach((group, index) => {
      const tab = text("button", "category-tab");
      tab.type = "button";
      tab.id = `${prefix}-tab-${index}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `${prefix}-panel`);
      const name = categoryIcons.includes(group.id) ? group.id : "cube";
      tab.append(
        icon(name, "icon category-icon"),
        text("span", "", group.label || group.id),
      );
      tab.addEventListener("click", () => chooseGroup(index));
      tabs.append(tab);
    });
    tabs.addEventListener("keydown", (event) => {
      const buttons = $$(".category-tab", tabs);
      const index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
      if (event.key === "ArrowLeft")
        next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      chooseGroup(next);
      buttons[next].focus({ preventScroll: true });
    });
    setupGridKeys(grid);
    if (groups.length) chooseGroup(0, false);
    else {
      grid.append(text("p", "empty-scenes", emptyText));
      onScene(null, null, -1, false);
    }
  }

  function setupGallery(prefix, groups) {
    const viewer = new Viewer(`${prefix}-viewer`);
    setupCategories({
      prefix,
      groups: groups || [],
      emptyText: "Scenes coming soon.",
      onScene(group, scene, index, notify) {
        const label = group?.label || "Scene gallery";
        if (!scene) {
          $(`#${prefix}-scene-name`).textContent = "Scenes coming soon";
          $(`#${prefix}-dataset`).textContent = group?.label || "";
          viewer.set({ key: group?.id || "empty", label });
          return;
        }
        const name = sceneName(scene, index);
        $(`#${prefix}-scene-name`).textContent = name;
        $(`#${prefix}-dataset`).textContent = scene.dataset || label;
        // A new scene always starts from its preview, as on InfiniSplat v2.
        viewer.set({
          key: scene.id,
          viewer: scene.viewer,
          viewerDirectory: scene.viewerDirectory,
          viewerBytes: scene.viewerBytes,
          localViewer: scene.localViewer,
          poster: scene.poster,
          preview: scene.preview,
          aspectRatio: scene.aspectRatio,
          label: `${label} / ${name}`,
        });
        if (notify) announce(`${label}, ${name} selected.`);
      },
    });
  }

  // A method entry is either { poster, preview, viewer } or a viewer URL string.
  const media = (value) =>
    typeof value === "string" ? { viewer: value } : value || {};

  function setupComparison() {
    const config = content.comparison || {};
    const methods = config.methods || [];
    const select = $("#model-select");
    const ours = new Viewer("ours-viewer");
    const baseline = new Viewer("baseline-viewer");
    const back = $("#comparison-back");
    let current = null;
    let interactive = false;
    methods.forEach((method, index) => {
      const option = text("option", "", methodName(method, index));
      option.value = method.id;
      select.append(option);
    });
    if (!methods.length) {
      select.append(text("option", "", "Methods coming soon"));
      select.disabled = true;
    }
    // Exploring either side opens both, so the two methods stay side by side.
    const explore = (viewer) => {
      interactive = true;
      render(false, viewer);
    };
    const leave = () => {
      interactive = false;
      render(false);
      $(".explore-button", ours.stage)?.focus({ preventScroll: true });
    };
    ours.onExplore = baseline.onExplore = explore;
    back.addEventListener("click", leave);

    // Previews of the same trajectory follow the left (Ours) clock.
    function alignPreviews() {
      const leader = ours.video;
      const follower = baseline.video;
      if (!leader?.isConnected || !follower?.isConnected) return;
      if (follower.readyState < 1 || leader.readyState < 1) return;
      if (Math.abs(follower.currentTime - leader.currentTime) > 0.3)
        follower.currentTime = leader.currentTime;
    }

    function render(notify, focused) {
      const { group, scene, index } = current || {};
      const methodIndex = methods.findIndex(
        (method) => method.id === select.value,
      );
      const method = methodName(
        methods[methodIndex],
        methodIndex < 0 ? 0 : methodIndex,
      );
      $("#baseline-method-label").textContent = method;
      if (!scene) {
        $$(".compare-scene-name").forEach((element) => {
          element.textContent = "Scenes coming soon";
        });
        ours.set({
          key: "empty-ours",
          label: "Ours",
          emptyTitle: "Our reconstruction",
        });
        baseline.set({
          key: "empty-baseline",
          label: method,
          emptyTitle: method,
        });
        back.hidden = true;
        return;
      }
      const name = sceneName(scene, index);
      $$(".compare-scene-name").forEach((element) => {
        element.textContent = name;
      });
      const left = media(scene.ours);
      const right = media(scene.models?.[select.value]);
      const previousLeader = ours.video;
      ours.set(
        {
          ...left,
          key: scene.id,
          aspectRatio: scene.aspectRatio,
          label: `${name} / Ours`,
          emptyTitle: "Our reconstruction",
        },
        { interactive, focus: focused === ours },
      );
      baseline.set(
        {
          ...right,
          key: `${scene.id}-${select.value}`,
          aspectRatio: scene.aspectRatio,
          label: `${name} / ${method}`,
          emptyTitle: method,
        },
        { interactive, focus: focused === baseline },
      );
      if (ours.video && ours.video !== previousLeader)
        ours.video.addEventListener("timeupdate", alignPreviews);
      baseline.video?.addEventListener("loadeddata", alignPreviews);
      back.hidden = !ours.interactive && !baseline.interactive;
      $("#comparison-hint").textContent =
        ours.interactive || baseline.interactive
          ? "Live 3D viewers are open. Drag inside each one to orbit."
          : "Switch the method on the right to compare.";
      if (notify)
        announce(`${group.label}, ${name}: Ours compared with ${method}.`);
    }

    select.addEventListener("change", () => render(true));
    setupCategories({
      prefix: "comparison",
      groups: config.categories || [],
      emptyText: "Comparison scenes coming soon.",
      onScene(group, scene, index, notify) {
        current = scene ? { group, scene, index } : null;
        // A new scene returns both sides to their previews.
        interactive = false;
        render(notify);
      },
    });
  }

  function setupClosing() {
    const thanks = content.acknowledgements || {};
    const copy = $("#acknowledgements-copy");
    const names = Object.keys(thanks.links || {}).filter(
      (name) => name && assetURL(thanks.links[name]),
    );
    // Split around the linked names, keeping everything else as plain text.
    const escaped = names.map((name) =>
      name.replace(/[.*+?^$|()[\]{}\\]/g, "\\$&"),
    );
    const pattern = names.length ? new RegExp(`(${escaped.join("|")})`) : null;
    (pattern ? (thanks.text || "").split(pattern) : [thanks.text || ""])
      .filter(Boolean)
      .forEach((part) => {
        if (!names.includes(part)) {
          copy.append(document.createTextNode(part));
          return;
        }
        const link = text("a", "", part);
        link.href = assetURL(thanks.links[part]);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        copy.append(link);
      });
    $("#acknowledgements").hidden = !thanks.text;

    const code = $("#citation-code");
    const button = $("#copy-citation");
    code.textContent = (content.citation || "").trim();
    $("#citation").hidden = !code.textContent;
    const label = $("span", button);
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        label.textContent = "Copied";
        announce("Citation copied to clipboard.");
      } catch {
        // Clipboard access can be blocked; select the text for a manual copy.
        getSelection().selectAllChildren(code);
        label.textContent = "Selected";
        announce("Citation selected. Use your browser copy command.");
      }
      clearTimeout(button.timer);
      button.timer = setTimeout(() => {
        label.textContent = "Copy";
      }, 2000);
    });
  }

  let expandedStage = null;
  let fullscreenTrigger = null;
  function closeExpanded() {
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .catch(() => showToast("Use Esc to exit fullscreen."));
    }
    if (expandedStage) {
      expandedStage.classList.remove("is-expanded");
      expandedStage = null;
      document.body.classList.remove("has-expanded-viewer");
      fullscreenTrigger?.focus({ preventScroll: true });
    }
  }

  function setupFullscreen() {
    $$("[data-fullscreen]").forEach((button) => {
      button.addEventListener("click", async () => {
        const stage = document.getElementById(button.dataset.fullscreen);
        fullscreenTrigger = button;
        if (stage.requestFullscreen) {
          try {
            await stage.requestFullscreen();
            $(".fullscreen-close", stage).focus({ preventScroll: true });
            return;
          } catch {
            /* Embedded browsers may disallow the Fullscreen API. */
          }
        }
        closeExpanded();
        fullscreenTrigger = button;
        expandedStage = stage;
        stage.classList.add("is-expanded");
        document.body.classList.add("has-expanded-viewer");
        $(".fullscreen-close", stage).focus({ preventScroll: true });
      });
    });
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement)
        fullscreenTrigger?.focus({ preventScroll: true });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && expandedStage) closeExpanded();
      if (event.key === "Tab" && expandedStage) {
        const focusable = $$(
          "button:not([disabled]), a[href], iframe",
          expandedStage,
        ).filter((element) => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
  }

  function setupNavigation() {
    const sections = $$("main section");
    const links = $$("nav a");
    let scheduled = false;
    function update() {
      scheduled = false;
      let active = "";
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top < innerHeight * 0.38)
          active = section.id;
      });
      links.forEach((link) => {
        if (link.hash === `#${active}`)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    addEventListener(
      "scroll",
      () => {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    addEventListener("resize", update, { passive: true });
    update();
  }

  function setupSplatWord() {
    const word = $("#splat-word");
    if (!word) return;
    const ink = $(".splat-ink", word);
    const ns = "http://www.w3.org/2000/svg";
    let lastSize = "";

    function buildSplats() {
      // Measure the stable wrapper, not the animated/scaled ink layer.
      const { width, height } = word.getBoundingClientRect();
      if (!width || !height) return;
      const style = getComputedStyle(ink);
      const sizeKey = `${width}:${height}:${style.fontFamily}`;
      if (sizeKey === lastSize) return;
      lastSize = sizeKey;
      const fontSize = parseFloat(style.fontSize);
      // The detached canvas samples the local font once per resize. Only SVG
      // ellipses inside the word are animated; no page-level particle renderer.
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width);
      canvas.height = Math.ceil(height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.fillStyle = "#000";
      const metrics = ctx.measureText("Splat");
      const ascent = metrics.fontBoundingBoxAscent || fontSize * 0.9;
      const descent = metrics.fontBoundingBoxDescent || fontSize * 0.23;
      const baseline = (height - ascent - descent) / 2 + ascent;
      const spacing = parseFloat(style.letterSpacing) || 0;
      if ("letterSpacing" in ctx) {
        ctx.letterSpacing = `${spacing}px`;
        ctx.fillText("Splat", 0, baseline);
      } else {
        [..."Splat"].forEach((letter, index) => {
          ctx.fillText(
            letter,
            ctx.measureText("Splat".slice(0, index)).width + spacing * index,
            baseline,
          );
        });
      }
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const step = Math.max(2.5, fontSize / 22);
      const points = [];
      for (let y = step / 2; y < height; y += step) {
        for (let x = step / 2; x < width; x += step) {
          const alpha =
            pixels[(Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3];
          if (alpha > 85) points.push({ x, y });
        }
      }
      if (!points.length) return;
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("class", "splat-particles");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      const defs = document.createElementNS(ns, "defs");
      for (const [id, color] of [
        ["splat-ink-dark", "#18181b"],
        ["splat-ink-blue", "#3080ff"],
      ]) {
        const gradient = document.createElementNS(ns, "radialGradient");
        gradient.id = id;
        for (const [offset, opacity] of [
          ["0%", ".95"],
          ["45%", ".8"],
          ["100%", "0"],
        ]) {
          const stop = document.createElementNS(ns, "stop");
          stop.setAttribute("offset", offset);
          stop.setAttribute("stop-color", color);
          stop.setAttribute("stop-opacity", opacity);
          gradient.append(stop);
        }
        defs.append(gradient);
      }
      svg.append(defs);
      const stride = Math.max(1, Math.ceil(points.length / 180));
      points
        .filter((_, index) => index % stride === 0)
        .forEach(({ x, y }, index) => {
          const dot = document.createElementNS(ns, "ellipse");
          dot.setAttribute("class", "splat-dab");
          dot.setAttribute("cx", x);
          dot.setAttribute("cy", y);
          dot.setAttribute("rx", step * (1 + (index % 3) * 0.1));
          dot.setAttribute("ry", step * 0.78);
          dot.setAttribute(
            "fill",
            `url(#${index % 6 === 0 ? "splat-ink-blue" : "splat-ink-dark"})`,
          );
          dot.style.setProperty(
            "--dx",
            `${((x - width / 2) * 0.15 + Math.sin(index * 2.4) * fontSize * 0.06).toFixed(2)}px`,
          );
          dot.style.setProperty(
            "--dy",
            `${((y - height / 2) * 0.24 + Math.cos(index * 1.7) * fontSize * 0.05).toFixed(2)}px`,
          );
          dot.style.setProperty(
            "--rotation",
            `${((index * 37) % 100) - 50}deg`,
          );
          svg.append(dot);
        });
      $(".splat-particles", word)?.remove();
      word.append(svg);
      word.classList.add("splats-ready");
      word.getAnimations({ subtree: true }).forEach((animation) => {
        animation.currentTime = 0;
      });
    }

    document.fonts.ready.then(() => {
      buildSplats();
      if ("ResizeObserver" in window)
        new ResizeObserver(buildSplats).observe(word);
      else addEventListener("resize", buildSplats, { passive: true });
    });
    // Hover replays the brief dispersion; the normal loop rests most of the time.
    word.addEventListener("pointerenter", (event) => {
      if (
        event.pointerType !== "mouse" ||
        $(".hero").matches(".is-title-still, .is-motion-paused")
      )
        return;
      word.getAnimations({ subtree: true }).forEach((animation) => {
        animation.currentTime = 650;
      });
    });
  }

  function setupTitleMotion() {
    const hero = $(".hero");
    const toggle = $("#title-motion-toggle");
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let paused = false;
    let visible = true;

    function sync() {
      const still = paused || preference.matches;
      hero.classList.toggle("is-title-still", still);
      hero.classList.toggle("is-motion-paused", !visible || document.hidden);
      toggle.hidden = preference.matches;
      toggle.setAttribute("aria-pressed", String(paused));
      const label = paused ? "Play title animation" : "Pause title animation";
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      $("use", toggle).setAttribute(
        "href",
        paused ? "#icon-play" : "#icon-pause",
      );
    }

    toggle.addEventListener("click", () => {
      paused = !paused;
      sync();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    sync();
  }

  document.addEventListener("visibilitychange", syncPreviews);
  reducedMotion.addEventListener("change", syncPreviews);
  setupProject();
  setupVideo();
  setupGallery("qualitative", content.qualitative);
  setupGallery("application", content.application);
  // Temporarily disabled together with the comparison section in index.html.
  // setupComparison();
  setupClosing();
  setupFullscreen();
  setupNavigation();
  setupTitleMotion();
  setupSplatWord();
})();
