---
name: pm-business-function-consistency
description: Enforce product-manager business alignment for feature planning and implementation by grounding requests in `coding-doc/web-pm-business-alignment.md` and current `web/` capability baseline. Use when new features are proposed, requirements are ambiguous, priorities need business justification, or teams must verify a feature matches customer business needs before and after development.
---

# Pm Business Function Consistency

Use this skill to convert PM intent into implementable, verifiable, business-aligned feature work.

## Workflow

1. Load mandatory docs:
   - `coding-doc/web-business-reference.md`
   - `coding-doc/web-pm-business-alignment.md`
   - `coding-doc/web-functions.md`
2. Normalize request with template in `references/business-alignment-checklist.md`:
   - business objective
   - target role and scenario
   - expected outcome and measurable signal
3. Map request to current capability baseline:
   - mark as `new`, `change`, or `already covered`
   - identify impacted route/module/data/permission
4. Produce business alignment decision:
   - proceed
   - proceed with scope adjustment
   - hold and request PM clarification
5. If proceeding to development, hand off to implementation flow (`function-update` or direct implementation), then sync docs.
6. Before completion, run post-change business consistency checks from reference.

## Required Output

- PM objective summary (1-3 lines).
- Feature-business mapping table.
- Scope decision and reason.
- Required doc updates.
- Validation evidence (functional + business consistency).

## Resources

- `references/business-alignment-checklist.md`: intake template, alignment checks, and output format.
