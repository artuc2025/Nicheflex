"""
MiMo AI backend for the personal knowledge base.
"""

from __future__ import annotations

import asyncio
import json
import shutil
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


async def mimo_query(
    prompt: str,
    tools: list[str] | None = None,
    max_turns: int = 2,
    cwd: str | None = None,
) -> tuple[str, float]:
    """Call MiMo Code's AI with a prompt and return the response."""
    import shutil
    
    if cwd is None:
        cwd = str(ROOT_DIR)
    
    # Find mimo command
    mimo_cmd = shutil.which("mimo")
    if not mimo_cmd:
        # Try common locations
        import os
        possible_paths = [
            Path.home() / "AppData" / "Local" / "nvm" / "v22.12.0" / "node_modules" / "@mimo-ai" / "cli" / "bin" / "mimo",
            Path.home() / ".local" / "bin" / "mimo",
            Path("/usr/local/bin/mimo"),
            Path("/usr/bin/mimo"),
        ]
        for path in possible_paths:
            if path.exists():
                mimo_cmd = str(path)
                break
    
    if not mimo_cmd:
        raise RuntimeError("mimo command not found. Make sure MiMo Code is installed and in PATH.")
    
    # Build the mimo run command
    cmd = [
        mimo_cmd,
        "run",
        "--format", "json",
        "--dangerously-skip-permissions",
        "--dir", cwd,
    ]
    
    try:
        # Run mimo with the prompt
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
        )
        
        stdout, stderr = await process.communicate(input=prompt.encode("utf-8"))
        
        if process.returncode != 0:
            error_msg = stderr.decode("utf-8") if stderr else "Unknown error"
            raise RuntimeError(f"mimo run failed (exit code {process.returncode}): {error_msg}")
        
        # Parse the JSON output
        response_text = ""
        cost = 0.0
        
        for line in stdout.decode("utf-8").strip().split("\n"):
            if not line:
                continue
            try:
                event = json.loads(line)
                event_type = event.get("type")
                
                if event_type == "text":
                    text = event.get("part", {}).get("text", "")
                    response_text += text
                    
            except json.JSONDecodeError:
                continue
        
        return response_text, cost
        
    except Exception as e:
        raise RuntimeError(f"Failed to run mimo: {e}")


async def mimo_query_simple(prompt: str, cwd: str | None = None) -> str:
    """Simple wrapper that returns just the response text."""
    response, _ = await mimo_query(prompt, cwd=cwd)
    return response


def mimo_query_sync(prompt: str, cwd: str | None = None) -> str:
    """Synchronous version of mimo_query_simple."""
    return asyncio.run(mimo_query_simple(prompt, cwd=cwd))
