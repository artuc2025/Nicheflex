# Script Generation Pipeline

## Overview
Two-step AI generation process: skeleton first, then full voice-over script. Script is Pro-only. One-shot JSON, not interactive interview.

## Pipeline Flow
```
User selects niche
  → Generate Breakdown (free tier)
  → Generate Skeleton (free tier, requires breakdown)
  → Generate Script (Pro only, requires skeleton)
```

## Script Prompt
- Location: `flex.ts` — `scriptPrompt()` function
- Input: skeleton + niche profile
- Output: full voice-over script with title, markdown, word count, section headers, hook line, CTA line

## Validation
`validateScript()` checks:
- **title** — present and non-empty
- **script_markdown** — 1200-3500 words
- **section_headers** — array of section titles
- **hook_line** — opening hook
- **cta_line** — call to action

## Quota Gating
- Script generation: Pro-only (30/month quota)
- Skeleton generation: Free tier available
- One generation at a time per niche enforced by `generatingFor` ref

## Wiring
Script type wired through:
- `runGeneration()` — orchestrator
- `generate.post.ts` — API endpoint
- `planLimits.ts` — quota enforcement
- UI button in `pages/app.vue`

## Tier Status
- **Tier 1** (niche profiles, contract evolution, anti-ban): Complete
- **Tier 2** (script generation wiring): In progress
- **Tier 3** (production assets): Deferred to Phase 4

---

*Compiled from: 2026-06-14 session (21:05)*
