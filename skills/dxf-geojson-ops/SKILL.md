---
name: dxf-geojson-ops
description: Operate and verify DXF-to-GeoJSON conversion for this project using existing scripts and path conventions. Use when importing new DXF files, selecting layers, tuning conversion tolerances, syncing output into `web/public/data`, or validating geometry output before frontend map usage.
---

# Dxf Geojson Ops

Use this skill to convert DXF to frontend-ready GeoJSON with repeatable validation.

## Workflow

1. Read `coding-doc/dxf-geojson-guide.md`.
2. Load `references/ops-playbook.md` and choose the target mode:
   - drawing layer (`web/public/geojson/int-land.geojson`)
   - site boundary (`web/public/data/site-boundaries.geojson`)
3. Run conversion command with project scripts:
   - `python scripts/dxf_to_geojson.py ...`
   - or `python scripts/dxf_to_site_boundary_geojson.py ...`
4. Validate GeoJSON output:
   - `python skills/dxf-geojson-ops/scripts/check_geojson.py <output> --min-features 1`
5. For Site Boundary flow, if output is generated at `web/public/geojson/site-boundary.geojson`, copy/sync to `web/public/data/site-boundaries.geojson`.
6. If conversion parameters or output paths changed, update `coding-doc/dxf-geojson-guide.md`.
7. Return executed commands, produced files, validation result, and unresolved risks.

## Output Requirements

- Report output file path(s) explicitly.
- Report feature count and geometry types from validation script.
- State whether CRS choice was confirmed or assumed.

## Resources

- `references/ops-playbook.md`: command recipes and tuning checklist.
- `scripts/check_geojson.py`: fast GeoJSON sanity checker for conversion output.
