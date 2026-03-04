---
name: code-structure-split
description: Detect and split bloated code files into clear, maintainable modules with sensible naming and placement while preserving behavior. Use when a file in `web/` (or related code areas) becomes too large or mixed in responsibility and starts blocking safe follow-up changes, optimization, or multi-agent collaboration.
---

# Code Structure Split

Split oversized or overloaded files with low-risk structural refactors, so later feature edits become faster and safer.

## Workflow

1. Identify refactor target and behavior boundary.
   - Confirm target files and affected runtime path.
   - Record no-change constraints (API shape, UI behavior, data contract).
2. Detect bloat signals using `references/splitting-playbook.md`.
   - Prioritize files with mixed responsibilities, long functions, deep nesting, or high import fan-in.
3. Draft a split plan before editing.
   - Define module boundaries and destination folders.
   - Map old symbols to new files.
   - Define compatibility strategy (barrel export, adapter wrapper, or direct import update).
4. Execute split in low-risk sequence.
   - Extract pure utilities/types/constants first.
   - Extract cohesive domain logic second.
   - Keep orchestration in entry file or reduce it to a thin coordinator.
5. Update imports/exports and call sites.
   - Keep naming explicit and domain-oriented.
   - Avoid generic `utils` dumping unless scope is clearly local.
6. Validate non-regression.
   - Run targeted lint/test/build command.
   - Verify critical user path manually if tests are missing.
7. Sync docs only when structure affects architecture or function docs.
   - Update `coding-doc/web-architecture.md` and/or `coding-doc/web-functions.md` when needed.
8. Report output with migration map.
   - List touched files.
   - Explain old-to-new mapping and remaining technical debt.

## Naming And Placement Rules

- Keep feature-first placement unless code is reused by multiple domains.
- Name files by intent and layer, for example:
  - `use-<feature>.ts` for hooks
  - `<feature>-service.ts` for external I/O
  - `<feature>-state.ts` for state machine/store
  - `<feature>-mapper.ts` for data transform
- Keep one reason to change per file.
- Do not move code to shared folders without at least two real consumers.
- Prefer shallow, readable folder depth over over-nested trees.

## Safety Rules

- Preserve behavior unless user requests functional changes.
- Split incrementally; avoid rewrite-from-scratch refactors.
- Keep commits/patches reviewable with clear symbol migration.
- Use temporary compatibility exports when migration risk is high, then clean them in follow-up.

## Resources

- `references/splitting-playbook.md`: bloat detection thresholds, split strategies, and validation checklist.
