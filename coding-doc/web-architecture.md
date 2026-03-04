# Web Architecture

最後更新：2026-03-04  
範圍：`web/` 前端 demo 應用

## 1) 文件目標

本文件定義目前前端網站的總體架構，包含：

- 系統分層與模組責任邊界
- 技術棧與使用目的
- 代碼目錄與核心組件分工
- 主要資料流（GeoJSON -> Store -> Map/Dashboard/Table/Report）
- 現階段約束（無後端、前端本地持久化）

## 2) 系統定位

目前是單頁應用（SPA），尚未接入真實後端 API。

- 執行環境：Browser only
- 主要資料來源：
- 靜態檔 `web/public/data/*.geojson`、`web/public/geojson/*.geojson`
- 地圖圖層檔案：`/geojson/int-land.geojson`、`/data/geojson/part-of-sites/index.json`（分派至 `part-*/<part>.geojson`）、`/data/geojson/sections/index.json`（分派至 `section-*/<section>.geojson`）、`/data/site-boundaries.geojson`
- 使用者操作後的資料透過 Pinia Persist 存在 `localStorage`
- 權限模型：前端角色切換（Site Admin / Site Officer / Field Staff），非真實登入

## 3) 技術棧

- 框架：Vue 3（Composition API + `<script setup>`）
- 打包：Vite 5
- 路由：Vue Router 4
- 狀態管理：Pinia + `pinia-plugin-persistedstate`
- UI 套件：Element Plus
- 地圖引擎：OpenLayers 10 + proj4（HK80 / EPSG:2326）
- 圖表：Chart.js
- 匯出：
- Excel：`xlsx`
- PDF：`jspdf`、`jspdf-autotable`

## 4) 架構分層

### 4.1 App Shell 層

負責全站框架與導覽骨架。

- `src/main.js`：App 啟動、Store 正規化、初始資料載入
- `src/App.vue`：主殼層（`AppHeader + RouterView`）
- `src/components/AppHeader.vue`：Topbar 導覽、角色切換、重置 demo 資料

### 4.2 Route/Page 層

每條路由對應一個業務頁面。

- `src/modules/dashboard/DashboardPage.vue`：KPI 儀表板
- `src/modules/map/MapPage.vue`：地圖操作主工作區
- `src/modules/landbank/LandBankWorkLotsPage.vue`：Work Lots 清單管理
- `src/modules/landbank/LandBankSiteBoundariesPage.vue`：Site Boundaries 清單管理
- `src/modules/landbank/LandBankPartOfSitesPage.vue`：Part of Sites 清單檢視與屬性編修（`accessDate`、`area`）
- `src/modules/landbank/LandBankSectionsPage.vue`：Sections 清單檢視與屬性編修（`completionDate`、`area`）
- `src/modules/users/UsersPage.vue`：使用者頁（demo 佔位）
- `src/modules/admin/AdminWorkLots.vue`：管理頁匯出檢視

### 4.3 Domain State 層（Pinia）

- `src/stores/useAuthStore.js`：角色狀態與角色名稱
- `src/stores/useUiStore.js`：地圖工具狀態、選取狀態、圖層顯示、lot 級白名單篩選狀態
- `src/stores/useWorkLotStore.js`：Work Lot 集合生命週期（增刪改替換 + ID 正規化）
- `src/stores/useSiteBoundaryStore.js`：Site Boundary 載入/合併/幾何補全/增刪改
- `src/stores/usePartOfSitesStore.js`：Part of Sites 地圖編輯快照（FeatureCollection）與屬性 overrides（`accessDate`、`area`）持久化
- `src/stores/useSectionsStore.js`：Sections 地圖編輯快照（FeatureCollection）與屬性 overrides（`completionDate`、`area`）持久化

### 4.4 Domain Utility 層

共用業務邏輯與資料轉換函式。

- `src/shared/utils/worklot.js`：類別/狀態正規化、欄位清洗、枚舉定義
- `src/shared/utils/siteBoundary.js`：Site Boundary 正規化、彙總與 KPI 推導
- `src/shared/utils/partOfSitesGeojson.js`：Part of Sites FeatureCollection 建構、正規化與下載
- `src/shared/utils/sectionsGeojson.js`：Sections FeatureCollection 建構、正規化與下載
- `src/shared/utils/*Geojson.js`、`*Json.js`：匯入匯出格式轉換
- `src/shared/utils/reportExport.js`：報表資料組裝與 Excel/PDF 匯出流程
- `src/shared/utils/asyncDataLoader.js`：靜態 JSON 載入共用能力（有限併發、記憶體 TTL 快取、in-flight 去重、stale fallback）
- `src/shared/utils/time.js`、`role.js`、`id.js`、`search.js`：跨模組通用工具

### 4.5 Map Engine 層

`MapPage` 透過 composables 做地圖引擎拆分：

- `useMapCore.js`：地圖實例、底圖/標籤圖層初始化
- `useMapLayers.js`：向量 source/layer 管理、feature 生成、GeoJSON 載入（Drawing/Part of Sites/Sections/Site Boundary/Work Lot）與 lot 級白名單渲染控制
- `useMapInteractions.js`：工具互動狀態機（scope/measure/draw/modify/delete/select；scope 結果涵蓋 Sections / Part of Sites / Site Boundary / Work Lot），並支援 Part/Section 點擊時以座標命中有效幾何做二次判定，降低重疊區誤選
- `useMapHighlights.js`：選中要素高亮圖層（Work Lot / Part of Sites / Sections / Site Boundary）
- `modules/map/utils/partGeometryResolution.js`：Part of Sites/Sections 幾何去重疊差集（有效面積/高亮）與幾何交集面積判斷工具（供 section-part 關聯 fallback 使用）；重疊優先序為「內含或高覆蓋率的小幾何優先，其餘重疊由較小面積優先，最後用 ID 自然序穩定化」
- Part of Sites 載入策略：`index.json -> group index -> part 檔案`，其中 group 與 part 檔案以有限併發下載，並對 JSON 請求套用記憶體 TTL 快取

Map UI 元件分工：

- 工具列：`MapToolbar.vue`
- 側欄（lot 級圖層篩選/搜尋/scope 結果）：`MapSidePanel.vue`
- 詳情抽屜：`MapDrawer.vue`
- 編輯對話框：`WorkLotDialog.vue`、`SiteBoundaryDialog.vue`、`PartOfSiteDialog.vue`、`SectionDialog.vue`
- 地圖覆蓋元件：`MapLegend.vue`、`MapScaleBar.vue`

## 5) 目錄結構（重點）

```text
web/src
├── App.vue
├── main.js
├── style.css
├── router/
├── stores/
├── components/
├── modules/
│   ├── dashboard/
│   ├── map/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── ol/
│   │   └── utils/
│   ├── landbank/
│   ├── admin/
│   └── users/
└── shared/
    ├── config/
    ├── mock/
    └── utils/
```

## 6) 路由與權限控制

路由定義於 `src/router/index.js`：

- `/dashboard`
- `/map`
- `/landbank/work-lots`
- `/landbank/site-boundaries`
- `/landbank/part-of-sites`
- `/landbank/sections`
- `/users`
- `/admin/work-lots`（`meta.requiresAdmin`）

路由守衛行為：

- 目標路由需要 admin 且當前角色不是 `SITE_ADMIN` 時，導向 `/map`。

## 7) 核心資料流

### 7.1 啟動流程

1. `main.js` 建立 Vue app 與 Pinia。
2. 清理 legacy localStorage key（一次性）。
3. 執行 store 的 legacy state 正規化。
4. 嘗試從 `/data/work-lots.geojson` 自動載入 Work Lots。
5. 掛載 App，進入路由頁面。

### 7.2 地圖操作流程（建立/修改）

1. 使用者在 `MapToolbar` 選擇工具。
2. `useMapInteractions` 建立對應 OpenLayers interaction。
3. Draw/Modify 產生新的 geometry。
4. geometry 依目標圖層（work/site boundary/part of sites/section）做正規化與欄位補齊。
5. Work Lot / Site Boundary 寫回對應 Pinia store；Part of Sites / Sections 寫回 map source 並快照到 `usePartOfSitesStore` / `useSectionsStore`（localStorage），其日期/面積屬性編修會同步寫入 store overrides。
6. `MapPage` watchers 觸發圖層刷新、高亮刷新、boundary 彙總狀態刷新；Part of Sites / Sections 可由工具列匯出 GeoJSON。

### 7.3 KPI/報表流程

1. Dashboard 與清單頁讀取 store 資料。
2. `useDashboardMetrics` 與 `summarizeSiteBoundary` 計算 KPI 與統計。
3. `reportExport.js` 將結果組成 Excel/PDF 匯出。

## 8) 樣式架構（現況）

- 全域 token 與 reset：`src/style.css`
- 大多數頁面/元件採用 scoped style
- 狀態語意色集中在：
- `modules/map/utils/statusStyle.js`（Work Lot）
- `modules/map/utils/siteBoundaryStatusStyle.js`（Site Boundary）

## 9) 架構特性

### 優勢

- Page / Store / Utility / Map Engine 分層清楚
- 地圖邏輯已拆到 composables，維護性高
- 正規化工具集中，減少資料格式漂移
- 無後端仍可完整跑 demo（本地優先）

### 目前限制

- 尚無 API adapter/repository 層
- 權限僅前端控制，沒有後端驗證
- 目前沒有自動化測試（unit/component/e2e）
- `MapPage.vue` 仍然偏大，協調責任較重

## 10) 建議演進路線

1. 新增 `src/shared/api/`，隔離未來 API 介接邏輯。
2. 進一步拆分 `MapPage.vue` 協調邏輯（選取、表單、路由聚焦）。
3. 導入型別化資料契約（TypeScript 或 runtime schema）。
4. 建立前端測試基線：
- `shared/utils` 單元測試
- 重要頁面/對話框元件測試
- 路由與權限流程 e2e smoke test
