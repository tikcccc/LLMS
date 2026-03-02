# DXF GeoJSON Ops Playbook

## Source of Truth

- `coding-doc/dxf-geojson-guide.md`
- `scripts/dxf_to_geojson.py`
- `scripts/dxf_to_site_boundary_geojson.py`

## Mode Selection

Use this decision table first.

| Goal | Script | Common output |
| --- | --- | --- |
| Convert generic drawing entities for map overlay | `scripts/dxf_to_geojson.py` | `web/public/geojson/int-land.geojson` |
| Convert site boundaries with polygonization defaults | `scripts/dxf_to_site_boundary_geojson.py` | `web/public/geojson/site-boundary.geojson` then sync to `web/public/data/site-boundaries.geojson` |

## Command Recipes

### 1) Discover layers

```bash
python scripts/dxf_to_geojson.py -i input.dxf --list-layers
```

### 2) Generic conversion

```bash
python scripts/dxf_to_geojson.py \
  -i input.dxf \
  -o web/public/geojson/int-land.geojson
```

### 3) Site boundary conversion

```bash
python scripts/dxf_to_site_boundary_geojson.py \
  -i input.dxf \
  -o web/public/geojson/site-boundary.geojson
```

### 4) Validate generated GeoJSON

```bash
python skills/dxf-geojson-ops/scripts/check_geojson.py \
  web/public/geojson/site-boundary.geojson \
  --min-features 1 \
  --allowed-types Polygon,MultiPolygon
```

## Tuning Sequence

When polygon output quality is poor, tune in this order:

1. `--close-tolerance`
2. `--snap-tolerance`
3. `--bridge-tolerance`
4. `--min-area` (site boundary script)

## Sync Rule

If frontend map consumes `web/public/data/site-boundaries.geojson`, ensure converted output is synced from intermediate location before verification.

## Completion Checklist

1. Conversion command is reproducible and recorded.
2. Output file exists and is valid GeoJSON.
3. Geometry types match intended usage.
4. Feature count is non-zero unless explicitly expected.
5. Required output path for frontend consumption is updated.
6. `coding-doc/dxf-geojson-guide.md` is updated if process/path defaults changed.

