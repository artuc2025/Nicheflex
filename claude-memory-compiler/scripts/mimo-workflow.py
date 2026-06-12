"""
Complete workflow script for MiMo AI memory compiler.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT / "scripts"


def run_extract(session_id: str | None = None, context_file: str | None = None) -> bool:
    """Run the extraction step."""
    print("=" * 60)
    print("Step 1: Extracting knowledge from session")
    print("=" * 60)
    
    cmd = [sys.executable, str(SCRIPTS_DIR / "mimo-extract.py")]
    
    if session_id:
        cmd.extend(["--session", session_id])
    elif context_file:
        cmd.extend(["--file", context_file])
    
    result = subprocess.run(cmd, cwd=str(ROOT))
    return result.returncode == 0


def run_compile(file: str | None = None, force: bool = False) -> bool:
    """Run the compilation step."""
    print("\n" + "=" * 60)
    print("Step 2: Compiling daily logs to knowledge articles")
    print("=" * 60)
    
    cmd = [sys.executable, str(SCRIPTS_DIR / "compile_mimo.py")]
    
    if file:
        cmd.extend(["--file", file])
    if force:
        cmd.append("--all")
    
    result = subprocess.run(cmd, cwd=str(ROOT))
    return result.returncode == 0


def run_lint() -> bool:
    """Run the lint step."""
    print("\n" + "=" * 60)
    print("Step 3: Linting knowledge base")
    print("=" * 60)
    
    cmd = [sys.executable, str(SCRIPTS_DIR / "lint.py"), "--structural-only"]
    
    result = subprocess.run(cmd, cwd=str(ROOT))
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="MiMo AI memory compiler workflow")
    parser.add_argument("--extract-only", action="store_true", help="Only extract knowledge")
    parser.add_argument("--compile-only", action="store_true", help="Only compile daily logs")
    parser.add_argument("--lint", action="store_true", help="Include lint step")
    parser.add_argument("--session", type=str, help="Session ID to extract from")
    parser.add_argument("--file", type=str, help="Context file to extract from")
    parser.add_argument("--compile-file", type=str, help="Specific daily log to compile")
    parser.add_argument("--force", action="store_true", help="Force recompile all logs")
    args = parser.parse_args()
    
    success = True
    
    if not args.compile_only:
        if not run_extract(args.session, args.file):
            print("Warning: Extraction step failed")
    
    if not args.extract_only:
        if not run_compile(args.compile_file, args.force):
            print("Error: Compilation step failed")
            success = False
    
    if args.lint and not args.extract_only:
        if not run_lint():
            print("Warning: Lint step found issues")
    
    print("\n" + "=" * 60)
    if success:
        print("Workflow completed successfully!")
    else:
        print("Workflow completed with errors.")
    print("=" * 60)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
