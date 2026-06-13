# Supabase Service Role Keys

## Critical Lesson
`@nuxtjs/supabase` module reads `secretKey` from `NUXT_SUPABASE_SECRET_KEY`. Using `NUXT_SUPABASE_SERVICE_ROLE_KEY` matches nothing → undefined at runtime.

## Key Naming
| Format | Env Var | Usage |
|--------|---------|-------|
| New `sb_secret_*` | `NUXT_SUPABASE_SECRET_KEY` | Server-side (bypasses RLS) |
| Legacy JWT `eyJ...` | `NUXT_SUPABASE_SERVICE_KEY` | Server-side (bypasses RLS) |
| New `sb_publishable_*` | `NUXT_PUBLIC_SUPABASE_KEY` | Client-side (RLS enforced) |

## Why Service Role?
- `serverSupabaseClient` uses anon key (public) → respects RLS
- `serverSupabaseServiceRole` bypasses RLS → required for server-only writes
- Tables with RLS + zero public policies need service role for inserts

## Affected Files (FIX 2)
- 5 server files updated to use correct env var naming
- `.env` updated for module recognition

---

*Compiled from: 2026-06-14 sessions*