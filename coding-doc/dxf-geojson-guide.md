# DXF to GeoJSON Guide

最後更新：2026-03-04  
範圍：`scripts/dxf_to_geojson.py`、`scripts/dxf_to_site_boundary_geojson.py`、`scripts/build_part_of_sites_geojson.py`、`scripts/build_sections_geojson.py`

## 1) 目的

本文件說明如何使用專案中的 Python 腳本，把 DXF 轉成 GeoJSON，供前端地圖（OpenLayers）直接載入。

## 2) 腳本位置

- `scripts/dxf_to_geojson.py`：通用 DXF -> GeoJSON 轉換
- `scripts/dxf_to_site_boundary_geojson.py`：Site Boundary 專用轉換（含預設修復參數）
- `scripts/build_part_of_sites_geojson.py`：Part of Sites 批次轉檔並重建 index
- `scripts/build_sections_geojson.py`：由既有 Part of Sites GeoJSON 聚合 Section 並重建 index（Section PoC）
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
- Part of Sites 分檔資料源根目錄：`web/public/data/geojson/part-of-sites/`
- Sections 分檔資料源根目錄：`web/public/data/geojson/sections/`

注意：目前前端地圖載入 Site Boundary 的路徑是 `web/public/data/site-boundaries.geojson`。  
若腳本輸出到 `web/public/geojson/site-boundary.geojson`，需再同步到 `web/public/data/site-boundaries.geojson` 才會在 Map 頁生效。

Part of Sites（分 part 輸出）建議結構：

```text
web/public/data/geojson/part-of-sites/
  index.json
  part-1/
    index.json
    1A.geojson
    1B.geojson
    ...
    1I.geojson
```

### 6.1 Part of Sites 批次轉檔命令

```bash
python scripts/build_part_of_sites_geojson.py
```

預設會掃描 `dxf_drawings/Processed Part of sites/PART *`，輸出到 `web/public/data/geojson/part-of-sites/`，並重建：

- 根索引：`web/public/data/geojson/part-of-sites/index.json`
- 各組索引：`web/public/data/geojson/part-of-sites/part-*/index.json`
- 各 part 檔案：`web/public/data/geojson/part-of-sites/part-*/*.geojson`

常用選項：

- `--groups "PART 2,PART 7"`：只重建指定 group
- `--polygonize`：若來源是開放線段，啟用線轉面
- `--close-tolerance/--snap-tolerance/--bridge-tolerance`：修補近端點斷裂
- `--no-topology-clean`：關閉預設的拓撲清洗（預設會啟用）
- `--topology-clean-grid`：拓撲清洗時的精度格網（預設 `0.001` m）
- `--topology-clean-min-area`：拓撲清洗後剔除小於指定面積的碎片（預設 `0`）
- `--variant-merge-align-mode`：同一 part 有多個 DXF（例如 `10C(1).dxf`、`10C(2).dxf`）時的對齊模式，預設 `insbase`
- `--variant-merge-unit-strategy`：多 DXF 合併時的單位策略，預設 `keep-values`
- `--variant-force-suspicious-scaling`：只在 `scale-values` 需要強制縮放時使用

多檔合併規則（Part of Sites）：

1. 腳本會遞迴掃描 `PART *` 內所有 `*.dxf`。
2. 若檔名符合同一 part 變體（例如 `10C(1)`, `10C(2)`, `10C(3)`），會先用 `merge_part_of_sites_dxf.py` 合併，再輸出單一 `10C.geojson`。
3. `part-*/index.json` 會保留 `sourceDxfs` 與 `mergedFromCount`，方便追蹤來源檔。

注意：`--groups` 會重建根索引 `part-of-sites/index.json`，內容只包含本次選到的 group。  
若要恢復前端完整資料清單，最後需再跑一次不帶 `--groups` 的全量重建。

`part-*/index.json` 需記錄每個 part 的檔案路徑、feature 數量、geometry 類型和來源 DXF，方便後續批次驗證與前端按需載入。

### 6.2 Section 聚合命令（全量 SECTION-1 ~ SECTION-13）

用途：把既有 Part of Sites GeoJSON 聚合成 Sections GeoJSON，不重跑 DXF 轉檔。  
腳本：`scripts/build_sections_geojson.py`

預設行為：

1. 依合約映射一次生成 `SECTION-1` 至 `SECTION-13`。  
2. 每個 section 輸出單一 `MultiPolygon` feature（`SECTION-11/12` 目前為空 placeholder，feature 數為 0）。  
3. 預設清理：
- 移除非面（point/line）碎片
- 移除 polygon interior holes（僅保留外圍面）

執行命令：

```bash
python scripts/build_sections_geojson.py
```

常用選項：

- `--part-root`：Part of Sites 資料根目錄（預設 `web/public/data/geojson/part-of-sites`）
- `--output-root`：Sections 輸出根目錄（預設 `web/public/data/geojson/sections`）
- `--sections`：只生成指定 section（例如 `SECTION-1,SECTION-2`）
- `--keep-holes`：保留 interior holes（預設關閉）
- `--min-area`：剔除小於此面積的碎片 polygon（單位 m²）
- `--no-allow-empty-sections`：若 section 無可用幾何則直接報錯（預設允許空 placeholder）

輸出檔案結構：

```text
web/public/data/geojson/sections/
  index.json
  section-1/
    index.json
    SECTION-1.geojson
  section-2/
    index.json
    SECTION-2.geojson
  ...
  section-13/
    index.json
    SECTION-13.geojson
```

Section feature（有幾何時）properties 固定包含：

- `sectionId` / `sectionLotId`
- `sectionLotLabel`
- `sectionGroup`
- `sectionSystemId`
- `relatedPartIds`
- `partCount`

預設合約映射：

- `SECTION-1` -> `1A,1B,1C,1D,1E,1F,1G,1H,1I`
- `SECTION-2` -> `2A,2B,2C`
- `SECTION-3` -> `3A`
- `SECTION-4` -> `4A`
- `SECTION-5` -> `5A,5B`
- `SECTION-6` -> `6A`
- `SECTION-7` -> `7A,7B,7C,7D,7E`
- `SECTION-8` -> `8A,8B,8C`（Subject to Excision）
- `SECTION-9` -> `9A,9B,9C,9D`
- `SECTION-10` -> `10A,10B,10C,10D,10E,10F,10G,10H,10I,10J,10K`（合約文本註記排除 `SECTION-11/12`）
- `SECTION-11` -> 無 part 映射（Drawing Nos. STP2/C2/63/3000~3414；目前空 placeholder）
- `SECTION-12` -> 無 part 映射（landscape softworks；目前空 placeholder）
- `SECTION-13` -> `13A,13B,13C`

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
