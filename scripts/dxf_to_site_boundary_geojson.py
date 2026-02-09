#!/usr/bin/env python3
"""
Convert a DXF file to a Site Boundary GeoJSON with auto-fill defaults.

Defaults assume HK80 (EPSG:2326). Auto-fill uses:
- close_tolerance: force-close near endpoints
- polygonize: build polygons from linework
- snap/bridge tolerances: heal small gaps (e.g. dashed lines)
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional


def _import_converter():
    try:
        from dxf_to_geojson import convert, list_layers  # type: ignore
    except Exception as exc:  # pragma: no cover - runtime import
        print(
            "Missing dependency: scripts/dxf_to_geojson.py must be available.",
            file=sys.stderr,
        )
        raise exc
    return convert, list_layers


def main(argv: Optional[List[str]] = None):
    parser = argparse.ArgumentParser(
        description="Convert DXF to Site Boundary GeoJSON with auto-fill."
    )
    parser.add_argument(
        "-i",
        "--input",
        default="20260207_HKSTP_BOUNDARY.dxf",
        help="Input DXF path (default: 20260207_HKSTP_BOUNDARY.dxf)",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="web/public/geojson/site-boundary.geojson",
        help="Output GeoJSON path (default: web/public/geojson/site-boundary.geojson)",
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
        "--exclude-layers",
        default="TransportPolygon",
        help="Comma-separated list of DXF layers to exclude after conversion (default: TransportPolygon)",
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
    polygonize_group = parser.add_mutually_exclusive_group()
    polygonize_group.add_argument(
        "--polygonize",
        dest="polygonize",
        action="store_true",
        help="Enable polygonization of linework (default)",
    )
    polygonize_group.add_argument(
        "--no-polygonize",
        dest="polygonize",
        action="store_false",
        help="Disable polygonization of linework",
    )
    parser.set_defaults(polygonize=True)
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
        default=0.5,
        help="Force-close open polylines if endpoints are within this distance.",
    )
    parser.add_argument(
        "--min-area",
        type=float,
        default=1000.0,
        help="Filter out polygons smaller than this area (square meters). 0 disables.",
    )
    parser.add_argument(
        "--snap-tolerance",
        type=float,
        default=0.5,
        help="Snap nearby line endpoints/vertices before polygonize (meters).",
    )
    parser.add_argument(
        "--bridge-tolerance",
        type=float,
        default=1.0,
        help="Bridge nearest line endpoints within tolerance (meters).",
    )
    parser.add_argument(
        "--list-layers",
        action="store_true",
        help="List DXF layer names and exit",
    )

    args = parser.parse_args(argv)

    convert, list_layers = _import_converter()

    if args.list_layers:
        list_layers(args.input)
        return

    layers = [s.strip() for s in args.layers.split(",") if s.strip()] if args.layers else None
    exclude_layers = (
        {s.strip() for s in args.exclude_layers.split(",") if s.strip()}
        if args.exclude_layers is not None
        else set()
    )
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
        polygonize=args.polygonize,
        keep_lines=args.keep_lines,
        snap=args.snap,
        close_tolerance=args.close_tolerance,
        snap_tolerance=args.snap_tolerance,
        bridge_tolerance=args.bridge_tolerance,
    )

    if exclude_layers or args.min_area > 0:
        with open(args.output, "r", encoding="utf-8") as f:
            data = json.load(f)

        def ring_area(ring):
            if not ring or len(ring) < 3:
                return 0.0
            area = 0.0
            for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
                area += x1 * y2 - x2 * y1
            return abs(area) / 2.0

        kept = []
        removed_layer = 0
        removed_area = 0
        for feature in data.get("features", []):
            layer = (feature.get("properties") or {}).get("layer")
            if layer in exclude_layers:
                removed_layer += 1
                continue
            geom = feature.get("geometry") or {}
            if args.min_area <= 0 or geom.get("type") != "Polygon":
                kept.append(feature)
                continue
            rings = geom.get("coordinates") or []
            outer = rings[0] if rings else []
            if ring_area(outer) >= args.min_area:
                kept.append(feature)
            else:
                removed_area += 1

        data["features"] = kept
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)

        print(
            f"Filtered features: excluded_layers={','.join(sorted(exclude_layers)) if exclude_layers else '(none)'} "
            f"removed_by_layer={removed_layer} min_area={args.min_area} removed_by_area={removed_area} kept={len(kept)}"
        )


if __name__ == "__main__":
    main()
