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
- 4 targeted queries per niche (32 total) for better coverage

## Language Filtering
Three-layer defense against non-English content:
1. Non-Latin script detection (15% threshold)
2. Expanded keyword blocklist (17 regional terms)
3. Hard `defaultAudioLanguage` check

See: [YouTube Language Filtering](youtube-language-filtering.md)

## Quota Management
- 3,216 units/scan (4 queries × 8 niches)
- 9,000 daily hard cap (safety margin below 10k limit)
- 8-hour cooldown between scans (~3 scans/day)

See: [YouTube Quota Budget](youtube-quota-budget.md)

## Output
- Populates `niches`, `niche_snapshots`, `outlier_videos` tables
- Week-based snapshots for trend tracking
- `rejectedRegional` counter for audit trail

---

*Compiled from: 2026-06-13, 2026-06-14 sessions*
