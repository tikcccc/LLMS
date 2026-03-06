# GeoJSON 大點位資料風險與優化方案（DB / API / 前端）

最後更新：2026-03-06  
範圍：`web/public/data/site-boundaries.geojson`、`web/public/data/geojson/part-of-sites/`、`web/public/data/geojson/sections/`（排除測試層 `web/public/geojson/int-land.geojson`）

## 1) 目的

分析 DXF 轉 GeoJSON 後「單一 polygon 點位數很大」對未來後端化的影響，回答三個核心問題：

1. 資料庫能否承載大量點位幾何？
2. API 在資料量成長後是否會明顯變慢？
3. 前端地圖渲染是否會卡頓，該如何預防？

## 2) 現況基線（2026-03-06）

### 2.1 資料量（排除 `int-land.geojson`）

| Dataset | 檔案數 | Feature 數 | 總點位數 | 原始大小 | gzip 大小 | 單一 Feature 最大點位 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Site Boundary | 1 | 10 | 8,874 | 839,263 bytes | 133,351 bytes | 7,827 |
| Part of Sites | 58 | 62 | 14,301 | 391,071 bytes | 125,856 bytes | 2,333 |
| Sections | 18 | 16 | 2,734 | 80,624 bytes | 29,998 bytes | 1,056 |
| 合計 | 77 | 88 | 25,909 | 1,310,958 bytes | 289,205 bytes | 7,827 |

重點：

- 目前最重的幾何是 `site-boundaries.geojson` 的單一 feature（7,827 點）。
- `part-of-sites/part-10/10B.geojson` 出現 `LineString + MultiPolygon` 混合幾何，API 層要明確過濾或分流。
- 現況檔案經 gzip 可降到原始大小約 22.1%，代表「網路傳輸」可壓縮，但「後端序列化 + 前端解析」成本仍存在。

### 2.2 目前前端載入路徑（與未來風險直接相關）

- Map 頁掛載時即觸發載入多層 GeoJSON（`web/src/modules/map/composables/useMapPageLifecycle.js`）。
- Part of Sites 會先讀索引，再以併發抓取每個分檔並轉 OpenLayers feature（`web/src/modules/map/composables/useMapLayerDataIO.js`）。
- 目前不是 viewport 驅動查詢，而是頁面啟動階段就做大量資料解析。

## 3) 風險判斷（未來接後端時）

### 3.1 資料庫風險

結論：資料庫「可存」，但若沒有空間索引與分級幾何策略，查詢和維護成本會快速上升。

主要風險：

- 大幾何欄位造成 row/index 膨脹，備份、WAL、VACUUM 成本變高。
- 若 API 直接查全表並回傳完整幾何，查詢時間與輸出大小會一起放大。
- 若每次編輯都寫回完整幾何且保留版本，儲存增長會超線性。

### 3.2 API 風險

結論：API 主要瓶頸通常不在「查到資料」，而在「回傳太多幾何 + JSON 序列化 + 前端 parse」。

主要風險：

- list/search API 不分場景回傳 geometry，造成 payload 過大。
- 無 `bbox` / `zoom` 條件，會把非可視範圍資料一併傳輸。
- 無壓縮與快取（ETag/Last-Modified）時，重覆請求成本高。

### 3.3 前端渲染風險

結論：資料放大後，前端最先卡住的是「主執行緒 parse + feature 建立 + 符號渲染」。

主要風險：

- 一次載入全部圖層資料，首屏等待時間變長。
- 大 feature 在平移/縮放時重繪成本高。
- 點位多時，互動（hover/select）命中與樣式更新開銷上升。

## 4) 優化方案（建議採分層治理）

### 4.1 轉檔/資料層（DXF -> GeoJSON）

1. 建立雙軌輸出：`full`（高精度留檔）+ `serve`（供 API/前端）。
2. 在 `serve` 版本啟用拓撲安全簡化：
   - Part/Section 可先用 `0.05m ~ 0.2m` tolerance 做 A/B 比較。
   - 以面積偏差率做門檻（建議 `|delta_area| <= 0.5%`）。
3. 在轉檔流程新增品質閘門：
   - 每個 feature 點位上限（例如 5,000）超標即告警。
   - 幾何型別白名單（避免非預期 LineString 混入 polygon API）。

#### 4.1.1 Python 粗化腳本方案（可行，建議納入）

客戶只要求「大概精度」時，可在資料來源層加一個批次腳本（例如 `scripts/simplify_geojson_polygons.py`），對 `Polygon/MultiPolygon` 做可控粗化，降低點位數與 payload。

建議流程：

1. 讀取 `full` GeoJSON，僅處理 `Polygon/MultiPolygon`。
2. 先做座標精度格網（例如 `0.01m` 或 `0.02m`）合併近點。
3. 再做拓撲保留簡化（`preserve_topology=True`）。
4. 輸出 `serve` 版本，保留原 `full` 版本不覆蓋。

建議閾值（第一版）：

1. `simplify_tolerance`: `0.05m` 起步（必要時提高到 `0.1m`）。
2. 面積偏差率：`|delta_area| <= 0.5%`（超標即回退較小 tolerance）。
3. 點位降幅目標：至少 `20%`（低於此值代表收益不高，可不套用）。
4. Hausdorff 距離上限：`<= 0.3m`（避免視覺形狀偏差過大）。

品質閘門：

1. 幾何有效性（valid geometry）必須維持 100%。
2. 不允許洞（interior holes）異常消失（除非明確配置最小洞面積策略）。
3. 任何一項超出閾值即保留原始幾何，不進入 `serve` 發佈。

### 4.2 資料庫層（後端接入時）

1. 使用 PostGIS 幾何欄位（SRID 2326），並建立 GiST 索引。
2. 保留多級幾何：
   - `geom_full`：精準分析/匯出
   - `geom_lod`：地圖展示（可依 zoom 對應）
3. 對超大 polygon 做 `ST_Subdivide`（查詢和渲染都會更穩定）。
4. list 類查詢預設不回 geometry，只回 metadata + bbox。

### 4.3 API 層

1. 強制支援 `bbox` + `zoom` + `layer` 條件查詢。
2. 提供 `geometryLevel` 參數：`none | lod | full`（預設 `lod`）。
3. 啟用 gzip/brotli + ETag，避免重覆下載整包資料。
4. 若資料規模持續成長，改為 Vector Tile（MVT）作為地圖讀取主路徑。

### 4.4 前端層

1. 改為 viewport 驅動載入，不在 mounted 階段全量拉取。
2. 地圖移動時做 debounce + 取消舊請求，避免 request 風暴。
3. 低縮放層級優先使用簡化幾何，高縮放再請求 full 或較高 LOD。
4. 若 feature/點位持續增加，評估切換到更偏 GPU 的渲染路徑（如 WebGL）。

## 5) 建議執行順序（低風險落地）

### Phase 0（立即）

1. 固化「點位數、payload、首屏時間」三個基線指標。
2. API 設計先保留 `geometryLevel` 與 `bbox` 參數（即使先回 mock）。
3. 建立 Python 粗化腳本 PoC（先針對 `site-boundaries` + `part-of-sites` 兩套資料跑 A/B）。

### Phase 1（後端首版）

1. list API 預設不帶 geometry。
2. map API 預設回 `lod` 幾何並開啟 gzip + ETag。
3. DB 建立空間索引與慢查詢監控。
4. 將「粗化後 `serve` 幾何」接入 map API 預設回傳，`full` 僅在特定場景按需提供。

### Phase 2（資料成長後）

1. 將 map API 升級為 Vector Tile。
2. 前端全面改為 viewport incremental loading。
3. 對超大幾何啟用分塊儲存與查詢。

## 6) 直接回答本次問題

1. 資料庫能容納大量點位 polygon，這不是主要阻礙；真正風險在查詢策略與資料回傳策略。  
2. 後端化後若仍採「整包 GeoJSON 回傳 + 前端全量載入」，資料量上升時 API 與前端都會卡。  
3. 你的「Python 腳本粗化 + 閾值控制」方案可行，且建議納入標準流程；最有效做法仍是「轉檔分級 + 可控粗化 + DB 空間索引 + API 視窗查詢 + 前端按需載入」一起做。
