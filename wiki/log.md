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

## 2026-06-14

**Step 1 (Landing + Lead Magnet) Completed** — Subscribers table, subscribe API, landing page, dashboard moved to `/app`. Two blocking bugs fixed and verified.

### Key Changes
- Created subscribers table, subscribe API, landing page
- Dashboard relocated: `/dashboard` → `/app` (keeps `/` clean for public landing)

### Critical Fixes
- **FIX 1:** `serverSupabaseClient` → `serverSupabaseServiceRole` (bypasses RLS)
- **FIX 2:** `NUXT_SUPABASE_SERVICE_ROLE_KEY` → `NUXT_SUPABASE_SECRET_KEY` (module recognition)
- Updated 5 server files + `.env` for correct env var naming

### Lessons Learned
- `@nuxtjs/supabase` reads `secretKey` from `NUXT_SUPABASE_SECRET_KEY` — wrong var → undefined runtime
- `serverSupabaseClient` uses anon key (public); `serverSupabaseServiceRole` bypasses RLS
- New `sb_secret_...` format → use `NUXT_SUPABASE_SECRET_KEY`
- Honeypot: hidden `name="website"` field, filled → silent 200, no DB write

### Tech Debt Identified
- TD1: In-memory rate limit (replace with Upstash Redis)
- TD2: Demo thermal data
- TD3: Mailto unsubscribe
- TD4: No double opt-in
- TD5: Plain-text welcome email

### Next Steps
- Commit FIX 1 + FIX 2 changes
- Pre-deploy: SQL migration, Resend domain verification, Vercel env vars, OAuth redirect URLs
- Verify Resend email delivery in prod

---

