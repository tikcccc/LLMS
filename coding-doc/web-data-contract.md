# Web Data Contract

最後更新：2026-03-04  
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

## 3.1) 增量補充（2026-03-04）

本次先補上 `Section` 與 `PartOfSite` 的最小可用契約，供 map layer 與後續 API 對齊。

### Section（Map Feature Properties）

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `sectionId` / `sectionLotId` | string | Yes | section 業務識別碼（UI 以此做篩選與聚焦） |
| `sectionLotLabel` | string | No | 顯示標題，缺省回退 `sectionId` |
| `sectionGroup` | string | No | 分組（例如合約/區段分組） |
| `sectionSystemId` | string | Yes | 系統唯一鍵（幾何修改/快照識別） |
| `completionDate` | string(`YYYY-MM-DD`) | No | section 完工日期（可空） |
| `relatedPartIds` | string[] | No | 關聯 part id 清單（`section(1) -> part(n)`） |
| `partCount` | number | No | 關聯 part 計數（可由 `relatedPartIds.length` 推導） |

### PartOfSite（Map Feature Properties 增量）

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `sectionId` | string | No | 主要關聯 section id |
| `sectionIds` | string[] | No | 預留多關聯欄位；目前 UI 以第一個值作為主要顯示 |

### 關聯同步規則（目前前端實作）

1. 先使用 feature 顯式欄位（`sectionId` / `sectionIds` / `relatedPartIds`）建立關聯。  
2. 顯式欄位不足時，先對 `part geometry` 做「跨 part 去重疊差集」得到有效幾何；差集優先權以 feature 級面積判斷（較小 polygon 保留重疊區，較大 polygon 扣除），再以 `section geometry` 與有效幾何的交集面積（`>= 1.0 m²`）補齊關聯（避免拓撲微小噪音誤判）。  
3. 若某個 section 已有顯式 `relatedPartIds`，則該 section 的關聯集合以顯式映射為準，不再用 geometry fallback 擴張。  
4. Part UI 面積顯示採有效幾何面積；若存在重疊，需同時可回溯 raw area 與 overlap area。  
5. Section 幾何在高亮與 fallback 關聯判斷時，使用「section 去重疊後有效幾何」，避免 section 間重疊造成誤高亮與重複面積計算。  
6. 同步寫回：
- Section：`relatedPartIds`、`partCount`
- PartOfSite：`sectionId`、`sectionIds`

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
