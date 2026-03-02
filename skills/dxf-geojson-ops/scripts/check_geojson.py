#!/usr/bin/env python3
"""Lightweight GeoJSON sanity checks for DXF conversion outputs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_allowed_types(raw: str | None) -> set[str]:
    if not raw:
        return set()
    return {item.strip() for item in raw.split(",") if item.strip()}


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate basic GeoJSON structure.")
    parser.add_argument("input", help="Path to GeoJSON file")
    parser.add_argument("--min-features", type=int, default=0, help="Minimum feature count")
    parser.add_argument(
        "--allowed-types",
        default="",
        help="Comma-separated geometry types allowed (e.g. Polygon,MultiPolygon)",
    )
    args = parser.parse_args()

    geojson_path = Path(args.input).resolve()
    if not geojson_path.exists():
        print(f"[ERROR] File not found: {geojson_path}")
        return 1

    try:
        payload = json.loads(geojson_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"[ERROR] Invalid JSON: {exc}")
        return 1

    if payload.get("type") != "FeatureCollection":
        print("[ERROR] Top-level type must be FeatureCollection")
        return 1

    features = payload.get("features")
    if not isinstance(features, list):
        print("[ERROR] 'features' must be a list")
        return 1

    count = len(features)
    if count < args.min_features:
        print(f"[ERROR] Feature count {count} is below required minimum {args.min_features}")
        return 1

    geometry_types: set[str] = set()
    for index, feature in enumerate(features):
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            print(f"[ERROR] Feature index {index} is invalid")
            return 1
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            print(f"[ERROR] Feature index {index} has invalid geometry")
            return 1
        geom_type = geometry.get("type")
        if not isinstance(geom_type, str) or not geom_type:
            print(f"[ERROR] Feature index {index} has missing geometry type")
            return 1
        geometry_types.add(geom_type)

    allowed_types = parse_allowed_types(args.allowed_types)
    if allowed_types:
        unexpected = sorted(geometry_types - allowed_types)
        if unexpected:
            print(
                f"[ERROR] Unexpected geometry type(s): {', '.join(unexpected)} "
                f"(allowed: {', '.join(sorted(allowed_types))})"
            )
            return 1

    types_sorted = ", ".join(sorted(geometry_types)) if geometry_types else "<none>"
    print(f"[OK] {geojson_path}")
    print(f"[OK] feature_count={count}")
    print(f"[OK] geometry_types={types_sorted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
