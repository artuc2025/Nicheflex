# Auth → Profile Trigger

## Flow
1. User signs up via Supabase Auth
2. Database trigger auto-creates `user_profiles` row
3. Default plan: `free`, `generations_used: 0`

## Security
- RLS policies enforce:
  - Users read/write own profile only
  - Profiles linked to `auth.uid()`

## Implication
No manual profile creation needed — auth signup = profile creation

---

*Compiled from: 2026-06-13 sessions*
