# Contract Evolution

## Overview
Narrative contract terms evolved to improve script quality. Changes are backward-compatible — old DB data fails new validator as expected (triggers regeneration).

## Term Changes
| Old Term | New Term | Purpose |
|----------|----------|---------|
| `mystery_object` | `central_engine` | Core narrative driver |
| `counterattack_waves` | `escalation_ladder` | Tension progression mechanism |

## Backward Compatibility
Old DB data with previous contract terms fails new validator. This is **expected behavior** — forces regeneration with updated contract rather than serving stale content.

## Impact
- Gemini 2.5-flash handles new contract well: 8/10 first try, 2/10 needed retry (both passed 2nd attempt)
- 0 banned phrases in 10/10 runs — anti-ban placement confirmed effective

---

*Compiled from: 2026-06-14 session (21:05)*
