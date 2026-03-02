#!/usr/bin/env python3
"""Detect updates under reference-doc and suggest target coding-doc files.

Usage:
  python3 skills/business-doc-index-update/scripts/detect_business_doc_updates.py \
    --source-root reference-doc \
    --state-file coding-doc/.business-doc-sync-state.json \
    --output coding-doc/.business-doc-sync-report.json \
    --write-state
"""

from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Set


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def iter_files(root: Path) -> Iterable[Path]:
    for path in sorted(root.rglob("*")):
        if path.is_file() and not any(part.startswith(".") for part in path.parts):
            yield path


def load_state(path: Path) -> Dict[str, str]:
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    files = payload.get("files", {})
    if not isinstance(files, dict):
        return {}
    return {str(k): str(v) for k, v in files.items()}


@dataclass
class Changes:
    added: List[str]
    modified: List[str]
    removed: List[str]


def diff_files(previous: Dict[str, str], current: Dict[str, str]) -> Changes:
    prev_keys = set(previous.keys())
    curr_keys = set(current.keys())

    added = sorted(curr_keys - prev_keys)
    removed = sorted(prev_keys - curr_keys)
    modified = sorted(k for k in prev_keys & curr_keys if previous[k] != current[k])

    return Changes(added=added, modified=modified, removed=removed)


def classify_path(rel: str) -> str:
    normalized = rel.replace("\\", "/")
    lower = normalized.lower()

    if lower.startswith("emails/"):
        return "emails"
    if lower.startswith("meeting-record/"):
        return "meeting_record"
    if "project-timeline" in lower:
        return "project_timeline"
    if "boundary information" in lower:
        return "boundary_information"
    return "other_business_source"


def build_targets(categories: Set[str]) -> List[str]:
    if not categories:
        return []

    targets = ["coding-doc/web-business-reference.md"]

    alignment_drivers = {"emails", "meeting_record", "project_timeline", "other_business_source"}
    function_drivers = {"emails", "meeting_record", "project_timeline"}
    contract_drivers = {"project_timeline", "boundary_information"}

    if categories & alignment_drivers:
        targets.append("coding-doc/web-pm-business-alignment.md")
    if categories & function_drivers:
        targets.append("coding-doc/web-functions.md")
    if categories & contract_drivers:
        targets.append("coding-doc/web-data-contract.md")

    return targets


def build_report(
    source_root: Path,
    state_file: Path,
    changes: Changes,
    categories: Set[str],
    current_files: Dict[str, str],
) -> dict:
    changed_files = changes.added + changes.modified + changes.removed
    return {
        "scanned_at": utc_now_iso(),
        "source_root": str(source_root),
        "state_file": str(state_file),
        "summary": {
            "total_scanned": len(current_files),
            "added": len(changes.added),
            "modified": len(changes.modified),
            "removed": len(changes.removed),
            "changed": len(changed_files),
            "needs_sync": len(changed_files) > 0,
        },
        "changes": {
            "added": changes.added,
            "modified": changes.modified,
            "removed": changes.removed,
        },
        "change_categories": sorted(categories),
        "recommended_targets": build_targets(categories),
        "recommended_followup": [
            "Update impacted coding-doc files and set 最後更新 date.",
            "Rebuild coding-doc index via index_coding_docs.py.",
            "Write/refresh sync state after docs are updated.",
        ],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Detect business doc changes and suggest sync targets.")
    parser.add_argument("--source-root", default="reference-doc", help="Business source root directory.")
    parser.add_argument(
        "--state-file",
        default="coding-doc/.business-doc-sync-state.json",
        help="State file path storing previous file hashes.",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Optional output JSON report path. If omitted, print to stdout.",
    )
    parser.add_argument(
        "--write-state",
        action="store_true",
        help="Write current hashes to state file after scan.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    source_root = Path(args.source_root).resolve()
    state_file = Path(args.state_file).resolve()

    if not source_root.exists() or not source_root.is_dir():
        raise SystemExit(f"source root not found: {source_root}")

    current_files: Dict[str, str] = {}
    for path in iter_files(source_root):
        rel = path.relative_to(source_root).as_posix()
        current_files[rel] = file_sha256(path)

    previous_files = load_state(state_file)
    changes = diff_files(previous_files, current_files)

    categories = {
        classify_path(rel)
        for rel in (changes.added + changes.modified + changes.removed)
    }

    report = build_report(source_root, state_file, changes, categories, current_files)

    output_text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output_text + "\n", encoding="utf-8")
    else:
        print(output_text)

    if args.write_state:
        state_file.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "generated_at": utc_now_iso(),
            "source_root": str(source_root),
            "files": current_files,
        }
        state_file.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
