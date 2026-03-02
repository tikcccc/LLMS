# Web API Transition Plan

最後更新：2026-03-02  
狀態：待填充（依你後續指示再補內容）

## 1) 文件用途

本文件用於規劃目前 local-first 前端（Pinia + localStorage + 靜態 GeoJSON）如何平滑遷移到後端 API 驅動架構。

## 2) 預期讀者

- 前端工程師（資料來源切換與相容策略）
- 後端工程師（API 設計與上線節奏）
- DevOps/架構師（環境、版本、灰度策略）
- PM/測試（里程碑與驗收節點）

## 3) 待填充內容（後續 agent 需補）

1. 現況盤點（As-Is）  
逐頁列出目前資料來源、寫入路徑、localStorage key、匯入匯出流程。

2. 目標狀態（To-Be）  
定義 API 化後的資料流、權限流、錯誤流與快取策略。

3. 功能對應矩陣  
把現有每個前端功能映射到 API（endpoint / method / request / response）。

4. 遷移分期計畫  
建議分期：  
`Phase 0 封裝 API 層` -> `Phase 1 只讀查詢` -> `Phase 2 寫入改造` -> `Phase 3 下線 local fallback`。

5. 相容與回滾策略  
定義 feature flag、雙寫/單寫策略、失敗回滾條件與操作步驟。

6. 資料遷移策略  
舊 localStorage 與匯入資料如何遷移到伺服器；衝突如何解決。

7. 驗證與驗收  
定義每期驗收標準、關鍵測試場景、性能與穩定性指標。

## 4) 資料來源建議

- `coding-doc/web-architecture.md`
- `coding-doc/web-functions.md`
- `web/src/main.js`
- `web/src/stores/*.js`
- `web/src/shared/utils/*Geojson.js`
- `web/src/shared/utils/reportExport.js`

## 5) 完成標準

- 每個現有功能都有 API 遷移路徑
- 每期都有可執行的交付與回滾方案
- 明確定義「何時可以移除 local-first 依賴」
