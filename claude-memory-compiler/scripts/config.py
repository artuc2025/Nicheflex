"""
Configuration for the MiMo memory compiler.
"""

from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
WIKI_ROOT = ROOT_DIR.parent
KNOWLEDGE_DIR = WIKI_ROOT / "wiki"
CONCEPTS_DIR = KNOWLEDGE_DIR / "concepts"
CONNECTIONS_DIR = KNOWLEDGE_DIR / "connections"
QA_DIR = KNOWLEDGE_DIR / "qa"
PROBLEMS_DIR = KNOWLEDGE_DIR / "problems"
SOLUTIONS_DIR = KNOWLEDGE_DIR / "solutions"
ENTITIES_DIR = KNOWLEDGE_DIR / "entities"
INSIGHTS_DIR = KNOWLEDGE_DIR / "insights"
AGENTS_FILE = WIKI_ROOT / "AGENTS.md"
DAILY_DIR = ROOT_DIR / "daily"
STATE_FILE = ROOT_DIR / ".state.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
