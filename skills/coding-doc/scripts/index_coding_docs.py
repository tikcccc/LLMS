#!/usr/bin/env python3
"""Build a lightweight index for markdown files under coding-doc/."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path


PURPOSE_HEADING_PATTERNS = (
    r"^##\s*1\)\s*文件用途\s*$",
    r"^##\s*1\)\s*文件目標\s*$",
    r"^##\s*1\)\s*目的\s*$",
    r"^##\s*1\)\s*目標\s*$",
)


def extract_title(text: str, fallback: str) -> str:
    match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return fallback


def _find_purpose_start(lines: list[str]) -> int | None:
    for i, line in enumerate(lines):
        stripped = line.strip()
        for pattern in PURPOSE_HEADING_PATTERNS:
            if re.match(pattern, stripped):
                return i + 1
    for i, line in enumerate(lines):
        if line.startswith("# "):
            return i + 1
    return None


def extract_purpose(text: str) -> str:
    lines = text.splitlines()
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("本文件"):
            return stripped

    start = _find_purpose_start(lines)
    if start is None:
        return ""

    collected: list[str] = []
    for line in lines[start:]:
        stripped = line.strip()
        if not stripped:
            if collected:
                break
            continue
        if stripped.startswith("## "):
            break
        if stripped.startswith("- "):
            continue
        if stripped.startswith("最後更新：") or stripped.startswith("狀態：") or stripped.startswith("範圍："):
            continue
        collected.append(stripped)
        if len(" ".join(collected)) > 240:
            break

    purpose = " ".join(collected).strip()
    if purpose:
        return purpose

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("範圍："):
            return stripped

    h2 = extract_h2(text)
    if h2:
        return f"文件重點：{h2[0]}"
    return ""


def extract_h2(text: str) -> list[str]:
    return [m.group(1).strip() for m in re.finditer(r"^##\s+(.+)$", text, re.MULTILINE)]


def build_index(root: Path) -> dict:
    records = []
    for md_path in sorted(root.glob("*.md")):
        content = md_path.read_text(encoding="utf-8")
        records.append(
            {
                "file": md_path.as_posix(),
                "title": extract_title(content, md_path.stem),
                "purpose": extract_purpose(content),
                "h2": extract_h2(content)[:12],
            }
        )

    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "root": root.as_posix(),
        "count": len(records),
        "files": records,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build a markdown index for coding-doc files.",
    )
    parser.add_argument(
        "doc_root",
        nargs="?",
        default="coding-doc",
        help="Path to coding-doc directory (default: coding-doc)",
    )
    parser.add_argument(
        "--output",
        default="coding-doc/.doc-index.json",
        help="Output path for index JSON (default: coding-doc/.doc-index.json)",
    )
    args = parser.parse_args()

    doc_root = Path(args.doc_root).resolve()
    if not doc_root.exists() or not doc_root.is_dir():
        raise SystemExit(f"[ERROR] Document root not found: {doc_root}")

    index_payload = build_index(doc_root)

    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(index_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"[OK] Indexed {index_payload['count']} files -> {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
