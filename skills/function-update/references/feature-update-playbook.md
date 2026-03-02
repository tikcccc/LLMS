# Feature Update Playbook

Use this playbook when new functions are requested or existing ones change.

## 1) Change Classification

Pick one primary type first:

1. New feature: new route/page/action/capability.
2. Behavior change: same feature, different logic/flow/result.
3. Enhancement/refactor: maintain behavior but improve UX/performance/maintainability.
4. Removal/deprecation: retire feature or restrict availability.

## 1.1) PM Alignment Input (Mandatory)

Before coding, collect from `coding-doc/web-pm-business-alignment.md`:

1. business objective
2. target role and scenario
3. expected measurable outcome

## 2) Code Impact Scan

Minimum scan targets:

- `web/src/router/index.js` (routing and guard impact)
- `web/src/modules/**` (page/module behavior)
- `web/src/stores/**` (state model and persistence impact)
- `web/src/shared/utils/**` (data normalization/transform/export impact)

## 3) Required Doc Sync

Use this matrix after code changes.

| Change type | Required docs | Optional docs |
| --- | --- | --- |
| New page/route/action | `coding-doc/web-functions.md`, `coding-doc/web-architecture.md` | `coding-doc/web-role-permission-spec.md` |
| Data model / payload / enum change | `coding-doc/web-data-contract.md` | `coding-doc/web-api-transition-plan.md`, `coding-doc/web-functions.md` |
| Permission rule change | `coding-doc/web-role-permission-spec.md`, `coding-doc/web-functions.md` | `coding-doc/web-architecture.md` |
| API integration behavior change | `coding-doc/web-api-transition-plan.md` | `coding-doc/web-architecture.md`, `coding-doc/web-data-contract.md` |
| Frontend UX pattern/consistency change | `coding-doc/frontend-consistency.md`, `coding-doc/frontend-component-patterns.md` | `coding-doc/web-functions.md` |

Update `最後更新` date on touched docs.

## 4) Validation Checklist

1. Feature path is reachable from UI entry point.
2. Happy path works end-to-end.
3. Error/empty state is handled.
4. Permission edge case is verified (if applicable).
5. Desktop/mobile behavior is validated for UI changes.
6. Imports/exports/reporting behavior still works (if affected).
7. Updated docs match implemented behavior.

## 5) Completion Output Format

Always provide:

- feature summary
- code files changed
- doc files changed
- validation performed (command/manual)
- unresolved risks or follow-up tasks
