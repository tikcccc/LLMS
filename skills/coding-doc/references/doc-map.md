# Coding Doc Map

Use this map to route requests to the minimum set of target files.

| File | Primary role | Typical request intent | Must update when |
| --- | --- | --- | --- |
| `coding-doc/web-functions.md` | Product feature inventory and per-route capability list | "目前有哪些功能？", "某頁面能做什麼？", "新增/移除某功能" | User-visible behavior, route feature set, workflow capability, shortcuts, export/import behavior changes |
| `coding-doc/web-architecture.md` | Frontend architecture layers, module ownership, data flow | "架構怎麼分層？", "責任邊界在哪？", "store/composable 如何協作" | New module boundaries, folder structure change, data flow changes, state responsibility changes |
| `coding-doc/web-data-contract.md` | Entity model, field dictionary, enums, validation rules, import/export payload rules | "欄位要怎麼定義？", "enum/驗證規則", "payload schema" | Added/renamed fields, enum changes, validation rules, import/export schema changes |
| `coding-doc/web-role-permission-spec.md` | Action-level permission matrix and deny behavior | "不同角色權限差異", "按鈕要隱藏還是禁用" | Role definitions, route guards, UI action allow/deny conditions, blocked behavior handling changes |
| `coding-doc/web-api-transition-plan.md` | Migration plan from local-first frontend to backend API-driven architecture | "怎麼接 API", "分期與回滾策略", "資料遷移與灰度" | API onboarding phases, rollout strategy, fallback policy, migration sequencing changes |
| `coding-doc/dxf-geojson-guide.md` | DXF to GeoJSON conversion process and script usage | "DXF 怎麼轉成可載入地圖格式", "轉換參數怎麼調" | Script flags/defaults, output paths, conversion prerequisites, quality control steps changes |
| `coding-doc/frontend-consistency.md` | Visual/system consistency baseline and CSS governance | "前端樣式規範", "token 應該放哪裡", "響應式規則" | Global token updates, CSS architecture rules, breakpoints, accessibility baseline, interaction consistency changes |
| `coding-doc/frontend-component-patterns.md` | Reusable page/component layout patterns | "卡片/表格/Dialog/側欄如何做才一致", "可抽共用元件" | Shared component pattern changes, page composition conventions, reusable structure updates |
| `coding-doc/web-pm-business-alignment.md` | PM view of business goals, user scenarios, and feature-business alignment rules | "這需求是否符合客戶業務", "從 PM 角度定義需求", "功能要怎麼和業務目標對齊" | Business goals changed, role scenarios changed, feature request template changed, business acceptance criteria changed |
| `coding-doc/web-business-reference.md` | Customer business background, requirement baseline, data availability, and glossary | "客戶業務背景是什麼", "BU/Operator 是什麼", "業務資料目前有什麼" | New business inputs, terminology updates, source-data updates from `reference-doc/`, business requirement refinements |

## Default Combination Rules

- Architecture + feature behavior question:
  - `coding-doc/web-architecture.md`
  - `coding-doc/web-functions.md`
- API behavior + payload/field semantics:
  - `coding-doc/web-api-transition-plan.md`
  - `coding-doc/web-data-contract.md`
- Role permissions + page/action behavior:
  - `coding-doc/web-role-permission-spec.md`
  - `coding-doc/web-functions.md`
- Frontend consistency + implementation details:
  - `coding-doc/frontend-consistency.md`
  - `coding-doc/frontend-component-patterns.md`
- New feature request + business intent alignment:
  - `coding-doc/web-pm-business-alignment.md`
  - `coding-doc/web-functions.md`
- Business Q&A / terminology / data-source clarification:
  - `coding-doc/web-business-reference.md`
  - `coding-doc/web-functions.md`
