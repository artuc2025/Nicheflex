# Niche Profiles

## Overview
Pre-built narrative profiles stored in `server/utils/nicheProfiles.ts`. Each profile defines the storytelling mechanics for a specific niche category, feeding into script generation. 5 profiles implemented.

## Profile Structure
Each profile contains:
- **arcs** — narrative arc templates (rise, tension, resolution patterns)
- **artLock** — fixed artistic constraints the script must respect
- **emotionalEngine** — emotional beats that drive engagement
- **anti-ban rules** — niche-specific phrase avoidance rules

## Profiles
| Profile | Niche | Status |
|---------|-------|--------|
| Tech | Technology/product breakdowns | Implemented |
| Finance | Money/investment niches | Implemented |
| Crime | True crime/mystery | Implemented |
| Business | Entrepreneurship/case studies | Implemented |
| History | Historical events/figures | Implemented |
| Drama | Relationship/social dynamics | Implemented |
| Space | Science/space exploration | Implemented |
| Horror | Scary stories/paranormal | Implemented |

## Role in Pipeline
1. User selects niche → system loads matching profile
2. `scriptPrompt()` in `flex.ts` combines skeleton + profile
3. Profile arcs and emotionalEngine shape the script's narrative flow
4. Anti-ban rules layer on top of global banned-phrase validation

## Key Decision
Profiles were created **before monetization** — "strengthen generation before monetization" was explicit priority.

---

*Compiled from: 2026-06-14 session (21:05)*
