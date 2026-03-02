---
name: frontend
description: Implement and refine UI in `web/` while preserving architecture consistency and visual quality using `coding-doc/frontend-consistency.md` and `coding-doc/frontend-component-patterns.md`. Use when building new pages/components, restyling existing UI, adding responsive behavior, or reviewing frontend changes for consistency and aesthetics.
---

# Frontend

Use this skill to deliver UI changes that stay consistent, maintainable, and visually coherent with current project patterns.

## Workflow

1. Load mandatory references:
   - `coding-doc/frontend-consistency.md`
   - `coding-doc/frontend-component-patterns.md`
   - `references/frontend-rules.md`
2. Classify requested change:
   - global token/layout rule
   - reusable component/pattern
   - page-level feature UI
3. Implement with consistency guardrails from references.
4. If style/pattern repeats across multiple places, extract to shared token/component instead of duplicating.
5. Sync docs after implementation:
   - architecture responsibility changed -> `coding-doc/web-architecture.md`
   - user-visible feature changed -> `coding-doc/web-functions.md`
   - consistency baseline changed -> `coding-doc/frontend-consistency.md`
   - reusable component pattern changed -> `coding-doc/frontend-component-patterns.md`
6. Validate desktop/mobile behavior and run pre-merge checklist in `references/frontend-rules.md`.

## Mandatory Guardrails

- Reuse existing CSS tokens before introducing new values.
- Keep shared status semantics from `statusStyle.js` and `siteBoundaryStatusStyle.js`.
- Keep destructive actions behind confirmation dialog.
- Ensure icon-only actions include `aria-label`.
- Preserve Vue + Element Plus patterns; do not introduce another UI framework.

## Resources

- `references/frontend-rules.md`: Consistency guardrails and frontend verification checklist.
