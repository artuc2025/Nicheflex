# NicheHeat — Spec: Step 2 «Generation Core» (v1.0)

**Тип:** Implementation Spec / Engineering Plan
**Scope:** `generate.post.ts` + FLEX-промпты + AI-провайдер + лимиты + персистентность + тест-харнесс + UI генерации в `/app`
**Оценка:** основной спринт недели 3 (5–7 дней)
**Зависимости:** Этап A закрыт (лендинг, auth, Supabase, Vercel). Таблицы `generations`, `niches`, `outlier_videos`, `subscriptions` существуют.
**Статус:** Ready for implementation

---

## 1. Цель и Definition of Success

**Бизнес-цель:** дать продукту его дифференциатор — связку «ниша → разбор → сценарный каркас». Без этого бета бессмысленна (тестировать «ещё один niche finder» незачем).

**Done означает:**
1. Залогиненный юзер из карточки ниши в `/app` генерирует **Niche Breakdown** и **Script Skeleton**, видит структурированный результат.
2. Оба типа возвращают **валидный JSON по контракту** (§5) в ≥90% прогонов (гейт харнесса, §10).
3. Невалидный ответ модели не роняет UX: ретраи (§6), при исчерпании — человекочитаемая ошибка.
4. Лимиты тарифов работают: Free упирается в 402 на втором breakdown и на любом skeleton; Pro — 30 skeletons/мес (§7).
5. Каждая генерация сохраняется в `generations` и учитывается в квоте.
6. Генерация укладывается в таймаут функции Vercel (§11) — не обрывается на длинных скелетах.

**Non-goals (Step 2 НЕ делает):** стриминг ответа, регенерация/редактирование результата, экспорт в PDF/Docx, Content Arbitrage / Hook Intelligence (это v2-модули), Shorts-формат генерации (только long-form).

## 2. Архитектура и поток данных

```
/app (niche card) — "Generate Breakdown" | "Generate Skeleton"
   │  POST /api/generate { type, nicheId }
   ▼
generate.post.ts (Nitro, maxDuration set)
   │ 1. serverSupabaseUser  — требуется auth
   │ 2. assertGenerationAllowed(user, type)  — лимиты ДО вызова AI
   │ 3. fetch niche + outliers из Supabase (по nicheId, не из тела — анти-подмена)
   │ 4. build prompt (flex.ts)
   │ 5. aiGenerate({ json:true }) с ретраями (retryGenerate wrapper)
   │ 6. validate payload против контракта (§5)
   │ 7. insert в generations (user_id, niche_id, type, payload_json)
   ▼
{ ok, payload } | 402 limit | 422 invalid-after-retries | 500
```

**ADR-блок:**

**ADR-1. AI-сервис: прямой вызов провайдера вместо FastAPI-прокси (РЕКОМЕНДАЦИЯ).**
Сейчас `AI_SERVICE_URL` проксирует FastAPI через Vercel rewrite (`/_/ai-service`). Проблема: FastAPI — Python, его исполнение на Vercel требует отдельного рантайма и плохо дружит с долгими AI-вызовами (таймауты, холодный старт Python). Риск: сервис может не подняться на проде или обрываться на длинных генерациях.
Решение: для веб-приложения вызывать провайдера **напрямую** из Nitro через `aiProvider.ts` (`AI_PROVIDER=anthropic`, ключ `NUXT_ANTHROPIC_API_KEY` уже есть). Это убирает Python-на-Vercel как класс проблем. FastAPI оставить только если в нём есть кастомная логика, которую дорого переносить — но для генерации по промпту её, скорее всего, нет.
Trade-off: теряешь mimo-бэкенд, если он давал что-то уникальное. Митигация: абстракция `aiProvider.ts` позволяет вернуть fastapi одной переменной, если понадобится.
**Phase 0 (§4) решает этот вопрос до написания остального кода.**

**ADR-2. Нишу и outliers тянем из БД по `nicheId`, а не из тела запроса.**
Если принимать данные ниши из клиента — юзер может подменить параметры (накрутить RPM, подсунуть чужую нишу). Сервер сам читает нишу из Supabase по id. Тело запроса содержит только `{ type, nicheId, targetMinutes? }`.

**ADR-3. Лимиты проверяем ДО вызова AI.**
Токены стоят денег. `assertGenerationAllowed` бросает 402 раньше, чем мы потратимся на генерацию для юзера, который всё равно упрётся в лимит.

**ADR-4. Валидация payload по контракту, не только «JSON распарсился».**
Модель может вернуть валидный JSON с недостающими ключами или пустыми массивами. Контракт (§5) проверяется структурно; провал → ретрай (§6). Это и есть защита от «генерик/битого» вывода на уровне рантайма, дополняющая харнесс на уровне приёмки.

**ADR-5. Идемпотентность не требуется, но дубль-клик гасим.**
Генерация недетерминирована (каждый вызов — новый результат), поэтому идемпотентность не нужна. Но двойной клик не должен списывать две квоты: на фронте кнопка блокируется на время запроса (состояние `generating`).

## 3. Data Model (используем существующую `generations`)

```
generations (
  id uuid PK,
  user_id uuid → auth.users,
  niche_id uuid → niches,
  type text,                  -- 'breakdown' | 'skeleton'
  payload_json jsonb,         -- валидированный результат
  provider text,              -- 'anthropic' | 'gemini' | 'fastapi' (для аналитики качества)
  model text,
  created_at timestamptz default now()
)
-- RLS: юзер видит только свои генерации
--   policy: select where auth.uid() = user_id
--   insert идёт через service role из эндпоинта (или authenticated insert с проверкой user_id)
-- index: (user_id, type, created_at)  — для подсчёта месячной квоты
```

☐ Проверить, что в `generations` есть колонки `provider`, `model`. [FIX] добавить, если нет.
☐ RLS-политика на select для своих генераций (юзер должен видеть свою историю в `/app`).

## 4. PHASE 0 — AI-сервис gate (делать ПЕРВЫМ, до остального кода)

Цель: за полдня закрыть вопрос «откуда и как мы зовём модель на проде», чтобы не строить генерацию на фундаменте, который не держит.

**Шаг 0.1 — проверить FastAPI на проде.**
- Сделать тестовый POST на `https://nicheheat.com/_/ai-service/generate` (или фактический путь) с минимальным телом.
- Ожидание: 200 + текст. Замерить латентность.
- Если 404/502/таймаут — FastAPI на Vercel не работает (ожидаемо для Python).

**Шаг 0.2 — решение (выбрать одно):**
- **Вариант А (рекомендуемый): прямой провайдер.** `AI_PROVIDER=anthropic`, проверить `NUXT_ANTHROPIC_API_KEY` в Vercel. Тест: вызвать `aiGenerate` с простым промптом из dev → получить ответ. Дальше весь Step 2 строится на этом. FastAPI больше не на критическом пути.
- **Вариант Б: оставить FastAPI, но вынести его с Vercel** на Railway/Render (Python там живёт нормально), `AI_SERVICE_URL` → новый хост. Дороже по инфре и поддержке.

**Критерий выхода из Phase 0:** один работающий, замеренный по латентности путь до модели на проде. Без этого §5–§11 не начинать.

## 5. JSON-контракты (из flex.ts, здесь — источник правды для валидации)

Валидатор проверяет наличие и тип ключей. Минимальная схема (без сторонних либ, ручной guard, или zod если уже в проекте):

**Breakdown** — обязательные ключи: `why_it_works:string`, `narrative_mechanics:string[]` (≥3), `hook_patterns:string[]` (≥3, каждый содержит `{...}`), `audience_psychology:string`, `saturation_risk:{level∈[low,medium,high], reasoning, window_estimate}`, `entry_angle:string`, `red_flags:string[]`.

**Skeleton** — обязательные ключи: `title_options:string[]` (3), `hook:{spoken_line,visual_note,open_question}`, `mystery_object:{what,first_mention_act,reveal_act}`, `acts:[{n,label,start_pct,end_pct,beats:string[],loop_tightener}]` (≥3, НЕ равные трети), `reveal:{what_changes,recontextualizes_scenes:number[]≥2}`, `counterattack_waves:[...]` (≥2), `narrator_asides:[...]` (≥2), `cta:string`, `authenticity_checklist:string[]`.

☐ Вынести валидаторы в `server/utils/validateGeneration.ts` — переиспользуются и эндпоинтом, и харнессом (один источник правды).

## 6. Стратегия ретраев

```
retryGenerate(req, validate, { maxAttempts: 3 }):
  for attempt in 1..maxAttempts:
    try:
      res = aiGenerate(req with json:true)
      issues = validate(res.parsed)
      if issues empty: return res          // успех
      // невалидный контракт — усилить инструкцию и повторить
      req.user += "\nPREVIOUS OUTPUT INVALID: <issues>. Return corrected JSON only."
    catch err:
      if err is non-retryable (401 auth, 402 quota, 400 bad key): throw   // не ретраим
      // retryable: invalid JSON parse, 429, 5xx, timeout
    backoff = base * 2^(attempt-1) + jitter   // 0.5s, 1s, 2s
    sleep(backoff)
  throw 422 "Generation failed validation after N attempts"
```

Правила: **ретраим** — невалидный JSON, провал контракта, 429, 5xx, таймаут. **НЕ ретраим** — ошибки auth/ключа/квоты (бессмысленно, только жжём время). На каждом ретрае контракта добавляем в промпт список проблем — модель чинит себя. Логируем номер попытки и причину для аналитики качества промптов.

## 7. Лимиты и персистентность

- `assertGenerationAllowed(event, userId, type)` (planLimits.ts) — вызов первым, до AI. Free: 1 breakdown/мес, 0 skeleton. Pro: ∞ breakdown, 30 skeleton/мес.
- После успешной генерации — insert в `generations` (включая `provider`, `model` из ответа `aiGenerate`).
- Квота считается по `count` строк в `generations` за текущий месяц (planLimits уже так делает).
- ⚠️ Гонка: два параллельных запроса могут проскочить лимит (count читается до insert). Для MVP приемлемо (риск — +1 генерация). [TD] при необходимости — атомарный счётчик/блокировка.

## 8. API Contract — `POST /api/generate`

| | |
|---|---|
| Auth | требуется (serverSupabaseUser); аноним → 401 |
| Request | `{ "type": "breakdown"\|"skeleton", "nicheId": uuid, "targetMinutes"?: number }` |
| 200 | `{ "ok": true, "payload": <validated json>, "type", "provider" }` |
| 401 | не залогинен |
| 402 | лимит тарифа (текст: что именно исчерпано + предложение Pro) |
| 404 | niche по nicheId не найдена |
| 422 | модель не выдала валидный результат после ретраев |
| 429 | rate-limit (анти-абуз, напр. 10 ген/мин/юзер) |
| 500 | прочие серверные |

☐ Добавить per-user rate-limit (отдельно от лимитов тарифа) — защита от скрипт-абуза дорогого эндпоинта.

## 9. UI-интеграция (`/app`)

- Карточка ниши: две кнопки — **Generate Breakdown**, **Generate Skeleton**.
- Состояния: `idle → generating (кнопка disabled, спиннер) → result | error`.
- Рендер Breakdown: секции why/mechanics/hooks/saturation(бейдж по level)/entry angle/red flags.
- Рендер Skeleton: тайтлы, hook, акты с таймингами (визуально показать, что не равные трети), reveal, counterattack waves, asides, CTA, authenticity-чеклист.
- Ошибки: 402 → инлайн-баннер «Upgrade to Pro» с CTA; 422 → «модель не справилась, попробуйте ещё раз» (повтор не списывает квоту, если не было успешного insert); 429 → «слишком часто».
- История: список прошлых генераций юзера из `generations` (read через RLS).
- ⚠️ Никакого localStorage — состояние в Vue refs (правило артефактов/прода соблюдено и тут).

## 10. Тест-харнесс как гейт перед бетой

- `scripts/test-harness.mjs` (из пакета) — 8 категорий × 3 прогона × оба типа.
- Использует **те же валидаторы**, что и эндпоинт (§5) — импорт из `validateGeneration.ts`, не дублировать логику.
- Гейт: **PASS ≥90%** → можно в бету. WARN 75–90% → чинить топ-issues промптов. FAIL <75% → промпты переписывать.
- Доп. проверки харнесса: уникальность хуков между прогонами, акты не равными третями, нет generic-фраз.
- Запускать против **прод-пути модели** из Phase 0 (тот же провайдер), чтобы мерить реальное качество, а не dev-конфиг.
- Бонус: прогнать с `AI_PROVIDER=anthropic` и `=gemini` → сравнить % прохождения и латентность → выбрать провайдера по качеству/цене осознанно.

## 11. Таймаут функции Vercel (критично для длинных скелетов)

- Генерация long-form skeleton может занять 20–40с. Дефолтные лимиты Vercel: Hobby ~10с (генерация **оборвётся**), Pro — 60с по умолчанию, до 300с настройкой.
- ☐ В роуте `generate.post.ts` задать `maxDuration` (через route rules в `nuxt.config` или `defineRouteMeta`), напр. 60с.
- ☐ Убедиться, что проект на **Vercel Pro** к моменту прод-генерации (на Hobby не влезет; Pro и так нужен по ToS при монетизации).
- Стриминг ответа (улучшил бы UX и обошёл часть таймаута) — [TD] v2, не сейчас.

## 12. Security

- [ ] `/api/generate` требует auth; nicheId валидируется (существует, доступна).
- [ ] Данные ниши берутся из БД, не из тела (ADR-2).
- [ ] AI-ключ только серверный (не в `runtimeConfig.public`).
- [ ] Per-user rate-limit на эндпоинте.
- [ ] Промпт собирается из контролируемых полей ниши; если в title ниши есть пользовательский ввод — он не должен ломать инструкцию (prompt-injection через данные). Для MVP риск низкий (ниши генерит твой сканер, не юзеры), но отметить.

## 13. Test Plan

| # | Сценарий | Ожидание |
|---|---|---|
| T1 | Pro-юзер, breakdown по валидной нише | 200, payload проходит валидатор, строка в generations |
| T2 | Pro-юзер, skeleton, long-form 12 мин | 200, акты не равные трети, укладывается в таймаут |
| T3 | Free-юзер, 2-й breakdown за месяц | 402 |
| T4 | Free-юзер, любой skeleton | 402 |
| T5 | Аноним | 401 |
| T6 | nicheId несуществующий | 404 |
| T7 | Модель вернула битый JSON (замокать) | ретраи → успех или 422, без 500 |
| T8 | Двойной клик по Generate | одна генерация, одна строка квоты |
| T9 | Харнесс 8×3 на прод-провайдере | ≥90% PASS |

## 14. Risks

| Риск | Вер. | Митигация |
|---|---|---|
| FastAPI не работает на Vercel | Высокая | Phase 0 → прямой провайдер (ADR-1) |
| Генерация превышает таймаут функции | Средняя | maxDuration + Vercel Pro (§11) |
| Модель даёт генерик/битый вывод | Средняя | валидатор + ретраи (§6) + харнесс-гейт (§10) |
| Промпты не переносятся между mimo/Gemini/Claude | Средняя | харнесс как A/B (§10), выбрать провайдера по данным |
| Стоимость токенов на длинных скелетах | Низкая-средняя | лимиты тарифа (§7); мониторить расход в бете |
| Гонка при подсчёте квоты | Низкая | принять для MVP, [TD] атомарный счётчик |

## 15. Tech Debt Register

| # | Долг | Триггер |
|---|---|---|
| TD1 | Нет стриминга (юзер ждёт 20–40с со спиннером) | жалобы на ожидание → стриминг |
| TD2 | Гонка квоты (count-then-insert) | замечен абуз → атомарный счётчик |
| TD3 | Нет регенерации/правки результата | запрос бета-юзеров → v2 |
| TD4 | Валидатор ручной (не zod) | рост числа контрактов → схема-либа |

## 16. Sequence (порядок работ)

1. **Phase 0** — AI-сервис gate (§4). Без выхода — не двигаться.
2. Вынести валидаторы `validateGeneration.ts` (§5).
3. `retryGenerate` wrapper (§6).
4. Допилить `generate.post.ts`: auth → лимиты → fetch ниши → prompt → retry → validate → insert (§2, §7, §8).
5. Задать `maxDuration`, проверить Vercel Pro (§11).
6. UI генерации в `/app` (§9).
7. Тест-план T1–T8 локально (§13).
8. **Харнесс-гейт** 8×3 ≥90% на прод-провайдере (§10, T9). Не прошёл — чинить промпты, не идти в бету.
9. Микро-A/B провайдеров (опц.) → зафиксировать выбор.

**Выход Step 2:** генерация работает в `/app`, харнесс зелёный, лимиты держат → готовность к закрытой бете (Week 5).

---
*Следующий spec после приёмки Step 2: «Step 3 — Billing + Beta Launch» (Lemon Squeezy live, Vercel Pro, закрытая бета 10–20 человек).*
