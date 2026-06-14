# Generation UI

## Overview
Complete generation interface for AI-powered niche breakdowns and script skeletons. Built in `pages/app.vue` with state machine, structured renderers, error handling, and history.

## Key Features
- **State Machine**: Manages generation states (idle, generating, success, error)
- **Structured Renderers**: Display niche breakdowns and script skeletons in formatted sections
- **Error Handling**: Graceful error messages and retry logic
- **History**: Client-side Supabase query with RLS (SELECT policy: `auth.uid() = user_id`)
- **One Generation at a Time**: Enforced by `generatingFor` ref to prevent concurrent requests

## Implementation
- Location: `pages/app.vue` (651 lines added, 281 removed)
- Uses `useSupabaseUser()` for auth state
- Uses `useSupabaseClient()` for client-side data fetching
- History fetched on session load with `watch(user, ..., { immediate: true })`

## Technical Details
- **History UUID Error Fix**: `onMounted` fired before Supabase session loaded → fixed with `watch(user, ..., { immediate: true })`
- **Client-Side RLS**: History queries use client Supabase with RLS policies (not server-side)
- **Error Recovery**: Structured error messages from API responses

---

*Compiled from: 2026-06-14 session (04:29)*