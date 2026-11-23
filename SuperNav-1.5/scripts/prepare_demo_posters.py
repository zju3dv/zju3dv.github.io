"""Extract a lightweight poster for each available video in assets/demos.json."""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    galleries = json.loads((ROOT / "assets/demos.json").read_text())
    for gallery in galleries:
        for group in gallery["groups"]:
            for video in group["videos"]:
                if not video.get("src"):
                    continue
                source = ROOT / video["src"]
                poster = ROOT / video["poster"]
                poster.parent.mkdir(parents=True, exist_ok=True)
                duration = float(subprocess.check_output([
                    "ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1", str(source)
                ], text=True).strip())
                subprocess.run([
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-ss", str(min(3, duration / 4)), "-i", str(source),
                    "-frames:v", "1", "-vf", "scale=960:-2", "-quality", "82", str(poster)
                ], check=True)
                print(poster.relative_to(ROOT))


if __name__ == "__main__":
    main()
