# Session Resolution Paths

## Two Independent Auth Paths
The system has two separate ways to resolve user sessions, which caused confusion and bugs.

### Path 1: SSR Cookies via `@nuxtjs/supabase`
- **Function**: `serverSupabaseUser(event)`
- **Mechanism**: Reads from SSR cookies via `getClaims()`
- **Used in**: Server API routes that need user context
- **Key Point**: Does NOT use `event.context.user`

### Path 2: Authorization Header via Auth Plugin
- **Function**: `event.context.user` (set by `server/plugins/auth.ts`)
- **Mechanism**: Reads from `Authorization: Bearer` header
- **Used in**: Server API routes with explicit auth headers
- **Key Point**: Independent of Supabase module

## Bug Impact
- **500 Error**: "Could not verify your quota" in `/api/generate`
- **Root Cause**: `planLimits.ts` used `serverSupabaseUser` but user was null (session not resolved via cookies)
- **Attempted Fixes**: 
  - Added `NUXT_SUPABASE_SERVICE_KEY` → did not fix (wrong issue)
  - Rewrote `planLimits.ts` to direct `createClient` → did not fix (userId undefined)
- **Actual Fix**: Ensure consistent session resolution across both paths

## Recommendation
- Use `serverSupabaseUser(event)` for SSR cookie-based auth (most common)
- Use `event.context.user` only when Authorization header is explicitly provided
- Never assume both paths resolve the same user simultaneously

---

*Compiled from: 2026-06-14 session (04:29)*