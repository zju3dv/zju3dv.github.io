"""Build one synchronized side-by-side MP4 per scene. Requires ffmpeg."""

import argparse
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--ffmpeg", default="ffmpeg")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]

for folder in sorted((root / "assets/demo").glob("*/sequential")):
    observation, = folder.glob("observation/*.gif")
    result, = folder.glob("results/*.gif")
    output = folder / "synchronized.mp4"
    # Match each input's timestamps; fit without cropping into equal-sized cells.
    cell = ("setpts=PTS-STARTPTS,"
            "scale=720:720:force_original_aspect_ratio=decrease:force_divisible_by=2,"
            "pad=720:720:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1")
    subprocess.run([
        args.ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-ignore_loop", "1", "-i", str(observation),
        "-ignore_loop", "1", "-i", str(result),
        "-filter_complex", f"[0:v]{cell}[left];[1:v]{cell}[right];"
        "[left][right]hstack=inputs=2:shortest=1[v]",
        # The source GIFs use 200 ms per frame (5 fps).
        "-map", "[v]", "-an", "-r", "5", "-c:v", "libx264", "-preset", "slow",
        "-crf", "20", "-threads", "4", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(output)
    ], check=True)
    print(f"{folder.parent.name}: {output.stat().st_size / 1024**2:.2f} MiB", flush=True)
