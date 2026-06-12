"""
Flush knowledge from daily logs into wiki articles (simplified version).
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from config import DAILY_DIR, KNOWLEDGE_DIR
from utils import list_raw_files, load_state


async def flush() -> None:
    from compile_mimo import compile_daily_log
    
    state = load_state()
    logs = list_raw_files()
    
    if not logs:
        print("No daily logs found.")
        return
    
    for log in logs:
        print(f"Flushing {log.name}...")
        cost = await compile_daily_log(log, state)
        print(f"  Done. Cost: ${cost:.4f}")


def main():
    asyncio.run(flush())


if __name__ == "__main__":
    main()
