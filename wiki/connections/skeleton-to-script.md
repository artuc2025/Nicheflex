# Skeleton → Script Connection

## Relationship
Script generation depends on skeleton existence. Script is the second step in the generation pipeline.

## Critical Path
1. User generates breakdown (free tier)
2. User generates skeleton (free tier, requires breakdown)
3. User generates script (Pro only, requires skeleton)

## Why This Dependency
- Script prompt receives skeleton as input — skeleton structure shapes script narrative
- Skeleton acts/beats become script sections
- Skeleton's hook_line and CTA_line seed the script's opening and closing

## Quota Implications
- Skeleton: counted against free tier quota
- Script: counted against Pro tier quota (30/month)
- A user must have both quotas available to complete full pipeline

## Resolution
- Ensure skeleton exists before script generation button is enabled
- UI enforces one generation at a time per niche

---

*Compiled from: 2026-06-14 session (21:05)*
