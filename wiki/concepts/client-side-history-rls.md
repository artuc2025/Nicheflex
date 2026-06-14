# Client-Side History with RLS

## Pattern
History data fetched client-side using Supabase with Row Level Security (RLS) policies, not server-side.

## Implementation
- **Location**: `pages/app.vue` (Generation UI)
- **Method**: `useSupabaseClient()` for client-side queries
- **Auth**: `useSupabaseUser()` for current user
- **RLS Policy**: `auth.uid() = user_id` (SELECT policy)

## Why Client-Side?
- **Simplicity**: No server API route needed for read-only history
- **Real-time**: Updates automatically when data changes
- **Security**: RLS ensures users only see their own generations

## Key Code Pattern
```typescript
const user = useSupabaseUser()
const supabase = useSupabaseClient()

// Fetch history with RLS
const { data: history } = await supabase
  .from('generations')
  .select('*')
  .eq('user_id', user.value?.id)
  .order('created_at', { ascending: false })
```

## Bug Fix
- **UUID Error**: `invalid input syntax for type uuid: undefined`
- **Cause**: `onMounted` fired before Supabase session loaded
- **Solution**: `watch(user, ..., { immediate: true })` ensures user is loaded before query

---

*Compiled from: 2026-06-14 session (04:29)*