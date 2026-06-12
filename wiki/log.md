# Build Log

## 2026-06-13

**MVP Backend Completed** — Supabase schema, YouTube scanner, API endpoints, and AI service scaffolded.

### Key Decisions
- HEAT-score formula: `(growth×0.4 + monetization×0.4 + (1/competition)×0.2) × 100`
- Scanner runs before UI (incremental verification)
- AI as Python microservice (FastAPI + Anthropic)
- 8 niche categories for initial scan

### Files Created
- `server/utils/schema.sql` — 6 tables + RLS + triggers
- `server/utils/youtube.ts` — Scanner with VPH/HEAT calculation
- `server/api/scan.post.ts` — Scan endpoint
- `server/api/niches.get.ts`, `outliers.get.ts`, `generate.post.ts` — API routes
- `server/plugins/auth.ts` — Auth middleware
- `services/ai-service/` — FastAPI microservice

### Lessons
- Supabase keys use new `sb_publishable_*` format
- Week format: ISO `YYYY-Wnn`

### Next Steps
- Test scanner: `POST /api/scan`
- Build Niche Radar UI
- Configure Lemon Squeezy payments
- Set real Anthropic API key

---

