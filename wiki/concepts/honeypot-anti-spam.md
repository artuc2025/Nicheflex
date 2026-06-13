# Honeypot Anti-Spam

## Technique
Hidden form field that bots fill automatically but humans never see or interact with.

## Implementation
- Hidden `<input name="website">` in subscribe form
- Bot fills field → endpoint returns 200 (success) but no DB write
- Human leaves field empty → proceeds with normal flow

## Why 200 Response
- Prevents bots from detecting detection
- Silent rejection: no error feedback to bot
- Looks like success → bot doesn't retry

## Integration with Rate Limiting
- Honeypot catches automated bots
- In-memory rate limit (TD1) catches rapid requests
- Both run before database write

---

*Compiled from: 2026-06-14 sessions*