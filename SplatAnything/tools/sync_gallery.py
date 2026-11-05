#!/usr/bin/env python3
"""Sync images/visualization/<category>/<n>/ into the Qualitative Results gallery.

Each scene folder may contain:
  any image (.png/.jpg/.webp)   card thumbnail; also preview still when no video exists
  *.mp4 / *.webm                looping preview; first frame generates poster.jpg only
  *.html                       local SuperSplat viewer for validation
  info.json                     optional {"name": "...", "dataset": "...", "viewer": "..."}

Local HTML files are used when viewerBase is empty. Set viewerBase to a hosted
root (e.g. a HuggingFace dataset) to use <category>/<n>/<HTML filename> remotely.
Without a local HTML file the default remote filename is viewer.html.
"viewer" in info.json overrides that path; "" hides the 3D button.

Writes assets/js/gallery.js. Re-run after adding or changing files:
  python3 tools/sync_gallery.py
"""

from io import BytesIO
import json
import re
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "images" / "visualization"
OUTPUT = ROOT / "assets" / "js" / "gallery.js"
REMOTE_VIEWERS = ROOT / "assets" / "viewer" / "remote-viewers.json"
CATEGORIES = ["object", "indoor", "street", "aerial"]
LABELS = {"object": "Object", "indoor": "Indoor", "street": "Street", "aerial": "Aerial"}
VIEWER_PATH = "{category}/{scene}/viewer.html"
GENERATED = {"poster.jpg", "thumb.jpg"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}
VIDEO_EXT = {".mp4", ".webm"}
SIZES = {"poster.jpg": 1280, "thumb.jpg": 480}
# Source directory numbers in presentation order; additional cases follow naturally.
SCENE_ORDER = {
    "street": [2, 1, 4, 3, 5, 6, 7, 8, 9, 10, 11, 12],
    "aerial": [11, 12, 13, 10, 5, 18, 7, 8, 9, 4, 1, 2, 3, 14, 15, 16, 17, 6],
}


def natural_key(path):
    return [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", path.name)]


def save_resized(image, target, size):
    image = image.convert("RGBA")
    flat = Image.new("RGB", image.size, (255, 255, 255))
    flat.paste(image, mask=image.getchannel("A"))
    flat.thumbnail((size, size), Image.LANCZOS)
    flat.save(target, "JPEG", quality=86, optimize=True, progressive=True)


def resize(source, target, size):
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return
    with Image.open(source) as image:
        save_resized(image, target, size)


def video_poster(source, directory):
    stat = source.stat()
    signature = {"video": source.name, "size": stat.st_size, "mtime_ns": stat.st_mtime_ns}
    cache = directory / "preview-frame.json"
    if cache.is_file():
        try:
            unchanged = json.loads(cache.read_text()) == signature
        except (ValueError, OSError):
            unchanged = False
        if (
            unchanged
            and (directory / "poster.jpg").is_file()
            and (directory / "poster.jpg").stat().st_mtime_ns >= stat.st_mtime_ns
        ):
            return

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        try:
            import imageio_ffmpeg
        except ImportError as error:
            raise RuntimeError(
                "Video previews need ffmpeg or imageio-ffmpeg. "
                "Install with: python3 -m pip install imageio-ffmpeg"
            ) from error
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    result = subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin",
         "-i", str(source), "-map", "0:v:0", "-frames:v", "1",
         "-threads", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"],
        capture_output=True,
    )
    if result.returncode:
        raise RuntimeError(f"Cannot extract first frame of {source}: {result.stderr.decode(errors='replace')}")
    with Image.open(BytesIO(result.stdout)) as frame:
        save_resized(frame, directory / "poster.jpg", SIZES["poster.jpg"])
    cache.write_text(json.dumps(signature, indent=2) + "\n")


def relative(path):
    return path.relative_to(ROOT).as_posix()


def scan(category, remote_viewers=None):
    scenes = []
    folder = SOURCE / category
    if not folder.is_dir():
        return scenes
    # Only numbered case directories; ignore source-video and staging folders.
    for directory in sorted(
        (d for d in folder.iterdir() if d.is_dir() and d.name.isdigit()),
        key=natural_key,
    ):
        files = sorted((f for f in directory.iterdir() if f.is_file()), key=natural_key)
        images = [f for f in files if f.suffix.lower() in IMAGE_EXT and f.name not in GENERATED]
        videos = [f for f in files if f.suffix.lower() in VIDEO_EXT]
        # Prefer the web preview over full-size exports stored beside it.
        videos.sort(key=lambda f: f.stem.lower() != "preview")
        viewers = [f for f in files if f.suffix.lower() == ".html"]
        viewer = next((f for f in viewers if f.name == "viewer.html"), viewers[0] if viewers else None)
        if not (images or videos or viewers):
            continue
        scene = {
            "id": f"{category}-{directory.name}",
            "name": "",
            "dataset": "",
            "thumbnail": "",
            "poster": "",
            "preview": relative(videos[0]) if videos else "",
            "viewer": VIEWER_PATH.format(category=category, scene=directory.name),
        }
        if viewer:
            scene["viewer"] = f"{category}/{directory.name}/{viewer.name}"
            scene["localViewer"] = "./" + relative(viewer)
        remote = (remote_viewers or {}).get(scene["id"])
        if remote:
            scene["viewer"] = remote["path"]
            scene["viewerBytes"] = remote["bytes"]
        if videos or images:
            if videos:
                video_poster(videos[0], directory)
            else:
                resize(images[0], directory / "poster.jpg", SIZES["poster.jpg"])
            thumbnail_source = images[0] if images else directory / "poster.jpg"
            resize(thumbnail_source, directory / "thumb.jpg", SIZES["thumb.jpg"])
            scene["poster"] = relative(directory / "poster.jpg")
            scene["thumbnail"] = relative(directory / "thumb.jpg")
        info = directory / "info.json"
        if info.is_file():
            overrides = json.loads(info.read_text())
            scene.update({k: v for k, v in overrides.items() if k in ("name", "dataset", "viewer")})
            if "viewer" in overrides:
                scene.pop("viewerBytes", None)
        scenes.append(scene)
    order = {
        f"{category}-{number}": index
        for index, number in enumerate(SCENE_ORDER.get(category, []))
    }
    scenes.sort(key=lambda scene: order.get(scene["id"], len(order)))
    for index, scene in enumerate(scenes, start=1):
        if not scene["name"]:
            scene["name"] = f"{LABELS[category]} {index:02d}"
    return scenes


def main():
    remote = json.loads(REMOTE_VIEWERS.read_text())["scenes"] if REMOTE_VIEWERS.is_file() else {}
    gallery = {category: scan(category, remote) for category in CATEGORIES}
    body = json.dumps(gallery, indent=2, ensure_ascii=False)
    OUTPUT.write_text(
        "// Generated by tools/sync_gallery.py from images/visualization. Do not edit by hand.\n"
        f"window.SPLAT_GALLERY = {body};\n"
    )
    for category, scenes in gallery.items():
        print(
            f"{category:7s} {len(scenes):3d} scenes, "
            f"{sum(bool(s['preview']) for s in scenes)} preview videos"
        )


if __name__ == "__main__":
    main()
