#!/usr/bin/env python3
"""Convert a 3DGS PLY file to the lightweight .splat format.

The .splat format stores 32 bytes per gaussian (vs ~248 bytes in PLY),
dropping higher-order SH harmonics and quantizing rotation/color.
"""

import struct
import sys
import numpy as np
from pathlib import Path


SH_C0 = 0.28209479177387814


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def parse_ply_header(f):
    header = b""
    properties = []
    vertex_count = 0

    while True:
        line = f.readline()
        header += line
        line = line.decode("ascii").strip()

        if line.startswith("element vertex"):
            vertex_count = int(line.split()[-1])
        elif line.startswith("property"):
            parts = line.split()
            properties.append((parts[1], parts[2]))
        elif line == "end_header":
            break

    prop_names = [p[1] for p in properties]
    prop_format = ""
    for dtype, _ in properties:
        if dtype == "float":
            prop_format += "f"
        elif dtype == "double":
            prop_format += "d"
        elif dtype == "int":
            prop_format += "i"
        elif dtype == "uint":
            prop_format += "I"
        elif dtype == "uchar":
            prop_format += "B"
        elif dtype == "short":
            prop_format += "h"
        elif dtype == "ushort":
            prop_format += "H"
        else:
            raise ValueError(f"Unknown property type: {dtype}")

    bytes_per_vertex = struct.calcsize("<" + prop_format)
    return vertex_count, prop_names, prop_format, bytes_per_vertex, len(header)


def convert_ply_to_splat(input_path, output_path):
    input_path = Path(input_path)
    output_path = Path(output_path)

    print(f"Reading PLY: {input_path} ({input_path.stat().st_size / 1e6:.1f} MB)")

    with open(input_path, "rb") as f:
        vertex_count, prop_names, prop_format, bytes_per_vertex, header_size = (
            parse_ply_header(f)
        )
        print(f"  Vertices: {vertex_count}")
        print(f"  Properties: {len(prop_names)} ({bytes_per_vertex} bytes each)")
        print(f"  Properties: {', '.join(prop_names[:10])}...")

        raw = f.read(vertex_count * bytes_per_vertex)

    dtype_map = {"f": "f4", "d": "f8", "i": "i4", "I": "u4", "B": "u1", "h": "i2", "H": "u2"}
    np_dtype = np.dtype(
        [(name, dtype_map[fmt]) for name, fmt in zip(prop_names, prop_format)]
    )
    data = np.frombuffer(raw, dtype=np_dtype)

    pos = np.column_stack([data["x"], data["y"], data["z"]]).astype(np.float32)

    scale = np.column_stack(
        [
            np.exp(data["scale_0"]),
            np.exp(data["scale_1"]),
            np.exp(data["scale_2"]),
        ]
    ).astype(np.float32)

    dc = np.column_stack(
        [data["f_dc_0"], data["f_dc_1"], data["f_dc_2"]]
    ).astype(np.float32)
    colors = np.clip((0.5 + SH_C0 * dc) * 255, 0, 255).astype(np.uint8)

    opacity = data["opacity"].astype(np.float32)
    alpha = np.clip(sigmoid(opacity) * 255, 0, 255).astype(np.uint8)

    quat = np.column_stack(
        [data["rot_0"], data["rot_1"], data["rot_2"], data["rot_3"]]
    ).astype(np.float32)
    norms = np.linalg.norm(quat, axis=1, keepdims=True)
    norms = np.maximum(norms, 1e-10)
    quat = quat / norms
    rot_encoded = np.clip(quat * 128 + 128, 0, 255).astype(np.uint8)

    # Sort by scale (larger gaussians first) for better progressive display
    scale_magnitude = np.prod(scale, axis=1)
    sort_indices = np.argsort(-scale_magnitude)

    pos = pos[sort_indices]
    scale = scale[sort_indices]
    colors = colors[sort_indices]
    alpha = alpha[sort_indices]
    rot_encoded = rot_encoded[sort_indices]

    output = np.empty(vertex_count * 32, dtype=np.uint8)
    buf = output.view(np.uint8).reshape(vertex_count, 32)

    buf[:, 0:12] = pos.view(np.uint8).reshape(vertex_count, 12)
    buf[:, 12:24] = scale.view(np.uint8).reshape(vertex_count, 12)
    buf[:, 24:27] = colors
    buf[:, 27:28] = alpha.reshape(-1, 1)
    buf[:, 28:32] = rot_encoded

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(output.tobytes())

    out_size = output_path.stat().st_size
    in_size = input_path.stat().st_size
    print(f"\nOutput: {output_path} ({out_size / 1e6:.1f} MB)")
    print(f"Compression ratio: {in_size / out_size:.1f}x")


if __name__ == "__main__":
    scene_dir = Path(__file__).parent.parent / "static" / "scenes" / "interior_0405_840145"
    input_ply = scene_dir / "interior_0405_840145.gs.ply"
    output_splat = scene_dir / "interior_0405_840145.splat"

    if len(sys.argv) > 1:
        input_ply = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_splat = Path(sys.argv[2])

    convert_ply_to_splat(input_ply, output_splat)
