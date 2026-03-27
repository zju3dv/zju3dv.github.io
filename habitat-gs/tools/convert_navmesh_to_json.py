#!/usr/bin/env python3
"""Convert a Recast/Detour binary navmesh (.navmesh) to JSON format.

Parses the binary format used by Habitat-sim and extracts walkable
surface triangles for use in a web-based viewer.
"""

import json
import struct
import sys
from pathlib import Path


NAVMESH_SET_MAGIC = 0x4D534554  # 'MSET' little-endian = bytes 'TESM'
DT_NAVMESH_MAGIC = 0x444E4156   # 'DNAV' little-endian = bytes 'VAND'


def read_struct(f, fmt):
    size = struct.calcsize(fmt)
    data = f.read(size)
    if len(data) < size:
        raise ValueError(f"Unexpected EOF: wanted {size} bytes, got {len(data)}")
    return struct.unpack(fmt, data)


def parse_navmesh(filepath):
    with open(filepath, "rb") as f:
        magic, version, num_tiles = read_struct(f, "<III")
        assert magic == NAVMESH_SET_MAGIC, f"Bad magic: {magic:#x}"
        print(f"NavMesh version={version}, numTiles={num_tiles}")

        # dtNavMeshParams
        orig = read_struct(f, "<3f")
        tile_width, tile_height = read_struct(f, "<2f")
        max_tiles, max_polys = read_struct(f, "<2I")
        print(f"  origin={orig}, tileSize=({tile_width:.2f}, {tile_height:.2f})")
        print(f"  maxTiles={max_tiles}, maxPolys={max_polys}")

        # Build settings (Habitat-specific extra data before tile entries)
        # 14 floats of build config + 4 bytes flags + 4 bytes padding
        build_settings = f.read(56)

        all_vertices = []
        all_triangles = []

        for tile_idx in range(num_tiles):
            tile_ref, data_size = read_struct(f, "<II")
            print(f"\n  Tile {tile_idx}: ref={tile_ref}, dataSize={data_size}")

            if data_size == 0:
                continue

            tile_start = f.tell()

            # dtMeshHeader: 2 uint32 + 4 int32 + 9 int32 + 3 float + 6 float + 1 float = 25 values, 100 bytes
            hdr_fmt = "<2I4i9i3f6ff"
            hdr_data = read_struct(f, hdr_fmt)

            hdr_magic = hdr_data[0]
            hdr_version = hdr_data[1]
            tile_x = hdr_data[2]
            tile_y = hdr_data[3]
            tile_layer = hdr_data[4]
            user_id = hdr_data[5]
            poly_count = hdr_data[6]
            vert_count = hdr_data[7]
            max_link_count = hdr_data[8]
            detail_mesh_count = hdr_data[9]
            detail_vert_count = hdr_data[10]
            detail_tri_count = hdr_data[11]
            bv_node_count = hdr_data[12]
            off_mesh_con_count = hdr_data[13]
            off_mesh_base = hdr_data[14]
            walkable_height = hdr_data[15]
            walkable_radius = hdr_data[16]
            walkable_climb = hdr_data[17]
            bmin = hdr_data[18:21]
            bmax = hdr_data[21:24]
            bv_quant_factor = hdr_data[24]

            assert hdr_magic == DT_NAVMESH_MAGIC, f"Bad tile magic: {hdr_magic:#x}"
            print(f"    magic=OK, version={hdr_version}")
            print(f"    polys={poly_count}, verts={vert_count}")
            print(f"    detailMeshes={detail_mesh_count}, detailVerts={detail_vert_count}, detailTris={detail_tri_count}")
            print(f"    bmin={bmin}, bmax={bmax}")
            print(f"    walkable: h={walkable_height}, r={walkable_radius}, climb={walkable_climb}")

            # Read vertices: vert_count * 3 floats
            verts_raw = read_struct(f, f"<{vert_count * 3}f")
            vertices = []
            for i in range(vert_count):
                vertices.append([
                    verts_raw[i * 3],
                    verts_raw[i * 3 + 1],
                    verts_raw[i * 3 + 2],
                ])

            # Read polys: poly_count * dtPoly (32 bytes each)
            polys = []
            for i in range(poly_count):
                first_link = read_struct(f, "<I")[0]
                poly_verts = list(read_struct(f, "<6H"))
                poly_neis = list(read_struct(f, "<6H"))
                flags = read_struct(f, "<H")[0]
                vert_c, area_type = read_struct(f, "<BB")
                polys.append({
                    "verts": poly_verts[:vert_c],
                    "vertCount": vert_c,
                    "flags": flags,
                    "area": area_type & 0x3f,
                    "type": (area_type >> 6) & 0x03,
                })

            # Skip links
            f.read(max_link_count * 12)

            # Read detail meshes: detail_mesh_count * 12 bytes
            detail_meshes = []
            for i in range(detail_mesh_count):
                vert_base, tri_base = read_struct(f, "<II")
                dm_vert_count, dm_tri_count = read_struct(f, "<BB")
                f.read(2)  # padding
                detail_meshes.append({
                    "vertBase": vert_base,
                    "triBase": tri_base,
                    "vertCount": dm_vert_count,
                    "triCount": dm_tri_count,
                })

            # Read detail vertices
            detail_verts = []
            if detail_vert_count > 0:
                dv_raw = read_struct(f, f"<{detail_vert_count * 3}f")
                for i in range(detail_vert_count):
                    detail_verts.append([
                        dv_raw[i * 3],
                        dv_raw[i * 3 + 1],
                        dv_raw[i * 3 + 2],
                    ])

            # Read detail triangles: detail_tri_count * 4 bytes
            detail_tris = []
            for i in range(detail_tri_count):
                a, b, c, flags = read_struct(f, "<4B")
                detail_tris.append([a, b, c, flags])

            # Skip BV tree and off-mesh connections
            f.seek(tile_start + data_size)

            # Build triangle list from detail meshes
            vert_offset = len(all_vertices)
            for v in vertices:
                all_vertices.append(v)
            for dv in detail_verts:
                all_vertices.append(dv)

            for poly_idx in range(poly_count):
                poly = polys[poly_idx]
                if poly["type"] != 0:  # skip off-mesh connections
                    continue
                if poly_idx >= detail_mesh_count:
                    continue

                dm = detail_meshes[poly_idx]
                for j in range(dm["triCount"]):
                    dt = detail_tris[dm["triBase"] + j]
                    tri_indices = []
                    for k in range(3):
                        vi = dt[k]
                        if vi < poly["vertCount"]:
                            tri_indices.append(vert_offset + poly["verts"][vi])
                        else:
                            tri_indices.append(
                                vert_offset + vert_count + dm["vertBase"] + (vi - poly["vertCount"])
                            )
                    all_triangles.append(tri_indices)

    return all_vertices, all_triangles, {
        "walkableHeight": walkable_height,
        "walkableRadius": walkable_radius,
        "walkableClimb": walkable_climb,
        "bmin": list(bmin),
        "bmax": list(bmax),
    }


def main():
    scene_dir = Path(__file__).parent.parent / "static" / "scenes" / "interior_0405_840145"
    input_path = scene_dir / "interior_0405_840145.navmesh"
    output_path = scene_dir / "navmesh.json"

    if len(sys.argv) > 1:
        input_path = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_path = Path(sys.argv[2])

    print(f"Parsing navmesh: {input_path}")
    vertices, triangles, params = parse_navmesh(input_path)
    print(f"\nTotal vertices: {len(vertices)}")
    print(f"Total triangles: {len(triangles)}")
    print(f"Params: {params}")

    # Round vertices for smaller JSON
    vertices_rounded = [[round(v, 4) for v in vert] for vert in vertices]

    result = {
        "vertices": vertices_rounded,
        "triangles": triangles,
        "params": params,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f)

    size = output_path.stat().st_size
    print(f"\nOutput: {output_path} ({size / 1e3:.1f} KB)")


if __name__ == "__main__":
    main()
