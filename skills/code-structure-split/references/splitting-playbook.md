# Splitting Playbook

Use this playbook to decide when and how to split a bloated code file.

## 1. Bloat Detection Heuristics

Treat a file as split-candidate when at least two conditions are true:

- File length is greater than 600-800 LOC.
- Core function/component body is greater than 120 LOC.
- File mixes 3+ responsibilities (UI rendering, state transitions, API calls, data mapping, permissions).
- Nested branches are hard to reason about (frequent `if/else` and switch nesting).
- Change requests repeatedly touch unrelated sections of the same file.
- Reviewers cannot quickly identify ownership boundaries.

## 2. Boundary Design Checklist

Before editing, map each code block to one responsibility:

- Entry and orchestration
- Domain logic
- External I/O (API/storage)
- Data transform and validation
- Shared types/constants
- UI-only view fragments (if frontend)

Split by boundaries, not by line count alone.

## 3. Placement Rules

- Keep modules close to the feature first (`web/src/features/<feature>/...` style).
- Move to shared/common folders only when reused across multiple features.
- Keep naming explicit:
  - `<feature>-service.ts`
  - `<feature>-selectors.ts`
  - `<feature>-mapper.ts`
  - `use-<feature>.ts`
- Avoid ambiguous names like `helper.ts`, `common.ts`, or `misc.ts`.

## 4. Safe Execution Order

1. Extract constants/types.
2. Extract pure functions.
3. Extract side-effect modules (I/O, state adapters).
4. Reduce original file to coordinator or remove it if obsolete.
5. Update imports with stable export paths.

## 5. Validation Checklist

- Build compiles successfully.
- Lint passes on touched scope.
- Existing tests pass, or run targeted tests around touched behavior.
- Manual smoke path confirms no visible behavior regression.
- Diff shows structural change first, behavior change only if explicitly requested.
