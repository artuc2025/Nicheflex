# AI Microservice Architecture

## Stack
- **Framework**: Python FastAPI
- **AI Provider**: Anthropic (Claude)
- **HTTP Client**: httpx

## Location
`services/ai-service/`

## Components
- `backends.py` — Anthropic API integration
- `prompts.py` — Prompt templates for niche breakdowns and script skeletons

## Features
- **Niche Breakdown**: AI analysis of niche potential
- **Script Skeleton**: Narrative generation for videos (FLEX ENGINE)

## Integration
Called from Nuxt server routes via HTTP. Separate from main Nuxt app for isolation.

---

*Compiled from: 2026-06-13 sessions*
