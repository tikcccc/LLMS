# PM Business Alignment Checklist

## Input Template (Required Before Development)

Fill all fields first.

1. Business objective:
2. Target role/persona:
3. Scenario trigger (when and where this is used):
4. Current pain point:
5. Expected outcome:
6. Success signal (metric or observable result):
7. Data impact (new/changed fields, import/export impact):
8. Permission impact (roles allow/deny + blocked behavior):

## Capability Mapping

Map requirement to current baseline in `coding-doc/web-functions.md`.

| Item | Result |
| --- | --- |
| Existing capability match | Fully covered / Partially covered / Not covered |
| Affected route/module | e.g. `/map`, `/dashboard`, `/landbank/*` |
| Affected role flow | e.g. `SITE_OFFICER` map edit flow |
| Cross-doc impacts | `web-functions`, `web-data-contract`, `web-role-permission-spec`, etc. |

## Pre-Implementation Gate

Proceed only when all are true:

1. Objective is tied to at least one known business pain point.
2. Role and scenario are explicit.
3. Success condition is testable.
4. Scope boundary is clear (new feature vs enhancement vs refactor).

## Post-Implementation Consistency Checks

1. User-visible behavior matches stated business objective.
2. Role restrictions and deny behavior are consistent with PM intent.
3. Data semantics remain coherent across map, table, drawer, and export.
4. Updated docs reflect final behavior and business meaning.

## Output Format

Always return:

1. PM objective summary
2. capability mapping result
3. scope decision (`proceed` / `adjust` / `hold`)
4. doc update list
5. validation evidence and residual risks

