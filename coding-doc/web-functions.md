# Web Functions

最後更新：2026-03-04  
範圍：依 `web/` 現有程式實作整理的前端 demo 功能目錄

## 1) 產品功能總覽

目前網站可視為「土地管理作業駕駛艙」，功能可分成 5 類：

1. 空間作業：在地圖上進行 scope、測距、繪製、修改、刪除
2. KPI 分析：交地進度、逼遷風險、低浮動月數、逾期趨勢
3. 清單作業：Work Lots / Site Boundaries / Part of Sites / Sections 的搜尋、篩選、編修/檢視
4. 資料交換：JSON 匯入匯出、Excel/PDF 報表輸出
5. 角色模擬：前端角色切換（Admin/Officer/Field Staff）

## 2) 路由功能清單

## `/dashboard` 分析儀表板

- KPI 卡片：
- KPI Scope Coverage
- `% Land Handover`
- `% Land Need Force Eviction`
- `% Land with Float < X Months`
- Overdue Site Boundaries（含 aging bucket）
- 篩選：
- Date Range：`12M / YTD / ALL`
- Float threshold（月）
- 圖表：
- Work Lot 分類甜甜圈圖
- Site Boundary 管理狀態長條圖
- Work Lot 作業狀態長條圖
- 12 個月 KPI 趨勢線
- Recent Work Lots 表格與「View All」快捷入口

## `/map` 地圖作業頁

- 地圖顯示：
- HK80 底圖 + EN 標籤
- Drawing Layer（`int-land.geojson`）
- Part of Sites Layer（`/data/geojson/part-of-sites/index.json` -> `part-*/<part>.geojson`）
- Sections Layer（`/data/geojson/sections/index.json` -> `section-*/<section>.geojson`）
- Site Boundary / Work Lot 向量圖層
- 圖層開關：
- Basemap/Labels
- Drawing Layer（整層單一開關）
- Part of Sites（part 級多選白名單，支援多組 PART，例如 `1/2/7/8/9/11/13/3456`）
- Sections（section 級多選白名單）
- Site Boundary（lot 級多選白名單）
- Work Lots（lot 級多選白名單）
- 跨圖層可同時勾選多個 lot，僅影響地圖可見性
- 瀏覽工具：
- Pan/select
- Measure distance
- Scope 工具：
- 多邊形 scope
- 圓形 scope
- Scope 結果清單（sections + part of sites + work lots + site boundaries）
- 左側常駐 Sidebar（桌機）整合 Layers / Part of Sites / Sections / Work Lots / Site Boundaries / Scope Results，右側保留較大地圖可視區
- Sidebar 支援整體收納/展開（桌機）
- Layers 分頁中的 `Part of Sites / Sections / Site Boundaries / Work Lots` 清單支援各自收合/展開
- 行動端 sidebar 以底部 sheet 顯示，可展開/收合
- 繪圖/編輯工具（角色受限）：
- Draw target 下拉選單（Work Lot / Site Boundary / Part of Sites / Section）
- 建立 Work Lot（多邊形/圓）
- 建立 Site Boundary（多邊形/圓）
- 建立 Part of Sites（多邊形/圓）
- 建立 Section（多邊形/圓）
- 幾何修改並儲存
- 刪除要素（含確認）
- Part of Sites 幾何變更會快照到 localStorage（`ND_LLM_V1_part_of_sites`），重新整理後可延續
- Sections 幾何變更會快照到 localStorage（`ND_LLM_V1_sections`），重新整理後可延續
- Draw 模式選擇 `Part of Sites` 時提供 `Export GeoJSON` 匯出目前地圖圖徵
- Draw 模式選擇 `Section` 時提供 `Export Sections` 匯出目前地圖圖徵
- 編輯目標支援 Work Lot / Site Boundary / Part of Sites / Section；不支援 Drawing Layer 的 CAD 實體級操作（線段、block）
- 詳情抽屜：
- Work Lot 詳情、關聯 site boundary、編輯/刪除
- Site Boundary 詳情、進度、關聯 work lot 篩選
- Part of Sites 詳情（`System ID`、`accessDate`、有效面積；若偵測到跨 part 重疊，會顯示 raw area 與排除重疊面積）
- Section 詳情（`System ID`、`completionDate`、`related part count`）
- 右側抽屜 header 支援 `Focus` 按鈕：可快速聚焦到目前 lot/site/part/section，並切換成僅顯示該圖徵（隱藏其他 lot/site/part/section）
- Work Lot 抽屜狀態標籤移至 title 下方，避免與操作按鈕擠壓
- `Focus` 為可切換狀態：啟用後按鈕高亮並可改為 `Cancel Focus`；若使用者改動側欄圖層/篩選導致非 focus 顯示，會自動退出 focus 狀態（不提示）
- 抽屜為 non-modal：開啟後仍可點擊地圖、切換其他 lot/site/part 或使用頁面其他導覽按鈕
- Part of Sites 標題顯示對應 `Part ID`；`System ID` 以公式自動分配（不與標題重名）
- 點選 Part of Sites 可交互高亮，並在側欄/抽屜顯示明細；高亮與面積均使用「去重疊後有效幾何」，確保不同 part 不重疊（含內含情境，例如 `10A` 會扣除內含 `10B`）
- Part 去重疊規則：優先保留被包含 part 的範圍；其餘重疊以 `Part ID` 自然序較大者保留，確保結果穩定且可重現
- 點選 Section 可交互高亮，並可在抽屜查看關聯 Part of Sites
- Section 與 Part of Sites 已預留 `section (1) -> part (n)` 關聯欄位，支援由 geometry 與顯式欄位同步關聯；geometry fallback 使用「part 去重疊後有效幾何」做面積交集判斷
- 搜尋與定位：
- 側欄 Part of Sites 搜尋
- 側欄 Sections 搜尋
- 側欄 Work Lot 搜尋
- 側欄 Site Boundary 搜尋
- 路由 query 聚焦：`?workLotId=`、`?siteBoundaryId=`、`?partOfSiteId=`、`?sectionId=`
- 若目標 lot 因白名單被隱藏，定位時會自動加入白名單並顯示
- 快捷鍵：
- `V` pan、`L` measure、`D` scope、`C` circle scope
- `P` polygon、`O` circle lot、`M` modify、`X` delete、`ESC` cancel

## `/landbank/work-lots` Work Lots 清單

- 表格清單與欄位資訊展示
- 關鍵字 fuzzy search
- 篩選：
- Status
- Category
- 列選取
- 編輯 Work Lot（dialog）
- 刪除 Work Lot（confirm dialog）
- 「View on Map」跳轉
- JSON 交換：
- 匯入 GeoJSON（確認後覆蓋現有資料）
- 匯出目前篩選或已選資料
- 報表輸出：
- Excel
- PDF

## `/landbank/site-boundaries` Site Boundaries 清單

- 表格清單 + 進度顯示 + 關聯 work lot 提示
- 搜尋 + 狀態篩選
- 編輯 Site Boundary（dialog）
- 「View on Map」跳轉
- JSON 交換：
- 匯入 JSON（確認後覆蓋現有資料）
- 匯出目前篩選或已選資料
- 報表輸出：
- Excel
- PDF

## `/landbank/part-of-sites` Part of Sites 清單

- 從 `/data/geojson/part-of-sites/index.json` + 各 group index 載入 part 清單
- 搜尋 + group 篩選
- 表格檢視：
- Part ID
- Group
- System ID（以既有規則顯示）
- Feature Count / Geometry Types / Source DXF / Generated At
- 「View on Map」跳轉（`?partOfSiteId=`）

## `/landbank/sections` Sections 清單

- 從 `/data/geojson/sections/index.json` + 各 group index 載入 section 清單
- 搜尋 + group 篩選
- 表格檢視：
- Section ID
- Group
- System ID（以既有規則顯示）
- Related Parts / Feature Count / Geometry Types / Source DXF / Generated At
- 「View on Map」跳轉（`?sectionId=`）

## `/users` 使用者頁

- 靜態 demo 表格
- 有「Add User」按鈕，但目前無後端流程

## `/admin/work-lots`

- Work Lot 作業表格
- Excel 匯出
- 受路由守衛保護（僅 `SITE_ADMIN`）

## 3) 全站共用功能

- 角色切換（`AppHeader`）
- 重置 demo 資料（清 localStorage 後 reload）
- Topbar 導覽框架（整站路由按鈕位於 `AppHeader`）
- 香港時區日期時間格式化

## 4) 狀態管理與持久化

透過 Pinia + persisted state 實作，主要 key：

- `ND_LLM_V1_auth`
- `ND_LLM_V1_ui`
- `ND_LLM_V1_worklots`
- `ND_LLM_V1_site_boundaries`
- `ND_LLM_V1_part_of_sites`
- `ND_LLM_V1_sections`

主要責任：

- `auth`：角色狀態
- `ui`：地圖工具、選中對象、圖層顯示、lot 級白名單篩選狀態
- `workLots`：Work Lot 正規化資料與 CRUD
- `siteBoundaries`：Site Boundary 正規化、載入、合併、幾何補全

## 5) 資料契約與轉換功能

- ID 生成與正規化：
- Work Lot ID 含類別碼
- Site Boundary ID 具固定前綴
- 匯入資料清洗：
- 類別/狀態 alias 正規化
- 日期/文字/布林/數字正規化
- 幾何與面積正規化
- 時程欄位（現況）：
- Work Lot：`assessDate`、`dueDate`、`completionDate`、`floatMonths`
- Site Boundary：`assessDate`、`plannedHandoverDate`、`completionDate`
- 自動關聯：
- Work Lot geometry -> Site Boundary IDs（空間比對）
- KPI 推導：
- 由關聯 work lots 推導 boundary 狀態（pending / in-progress / risk / handed-over）

## 6) 權限矩陣（前端 demo）

| 功能 | SITE_ADMIN | SITE_OFFICER | FIELD_STAFF |
| --- | --- | --- | --- |
| 地圖瀏覽與 scope | Yes | Yes | Yes |
| 測距 | Yes | Yes | Yes |
| 地圖要素建立/修改/刪除 | Yes | Yes | No |
| 清單頁編輯 | Yes | Yes | UI 目前仍可操作部分清單編輯；地圖編輯已封鎖 |
| 進入 `/admin/work-lots` | Yes | No（導向 `/map`） | No（導向 `/map`） |

註：目前為純前端權限控制，尚未有後端強制驗證。

## 7) Demo 限制與未實作能力

- 無真實登入與身份驗證
- 無後端 API CRUD
- 無伺服器端權限驗證
- 無多人併發衝突解決
- 無審計軌跡/操作歷史
- 無附件/媒體流程
- 無審批型 workflow 引擎
- 無 CAD 實體級修圖工具（刪單條線段、刪 block、逐段補線/連線）
- 尚無跨實體完整契約的 `partOfSite`/`sectionOfWorks` 時程模型（目前已支援 map feature 層級欄位與 `section -> parts` 關聯）
- 無「`access date` 到期提醒」專屬規則（目前逾期語意基於 `dueDate`/`plannedHandoverDate`）
- 無通知渠道策略配置（web in-app / email）

## 8) 近期業務需求對照（2026-03-02）

依據 `reference-doc/emails/email` 與 `reference-doc/2026-3-2 Project-timeline information/*`：

| 業務需求 | 現況判定 | 說明 |
| --- | --- | --- |
| 每地塊維護 `Part of the Site` + `access date` | 部分支援 | Part of Sites layer 已有 `accessDate` 欄位與明細顯示；尚未貫通到 Work Lot 正式資料契約 |
| `part of site` 圖面需手工修補（刪線段/block、補線） | 未支援 | 現有 map 工具只支援 Work Lot/Site Boundary 幾何編修，非 CAD 實體編修 |
| `access date` 到期提醒在網站顯示（Demo） | 部分支援 | 已有地圖與清單逾期視覺語意，但不是以 `accessDate` 觸發 |
| `section of works` 對應 `sectional completion date` | 部分支援 | 已新增 Section layer、`completionDate` 欄位與 `section -> part` 關聯；合約 offset 規則仍待補 |
| 進度與風險圖像化（色彩/趨勢/KPI） | 已支援 | Dashboard + Map 已提供風險狀態與趨勢呈現 |

## 9) 建議補充的功能文件

1. `web-role-permission-spec.md`  
定義到「動作級」的角色權限矩陣與阻擋行為預期。

2. `web-data-contract.md`  
定義 Work Lot / Site Boundary 必填欄位、enum、匯入錯誤規則。

3. `web-api-transition-plan.md`  
定義目前 local-first 流程如何銜接未來後端 API。

4. `frontend-component-patterns.md`  
整理可複用的頁面/卡片/表格/Dialog/側欄模式，減少樣式與交互漂移。

5. `web-pm-business-alignment.md`  
從 PM 角度定義業務目標、角色場景與功能對齊規則，避免需求與客戶業務脫節。

6. `web-business-reference.md`  
集中整理客戶業務背景、需求、資料口徑與術語，作為業務問答與需求澄清基線。
