---
name: business-context-qa-sync
description: Answer business-related questions by combining current product capability (`coding-doc/web-functions.md`), business baseline docs, and source records in `reference-doc/`. Use when users ask business background, requirement intent, data meaning, or terminology. Also use when users provide new business descriptions so the business baseline document is updated for PM and engineering alignment.
---

# Business Context Qa Sync

Use this skill to keep business answers grounded in both source records and current product behavior.

## Workflow

1. Load required files first:
   - `coding-doc/web-business-reference.md`
   - `coding-doc/web-functions.md`
   - all relevant `reference-doc/*.md`
2. For business Q&A:
   - answer from source evidence
   - map business concept to current feature support
   - state gaps or uncertainty explicitly
3. For terminology questions:
   - use glossary in `web-business-reference.md`
   - if missing term appears in `reference-doc/`, add it to glossary with definition and source note
4. For new business descriptions from user:
   - update `coding-doc/web-business-reference.md` sections
   - append record to "增量業務紀錄"
   - update `最後更新` date
5. If business update changes functional meaning, also update:
   - `coding-doc/web-pm-business-alignment.md`
   - `coding-doc/web-functions.md` (when user-visible behavior implication is explicit)
6. Rebuild doc index after updates:
   - `python3 skills/coding-doc/scripts/index_coding_docs.py coding-doc --output coding-doc/.doc-index.json`

## Output Requirements

- For Q&A output, include:
  - business conclusion
  - supporting source file(s)
  - current feature mapping
  - unresolved assumptions
- For update tasks, include changed-file list and summary of added business knowledge.

## Resources

- `references/business-qa-playbook.md`: source priority, answer format, and document update checklist.
