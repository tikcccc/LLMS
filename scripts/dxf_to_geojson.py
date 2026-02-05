#!/usr/bin/env python3
"""
Convert a DXF file to GeoJSON with optional CRS transform.

Default assumes the DXF coordinates are in HK80 (EPSG:2326) and keeps HK80
for output. Override with --source-crs / --target-crs or --no-transform.
By default the script polygonizes linework when possible (requires shapely).
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from typing import Iterable, List, Optional, Tuple


def _require(pkg: str):
    try:
        return __import__(pkg)
    except Exception as exc:  # pragma: no cover - runtime import
        print(f"Missing dependency: {pkg}. Install with: pip install {pkg}", file=sys.stderr)
        raise exc


def _build_transformer(source_crs: Optional[str], target_crs: Optional[str]):
    if not source_crs or not target_crs or source_crs == target_crs:
        return None
    pyproj = _require("pyproj")
    return pyproj.Transformer.from_crs(source_crs, target_crs, always_xy=True)


def _transform_coords(coords: List[Tuple[float, float]], transformer):
    if transformer is None:
        return [[x, y] for x, y in coords]
    return [list(transformer.transform(x, y)) for x, y in coords]


def _ensure_closed(coords: List[Tuple[float, float]]):
    if not coords:
        return coords
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords


def _snap_coords(coords: List[Tuple[float, float]], snap: float):
    if snap <= 0:
        return coords
    snapped = []
    for x, y in coords:
        sx = round(x / snap) * snap
        sy = round(y / snap) * snap
        snapped.append((sx, sy))
    return snapped


def _close_if_near(coords: List[Tuple[float, float]], tolerance: float):
    if tolerance <= 0 or len(coords) < 2:
        return False
    x0, y0 = coords[0]
    x1, y1 = coords[-1]
    dist = math.hypot(x1 - x0, y1 - y0)
    return dist <= tolerance


def _flatten_with_path(entity, distance: float):
    try:
        from ezdxf.path import make_path  # type: ignore
    except Exception:
        return None
    try:
        path = make_path(entity)
        points = [(p.x, p.y) for p in path.flattening(distance)]
        closed = getattr(entity, "closed", False) or getattr(entity, "is_closed", False)
        return points, closed
    except Exception:
        return None


def _flatten_entity(entity, distance: float):
    # Returns (points, closed) or None
    dxftype = entity.dxftype()

    if dxftype == "LWPOLYLINE":
        try:
            pts_bulge = list(entity.get_points("xyb"))
        except Exception:
            pts_bulge = []
        has_bulge = any(abs(b) > 1e-9 for _, _, b in pts_bulge)
        if has_bulge:
            flattened = _flatten_with_path(entity, distance)
            if flattened:
                return flattened
        pts = [(x, y) for x, y, _ in pts_bulge] if pts_bulge else []
        return pts, bool(getattr(entity, "closed", False))

    if dxftype == "POLYLINE":
        try:
            pts = [(v.dxf.location.x, v.dxf.location.y) for v in entity.vertices()]
        except Exception:
            pts = []
        return pts, bool(getattr(entity, "is_closed", False))

    if dxftype == "LINE":
        try:
            return [
                (entity.dxf.start.x, entity.dxf.start.y),
                (entity.dxf.end.x, entity.dxf.end.y),
            ], False
        except Exception:
            return None

    if dxftype in {"CIRCLE", "ARC", "ELLIPSE", "SPLINE"}:
        # Try generic path flattening first
        flattened = _flatten_with_path(entity, distance)
        if flattened:
            return flattened
        # Fallback to entity.flattening if available
        if hasattr(entity, "flattening"):
            try:
                points = [(p[0], p[1]) for p in entity.flattening(distance=distance)]
                closed = dxftype in {"CIRCLE", "ELLIPSE"}
                return points, closed
            except Exception:
                return None

    return None


def _iter_entities(msp, include_inserts: bool):
    for entity in msp:
        if include_inserts and entity.dxftype() == "INSERT":
            try:
                for virtual in entity.virtual_entities():
                    # virtual_entities may include nested inserts; recurse once
                    if virtual.dxftype() == "INSERT":
                        yield from _iter_entities([virtual], include_inserts=True)
                    else:
                        yield virtual
            except Exception:
                continue
        else:
            yield entity


def _feature(geom_type: str, coords, layer: str, dxftype: str, handle: str):
    return {
        "type": "Feature",
        "properties": {
            "layer": layer,
            "entity": dxftype,
            "handle": handle,
        },
        "geometry": {
            "type": geom_type,
            "coordinates": coords,
        },
    }


def convert(
    input_path: str,
    output_path: str,
    source_crs: Optional[str],
    target_crs: Optional[str],
    layers: Optional[List[str]],
    flatten_distance: float,
    include_inserts: bool,
    polygonize: bool,
    keep_lines: bool,
    snap: float,
    close_tolerance: float,
    snap_tolerance: float,
    bridge_tolerance: float,
):
    ezdxf = _require("ezdxf")

    doc = ezdxf.readfile(input_path)
    msp = doc.modelspace()

    output_dir = os.path.dirname(os.path.abspath(output_path))
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    transformer = _build_transformer(source_crs, target_crs)
    layer_filter = set(layers) if layers else None

    features = []
    lines_by_layer: dict[str, List[List[Tuple[float, float]]]] = {}
    skipped = 0
    for entity in _iter_entities(msp, include_inserts=include_inserts):
        layer = entity.dxf.layer if hasattr(entity.dxf, "layer") else "0"
        if layer_filter and layer not in layer_filter:
            continue

        flattened = _flatten_entity(entity, flatten_distance)
        if not flattened:
            skipped += 1
            continue

        points, closed = flattened
        points = _snap_coords(points, snap)
        if not closed and _close_if_near(points, close_tolerance):
            closed = True
        if len(points) < 2:
            skipped += 1
            continue

        if closed and len(points) >= 3:
            ring = _ensure_closed(points)
            coords = [_transform_coords(ring, transformer)]
            features.append(_feature("Polygon", coords, layer, entity.dxftype(), entity.dxf.handle))
        else:
            if polygonize:
                lines_by_layer.setdefault(layer, []).append(points)
                if keep_lines:
                    coords = _transform_coords(points, transformer)
                    features.append(
                        _feature("LineString", coords, layer, entity.dxftype(), entity.dxf.handle)
                    )
            else:
                coords = _transform_coords(points, transformer)
                features.append(
                    _feature("LineString", coords, layer, entity.dxftype(), entity.dxf.handle)
                )

    bridge_count = 0
    if polygonize and lines_by_layer:
        try:
            from shapely.geometry import LineString, Point  # type: ignore
            from shapely.ops import polygonize as shp_polygonize, unary_union, snap as shp_snap  # type: ignore
        except Exception:
            print(
                "Polygonize requested but shapely not available; outputting lines only.",
                file=sys.stderr,
            )
            if not keep_lines:
                for layer, lines in lines_by_layer.items():
                    for points in lines:
                        coords = _transform_coords(points, transformer)
                        features.append(_feature("LineString", coords, layer, "LINEWORK", ""))
        else:
            for layer, lines in lines_by_layer.items():
                line_geoms = [LineString(points) for points in lines if len(points) >= 2]
                if not line_geoms:
                    continue
                if bridge_tolerance > 0:
                    endpoints = []
                    for idx, line in enumerate(line_geoms):
                        coords = list(line.coords)
                        if len(coords) < 2:
                            continue
                        endpoints.append((idx, Point(coords[0])))
                        endpoints.append((idx, Point(coords[-1])))
                    nearest = {}
                    for i, (_, p) in enumerate(endpoints):
                        best_j = None
                        best_d = None
                        for j, (_, q) in enumerate(endpoints):
                            if i == j:
                                continue
                            d = p.distance(q)
                            if best_d is None or d < best_d:
                                best_d = d
                                best_j = j
                        if best_d is not None and best_d <= bridge_tolerance:
                            nearest[i] = (best_j, best_d)
                    bridges = []
                    used = set()
                    for i, (j, d) in nearest.items():
                        if i in used or j in used:
                            continue
                        back = nearest.get(j)
                        if back and back[0] == i:
                            p = endpoints[i][1]
                            q = endpoints[j][1]
                            if p.distance(q) <= bridge_tolerance:
                                bridges.append(LineString([p, q]))
                                used.add(i)
                                used.add(j)
                    if bridges:
                        bridge_count += len(bridges)
                        line_geoms = line_geoms + bridges
                if snap_tolerance > 0:
                    union_ref = unary_union(line_geoms)
                    snapped_lines = [shp_snap(line, union_ref, snap_tolerance) for line in line_geoms]
                    merged = unary_union(snapped_lines)
                else:
                    merged = unary_union(line_geoms)
                for poly in shp_polygonize(merged):
                    if poly.is_empty:
                        continue
                    rings = [list(poly.exterior.coords)]
                    for interior in poly.interiors:
                        rings.append(list(interior.coords))
                    coords = [_transform_coords(ring, transformer) for ring in rings]
                    features.append(_feature("Polygon", coords, layer, "POLYGONIZE", ""))

    geojson = {"type": "FeatureCollection", "features": features}
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    print(
        f"Done. features={len(features)} skipped={skipped} "
        f"source_crs={source_crs} target_crs={target_crs} "
        f"layers={'all' if not layers else ','.join(layers)} "
        f"snap={snap} close_tol={close_tolerance} snap_tol={snap_tolerance} "
        f"bridge_tol={bridge_tolerance} bridges={bridge_count}"
    )


def list_layers(input_path: str):
    ezdxf = _require("ezdxf")
    doc = ezdxf.readfile(input_path)
    names = [layer.dxf.name for layer in doc.layers]
    for name in sorted(set(names)):
        print(name)


def main(argv: Optional[List[str]] = None):
    parser = argparse.ArgumentParser(description="Convert DXF to GeoJSON.")
    parser.add_argument("-i", "--input", required=True, help="Input DXF path")
    parser.add_argument(
        "-o",
        "--output",
        default="web/public/geojson/int-land.geojson",
        help="Output GeoJSON path (default: web/public/geojson/int-land.geojson)",
    )
    parser.add_argument("--source-crs", default="EPSG:2326", help="Source CRS (default HK80)")
    parser.add_argument("--target-crs", default="EPSG:2326", help="Target CRS (default HK80)")
    parser.add_argument(
        "--no-transform", action="store_true", help="Skip CRS transform"
    )
    parser.add_argument(
        "--layers",
        help="Comma-separated list of DXF layers to include (default: all)",
    )
    parser.add_argument(
        "--flatten",
        type=float,
        default=0.2,
        help="Flatten distance for curves (units of source CRS)",
    )
    parser.add_argument(
        "--no-inserts",
        action="store_true",
        help="Do not expand block INSERTs",
    )
    parser.add_argument(
        "--no-polygonize",
        action="store_true",
        help="Disable polygonization of linework",
    )
    parser.add_argument(
        "--keep-lines",
        action="store_true",
        help="Keep line features even when polygonizing",
    )
    parser.add_argument(
        "--snap",
        type=float,
        default=0.0,
        help="Snap coordinates to grid size (e.g. 0.2). 0 disables.",
    )
    parser.add_argument(
        "--close-tolerance",
        type=float,
        default=0.0,
        help="Force-close open polylines if endpoints are within this distance.",
    )
    parser.add_argument(
        "--snap-tolerance",
        type=float,
        default=0.0,
        help="Snap nearby line endpoints/vertices before polygonize (meters).",
    )
    parser.add_argument(
        "--bridge-tolerance",
        type=float,
        default=0.0,
        help="Bridge nearest line endpoints within tolerance (meters).",
    )
    parser.add_argument(
        "--list-layers",
        action="store_true",
        help="List DXF layer names and exit",
    )

    args = parser.parse_args(argv)

    if args.list_layers:
        list_layers(args.input)
        return

    layers = [s.strip() for s in args.layers.split(",")] if args.layers else None
    if args.no_transform:
        source_crs = None
        target_crs = None
    else:
        source_crs = args.source_crs
        target_crs = args.target_crs

    convert(
        input_path=args.input,
        output_path=args.output,
        source_crs=source_crs,
        target_crs=target_crs,
        layers=layers,
        flatten_distance=args.flatten,
        include_inserts=not args.no_inserts,
        polygonize=not args.no_polygonize,
        keep_lines=args.keep_lines,
        snap=args.snap,
        close_tolerance=args.close_tolerance,
        snap_tolerance=args.snap_tolerance,
        bridge_tolerance=args.bridge_tolerance,
    )


if __name__ == "__main__":
    main()
