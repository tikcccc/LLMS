# Frontend Consistency

最後更新：2026-03-03  
範圍：`web/` 前端樣式系統與實作一致性規範

## 1) 目標

本文件定義一套可持續維護的前端一致性基線，確保後續開發具備：

- 視覺一致
- 易於維護
- 新人可快速接手
- 與 Vue + Element Plus 現有架構相容

## 2) Design Token（單一來源）

目前全域 token 位於 `src/style.css` 的 `:root`。

強制規則：

- 共用色彩/邊框/陰影必須走 CSS 變數。
- 不可在多處隨機硬編顏色與尺寸。

現有核心 token：

- `--bg`
- `--panel`
- `--ink`
- `--muted`
- `--accent`
- `--accent-strong`
- `--border`
- `--shadow`

建議補充（如開始頻繁使用，應集中新增）：

- 間距尺度 token（`--space-2`、`--space-3`、`--space-4`...）
- 狀態語意 token（`--status-danger-bg`、`--status-success-bg`...）
- 圓角 token（`--radius-sm`、`--radius-md`、`--radius-lg`）

## 3) CSS 架構規範

## 3.1 分層

- 全域樣式檔（`src/style.css`）僅放：
- token 定義
- reset / 基礎元素樣式
- 必要的全域套件覆寫
- 頁面與元件樣式以 `<style scoped>` 為主。
- 同一視覺模式避免在多頁重複手寫。

## 3.2 樣式責任歸屬

- App 殼層樣式歸 `App.vue`、`AppHeader.vue`
- 功能頁樣式歸 `modules/*`
- 可複用元件樣式歸 `components/*`

## 3.3 Element Plus 覆寫策略

- 優先使用外層 class 包裝元件做局部樣式控制。
- 只有必要時才用 `:deep` 覆寫內部結構。
- 任何全域 Element Plus 覆寫需在 `style.css` 留短註解說明原因。

## 4) 命名與 class 約定

命名需可讀、可理解意圖。

- 建議：`panel-row`、`kpi-card`、`related-item-meta`
- 避免：`box1`、`left`、`tmp`

建議採用：

- `block`
- `block-element`
- `block--modifier`

狀態 class：

- 使用語意名：`active`、`collapsed`、`mobile`、`resizing`、`warn`
- 避免把顏色值寫在 class 名稱（如 `red-text`）

## 5) 版面與間距標準

依現有程式可整理為：

- 頁面標準 padding：`24px`（桌面）
- 卡片/面板圓角：`10px` 到 `16px`
- 邊框基準：`1px solid var(--border)`
- 面板背景：白色或淺中性色（`#f8fafc` 區間）

一致性要求：

- 優先沿用既有 spacing 節奏再新增新數值。
- 新數值若在 3 個以上位置出現，應提升成 token。

## 6) 字體與文字層級

目前基礎字體：

- `"IBM Plex Sans", "Segoe UI", sans-serif`

規範：

- label/meta 文字使用 `var(--muted)` 或同級語意色。
- 全大寫 micro label 僅用於 KPI label 或 metadata。
- KPI 數值可強調，但同類元件須維持一致級距。

## 7) 狀態色語意一致性

同一狀態語意必須在以下場景保持一致：

- 地圖 polygon 樣式
- 表格 tag
- 抽屜詳情 tag
- KPI 風險提示

現有語意對應：

- neutral/pending：灰
- in-progress/warning：黃/橙
- completed/success：綠
- risk/overdue：紅

禁止每頁自行定義一套新狀態色。  
目前共用樣式工具：

- `modules/map/utils/statusStyle.js`
- `modules/map/utils/siteBoundaryStatusStyle.js`

## 8) 響應式設計標準

現有主要斷點：

- `1120px`（工具列/按鈕換行）
- `1100px`（header actions 換行）
- `900px`（側欄與地圖面板切換為 mobile 行為）
- `768px`（地圖工具列壓縮）

一致性要求：

- 新增複雜元件必須定義 mobile 行為。
- 地圖 overlay/panel 需確保觸控可操作，不遮擋關鍵控制。
- 行動端互動目標需具足夠點擊面積。
- Topbar 導覽在 mobile 需保留可橫向捲動，避免主要路由入口不可達。

## 9) 互動一致性

- 破壞性操作必須走確認對話框。
- Dialog footer 操作順序一致（`Cancel` + 主操作）。
- 地圖快捷鍵需避免衝突，並保持文件可查。
- Empty/loading/error 狀態優先沿用 Element Plus 慣例（`el-empty`、message）。
- 地圖 lot 級勾選屬於「地圖可見性控制」，不得直接改寫側欄清單資料集。

## 10) 可及性基線

最低要求：

- 純 icon 按鈕必須有 `aria-label`
- 互動元件需可鍵盤操作
- 文字對比在淺背景面板上需可讀
- 不能只靠 tooltip 提供關鍵操作資訊

## 11) 前端一致性 PR 檢查表

合併前請確認：

1. 有使用既有 token 與共用狀態語意。
2. 沒有重複樣式模式可抽離卻未抽離。
3. 受影響頁面 mobile 行為已定義並測過。
4. 狀態呈現符合 Work Lot / Site Boundary 既有語意。
5. 破壞性操作具備確認保護。
6. 沒有意外污染全域樣式。

## 12) 建議補充的樣式文件

1. `frontend-component-patterns.md`  
統一定義卡片、表格、工具列、Dialog、側欄等樣式範式。

2. `frontend-copy-style.md`  
規範 UI 文案語氣、命名、空狀態/錯誤/成功訊息模板。

3. `frontend-accessibility-checklist.md`  
按元件類型整理可測試的可及性檢核項目。
