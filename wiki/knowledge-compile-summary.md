# Knowledge Compilation Summary

**Date:** 2026-06-14  
**Source:** Daily log sessions (01:58 and 04:29)  
**Status:** Complete

## Articles Created

### Concept Articles (3)
1. **[Generation UI](concepts/generation-ui.md)** - Complete generation interface with state machine, structured renderers, error handling, and history
2. **[Session Resolution Paths](concepts/session-resolution-paths.md)** - Two independent auth paths causing 500 errors
3. **[Client-Side History with RLS](concepts/client-side-history-rls.md)** - History data fetched client-side with RLS policies

### Connection Articles (1)
1. **[Auth → Generation](connections/auth-to-generation.md)** - Session resolution affects generation quota checks

## Key Insights Captured

### Architecture
- **Two Auth Paths**: `serverSupabaseUser` (SSR cookies) vs `event.context.user` (Authorization header)
- **Generation UI Architecture**: State machine pattern with client-side history
- **Security Pattern**: Client-side RLS for history, server-side service role for writes

### Bug Root Causes
1. **Session Resolution Failures**: `serverSupabaseUser` returns null when SSR cookies not set
2. **UUID Errors**: `onMounted` fires before Supabase session loads → fixed with `watch(user, ..., { immediate: true })`
3. **500 Error**: "Could not verify your quota" due to userId undefined in count query

### Technical Patterns
- **State Machine**: Managing generation states (idle, generating, success, error)
- **Client-Side RLS**: Using `useSupabaseClient()` with RLS policies for read-only data
- **One Generation at a Time**: Enforced by `generatingFor` ref

## Files Updated
- `wiki/index.md` — Added 4 new entries (now 21 total)
- `wiki/log.md` — Added compilation timestamp entry

## Relationship to Existing Articles
- **Extends** `server-side-supabase-clients.md` with session resolution details
- **Complements** `auth-to-profile.md` with generation-specific auth issues
- **Updates** `supabase-service-role-keys.md` context with debugging insights

## Next Steps
- Update `server-side-supabase-clients.md` to reference session resolution paths
- Consider adding debugging playbook for similar auth issues
- Monitor generation endpoint in production for session resolution