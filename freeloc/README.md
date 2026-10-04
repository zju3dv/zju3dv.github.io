# FreeLoc project page

Static project page for **FreeLoc: Online Floorplan Localization via Diffusion-Aided Pose Refinement** (CoRL 2026).

## Local preview

From this directory, run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The page uses plain HTML, CSS, and JavaScript. It has no package manager, build step, or external runtime dependency.

The web player uses `assets/video/video-web.mp4`, a compressed H.264/AAC video (about 17.2 MiB) retaining 1920×1080 resolution, 30 fps, and the original audio. MP4 faststart enables progressive browser playback. Keep the original master outside the repository.

To reproduce from an original master stored outside the repository:

```bash
ffmpeg -i /path/to/original.mp4 -map 0:v:0 -map '0:a?' \
  -c:v libx264 -preset slow -crf 23 -threads 8 -pix_fmt yuv420p \
  -c:a copy -movflags +faststart assets/video/video-web.mp4
```

## Updating project links and text

Edit `index.html` to replace the placeholder Paper, arXiv, and Code links and to update the abstract or method copy.

## Adding a demo scene

1. Add the scene media below `assets/demo/<Scene>/` using the existing directory layout.
2. Add one scene object to `assets/js/demo-config.js`.

No changes to `assets/js/interactive-demo.js` are required. Each scene's `sequential.video` points to `assets/demo/<Scene>/sequential/synchronized.mp4`, loaded only when selected in Sequential Localization mode. Observation and localization result are encoded side by side in a single video, so playback, seeking, and looping stay synchronized. Switching scenes restarts playback; switching to Single-frame Localization releases the video.

All synchronized videos use a 1440×720 canvas with two equal cells. Each image fits inside 672×672 without cropping, leaving at least 24 pixels of padding per side and 48 pixels between images. A subtle center divider separates the views. These dimensions scale with the player width.

The original sequential GIFs are retained as source assets. Each pair must have matching frame counts and frame durations; the current assets and conversion script use 200 ms per frame (5 fps). Regenerate the synchronized videos with:

```bash
python scripts/build-sequential-videos.py
# Alternatively: python scripts/build-sequential-videos.py --ffmpeg /path/to/ffmpeg
```
