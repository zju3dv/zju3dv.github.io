"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const demo = document.querySelector("#interactive-demo");
  if (!demo || typeof DEMO_DATA === "undefined" || DEMO_DATA.length === 0) {
    return;
  }

  const elements = {
    sceneName: document.querySelector("#scene-name"),
    sceneMap: document.querySelector("#scene-map"),
    previousScene: document.querySelector("#previous-scene"),
    nextScene: document.querySelector("#next-scene"),
    sceneDots: document.querySelector("#scene-dots"),
    modeButtons: Array.from(document.querySelectorAll(".mode-button")),
    singlePanel: document.querySelector("#single-panel"),
    observationList: document.querySelector("#observation-list"),
    singleResult: document.querySelector("#single-result"),
    sequentialPanel: document.querySelector("#sequential-panel"),
    sequentialVideo: document.querySelector("#sequential-video")
  };

  const state = {
    selectedFloorplan: 0,
    selectedMode: "single",
    selectedObservation: 0
  };

  function currentScene() {
    return DEMO_DATA[state.selectedFloorplan];
  }

  function buildSceneDots() {
    const fragment = document.createDocumentFragment();

    DEMO_DATA.forEach((scene, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scene-dot";
      button.dataset.sceneIndex = String(index);
      button.setAttribute("aria-label", `Show ${scene.name} floorplan`);
      button.title = scene.name;
      button.addEventListener("click", () => selectScene(index));
      fragment.appendChild(button);
    });

    elements.sceneDots.replaceChildren(fragment);
  }

  function renderSceneHeader() {
    const scene = currentScene();
    elements.sceneName.textContent = scene.name;
    elements.sceneMap.src = scene.map;
    elements.sceneMap.alt = `${scene.name} floorplan`;

    Array.from(elements.sceneDots.children).forEach((dot, index) => {
      const isActive = index === state.selectedFloorplan;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function renderSinglePanel() {
    const scene = currentScene();
    const fragment = document.createDocumentFragment();

    scene.single.forEach((item, index) => {
      const button = document.createElement("button");
      const image = document.createElement("img");
      const isActive = index === state.selectedObservation;

      button.type = "button";
      button.className = "observation-button";
      button.classList.toggle("is-active", isActive);
      button.dataset.number = String(index + 1);
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-label", `Select observation ${index + 1} from ${scene.name}`);
      button.setAttribute("aria-pressed", String(isActive));

      image.src = item.image;
      image.alt = `${scene.name} observation ${index + 1}`;
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";

      button.appendChild(image);
      button.addEventListener("click", () => selectObservation(index));
      fragment.appendChild(button);
    });

    elements.observationList.replaceChildren(fragment);
    updateSingleResult();
  }

  function updateSingleResult() {
    const scene = currentScene();
    const selected = scene.single[state.selectedObservation];
    elements.singleResult.src = selected.result;
    elements.singleResult.alt = `${scene.name} localization result for observation ${state.selectedObservation + 1}`;

    Array.from(elements.observationList.children).forEach((button, index) => {
      const isActive = index === state.selectedObservation;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function restartSequentialVideo() {
    const scene = currentScene();
    const video = elements.sequentialVideo;
    video.pause();
    video.muted = true;
    video.src = scene.sequential.video;
    video.setAttribute("aria-label", `${scene.name}: camera observation on the left and localization result on the right`);
    video.load();
    // Both panels are encoded in the same frame and share a single playback clock.
    // Native controls remain available if the browser blocks autoplay.
    video.play().catch(() => {});
  }

  function clearSequentialVideo() {
    const video = elements.sequentialVideo;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  function renderMode() {
    const isSingle = state.selectedMode === "single";
    elements.singlePanel.hidden = !isSingle;
    elements.sequentialPanel.hidden = isSingle;

    elements.modeButtons.forEach((button) => {
      const isActive = button.dataset.mode === state.selectedMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (isSingle) {
      clearSequentialVideo();
      renderSinglePanel();
    } else {
      restartSequentialVideo();
    }
  }

  function selectScene(index) {
    const totalScenes = DEMO_DATA.length;
    state.selectedFloorplan = (index + totalScenes) % totalScenes;
    state.selectedObservation = 0;
    renderSceneHeader();
    renderMode();
  }

  function selectObservation(index) {
    state.selectedObservation = index;
    updateSingleResult();
  }

  function selectMode(mode) {
    if (mode !== "single" && mode !== "sequential") {
      return;
    }

    state.selectedMode = mode;
    renderMode();
  }

  elements.previousScene.addEventListener("click", () => selectScene(state.selectedFloorplan - 1));
  elements.nextScene.addEventListener("click", () => selectScene(state.selectedFloorplan + 1));
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => selectMode(button.dataset.mode));
  });

  demo.addEventListener("keydown", (event) => {
    if (event.target.closest(".observation-list, .segmented-control")) {
      return;
    }

    if (event.key === "ArrowLeft") {
      selectScene(state.selectedFloorplan - 1);
    } else if (event.key === "ArrowRight") {
      selectScene(state.selectedFloorplan + 1);
    }
  });

  buildSceneDots();
  renderSceneHeader();
  renderMode();
});
