# YouTube Quota Budget System

## Purpose
Prevents exceeding YouTube Data API daily quota (10,000 units) while maximizing scan coverage.

## Budget Allocation

### Per-Scan Budget
- **3,216 units/scan** — based on 4 targeted queries per niche × 8 niches = 32 queries
- Each query costs ~100 units (search) + video/channel details

### Daily Limits
- **Hard cap**: 9,000 units/day (safety margin below 10k limit)
- **Cooldown**: 8 hours between scans
- **Effective**: ~3 scans/day (3 × 3,216 = 9,648 units)

### Per-Niche Query Strategy
- 4 targeted queries per niche (vs single broad query)
- Better coverage of niche-specific content
- 32 total queries × ~100 units = ~3,200 units/scan

## Implementation
- **Location**: `server/api/scan.post.ts`
- **Tracking**: `rejectedRegional` counter for audit trail
- **Budget check**: Before scan starts, verify remaining units > 3,216

## Monitoring
- Log units consumed per scan
- Track rejected vs accepted videos
- Alert when approaching daily cap

---

*Compiled from: 2026-06-14 Session (15:08)*
