# YouTube Language Filtering

## Purpose
English-only content filter preventing non-English videos from polluting niche data. Implemented after horror niche surfaced Hindi/Bengali content.

## Three-Layer Defense

### Layer 1: Non-Latin Script Detection
- `hasNonLatinScript()` checks character distribution
- 15% threshold: allows mixed-script titles while catching clearly non-English content
- Catches Devanagari, Arabic, CJK dominant scripts

### Layer 2: Expanded Keyword Blocklist
- 17 regional language terms added to `EXCLUDE_KEYWORDS`
- Catches romanized Hindi ("GULLI BULLI") and other transliterated content
- Examples: "bhai", "dost", "yaar", "acha", "theek"

### Layer 3: Hard Audio Language Check
- Checks `defaultAudioLanguage` and `defaultLanguage` from YouTube API
- YouTube `relevantLanguage=en` is soft signal only — insufficient for English-only product
- If language field missing or non-English → reject

## Implementation
- **Location**: `server/utils/youtube.ts`
- **Called from**: `server/api/scan.post.ts` in `qualifies()` function
- **Horror niche**: If 0 clean English outliers after filtering, stays hidden (user rejected "regional junk")

## Threshold Rationale
- 15% non-Latin threshold balances:
  - Catching clearly non-English content (Hindi, Bengali, Arabic)
  - Allowing legitimate English content with occasional foreign characters (e.g., brand names, technical terms)

---

*Compiled from: 2026-06-14 Session (15:08)*
