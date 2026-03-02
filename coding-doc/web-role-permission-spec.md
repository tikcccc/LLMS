# Web Role Permission Spec

最後更新：2026-03-02  
狀態：待填充（依你後續指示再補內容）

## 1) 文件用途

本文件用於定義前端產品的「動作級」權限規範，提供：

- 角色能做什麼（Allow）
- 角色不能做什麼（Deny）
- 被阻擋時 UI/互動應如何表現（阻擋訊息、禁用、導轉）

## 2) 預期讀者

- 前端工程師（實作按鈕、路由守衛、禁用邏輯）
- 後端工程師（對齊 server-side permission）
- 測試人員（設計權限測試案例）
- 產品/PM（確認角色責任邊界）

## 3) 待填充內容（後續 agent 需補）

1. 角色定義與責任邊界  
至少包含：`SITE_ADMIN`、`SITE_OFFICER`、`FIELD_STAFF`。

2. 資源與動作清單  
按模組列出 `Route/Page/Component/Action`，例如：  
`Map` 的 `Create / Modify / Delete / Measure / Scope`。

3. 權限矩陣（核心）  
用表格定義每個角色對每個動作是 `Allow / Deny / Conditional`，並加註條件。

4. 阻擋行為規範  
定義當 `Deny` 時前端應採取的具體行為：  
`隱藏按鈕`、`禁用按鈕`、`點擊提示`、`路由導轉`。

5. 前後端一致性規範  
定義前端 UI 權限與後端硬權限的對齊原則，避免「前端可見但後端拒絕」。

6. 測試案例清單  
列出最小可驗證場景（每角色至少一組 allowed/denied 案例）。

## 4) 資料來源建議

- `coding-doc/web-functions.md`（功能與動作清單）
- `web/src/router/index.js`（路由守衛現況）
- `web/src/modules/map/*`（工具按鈕與互動行為）
- `web/src/stores/useAuthStore.js`（角色來源）

## 5) 完成標準

- 每個可操作功能都能在矩陣中找到對應權限
- 每個 `Deny` 都有明確阻擋行為規範
- 至少覆蓋路由層、頁面層、動作層三個層級
