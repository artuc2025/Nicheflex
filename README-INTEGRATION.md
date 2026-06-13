# NicheHeat — Week 3–4 Integration Pack

Drop-in files for the existing Nuxt 3 + Supabase project. Order of integration matters — follow the sequence.

## Files

| File | Purpose | Week |
|---|---|---|
| `pages/index.vue` | Mini-landing + lead magnet (thermal strip + email capture) | now |
| `server/api/subscribe.post.ts` | Email capture → Supabase + Resend welcome | now |
| `supabase/07_subscribers.sql` | `subscribers` table migration | now |
| `server/utils/aiProvider.ts` | Provider abstraction (anthropic / gemini / your FastAPI) | 3 |
| `server/prompts/flex.ts` | FLEX prompts: Niche Breakdown + Script Skeleton, strict JSON contracts | 3 |
| `scripts/test-harness.mjs` | Generation QA: 8 категорий × 3 прогона, авточек качества | 3 |
| `server/utils/planLimits.ts` | Лимиты тарифов (Free: 1 breakdown; Pro: 30 skeletons/мес) | 3 |
| `server/api/webhooks/lemonsqueezy.post.ts` | LS webhook → `subscriptions` sync, HMAC-верификация | 4 |

## Шаг 1 — лендинг + lead magnet (1–2 дня, деплой сразу)

1. Прогнать `supabase/07_subscribers.sql` в SQL editor.
2. Скопировать `pages/index.vue` (существующий index переименовать в `pages/app.vue` или перенести дашборд под `/app`).
3. Скопировать `server/api/subscribe.post.ts`.
4. ENV: `RESEND_API_KEY`, `RESEND_FROM` (домен подтвердить в Resend).
5. Деплой на Vercel — обкатываем пайплайн заранее: env-переменные, OAuth redirect URLs (добавить прод-домен в Google Console и Supabase Auth → URL Configuration).

В `index.vue` стрип ниш сейчас на DEMO-данных — после первого прод-скана замени на `useFetch('/api/niches?...')` (закладка в коде помечена).

## Шаг 2 — генерация (основной спринт)

1. Скопировать `aiProvider.ts`, `flex.ts`, `planLimits.ts`.
2. В `generate.post.ts`:
   ```ts
   import { nicheBreakdownPrompt, scriptSkeletonPrompt } from '../prompts/flex'

   const user = await serverSupabaseUser(event)            // auth обязателен
   await assertGenerationAllowed(event, user.id, body.type) // лимиты ДО вызова AI
   const prompt = body.type === 'breakdown'
     ? nicheBreakdownPrompt(body.niche)
     : scriptSkeletonPrompt({ nicheTitle: body.niche.title, format: 'longform', targetMinutes: body.targetMinutes ?? 12 })
   const res = await aiGenerate({ ...prompt, json: true })
   // сохранить в generations: { user_id, niche_id, type, payload_json: res.parsed }
   ```
3. **MERGE POINT:** в `flex.ts` вставь содержимое своих `flex-bridge.md` / `flex-longform-addon.md` в `MECHANICS_BLOCK`. OUTPUT CONTRACT не трогать — на него завязаны харнесс и UI.
4. ENV: `AI_PROVIDER=fastapi` + `AI_SERVICE_URL` (твой текущий сервис) — адаптер `callFastAPI` подгони под контракт своего FastAPI (путь/поля помечены).

## Шаг 3 — тест-харнесс (гейт перед бетой)

```bash
node scripts/test-harness.mjs                # 8 категорий × 3 прогона × оба типа
HARNESS_API=http://localhost:3000 node scripts/test-harness.mjs --runs 2 --type skeleton
```

Что проверяет: валидность JSON-контракта, ≥3 hook-паттернов с {placeholders}, акты НЕ равными третями (анти-шаблон), reveal реконтекстуализирует ≥2 сцены, ≥2 counterattack-волны, ≥2 narrator asides, отсутствие generic-фраз ("in today's video"…), уникальность хуков между прогонами.

Вердикты: **PASS ≥90%** → можно в бету. **WARN 75–90%** → чинить топ-issues. **FAIL <75%** → промпты дорабатывать. Отчёты в `harness-reports/*.json`.

Это же — инструмент A/B моделей: прогони харнесс с `AI_PROVIDER=fastapi`, потом `AI_PROVIDER=anthropic`/`gemini`, сравни проценты и латентность.

## Шаг 4 — Lemon Squeezy (Week 4)

1. Зарегистрировать магазин **уже сейчас** (ручная проверка занимает 1–3 дня).
2. Product: NicheHeat Pro, $39/мес (+годовой $290).
3. Checkout-ссылка обязана передавать `checkout[custom][user_id]=<uuid юзера>` — иначе webhook не свяжет оплату с аккаунтом.
4. Скопировать webhook-файл, в LS подписаться на subscription_* события, ENV: `LEMONSQUEEZY_WEBHOOK_SECRET`.
5. Тест: LS Test Mode → купить тестовую подписку → проверить строку в `subscriptions` → проверить, что `assertGenerationAllowed` пускает skeleton.

В `subscriptions` нужен уникальный индекс: `create unique index on subscriptions (ls_subscription_id);` и колонка `ends_at timestamptz` если её нет.

## ENV сводно

```
# AI
AI_PROVIDER=fastapi            # fastapi | anthropic | gemini
AI_SERVICE_URL=
AI_SERVICE_KEY=
ANTHROPIC_API_KEY=             # для A/B
GEMINI_API_KEY=                # для A/B

# Email
RESEND_API_KEY=
RESEND_FROM="NicheHeat <hello@yourdomain>"

# Billing
LEMONSQUEEZY_WEBHOOK_SECRET=

# Supabase — уже настроены в проекте
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

## Definition of Done (до беты)

- [ ] Лендинг в проде, письмо приходит, подписчик появляется в таблице
- [ ] Харнесс даёт PASS (≥90%)
- [ ] Free-юзер получает 402 на втором breakdown и на любом skeleton
- [ ] Тестовая LS-подписка открывает Pro-лимиты
- [ ] Хуки уникальны между прогонами (cross-check ✅)
