# Per-Niche Scanner Queries

## Purpose
Improve niche coverage by using multiple targeted queries per niche category instead of single broad queries.

## Strategy

### Before (Single Query)
- 1 broad query per niche = 8 total queries
- Limited coverage, missed niche-specific content
- High ratio filter (≥5) required due to established channels

### After (Per-Niche Queries)
- 4 targeted queries per niche = 32 total queries
- Better coverage of niche variations
- Lower ratio thresholds (1.5-2.0) viable

## Query Examples

### Horror Niche
1. "scary story" + "true crime"
2. "horror story" + "bedtime"
3. "creepy pasta" + "story"
4. "paranormal" + "encounter"

### Finance Niche
1. "passive income" + "ideas"
2. "side hustle" + "2024"
3. "investing for beginners"
4. "financial freedom" + "story"

## Benefits
- **Coverage**: Captures niche variations (synonyms, related terms)
- **Outlier Detection**: Lower thresholds find emerging content
- **Audit Trail**: `rejectedRegional` counter tracks filter effectiveness

## Cost Impact
- 4 queries × 8 niches = 32 queries
- ~100 units/query = ~3,200 units/scan
- Fits within 9,000 daily cap (~2-3 scans/day)

---

*Compiled from: 2026-06-14 Session (15:08)*
