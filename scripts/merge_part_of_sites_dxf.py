#!/usr/bin/env python3
"""
Merge multiple DXF files into a single DXF for manual CAD cleanup.

Default behavior is tailored for this repository:
- Input folder: dxf_drawings/Processed Part of sites
- Input pattern: *.dxf
- Output file: dxf_drawings/Processed Part of sites/merged_part_of_sites.dxf

Key options:
- Coordinate alignment: world / insbase
- Unit handling: keep-values / scale-values
- Guardrail: suspicious unit labels are auto-detected for scale-values mode

Examples:
  python3 scripts/merge_part_of_sites_dxf.py

  python3 scripts/merge_part_of_sites_dxf.py \
    --input-dir "dxf_drawings/Processed Part of sites" \
    --output "dxf_drawings/Processed Part of sites/merged_part_of_sites.dxf" \
    --align-mode insbase \
    --unit-strategy keep-values

  # Override suspicious-unit guard (not recommended)
  python3 scripts/merge_part_of_sites_dxf.py \
    --unit-strategy scale-values \
    --force-suspicious-scaling
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path
from typing import Iterable

import ezdxf
import ezdxf.transform as dxf_transform
from ezdxf import units
from ezdxf.addons.importer import Importer
from ezdxf.bbox import extents as calc_extents
from ezdxf.math import Matrix44, Vec3


UNIT_ALIASES = {
    "unitless": int(units.InsertUnits.Unitless),
    "none": int(units.InsertUnits.Unitless),
    "inch": int(units.InsertUnits.Inches),
    "inches": int(units.InsertUnits.Inches),
    "in": int(units.InsertUnits.Inches),
    "foot": int(units.InsertUnits.Feet),
    "feet": int(units.InsertUnits.Feet),
    "ft": int(units.InsertUnits.Feet),
    "mile": int(units.InsertUnits.Miles),
    "miles": int(units.InsertUnits.Miles),
    "mm": int(units.InsertUnits.Millimeters),
    "millimeter": int(units.InsertUnits.Millimeters),
    "millimeters": int(units.InsertUnits.Millimeters),
    "cm": int(units.InsertUnits.Centimeters),
    "centimeter": int(units.InsertUnits.Centimeters),
    "centimeters": int(units.InsertUnits.Centimeters),
    "m": int(units.InsertUnits.Meters),
    "meter": int(units.InsertUnits.Meters),
    "meters": int(units.InsertUnits.Meters),
    "km": int(units.InsertUnits.Kilometers),
    "kilometer": int(units.InsertUnits.Kilometers),
    "kilometers": int(units.InsertUnits.Kilometers),
    "yard": int(units.InsertUnits.Yards),
    "yards": int(units.InsertUnits.Yards),
}


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Merge DXF files into one DXF.")
    parser.add_argument(
        "--input-dir",
        default="dxf_drawings/Processed Part of sites",
        help="Folder that contains DXF files.",
    )
    parser.add_argument(
        "--pattern",
        default="*.dxf",
        help="Glob pattern for DXF files in input-dir (default: *.dxf).",
    )
    parser.add_argument(
        "--output",
        default="dxf_drawings/Processed Part of sites/merged_part_of_sites.dxf",
        help="Output merged DXF path.",
    )
    parser.add_argument(
        "--target-version",
        default="from-first",
        help="Target DXF version (e.g. R2018) or from-first.",
    )
    parser.add_argument(
        "--target-units",
        default="from-first",
        help="Target unit name (mm/cm/m/in/ft/...) or from-first.",
    )
    parser.add_argument(
        "--align-mode",
        choices=("world", "insbase"),
        default="insbase",
        help="world: keep source coordinates; insbase: align all source INSBASE to the first file.",
    )
    parser.add_argument(
        "--unit-strategy",
        choices=("keep-values", "scale-values"),
        default="keep-values",
        help="keep-values: keep numeric coordinates, only set unit metadata; "
        "scale-values: scale coordinates by source->target unit factor.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print per-file details.",
    )
    parser.add_argument(
        "--force-suspicious-scaling",
        action="store_true",
        help="Allow scale-values even when suspicious unit labels are detected.",
    )
    return parser.parse_args(argv)


def as_vec3(value) -> Vec3:
    if isinstance(value, Vec3):
        return value
    if isinstance(value, (tuple, list)) and len(value) >= 3:
        return Vec3(float(value[0]), float(value[1]), float(value[2]))
    return Vec3(0.0, 0.0, 0.0)


def unit_from_arg(value: str, fallback: int) -> int:
    text = str(value or "").strip().lower()
    if text in {"", "from-first", "first", "auto"}:
        return int(fallback)
    if text.isdigit():
        return int(text)
    if text in UNIT_ALIASES:
        return UNIT_ALIASES[text]
    valid = ", ".join(sorted({"from-first", *UNIT_ALIASES.keys()}))
    raise ValueError(f"Unsupported target units '{value}'. Valid: {valid}")


def unit_scale(source_units: int, target_units: int, strategy: str) -> float:
    if strategy == "keep-values":
        return 1.0
    if source_units in (0, None) or target_units in (0, None):
        return 1.0
    if int(source_units) == int(target_units):
        return 1.0
    return float(units.conversion_factor(int(source_units), int(target_units)))


def resolve_target_version(value: str, fallback_dxfversion: str) -> str:
    text = str(value or "").strip()
    if not text or text.lower() in {"from-first", "first", "auto"}:
        return fallback_dxfversion
    return text


def _bbox_xy(layout):
    bbox = calc_extents(layout)
    if not bbox.has_data:
        return None
    return (bbox.extmin.x, bbox.extmin.y, bbox.extmax.x, bbox.extmax.y)


def _bbox_center_xy(box):
    min_x, min_y, max_x, max_y = box
    return ((min_x + max_x) * 0.5, (min_y + max_y) * 0.5)


def _bbox_diag(box):
    min_x, min_y, max_x, max_y = box
    return math.hypot(max_x - min_x, max_y - min_y)


def _detect_suspicious_scaling(source_files, target_units, unit_strategy):
    if unit_strategy != "scale-values":
        return []

    ref_doc = ezdxf.readfile(source_files[0])
    ref_box = _bbox_xy(ref_doc.modelspace())
    if ref_box is None:
        return []

    ref_center = _bbox_center_xy(ref_box)
    ref_diag = max(_bbox_diag(ref_box), 1.0)
    near_threshold = max(ref_diag * 20.0, 1000.0)
    far_threshold = max(ref_diag * 50.0, 5000.0)

    findings = []
    for path in source_files:
        doc = ezdxf.readfile(path)
        source_units = int(doc.units or 0)
        scale = unit_scale(source_units, target_units, unit_strategy)
        if abs(scale - 1.0) <= 1e-12:
            continue
        box = _bbox_xy(doc.modelspace())
        if box is None:
            continue
        raw_center = _bbox_center_xy(box)
        scaled_center = (raw_center[0] * scale, raw_center[1] * scale)
        raw_dist = math.hypot(raw_center[0] - ref_center[0], raw_center[1] - ref_center[1])
        scaled_dist = math.hypot(
            scaled_center[0] - ref_center[0], scaled_center[1] - ref_center[1]
        )

        # Suspicious pattern:
        # 1) raw coordinates are already near reference project neighborhood
        # 2) applying unit scale throws geometry far away
        if raw_dist <= near_threshold and scaled_dist >= max(raw_dist * 50.0, far_threshold):
            findings.append(
                {
                    "path": path,
                    "source_units": source_units,
                    "target_units": target_units,
                    "scale": scale,
                    "raw_dist": raw_dist,
                    "scaled_dist": scaled_dist,
                }
            )
    return findings


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_args(argv)
    input_dir = Path(args.input_dir).resolve()
    output_path = Path(args.output).resolve()

    if not input_dir.exists() or not input_dir.is_dir():
        print(f"[ERROR] input-dir not found: {input_dir}", file=sys.stderr)
        return 2

    source_files = sorted(
        p for p in input_dir.glob(args.pattern) if p.is_file() and p.resolve() != output_path
    )
    if not source_files:
        print(
            f"[ERROR] no DXF files found in {input_dir} with pattern '{args.pattern}'",
            file=sys.stderr,
        )
        return 2

    first_doc = ezdxf.readfile(source_files[0])
    first_units = int(first_doc.units or 0)
    first_insbase = as_vec3(first_doc.header.get("$INSBASE", (0.0, 0.0, 0.0)))
    target_units = unit_from_arg(args.target_units, first_units)
    target_version = resolve_target_version(args.target_version, first_doc.dxfversion)

    suspicious = _detect_suspicious_scaling(
        source_files=source_files,
        target_units=target_units,
        unit_strategy=args.unit_strategy,
    )
    if suspicious and not args.force_suspicious_scaling:
        print(
            "[ERROR] Suspicious unit labels detected. Refusing to run scale-values.",
            file=sys.stderr,
        )
        for item in suspicious:
            print(
                "  - "
                f"{item['path'].name}: "
                f"src_units={item['source_units']}({units.unit_name(item['source_units'])}) -> "
                f"target={item['target_units']}({units.unit_name(item['target_units'])}), "
                f"scale={item['scale']:g}, "
                f"raw_dist={item['raw_dist']:.3f}, scaled_dist={item['scaled_dist']:.3f}",
                file=sys.stderr,
            )
        print(
            "Hint: coordinates appear aligned before scaling. "
            "Use --unit-strategy keep-values, or verify source unit tags. "
            "If you must proceed, add --force-suspicious-scaling.",
            file=sys.stderr,
        )
        return 3

    try:
        target_doc = ezdxf.new(target_version)
    except Exception as exc:
        print(f"[ERROR] invalid target-version '{target_version}': {exc}", file=sys.stderr)
        return 2

    target_doc.units = target_units
    target_doc.header["$INSBASE"] = (first_insbase.x, first_insbase.y, first_insbase.z)
    target_msp = target_doc.modelspace()

    if args.verbose:
        print(f"[INFO] input-dir      : {input_dir}")
        print(f"[INFO] output         : {output_path}")
        print(f"[INFO] files          : {len(source_files)}")
        print(f"[INFO] target-version : {target_version}")
        print(f"[INFO] target-units   : {target_units} ({units.unit_name(target_units)})")
        print(f"[INFO] align-mode     : {args.align_mode}")
        print(f"[INFO] unit-strategy  : {args.unit_strategy}")
        if suspicious:
            print(f"[WARN] suspicious unit labels detected: {len(suspicious)}")
            if args.force_suspicious_scaling:
                print("[WARN] proceeding because --force-suspicious-scaling is enabled")
        print()

    imported_total = 0
    transform_warning_total = 0

    for index, dxf_path in enumerate(source_files, start=1):
        source_doc = ezdxf.readfile(dxf_path)
        source_units = int(source_doc.units or 0)
        source_insbase = as_vec3(source_doc.header.get("$INSBASE", (0.0, 0.0, 0.0)))

        scale = unit_scale(source_units, target_units, args.unit_strategy)
        if args.align_mode == "insbase":
            scaled_source_base = source_insbase * scale
            offset = first_insbase - scaled_source_base
        else:
            offset = Vec3(0.0, 0.0, 0.0)

        before_count = len(target_msp)
        importer = Importer(source_doc, target_doc)
        importer.import_modelspace(target_msp)
        importer.finalize()

        entities = list(target_msp)
        imported_entities = entities[before_count:]
        imported_count = len(imported_entities)
        imported_total += imported_count

        warning_count = 0
        if imported_entities and (
            abs(scale - 1.0) > 1e-12
            or abs(offset.x) > 1e-12
            or abs(offset.y) > 1e-12
            or abs(offset.z) > 1e-12
        ):
            matrix = Matrix44.chain(
                Matrix44.scale(scale, scale, scale),
                Matrix44.translate(offset.x, offset.y, offset.z),
            )
            log = dxf_transform.inplace(imported_entities, matrix)
            warning_count = len(log.messages())
            transform_warning_total += warning_count

        print(
            f"[{index:02d}/{len(source_files):02d}] {dxf_path.name} "
            f"entities={imported_count} src_units={source_units}({units.unit_name(source_units)}) "
            f"scale={scale:g} offset=({offset.x:g},{offset.y:g},{offset.z:g}) "
            f"transform_warnings={warning_count}"
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    bbox = calc_extents(target_msp)
    if bbox.has_data:
        target_doc.header["$EXTMIN"] = (bbox.extmin.x, bbox.extmin.y, bbox.extmin.z)
        target_doc.header["$EXTMAX"] = (bbox.extmax.x, bbox.extmax.y, bbox.extmax.z)
        target_doc.header["$LIMMIN"] = (bbox.extmin.x, bbox.extmin.y)
        target_doc.header["$LIMMAX"] = (bbox.extmax.x, bbox.extmax.y)
        dx = bbox.extmax.x - bbox.extmin.x
        dy = bbox.extmax.y - bbox.extmin.y
        view_height = max(dx, dy) * 1.15
        center = ((bbox.extmin.x + bbox.extmax.x) * 0.5, (bbox.extmin.y + bbox.extmax.y) * 0.5)
        if view_height > 0:
            # Set initial modelspace view so CAD opens directly over imported entities.
            target_doc.set_modelspace_vport(height=view_height, center=center)
    target_doc.saveas(output_path)

    print()
    print(f"[DONE] merged files      : {len(source_files)}")
    print(f"[DONE] total entities    : {imported_total}")
    print(f"[DONE] target version    : {target_version}")
    print(f"[DONE] target units      : {target_units} ({units.unit_name(target_units)})")
    print(f"[DONE] transform warnings: {transform_warning_total}")
    if bbox.has_data:
        print(
            "[DONE] extents          : "
            f"({bbox.extmin.x:g},{bbox.extmin.y:g}) -> ({bbox.extmax.x:g},{bbox.extmax.y:g})"
        )
    print(f"[DONE] output            : {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
