# Pre-Deployment Checklist

## Step 1: Landing + Lead Magnet (Ready)

- [ ] SQL migration: `subscribers` table + RLS policies
- [ ] Resend domain verification (DNS records)
- [ ] Vercel environment variables:
  - `NUXT_SUPABASE_SECRET_KEY`
  - `NUXT_PUBLIC_SUPABASE_URL`
  - `NUXT_PUBLIC_SUPABASE_KEY`
  - `NUXT_YOUTUBE_API_KEY`
  - `NUXT_ANTHROPIC_API_KEY`
  - `NUXT_PUBLIC_SITE_URL`
- [ ] OAuth redirect URLs (Supabase dashboard)

## Blocked Items
- Resend email delivery verification (requires prod environment)

## Post-Deploy
- Verify subscriber flow end-to-end
- Test honeypot bot rejection
- Monitor rate limit (TD1)

---

*Compiled from: 2026-06-14 sessions*