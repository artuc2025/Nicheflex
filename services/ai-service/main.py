from __future__ import annotations

import json
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from backends import get_backend
from prompts import niche_breakdown_prompt, script_skeleton_prompt


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.backend = get_backend()
    print(f"AI backend: {app.state.backend.name}")
    yield


app = FastAPI(title="NicheHeat AI Service", lifespan=lifespan)


class BreakdownRequest(BaseModel):
    niche_title: str
    top_videos: list[dict]
    metrics: dict


class SkeletonRequest(BaseModel):
    niche_title: str
    niche_analysis: str
    video_format: str = "long"


def parse_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1])
    return json.loads(cleaned)


@app.get("/health")
async def health():
    return {"status": "ok", "backend": app.state.backend.name}


@app.post("/breakdown")
async def breakdown(req: BreakdownRequest):
    prompt = niche_breakdown_prompt(req.niche_title, req.top_videos, req.metrics)
    try:
        raw = await app.state.backend.generate(prompt)
        return parse_json(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {raw[:200]}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/skeleton")
async def skeleton(req: SkeletonRequest):
    prompt = script_skeleton_prompt(req.niche_title, req.niche_analysis, req.video_format)
    try:
        raw = await app.state.backend.generate(prompt)
        return parse_json(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {raw[:200]}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
