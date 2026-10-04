# FreeLoc project page

Static project page for **FreeLoc: Online Floorplan Localization via Diffusion-Aided Pose Refinement** (CoRL 2026).

## Local preview

From this directory, run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The page uses plain HTML, CSS, and JavaScript. It has no package manager, build step, or external runtime dependency.

The web player uses `assets/video/video-web.mp4`, an H.264/AAC version optimized for progressive browser playback. The uploaded source is retained as `assets/video/video.mp4`.

## Updating project links and text

Edit `index.html` to replace the placeholder Paper, arXiv, and Code links and to update the abstract or method copy.

## Adding a demo scene

1. Add the scene media below `assets/demo/<Scene>/` using the existing directory layout.
2. Add one scene object to `assets/js/demo-config.js`.

No changes to `assets/js/interactive-demo.js` are required. Sequential GIFs are loaded only while their scene is visible in Sequential Localization mode.
