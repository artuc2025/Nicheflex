# NicheHeat — Project Status & Checklist (v2)

**Живой трекер проекта.** Обновлено: 14 июня 2026.
Единый источник правды по статусу. PRD = vision; завершённые спеки (Step 1/2) = архив;
`SPEC-generation-upgrade-flex` = план апгрейда; `NICHE-PROFILES-flex` = IP-фундамент.

---

## Где мы сейчас (одной строкой)

Лендинг живой, waitlist копится. Генерация и сканер работают на реальных Tier-1 данных.
**Решено:** перед монетизацией усиливаем генерацию (FLEX) до уровня, который не стыдно
продавать. Роадмап ниже ведёт к сильному продукту.

---

## ✅ СДЕЛАНО

### Инфраструктура
- [x] Домен nicheheat.com, Resend (verified), Supabase, Vercel, Google OAuth

### Лендинг + waitlist (Step 1)
- [x] Лендинг в проде, термо-полоса, email-захват end-to-end, идемпотентность, honeypot

### Ядро генерации (Step 2)
- [x] Gemini 2.5-flash напрямую из Nitro (Python выброшен)
- [x] FLEX-промпты (breakdown + skeleton), JSON-контракты, валидаторы + retry + бан-фразы
- [x] Лимиты (Free 1 breakdown; Pro 30 skeletons), UI генерации, история, подгрузка при открытии
- [x] Харнесс-гейт 92%, бан-фразы → 0

### Сканер ниш
- [x] Ratio/HEAT outlier-логика, per-niche запросы/фильтры
- [x] Языковой фильтр (non-Latin + 22 ключевика + defaultAudioLanguage) → Tier-1 English
- [x] Admin-gated + кулдаун 8ч + дневной cap 9000 единиц, пустые ниши скрыты
- [x] 5 чистых ниш: history(26), true-crime(17), space(17), family-drama(16), business(12)
- [x] Задвинуты (big-channel): finance, ai-tools, horror

---

## 🔜 РОАДМАП К СИЛЬНОМУ ПРОДУКТУ

### ▣ PHASE 1 — Сделать продукт ДОСТОЙНЫМ покупки 🔴 ГЛАВНЫЙ ФОКУС
*Спек: `SPEC-generation-upgrade-flex`. Профили: `NICHE-PROFILES-flex`.*

**Tier 1 — апгрейд скелета**
- [x] Профили ниш составлены (5 шт., drama + documentary) — `NICHE-PROFILES-flex`
- [x] Перенести профили в код (`server/utils/nicheProfiles.ts` — NICHE_PROFILES[slug])
- [x] Фикс рендер-багов: `counterattack_waves` → `escalation_ladder`, `narrator_asides` → объекты `{act,note}`, `mystery_object` → `central_engine`
- [x] Завести реальные входы: breakdown (`entry_angle`, `hook_patterns`) + топ-3 outliers → в skeleton
- [x] Per-niche структура: DRAMA 5-акт / DOCUMENTARY 5-акт (ARC в профиле)
- [x] Анти-бан BLOCK 2 в промпт (6 правил originality)
- [x] Эволюция контракта: `mystery_object` → `central_engine`, `counterattack_waves` → `escalation_ladder`
- [x] Обновить валидатор + UI + харнесс → билд чистый
- [x] Харнесс-прогон (1/нишу) → 10/10 PASS (100%), 0 banned phrases

**Tier 2 — полный сценарий (закрывает «to script»)**
- [x] Новый тип script: скелет + профиль → нарративный сценарий (1500–3200 слов)
- [x] Контракт сценария + валидатор (жёсткий originality) + Pro-лимит
- [x] UI: «Generate Full Script» при наличии скелета + рендер/копирование
- [x] Харнесс скриптов: 5/5 PASS (100%)

**Параллельно (фон):**
- [ ] 🟠 Lemon Squeezy — регистрация Store + продукт Pro $39 + payout (ревью 1–3 дня)

### ▣ PHASE 2 — Сделать продукт ПОКУПАЕМЫМ
- [ ] Lemon Squeezy интеграция: webhook → subscriptions, checkout с custom[user_id],
      subscriptions (ends_at + unique index), тест в Test Mode → Pro открывается
      (будет отдельный глубокий анализ перед имплементацией)
- [ ] View-гейтинг ниш: Free топ-3 + задержка | Pro все 5 свежими
- [ ] Vercel Pro к приёму денег (нужен и для прод-скелетов: 17с > Hobby 10с)

### ▣ PHASE 3 — Валидация и запуск
- [ ] Cron — автоскан раз в неделю (заменить ручной admin-триггер)
- [ ] Чистый полный ре-скан (вычистить 2 региональных ряда в true-crime/space)
- [ ] Закрытая бета (10–20 человек)
- [ ] Публичный запуск (Product Hunt + контент-волна)

### ▣ PHASE 4 — «Вау»: полный конвейер (v2)
- [ ] Tier 3 — продакшн-ассеты: посценовка (110–150) + image-промпты + video-промпты +
      character sheet + environment pack + viral metadata (FLEX STEP 4–7). Постранично,
      фоновая генерация. Отдельный детальный спек в Phase 4. Это дифференциатор, которого
      нет ни у одного конкурента — полный путь «ниша → готовые к продакшну ассеты».

---

## ⚠️ Watch / Tech Debt

- [ ] Gemini 503 — проверить, что проект на платном rate-limit tier
- [ ] Vercel Pro для прод-скелетов и по ToS при монетизации
- [ ] RPM — оценка по категории (API реальный RPM не отдаёт)
- [ ] In-memory rate-limits → Redis на масштабе
- [ ] One-click unsubscribe до первой массовой рассылки
- [ ] Мониторинг стоимости генерации (платный Gemini) при росте юзеров
- [ ] Стоимость Tier 1+2: больше токенов на вызов (полный сценарий) — заложить в юнит-экономику

---

## Ключевые факты (текущая реальность)

| | |
|---|---|
| Бренд / домен | NicheHeat / nicheheat.com |
| AI | Gemini 2.5-flash (платный), напрямую из Nitro |
| Стек | Nuxt + Supabase + Vercel + Resend + Lemon Squeezy (в работе) |
| Service-key env | NUXT_SUPABASE_SECRET_KEY (sb_secret_) |
| Admin-скан | NUXT_ADMIN_USER_ID / NUXT_PUBLIC_ADMIN_USER_ID |
| Живые ниши | history, true-crime, space-science, family-drama, business-stories |

---

## Документы проекта

- **NicheHeat-MVP-PRD-v1.2** — vision (референс)
- **SPEC-step1-landing-leadmagnet** — архив (сделано)
- **SPEC-step2-generation-core** — архив (сделано)
- **SPEC-generation-upgrade-flex** — план апгрейда (Phase 1/4)
- **NICHE-PROFILES-flex** — IP-фундамент (5 локнутых профилей)
- **PROJECT-STATUS-checklist (v2)** — этот файл, живой статус
- ~~README-INTEGRATION~~ — удалён
