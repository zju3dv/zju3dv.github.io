"""Reproduce the public figure/trace assets from the supplied local archive.

Requires Python, Pillow and pdftoppm. No private source paths are exported.
"""
import argparse
import base64
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://www.w3.org/2000/svg"}
HREF = "{http://www.w3.org/1999/xlink}href"


def prepare_traces(archive):
    out = ROOT / "assets" / "trajectories"
    out.mkdir(parents=True, exist_ok=True)
    cases = []
    for folder, keys, label, task_ids in [
        ("session2-memory-trace-comparison-v1", ("with_memory", "no_memory"), "With memory / Without memory", (
            "interior_0010_840154__task_001_find_flower_petals_bathtub",
            "interior_0941_841859__hardtask_find_bedside_table_lamp",
        )),
        ("harnessvln-trace-comparison-v1", ("supernav", "harnessvln"), "Ours / HarnessVLN memory", (
            "multi_objectnav_17_000104",
            "multi_objectnav_17_000227",
        )),
    ]:
        source = archive / folder
        manifest = json.loads((source / "render_manifest.json").read_text())
        # Pin the requested examples so regeneration never substitutes a case.
        indexed = {case["task_id"]: case for case in manifest["cases"]}
        missing = [task for task in task_ids if task not in indexed]
        if missing:
            raise ValueError(f"Missing requested cases in {folder}: {missing}")
        selected = [indexed[task] for task in task_ids]
        for case in selected:
            task = case["task_id"]
            svg = ET.parse(source / "tasks" / task / f"{task}.side-by-side.paper.svg").getroot()
            panels = []
            for i, key in enumerate(keys, start=1):
                axes = svg.find(f".//s:g[@id='axes_{i}']", NS)
                image = axes.find("s:image", NS)
                x, y, width, height = [float(image.get(k)) for k in ("x", "y", "width", "height")]
                # The SVG transform flips both the image's bounds AND its pixels.
                # Baking only the bounds into our coordinates would mirror the map
                # vertically relative to its trajectory and target markers.
                translate_y = float(re.search(r"translate\(0 ([-\d.]+)\)", image.get("transform"))[1])
                top = -y - height - translate_y
                image_name = f"case-{len(cases) + 1}-{i}.webp"
                raster = Image.open(io.BytesIO(base64.b64decode(image.get(HREF).split(",", 1)[1])))
                raster.transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert("RGB").save(
                    out / image_name, "WEBP", quality=90)
                route = axes.find("s:g[@id='line2d_%d']/s:path" % i, NS)
                numbers = [float(v) for v in re.findall(r"-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", route.get("d"))]
                points = [[round(a-x, 3), round(b-top, 3)] for a, b in zip(numbers[::2], numbers[1::2])]
                targets = axes.find("s:g[@id='PathCollection_%d']" % ((i-1)*3+1), NS)
                goals = [[round(float(u.get("x"))-x, 3), round(float(u.get("y"))-top, 3)]
                         for u in targets.findall(".//s:use", NS)]
                panels.append({
                    "label": (["With memory", "Without memory"] if key in ("with_memory", "no_memory")
                              else ["Ours", "HarnessVLN memory"])[i-1],
                    "map": "assets/trajectories/" + image_name,
                    "width": width, "height": height, "points": points, "targets": goals,
                    "pathLength": round(case[key]["path_length_m"], 2),
                    "spl": case[key]["spl"], "success": case[key]["success"],
                })
            cases.append({"id": task, "scene": case["scene_id"], "comparison": label,
                          "kind": "memory" if keys[0] == "with_memory" else "harness",
                          "goal": " → ".join(t["label"] for t in case["targets"]), "panels": panels})
    # Alternate the two comparison types throughout the loop.
    cases = [cases[0], cases[2], cases[1], cases[3]]
    (out / "cases.json").write_text(json.dumps(cases, separators=(",", ":")) + "\n")


def prepare_figures(pdf):
    out = ROOT / "assets" / "images"
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="supernav15-figures-") as temp:
        for name, page, crop in [("teaser", 1, (145, 575, 1245, 480)),
                                  ("pipeline", 3, (145, 180, 1245, 610))]:
            prefix = Path(temp) / name
            # Crop coordinates are defined at 180 DPI. Render at 3× for crisp
            # text on high-density displays, rather than upscaling the old crop.
            x, y, width, height = (value * 3 for value in crop)
            subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-r", "540",
                            "-x", str(x), "-y", str(y), "-W", str(width), "-H", str(height),
                            "-singlefile", "-png", str(pdf), str(prefix)], check=True, capture_output=True)
            Image.open(prefix.with_suffix(".png")).convert("RGB").save(out / f"{name}.webp", lossless=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--paper", type=Path, default=ROOT.parent / "main.pdf")
    args = parser.parse_args()
    prepare_traces(args.archive)
    prepare_figures(args.paper)
    fonts = ROOT / "assets" / "fonts"
    fonts.mkdir(parents=True, exist_ok=True)
    for font in (ROOT.parent / "SuperNav" / "assets" / "fonts").iterdir():
        shutil.copy2(font, fonts / font.name)
    print("Prepared four paired comparisons, two paper figures, and local fonts.")


if __name__ == "__main__":
    main()
