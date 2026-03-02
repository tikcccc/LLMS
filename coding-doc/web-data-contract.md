# Web Data Contract

最後更新：2026-03-02  
狀態：待填充（依你後續指示再補內容）

## 1) 文件用途

本文件用於定義前端核心資料模型與驗證規則，讓後續開發在欄位、型別、enum、匯入匯出格式上有單一標準。

## 2) 預期讀者

- 前端工程師（表單、匯入匯出、store 正規化）
- 後端工程師（API payload 對齊）
- 測試工程師（資料校驗與錯誤案例）
- 數據整備人員（GeoJSON/JSON 檔案準備）

## 3) 待填充內容（後續 agent 需補）

1. 實體清單與關聯  
至少包含：`WorkLot`、`SiteBoundary`（必要時補 `User`、`Task`）。

2. 欄位字典（Field Dictionary）  
每個欄位需定義：  
`name`、`type`、`required`、`default`、`nullable`、`description`、`example`。

3. Enum 與語意  
明確定義類別與狀態 enum（如 Work Lot category/status），包含 alias 對映規則。

4. 驗證與正規化規則  
定義日期格式、布林/數字轉換、ID 格式、面積計算、空值處理等規則。

5. 匯入/匯出契約  
定義：
- Work Lot GeoJSON schema
- Site Boundary JSON/GeoJSON schema
- 匯入錯誤條件與錯誤訊息規格

6. 向後相容策略  
定義 legacy key/欄位如何映射到新契約（避免舊資料失效）。

7. 範例資料  
提供最小可用 payload、完整 payload、錯誤 payload 三類樣例。

## 4) 資料來源建議

- `web/src/shared/utils/worklot.js`
- `web/src/shared/utils/siteBoundary.js`
- `web/src/shared/utils/worklotGeojson.js`
- `web/src/shared/utils/siteBoundaryJson.js`
- `web/src/stores/useWorkLotStore.js`
- `web/src/stores/useSiteBoundaryStore.js`

## 5) 完成標準

- 每個欄位都有型別與驗證規則
- 每個 enum 都有合法值與顯示語意
- 匯入失敗情境有明確錯誤規範
- 可直接作為 API 與前端共用資料契約基礎
