# Supabase Schema

## Tables (6)
1. **niches** — id, slug, title, language, format (long|shorts)
2. **niche_snapshots** — weekly metrics: heat_score, rpm range, views, channels count
3. **outlier_videos** — top-performing videos per niche
4. **user_profiles** — plan (free|pro), generations_used
5. **subscriptions** — Lemon Squeezy subscription link
6. **generations** — AI-generated breakdowns/skeletons

## Security
- Row Level Security (RLS) enabled on all tables
- Auto-profile trigger creates user_profile on signup

## Connection Details
- Project: `dykxexytappawsyetbos`
- Region: us-east-1
- New key format: `sb_publishable_*` / `sb_secret_*` (not legacy `anon`/`service_role`)

---

*Compiled from: 2026-06-13 sessions*
