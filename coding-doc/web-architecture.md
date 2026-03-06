# Web Architecture

最後更新：2026-03-06  
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
- `src/stores/useUiStore.js`：地圖工具狀態、選取狀態、圖層顯示、`activeContract`（`C1/C2/C3` workspace）與 lot 級白名單篩選狀態
- `src/stores/useWorkLotStore.js`：Work Lot 集合生命週期（增刪改替換 + ID 正規化）
- `src/stores/useSiteBoundaryStore.js`：Site Boundary 載入/合併/幾何補全/增刪改，以及 persisted store version 升級後的靜態 GeoJSON 重同步
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

`MapPage` 透過 composables 做地圖引擎與頁面協調拆分：

- `useMapCore.js`：地圖實例、底圖/標籤圖層初始化
- `useMapLayers.js`：圖層總裝配（向量 source/layer 管理、feature 生成、filter 刷新）；內部再委派：
- `useMapLayerVisibility.js`：圖層顯示/filter 樣式判定與可見性更新（依 `activeContract` 對應的單一 contract package）
- `useMapLayerDataIO.js`：地圖資料 I/O（GeoJSON 載入、Part/Section 快照 build/persist/export）
- `useMapFeatureNormalization.js`：Part/Section feature 正規化與 `contractPackage` 欄位補齊
- `useMapSiteBoundarySourceState.js`：Site Boundary source/state 同步與快取重建
- `useMapInteractions.js`：互動總裝配（scope/measure/draw/modify/delete/select），內部再委派：
- `useInteractionToolState.js`：工具切換與 interaction 建立/清理
- `useInteractionDrawHandlers.js`：scope/draw 完成事件處理
- `useInteractionModifyLifecycle.js`：save/cancel modify 與 backup 邏輯
- `useInteractionSelectionHandlers.js`：select/delete/modify 選取分流
- `useInteractionOverlayState.js`：scope/measure overlay source/layer
- `useMapFocusState.js`：Map 抽屜 focus mode 狀態機（snapshot 捕捉/還原、focus 鎖、有效性校驗）
- `useMapHighlights.js`：選中要素高亮圖層（Work Lot / Part of Sites / Sections / Site Boundary）
- `useMapPageLifecycle.js`：MapPage onMounted/onBeforeUnmount 載入與初始化流程
- `useMapPageWatchers.js`：MapPage 主要 watcher 協調（圖層刷新、focus 校驗、route query 監聽）
- `useMapPageFocusSetup.js`：focus/zoom/route query 聚焦裝配（整合 `useMapFocusState` + `useMapZoomRouteActions`）
- `useMapPageSpatialSetup.js`：Part/Section 幾何解析、關聯同步與高亮 source 裝配
- `useMapPageDialogActionsSetup.js`：四類實體 dialog 的 create/edit/delete/confirm 流程裝配
- `useMapPageUiActions.js`：抽屜關閉、角色切換、圖層重算等 UI action 聚合
- `useMapPagePanelState.js`：側欄 tab/search/source version 的 page-level state
- `modules/map/utils/partGeometryResolution.js`：Part of Sites/Sections 幾何去重疊差集（有效面積/高亮）與幾何交集面積判斷工具（供 section-part 關聯 fallback 使用）；重疊優先序為「內含或高覆蓋率的小幾何優先（MultiPolygon 以子 polygon 覆蓋率判斷），其餘重疊由較小面積優先，最後用 ID 自然序穩定化」
- `modules/map/utils/featureMeta.js`：Part/Section 純函數（ID/數值正規化、System ID 產生、feature -> meta 解析器）
- `modules/map/utils/layerFeatureHelpers.js`：Map layer feature 純函數（ID/日期/數值正規化、lot-id/system-id、filter 判定）
- `modules/map/utils/layerFilterState.js`：Layers 面板 state 快照與 patch 套用（`layerFilterState` 讀寫邏輯）
- `modules/map/utils/layerFilterSelectors.js`：Layers/Scope 側欄列表 selector 純函數（`layerFilterOptions`、`siteBoundaryResults`、`workLotResults`、`partOfSitesResults`、`sectionResults`、`scope*Results`）
- `modules/map/utils/relationSelectors.js`：Drawer 關聯清單 selector（work lot <-> site boundary、part <-> section）
- `modules/map/utils/interactionHelpers.js`：互動層純函數（tool 判定、Part/Section ID/system-id 生成、feature 查找）
- Part of Sites 載入策略：`index.json -> group index -> part 檔案`，其中 group 與 part 檔案以有限併發下載，並對 JSON 請求套用記憶體 TTL 快取

Map UI 元件分工：

- 工具列：`MapToolbar.vue`
- 側欄 shell：`MapSidePanel.vue`
- 側欄 tab 子元件：
- `MapSidePanelLayersTab.vue`
- `MapSidePanelScopeTab.vue`
- `MapSidePanelPartOfSitesTab.vue`
- `MapSidePanelSectionsTab.vue`
- `MapSidePanelWorkLotsTab.vue`
- `MapSidePanelSiteBoundariesTab.vue`
- 側欄 composables：`components/composables/useMapSidePanelFilters.js`、`components/composables/useMapSidePanelLayout.js`
- 抽屜 shell：`MapDrawer.vue`
- 抽屜 header/body 子元件：
- `MapDrawerHeader.vue`
- `MapDrawerBodyWork.vue`
- `MapDrawerBodySiteBoundary.vue`
- `MapDrawerBodyPartOfSite.vue`
- `MapDrawerBodySection.vue`
- `MapDrawerBodyIntLand.vue`
- 抽屜狀態 composable：`components/composables/useMapDrawerState.js`
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
- `MapPage.vue` 已降到 < 900 LOC，並以 page-level composables 分攤協調責任
- `MapSidePanel.vue` / `MapDrawer.vue` 已改為 shell + 子元件，UI 變更風險可局部控制
- 正規化工具集中，減少資料格式漂移
- 無後端仍可完整跑 demo（本地優先）

### 目前限制

- 尚無 API adapter/repository 層
- 權限僅前端控制，沒有後端驗證
- 目前沒有自動化測試（unit/component/e2e）
- `MapPage.vue` 仍是協調中樞，跨 composable 參數注入面較寬（依賴治理成本仍高）

## 10) 建議演進路線

1. 新增 `src/shared/api/`，隔離未來 API 介接邏輯。
2. 收斂 `MapPage` 的大型參數注入（以 context object 或 typed contract 分群傳遞）。
3. 導入型別化資料契約（TypeScript 或 runtime schema）。
4. 建立前端測試基線：
- `shared/utils` 單元測試
- 重要頁面/對話框元件測試
- 路由與權限流程 e2e smoke test
