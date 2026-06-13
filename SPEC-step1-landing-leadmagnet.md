# NicheHeat — Spec: Step 1 «Landing + Lead Magnet» (v1.0)

**Тип:** Implementation Spec / Engineering Plan
**Scope:** `07_subscribers.sql` + `pages/index.vue` + `server/api/subscribe.post.ts` + prod-деплой
**Оценка:** 1–2 дня (агентами — меньше)
**Зависимости:** существующий Nuxt 3 + Supabase проект, аккаунты Resend и Vercel
**Статус:** Ready for implementation

---

## 1. Цель и Definition of Success

**Бизнес-цель:** начать накопление email-листа немедленно (KPI PRD: 300 подписчиков к 30-му дню после запуска) и обкатать прод-деплой до основного спринта.

**Done означает:**
1. Лендинг доступен на прод-домене, Lighthouse Performance ≥ 90 mobile.
2. Цикл подписки работает end-to-end: форма → строка в `subscribers` → welcome-письмо в инбоксе (не в спаме) ≤ 30 сек.
3. Повторная подписка того же email идемпотентна (без ошибки пользователю, без дубля в БД).
4. Существующий дашборд и OAuth не сломаны (regression-проверка).
5. Никакие секреты не попадают в клиентский бандл.

**Non-goals (Step 1 НЕ делает):** прайсинг/FAQ-секции, страница unsubscribe (см. §9 — заглушка обязательна, полноценная — Week 4), еженедельная рассылка дайджеста, live-данные в термо-полосе, double opt-in.

## 2. Архитектура и поток данных

```
Browser (index.vue)
   │  POST /api/subscribe { email }
   ▼
Nitro server route (subscribe.post.ts)
   │ 1. rate-limit (in-memory, 5 req/min/IP)
   │ 2. валидация email (regex + длина ≤ 254)
   │ 3. upsert → Supabase (service role, RLS-bypass)
   │ 4. fire-and-forget → Resend API (welcome)
   ▼
{ ok: true } | 4xx/5xx { message }
```

**Ключевые архитектурные решения (ADR-стиль):**

**ADR-1. Service role вместо anon-ключа + RLS-политики на insert.**
Таблица подписчиков не должна иметь НИКАКИХ публичных политик: anon-insert открывает дорогу скрейпингу/спам-заливке в обход нашего rate-limit (Supabase REST доступен напрямую). Все записи — только через наш серверный эндпоинт. Trade-off: чуть больше ответственности на сервере; приемлемо.

**ADR-2. Upsert с onConflict вместо insert + обработка дубля.**
Идемпотентность из коробки + не раскрываем существование email в базе (privacy: ответ одинаков для нового и существующего адреса — user enumeration невозможен).

**ADR-3. Resend — fire-and-forget.**
Падение почтового провайдера не должно ронять подписку: email сохранён — бизнес-цель достигнута, письмо можно дослать. Ошибка логируется, юзеру — success.

**ADR-4. In-memory rate-limit, осознанный технический долг.**
На Vercel serverless карта живёт в рамках инстанса — лимит «мягкий» (несколько инстансов = умножение лимита). Для MVP-лендинга достаточно как анти-дурак; защита от целевой атаки — Vercel WAF/Cloudflare при необходимости. Зафиксировано в §10 Tech Debt. Триггер замены на Upstash Redis: > 1000 подписок/день или обнаруженный спам-залив.

**ADR-5. Demo-данные в термо-полосе на Step 1.**
Полоса — маркетинговый элемент; блокировать запуск лендинга на готовность прод-скана нерационально. Цифры демо-данных консервативны и правдоподобны (не «обещания»). Замена на `GET /api/niches` — отдельная задача после первого прод-скана (закладка в коде).

## 3. Data Model

```sql
subscribers (
  id uuid PK default gen_random_uuid(),
  email text NOT NULL UNIQUE,          -- нормализован: trim + lowercase (на сервере)
  source text NOT NULL default 'landing',  -- landing | beta | import (атрибуция каналов)
  status text NOT NULL default 'active',   -- active | unsubscribed | bounced
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
-- RLS: enabled, политик нет (service-role only)
-- index: (status) — выборки для рассылки
```

Решения: нормализация email строго на сервере (клиентская — UX-подсказка, не контракт); `source` закладывается сразу — через месяц захотим знать, откуда подписчики, а бэкфил невозможен; `status` вместо удаления строк — история bounce/unsubscribe нужна для гигиены рассылок.

## 4. API Contract

`POST /api/subscribe`

| | |
|---|---|
| Request | `{ "email": string }` |
| 200 | `{ "ok": true }` — и для нового, и для существующего email (см. ADR-2) |
| 400 | `{ "message": "Enter a valid email address." }` — невалидный формат/длина |
| 429 | `{ "message": "Too many requests..." }` — > 5 req/min с IP |
| 500 | `{ "message": "Could not save your email. Try again." }` — ошибка БД |

Контрактные требования: тексты ошибок — человекочитаемые, фронт показывает их как есть; никогда не возвращаем детали внутренних ошибок (raw error Supabase — только в server log); валидация: RFC-полнота не нужна, достаточно `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` + length ≤ 254 (полная RFC-валидация — ложное чувство безопасности, реальная проверка — доставляемость).

## 5. Frontend Spec (index.vue)

**Состояния формы (конечный автомат):** `idle → sending → done | error`; из `error` возврат в `idle` при правке поля. Требования:
- `sending`: input и кнопка disabled, текст кнопки «Sending…» — двойной сабмит невозможен.
- `done`: форма заменяется подтверждением (включая совет «добавь в контакты» — поднимает deliverability).
- `error`: сообщение под формой, фокус остаётся в поле.
- Enter в поле = сабмит; `inputmode="email"`, `autocomplete="email"` — мобильная клавиатура.

**Доступность (quality floor):** focus-visible на input/кнопке; `prefers-reduced-motion` отключает пульс термо-ячейки; термо-полоса имеет `role="img"` + aria-label; контраст текста к фону ≥ 4.5:1.

**Перф-бюджет:** без JS-библиотек сверх Nuxt; шрифты через `display=swap`; полоса — чистый CSS (никаких canvas/изображений); LCP — заголовок hero (текст), не изображение.

**Маршрутизация:** существующий дашборд переезжает с `/` на `/app` (или index переименовывается в `app.vue`); middleware auth должен покрывать `/app/**`, лендинг — публичный. ⚠️ Проверить, что redirect после Google OAuth ведёт на `/app`, не на `/`.

## 6. Security Checklist

- [ ] `SUPABASE_SERVICE_KEY` и `RESEND_API_KEY` — только server-side ENV (не `NUXT_PUBLIC_*`); grep бандла после билда: `grep -r "re_" .output/public` → пусто
- [ ] RLS на `subscribers` включён, политик нет; негативный тест: anon-insert через supabase-js из консоли браузера → 401/403
- [ ] Rate-limit отвечает 429 на 6-й запрос за минуту (curl-цикл)
- [ ] Ответ 200 идентичен для нового/существующего email (нет user enumeration)
- [ ] Raw-ошибки Supabase/Resend не утекают в HTTP-ответ
- [ ] Заголовок `x-forwarded-for` берётся через `getRequestIP(..., { xForwardedFor: true })` — корректен за прокси Vercel

## 7. Test Plan

**Локально (до деплоя):**
| # | Сценарий | Ожидание |
|---|---|---|
| T1 | Валидный новый email | 200, строка в БД, письмо пришло |
| T2 | Тот же email повторно | 200, строк по-прежнему одна, updated_at обновлён |
| T3 | `not-an-email`, пустая строка, 300-символьный | 400 с читаемым сообщением |
| T4 | 6 запросов подряд с одного IP | шестой — 429 |
| T5 | Resend недоступен (подменить ключ) | 200 юзеру, ошибка в логе, строка в БД есть |
| T6 | Supabase недоступен | 500 с generic-сообщением |
| T7 | Анонимный insert напрямую в Supabase REST | отказ (RLS) |
| T8 | Дашборд `/app` + Google OAuth | работают как до изменений |

**Прод (smoke после деплоя):** T1 с реального телефона + Gmail-адрес → письмо в Primary/Promotions, не Spam; Lighthouse mobile ≥ 90; проверить логи функции на холодный старт.

## 8. Deploy Plan (Vercel)

1. **Pre-deploy:** прогнать `07_subscribers.sql` в Supabase SQL editor (миграции БД — всегда до кода, который их ждёт).
2. Resend: подтвердить домен (SPF + DKIM записи) — **сделать первым**, DNS-пропагация до часов; до подтверждения слать с `onboarding@resend.dev` для тестов.
3. Vercel ENV (Production + Preview): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`.
4. OAuth: добавить прод-домен в Google Cloud Console (Authorized redirect URIs) и Supabase Auth → URL Configuration (Site URL + Redirect URLs). Классическая засада: preview-домены Vercel меняются — для превью использовать wildcard в Supabase или тестировать OAuth только на проде.
5. Deploy → smoke-тесты §7 → включить Vercel Analytics (бесплатный тир) для замера конверсии лендинга (вход для триггера D4 из PRD: < 2% → копирайт-ревизия).
6. **Rollback-план:** лендинг — аддитивное изменение; откат = `vercel rollback` на предыдущий деплой. Миграция БД отката не требует (новая таблица никого не ломает).

## 9. Compliance-минимум (не пропускать)

Рассылка без работающего unsubscribe нарушает CAN-SPAM/GDPR-гигиену и убивает deliverability. На Step 1 достаточно: в footer каждого письма — ссылка `mailto:hello@<домен>?subject=unsubscribe` + ручная обработка (status → 'unsubscribed'). Полноценный one-click unsubscribe эндпоинт — задача Week 4 (до первой массовой рассылки дайджеста — обязателен). В welcome-письме unsubscribe-строка уже должна быть.

## 10. Tech Debt Register (фиксируем осознанно)

| # | Долг | Триггер возврата |
|---|---|---|
| TD1 | In-memory rate-limit | > 1000 подписок/день или спам-залив → Upstash Redis |
| TD2 | Demo-данные термо-полосы | первый прод-скан → `GET /api/niches` |
| TD3 | mailto-unsubscribe | до первого массового дайджеста → one-click endpoint |
| TD4 | Нет double opt-in | жалобы на спам / deliverability < 95% → confirm-flow |
| TD5 | Welcome-письмо plain-text | A/B после 500 подписчиков → HTML-шаблон |

## 11. Риски Step 1

| Риск | Вероятность | Митигация |
|---|---|---|
| Welcome падает в спам | Средняя | SPF/DKIM до запуска; plain-text (выше deliverability, чем HTML); тест на Gmail/Outlook |
| OAuth ломается при переносе дашборда на /app | Средняя | T8 в тест-плане; redirect URLs проверяются ДО мерджа |
| DNS Resend не успевает к деплою | Низкая | Начать с него (§8.2); fallback onboarding@resend.dev |
| Спам-боты заливают мусорные email | Низкая (MVP) | Rate-limit + TD1/TD4 наготове; honeypot-поле — 15 минут работы, можно добавить сразу |

---
*Следующий spec после приёмки Step 1: «Step 2 — Generation Core» (generate.post.ts + FLEX-промпты + тест-харнесс).*
