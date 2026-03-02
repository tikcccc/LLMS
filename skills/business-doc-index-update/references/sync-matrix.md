# Business Doc Sync Matrix

## Source Classification

| Source pattern in `reference-doc/` | Classification |
| --- | --- |
| `emails/*` | `emails` |
| `meeting-record/*` | `meeting_record` |
| `*Project-timeline information*` | `project_timeline` |
| `*boundary information*` | `boundary_information` |
| 其他 | `other_business_source` |

## Required Target Docs

| Detected classification | Required updates |
| --- | --- |
| Any change | `coding-doc/web-business-reference.md` |
| `emails` / `meeting_record` / `project_timeline` / `other_business_source` | `coding-doc/web-pm-business-alignment.md` |
| `emails` / `meeting_record` / `project_timeline` | `coding-doc/web-functions.md` |
| `project_timeline` / `boundary_information` | `coding-doc/web-data-contract.md` |

## Mandatory Post Steps

1. Update each touched document's `最後更新` date.
2. Rebuild index: `python3 skills/coding-doc/scripts/index_coding_docs.py coding-doc --output coding-doc/.doc-index.json`.
3. If sync completed, refresh state file by running detector with `--write-state`.
