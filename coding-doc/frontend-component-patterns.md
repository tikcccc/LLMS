# Frontend Component Patterns

最後更新：2026-03-05  
範圍：`web/` 現有 Vue + Element Plus 專案可直接落地的元件模式

## 1) 目的

本文件提供「可複用、可擴充、可保持一致」的前端元件模式，避免後續每頁重新發明版型與交互。

## 2) 通用規則

- 優先使用現有 token 與色彩語意（參考 `frontend-consistency.md`）。
- 版型層級：`Page -> Section/Card -> Control -> Data View`。
- 元件應盡量「資料驅動」：
- 透過 `props` 接收狀態
- 透過 `emit` 回傳事件
- 避免在共用元件內直接耦合 store
- 所有破壞性操作都要有確認流程。
- icon-only 按鈕必須帶 `aria-label`。

## 3) Page Pattern

適用頁面：Dashboard、Work Lots、Site Boundaries、Admin。

標準結構：

1. `page`：頁面容器，標準 padding（桌面 24px）
2. `header`：標題 + 副標 + 主要操作區
3. `toolbar`：搜尋/篩選/批量動作
4. `content`：表格、卡片或圖表

建議 class：

- `page`
- `header` / `header-copy`
- `toolbar`
- `filters`
- `action-buttons`

## 4) Card Pattern

適用場景：KPI 卡、資訊卡、圖表卡。

結構：

- `card`
- `card-head`（標題、右上角輔助資訊）
- `card-body`（主內容）
- `card-footer`（可選）

樣式基線：

- 背景：白色或輕微漸層
- 邊框：`1px solid var(--border)`
- 圓角：`12px~16px`
- 陰影：輕量，不搶內容

## 5) Table Pattern

適用場景：Work Lots、Site Boundaries、Users、Admin。

規範：

- 固定首欄（ID）與操作欄（如需要）
- 日期欄位統一用 `TimeText`
- 狀態欄位統一用 `el-tag` + 語意樣式函式
- 表格上方工具列固定包含搜尋/篩選/操作按鈕區
- 若有批量動作，統一使用 row selection

推薦封裝：

- `TableToolbar`（可後續抽）
- `StatusTag`（可後續抽，封裝 style mapping）

## 6) Dialog Form Pattern

適用場景：Work Lot 編輯、Site Boundary 編輯、確認對話框。

結構：

- `el-dialog`
- `el-form`（`label-position="top"`）
- footer 統一：`Cancel` + 主操作按鈕

規範：

- Dialog 不直接更新 store，透過 `confirm` 事件回傳
- Form 欄位預設值由父層提供（如 `createXXXEditForm`）
- 需要辨識唯讀欄位（如 System ID）應 disabled 顯示

## 7) Side Panel Pattern（Map）

適用場景：Map 左側 panel（Layers / Scope / Search）。

結構：

- Shell：`MapSidePanel.vue`（tab 裝配、事件透傳、桌機/行動切換）
- Tab 子元件：`Layers/Scope/Part of Sites/Sections/Work Lots/Site Boundaries`
- 內容區（可滾動）
- 行動端 sheet header
- 可調整尺寸控制（桌面）
- 內部 composables：
- `useMapSidePanelFilters.js`（`layerFilterState` proxy、增量 patch、白名單勾選）
- `useMapSidePanelLayout.js`（mobile sheet、desktop collapse、resize）

規範：

- 桌機（>900px）採「左側常駐 sidebar + 右側 map stage」版型，避免 panel 疊在地圖上。
- 支援桌機與行動行為切換（<=900px）
- 行動端改為底部 sheet overlay，需保留地圖主要操作可達性。
- 桌機側欄需提供整體收納/展開按鈕，縮起後仍可快速展開。
- 滾動區域與固定區域分離，避免整面板難以操作
- 桌機允許透過右側邊緣拖拉熱區調整寬度，但不應常駐顯示明顯 bar
- 與 map overlay 的 z-index 關係需固定管理（mobile sheet > 地圖內容）
- 清單型 tab root 容器必須是可收縮的 flex column（含 `min-height: 0`），讓搜尋列固定、結果清單留在內部捲動
- Layers 分頁採資料驅動：`layerFilterState` + `layerFilterOptions`
- `update:layerFilterState` 事件應只回傳「增量 patch」欄位，避免主開關與 C1/C2 子開關在同次更新互相覆蓋
- 大量 lot 清單區塊需支援區段收合/展開，降低側欄資訊壓力。
- `Work Lot`、`Site Boundary` 採 lot 級 checkbox 白名單，`Part of Sites` 採 part 級 checkbox 白名單，`Sections` 採 section 級 checkbox 白名單
- `Work Lot`、`Site Boundary`、`Part of Sites`、`Sections` 每個圖層區塊都需提供 C1/C2 phase 子開關，且與主開關保持父子聯動
- 若提供跨圖層 phase 總控（Global C1/C2），其操作需一次輸出多鍵 patch（四組圖層的 C1/C2），避免逐鍵事件被中途重算覆蓋
- `Drawing Layer` 目前在前端 Layers 分頁維持隱藏，不提供開關
- lot 勾選只影響地圖顯示，不影響側欄清單與 scope 結果資料集
- Scope Results 建議維持「Section -> Part of Sites -> Site Boundary -> Work Lot」的呈現順序，方便先看 section 範圍再下鑽

## 8) Drawer Pattern（Map）

適用場景：Map 右側詳情抽屜（Work Lot / Site Boundary / Part of Sites / Section / Int Land）。

結構：

- Shell：`MapDrawer.vue`（開關控制、header/body 切換、刪除確認）
- Header：`MapDrawerHeader.vue`（title、focus、edit/delete 動作）
- Body 子元件（按視圖拆分）：
- `MapDrawerBodyWork.vue`
- `MapDrawerBodySiteBoundary.vue`
- `MapDrawerBodyPartOfSite.vue`
- `MapDrawerBodySection.vue`
- `MapDrawerBodyIntLand.vue`
- 狀態 composable：`useMapDrawerState.js`（collapse、focus active、related filters、area/progress 顯示字串）

規範：

- Shell 不直接承擔每個實體的大型模板，僅負責視圖切換與事件轉發。
- 每個 body 子元件只關注單一實體類型，資料透過 props 傳入。
- Header/Body 共享的衍生狀態（title、focus active、格式化字串）集中在 composable，避免重複 computed。
- 子元件輸出事件維持語意化命名（`focus-*`、`update:*`），由 shell 統一轉給頁面層。

## 9) Overlay Pattern（Map 浮層）

適用場景：Toolbar、Legend、Scale、Hint。

規範：

- 每個 overlay 要有明確定位策略（左上、右下、底部中間）
- mobile 狀態需有替代布局（避免遮擋）
- 不應依賴單一像素值硬寫死，需保留可調整空間

## 10) Status Visualization Pattern

狀態顯示來源統一：

- Work Lot：`modules/map/utils/statusStyle.js`
- Site Boundary：`modules/map/utils/siteBoundaryStatusStyle.js`

規範：

- 不允許在頁面內直接臨時定義新的狀態色
- 同一狀態詞在不同元件（地圖、表格、抽屜）需一致

## 11) Responsive Pattern

已存在斷點：

- `1120px`、`1100px`、`900px`、`768px`

新元件要求：

- 必須描述桌機與行動行為（至少 2 個狀態）
- 主要操作按鈕在 mobile 不可被折疊到不可達位置
- 表格在小螢幕至少保留關鍵欄位可讀

## 12) 推薦可抽象成共用元件的清單

1. `PageHeader`：統一頁面標題與副標區
2. `TableToolbar`：統一搜尋/篩選/操作列
3. `StatusTag`：統一狀態 tag 呈現
4. `EntityMetaGrid`：統一抽屜基本資訊網格
5. `EmptyStateBlock`：統一空狀態樣式

## 13) PR 檢查清單（元件模式）

1. 新增頁面是否沿用現有 page/header/toolbar 模式。
2. 新增卡片/表格是否重用既有樣式語言。
3. 狀態顯示是否調用既有 status style helper。
4. Dialog 是否使用統一 footer 與事件回傳模式。
5. Side Panel / Drawer 是否維持 shell + 子元件拆分，不回流為單體模板。
6. mobile 下是否已驗證不遮擋主要操作。
