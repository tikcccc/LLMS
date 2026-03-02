# Frontend Rules

These rules keep `web/` consistent with project docs while maintaining visual quality.

## Source-of-Truth Files

- `coding-doc/frontend-consistency.md`
- `coding-doc/frontend-component-patterns.md`
- `coding-doc/web-architecture.md` (for ownership boundaries)
- `coding-doc/web-functions.md` (for user-visible behavior)

## Implementation Guardrails

### Tokens and Global CSS

- Treat `web/src/style.css` as the global token source.
- Reuse existing variables before adding new ones.
- If a new spacing/color/radius value appears in 3+ places, promote it to token.
- Keep global overrides minimal and explain non-obvious overrides with short comments.

### Component and Page Patterns

- Follow `Page -> Section/Card -> Control -> Data View` composition.
- Prefer reusable components for repeated UI patterns.
- Keep component styles local (`<style scoped>`) unless truly global.
- Avoid store coupling in reusable presentational components.

### Status and Interaction Semantics

- Reuse status mappings from:
  - `web/src/modules/map/utils/statusStyle.js`
  - `web/src/modules/map/utils/siteBoundaryStatusStyle.js`
- Keep destructive actions behind confirmation dialogs.
- Keep dialog action order consistent: `Cancel` then primary action.

### Responsiveness and Accessibility

- Validate existing breakpoints: `1120px`, `1100px`, `900px`, `768px`.
- Ensure major actions remain reachable on mobile.
- Add `aria-label` to icon-only controls.
- Ensure keyboard operability for primary interactions.

### Aesthetics Baseline

- Preserve clear hierarchy: title, meta, primary action, content.
- Use coherent spacing rhythm; avoid one-off spacing hacks.
- Keep visual density balanced: avoid overloaded toolbars and crowded cards.
- Prefer subtle emphasis (weight/contrast) over heavy shadows and noisy effects.

## Doc Sync After UI Changes

- If global consistency rules changed, update `coding-doc/frontend-consistency.md`.
- If reusable component/page pattern changed, update `coding-doc/frontend-component-patterns.md`.
- If user-visible capability changed, update `coding-doc/web-functions.md`.
- If ownership or layering changed, update `coding-doc/web-architecture.md`.

## Pre-Merge Checklist

1. Uses existing tokens and status semantics.
2. No repeated style block that should be extracted.
3. Desktop and mobile behavior are both verified.
4. Icon-only controls have `aria-label`.
5. Destructive actions use confirmation.
6. Related docs were updated if behavior or rules changed.

