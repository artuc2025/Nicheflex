"""
Utility functions for the MiMo memory compiler.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from config import DAILY_DIR, KNOWLEDGE_DIR, STATE_FILE


_WIKI_SUBDIRS = ["concepts", "connections", "qa", "problems", "solutions", "entities", "insights"]


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def list_raw_files() -> list[Path]:
    if not DAILY_DIR.exists():
        return []
    return sorted(DAILY_DIR.glob("*.md"))


def list_wiki_articles() -> list[Path]:
    articles = []
    for subdir in _WIKI_SUBDIRS:
        d = KNOWLEDGE_DIR / subdir
        if d.exists():
            articles.extend(sorted(d.glob("*.md")))
    return articles


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def read_wiki_index() -> str:
    index_file = KNOWLEDGE_DIR / "index.md"
    if index_file.exists():
        return index_file.read_text(encoding="utf-8")
    return "# Knowledge Base Index\n\n| Article | Summary | Compiled From | Updated |\n|---------|---------|---------------|---------|\n"
