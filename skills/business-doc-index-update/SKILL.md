---
name: business-doc-index-update
description: Detect changes in `reference-doc/` business sources and synchronize impacted `coding-doc/` files plus index artifacts. Use when new emails/meeting records/timeline references are added or edited and related business docs must be updated.
---

# Business Doc Index Update

Use this skill to keep business-source updates traceable and synchronized with `coding-doc/`.

## Workflow

1. Confirm roots exist:
   - `reference-doc/`
   - `coding-doc/`
2. Detect source changes with the bundled script:
   - `python3 skills/business-doc-index-update/scripts/detect_business_doc_updates.py --source-root reference-doc --state-file coding-doc/.business-doc-sync-state.json --output coding-doc/.business-doc-sync-report.json`
3. Route impacted target docs with `references/sync-matrix.md`.
4. Update required target docs (at minimum `web-business-reference.md`; include PM/functions/data-contract docs based on matrix).
5. For each touched doc:
   - update relevant sections
   - update `最後更新` to current date
   - add/update trace rows (for example in 增量業務紀錄)
6. Rebuild coding-doc index:
   - `python3 skills/coding-doc/scripts/index_coding_docs.py coding-doc --output coding-doc/.doc-index.json`
7. After sync is complete, refresh detector state:
   - `python3 skills/business-doc-index-update/scripts/detect_business_doc_updates.py --source-root reference-doc --state-file coding-doc/.business-doc-sync-state.json --write-state`

## Output Requirements

- Provide detection summary:
  - added / modified / removed source files
  - change categories
  - mapped target docs
- Provide touched-file list and per-file update summary.
- If any required target doc is not updated, explicitly state why.

## Resources

- `references/sync-matrix.md`: source-to-target mapping rules.
- `scripts/detect_business_doc_updates.py`: deterministic change detector and target recommendation report.
