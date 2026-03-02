---
name: coding-doc
description: Locate and route the correct files in `coding-doc/`, explain each document's role, and keep docs synchronized with feature changes in `web/`. Use when users ask where requirements/specs belong, request doc summaries, update functionality/API/data contracts/permissions, or need to keep documentation and implementation consistent.
---

# Coding Doc

Keep `coding-doc/` discoverable and aligned with actual behavior in `web/`.

## Workflow

1. Confirm both roots exist:
   - `coding-doc/`
   - `web/`
2. Refresh the markdown index for broad doc work:
   - `python3 skills/coding-doc/scripts/index_coding_docs.py coding-doc --output coding-doc/.doc-index.json`
3. Route request intent with `references/doc-map.md`.
4. Load only mapped files first; avoid bulk-reading all docs unless request scope is broad.
5. If functionality changed, apply `references/doc-sync-rules.md` and patch all impacted docs in one pass.
6. End with:
   - touched file list
   - per-file change summary
   - remaining gaps or TODOs

## Required Output Behavior

- Explain why each selected file is the correct target.
- For updates, provide explicit file-level change list.
- If code and docs conflict, state conflict and propose a source-of-truth file.
- Update every touched doc's `最後更新` date to current date.

## Quick Routing Defaults

- 功能清單、頁面能力、使用者可見行為：`coding-doc/web-functions.md`
- 模組分層、責任邊界、資料流：`coding-doc/web-architecture.md`
- 欄位規格、enum、驗證、匯入匯出契約：`coding-doc/web-data-contract.md`
- 角色權限矩陣與 deny 行為：`coding-doc/web-role-permission-spec.md`
- local-first 到 API 的遷移節奏與回滾：`coding-doc/web-api-transition-plan.md`
- DXF 轉換與 GIS 輸出落地：`coding-doc/dxf-geojson-guide.md`
- 前端一致性規範：`coding-doc/frontend-consistency.md`
- 前端元件模式：`coding-doc/frontend-component-patterns.md`
- PM 業務目標與功能對齊基線：`coding-doc/web-pm-business-alignment.md`

## Resources

- `scripts/index_coding_docs.py`: Build quick index for `coding-doc/*.md`.
- `references/doc-map.md`: File role map and routing table.
- `references/doc-sync-rules.md`: Change-type to document update matrix and consistency checks.
