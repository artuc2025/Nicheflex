# Scanner → Supabase Flow

## Data Flow
1. `POST /api/scan` triggers scanner
2. Scanner fetches videos from YouTube API
3. HEAT score calculated per niche
4. Results written to Supabase tables:
   - `niches` — niche metadata
   - `niche_snapshots` — weekly metrics with HEAT
   - `outlier_videos` — top performers

## Dependencies
- YouTube API key (env: `NUXT_YOUTUBE_API_KEY`)
- Supabase connection (env: `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`)
- Week format consistency (ISO `YYYY-Wnn`)

## Error Handling
- API failures halt scan (no partial writes)
- Duplicate weeks overwrite previous snapshot

---

*Compiled from: 2026-06-13 sessions*
