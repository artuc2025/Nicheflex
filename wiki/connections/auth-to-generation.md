# Auth → Generation Connection

## Relationship
Generation UI depends on session resolution for quota checks and history fetching.

## Critical Path
1. User clicks "Generate Breakdown"
2. `/api/generate` called with Authorization header
3. `server/plugins/auth.ts` sets `event.context.user`
4. `planLimits.ts` calls `serverSupabaseUser(event)` (SSR cookies)
5. **Bug**: If SSR cookies not set, user is null → quota check fails → 500 error

## Two Auth Points in Generation
- **Quota Check**: Server-side via `serverSupabaseUser(event)`
- **History Fetch**: Client-side via `useSupabaseUser()`

## Resolution
- Ensure SSR cookies are set correctly (Supabase module config)
- Consider using `event.context.user` for server-side generation endpoint
- History always uses client-side auth (RLS enforced)

## Related Issues
- **500 Error**: "Could not verify your quota" (session resolution)
- **UUID Error**: History query failed before session loaded

---

*Compiled from: 2026-06-14 session (04:29)*