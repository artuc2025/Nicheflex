from __future__ import annotations

import asyncio
import json
import shutil
import os
from pathlib import Path


class MimoBackend:
    """AI backend using local mimo CLI."""

    def __init__(self) -> None:
        self.name = "mimo"

    async def generate(self, prompt: str) -> str:
        mimo_cmd = shutil.which("mimo")
        if not mimo_cmd:
            possible = [
                Path.home() / "AppData" / "Local" / "nvm" / "v22.12.0" / "node_modules" / "@mimo-ai" / "cli" / "bin" / "mimo",
                Path.home() / ".local" / "bin" / "mimo",
                Path("/usr/local/bin/mimo"),
                Path("/usr/bin/mimo"),
            ]
            for p in possible:
                if p.exists():
                    mimo_cmd = str(p)
                    break

        if not mimo_cmd:
            raise RuntimeError("mimo command not found")

        cmd = [mimo_cmd, "run", "--format", "json", "--dangerously-skip-permissions"]
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await process.communicate(input=prompt.encode("utf-8"))
        if process.returncode != 0:
            raise RuntimeError(f"mimo failed: {stderr.decode()}")

        response = ""
        for line in stdout.decode("utf-8").strip().split("\n"):
            if not line:
                continue
            try:
                event = json.loads(line)
                if event.get("type") == "text":
                    response += event.get("part", {}).get("text", "")
            except json.JSONDecodeError:
                continue

        return response


class GeminiBackend:
    """AI backend using Google Gemini API (free tier: 15 RPM)."""

    def __init__(self) -> None:
        self.name = "gemini"
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    async def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY not set")

        import httpx

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4096},
        }

        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(url, json=payload)
            res.raise_for_status()
            data = res.json()

        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("No candidates in Gemini response")

        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts)


def get_backend() -> MimoBackend | GeminiBackend:
    backend = os.getenv("AI_BACKEND", "gemini").lower()
    if backend == "mimo":
        return MimoBackend()
    return GeminiBackend()
