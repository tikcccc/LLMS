# Web Business Reference

最後更新：2026-03-06  
狀態：啟用中（業務問題與需求澄清唯一業務基線）

## 1) 文件用途

本文件集中整理客戶業務背景、核心需求、資料口徑與術語，供產品經理與開發在功能設計時對齊業務。  
當使用者提出業務描述或業務新需求時，必須同步更新本文件，再進入功能設計與開發。

## 2) 來源與口徑規則

1. 業務來源只採用 `reference-doc/` 內容：
   - `reference-doc/meeting-record/1st_meeting_record.md`
   - `reference-doc/meeting-record/predemo_meeting_record.md`
   - `reference-doc/2026-3-2 Project-timeline information/*`（截圖、WhatsApp 訊息、PDF）
   - `reference-doc/emails/email`
   - `reference-doc/emails/email-summary-2026-03-02.md`
2. 不再使用舊 `doc/docs/` 項目背景、舊計劃、舊功能敘述作為業務依據。
3. 功能現況以 `coding-doc/web-functions.md` 與 `web/` 現有程式為準。

## 3) 客戶業務背景（整理）

核心背景：

- 收地與移交流程涉及多方（CEDD、LandsD、承建商、現場團隊）協作與大量資料對照。
- 一個地段可能涉及多個 Operator/BU/Household，人工判斷容易錯誤。
- 現場與管理需要同一張地圖語意來判斷「已交地」「未清場」「高風險延誤」。
- 2026-03-02 新增時程語意：`part of site` 與 `section of the works` 地理邊界固定，但實際日期需由 C2 批出後的起算日推導。
- 2026-03-05 新增分層語意：`site boundary`、`work lot`、`part of site`、`section of works` 皆需按 contract package 拆分，並以單一 workspace 切換分開作業，不做同圖對照。
- 2026-03-06 新增 contract 補充：除 `C1`、`C2` 外，客戶再補一層 `C3`；其中 `HKSTP No.5` 與 `HKSTP No.7` 屬後續 contracts，需歸入 `C3`，`HKSTP No.1` 維持 `C1`。

客戶要解決的關鍵問題：

1. 一鍵查詢：點選地塊後可快速知道牽涉的 Stakeholders（BU/Operator/Household）。
2. 狀態可視化：不同狀態應有清晰顏色或標示（例如未搬遷紅、已搬遷綠）。
3. 圖層關聯：不同業務層（地段、工程、Operator）可在同一位置語意下對照。
4. 風險前置：能提前識別未清場導致工程延誤風險（Timer/Alert 概念）。
5. 提醒一致：Demo 階段提醒先以網站內顯示（in-app alerts）為主。

## 4) 客戶業務需求清單（按優先語意）

| 類型 | 業務需求 | 來源摘要 |
| --- | --- | --- |
| P0 | 以地圖做主工作介面，支援範圍選取與地塊點選查詢 | 客戶強調「一撳就知道」 |
| P0 | 可看到地塊涉及的 BU/Operator/Household 與狀態 | 多次提及 Stakeholder 清單需求 |
| P0 | 支援多對多關聯（Operator 跨多 Lot、Lot 含多 Operator） | 會議明確說明一對一不成立 |
| P0 | 支援 CAD/圖層導入，避免純手工在 Web 重畫 | 客戶明確要求 import 後自動識別 polygon |
| P0 | 每地塊需要可維護 `Part of the Site`、`access date` | 2026-02-26 客戶 email 明確要求 |
| P0 | `access date` 到期提醒需在 Demo 先顯示於網站 | 2026-02-26 客戶回覆明確要求 web 顯示 alerts |
| P0 | 時程模型需同時支持 `part of site -> access date` 與 `section of works -> sectional completion date` | 2026-03-02 Victor WhatsApp 時程說明 |
| P0 | `site boundary`、`work lot`、`part of site`、`section of works` 需按 `C1 / C2 / C3` 分層（單一 workspace 切換，不同圖對照） | 2026-03-05、2026-03-06 使用者補充（客戶要求） |
| P1 | 可顯示交地進度比例、處理中、困難個案 | 期望管理層可直接看全局進度 |
| P1 | 支援不同層級資料可視化與圖層開關 | 提到多圖層聯動與位置關聯 |
| P1 | 需可依合約規則計算 section 完工日期（多為相對 access/start date 天數） | 2026-03-02 X5 / Contract Data Part One 表格 |
| P1 | 提醒渠道策略需支援後續擴展（web in-app / email） | 2026-02-26 開發方回覆提到渠道可選 |
| P2 | 告警/Timer 對接工程節點風險 | 客戶提到 long-term alert 方向 |

## 5) 業務資料與可用性口徑

| 資料類型 | 目前狀態 | 注意事項 |
| --- | --- | --- |
| Soft Copy Plans（圖面） | 可提供（分北/南等區） | 多為示意性，非精測級坐標 |
| Land Plan / BU-Household 標註圖 | 可逐步提供 | 欄位與格式可能不一致，需先做標準化 |
| C2 `part of site` drawings | 已提供一套（對應 access date） | 用於定義固定地理邊界；圖面存在局部缺線/錯亂與 block 干擾，轉 GeoJSON 前需先清理與補線；`part name`、`access date` 需人工補錄 |
| C2 `section of works` drawings | 客戶表示將再提供一套（對應 sectional completion） | 需與 part of site 同步做映射 |
| C1/C2/C3 分層（Site/Work Lot/Part/Section） | 客戶口頭要求四類圖徵要按 contract package 拆層；目前已明確 `C1`、`C2`、`C3` 三層，其中 `HKSTP No.5/No.7` 歸 `C3` | 需確認各 contract 原始圖面齊備度、同一業務 ID 的跨階段對應規則、缺失資料補錄流程 |
| Contract Data 時程表（X5、Section 10-13） | 已在 2026-03-02 訊息提供節錄 | 多數日期為「起算日 + 天數」規則，非固定絕對日曆日期 |
| EPCS 內部資料 | 可能可參考 | 輸出格式不固定，未必可直接匯入 |
| 精準坐標/GPS | 現況偏參考性 | 現場仍需人工判定，不可當唯一依據 |

## 6) 業務術語詞彙表（Glossary）

| 術語 | 定義（業務語意） | 系統對應建議 |
| --- | --- | --- |
| Land Lot | 法定/地政地段邊界，屬法律與地政口徑 | 地圖基礎參考層；在現有 web 可映射為作業地塊參照資料 |
| INT Lands / 創科地 | 客戶提到的特定收地區塊集合（示例 7 塊） | 可作為上層分區或專案分組視圖 |
| Work Lot | 實際作業管理單位，通常與工程執行和交地追蹤相關 | 現有系統核心實體之一（`WorkLot`） |
| Site Boundary | 現場或管理邊界單位，用於進度與關聯彙總 | 現有系統核心實體之一（`SiteBoundary`） |
| Operator | 佔用或使用地塊的單位（常對應實際清場對象） | 可映射為 Stakeholder 層級，與 Work Lot/Land Lot 多對多關聯 |
| BU (Business Undertaking) | 業務經營實體，常以格狀/單元形式呈現 | 可作為 Operator 的細分實體或同級實體（待資料契約落實） |
| Household | 住戶個體，可能與 BU 並存 | 可視為 Stakeholder 明細資料 |
| Handover | 地塊或單元已交付工程方可施工 | 狀態語意應可在地圖、清單、報表一致呈現 |
| Site Clearance | 清場完成與否，影響後續工程是否可啟動 | 可作為風險/阻塞判斷關鍵條件 |
| Proposed Works | 規劃工程範圍圖層 | 與地段層、作業層需可同圖對照 |
| Part of Site | C2 合約切分的地理區段，對應 access date 管理 | 建議建成可選值欄位，與 Work Lot/Site Boundary 關聯 |
| Access Date | 某 part/site 可進場或可用的起算日期 | 建議成為提醒規則的主時程基準 |
| Section of Works | 工程分段範圍，用於定義 sectional completion | 建議與 part of site 並存，不互相覆蓋 |
| Sectional Completion Date | 某 section 的完工節點，多為相對天數計算 | 建議由規則引擎（offset）推導，支援覆核與覆寫 |
| C1 / C2 / C3 | 客戶用於切分同一業務對象的合約/階段維度；目前已明確 `HKSTP No.1` 在 `C1`，`HKSTP No.5`/`HKSTP No.7` 在 `C3` | 建議以 `contractPackage`（`C1`/`C2`/`C3`）作為四類圖層共通欄位與第一層篩選維度 |

## 7) 業務語意對應現有 Web 功能

| 業務訴求 | 現有 Web 可支撐項 | 缺口/後續方向 |
| --- | --- | --- |
| 地圖主導 + 範圍查詢 | `/map` 的 scope、搜尋、圖層控制 | Stakeholder（BU/Operator）細粒度資料尚未完整落地 |
| 進度與風險可視化 | `/dashboard` KPI、boundary 狀態彙總 | 更細的工程節點告警邏輯待補充 |
| Access Date 到期提醒 | 現有已有顏色狀態與逾期視覺語意（`dueDate`/`plannedHandoverDate`） | 尚未有明確 `accessDate` 欄位與「access date expiry」專屬規則 |
| Part of Site / Section of Works 雙軸時程 | 現有有 `assessDate`、`plannedHandoverDate`、`completionDate`、`float` | 尚未有 `partOfSite`、`sectionOfWorks` 結構與 section 完工日期計算規則 |
| C2 圖面清理與邊界修補 | 既有 DXF 轉 GeoJSON 腳本可透過 `close/snap/bridge tolerance` 修補小斷裂 | Map 工具欄尚未提供 CAD 實體級編輯（刪線段/刪 block/逐段補線），需前處理或新增編輯能力 |
| C1/C2/C3 分層作業（Site/Work Lot/Part/Section） | 現有已支援四類實體 `contractPackage` 欄位與 map `Contract Workspace` 單一切換 | 仍需後續確認各 contract 原始圖面齊備度與跨 phase 業務 ID 對應規則 |
| 匯出與溝通 | JSON/Excel/PDF 匯出 | 匯出欄位需與客戶最終業務口徑再對齊 |
| 提醒渠道（Web/Email） | Web 端已可做 in-app 視覺提醒（地圖與清單語意） | 尚未有可配置通知渠道與 email 發送流程 |
| 角色邊界 | 角色切換與部分權限控制 | 後端硬權限與審計仍未導入 |

## 8) 新業務輸入更新規範（強制）

當使用者補充業務描述時，必須同步更新：

1. 本文件對應段落（背景/需求/資料/術語/缺口）。
2. `最後更新` 日期。
3. 「增量業務紀錄」表格。

若新增描述影響功能定義，需再同步：

- `coding-doc/web-functions.md`
- `coding-doc/web-data-contract.md`
- `coding-doc/web-role-permission-spec.md`
- `coding-doc/web-pm-business-alignment.md`

## 9) 增量業務紀錄

| 日期 | 來源 | 新增/修正內容 | 影響文件 |
| --- | --- | --- | --- |
| 2026-03-02 | `reference-doc/meeting-record/1st_meeting_record.md`、`reference-doc/meeting-record/predemo_meeting_record.md` | 建立初版業務背景、需求、資料口徑與術語 | 本文件（初版） |
| 2026-03-02 | `reference-doc/emails/email`、`reference-doc/2026-3-2 Project-timeline information/*` | 新增 `part of site`/`access date`、`section of works`/`sectional completion` 時程語意；確認 Demo 以網站提醒為主 | 本文件、`web-pm-business-alignment.md`、`web-functions.md` |
| 2026-03-02 | 使用者補充（Codex 對話） | 補充 `part of site` drawings 目前有缺線/錯亂需人工修圖；確認 `part name` 與 `date` 需人工輸入 | 本文件、`web-pm-business-alignment.md`、`web-functions.md` |
| 2026-03-05 | 使用者補充（Codex 對話） | 客戶確認 `site/work lot/part/section` 需拆為 C1/C2，並改為單一 workspace 切換（不做 C1/C2 對照） | 本文件、`web-pm-business-alignment.md`、`web-functions.md` |
| 2026-03-06 | 使用者補充（Codex 對話） | 客戶補充新增 `C3` contract；`HKSTP No.5`、`HKSTP No.7` 歸 `C3`，`HKSTP No.1` 維持 `C1` | 本文件、`web-pm-business-alignment.md`、`web-functions.md`、`web-data-contract.md` |

## 10) 完成標準

- 業務問題可透過本文件快速定位答案與資料來源。
- 新功能需求在開發前可追溯到明確業務目標與術語。
- 每次業務增量輸入都有更新紀錄，避免口徑漂移。
