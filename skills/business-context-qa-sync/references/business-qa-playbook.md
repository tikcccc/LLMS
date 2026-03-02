# Business QA Playbook

## Source Priority

Use this order for business answers:

1. `reference-doc/*.md` (raw meeting and requirement records)
2. `coding-doc/web-business-reference.md` (consolidated business baseline)
3. `coding-doc/web-functions.md` (current feature capability baseline)
4. Other `coding-doc/*` files only when needed for data/permission/API details

Do not use legacy project background in `doc/docs/` as business source-of-truth.

## Answer Template

For each business question, structure answer as:

1. Business interpretation (what customer actually needs)
2. Evidence (which source statement supports this)
3. Current feature support (what web currently supports)
4. Gap or risk (what is not yet supported or uncertain)

## Term Handling

When a user asks "X 是什麼":

1. Check glossary in `web-business-reference.md`.
2. If missing, search `reference-doc/*.md` and derive contextual definition.
3. Update glossary and add source trace.

## Business Description Update Rules

When user provides new business detail:

1. Add or revise relevant section in `web-business-reference.md`.
2. Append new row in "增量業務紀錄".
3. Update `最後更新` date.
4. If the new detail changes function semantics, update:
   - `web-pm-business-alignment.md`
   - `web-functions.md` (only when behavior implication is explicit)

## Completion Checklist

1. Answer references source files explicitly.
2. Business wording and system terms are consistent.
3. New business inputs are persisted in `web-business-reference.md`.
4. Follow-on document changes are completed when required.

