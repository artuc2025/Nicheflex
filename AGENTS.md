# Project Context

## Overview
**NicheHeat** — analytics platform for faceless YouTube creators. Find hot niches, understand why they work, get script skeletons. "From niche to script in one click."

## Tech Stack
- **Framework:** Nuxt 3 (compatibilityVersion 4) + TypeScript
- **UI:** Tailwind CSS with custom brand palette (orange-500 primary)
- **Backend:** Nuxt server routes (Nitro)
- **Database + Auth:** Supabase (Postgres, RLS, Auth)
- **AI Layer:** Anthropic API (Claude) — Niche Breakdown + Script Skeleton
- **Payments:** Lemon Squeezy (merchant of record)
- **Reactivity:** VueUse/Nuxt

## Project Structure
```
├── pages/              # File-based routing (index, login, confirm, dashboard)
├── layouts/            # Layout wrappers (default.vue)
├── middleware/          # Route middleware (auth.ts)
├── components/         # Vue components (empty — build as needed)
├── composables/        # Vue composables (empty — build as needed)
├── server/
│   ├── api/            # Server API routes (empty — build as needed)
│   └── utils/          # Server utilities (empty — build as needed)
├── types/              # TypeScript interfaces (index.ts — core data models)
├── assets/css/         # Styles
├── public/             # Static assets
└── wiki/               # Project knowledge base
```

## Core Data Models (types/index.ts)
- **Niche** — id, slug, title, language, format (long|shorts)
- **NicheSnapshot** — weekly metrics: heat_score, rpm range, views, channels count
- **OutlierVideo** — top-performing videos per niche
- **UserProfile** — plan (free|pro), generations_used
- **Subscription** — Lemon Squeezy subscription link
- **Generation** — AI-generated breakdowns/skeletons

## Conventions
- **Language:** TypeScript strict, `<script setup lang="ts">`
- **Styling:** Tailwind utility classes, dark theme (gray-950 bg, white text, orange-500 accent)
- **Naming:** Vue components PascalCase, composables `use___`, server routes kebab-case
- **Auth pattern:** `middleware/auth.ts` for protected pages, `useSupabaseUser()` / `useSupabaseClient()` in components
- **No comments** in code unless user explicitly asks

## Development Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run generate # Static site generation
npm run preview  # Preview production build
```

## Environment Variables (.env.example)
```
NUXT_PUBLIC_SUPABASE_URL     # Supabase project URL
NUXT_PUBLIC_SUPABASE_KEY     # Supabase anon key
NUXT_YOUTUBE_API_KEY         # YouTube Data API v3
NUXT_ANTHROPIC_API_KEY       # Anthropic API (Claude)
NUXT_PUBLIC_SITE_URL         # App URL
```

## Key Business Rules
- MVP targets faceless YouTube creators (ICP: solo creators, $0-3k/mo revenue)
- Monetization: Free (limited) → Pro $39/mo
- HEAT-score: proprietary metric (growth × monetization ÷ competition)
- FLEX ENGINE: narrative mechanics for script generation (anti-ban layer)
- Data pipeline: YouTube Data API → weekly scan → Postgres → Niche Radar UI
- AI layer: Anthropic Claude for Niche Breakdown + Script Skeleton generation

## Knowledge Base
Wiki-based knowledge base in `wiki/`. Read `wiki/index.md` for available articles.
