#!/usr/bin/env python3
"""Verify Hugging Face HTML files and persist scene-to-file mappings.

Run after uploading new viewer files, then run tools/sync_gallery.py.
Local directory IDs always select the same numbered remote directory.
"""

import argparse
import json
from pathlib import Path, PurePosixPath
import re
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "assets/viewer/remote-viewers.json"


def fetch_json(url):
    with urlopen(Request(url, headers={"User-Agent": "SplatAnything-gallery-sync"}), timeout=60) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default="ritianyu/SplatAnything_Demo")
    args = parser.parse_args()
    api = f"https://huggingface.co/api/datasets/{args.repo}"
    revision = fetch_json(api)["sha"]
    entries = fetch_json(f"{api}/tree/{revision}?recursive=true&limit=1000")
    files = {
        item["path"]: item for item in entries
        if item["type"] == "file" and item["path"].lower().endswith(".html")
    }
    raw = (ROOT / "assets/js/gallery.js").read_text()
    gallery = json.loads(raw.split("window.SPLAT_GALLERY = ", 1)[1].rstrip().removesuffix(";"))
    scenes = {}
    used = set()
    for category, items in gallery.items():
        for scene in items:
            number = scene["id"].removeprefix(f"{category}-")
            if not number.isdigit():
                raise RuntimeError(f"Invalid local scene ID: {scene['id']}")
            directory = f"{category}/{number}"
            candidates = [name for name in files if str(PurePosixPath(name).parent) == directory]
            if len(candidates) == 1:
                path = candidates[0]
            else:
                raise RuntimeError(f"{scene['id']}: expected one HTML in {directory}, found {candidates}")
            if path in used:
                raise RuntimeError(f"More than one scene maps to {path}; check the mapping before syncing")
            used.add(path)
            entry = files[path]
            scenes[scene["id"]] = {
                "path": path,
                "bytes": entry["size"],
                "sha256": entry.get("lfs", {}).get("oid", ""),
            }
    manifest = {"dataset": args.repo, "revision": revision, "scenes": scenes}
    base = f"https://huggingface.co/datasets/{args.repo}/resolve/main/"
    content_path = ROOT / "assets/js/content.js"
    content, count = re.subn(r'(?m)^(\s*viewerBase:\s*)"[^"]*"', lambda m: m[1] + json.dumps(base), content_path.read_text())
    if count != 1:
        raise RuntimeError("Expected exactly one viewerBase setting in content.js")
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    content_path.write_text(content)
    print(f"Verified {len(scenes)} unique scene HTML files at {args.repo}@{revision}")
    print("Updated remote-viewers.json and viewerBase. Run tools/sync_gallery.py to regenerate the gallery.")


if __name__ == "__main__":
    main()
