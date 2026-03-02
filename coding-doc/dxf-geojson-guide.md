# DXF to GeoJSON Guide

最後更新：2026-03-02  
範圍：`scripts/dxf_to_geojson.py`、`scripts/dxf_to_site_boundary_geojson.py`

## 1) 目的

本文件說明如何使用專案中的 Python 腳本，把 DXF 轉成 GeoJSON，供前端地圖（OpenLayers）直接載入。

## 2) 腳本位置

- `scripts/dxf_to_geojson.py`：通用 DXF -> GeoJSON 轉換
- `scripts/dxf_to_site_boundary_geojson.py`：Site Boundary 專用轉換（含預設修復參數）
- 依賴檔：`scripts/requirements-dxf.txt`

## 3) 環境準備

```bash
python3 -m venv .venv-dxf
source .venv-dxf/bin/activate
pip install -r scripts/requirements-dxf.txt
```

依賴套件：

- `ezdxf>=1.1.0`
- `pyproj>=3.6.0`
- `shapely>=2.0.0`

## 4) 通用腳本：dxf_to_geojson.py

### 4.1 用途

- 直接把 DXF 實體（Polyline/Line/Arc/Spline...）轉成 LineString 或 Polygon。
- 可選擇是否做 polygonize（線段組面）。
- 可做 CRS 轉換（預設 HK80 -> HK80，即不變）。

### 4.2 常用指令

列出 DXF 圖層：

```bash
python scripts/dxf_to_geojson.py -i input.dxf --list-layers
```

基本轉換（輸出到前端 drawing layer）：

```bash
python scripts/dxf_to_geojson.py \
  -i input.dxf \
  -o web/public/geojson/int-land.geojson
```

只轉指定圖層：

```bash
python scripts/dxf_to_geojson.py \
  -i input.dxf \
  --layers "LayerA,LayerB" \
  -o web/public/geojson/int-land.geojson
```

### 4.3 重要參數

- `--source-crs` / `--target-crs`：座標系轉換
- `--no-transform`：跳過 CRS 轉換
- `--flatten`：曲線離散化精度
- `--polygonize` / `--no-polygonize`：是否線轉面
- `--keep-lines`：polygonize 時是否保留線
- `--snap`：座標格點吸附
- `--close-tolerance`：端點距離小於閾值時強制封閉
- `--snap-tolerance`：polygonize 前吸附鄰近端點
- `--bridge-tolerance`：自動橋接近端點小斷裂

## 5) Site Boundary 專用腳本：dxf_to_site_boundary_geojson.py

### 5.1 用途

針對 Site Boundary 情境提供更實用預設：

- 預設 `polygonize=True`
- 預設 `close_tolerance=0.5`
- 預設 `snap_tolerance=0.5`
- 預設 `bridge_tolerance=1.0`
- 支援排除特定圖層（預設排除 `TransportPolygon`）
- 支援最小面積過濾（預設 `min_area=1000`）

### 5.2 常用指令

```bash
python scripts/dxf_to_site_boundary_geojson.py \
  -i 20260207_HKSTP_BOUNDARY.dxf \
  -o web/public/geojson/site-boundary.geojson
```

指定圖層並排除部分圖層：

```bash
python scripts/dxf_to_site_boundary_geojson.py \
  -i input.dxf \
  --layers "SITE,LOT" \
  --exclude-layers "TransportPolygon,TmpLayer" \
  -o web/public/geojson/site-boundary.geojson
```

關閉面積過濾：

```bash
python scripts/dxf_to_site_boundary_geojson.py \
  -i input.dxf \
  --min-area 0 \
  -o web/public/geojson/site-boundary.geojson
```

## 6) 輸出與前端接軌

常見輸出目標：

- Drawing Layer：`web/public/geojson/int-land.geojson`
- Site Boundary 中間檔：`web/public/geojson/site-boundary.geojson`
- 前端實際讀取 Site Boundary：`web/public/data/site-boundaries.geojson`

注意：目前前端地圖載入 Site Boundary 的路徑是 `web/public/data/site-boundaries.geojson`。  
若腳本輸出到 `web/public/geojson/site-boundary.geojson`，需再同步到 `web/public/data/site-boundaries.geojson` 才會在 Map 頁生效。

## 7) 轉換品質建議

1. 先 `--list-layers` 確認需要的 layer，再做 `--layers` 過濾。
2. 若線段有斷裂，優先調整：
- `--close-tolerance`
- `--snap-tolerance`
- `--bridge-tolerance`
3. 若輸出出現很多小碎片，調高 `--min-area`（site boundary 腳本）。
4. 轉換後建議檢查：
- 幾何是否閉合
- 坐標系是否正確（HK80）
- 面積與實際圖形是否合理

## 8) 常見問題

1. 問：執行失敗提示缺套件  
答：先安裝 `scripts/requirements-dxf.txt` 內套件。

2. 問：GeoJSON 在地圖上位置偏移  
答：檢查 `--source-crs` / `--target-crs`，確認 DXF 真實座標系。

3. 問：多邊形無法建立  
答：開啟 `--polygonize`，並調整 `--snap-tolerance`、`--bridge-tolerance`。
