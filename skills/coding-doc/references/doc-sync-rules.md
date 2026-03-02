# Doc Sync Rules

Use this matrix whenever a requested change modifies `web/` behavior.

## Change-Type to Document Matrix

| Change type | Required doc updates | Optional doc updates |
| --- | --- | --- |
| New route/page or route guard behavior | `coding-doc/web-functions.md`, `coding-doc/web-architecture.md` | `coding-doc/web-role-permission-spec.md` |
| Map operation/tool logic changed (draw/modify/delete/scope/measure) | `coding-doc/web-functions.md` | `coding-doc/web-role-permission-spec.md`, `coding-doc/web-architecture.md` |
| Data field/enum/validation/import-export rules changed | `coding-doc/web-data-contract.md` | `coding-doc/web-functions.md`, `coding-doc/web-api-transition-plan.md` |
| Role permission policy changed | `coding-doc/web-role-permission-spec.md`, `coding-doc/web-functions.md` | `coding-doc/web-architecture.md` |
| API integration status/phasing/rollback changed | `coding-doc/web-api-transition-plan.md` | `coding-doc/web-architecture.md`, `coding-doc/web-data-contract.md` |
| DXF conversion scripts or output path changed | `coding-doc/dxf-geojson-guide.md` | `coding-doc/web-functions.md` |
| Frontend global style/token/breakpoint rules changed | `coding-doc/frontend-consistency.md` | `coding-doc/frontend-component-patterns.md`, `coding-doc/web-architecture.md` |
| Reusable component/page patterns changed | `coding-doc/frontend-component-patterns.md` | `coding-doc/frontend-consistency.md` |
| PM business objective, role scenario, or feature acceptance semantics changed | `coding-doc/web-pm-business-alignment.md`, `coding-doc/web-functions.md` | `coding-doc/web-role-permission-spec.md`, `coding-doc/web-data-contract.md` |

## Required Sync Steps

1. Identify changed behavior from request/code diff.
2. Pick required docs from matrix.
3. Update each doc's impacted section and examples.
4. Set `最後更新` to current date on touched docs.
5. Verify no contradictory statements remain across related docs.
6. If conflict cannot be resolved immediately, add explicit TODO with owner and impacted files.

## Consistency Gate Before Finish

- Feature names in docs match real route/module names in `web/src`.
- Permission statements in `web-functions.md` and `web-role-permission-spec.md` do not conflict.
- Data field names in `web-data-contract.md` match import/export code paths.
- API migration status in `web-api-transition-plan.md` does not contradict current architecture.
- Frontend style rules in `frontend-consistency.md` and `frontend-component-patterns.md` remain aligned.
- PM business intent in `web-pm-business-alignment.md` is consistent with implemented user-facing behavior.
