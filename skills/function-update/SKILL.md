---
name: function-update
description: Implement, complete, and verify new or changed product functions in `web/`, including required documentation sync in `coding-doc/`. Use when users request adding features, extending existing workflows, changing behavior, or requiring validation that function updates are complete and consistent.
---

# Function Update

Use this skill to deliver feature updates end-to-end: implementation, doc sync, and validation.

## Workflow

1. Classify requested change with `references/feature-update-playbook.md`:
   - new feature
   - behavior change
   - enhancement/refactor
   - removal/deprecation
2. Load minimal required docs:
   - `coding-doc/web-business-reference.md`
   - `coding-doc/web-pm-business-alignment.md`
   - `coding-doc/web-functions.md`
   - `coding-doc/web-architecture.md`
   - and additional files by change type (data/permission/api/frontend consistency).
3. Implement code changes in `web/` with smallest safe scope.
4. Sync docs in `coding-doc/` to match behavior changes.
5. Verify with available checks:
   - targeted build/lint/test command if present
   - manual scenario checks from playbook
6. Return:
   - changed code files
   - changed docs
   - validation evidence
   - remaining risks/TODOs

## Mandatory Rules

- Do not finish with code-only changes if user-visible behavior changed; update docs in same task.
- Before implementation, confirm business objective and role scenario using `web-business-reference.md` and `web-pm-business-alignment.md`.
- Keep route/module naming consistent between code and docs.
- If tests are missing, provide explicit manual validation steps.

## Resources

- `references/feature-update-playbook.md`: change classification, doc mapping, and validation checklist.
