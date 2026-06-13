# Lead Magnet Subscribers

## Overview
First conversion funnel step: email capture on landing page → subscribers table → welcome email path.

## Implementation
- **Table:** `subscribers` — id, email, created_at, source (landing|api)
- **Endpoint:** `POST /api/subscribe` — accepts email, returns 200 for new/existing (no user enumeration)
- **Landing Page:** `/` — hero CTA with email input + honeypot field
- **Dashboard:** `/app` — moved from `/dashboard` to keep `/` clean for public landing

## Security
- RLS enabled + zero public policies on subscribers table
- Only service role can insert (bypasses RLS)
- Honeypot: hidden `name="website"` field, bot-filled → silent 200, no DB write

## Action Items
- Pre-deploy: SQL migration, Resend domain verification, Vercel env vars, OAuth redirect URLs
- Verify Resend email delivery in prod (blocked locally)

---

*Compiled from: 2026-06-14 sessions*