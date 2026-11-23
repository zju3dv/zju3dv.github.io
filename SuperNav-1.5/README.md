# SuperNav-1.5 project page

Standalone HTML, CSS, and JavaScript. From the repository root, run:

```bash
python SuperNav-1.5/scripts/serve.py --port 8000
```

Then open `http://localhost:8000/SuperNav-1.5/`. No build or installation is needed. Images, trajectory data, and licensed fonts are local; videos stream from the separate assets repository and require internet access. The preview server also supports HTTP byte-range requests for any local media previews. For remote preview, forward port 8000 with SSH; the server binds to localhost by default.

## Large video assets

All 19 MP4s live in [bugByteMe/SuperNav-1.5-assets](https://github.com/bugByteMe/SuperNav-1.5-assets), not this website's Git history. The gallery combines the `VIDEO_BASE` URL in `js/main.js` with each `src` in `assets/demos.json`; the opening video URL is in `index.html`. All videos use the public base URL `https://raw.githubusercontent.com/bugByteMe/SuperNav-1.5-assets/main/`. Posters and small figures remain local for fast initial loading.

MP4s are ignored by this directory's `.gitignore`. To reproduce posters or the overview, clone the assets repository separately and copy its `assets/` directory into `SuperNav-1.5/assets/`. The scripts read those ignored local copies, and generated MP4s must be committed only in the assets repository. Never add Git LFS pointers or force-add videos to this site repository.

## Updating content

- The title, authors, method text, and results are in `index.html`. Paper and Code are intentionally pending; replace their resource spans with links once URLs are available.
- The opening video is `assets/overview/supernav-1.5-overview.mp4` in the assets repository, a silent 42-second 1080p/30 fps overview built from existing assets. Each demo section has one reusable player, category tabs, and a selectable video list. `assets/demos.json` defines all eighteen available demos: six real-world videos and twelve simulation videos (four each for single-object, multi-object, and multi-session navigation).
- Both demo sections default to an “All” category assembled from the catalog groups, retaining the category order and each video's original category label. Individual category tabs still filter the same reusable player and video list.
- Run `python scripts/prepare_demo_posters.py` with FFmpeg installed to regenerate posters from the catalog. Videos load on demand; selecting a new demo replaces the existing player's source, and starting playback pauses the other section's player.
- BibTeX is intentionally pending. Add the final citation to the citation code block.
- `assets/trajectories/cases.json` contains four paired recorded paths, their local map images, targets, measured path lengths, success flags, and SPL values. Paths were extracted from archived Matplotlib SVGs without synthesizing route geometry. Cases are explicitly pinned: memory comparisons use scenes `0010_840154` and `0941_841859`; HarnessVLN comparisons use tasks `000104` and `000227`. The loop alternates comparison types in that order.
- Both routes grow at a shared distance rate; each case fits its longer route into twelve seconds, then holds for two seconds. This is an illustration of path efficiency, not execution-time playback. HarnessVLN examples compare memory designs within the shared SuperNav runtime.
- Each frame builds a partial path and places the moving marker at that exact endpoint. This keeps the marker aligned with the visible route when the map scales, including with non-scaling strokes.
- Map extraction bakes in the original SVG's vertical image flip. Raster pixels, route coordinates, and target markers must share the same SVG coordinate system.
- Demand-driven path efficiency is labeled SPL following Section 4.3 of the supplied paper; Table 4's header reads “PL” despite its caption and discussion identifying SPL.
- Results use four keyboard-accessible tabs, with HM3D-OVON initially selected and exactly one experiment table visible at a time.

## Reproducing assets

### Overview video

After copying local MP4s from the assets repository, run `python SuperNav-1.5/scripts/render_overview.py` from the repository root (requires Pillow and FFmpeg). The renderer writes an ignored H.264 MP4 with fast-start metadata and a WebP poster into `assets/overview/`. Publish the MP4 in the assets repository and keep its lightweight poster here. Source assets are never modified. Use `--output /path/to/video.mp4` for a separate export, or `--storyboard /path/to/storyboard.jpg` to inspect stills without rendering the video.

The editable sequence is:

- 0–4 s: centered title moves upward and shrinks; subtitle appears.
- 4–12 s: one real-world video plays alone for one second, followed by successive arrivals into a six-video grid (three real-world and three simulation categories).
- 12–16 s: “Agent Maintained Memory Node” and six staggered dots.
- 16–23 s: dots become a right-hand column; “Grounded in Geometry” gives way to the paper's annotated SLAM map, and the dots move onto corresponding numbered map locations.
- 23–28 s: “Navigation with Memory Efficiently”, followed by the three requested navigation components, one by one.
- 28–38 s: recorded with/without-memory comparison for scene `0941_841859`; both paths use the same illustrated distance rate, not execution timing. Completion ticks appear independently.
- 38–42 s: closing title and subtitle.

The film retains the supplied script wording and the site's Space Grotesk / IBM Plex Mono fonts and stone, orange, and yellow palette. Small section labels, counters, footers, and extra taglines are omitted; only primary titles and meaningful demo/map/comparison labels remain. It has no narration or music. The overview autoplays muted and loops, with native controls retained; browsers may defer autoplay until the player is visible. Starting the overview pauses other demo players, and vice versa.

### Paper and trajectory assets

`scripts/prepare_assets.py` requires Python, Pillow, and `pdftoppm`. Run with `--archive /path/to/archive/derived --paper /path/to/main.pdf`. It extracts only the selected comparisons, crops Figures 1 and 2 at 540 DPI into lossless WebP images (3735 pixels wide), and copies the original SuperNav fonts and their licenses. Both figures link to their full-resolution images. Figure crops match the supplied manuscript version; inspect them if replacing the PDF.
