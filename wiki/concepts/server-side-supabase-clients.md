# Server-Side Supabase Clients

## Two Clients, Different Behavior

| Client | Key Used | RLS | Use Case |
|--------|----------|-----|----------|
| `serverSupabaseClient` | Anon key | Enforced | Public data reads |
| `serverSupabaseServiceRole` | Service role key | Bypassed | Server-only writes |

## When to Use Service Role
- Tables with RLS enabled + zero public policies
- Subscribers table (lead magnet): only service role can insert
- Any server-side operation that writes to user-independent tables

## Implementation Pattern
```typescript
// server/api/subscribe.post.ts
const supabase = serverSupabaseServiceRole(event)
const { data, error } = await supabase.from('subscribers').insert({ email })
```

---

*Compiled from: 2026-06-14 sessions*