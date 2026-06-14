# Test Harness Architecture

## Overview
End-to-end test harness (`scripts/test-harness.ts`) that validates generation quality across 8 niches, using production validators as the single source of truth.

## Design Principle
**Production validators are the single source of truth.** The harness does NOT define its own pass/fail criteria — it imports `validateBreakdown` and `validateSkeleton` from `server/utils/validateGeneration.ts` and uses them directly.

## What It Tests
- 8 pre-defined niche categories (tech, finance, crime, business, history, drama, space, horror)
- Both `breakdown` and `skeleton` generation types
- Configurable runs per niche (default: 3)
- Total: 8 niches × 2 types × 3 runs = 48 generations

## Classification
| Class | Meaning |
|-------|---------|
| `quality_pass` | Validator returns zero issues |
| `quality_fail` | Validator returns issues (including banned phrases) |
| `infra_skip` | Transient error (503, 502, 429, timeout) — not counted against quality rate |

## Verdict Thresholds
- ≥90% quality pass → ✅ PASS — Beta-ready
- ≥75% quality pass → ⚠️ WARN — Fix top issues before beta
- <75% quality pass → ❌ FAIL — Prompts need rewriting

## Report Output
- JSON report written to `harness-reports/harness-YYYY-MM-DD.json`
- Includes per-niche breakdown, banned-phrase failure count, total API calls
- Infrastructure outage detection (>30% infra skips triggers warning)

## Key Learnings
- Gemini `responseMimeType: 'application/json'` is unreliable for complex nested schemas — model wraps in markdown fences despite JSON mode; removing it + improving fence-stripping is more robust
- Skeleton outputs need higher `maxTokens` (8192 vs 4096) due to structural size (acts, beats, asides)

---

*Compiled from: 2026-06-14 session (12:04)*
