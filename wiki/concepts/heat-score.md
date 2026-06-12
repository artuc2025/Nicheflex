# HEAT Score

## Definition
Proprietary metric measuring niche viability: `Heat = (growth×0.4 + monetization×0.4 + (1/competition)×0.2) × 100`, capped at 99.99.

## Formula Components
- **Growth** — views-per-hour trend over 7 days
- **Monetization** — RPM (revenue per 1000 views) range
- **Competition** — channel count in niche (inverted: more channels = lower score)

## Implementation
- Calculated in `server/utils/youtube.ts`
- Stored in `niche_snapshots` table as `heat_score`
- Week format: ISO `YYYY-Wnn`

## Usage
Displayed in Niche Radar UI for niche comparison. Users sort/filter by HEAT to find high-potential niches.

---

*Compiled from: 2026-06-13 sessions*
