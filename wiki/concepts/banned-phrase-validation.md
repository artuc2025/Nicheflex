# Banned-Phrase Validation

## Overview
Production-side validator that scans AI-generated payloads for banned phrases. Lives in `server/utils/validateGeneration.ts` and is called from both `validateBreakdown` and `validateSkeleton`.

## Banned Phrases (8)
1. "in today's video"
2. "in this video"
3. "without further ado"
4. "smash that like"
5. "like and subscribe"
6. "don't forget to subscribe"
7. "welcome back to"
8. "let's dive in"

## Implementation
- `checkBannedPhrases(p)` — stringifies entire payload, scans lowercase for each phrase
- Called at end of both `validateBreakdown` and `validateSkeleton`
- Returns `ValidationIssues` array (empty = pass)

## Design Decision
Banned-phrase check belongs in **production validator**, not test harness. Single source of truth prevents drift where harness catches what production lets through.

## Retry Loop Integration
When validation fails (including banned phrases), the generation retry loop catches it and regenerates — the user never sees banned-phrase output in production.

---

*Compiled from: 2026-06-14 session (12:04)*
