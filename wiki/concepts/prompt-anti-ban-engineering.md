# Prompt Anti-Ban Engineering

## Overview
Prompt design techniques to prevent LLM outputs from containing YouTube-banned phrases. Part of the FLEX ENGINE's anti-ban authenticity layer.

## Anti-Ban Authenticity Layer (in MECHANICS_BLOCK)
Embedded in both breakdown and skeleton system prompts:
- **Variation**: structure timings must differ from default template (shift act boundaries ±10-20%)
- **Specificity**: every scene needs concrete sensory/numeric detail
- **Human Markers**: 2-3 [NARRATOR ASIDE] spots for personal, imperfect asides
- **Never produce**: banned phrases (listed explicitly in prompt)

## Recency Effect Placement
Banned-phrase rules placed at **END of skeleton user prompt** as `FINAL HARD RULE`. Recency effect improves LLM compliance over placement in middle of prompt block.

```
FINAL HARD RULE — the output must NOT contain anywhere: "in today's video", ...
If you were about to write one, rewrite that line.
```

## Skeleton-Specific Rules
- Title options: no clickbait words banned by advertisers
- CTA: soft, in-world, never "like and subscribe" verbatim
- Authenticity checklist: 3-5 self-checks the skeleton satisfies

## Key Insight
Anti-ban failures in skeletons hit the product's **core differentiator** — any post-beta regressions here are critical.

---

*Compiled from: 2026-06-14 session (12:04)*
