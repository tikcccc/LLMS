# Skill Index

最後更新：2026-03-02  
用途：快速選擇要呼叫的 skill，不用每次都 `@` 全部。

## 已建立 Skills

| Skill | 主要用途 | 典型觸發情境 |
| --- | --- | --- |
| `coding-doc` | 定位 `coding-doc/` 目標文件、說明每份文件作用、功能更新後同步修訂對應文檔 | 問「這個需求應該改哪份文件？」、「幫我更新文件讓它跟功能一致」 |
| `frontend` | 依 `frontend-consistency.md` + `frontend-component-patterns.md` 實作/重構前端，維持架構一致與視覺品質 | 問「新增頁面/元件」、「重構樣式」、「修正前端一致性與響應式問題」 |
| `dxf-geojson-ops` | 處理 DXF -> GeoJSON 轉檔流程、參數調整、輸出檢查與前端路徑同步 | 問「幫我把 DXF 轉成前端可用資料」、「轉檔品質要怎麼驗證」 |
| `function-update` | 針對新功能或功能變更做端到端更新：實作、文件同步、驗證 | 問「新增一個功能」、「完善現有功能並驗證可用性」 |
| `pm-business-function-consistency` | 從 PM 業務視角檢查功能需求與客戶痛點/角色場景是否對齊，避免開發偏離業務目標 | 問「這個功能是否符合客戶業務需求」、「請先做業務一致性評估再開發」 |
| `business-context-qa-sync` | 回答業務問題時同時結合 `reference-doc` 原始資料 + 現有功能文檔，並在你補充業務時同步更新業務基線文件 | 問「這個業務需求代表什麼」、「某術語在客戶語境是什麼」、「我補充一段業務請更新文檔」 |
| `business-doc-index-update` | 偵測 `reference-doc/` 的業務資料更新，並路由同步到對應 `coding-doc` 文件與索引 | 問「有新 meeting/email/reference，幫我同步文件」、「檢查哪些業務文件更新後要改哪些文檔」 |

## 快速使用建議

1. 文檔定位、文檔同步、功能規格更新：`@coding-doc`
2. 前端 UI 實作、樣式一致性、美觀與可維護性：`@frontend`
3. DXF 轉檔與 GIS GeoJSON 驗證：`@dxf-geojson-ops`
4. 新功能新增/功能改造（含驗證與文檔同步）：`@function-update`
5. PM 提出新需求需先做業務對齊：`@pm-business-function-consistency`
6. 業務背景/術語/需求問答與知識更新：`@business-context-qa-sync`
7. 偵測 reference-doc 更新並自動路由文檔同步：`@business-doc-index-update`
8. 同時有前端改動 + 文檔同步：`@pm-business-function-consistency` -> `@function-update`（或 `@frontend`）-> `@coding-doc`

## 推薦下一批 Skills（可再建立）

| 建議 Skill 名稱 | 建議用途 | 為什麼值得建 |
| --- | --- | --- |
| `web-api-transition` | 專門維護 `web-api-transition-plan.md`，產生 As-Is/To-Be、phase 分期、回滾方案 | 目前該文件尚待填充，後續 API 化會高頻更新 |
| `role-permission-keeper` | 追蹤 route/component/action 權限變更，強制同步 `web-role-permission-spec.md` | 降低「UI 可操作但後端拒絕」與權限漂移風險 |
| `frontend-a11y-guard` | 針對互動元件進行可及性基線檢查（aria、鍵盤、對比） | 可降低 UI 功能可用性與合規風險 |
