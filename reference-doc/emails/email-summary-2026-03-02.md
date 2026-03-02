# Email Requirements Digest

最後更新：2026-03-02
來源：`reference-doc/emails/email`
用途：整理 2026-02-05 至 2026-02-26 的 email 往來，抽取可落地需求與待確認事項。

## 1) 最新結論（2026-02-26）

1. 客戶要求 Demo 的提醒（alerts）先以網站顯示為主。
2. 客戶要求每個地塊可輸入至少以下欄位：`Part of the Site`、`access date`、`alert on expiry of access dates`。
3. 團隊已回覆多數欄位已上線，並確認提醒渠道（email 或網站）可再議；客戶當下明確偏好網站顯示。

## 2) 時間線整理

| 日期 | 發件人 | 主要內容 | 對需求的含義 |
| --- | --- | --- | --- |
| 2026-02-26 17:33 | Humphrey Wu | 詢問 2/13 後更新，要求可輸入 `Part of the Site`、`access date`、到期提醒 | 明確提出資料欄位與提醒需求 |
| 2026-02-26 18:21 | Khalil Chiu | 回覆多數欄位已實作，地圖已有色彩告警與狀態；通知方式可選 email 或網站 | 需定義提醒渠道策略 |
| 2026-02-26 18:32 | Humphrey Wu | 回覆 Demo 先顯示網站提醒，並等待下週一進度更新 | 渠道決策（Demo 階段）已偏向 Web In-App |
| 2026-02-13 | Khalil Chiu | C2 邊界已導入，新增 KPI、地圖編修、JSON 匯入匯出、PDF/Excel 匯出 | 基礎平台功能可支撐進度追蹤 |
| 2026-02-11 / 2026-02-10 | Khalil Chiu | 提出土地屬性、Timeline（Assess/Handover/Completion/Float）、進度告警與進度條 | 時程與告警語意已進入資料模型 |
| 2026-02-09 | Khalil Chiu | 新增 Scope Draw 與清單聯動高亮 | 地圖主流程（圈選 -> 清單 -> 定位）已建立 |
| 2026-02-07 / 2026-02-05 | Khalil Chiu | DGN 圖層拆分、INT 圖層可切換、邊界清單化 | 圖層治理與資料導入能力成形 |

## 3) 需求清單（由 Email 萃取）

| 優先級 | 需求 | 來源 |
| --- | --- | --- |
| P0 | 每地塊維護 `Part of the Site` 與 `access date` | 2026-02-26 客戶信件 |
| P0 | `access date` 到期提醒，且 Demo 於網站內顯示 | 2026-02-26 往返信件 |
| P1 | 提醒渠道策略（In-App vs Email）可配置 | 2026-02-26 開發方回覆 |
| P1 | 持續優化 `Project Timeline` 與 `Progress Tracking` | 2026-02-13 進度信 |

## 4) 待確認事項

1. `expiry of access date` 的業務定義：是逾期當天提醒、提前 N 天提醒，或兩者都要。
2. 提醒粒度：以 `Work Lot`、`Site Boundary` 或 `Part of Site` 為主體。
3. Web 提醒呈現位置：地圖圖徵、列表欄位、Dashboard 卡片、全站通知中心是否都需要。
4. Email 通知是否為第二階段（非 Demo）需求。

## 5) 建議對應文件

1. `coding-doc/web-business-reference.md`：更新業務語意與來源追溯。
2. `coding-doc/web-pm-business-alignment.md`：更新 PM 驗收要件與提醒渠道決策。
3. `coding-doc/web-functions.md`：標註目前已支援與未支援差距（尤其 access-date 到期提醒）。
