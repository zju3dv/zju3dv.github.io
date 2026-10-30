import { loadMedia } from "./media-cache.js?v=f051d8ff7aec";

export function synchronizeVideos(videos, playButton) {
  const controller = new AbortController();
  const { signal } = controller;
  let master;
  let frame = 0;
  let aligning = true;

  function stop() {
    controller.abort();
    cancelAnimationFrame(frame);
    playButton.hidden = true;
    playButton.disabled = false;
    videos.forEach((video) => {
      video.pause();
      video.preload = "none";
    });
  }

  function fail(error) {
    if (signal.aborted) return;
    if (error.name === "NotAllowedError") {
      aligning = true;
      cancelAnimationFrame(frame);
      videos.forEach((video) => video.pause());
      playButton.hidden = false;
      playButton.disabled = false;
      return;
    }
    stop();
    throw error;
  }

  function ready(video) {
    return new Promise((resolve) => {
      function check() {
        if (signal.aborted || (video.readyState >= 3 && !video.seeking)) {
          video.removeEventListener("canplay", check);
          video.removeEventListener("seeked", check);
          signal.removeEventListener("abort", check);
          resolve();
        }
      }
      video.addEventListener("canplay", check);
      video.addEventListener("seeked", check);
      signal.addEventListener("abort", check);
      check();
    });
  }

  function tick() {
    const time = master.currentTime;
    videos.forEach((video) => {
      const target = Math.min(time, video.duration);
      if (!video.seeking && Math.abs(video.currentTime - target) > 0.05)
        video.currentTime = target;
    });
    frame = requestAnimationFrame(tick);
  }

  async function play() {
    playButton.disabled = true;
    const active = videos.filter((video) => video.currentTime < video.duration);
    await Promise.all(active.map((video) => video.play()));
    if (signal.aborted) return;
    playButton.hidden = true;
    playButton.disabled = false;
    aligning = false;
    frame = requestAnimationFrame(tick);
  }

  async function playFrom(time) {
    aligning = true;
    cancelAnimationFrame(frame);
    videos.forEach((video) => {
      video.pause();
      const target = Math.min(time, video.duration);
      if (Math.abs(video.currentTime - target) > 0.005)
        video.currentTime = target;
    });
    const active = videos.filter((video) => time < video.duration);
    await Promise.all(active.map(ready));
    if (signal.aborted) return;
    await play();
  }

  // Invoke every video's play() directly within the user's click gesture.
  playButton.addEventListener("click", () => play().catch(fail), { signal });

  videos.forEach((video) => {
    video.autoplay = false;
    video.loop = false;
    video.preload = "none";
    video.addEventListener(
      "error",
      () =>
        fail(
          new Error(`Video failed: ${video.dataset.source}: ${video.error.message}`),
        ),
      { signal },
    );
    video.addEventListener(
      "waiting",
      () => {
        if (!aligning && !video.seeking && !video.ended && video.readyState < 3)
          playFrom(master.currentTime).catch(fail);
      },
      { signal },
    );
  });

  async function start() {
    const sources = await Promise.all(
      videos.map((video) => loadMedia(video.dataset.source)),
    );
    if (signal.aborted) return;
    videos.forEach((video, index) => {
      video.src = sources[index];
      video.preload = "auto";
      video.load();
    });
    await Promise.all(videos.map(ready));
    if (signal.aborted) return;
    master = videos.reduce((longest, video) =>
      video.duration > longest.duration ? video : longest,
    );
    master.addEventListener("ended", () => playFrom(0).catch(fail), { signal });
    await playFrom(0);
  }
  start().catch(fail);
  return stop;
}
