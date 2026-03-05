#!/usr/bin/env python3
"""
Build Section GeoJSON dataset from Part-of-Sites GeoJSON files.

Default behavior:
- Generate SECTION-1 .. SECTION-13 (contract mapping preset)
- Union mapped part geometries into one MultiPolygon per section
- Drop non-polygon fragments and keep interior holes from parts by default
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from datetime import date
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple


DEFAULT_PART_ROOT = "web/public/data/geojson/part-of-sites"
DEFAULT_OUTPUT_ROOT = "web/public/data/geojson/sections"
DEFAULT_CRS = "EPSG:2326"
DEFAULT_MIN_AREA = 1.0
DEFAULT_MIN_HOLE_AREA = 10.0
DEFAULT_OVERLAP_SLIVER_AREA = 20.0
SECTION_10_HOLE_OVERRIDE_PART_ID = "10B"
SECTION_10_HOLE_OVERRIDE_CONTRACT = "C2"
DEFAULT_SIMPLIFY_TOLERANCE = 0.05
DEFAULT_RING_DEDUP_TOLERANCE = 0.05
DEFAULT_RING_BACKTRACK_TOLERANCE = 0.2
DEFAULT_MIN_EDGE_LENGTH = 0.5
DEFAULT_COLLINEAR_ANGLE_TOLERANCE = 1.0
DEFAULT_COLLINEAR_DISTANCE_TOLERANCE = 0.05
DEFAULT_SPIKE_ANGLE_TOLERANCE = 1.0

CONTRACT_SECTION_DEFINITIONS = [
    {
        "id": "SECTION-1",
        "label": "Section 1",
        "group": "SECTION 1",
        "slug": "section-1",
        "partIds": ["1A", "1B", "1C", "1D", "1E", "1F", "1G", "1H", "1I"],
        "description": "Comprises all the works within Part 1A to Part 1I of the Site.",
    },
    {
        "id": "SECTION-2",
        "label": "Section 2",
        "group": "SECTION 2",
        "slug": "section-2",
        "partIds": ["2A", "2B", "2C"],
        "description": "Comprises all the works within Part 2A, Part 2B, and Part 2C of the Site.",
    },
    {
        "id": "SECTION-3",
        "label": "Section 3",
        "group": "SECTION 3",
        "slug": "section-3",
        "partIds": ["3A"],
        "description": "Comprises all the works within Part 3A of the Site.",
    },
    {
        "id": "SECTION-4",
        "label": "Section 4",
        "group": "SECTION 4",
        "slug": "section-4",
        "partIds": ["4A"],
        "description": "Comprises all the works within Part 4A of the Site.",
    },
    {
        "id": "SECTION-5",
        "label": "Section 5",
        "group": "SECTION 5",
        "slug": "section-5",
        "partIds": ["5A", "5B"],
        "description": "Comprises all the works within Part 5A and Part 5B of the Site.",
    },
    {
        "id": "SECTION-6",
        "label": "Section 6",
        "group": "SECTION 6",
        "slug": "section-6",
        "partIds": ["6A"],
        "description": "Comprises all the works within Part 6A of the Site.",
    },
    {
        "id": "SECTION-7",
        "label": "Section 7",
        "group": "SECTION 7",
        "slug": "section-7",
        "partIds": ["7A", "7B", "7C", "7D", "7E"],
        "description": "Comprises all the works within Part 7A, 7B, 7C, 7D, and 7E of the Site.",
    },
    {
        "id": "SECTION-8",
        "label": "Section 8",
        "group": "SECTION 8 (SUBJECT TO EXCISION)",
        "slug": "section-8",
        "partIds": ["8A", "8B", "8C"],
        "description": "Comprises all the works within Part 8A, Part 8B, and Part 8C of the Site.",
    },
    {
        "id": "SECTION-9",
        "label": "Section 9",
        "group": "SECTION 9",
        "slug": "section-9",
        "partIds": ["9A", "9B", "9C", "9D"],
        "description": "Comprises all the works within Part 9A, Part 9B, Part 9C, and Part 9D of the Site.",
    },
    {
        "id": "SECTION-10",
        "label": "Section 10",
        "group": "SECTION 10",
        "slug": "section-10",
        "partIds": ["10A", "10B", "10C", "10D", "10E", "10F", "10G", "10H", "10I", "10J", "10K"],
        "description": "Comprises all the works within Part 10A to Part 10K of the Site.",
        "note": "Contract text states exceptions under SECTION-11 and SECTION-12.",
    },
    {
        "id": "SECTION-11",
        "label": "Section 11",
        "group": "SECTION 11",
        "slug": "section-11",
        "partIds": [],
        "description": "Comprises all the works stated in Drawing Nos. STP2/C2/63/3000 to STP2/C2/63/3414.",
        "sourceNote": "contract-drawings: STP2/C2/63/3000~3414 (geometry pending)",
    },
    {
        "id": "SECTION-12",
        "label": "Section 12",
        "group": "SECTION 12",
        "slug": "section-12",
        "partIds": [],
        "description": "Comprises all landscape softworks and establishment works of all landscape softworks within the Site.",
        "sourceNote": "contract-definition: landscape softworks (geometry pending)",
    },
    {
        "id": "SECTION-13",
        "label": "Section 13",
        "group": "SECTION 13",
        "slug": "section-13",
        "partIds": ["13A", "13B", "13C"],
        "description": "Comprises all the works within Part 13A, Part 13B, and Part 13C of the Site.",
    },
]

C1_SECTION_DEFINITIONS = [
    {
        "id": "SECTION-1",
        "label": "Section 1",
        "group": "SECTION 1 (C1)",
        "slug": "section-c1-1",
        "partIds": ["A1", "A2", "A6", "A11"],
        "description": "Comprises all the works within Part A1, Part A2, Part A6, and Part A11 of the Site.",
        "contractPackage": "C1",
    },
    {
        "id": "SECTION-2",
        "label": "Section 2",
        "group": "SECTION 2 (C1)",
        "slug": "section-c1-2",
        "partIds": ["A9", "A12"],
        "description": "Comprises all the works within Part A9 and Part A12 of the Site.",
        "contractPackage": "C1",
    },
    {
        "id": "SECTION-3",
        "label": "Section 3",
        "group": "SECTION 3 (C1)",
        "slug": "section-c1-3",
        "partIds": ["A3", "A4", "A5"],
        "description": "Comprises all the works within Part A3, Part A4, and Part A5 of the Site.",
        "contractPackage": "C1",
    },
    {
        "id": "SECTION-4",
        "label": "Section 4",
        "group": "SECTION 4 (C1)",
        "slug": "section-c1-4",
        "partIds": ["B1"],
        "description": "Comprises all the works within Part B1 of the Site.",
        "contractPackage": "C1",
    },
    {
        "id": "SECTION-5",
        "label": "Section 5",
        "group": "SECTION 5 (C1)",
        "slug": "section-c1-5",
        "partIds": ["A7", "A8", "A10"],
        "description": "Comprises all the works within Part A7, Part A8, and Part A10 of the Site.",
        "contractPackage": "C1",
    },
]

ALL_SECTION_DEFINITIONS = [*CONTRACT_SECTION_DEFINITIONS, *C1_SECTION_DEFINITIONS]


def _require_shapely():
    try:
        from shapely.geometry import MultiPolygon, Polygon, mapping, shape  # type: ignore
        from shapely.ops import unary_union  # type: ignore
        from shapely.validation import make_valid  # type: ignore
    except Exception as exc:  # pragma: no cover - runtime dependency
        print(
            "Missing dependency: shapely. Install with: pip install shapely",
            file=sys.stderr,
        )
        raise exc
    return MultiPolygon, Polygon, mapping, shape, unary_union, make_valid


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build full Sections dataset by unioning existing part-of-sites geometries."
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
        "--crs",
        default=DEFAULT_CRS,
        help=f"CRS metadata written to index files (default: {DEFAULT_CRS})",
    )
    parser.add_argument(
        "--sections",
        default="",
        help="Optional comma-separated section ids to generate (e.g. SECTION-1,SECTION-2).",
    )
    parser.add_argument(
        "--drop-holes",
        action="store_true",
        help="Drop interior holes in section polygons (default: keep holes inherited from parts).",
    )
    parser.add_argument(
        "--keep-holes",
        action="store_true",
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--min-area",
        type=float,
        default=DEFAULT_MIN_AREA,
        help=(
            "Drop polygon parts smaller than this area (square meters). "
            f"(default: {DEFAULT_MIN_AREA})"
        ),
    )
    parser.add_argument(
        "--min-hole-area",
        type=float,
        default=DEFAULT_MIN_HOLE_AREA,
        help=(
            "Drop interior holes smaller than this area (square meters). "
            f"0 keeps all holes. (default: {DEFAULT_MIN_HOLE_AREA})"
        ),
    )
    parser.add_argument(
        "--overlap-sliver-area",
        type=float,
        default=DEFAULT_OVERLAP_SLIVER_AREA,
        help=(
            "Trim tiny overlaps between sections up to this area (square meters). "
            f"0 disables. Later sections win. (default: {DEFAULT_OVERLAP_SLIVER_AREA})"
        ),
    )
    parser.add_argument(
        "--simplify-tolerance",
        type=float,
        default=DEFAULT_SIMPLIFY_TOLERANCE,
        help=(
            "Simplify section polygon boundaries with topology preserved. "
            f"0 disables. (default: {DEFAULT_SIMPLIFY_TOLERANCE})"
        ),
    )
    parser.add_argument(
        "--no-allow-empty-sections",
        action="store_true",
        help="Fail if a section has no mapped geometries (default: allow empty section files).",
    )
    return parser.parse_args(argv)


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "section"


def normalize_token(value: str, fallback: str) -> str:
    token = re.sub(r"[^a-zA-Z0-9]", "", str(value or "")).upper()
    return token or fallback


def normalize_contract_package(value: str, fallback: str = "C2") -> str:
    token = normalize_space(value).upper()
    if token in {"C1", "C2"}:
        return token
    return normalize_space(fallback).upper() or "C2"


def normalize_part_id(value: str) -> str:
    token = normalize_space(value).replace(" ", "")
    match = re.match(r"^(\d+)([a-z])$", token, flags=re.IGNORECASE)
    if match:
        return f"{match.group(1)}{match.group(2).upper()}"
    return token.upper()


def parse_section_filter(raw: str) -> set[str]:
    if not raw:
        return set()
    values = [normalize_space(item).upper() for item in raw.split(",")]
    return {item for item in values if item}


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def to_rel_posix(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except Exception:
        return path.as_posix()


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


def _xy_tuple(coord: Sequence[float]) -> Tuple[float, float]:
    return float(coord[0]), float(coord[1])


def _distance_xy(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _angle_deg(
    prev_pt: Tuple[float, float],
    curr_pt: Tuple[float, float],
    next_pt: Tuple[float, float],
) -> Optional[float]:
    v1 = (prev_pt[0] - curr_pt[0], prev_pt[1] - curr_pt[1])
    v2 = (next_pt[0] - curr_pt[0], next_pt[1] - curr_pt[1])
    l1 = math.hypot(v1[0], v1[1])
    l2 = math.hypot(v2[0], v2[1])
    if l1 <= 0 or l2 <= 0:
        return None
    dot = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2)
    dot = max(-1.0, min(1.0, dot))
    return math.degrees(math.acos(dot))


def _point_to_segment_distance(
    point: Tuple[float, float],
    seg_start: Tuple[float, float],
    seg_end: Tuple[float, float],
) -> float:
    dx = seg_end[0] - seg_start[0]
    dy = seg_end[1] - seg_start[1]
    den = dx * dx + dy * dy
    if den <= 0:
        return _distance_xy(point, seg_start)
    t = ((point[0] - seg_start[0]) * dx + (point[1] - seg_start[1]) * dy) / den
    t = max(0.0, min(1.0, t))
    proj = (seg_start[0] + t * dx, seg_start[1] + t * dy)
    return _distance_xy(point, proj)


def _ring_signed_area(ring_coords: Sequence[Sequence[float]]) -> float:
    if len(ring_coords) < 4:
        return 0.0
    area2 = 0.0
    for i in range(len(ring_coords) - 1):
        x1, y1 = _xy_tuple(ring_coords[i])
        x2, y2 = _xy_tuple(ring_coords[i + 1])
        area2 += x1 * y2 - x2 * y1
    return 0.5 * area2


def _ring_area(ring_coords: Sequence[Sequence[float]]) -> float:
    return abs(_ring_signed_area(ring_coords))


def _clean_ring_points(
    ring_coords: Sequence[Sequence[float]],
    dedup_tolerance: float = DEFAULT_RING_DEDUP_TOLERANCE,
    backtrack_tolerance: float = DEFAULT_RING_BACKTRACK_TOLERANCE,
    min_edge_length: float = DEFAULT_MIN_EDGE_LENGTH,
    collinear_angle_tolerance: float = DEFAULT_COLLINEAR_ANGLE_TOLERANCE,
    collinear_distance_tolerance: float = DEFAULT_COLLINEAR_DISTANCE_TOLERANCE,
    spike_angle_tolerance: float = DEFAULT_SPIKE_ANGLE_TOLERANCE,
) -> List[Tuple[float, float]]:
    if len(ring_coords) < 4:
        return []

    raw_points = [_xy_tuple(coord) for coord in ring_coords]
    points = raw_points[:-1]
    if len(points) < 3:
        return []

    max_iter = 32
    for _ in range(max_iter):
        changed = False
        i = 0
        while i < len(points):
            if len(points) < 3:
                break
            prev_pt = points[(i - 1) % len(points)]
            curr_pt = points[i]
            next_pt = points[(i + 1) % len(points)]

            if _distance_xy(prev_pt, curr_pt) <= dedup_tolerance:
                points.pop(i)
                changed = True
                continue

            if _distance_xy(prev_pt, next_pt) <= backtrack_tolerance:
                # Remove center of a near A->B->A spike.
                points.pop(i)
                changed = True
                continue

            angle = _angle_deg(prev_pt, curr_pt, next_pt)
            if angle is not None and angle <= spike_angle_tolerance:
                # Remove near-reverse cusp even when the return leg is slightly offset.
                points.pop(i)
                changed = True
                continue

            prev_len = _distance_xy(prev_pt, curr_pt)
            next_len = _distance_xy(curr_pt, next_pt)
            if prev_len < min_edge_length and next_len < min_edge_length:
                points.pop(i)
                changed = True
                continue

            if angle is not None and abs(180.0 - angle) <= collinear_angle_tolerance:
                dist_to_segment = _point_to_segment_distance(curr_pt, prev_pt, next_pt)
                if dist_to_segment <= collinear_distance_tolerance:
                    points.pop(i)
                    changed = True
                    continue

            i += 1

        if not changed:
            break

    if len(points) < 3:
        return []
    return points + [points[0]]


def _normalize_polygon_shells(polygons: Iterable[object]) -> List[object]:
    _, Polygon, _, _, _, make_valid = _require_shapely()
    normalized: List[object] = []

    for polygon in polygons:
        cleaned_shell = _clean_ring_points(getattr(polygon, "exterior").coords)
        if not cleaned_shell:
            continue
        cleaned_poly = make_valid(Polygon(cleaned_shell))
        for part in _extract_polygon_parts(cleaned_poly):
            if part.is_empty or float(part.area) <= 0:
                continue
            normalized.append(part)

    return normalized


def _normalize_polygon_rings(
    polygons: Iterable[object],
    keep_holes: bool,
    min_area: float,
) -> List[object]:
    _, Polygon, _, _, _, make_valid = _require_shapely()
    normalized: List[object] = []

    for polygon in polygons:
        shell_coords = getattr(polygon, "exterior").coords
        cleaned_shell = _clean_ring_points(shell_coords)
        if not cleaned_shell:
            continue

        cleaned_holes: List[List[Tuple[float, float]]] = []
        if keep_holes:
            for interior in getattr(polygon, "interiors", []):
                cleaned_hole = _clean_ring_points(interior.coords)
                if not cleaned_hole:
                    continue
                if _ring_area(cleaned_hole) <= 0:
                    continue
                cleaned_holes.append(cleaned_hole)

        candidate = make_valid(Polygon(cleaned_shell, cleaned_holes))
        for part in _extract_polygon_parts(candidate):
            area = float(part.area)
            if area <= 0:
                continue
            if min_area > 0 and area < min_area:
                continue
            normalized.append(part)

    return normalized


def _filter_small_holes(
    polygons: Iterable[object],
    min_hole_area: float,
    min_area: float,
) -> List[object]:
    _, Polygon, _, _, _, make_valid = _require_shapely()
    if min_hole_area <= 0:
        return [part for part in polygons if not part.is_empty and float(part.area) > 0]

    cleaned: List[object] = []
    for polygon in polygons:
        shell = list(getattr(polygon, "exterior").coords)
        kept_holes: List[List[Tuple[float, float]]] = []
        for interior in getattr(polygon, "interiors", []):
            coords = [(_xy_tuple(coord)) for coord in interior.coords]
            if len(coords) < 4:
                continue
            if _ring_area(coords) < min_hole_area:
                continue
            kept_holes.append(coords)

        candidate = make_valid(Polygon(shell, kept_holes))
        for part in _extract_polygon_parts(candidate):
            area = float(part.area)
            if area <= 0:
                continue
            if min_area > 0 and area < min_area:
                continue
            cleaned.append(part)

    return cleaned


def _normalize_geometry_rings(
    geom,
    keep_holes: bool,
    min_area: float,
):
    MultiPolygon, _, _, _, unary_union, make_valid = _require_shapely()
    source_parts = [
        part
        for part in _extract_polygon_parts(make_valid(geom))
        if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
    ]
    if not source_parts:
        return make_valid(geom)

    ring_cleaned_parts = _normalize_polygon_rings(
        source_parts,
        keep_holes=keep_holes,
        min_area=min_area,
    )
    if not ring_cleaned_parts:
        return make_valid(MultiPolygon(source_parts))

    ring_cleaned_union = make_valid(unary_union(ring_cleaned_parts))
    final_parts = [
        part
        for part in _extract_polygon_parts(ring_cleaned_union)
        if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
    ]
    if not final_parts:
        return make_valid(MultiPolygon(source_parts))

    return make_valid(MultiPolygon(final_parts))


def _dedupe_ring_points(
    ring_coords: Sequence[Sequence[float]],
    tolerance: float = 0.001,
) -> List[Tuple[float, float]]:
    if len(ring_coords) < 4:
        return []

    deduped: List[Tuple[float, float]] = []
    for coord in ring_coords:
        point = _xy_tuple(coord)
        if deduped and _distance_xy(deduped[-1], point) <= tolerance:
            continue
        deduped.append(point)

    if len(deduped) < 3:
        return []

    if _distance_xy(deduped[0], deduped[-1]) > tolerance:
        deduped.append(deduped[0])
    else:
        deduped[-1] = deduped[0]

    if len(deduped) < 4:
        return []
    return deduped


def _dedupe_geometry_vertices(
    geom,
    keep_holes: bool,
    min_area: float,
):
    MultiPolygon, Polygon, _, _, unary_union, make_valid = _require_shapely()
    parts = [
        part
        for part in _extract_polygon_parts(make_valid(geom))
        if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
    ]
    if not parts:
        return make_valid(geom)

    deduped_parts: List[object] = []
    for polygon in parts:
        shell = _dedupe_ring_points(getattr(polygon, "exterior").coords)
        if not shell:
            continue

        holes: List[List[Tuple[float, float]]] = []
        if keep_holes:
            for interior in getattr(polygon, "interiors", []):
                hole = _dedupe_ring_points(interior.coords)
                if not hole:
                    continue
                if _ring_area(hole) <= 0:
                    continue
                holes.append(hole)

        candidate = make_valid(Polygon(shell, holes))
        for part in _extract_polygon_parts(candidate):
            area = float(part.area)
            if area <= 0:
                continue
            if min_area > 0 and area < min_area:
                continue
            deduped_parts.append(part)

    if not deduped_parts:
        return make_valid(MultiPolygon(parts))

    unioned = make_valid(unary_union(deduped_parts))
    final_parts = [
        part
        for part in _extract_polygon_parts(unioned)
        if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
    ]
    if not final_parts:
        return make_valid(MultiPolygon(parts))

    return make_valid(MultiPolygon(final_parts))


def resolve_item_file_to_path(part_root: Path, item_file: str) -> Path:
    token = normalize_space(item_file)
    if not token:
        raise ValueError("Empty item file path")

    prefix = "/data/geojson/part-of-sites/"
    if token.startswith(prefix):
        return part_root / token[len(prefix) :]

    if token.startswith("/"):
        return part_root / token.lstrip("/")

    return part_root / token


def load_part_geojson_file_lookup(part_root: Path) -> dict[str, Path]:
    root_index_file = part_root / "index.json"
    if not root_index_file.exists():
        raise FileNotFoundError(f"Part root index not found: {root_index_file}")

    root_index = json.loads(root_index_file.read_text(encoding="utf-8"))
    groups = root_index.get("groups")
    if not isinstance(groups, list):
        raise ValueError(f"Invalid part root index (groups must be list): {root_index_file}")

    lookup: dict[str, Path] = {}
    duplicates: dict[str, list[str]] = {}

    for group in groups:
        if not isinstance(group, dict):
            continue
        group_index_ref = normalize_space(group.get("index"))
        if not group_index_ref:
            continue
        group_index_file = resolve_item_file_to_path(part_root, group_index_ref)
        if not group_index_file.exists():
            continue

        group_index = json.loads(group_index_file.read_text(encoding="utf-8"))
        items = group_index.get("items")
        if not isinstance(items, list):
            continue

        for item in items:
            if not isinstance(item, dict):
                continue
            part_id = normalize_part_id(item.get("id"))
            item_file = normalize_space(item.get("file"))
            if not part_id or not item_file:
                continue
            resolved = resolve_item_file_to_path(part_root, item_file)
            if part_id in lookup and lookup[part_id] != resolved:
                duplicates.setdefault(part_id, []).append(resolved.as_posix())
                continue
            lookup[part_id] = resolved

    if duplicates:
        warning_lines = [
            f"{key}: kept={lookup[key].as_posix()} ignored={','.join(paths)}"
            for key, paths in sorted(duplicates.items())
        ]
        print(
            "[WARN] duplicate part ids detected in part indexes:\n  "
            + "\n  ".join(warning_lines),
            file=sys.stderr,
        )

    return lookup


def collect_part_polygon_geometries(
    part_lookup: dict[str, Path],
    part_ids: List[str],
) -> tuple[List[object], List[str], List[Path]]:
    _, _, _, shape, _, make_valid = _require_shapely()
    geometries: List[object] = []
    missing_parts: List[str] = []
    source_files: List[Path] = []

    for part_id in part_ids:
        part_file = part_lookup.get(part_id)
        if part_file is None:
            missing_parts.append(part_id)
            continue
        if not part_file.exists():
            missing_parts.append(part_id)
            continue

        source_files.append(part_file)
        payload = json.loads(part_file.read_text(encoding="utf-8"))
        features = payload.get("features")
        if not isinstance(features, list):
            continue

        for feature in features:
            if not isinstance(feature, dict):
                continue
            geometry = feature.get("geometry")
            if not isinstance(geometry, dict):
                continue
            geom = make_valid(shape(geometry))
            for part in _extract_polygon_parts(geom):
                if part.is_empty or float(part.area) <= 0:
                    continue
                geometries.append(part)

    return geometries, missing_parts, source_files


def build_section_geometry(
    geometries: Iterable[object],
    keep_holes: bool,
    min_area: float,
    min_hole_area: float,
    simplify_tolerance: float,
) -> tuple[dict, int, int, float]:
    MultiPolygon, Polygon, mapping, _, unary_union, make_valid = _require_shapely()

    merged = make_valid(unary_union(list(geometries)))
    base_parts = [part for part in _extract_polygon_parts(merged) if float(part.area) > 0]
    if not base_parts:
        raise ValueError("No polygon geometry after union.")

    cleaned_parts: List[object] = []
    for part in base_parts:
        candidate = part
        if not keep_holes:
            candidate = Polygon(part.exterior)
        candidate = make_valid(candidate)
        for polygon_part in _extract_polygon_parts(candidate):
            area = float(polygon_part.area)
            if area <= 0:
                continue
            if min_area > 0 and area < min_area:
                continue
            cleaned_parts.append(polygon_part)

    if not cleaned_parts:
        raise ValueError("No polygon geometry after cleanup.")

    dissolved = make_valid(unary_union(cleaned_parts))
    dissolved_parts = [part for part in _extract_polygon_parts(dissolved) if float(part.area) > 0]
    if not dissolved_parts:
        raise ValueError("No polygon geometry after dissolve.")

    multi = make_valid(MultiPolygon(dissolved_parts))
    multi_parts = [part for part in _extract_polygon_parts(multi) if float(part.area) > 0]
    if not multi_parts:
        raise ValueError("No valid multipolygon geometry after make_valid.")

    if not keep_holes:
        shell_only_parts: List[object] = []
        for part in multi_parts:
            shell_only = make_valid(Polygon(part.exterior))
            for shell_part in _extract_polygon_parts(shell_only):
                area = float(shell_part.area)
                if area <= 0:
                    continue
                if min_area > 0 and area < min_area:
                    continue
                shell_only_parts.append(shell_part)
        if not shell_only_parts:
            raise ValueError("No polygon geometry after final shell-only cleanup.")
        shell_only_union = make_valid(unary_union(shell_only_parts))
        multi_parts = [
            part for part in _extract_polygon_parts(shell_only_union) if float(part.area) > 0
        ]
        if not multi_parts:
            raise ValueError("No polygon geometry after final shell-only dissolve.")

    if simplify_tolerance > 0:
        simplified_parts: List[object] = []
        for part in multi_parts:
            simplified = make_valid(
                part.simplify(simplify_tolerance, preserve_topology=True)
            )
            for simplified_part in _extract_polygon_parts(simplified):
                area = float(simplified_part.area)
                if area <= 0:
                    continue
                if min_area > 0 and area < min_area:
                    continue
                if not keep_holes:
                    shell_only = make_valid(Polygon(simplified_part.exterior))
                    for shell_part in _extract_polygon_parts(shell_only):
                        shell_area = float(shell_part.area)
                        if shell_area <= 0:
                            continue
                        if min_area > 0 and shell_area < min_area:
                            continue
                        simplified_parts.append(shell_part)
                    continue
                simplified_parts.append(simplified_part)

        if not simplified_parts:
            raise ValueError("No polygon geometry after simplify cleanup.")
        simplified_union = make_valid(unary_union(simplified_parts))
        multi_parts = [
            part for part in _extract_polygon_parts(simplified_union) if float(part.area) > 0
        ]
        if not multi_parts:
            raise ValueError("No polygon geometry after simplify dissolve.")

    if not keep_holes:
        shell_normalized = _normalize_polygon_shells(multi_parts)
        if not shell_normalized:
            raise ValueError("No polygon geometry after shell spike cleanup.")
        shell_union = make_valid(unary_union(shell_normalized))
        multi_parts = [part for part in _extract_polygon_parts(shell_union) if float(part.area) > 0]
        if not multi_parts:
            raise ValueError("No polygon geometry after shell spike dissolve.")

    final_parts: List[object] = []
    for part in multi_parts:
        candidate = part if keep_holes else make_valid(Polygon(part.exterior))
        for candidate_part in _extract_polygon_parts(make_valid(candidate)):
            area = float(candidate_part.area)
            if area <= 0:
                continue
            if min_area > 0 and area < min_area:
                continue
            final_parts.append(candidate_part)

    if not final_parts:
        raise ValueError("No polygon geometry after final min-area cleanup.")

    final_union = make_valid(unary_union(final_parts))
    multi_parts = [
        part
        for part in _extract_polygon_parts(final_union)
        if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
    ]
    if not multi_parts:
        raise ValueError("No polygon geometry after final dissolve.")

    if keep_holes and min_hole_area > 0:
        hole_cleaned_parts = _filter_small_holes(
            multi_parts,
            min_hole_area=min_hole_area,
            min_area=min_area,
        )
        if not hole_cleaned_parts:
            raise ValueError("No polygon geometry after tiny-hole cleanup.")
        hole_cleaned_union = make_valid(unary_union(hole_cleaned_parts))
        multi_parts = [
            part
            for part in _extract_polygon_parts(hole_cleaned_union)
            if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
        ]
        if not multi_parts:
            raise ValueError("No polygon geometry after tiny-hole dissolve.")

    ring_cleaned_parts = _normalize_polygon_rings(
        multi_parts,
        keep_holes=keep_holes,
        min_area=min_area,
    )
    if not ring_cleaned_parts:
        raise ValueError("No polygon geometry after ring cleanup.")

    ring_cleaned_union = make_valid(unary_union(ring_cleaned_parts))
    multi_parts = [
        part
        for part in _extract_polygon_parts(ring_cleaned_union)
        if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
    ]
    if not multi_parts:
        raise ValueError("No polygon geometry after ring cleanup dissolve.")

    normalized = MultiPolygon(multi_parts)
    total_holes = sum(len(part.interiors) for part in multi_parts)
    total_area = float(normalized.area)
    return mapping(normalized), len(multi_parts), total_holes, total_area


def build_part_source_summary(part_ids: List[str]) -> str:
    if not part_ids:
        return "derived-from-part-of-sites: none"
    if len(part_ids) <= 3:
        return f"derived-from-part-of-sites: {','.join(part_ids)}"
    return f"derived-from-part-of-sites: {part_ids[0]}~{part_ids[-1]}"


def make_empty_section_geojson() -> dict:
    return {"type": "FeatureCollection", "features": []}


def build_section_feature(
    section_id: str,
    section_label: str,
    section_group: str,
    contract_package: str,
    section_description: str,
    section_note: str,
    related_part_ids: List[str],
    geometry: dict,
) -> dict:
    properties = {
        "sectionId": section_id,
        "sectionLotId": section_id,
        "sectionLotLabel": section_label,
        "sectionGroup": section_group,
        "sectionSystemId": build_section_system_id(section_group, section_id),
        "relatedPartIds": related_part_ids,
        "partCount": len(related_part_ids),
        "contractPackage": normalize_contract_package(contract_package, "C2"),
    }
    if section_description:
        properties["description"] = section_description
    if section_note:
        properties["note"] = section_note

    return {
        "type": "Feature",
        "properties": properties,
        "geometry": geometry,
    }


def _extract_largest_hole_ring_from_part(part_file: Path) -> Optional[List[Tuple[float, float]]]:
    _, _, _, shape, _, make_valid = _require_shapely()
    payload = json.loads(part_file.read_text(encoding="utf-8"))
    features = payload.get("features")
    if not isinstance(features, list):
        return None

    best_area = 0.0
    best_ring: Optional[List[Tuple[float, float]]] = None

    for feature in features:
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            continue
        geom = make_valid(shape(geometry))
        for polygon in _extract_polygon_parts(geom):
            for interior in getattr(polygon, "interiors", []):
                coords = [_xy_tuple(coord) for coord in interior.coords]
                if len(coords) < 4:
                    continue
                area = _ring_area(coords)
                if area <= 0:
                    continue
                if area > best_area:
                    best_area = area
                    best_ring = coords

    return best_ring


def apply_section_10_hole_override(
    part_lookup: dict[str, Path],
    section_records: List[dict],
    min_area: float,
) -> bool:
    part_file = part_lookup.get(SECTION_10_HOLE_OVERRIDE_PART_ID)
    if part_file is None or not part_file.exists():
        print(
            f"[WARN] SECTION-10 hole override skipped: part file not found for "
            f"{SECTION_10_HOLE_OVERRIDE_PART_ID}"
        )
        return False

    largest_hole_ring = _extract_largest_hole_ring_from_part(part_file)
    if not largest_hole_ring:
        print(
            f"[WARN] SECTION-10 hole override skipped: no hole found in "
            f"{SECTION_10_HOLE_OVERRIDE_PART_ID}"
        )
        return False

    section_record = next(
        (
            item
            for item in section_records
            if normalize_space(item.get("id")) == "SECTION-10"
            and normalize_contract_package(
                item.get("contractPackage"),
                SECTION_10_HOLE_OVERRIDE_CONTRACT,
            )
            == SECTION_10_HOLE_OVERRIDE_CONTRACT
            and int(item.get("featureCount", 0)) > 0
            and isinstance(item.get("filePath"), Path)
        ),
        None,
    )
    if section_record is None:
        print("[WARN] SECTION-10 hole override skipped: SECTION-10 record not found")
        return False

    section_file = section_record["filePath"]
    if not section_file.exists():
        print(f"[WARN] SECTION-10 hole override skipped: file not found {section_file}")
        return False

    MultiPolygon, Polygon, mapping, shape, unary_union, make_valid = _require_shapely()
    payload = json.loads(section_file.read_text(encoding="utf-8"))
    features = payload.get("features")
    if not isinstance(features, list) or not features:
        print("[WARN] SECTION-10 hole override skipped: empty section feature list")
        return False

    geometry = features[0].get("geometry")
    if not isinstance(geometry, dict):
        print("[WARN] SECTION-10 hole override skipped: invalid section geometry")
        return False

    section_geom = make_valid(shape(geometry))
    section_parts = [
        part
        for part in _extract_polygon_parts(section_geom)
        if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
    ]
    if not section_parts:
        print("[WARN] SECTION-10 hole override skipped: no polygon parts")
        return False

    hole_polygon = make_valid(Polygon(largest_hole_ring))
    hole_area = float(hole_polygon.area)
    if hole_area <= 0:
        print("[WARN] SECTION-10 hole override skipped: invalid hole geometry")
        return False

    host_index = -1
    host_overlap = 0.0
    for index, polygon in enumerate(section_parts):
        shell = make_valid(Polygon(polygon.exterior.coords))
        try:
            overlap = float(make_valid(shell.intersection(hole_polygon)).area)
        except Exception:
            overlap = 0.0
        if overlap > host_overlap:
            host_overlap = overlap
            host_index = index

    if host_index < 0 or host_overlap <= 0:
        print("[WARN] SECTION-10 hole override skipped: no host polygon overlaps hole")
        return False

    rebuilt_parts: List[object] = []
    hole_inserted = False
    hole_already_present = False

    for index, polygon in enumerate(section_parts):
        shell_coords = [_xy_tuple(coord) for coord in polygon.exterior.coords]
        retained_holes: List[List[Tuple[float, float]]] = []

        for interior in getattr(polygon, "interiors", []):
            coords = [_xy_tuple(coord) for coord in interior.coords]
            if len(coords) < 4:
                continue
            retained_holes.append(coords)
            try:
                interior_poly = make_valid(Polygon(coords))
                intersection_area = float(
                    make_valid(interior_poly.intersection(hole_polygon)).area
                )
                interior_area = float(interior_poly.area)
            except Exception:
                intersection_area = 0.0
                interior_area = 0.0
            if (
                intersection_area > 0
                and interior_area > 0
                and intersection_area >= hole_area * 0.98
                and intersection_area >= interior_area * 0.98
            ):
                hole_already_present = True

        if index == host_index and not hole_already_present:
            retained_holes.append(largest_hole_ring)
            hole_inserted = True

        candidate = make_valid(Polygon(shell_coords, retained_holes))
        for part in _extract_polygon_parts(candidate):
            area = float(part.area)
            if area <= 0:
                continue
            if min_area > 0 and area < min_area:
                continue
            rebuilt_parts.append(part)

    if not rebuilt_parts:
        print("[WARN] SECTION-10 hole override skipped: no geometry after rebuilding")
        return False

    merged = make_valid(unary_union(rebuilt_parts))
    merged_parts = [
        part
        for part in _extract_polygon_parts(merged)
        if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
    ]
    if not merged_parts:
        print("[WARN] SECTION-10 hole override skipped: no final polygon parts")
        return False

    final_geom = make_valid(MultiPolygon(merged_parts))
    final_geom = _dedupe_geometry_vertices(
        final_geom,
        keep_holes=True,
        min_area=min_area,
    )
    final_geom = _normalize_geometry_rings(
        final_geom,
        keep_holes=True,
        min_area=min_area,
    )
    features[0]["geometry"] = mapping(final_geom)
    write_json(section_file, payload)

    final_holes = sum(len(part.interiors) for part in _extract_polygon_parts(final_geom))
    action = "already-present" if hole_already_present else ("inserted" if hole_inserted else "skipped")
    print(
        "[OVERRIDE] SECTION-10 ensured hole from 10B: "
        f"hole_area={hole_area:.3f} host_overlap={host_overlap:.3f} "
        f"action={action} final_holes={final_holes}"
    )
    return True


def cleanup_section_overlap_slivers(
    section_records: List[dict],
    min_area: float,
    overlap_sliver_area: float,
) -> int:
    if overlap_sliver_area <= 0:
        return 0

    MultiPolygon, _, mapping, shape, _, make_valid = _require_shapely()

    payloads_by_id: dict[str, dict] = {}
    geometries_by_id: dict[str, object] = {}
    sequence_ids: List[str] = []

    for record in section_records:
        section_id = normalize_space(record.get("id"))
        section_file = record.get("filePath")
        if not section_id or not isinstance(section_file, Path):
            continue
        if int(record.get("featureCount", 0)) <= 0:
            continue
        if not section_file.exists():
            continue

        payload = json.loads(section_file.read_text(encoding="utf-8"))
        features = payload.get("features")
        if not isinstance(features, list) or not features:
            continue
        geometry = features[0].get("geometry")
        if not isinstance(geometry, dict):
            continue

        geom = make_valid(shape(geometry))
        parts = [
            part
            for part in _extract_polygon_parts(geom)
            if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
        ]
        if not parts:
            continue

        sequence_ids.append(section_id)
        payloads_by_id[section_id] = payload
        geometries_by_id[section_id] = make_valid(MultiPolygon(parts))

    trimmed = 0
    for index, section_id in enumerate(sequence_ids):
        current_geom = geometries_by_id.get(section_id)
        if current_geom is None:
            continue

        for prev_id in sequence_ids[:index]:
            previous_geom = geometries_by_id.get(prev_id)
            if previous_geom is None:
                continue

            try:
                overlap_geom = make_valid(previous_geom.intersection(current_geom))
            except Exception:
                continue

            overlap_parts = [
                part
                for part in _extract_polygon_parts(overlap_geom)
                if float(part.area) > 0
            ]
            if not overlap_parts:
                continue

            overlap_area = sum(float(part.area) for part in overlap_parts)
            if overlap_area <= 0 or overlap_area > overlap_sliver_area:
                continue

            try:
                cleaned_previous = make_valid(previous_geom.difference(overlap_geom))
            except Exception:
                continue

            cleaned_parts = [
                part
                for part in _extract_polygon_parts(cleaned_previous)
                if float(part.area) > 0 and (min_area <= 0 or float(part.area) >= min_area)
            ]
            if not cleaned_parts:
                continue

            new_previous = make_valid(MultiPolygon(cleaned_parts))
            if abs(float(previous_geom.area) - float(new_previous.area)) <= 1e-9:
                continue

            geometries_by_id[prev_id] = new_previous
            trimmed += 1
            print(
                f"[CLEAN] trimmed overlap area={overlap_area:.3f} from {prev_id} "
                f"(overlapped by {section_id})"
            )

    for section_id in sequence_ids:
        payload = payloads_by_id.get(section_id)
        geometry = geometries_by_id.get(section_id)
        if payload is None or geometry is None:
            continue
        geometry = _dedupe_geometry_vertices(
            geometry,
            keep_holes=True,
            min_area=min_area,
        )
        features = payload.get("features")
        if not isinstance(features, list) or not features:
            continue
        features[0]["geometry"] = mapping(geometry)

    for record in section_records:
        section_id = normalize_space(record.get("id"))
        section_file = record.get("filePath")
        if not section_id or not isinstance(section_file, Path):
            continue
        payload = payloads_by_id.get(section_id)
        if payload is None:
            continue
        write_json(section_file, payload)

    return trimmed


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    part_root = Path(args.part_root).resolve()
    output_root = Path(args.output_root).resolve()
    crs = normalize_space(args.crs) or DEFAULT_CRS
    selected_sections = parse_section_filter(args.sections)
    keep_holes = not bool(args.drop_holes)
    min_area = max(0.0, float(args.min_area))
    min_hole_area = max(0.0, float(args.min_hole_area))
    overlap_sliver_area = max(0.0, float(args.overlap_sliver_area))
    simplify_tolerance = max(0.0, float(args.simplify_tolerance))
    allow_empty_sections = not args.no_allow_empty_sections
    generated_at = date.today().isoformat()

    if not part_root.exists() or not part_root.is_dir():
        print(f"[ERROR] part-root not found: {part_root}", file=sys.stderr)
        return 2

    section_defs = CONTRACT_SECTION_DEFINITIONS
    if selected_sections:
        section_defs = [
            item
            for item in CONTRACT_SECTION_DEFINITIONS
            if normalize_space(item.get("id")).upper() in selected_sections
        ]
    if not section_defs:
        print("[ERROR] no section definitions matched --sections", file=sys.stderr)
        return 2

    try:
        part_lookup = load_part_geojson_file_lookup(part_root)
    except Exception as exc:
        print(f"[ERROR] failed to load part lookup: {exc}", file=sys.stderr)
        return 2

    output_root.mkdir(parents=True, exist_ok=True)

    groups_meta: List[dict] = []
    section_records: List[dict] = []
    total_features = 0

    for section_def in section_defs:
        section_id = normalize_space(section_def.get("id"))
        section_label = normalize_space(section_def.get("label")) or section_id
        section_group = normalize_space(section_def.get("group")) or section_id
        section_slug = normalize_space(section_def.get("slug")) or slugify(section_id)
        section_description = normalize_space(section_def.get("description"))
        section_note = normalize_space(section_def.get("note"))
        source_note = normalize_space(section_def.get("sourceNote"))
        part_ids = [normalize_part_id(item) for item in section_def.get("partIds", [])]

        group_output_dir = output_root / section_slug
        section_geojson_file = group_output_dir / f"{section_id}.geojson"

        geometries, missing_parts, source_files = collect_part_polygon_geometries(part_lookup, part_ids)
        if missing_parts:
            missing_text = ",".join(sorted(set(missing_parts)))
            print(f"[WARN] {section_id} missing part files: {missing_text}", file=sys.stderr)

        feature_count = 0
        geometry_types: List[str] = []
        polygon_count = 0
        hole_count = 0
        area = 0.0

        if geometries:
            try:
                section_geometry, polygon_count, hole_count, area = build_section_geometry(
                    geometries=geometries,
                    keep_holes=keep_holes,
                    min_area=min_area,
                    min_hole_area=min_hole_area,
                    simplify_tolerance=simplify_tolerance,
                )
            except Exception as exc:
                print(f"[ERROR] {section_id} geometry build failed: {exc}", file=sys.stderr)
                return 2

            feature = build_section_feature(
                section_id=section_id,
                section_label=section_label,
                section_group=section_group,
                section_description=section_description,
                section_note=section_note,
                related_part_ids=part_ids,
                geometry=section_geometry,
            )
            write_json(
                section_geojson_file,
                {
                    "type": "FeatureCollection",
                    "features": [feature],
                },
            )
            feature_count = 1
            geometry_types = ["MultiPolygon"]
        else:
            if not allow_empty_sections:
                print(
                    f"[ERROR] {section_id} has no geometries and empty sections are disabled",
                    file=sys.stderr,
                )
                return 2
            write_json(section_geojson_file, make_empty_section_geojson())

        if source_files:
            source_summary = build_part_source_summary(part_ids)
        else:
            source_summary = source_note or "derived-from-part-of-sites: no geometry source"

        item = {
            "id": section_id,
            "file": f"/data/geojson/sections/{section_slug}/{section_id}.geojson",
            "featureCount": feature_count,
            "geometryTypes": geometry_types,
            "partCount": len(part_ids),
            "sourceDxf": source_summary,
        }
        if section_note:
            item["note"] = section_note
        if section_description:
            item["description"] = section_description

        group_index = {
            "dataset": "sections",
            "group": section_group,
            "crs": crs,
            "generatedAt": generated_at,
            "items": [item],
        }
        write_json(group_output_dir / "index.json", group_index)

        groups_meta.append(
            {
                "id": section_group,
                "slug": section_slug,
                "index": f"/data/geojson/sections/{section_slug}/index.json",
                "itemCount": 1,
            }
        )
        section_records.append(
            {
                "id": section_id,
                "slug": section_slug,
                "featureCount": feature_count,
                "filePath": section_geojson_file,
            }
        )

        total_features += feature_count
        if feature_count > 0:
            print(
                f"[DONE] {section_id} parts={len(part_ids)} polygons={polygon_count} "
                f"holes={hole_count} area={area:.3f}"
            )
        else:
            print(f"[DONE] {section_id} parts={len(part_ids)} features=0 (empty placeholder)")

    trimmed_count = cleanup_section_overlap_slivers(
        section_records=section_records,
        min_area=min_area,
        overlap_sliver_area=overlap_sliver_area,
    )
    if trimmed_count > 0:
        print(f"[DONE] overlap-sliver-cleanup trimmed={trimmed_count}")

    override_applied = apply_section_10_hole_override(
        part_lookup=part_lookup,
        section_records=section_records,
        min_area=min_area,
    )
    if override_applied:
        print("[DONE] SECTION-10 hole override applied")
        post_override_trimmed = cleanup_section_overlap_slivers(
            section_records=section_records,
            min_area=min_area,
            overlap_sliver_area=overlap_sliver_area,
        )
        if post_override_trimmed > 0:
            print(
                "[DONE] overlap-sliver-cleanup after SECTION-10 override "
                f"trimmed={post_override_trimmed}"
            )

    root_index = {
        "dataset": "sections",
        "crs": crs,
        "generatedAt": generated_at,
        "groups": groups_meta,
    }
    write_json(output_root / "index.json", root_index)

    print(
        f"[DONE] sections={len(groups_meta)} features={total_features} "
        f"output-root={output_root}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
