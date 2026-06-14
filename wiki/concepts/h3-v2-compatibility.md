# h3 v2 Compatibility Issues

## Context
Nuxt 3 uses h3 v2 for its HTTP framework. Several API utilities changed between h3 v1 and v2, causing runtime crashes.

## Known Issues & Fixes

### 1. `getQuery(event)` Crash
- **Error**: "Invalid URL" thrown
- **Cause**: `getQuery()` doesn't handle internal routes properly
- **Fix**: Use `new URL(event.node?.req?.url, 'http://localhost').searchParams`

### 2. `getHeader(event)` Crash
- **Error**: Cannot read property of undefined
- **Cause**: `getHeader()` not compatible with h3 v2 event structure
- **Fix**: Use `event.headers?.get?.('authorization')` directly

### 3. Event Structure Changes
- `event.node.req.url` — full URL string (not just path)
- `event.headers` — Headers object (not plain object)
- `event.context` — still works for custom data

## Files Affected
- `server/api/niches.get.ts` — fixed `getQuery` crash
- `server/api/scan.post.ts` — uses direct header access

## Prevention
- Always test API endpoints with actual HTTP requests (not just type checking)
- Check h3 changelog when upgrading Nuxt versions
- Prefer direct property access over helper functions when uncertain

---

*Compiled from: 2026-06-14 Session (15:08)*
