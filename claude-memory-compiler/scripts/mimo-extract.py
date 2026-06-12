"""
Manual knowledge extraction for MiMo Code sessions.

This script allows you to manually extract knowledge from the current
MiMo Code session and save it to a daily log.

Usage:
    uv run python mimo-extract.py                    # extract from current session
    uv run python mimo-extract.py --session <id>    # extract from specific session
    uv run python mimo-extract.py --file <path>     # extract from context file
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DAILY_DIR = ROOT / "daily"
SCRIPTS_DIR = ROOT / "scripts"
MEMORY_DIR = Path.home() / ".local" / "share" / "mimocode" / "memory"


def get_current_session_id() -> str | None:
    """Try to get the current MiMo Code session ID."""
    sessions_dir = MEMORY_DIR / "sessions"
    if not sessions_dir.exists():
        return None
    
    sessions = sorted(sessions_dir.glob("ses_*"), key=lambda p: p.stat().st_mtime, reverse=True)
    if sessions:
        return sessions[0].name
    return None


def read_session_context(session_id: str) -> str | None:
    """Read conversation context from a MiMo Code session."""
    context_parts = []
    
    session_dir = MEMORY_DIR / "sessions" / session_id
    if session_dir.exists():
        checkpoint_file = session_dir / "checkpoint.md"
        if checkpoint_file.exists():
            content = checkpoint_file.read_text(encoding="utf-8")
            context_parts.append(f"## Session Checkpoint\n\n{content}")
        
        notes_file = session_dir / "notes.md"
        if notes_file.exists():
            content = notes_file.read_text(encoding="utf-8")
            if content.strip():
                context_parts.append(f"## Session Notes\n\n{content}")
        
        tasks_dir = session_dir / "tasks"
        if tasks_dir.exists():
            for task_file in tasks_dir.glob("*.md"):
                content = task_file.read_text(encoding="utf-8")
                if content.strip():
                    context_parts.append(f"## Task: {task_file.stem}\n\n{content}")
    
    session_diff_file = MEMORY_DIR.parent / "storage" / "session_diff" / f"{session_id}.json"
    if session_diff_file.exists():
        try:
            diffs = json.loads(session_diff_file.read_text(encoding="utf-8"))
            if diffs:
                diff_summary = []
                for diff in diffs:
                    file_path = diff.get("file", "unknown")
                    status = diff.get("status", "modified")
                    additions = diff.get("additions", 0)
                    deletions = diff.get("deletions", 0)
                    diff_summary.append(f"- {file_path}: {status} (+{additions}/-{deletions})")
                
                if diff_summary:
                    context_parts.append(f"## Code Changes\n\nFiles modified in this session:\n" + "\n".join(diff_summary))
        except (json.JSONDecodeError, OSError):
            pass
    
    if not context_parts:
        return None
    
    return "\n\n---\n\n".join(context_parts)


def append_to_daily_log(content: str, section: str = "Session") -> None:
    """Append content to today's daily log."""
    today = datetime.now(timezone.utc).astimezone()
    log_path = DAILY_DIR / f"{today.strftime('%Y-%m-%d')}.md"

    if not log_path.exists():
        DAILY_DIR.mkdir(parents=True, exist_ok=True)
        log_path.write_text(
            f"# Daily Log: {today.strftime('%Y-%m-%d')}\n\n## Sessions\n\n## Memory Maintenance\n\n",
            encoding="utf-8",
        )

    time_str = today.strftime("%H:%M")
    entry = f"### {section} ({time_str})\n\n{content}\n\n"

    with open(log_path, "a", encoding="utf-8") as f:
        f.write(entry)


async def extract_knowledge(context: str) -> str:
    """Use MiMo AI to extract knowledge from context."""
    from mimo_backend import mimo_query
    
    prompt = f"""Review the conversation context below and extract important knowledge.

This context may contain:
- Session checkpoints and notes (conversation context)
- Code changes (diffs) from the session

Extract knowledge that would be valuable to remember for future sessions.

Format your response as a structured daily log entry with these sections:

**Context:** [One line about what was done in this session]

**Key Changes:**
- [Important code changes or decisions]

**Decisions Made:**
- [Any decisions with rationale]

**Lessons Learned:**
- [Gotchas, patterns, or insights discovered]

**Action Items:**
- [Follow-ups or TODOs mentioned]

Only include sections that have actual content. If nothing is worth saving,
respond with exactly: FLUSH_OK

## Session Context

{context}"""

    response, _ = await mimo_query(
        prompt=prompt,
        tools=[],
        max_turns=2,
    )
    
    return response


def main():
    parser = argparse.ArgumentParser(description="Extract knowledge from MiMo Code session")
    parser.add_argument("--session", type=str, help="Session ID to extract from")
    parser.add_argument("--file", type=str, help="Context file to extract from")
    parser.add_argument("--manual", action="store_true", help="Enter context manually")
    args = parser.parse_args()
    
    context = None
    
    if args.file:
        file_path = Path(args.file)
        if file_path.exists():
            context = file_path.read_text(encoding="utf-8")
            print(f"Reading context from {args.file}")
        else:
            print(f"Error: File not found: {args.file}")
            sys.exit(1)
    
    elif args.session:
        print(f"Looking for session {args.session}...")
        
        session_dir = MEMORY_DIR / "sessions" / args.session
        session_diff_file = MEMORY_DIR.parent / "storage" / "session_diff" / f"{args.session}.json"
        
        print(f"  Checking: {session_dir}")
        print(f"  Checking: {session_diff_file}")
        
        context = read_session_context(args.session)
        if not context:
            print(f"Error: Could not read context from session {args.session}")
            print("\nDebug information:")
            print(f"  Session directory exists: {session_dir.exists()}")
            print(f"  Session diff file exists: {session_diff_file.exists()}")
            
            print("\nAvailable sessions in memory/sessions/:")
            if MEMORY_DIR.exists():
                for item in (MEMORY_DIR / "sessions").iterdir():
                    if item.is_dir():
                        print(f"  - {item.name}")
            
            print("\nAvailable sessions in storage/session_diff/:")
            session_diff_dir = MEMORY_DIR.parent / "storage" / "session_diff"
            if session_diff_dir.exists():
                for item in session_diff_dir.glob("*.json"):
                    print(f"  - {item.stem}")
            
            sys.exit(1)
        print(f"Reading context from session {args.session}")
    
    elif args.manual:
        print("Enter conversation context (Ctrl+D when done):")
        context = sys.stdin.read()
    
    else:
        session_id = get_current_session_id()
        if session_id:
            print(f"Detected current session: {session_id}")
            context = read_session_context(session_id)
            if not context:
                print("Warning: Could not read context from current session")
        else:
            print("Could not detect current session. Use --session, --file, or --manual.")
            sys.exit(1)
    
    if not context or not context.strip():
        print("No context to extract from.")
        sys.exit(1)
    
    print(f"Context length: {len(context)} characters")
    print("\nContext preview:")
    print("-" * 60)
    print(context[:500] + "..." if len(context) > 500 else context)
    print("-" * 60)
    
    print("\nExtracting knowledge...")
    response = asyncio.run(extract_knowledge(context))
    
    if "FLUSH_OK" in response:
        print("Nothing worth saving from this session.")
    else:
        append_to_daily_log(response, "Session")
        print("Knowledge extracted and saved to daily log.")
        print("\nExtracted content:")
        print("-" * 60)
        print(response)
        print("-" * 60)


if __name__ == "__main__":
    main()
