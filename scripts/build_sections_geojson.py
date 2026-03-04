#!/usr/bin/env python3
"""
Build Section GeoJSON from existing Part-of-Sites GeoJSON files.

Current default target:
- SECTION-1 built from part-1/{1A..1I}.geojson
- outputs under web/public/data/geojson/sections/
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Iterable, List, Optional


DEFAULT_PART_ROOT = "web/public/data/geojson/part-of-sites"
DEFAULT_OUTPUT_ROOT = "web/public/data/geojson/sections"
DEFAULT_SECTION_ID = "SECTION-1"
DEFAULT_SECTION_LABEL = "Section 1"
DEFAULT_SECTION_GROUP = "SECTION 1"
DEFAULT_SOURCE_GROUP_SLUG = "part-1"
DEFAULT_PARTS = "1A,1B,1C,1D,1E,1F,1G,1H,1I"
DEFAULT_CRS = "EPSG:2326"


def _require_shapely():
    try:
        from shapely.geometry import MultiPolygon, mapping, shape  # type: ignore
        from shapely.ops import unary_union  # type: ignore
        from shapely.validation import make_valid  # type: ignore
    except Exception as exc:  # pragma: no cover - runtime dependency
        print(
            "Missing dependency: shapely. Install with: pip install shapely",
            file=sys.stderr,
        )
        raise exc
    return MultiPolygon, mapping, shape, unary_union, make_valid


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build section GeoJSON by unioning existing part-of-sites geometries."
    )
    parser.add_argument(
        "--part-root",
        default=DEFAULT_PART_ROOT,
        help=f"Root folder for part-of-sites geojson (default: {DEFAULT_PART_ROOT})",
    )
    parser.add_argument(
        "--output-root",
        default=DEFAULT_OUTPUT_ROOT,
        help=f"Output root for sections geojson (default: {DEFAULT_OUTPUT_ROOT})",
    )
    parser.add_argument(
        "--section-id",
        default=DEFAULT_SECTION_ID,
        help=f"Section id (default: {DEFAULT_SECTION_ID})",
    )
    parser.add_argument(
        "--section-label",
        default=DEFAULT_SECTION_LABEL,
        help=f"Section label (default: {DEFAULT_SECTION_LABEL})",
    )
    parser.add_argument(
        "--section-group",
        default=DEFAULT_SECTION_GROUP,
        help=f"Section group label (default: {DEFAULT_SECTION_GROUP})",
    )
    parser.add_argument(
        "--parts",
        default=DEFAULT_PARTS,
        help=f"Comma-separated part ids (default: {DEFAULT_PARTS})",
    )
    parser.add_argument(
        "--source-group-slug",
        default=DEFAULT_SOURCE_GROUP_SLUG,
        help=f"Part group folder slug (default: {DEFAULT_SOURCE_GROUP_SLUG})",
    )
    parser.add_argument(
        "--crs",
        default=DEFAULT_CRS,
        help=f"CRS metadata written to index files (default: {DEFAULT_CRS})",
    )
    return parser.parse_args(argv)


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "section"


def normalize_part_id(value: str) -> str:
    token = normalize_space(value).replace(" ", "")
    match = re.match(r"^(\d+)([a-z])$", token, flags=re.IGNORECASE)
    if match:
        return f"{match.group(1)}{match.group(2).upper()}"
    return token.upper()


def parse_part_ids(raw: str) -> List[str]:
    parsed = [normalize_part_id(item) for item in str(raw or "").split(",")]
    dedup: List[str] = []
    seen = set()
    for part_id in parsed:
        if not part_id:
            continue
        if part_id in seen:
            continue
        seen.add(part_id)
        dedup.append(part_id)
    return dedup


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def to_source_summary(source_group_slug: str, part_ids: List[str]) -> str:
    if not part_ids:
        return f"derived-from-part-of-sites: {source_group_slug}"
    if len(part_ids) == 1:
        part_text = part_ids[0]
    else:
        part_text = f"{part_ids[0]}~{part_ids[-1]}"
    return f"derived-from-part-of-sites: {source_group_slug}/{part_text}"


def normalize_token(value: str, fallback: str) -> str:
    token = re.sub(r"[^a-zA-Z0-9]", "", str(value or "")).upper()
    return token or fallback


def build_section_system_id(section_group: str, section_id: str) -> str:
    group_token = normalize_token(section_group, "SEC")
    section_token = normalize_token(section_id, "UNK")
    return f"SOW-{group_token}-{section_token}-001"


def _extract_polygon_parts(geom) -> List[object]:
    geom_type = getattr(geom, "geom_type", "")
    if geom_type == "Polygon":
        return [geom]
    if geom_type == "MultiPolygon":
        return [part for part in getattr(geom, "geoms", []) if not part.is_empty]
    if geom_type == "GeometryCollection":
        parts: List[object] = []
        for sub_geom in getattr(geom, "geoms", []):
            parts.extend(_extract_polygon_parts(sub_geom))
        return parts
    return []


def collect_part_polygon_geometries(
    part_root: Path,
    source_group_slug: str,
    part_ids: List[str],
) -> List[object]:
    _, _, shape, _, make_valid = _require_shapely()
    geometries: List[object] = []
    missing_files: List[Path] = []

    for part_id in part_ids:
        file_path = part_root / source_group_slug / f"{part_id}.geojson"
        if not file_path.exists():
            missing_files.append(file_path)
            continue

        payload = json.loads(file_path.read_text(encoding="utf-8"))
        features = payload.get("features")
        if not isinstance(features, list):
            continue
        for feature in features:
            if not isinstance(feature, dict):
                continue
            geometry = feature.get("geometry")
            if not isinstance(geometry, dict):
                continue
            if geometry.get("type") not in ("Polygon", "MultiPolygon"):
                continue
            geom = make_valid(shape(geometry))
            for part in _extract_polygon_parts(geom):
                if part.is_empty or float(part.area) <= 0:
                    continue
                geometries.append(part)

    if missing_files:
        formatted = ", ".join(path.as_posix() for path in missing_files)
        raise FileNotFoundError(f"Missing part geojson file(s): {formatted}")
    return geometries


def build_section_geometry(geometries: Iterable[object]) -> tuple[dict, int]:
    MultiPolygon, mapping, _, unary_union, make_valid = _require_shapely()
    merged = make_valid(unary_union(list(geometries)))
    parts = [part for part in _extract_polygon_parts(merged) if float(part.area) > 0]
    if not parts:
        raise ValueError("No polygon geometry after union.")

    multi = MultiPolygon(parts)
    multi = make_valid(multi)
    multi_parts = [part for part in _extract_polygon_parts(multi) if float(part.area) > 0]
    if not multi_parts:
        raise ValueError("No valid multipolygon geometry after make_valid.")

    normalized = MultiPolygon(multi_parts)
    return mapping(normalized), len(multi_parts)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    part_root = Path(args.part_root).resolve()
    output_root = Path(args.output_root).resolve()
    section_id = normalize_space(args.section_id)
    section_label = normalize_space(args.section_label)
    section_group = normalize_space(args.section_group)
    source_group_slug = normalize_space(args.source_group_slug)
    part_ids = parse_part_ids(args.parts)
    crs = normalize_space(args.crs) or DEFAULT_CRS
    generated_at = date.today().isoformat()

    if not part_ids:
        print("[ERROR] --parts resolved to empty list", file=sys.stderr)
        return 2
    if not part_root.exists():
        print(f"[ERROR] part-root not found: {part_root}", file=sys.stderr)
        return 2

    group_slug = slugify(section_group)
    group_output_dir = output_root / group_slug
    section_geojson_file = group_output_dir / f"{section_id}.geojson"

    try:
        part_geometries = collect_part_polygon_geometries(
            part_root=part_root,
            source_group_slug=source_group_slug,
            part_ids=part_ids,
        )
    except Exception as exc:
        print(f"[ERROR] failed to collect part geometries: {exc}", file=sys.stderr)
        return 2

    if not part_geometries:
        print(
            "[ERROR] no polygon/multipolygon geometries found from selected parts",
            file=sys.stderr,
        )
        return 2

    try:
        section_geometry, polygon_count = build_section_geometry(part_geometries)
    except Exception as exc:
        print(f"[ERROR] failed to build section geometry: {exc}", file=sys.stderr)
        return 2

    section_feature = {
        "type": "Feature",
        "properties": {
            "sectionId": section_id,
            "sectionLotId": section_id,
            "sectionLotLabel": section_label or section_id,
            "sectionGroup": section_group or "SECTION",
            "sectionSystemId": build_section_system_id(section_group, section_id),
            "relatedPartIds": part_ids,
            "partCount": len(part_ids),
        },
        "geometry": section_geometry,
    }

    section_geojson = {
        "type": "FeatureCollection",
        "features": [section_feature],
    }
    write_json(section_geojson_file, section_geojson)

    source_summary = to_source_summary(source_group_slug, part_ids)
    group_index = {
        "dataset": "sections",
        "group": section_group,
        "crs": crs,
        "generatedAt": generated_at,
        "items": [
            {
                "id": section_id,
                "file": f"/data/geojson/sections/{group_slug}/{section_id}.geojson",
                "featureCount": 1,
                "geometryTypes": ["MultiPolygon"],
                "partCount": len(part_ids),
                "sourceDxf": source_summary,
            }
        ],
    }
    write_json(group_output_dir / "index.json", group_index)

    root_index = {
        "dataset": "sections",
        "crs": crs,
        "generatedAt": generated_at,
        "groups": [
            {
                "id": section_group,
                "slug": group_slug,
                "index": f"/data/geojson/sections/{group_slug}/index.json",
                "itemCount": 1,
            }
        ],
    }
    write_json(output_root / "index.json", root_index)

    print(f"[DONE] section={section_id} group={section_group} polygons={polygon_count}")
    print(f"[DONE] parts={','.join(part_ids)}")
    print(f"[DONE] output={section_geojson_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
