# YouTube Scanner Pipeline

## Architecture
YouTube Data API v3 → Search → Video/Channel Details → HEAT Calculation → Supabase

## Components
- **Scanner**: `server/utils/youtube.ts` — search, fetch, calculate
- **Endpoint**: `server/api/scan.post.ts` — triggers scan via POST
- **Niche Categories**: finance, ai-tools, true-crime, business-stories, history, family-drama, space-science, horror-stories

## Scan Strategy
- `order=viewCount` + `videoDuration=long` for high-performing content
- Targets long-form videos only
- Scans 8 niche categories per run

## Output
- Populates `niches`, `niche_snapshots`, `outlier_videos` tables
- Week-based snapshots for trend tracking

---

*Compiled from: 2026-06-13 sessions*
