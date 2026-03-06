#!/usr/bin/env python3
"""
Batch-convert Part of Sites DXF folders into frontend-ready GeoJSON files.

Output layout (default):
web/public/data/geojson/part-of-sites/
  index.json
  part-1/
    index.json
    1A.geojson
    ...
"""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

from dxf_to_geojson import convert


DEFAULT_INPUT_ROOT = "dxf_drawings"
DEFAULT_OUTPUT_ROOT = "web/public/data/geojson/part-of-sites"
DEFAULT_CRS = "EPSG:2326"
DEFAULT_DATASET = "part-of-sites"
MERGE_SCRIPT_PATH = Path(__file__).with_name("merge_part_of_sites_dxf.py")
PART10_DUPLICATE_OVERLAP_THRESHOLD = 0.95
PART10_LINE_CLOSE_TOLERANCE = 3.0
PART10_MIN_AREA = 1.0
PART10_10B_VOID_DXF_FILENAMES: set[str] = {"10b(hole).dxf"}
PART10_ENABLE_LINE_VOID_CUTOUT = True
# Exclude dedicated hole source from normal 10B merge to avoid extra pseudo-part outputs.
PART10_10B_EXCLUDED_DXF_FILENAMES: set[str] = {"10b(hole).dxf"}
PART10_10B_LINE_VOID_MIN_AREA = 1000.0
DEFAULT_TOPOLOGY_CLEAN_GRID = 0.001
DEFAULT_TOPOLOGY_CLEAN_MIN_AREA = 0.0


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert all Part-of-Sites DXF files to grouped GeoJSON outputs."
    )
    parser.add_argument(
        "--input-root",
        default=DEFAULT_INPUT_ROOT,
        help=f"Input folder that contains PART folders (default: {DEFAULT_INPUT_ROOT})",
    )
    parser.add_argument(
        "--output-root",
        default=DEFAULT_OUTPUT_ROOT,
        help=f"Output root for grouped GeoJSON files (default: {DEFAULT_OUTPUT_ROOT})",
    )
    parser.add_argument(
        "--source-crs",
        default=DEFAULT_CRS,
        help=f"Source CRS passed to dxf_to_geojson.py (default: {DEFAULT_CRS})",
    )
    parser.add_argument(
        "--target-crs",
        default=DEFAULT_CRS,
        help=f"Target CRS passed to dxf_to_geojson.py (default: {DEFAULT_CRS})",
    )
    parser.add_argument(
        "--no-transform",
        action="store_true",
        help="Skip CRS transform and write null CRS in conversion step.",
    )
    parser.add_argument(
        "--flatten",
        type=float,
        default=0.2,
        help="Flatten distance for curves (same as dxf_to_geojson default).",
    )
    parser.add_argument(
        "--no-inserts",
        action="store_true",
        help="Do not expand block INSERT entities.",
    )
    parser.add_argument(
        "--polygonize",
        action="store_true",
        help="Enable polygonization for open linework (off by default to match part 1 flow).",
    )
    parser.add_argument(
        "--keep-lines",
        action="store_true",
        help="When --polygonize is enabled, keep original line features.",
    )
    parser.add_argument(
        "--snap",
        type=float,
        default=0.0,
        help="Coordinate snap grid size.",
    )
    parser.add_argument(
        "--close-tolerance",
        type=float,
        default=0.5,
        help=(
            "Force-close open polylines when endpoints are within this tolerance "
            "(default: 0.5)."
        ),
    )
    parser.add_argument(
        "--snap-tolerance",
        type=float,
        default=0.0,
        help="Snap nearby line endpoints before polygonize.",
    )
    parser.add_argument(
        "--bridge-tolerance",
        type=float,
        default=0.0,
        help="Bridge nearest line endpoints within tolerance before polygonize.",
    )
    parser.add_argument(
        "--groups",
        default="",
        help="Optional comma-separated group filters (e.g. 'PART 2,part-13').",
    )
    parser.add_argument(
        "--variant-merge-align-mode",
        choices=("world", "insbase"),
        default="insbase",
        help=(
            "Alignment mode when one part has multiple DXF variants and needs merge "
            "(default: insbase)."
        ),
    )
    parser.add_argument(
        "--variant-merge-unit-strategy",
        choices=("keep-values", "scale-values"),
        default="keep-values",
        help=(
            "Unit strategy for multi-DXF merge per part (default: keep-values)."
        ),
    )
    parser.add_argument(
        "--variant-force-suspicious-scaling",
        action="store_true",
        help=(
            "Forwarded to merge_part_of_sites_dxf.py when unit strategy is scale-values."
        ),
    )
    parser.add_argument(
        "--no-topology-clean",
        action="store_true",
        help=(
            "Skip post-conversion topology cleanup for per-part polygon geometry "
            "(enabled by default)."
        ),
    )
    parser.add_argument(
        "--topology-clean-grid",
        type=float,
        default=DEFAULT_TOPOLOGY_CLEAN_GRID,
        help=(
            "Precision grid size used during topology cleanup dissolve "
            f"(default: {DEFAULT_TOPOLOGY_CLEAN_GRID})."
        ),
    )
    parser.add_argument(
        "--topology-clean-min-area",
        type=float,
        default=DEFAULT_TOPOLOGY_CLEAN_MIN_AREA,
        help=(
            "Drop dissolved polygon parts smaller than this area in m^2 during topology "
            f"cleanup (default: {DEFAULT_TOPOLOGY_CLEAN_MIN_AREA})."
        ),
    )
    parser.add_argument(
        "--keep-non-polygon-features",
        action="store_true",
        help=(
            "Keep non-polygon features (e.g. LineString) in output GeoJSON. "
            "Default behavior strips them for frontend polygon-only consumption."
        ),
    )
    return parser.parse_args(argv)


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_group_label(folder_name: str) -> str:
    text = normalize_space(folder_name).upper()
    if not text:
        return "PART"
    match = re.match(r"^PART\s*(.*)$", text)
    suffix = normalize_space(match.group(1)) if match else text
    return f"PART {suffix}".strip()


def slugify_group(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    return slug or "part"


def normalize_part_id(name: str) -> str:
    text = normalize_space(name)
    if not text:
        return "UNKNOWN"
    compact = re.sub(r"\s+", "", text)
    match = re.match(r"^(\d+)([a-z])$", compact, flags=re.IGNORECASE)
    if match:
        return f"{match.group(1)}{match.group(2).upper()}"
    return compact.upper()


def normalize_part_base_name(name: str) -> str:
    text = normalize_space(name)
    if not text:
        return ""
    return re.sub(r"\(\s*\d+\s*\)$", "", text).strip()


def detect_contract_package_from_text(value: str) -> str:
    text = normalize_space(value).upper()
    if re.search(r"(^|[^A-Z0-9])C1([^A-Z0-9]|$)", text):
        return "C1"
    if re.search(r"(^|[^A-Z0-9])C2([^A-Z0-9]|$)", text):
        return "C2"
    return ""


def resolve_contract_package_from_sources(source_paths: Sequence[str]) -> str:
    for source_path in source_paths:
        detected = detect_contract_package_from_text(source_path)
        if detected:
            return detected
    return "C2"


def natural_key(value: str) -> Tuple[Tuple[int, object], ...]:
    parts = re.split(r"(\d+)", value)
    key: List[Tuple[int, object]] = []
    for part in parts:
        if part == "":
            continue
        if part.isdigit():
            key.append((0, int(part)))
        else:
            key.append((1, part.lower()))
    return tuple(key)


def should_include_group(group_label: str, group_slug: str, filters: set[str]) -> bool:
    if not filters:
        return True
    return group_label.lower() in filters or group_slug.lower() in filters


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def to_rel_path(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def enrich_geojson(
    output_geojson: Path,
    part_id: str,
    group_label: str,
    source_dxf_name: str,
    source_dxf_names: Optional[List[str]] = None,
    contract_package: Optional[str] = None,
) -> tuple[int, list[str]]:
    payload = json.loads(output_geojson.read_text(encoding="utf-8"))
    features = payload.get("features")
    if not isinstance(features, list):
        raise ValueError(f"Invalid GeoJSON (features must be list): {output_geojson}")

    geometry_types: set[str] = set()
    for feature in features:
        if not isinstance(feature, dict):
            continue
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            properties = {}
            feature["properties"] = properties
        properties["partId"] = part_id
        properties["partGroup"] = group_label
        properties["sourceDxf"] = source_dxf_name
        if contract_package:
            properties["contractPackage"] = contract_package
        if source_dxf_names and len(source_dxf_names) > 1:
            properties["sourceDxfs"] = source_dxf_names

        geometry = feature.get("geometry")
        if isinstance(geometry, dict):
            geom_type = geometry.get("type")
            if isinstance(geom_type, str) and geom_type:
                geometry_types.add(geom_type)

    output_geojson.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return len(features), sorted(geometry_types)


def summarize_geojson(output_geojson: Path) -> tuple[int, list[str]]:
    payload = json.loads(output_geojson.read_text(encoding="utf-8"))
    features = payload.get("features")
    if not isinstance(features, list):
        raise ValueError(f"Invalid GeoJSON (features must be list): {output_geojson}")

    geometry_types: set[str] = set()
    for feature in features:
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry")
        if isinstance(geometry, dict):
            geom_type = geometry.get("type")
            if isinstance(geom_type, str) and geom_type:
                geometry_types.add(geom_type)
    return len(features), sorted(geometry_types)


def strip_non_polygon_features(output_geojson: Path) -> Optional[dict]:
    payload = json.loads(output_geojson.read_text(encoding="utf-8"))
    features = payload.get("features")
    if not isinstance(features, list):
        raise ValueError(f"Invalid GeoJSON (features must be list): {output_geojson}")

    kept_features: list[dict] = []
    removed_count = 0
    removed_types: set[str] = set()
    geometry_types: set[str] = set()

    for feature in features:
        if not isinstance(feature, dict):
            removed_count += 1
            removed_types.add("<invalid>")
            continue

        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            removed_count += 1
            removed_types.add("<missing>")
            continue

        geom_type = geometry.get("type")
        if geom_type in ("Polygon", "MultiPolygon"):
            kept_features.append(feature)
            geometry_types.add(str(geom_type))
            continue

        removed_count += 1
        removed_types.add(str(geom_type) if geom_type else "<unknown>")

    if removed_count <= 0:
        return None

    payload["features"] = kept_features
    output_geojson.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return {
        "featureCount": len(kept_features),
        "geometryTypes": sorted(geometry_types),
        "removedCount": removed_count,
        "removedTypes": sorted(removed_types),
    }


def apply_group_non_polygon_filter(
    group_label: str,
    group_output_dir: Path,
    items: list[dict],
    keep_non_polygon_features: bool,
) -> list[str]:
    if keep_non_polygon_features:
        return []

    messages: list[str] = []
    item_by_id = {str(item.get("id", "")): item for item in items}
    for geojson_file in sorted(group_output_dir.glob("*.geojson"), key=lambda path: natural_key(path.stem)):
        part_id = geojson_file.stem
        filter_stats = strip_non_polygon_features(geojson_file)
        if filter_stats is None:
            continue

        item = item_by_id.get(part_id)
        if item is not None:
            item["featureCount"] = filter_stats["featureCount"]
            item["geometryTypes"] = filter_stats["geometryTypes"]

        removed_type_text = ",".join(filter_stats["removedTypes"]) if filter_stats["removedTypes"] else "<none>"
        messages.append(
            f"[{group_label}] {part_id} strip-non-polygon "
            f"removed={filter_stats['removedCount']} removed-types={removed_type_text} "
            f"remaining-features={filter_stats['featureCount']}"
        )

    return messages


def _link_or_copy(src: Path, dst: Path) -> None:
    try:
        os_link = getattr(Path, "hardlink_to", None)
        if os_link:
            dst.hardlink_to(src)
            return
    except Exception:
        pass
    shutil.copy2(src, dst)


def merge_part_variants_to_dxf(
    part_id: str,
    dxf_files: List[Path],
    align_mode: str,
    unit_strategy: str,
    force_suspicious_scaling: bool,
) -> tuple[Path, Path]:
    tmp_root = Path(tempfile.mkdtemp(prefix=f"part_{part_id}_merge_"))
    merge_input_dir = tmp_root / "input"
    merge_input_dir.mkdir(parents=True, exist_ok=True)
    merged_dxf = tmp_root / f"{part_id}.merged.dxf"

    for index, source in enumerate(dxf_files, start=1):
        staged_name = f"{index:03d}_{source.name}"
        _link_or_copy(source, merge_input_dir / staged_name)

    cmd = [
        sys.executable,
        str(MERGE_SCRIPT_PATH),
        "--input-dir",
        str(merge_input_dir),
        "--pattern",
        "*.dxf",
        "--output",
        str(merged_dxf),
        "--align-mode",
        align_mode,
        "--unit-strategy",
        unit_strategy,
    ]
    if force_suspicious_scaling:
        cmd.append("--force-suspicious-scaling")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        message = proc.stderr.strip() or proc.stdout.strip() or "unknown merge error"
        shutil.rmtree(tmp_root, ignore_errors=True)
        raise RuntimeError(f"Failed to merge DXF variants for {part_id}: {message}")

    return merged_dxf, tmp_root


def discover_part_dxf_map(group_dir: Path) -> Dict[str, List[Path]]:
    dxf_files = [path for path in group_dir.rglob("*.dxf") if path.is_file()]
    dxf_files.sort(key=lambda path: natural_key(path.as_posix()))

    by_part: Dict[str, List[Path]] = {}
    for dxf_file in dxf_files:
        stem_base = normalize_part_base_name(dxf_file.stem)
        part_id = normalize_part_id(stem_base or dxf_file.stem)
        lower_name = dxf_file.name.lower()
        if part_id.startswith("10B") and lower_name in PART10_10B_EXCLUDED_DXF_FILENAMES:
            continue
        by_part.setdefault(part_id, []).append(dxf_file)
    return by_part


def discover_group_dirs(input_root: Path) -> list[Path]:
    direct_group_dirs = [
        path
        for path in input_root.iterdir()
        if path.is_dir() and path.name.upper().startswith("PART")
    ]
    if direct_group_dirs:
        return sorted(
            direct_group_dirs,
            key=lambda path: natural_key(normalize_group_label(path.name)),
        )

    nested_group_dirs = [
        path
        for path in input_root.rglob("*")
        if path.is_dir() and path.name.upper().startswith("PART")
    ]
    return sorted(
        nested_group_dirs,
        key=lambda path: (
            natural_key(normalize_group_label(path.name)),
            natural_key(path.parent.as_posix()),
        ),
    )


def _close_linestring_to_polygon_geometry(
    geom_dict: dict,
    close_tolerance: float,
) -> tuple[Optional[dict], float]:
    from shapely.geometry import LineString, Polygon, mapping, shape
    from shapely.validation import make_valid

    geom = shape(geom_dict)
    if not isinstance(geom, LineString):
        return None, 0.0

    coords = list(geom.coords)
    if len(coords) < 3:
        return None, 0.0

    start = coords[0]
    end = coords[-1]
    gap = math.hypot(start[0] - end[0], start[1] - end[1])
    if gap > close_tolerance:
        return None, gap

    ring = [(point[0], point[1]) for point in coords]
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    if len(set(ring)) < 4:
        return None, gap

    polygon = make_valid(Polygon(ring))
    if polygon.is_empty or polygon.area <= 0:
        return None, gap
    if polygon.geom_type not in ("Polygon", "MultiPolygon"):
        return None, gap

    return mapping(polygon), gap


def _collect_polygons(
    features: List[dict],
) -> list[tuple[int, object, float]]:
    from shapely.geometry import shape
    from shapely.validation import make_valid

    polygons: list[tuple[int, object, float]] = []
    for index, feature in enumerate(features):
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            continue
        if geometry.get("type") not in ("Polygon", "MultiPolygon"):
            continue
        geom = make_valid(shape(geometry))
        if geom.is_empty or geom.area <= PART10_MIN_AREA:
            continue
        if geom.geom_type not in ("Polygon", "MultiPolygon"):
            continue
        polygons.append((index, geom, float(geom.area)))
    return polygons


def apply_part10_overlap_fix(group_label: str, group_output_dir: Path) -> Optional[str]:
    if group_label != "PART 10":
        return None

    part_10a_file = group_output_dir / "10A.geojson"
    part_10b_file = group_output_dir / "10B.geojson"
    if not part_10a_file.exists() or not part_10b_file.exists():
        return None

    payload_10a = json.loads(part_10a_file.read_text(encoding="utf-8"))
    payload_10b = json.loads(part_10b_file.read_text(encoding="utf-8"))
    features_10a = payload_10a.get("features")
    features_10b = payload_10b.get("features")
    if not isinstance(features_10a, list) or not isinstance(features_10b, list):
        return None

    polygons_10a = _collect_polygons(features_10a)
    if not polygons_10a:
        return None

    from shapely.geometry import shape
    from shapely.validation import make_valid

    candidates_10b: list[dict] = []
    for feature_index, feature in enumerate(features_10b):
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            continue

        geom_type = geometry.get("type")
        if geom_type in ("Polygon", "MultiPolygon"):
            geom = make_valid(shape(geometry))
            if (
                not geom.is_empty
                and geom.area > PART10_MIN_AREA
                and geom.geom_type in ("Polygon", "MultiPolygon")
            ):
                candidates_10b.append(
                    {
                        "index": feature_index,
                        "geom": geom,
                        "area": float(geom.area),
                        "promote_geometry": None,
                    }
                )
            continue

        if geom_type == "LineString":
            promoted_geometry, gap = _close_linestring_to_polygon_geometry(
                geometry,
                close_tolerance=PART10_LINE_CLOSE_TOLERANCE,
            )
            if promoted_geometry is None:
                continue
            promoted_geom = make_valid(shape(promoted_geometry))
            if (
                promoted_geom.is_empty
                or promoted_geom.area <= PART10_MIN_AREA
                or promoted_geom.geom_type not in ("Polygon", "MultiPolygon")
            ):
                continue
            candidates_10b.append(
                {
                    "index": feature_index,
                    "geom": promoted_geom,
                    "area": float(promoted_geom.area),
                    "promote_geometry": promoted_geometry,
                    "gap": round(gap, 6),
                }
            )

    if not candidates_10b:
        return None

    overlap_pairs: list[dict] = []
    for a_index, a_geom, a_area in polygons_10a:
        for b_candidate in candidates_10b:
            b_geom = b_candidate["geom"]
            inter_area = a_geom.intersection(b_geom).area
            if inter_area <= 0:
                continue
            ratio_a = inter_area / a_area
            ratio_b = inter_area / b_candidate["area"]
            if (
                ratio_a < PART10_DUPLICATE_OVERLAP_THRESHOLD
                or ratio_b < PART10_DUPLICATE_OVERLAP_THRESHOLD
            ):
                continue
            union_area = a_geom.union(b_geom).area
            iou = inter_area / union_area if union_area > 0 else 0.0
            overlap_pairs.append(
                {
                    "a_index": a_index,
                    "b_index": b_candidate["index"],
                    "inter_area": inter_area,
                    "ratio_a": ratio_a,
                    "ratio_b": ratio_b,
                    "iou": iou,
                    "promote_geometry": b_candidate["promote_geometry"],
                    "gap": b_candidate.get("gap"),
                }
            )

    if not overlap_pairs:
        return None

    overlap_pairs.sort(
        key=lambda item: (
            item["iou"],
            min(item["ratio_a"], item["ratio_b"]),
            item["inter_area"],
        ),
        reverse=True,
    )

    chosen_pairs: list[dict] = []
    used_a: set[int] = set()
    used_b: set[int] = set()
    for pair in overlap_pairs:
        if pair["a_index"] in used_a or pair["b_index"] in used_b:
            continue
        chosen_pairs.append(pair)
        used_a.add(pair["a_index"])
        used_b.add(pair["b_index"])

    if not chosen_pairs:
        return None

    removed_10a_indices = {pair["a_index"] for pair in chosen_pairs}
    promoted_10b_count = 0
    for pair in chosen_pairs:
        promote_geometry = pair.get("promote_geometry")
        if promote_geometry is None:
            continue
        feature = features_10b[pair["b_index"]]
        feature["geometry"] = promote_geometry
        promoted_10b_count += 1

    payload_10a["features"] = [
        feature
        for index, feature in enumerate(features_10a)
        if index not in removed_10a_indices
    ]

    part_10a_file.write_text(json.dumps(payload_10a, ensure_ascii=False), encoding="utf-8")
    part_10b_file.write_text(json.dumps(payload_10b, ensure_ascii=False), encoding="utf-8")

    gaps = [pair["gap"] for pair in chosen_pairs if pair.get("gap") is not None]
    if gaps:
        return (
            f"[PART 10] overlap-fix removed 10A={len(removed_10a_indices)} "
            f"promoted-10B-lines={promoted_10b_count} "
            f"match-gap-max={max(gaps):.3f} match-gap-min={min(gaps):.3f}"
        )
    return (
        f"[PART 10] overlap-fix removed 10A={len(removed_10a_indices)} "
        f"promoted-10B-lines={promoted_10b_count}"
    )


def _extract_polygon_parts(geom: object) -> list[object]:
    geom_type = getattr(geom, "geom_type", "")
    if geom_type == "Polygon":
        return [geom]
    if geom_type == "MultiPolygon":
        return [part for part in getattr(geom, "geoms", []) if not part.is_empty]
    if geom_type == "GeometryCollection":
        parts: list[object] = []
        for sub_geom in getattr(geom, "geoms", []):
            parts.extend(_extract_polygon_parts(sub_geom))
        return parts
    return []


def apply_part10_10b_void_cutout(
    group_label: str,
    group_dir: Path,
    group_output_dir: Path,
    source_crs: Optional[str],
    target_crs: Optional[str],
    flatten_distance: float,
    include_inserts: bool,
    snap: float,
    close_tolerance: float,
    snap_tolerance: float,
    bridge_tolerance: float,
) -> Optional[str]:
    if group_label != "PART 10":
        return None

    part_10b_geojson = group_output_dir / "10B.geojson"
    part_10b_dxf_dir = group_dir / "10B"
    if not part_10b_geojson.exists() or not part_10b_dxf_dir.exists():
        return None

    void_dxf_paths = sorted(
        path
        for path in part_10b_dxf_dir.glob("*.dxf")
        if path.name.lower() in PART10_10B_VOID_DXF_FILENAMES
    )
    if not void_dxf_paths:
        return None

    from shapely.geometry import mapping, shape
    from shapely.ops import unary_union
    from shapely.validation import make_valid

    void_polygon_parts: list[object] = []
    with tempfile.TemporaryDirectory(prefix="part10_10b_void_") as tmp_dir:
        tmp_root = Path(tmp_dir)
        for index, void_dxf in enumerate(void_dxf_paths, start=1):
            tmp_geojson = tmp_root / f"void_{index}.geojson"
            convert(
                input_path=str(void_dxf),
                output_path=str(tmp_geojson),
                source_crs=source_crs,
                target_crs=target_crs,
                layers=None,
                flatten_distance=flatten_distance,
                include_inserts=include_inserts,
                # Dedicated hole DXFs are often linework; polygonize to get cutout faces.
                polygonize=True,
                keep_lines=False,
                snap=snap,
                close_tolerance=close_tolerance,
                snap_tolerance=snap_tolerance,
                bridge_tolerance=bridge_tolerance,
            )
            payload = json.loads(tmp_geojson.read_text(encoding="utf-8"))
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
                parts = [part for part in _extract_polygon_parts(geom) if part.area > 0]
                void_polygon_parts.extend(parts)

    if not void_polygon_parts:
        return None

    void_union = make_valid(unary_union(void_polygon_parts))
    if void_union.is_empty:
        return None

    payload = json.loads(part_10b_geojson.read_text(encoding="utf-8"))
    features = payload.get("features")
    if not isinstance(features, list):
        return None

    new_features: list[dict] = []
    touched_features = 0
    removed_area_total = 0.0

    for feature in features:
        if not isinstance(feature, dict):
            continue

        geometry = feature.get("geometry")
        if not isinstance(geometry, dict) or geometry.get("type") not in ("Polygon", "MultiPolygon"):
            new_features.append(feature)
            continue

        polygon_geom = make_valid(shape(geometry))
        polygon_parts = [part for part in _extract_polygon_parts(polygon_geom) if part.area > 0]
        if not polygon_parts:
            continue

        original = polygon_parts[0] if len(polygon_parts) == 1 else unary_union(polygon_parts)
        clipped = make_valid(original.difference(void_union))
        clipped_parts = [part for part in _extract_polygon_parts(clipped) if part.area > 0]
        removed_area = float(original.area)

        if clipped_parts:
            clipped_geom = clipped_parts[0] if len(clipped_parts) == 1 else unary_union(clipped_parts)
            removed_area -= float(clipped_geom.area)
            feature_copy = dict(feature)
            feature_copy["geometry"] = mapping(clipped_geom)
            new_features.append(feature_copy)
        else:
            clipped_geom = None

        if removed_area > 1e-6:
            touched_features += 1
            removed_area_total += removed_area

    if touched_features == 0:
        return None

    payload["features"] = new_features
    part_10b_geojson.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    return (
        f"[PART 10] 10B void-cutout files={len(void_dxf_paths)} "
        f"touched={touched_features} removed-area={removed_area_total:.3f}"
    )


def apply_part10_10b_line_void_cutout(
    group_label: str,
    group_output_dir: Path,
) -> Optional[str]:
    if group_label != "PART 10":
        return None

    part_10b_geojson = group_output_dir / "10B.geojson"
    if not part_10b_geojson.exists():
        return None

    from shapely.geometry import mapping, shape
    from shapely.ops import polygonize, unary_union
    from shapely.validation import make_valid

    payload = json.loads(part_10b_geojson.read_text(encoding="utf-8"))
    features = payload.get("features")
    if not isinstance(features, list):
        return None

    line_geoms: list[object] = []
    polygon_geoms: list[object] = []
    for feature in features:
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            continue
        geom_type = geometry.get("type")
        geom = make_valid(shape(geometry))
        if geom.is_empty:
            continue
        if geom_type in ("LineString", "MultiLineString"):
            if geom.geom_type == "LineString":
                line_geoms.append(geom)
            elif geom.geom_type == "MultiLineString":
                line_geoms.extend([sub for sub in geom.geoms if not sub.is_empty])
        elif geom_type in ("Polygon", "MultiPolygon"):
            parts = [part for part in _extract_polygon_parts(geom) if part.area > 0]
            polygon_geoms.extend(parts)

    if not line_geoms or not polygon_geoms:
        return None

    polygon_union = make_valid(unary_union(polygon_geoms))
    if polygon_union.is_empty:
        return None

    candidate_voids: list[object] = []
    for face in polygonize(line_geoms):
        if face.is_empty or face.area < PART10_10B_LINE_VOID_MIN_AREA:
            continue
        inside_ratio = face.intersection(polygon_union).area / float(face.area)
        if inside_ratio < 0.98:
            continue
        candidate_voids.append(face)

    if not candidate_voids:
        return None

    void_union = make_valid(unary_union(candidate_voids))
    if void_union.is_empty:
        return None

    new_features: list[dict] = []
    touched_features = 0
    removed_area_total = 0.0
    for feature in features:
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict) or geometry.get("type") not in ("Polygon", "MultiPolygon"):
            new_features.append(feature)
            continue

        original_geom = make_valid(shape(geometry))
        original_parts = [part for part in _extract_polygon_parts(original_geom) if part.area > 0]
        if not original_parts:
            continue
        original = original_parts[0] if len(original_parts) == 1 else unary_union(original_parts)

        clipped = make_valid(original.difference(void_union))
        clipped_parts = [part for part in _extract_polygon_parts(clipped) if part.area > 0]
        removed_area = float(original.area)
        if clipped_parts:
            clipped_geom = clipped_parts[0] if len(clipped_parts) == 1 else unary_union(clipped_parts)
            removed_area -= float(clipped_geom.area)
            feature_copy = dict(feature)
            feature_copy["geometry"] = mapping(clipped_geom)
            new_features.append(feature_copy)

        if removed_area > 1e-6:
            touched_features += 1
            removed_area_total += removed_area

    if touched_features == 0:
        return None

    payload["features"] = new_features
    part_10b_geojson.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return (
        f"[PART 10] 10B line-void-cutout faces={len(candidate_voids)} "
        f"touched={touched_features} removed-area={removed_area_total:.3f}"
    )


def _clean_polygonal_geometry(geometry: dict, precision_grid: float) -> Optional[object]:
    from shapely import set_precision
    from shapely.geometry import shape
    from shapely.ops import unary_union
    from shapely.validation import make_valid

    geom = make_valid(shape(geometry))
    if geom.is_empty:
        return None

    if precision_grid > 0:
        geom = set_precision(geom, precision_grid)
        geom = make_valid(geom)

    parts = [part for part in _extract_polygon_parts(geom) if part.area > 0]
    if not parts:
        return None

    merged = unary_union(parts)
    merged = make_valid(merged)
    if precision_grid > 0:
        merged = set_precision(merged, precision_grid)
        merged = make_valid(merged)

    merged_parts = [part for part in _extract_polygon_parts(merged) if part.area > 0]
    if not merged_parts:
        return None
    if len(merged_parts) == 1:
        return merged_parts[0]
    return unary_union(merged_parts)


def clean_part_geojson_topology(
    output_geojson: Path,
    precision_grid: float,
    min_area: float,
) -> Optional[dict]:
    from shapely import set_precision
    from shapely.geometry import mapping
    from shapely.ops import unary_union
    from shapely.validation import make_valid

    payload = json.loads(output_geojson.read_text(encoding="utf-8"))
    features = payload.get("features")
    if not isinstance(features, list):
        return None

    non_polygon_features: list[dict] = []
    polygon_parts: list[object] = []
    template_properties: Optional[dict] = None
    raw_area = 0.0
    polygon_feature_count_before = 0
    dropped_parts = 0

    for feature in features:
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            non_polygon_features.append(feature)
            continue
        if geometry.get("type") not in ("Polygon", "MultiPolygon"):
            non_polygon_features.append(feature)
            continue

        polygon_feature_count_before += 1
        cleaned_geom = _clean_polygonal_geometry(geometry, precision_grid=precision_grid)
        if cleaned_geom is None:
            dropped_parts += 1
            continue

        parts = [part for part in _extract_polygon_parts(cleaned_geom) if part.area > 0]
        if not parts:
            dropped_parts += 1
            continue

        raw_area += sum(float(part.area) for part in parts)
        kept_any = False
        for part in parts:
            if part.area < min_area:
                dropped_parts += 1
                continue
            polygon_parts.append(part)
            kept_any = True

        if kept_any and template_properties is None:
            properties = feature.get("properties")
            template_properties = dict(properties) if isinstance(properties, dict) else {}

    if not polygon_parts:
        return None

    dissolved = unary_union(polygon_parts)
    dissolved = make_valid(dissolved)
    if precision_grid > 0:
        dissolved = set_precision(dissolved, precision_grid)
        dissolved = make_valid(dissolved)

    dissolved_parts = [part for part in _extract_polygon_parts(dissolved) if part.area >= min_area]
    if not dissolved_parts:
        return None

    if len(dissolved_parts) == 1:
        dissolved_geometry = dissolved_parts[0]
    else:
        dissolved_geometry = unary_union(dissolved_parts)

    dissolved_area = float(dissolved_geometry.area)
    polygon_feature = {
        "type": "Feature",
        "properties": template_properties or {},
        "geometry": mapping(dissolved_geometry),
    }

    payload["features"] = [*non_polygon_features, polygon_feature]
    output_geojson.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    return {
        "polygonFeatureCountBefore": polygon_feature_count_before,
        "polygonFeatureCountAfter": 1,
        "droppedParts": dropped_parts,
        "rawArea": raw_area,
        "dissolvedArea": dissolved_area,
    }


def apply_group_topology_cleanup(
    group_label: str,
    group_output_dir: Path,
    items: list[dict],
    precision_grid: float,
    min_area: float,
) -> list[str]:
    messages: list[str] = []
    item_by_id = {str(item.get("id", "")): item for item in items}

    for geojson_file in sorted(group_output_dir.glob("*.geojson"), key=lambda path: natural_key(path.stem)):
        part_id = geojson_file.stem
        cleanup_stats = clean_part_geojson_topology(
            output_geojson=geojson_file,
            precision_grid=precision_grid,
            min_area=min_area,
        )
        if cleanup_stats is None:
            continue

        feature_count, geometry_types = summarize_geojson(geojson_file)
        item = item_by_id.get(part_id)
        if item is not None:
            item["featureCount"] = feature_count
            item["geometryTypes"] = geometry_types

        area_delta = cleanup_stats["rawArea"] - cleanup_stats["dissolvedArea"]
        changed = (
            cleanup_stats["polygonFeatureCountBefore"] != cleanup_stats["polygonFeatureCountAfter"]
            or cleanup_stats["droppedParts"] > 0
            or abs(area_delta) > 1e-5
        )
        if not changed:
            continue

        messages.append(
            f"[{group_label}] {part_id} topology-clean "
            f"poly-features={cleanup_stats['polygonFeatureCountBefore']}->"
            f"{cleanup_stats['polygonFeatureCountAfter']} "
            f"dropped-parts={cleanup_stats['droppedParts']} "
            f"area-delta={area_delta:.6f}"
        )

    return messages


def convert_group(
    group_dir: Path,
    output_root: Path,
    workspace_root: Path,
    source_crs: Optional[str],
    target_crs: Optional[str],
    flatten_distance: float,
    include_inserts: bool,
    polygonize: bool,
    keep_lines: bool,
    snap: float,
    close_tolerance: float,
    snap_tolerance: float,
    bridge_tolerance: float,
    variant_merge_align_mode: str,
    variant_merge_unit_strategy: str,
    variant_force_suspicious_scaling: bool,
    enable_topology_clean: bool,
    topology_clean_grid: float,
    topology_clean_min_area: float,
    keep_non_polygon_features: bool,
) -> tuple[str, str, list[dict]]:
    group_label = normalize_group_label(group_dir.name)
    group_slug = slugify_group(group_label)
    group_output_dir = output_root / group_slug
    group_output_dir.mkdir(parents=True, exist_ok=True)

    by_part = discover_part_dxf_map(group_dir)
    part_ids = sorted(by_part.keys(), key=natural_key)

    items: list[dict] = []
    for part_id in part_ids:
        variant_files = sorted(
            by_part[part_id],
            key=lambda path: natural_key(to_rel_path(path, group_dir)),
        )
        temp_cleanup_dir: Optional[Path] = None
        if len(variant_files) == 1:
            conversion_input = variant_files[0]
            source_dxf_name = variant_files[0].name
        else:
            conversion_input, temp_cleanup_dir = merge_part_variants_to_dxf(
                part_id=part_id,
                dxf_files=variant_files,
                align_mode=variant_merge_align_mode,
                unit_strategy=variant_merge_unit_strategy,
                force_suspicious_scaling=variant_force_suspicious_scaling,
            )
            source_dxf_name = f"{part_id}(merged).dxf"

        output_file = group_output_dir / f"{part_id}.geojson"
        try:
            convert(
                input_path=str(conversion_input),
                output_path=str(output_file),
                source_crs=source_crs,
                target_crs=target_crs,
                layers=None,
                flatten_distance=flatten_distance,
                include_inserts=include_inserts,
                polygonize=polygonize,
                keep_lines=keep_lines,
                snap=snap,
                close_tolerance=close_tolerance,
                snap_tolerance=snap_tolerance,
                bridge_tolerance=bridge_tolerance,
            )
        finally:
            if temp_cleanup_dir:
                shutil.rmtree(temp_cleanup_dir, ignore_errors=True)
        source_paths = [to_rel_path(path, workspace_root) for path in variant_files]
        contract_package = resolve_contract_package_from_sources(source_paths)
        feature_count, geometry_types = enrich_geojson(
            output_geojson=output_file,
            part_id=part_id,
            group_label=group_label,
            source_dxf_name=source_dxf_name,
            source_dxf_names=[path.name for path in variant_files],
            contract_package=contract_package,
        )

        web_path = f"/data/geojson/part-of-sites/{group_slug}/{part_id}.geojson"
        item = {
            "id": part_id,
            "file": web_path,
            "featureCount": feature_count,
            "geometryTypes": geometry_types,
            "contractPackage": contract_package,
            "sourceDxf": source_paths[0],
        }
        if len(source_paths) > 1:
            item["sourceDxfs"] = source_paths
            item["mergedFromCount"] = len(source_paths)
        items.append(item)
        geometry_text = ",".join(geometry_types) if geometry_types else "<none>"
        merge_note = (
            f" merged={len(source_paths)} align={variant_merge_align_mode} unit={variant_merge_unit_strategy}"
            if len(source_paths) > 1
            else ""
        )
        print(
            f"[{group_label}] {part_id} -> {web_path} "
            f"features={feature_count} types={geometry_text}{merge_note}"
        )

    postprocess_message = apply_part10_overlap_fix(
        group_label=group_label,
        group_output_dir=group_output_dir,
    )
    if postprocess_message:
        print(postprocess_message)
        for item in items:
            part_id = item.get("id")
            if part_id not in {"10A", "10B"}:
                continue
            part_geojson = group_output_dir / f"{part_id}.geojson"
            feature_count, geometry_types = summarize_geojson(part_geojson)
            item["featureCount"] = feature_count
            item["geometryTypes"] = geometry_types

    if enable_topology_clean:
        topology_messages = apply_group_topology_cleanup(
            group_label=group_label,
            group_output_dir=group_output_dir,
            items=items,
            precision_grid=topology_clean_grid,
            min_area=topology_clean_min_area,
        )
        for message in topology_messages:
            print(message)

    void_cutout_message = apply_part10_10b_void_cutout(
        group_label=group_label,
        group_dir=group_dir,
        group_output_dir=group_output_dir,
        source_crs=source_crs,
        target_crs=target_crs,
        flatten_distance=flatten_distance,
        include_inserts=include_inserts,
        snap=snap,
        close_tolerance=close_tolerance,
        snap_tolerance=snap_tolerance,
        bridge_tolerance=bridge_tolerance,
    )
    if void_cutout_message:
        print(void_cutout_message)
        for item in items:
            if item.get("id") != "10B":
                continue
            part_geojson = group_output_dir / "10B.geojson"
            feature_count, geometry_types = summarize_geojson(part_geojson)
            item["featureCount"] = feature_count
            item["geometryTypes"] = geometry_types

    if PART10_ENABLE_LINE_VOID_CUTOUT:
        line_void_cutout_message = apply_part10_10b_line_void_cutout(
            group_label=group_label,
            group_output_dir=group_output_dir,
        )
        if line_void_cutout_message:
            print(line_void_cutout_message)
            for item in items:
                if item.get("id") != "10B":
                    continue
                part_geojson = group_output_dir / "10B.geojson"
                feature_count, geometry_types = summarize_geojson(part_geojson)
                item["featureCount"] = feature_count
                item["geometryTypes"] = geometry_types

    non_polygon_filter_messages = apply_group_non_polygon_filter(
        group_label=group_label,
        group_output_dir=group_output_dir,
        items=items,
        keep_non_polygon_features=keep_non_polygon_features,
    )
    for message in non_polygon_filter_messages:
        print(message)

    return group_label, group_slug, items


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    input_root = Path(args.input_root).resolve()
    output_root = Path(args.output_root).resolve()

    if not input_root.exists() or not input_root.is_dir():
        print(f"[ERROR] input-root not found: {input_root}", file=sys.stderr)
        return 2

    group_filters = {
        normalize_space(item).lower()
        for item in args.groups.split(",")
        if normalize_space(item)
    }

    if args.no_transform:
        source_crs = None
        target_crs = None
        index_crs = DEFAULT_CRS
    else:
        source_crs = args.source_crs
        target_crs = args.target_crs
        index_crs = args.target_crs

    group_dirs = discover_group_dirs(input_root)

    if not group_dirs:
        print(f"[ERROR] no PART folders found under: {input_root}", file=sys.stderr)
        return 2

    generated_at = date.today().isoformat()
    groups_meta: list[dict] = []
    total_files = 0
    total_features = 0

    for group_dir in group_dirs:
        group_label = normalize_group_label(group_dir.name)
        group_slug = slugify_group(group_label)
        if not should_include_group(group_label, group_slug, group_filters):
            continue

        label, slug, items = convert_group(
            group_dir=group_dir,
            output_root=output_root,
            workspace_root=Path.cwd().resolve(),
            source_crs=source_crs,
            target_crs=target_crs,
            flatten_distance=args.flatten,
            include_inserts=not args.no_inserts,
            polygonize=args.polygonize,
            keep_lines=args.keep_lines,
            snap=args.snap,
            close_tolerance=args.close_tolerance,
            snap_tolerance=args.snap_tolerance,
            bridge_tolerance=args.bridge_tolerance,
            variant_merge_align_mode=args.variant_merge_align_mode,
            variant_merge_unit_strategy=args.variant_merge_unit_strategy,
            variant_force_suspicious_scaling=args.variant_force_suspicious_scaling,
            enable_topology_clean=not args.no_topology_clean,
            topology_clean_grid=args.topology_clean_grid,
            topology_clean_min_area=args.topology_clean_min_area,
            keep_non_polygon_features=args.keep_non_polygon_features,
        )

        group_index = {
            "dataset": DEFAULT_DATASET,
            "group": label,
            "crs": index_crs,
            "generatedAt": generated_at,
            "items": items,
        }
        write_json(output_root / slug / "index.json", group_index)
        groups_meta.append(
            {
                "id": label,
                "slug": slug,
                "index": f"/data/geojson/part-of-sites/{slug}/index.json",
                "itemCount": len(items),
            }
        )
        total_files += len(items)
        total_features += sum(item["featureCount"] for item in items)

    if not groups_meta:
        print(
            "[ERROR] no groups matched --groups filter; nothing generated.",
            file=sys.stderr,
        )
        return 2

    root_index = {
        "dataset": DEFAULT_DATASET,
        "crs": index_crs,
        "generatedAt": generated_at,
        "groups": groups_meta,
    }
    write_json(output_root / "index.json", root_index)

    print(f"[DONE] groups={len(groups_meta)} files={total_files} features={total_features}")
    print(f"[DONE] output-root={output_root}")
    print(f"[DONE] crs={index_crs} (conversion source={source_crs} target={target_crs})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
