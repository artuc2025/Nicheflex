# Tech Debt Registry

## Active Items (TD1-TD5)

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| TD1 | In-memory rate limit | High | Replace with persistent store (Redis/Upstash) |
| TD2 | Demo thermal data | Medium | Placeholder for real analytics |
| TD3 | Mailto unsubscribe | Low | Replace with one-click unsubscribe link |
| TD4 | No double opt-in | Medium | Required for GDPR compliance |
| TD5 | Plain-text welcome email | Low | Upgrade to HTML template |

## Resolution Path
1. **TD1:** Upstash Redis for production rate limiting
2. **TD4:** Implement double opt-in before launch
3. **TD3 + TD5:** Resend templates for HTML emails

---

*Compiled from: 2026-06-14 sessions*