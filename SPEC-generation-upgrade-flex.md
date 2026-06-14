# NicheHeat — Spec: Generation Upgrade (FLEX Integration) v1.0

**Тип:** Implementation Spec / Roadmap
**Scope:** апгрейд генерации на базе FLEX ENGINE — скелет → полный сценарий → продакшн-ассеты
**Зависимости:** `NICHE-PROFILES-flex.md` (профили ниш), текущие flex.ts / validateGeneration.ts / runGeneration.ts / harness
**Статус:** Ready — реализуем по тирам

---

## 1. Цель и роадмап к продаваемому продукту

**Цель:** превратить генерацию из «тонкого структурного каркаса» в **ядро дифференциации**,
которое не стыдно продавать за $39/мес. FLEX ENGINE — это полный продакшн-конвейер; мы
переносим его ценность в one-click продукт по тирам, не ломая архитектуру.

**Роадмап (выбран путь к сильному продукту):**

- **Phase 1 — Сделать продукт ДОСТОЙНЫМ покупки** (главный фокус разработки)
  - Tier 1: апгрейд скелета (профили ниш + анти-бан + нормальные входы + фиксы багов)
  - Tier 2: генерация полного сценария (закрывает обещание «to script»)
  - *Параллельно: регистрация Lemon Squeezy (фон, ревью 1–3 дня).*
- **Phase 2 — Сделать продукт ПОКУПАЕМЫМ**
  - Lemon Squeezy интеграция (webhook + checkout) + view-гейтинг ниш
- **Phase 3 — Валидация и запуск**
  - Закрытая бета → публичный запуск
- **Phase 4 — «Вау», полный конвейер (v2)**
  - Tier 3: продакшн-ассеты (посценовка + image/video промпты) — то, чего нет ни у кого

---

## 2. Архитектурные решения

**ОСТАВЛЯЕМ:**
- One-shot JSON генерацию (продукт — «в один клик», НЕ интерактивный Phase A как FLEX).
- Спайн контракта (title_options / hook / acts+beats / reveal / narrator_asides / cta /
  authenticity_checklist) — он совместим с обоими классами структур.
- Валидатор + retry + харнесс-гейт.

**МЕНЯЕМ (Tier 1):**
- MECHANICS_BLOCK (общий) → **per-niche-profile-driven** структура (DRAMA vs DOCUMENTARY).
- Контракт: 2 поля становятся универсальными (см. §5), чтобы один контракт работал и для
  драмы, и для документалки.
- Скелет получает реальные входы (outliers + вывод breakdown), а не только название.

**НЕ ДЕЛАЕМ сейчас:** интерактивное интервью (ниша из сканера); вывал 150 сцен за один вызов
(это Tier 3, постранично).

## 3. Система профилей ниш

Источник правды — `NICHE-PROFILES-flex.md`. Реализация:
- Перенести 5 профилей в код как структурированный объект `NICHE_PROFILES[slug]` с полями:
  `class` (drama|documentary), `lengthMin/Max`, `narrationWords`, `protagonist`, `antagonist`,
  `setting`, `artLock` (required phrases + banned words), `emotionalEngine`, `visualSignature`,
  `endingCta`, `arc` (упорядоченные акты с таймингами и назначением), `centralEngineLabel`,
  `escalationLabel`.
- Промпт скелета/сценария по `niche.slug` подставляет нужный профиль: его ARC становится
  скелетом act-структуры, artLock и emotionalEngine — контекстом, anti-ban — обязательным слоем.
- DRAMA-профили (family/true-crime/business) используют BLOCK 1-спайн; DOCUMENTARY (history/
  space) — документальный 5-актный спайн (hook+central question → context → deepening →
  revelation → consequence).

## 4. Tier 1 — Апгрейд скелета

### 4.1 Фиксы (в любом случае)
- **Рендер-баги:** `counterattack_waves` и `narrator_asides` выводятся как `[object Object]` —
  итерировать `.action` / `.note` (в UI render).
- **Входы:** сейчас скелет получает только `nicheTitle`. Завести:
  - `entryAngle` и `hookPattern` — берутся из **последнего breakdown этой ниши** (поля
    `entry_angle`, `hook_patterns[0]`), если он есть; промпт их принимает, но они не передавались.
  - топ-3 outlier-видео ниши (заголовки + ratio) — как «доказанные паттерны темы».
  Источник: `generate.post.ts` тянет последний breakdown + outliers из БД и кладёт в `runGeneration`.

### 4.2 Per-niche структура
- Промпт берёт `arc` из профиля ниши и инструктирует модель строить акты ПО ЭТОМУ спайну
  (DRAMA → 5-акт revenge; DOCUMENTARY → 5-акт doc). Тайминги из профиля = не равные трети.
- artLock + emotionalEngine + visualSignature идут в системный промпт как «голос канала».

### 4.3 Анти-бан из BLOCK 2
- Влить 6 правил BLOCK 2 в системный промпт (originality / variation / human judgment /
  visual effort / disclosure&safety / title honesty).
- **Originality в валидатор:** добавить эвристику — если скелет похож на дословный пересказ
  (маркеры «based on a true reddit», прямые длинные цитаты) → contract-fail → ретрай. (Лёгкая
  версия; полноценная проверка — Tier 2 на уровне сценария.)
- Сохранить enforcement бан-фраз (уже есть).

## 5. Эволюция контракта (Tier 1)

Чтобы ОДИН контракт работал для драмы и документалки, два поля делаем универсальными:

| Было (drama-only) | Стало (универсальное) | Drama | Documentary |
|---|---|---|---|
| `mystery_object {what, first_mention_act, reveal_act}` | `central_engine {what, planted_in_act, paid_off_in_act}` | withheld mystery object | withheld central question |
| `counterattack_waves [{wave, answers_setback, action}]` | `escalation_ladder [{rung, beat, raises_stakes}]` | sabotages → counterattacks | deepening forces/anomalies |

Остальной спайн — без изменений: `title_options`, `hook`, `acts[]` (n, label, start_pct,
end_pct, beats[], loop_tightener), `reveal {what_changes, recontextualizes_scenes[]}`,
`narrator_asides[]`, `cta`, `authenticity_checklist[]`. Добавить `niche_slug` и `structure_class`
(drama|documentary) в вывод — для рендера и аналитики.

**Затрагивает:** flex.ts (промпт + контракт), validateGeneration.ts (переименовать проверки),
UI render (новые имена полей + фикс багов), harness (валидатор — единый источник). После —
**перепрогон харнесс-гейта** (дешёвый, по 1 разу на нишу сначала).

## 6. Tier 2 — Полный сценарий (закрывает «to script»)

- Новый тип генерации `script` (или второй шаг после скелета): на вход — утверждённый
  скелет + профиль ниши → на выход **полный нарративный сценарий** (FLEX STEP 2):
  - в `narrationLanguage` профиля (English), по `narrationWords` (1500–2300 для драмы,
    2000–3200 для документалки), flowing voice-over, по beats скелета, с локнутым ending/CTA.
  - Контракт: `{ title, script_markdown, word_count, section_headers[], hook_line, cta_line }`.
- Влезает в один вызов (один Gemini-вызов, ~2–4k токенов вывода). maxTokens ↑ для script.
- Лимиты: script — Pro-only (как skeleton), отдельная квота или общая со skeleton (решить).
- Анти-бан originality здесь — жёстче: валидатор отклоняет, если сценарий содержит длинные
  дословные блоки (риск reused-content).
- UI: кнопка «Generate Full Script» появляется, когда есть скелет; рендер сценария + копирование.

## 7. Tier 3 — Продакшн-ассеты (v2-модуль, Phase 4)

Тяжёлый слой, постранично, отдельная фича. Маппинг FLEX STEP 4–7:
- **Scene breakdown** (STEP 5): сценарий → 110–150 сцен (4–8 сек), по профилю.
- **Per-scene image prompts** (STEP 6): с artLock required-phrases, character-in-frame.
- **Per-scene image-to-video prompts** (STEP 7): движение/камера.
- **Character sheet + environment pack** (STEP 3B/4): консистентность.
- **Viral metadata** (BONUS): заголовок/описание/хэштеги/дисклеймер.

Архитектура: НЕ один вызов. Пагинация (батчи по N сцен), фоновая генерация, прогресс в UI,
хранение ассетов в БД/Storage. Это самостоятельный спринт — детальный спек отдельно в Phase 4.

## 8. Что меняется, по файлам

| Файл | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| `server/prompts/flex.ts` | профили + arc + BLOCK2 + контракт | + `scriptPrompt()` | + scene/image/video промпты |
| `server/utils/validateGeneration.ts` | central_engine/escalation_ladder + originality | + script-валидатор | + asset-валидаторы |
| `server/utils/runGeneration.ts` | прокидывать профиль + breakdown/outliers | + type='script' | + paginated asset runs |
| `server/api/generate.post.ts` | тянуть breakdown+outliers из БД | + script лимиты | + asset endpoint(ы) |
| `pages/app.vue` | фикс [object Object] + новые поля | + кнопка/рендер сценария | + ассет-UI |
| `scripts/test-harness.ts` | новый контракт + per-niche arc | + script-прогон | — |
| БД | `niche_slug`/`structure_class` опц. | таблица/поле для сценариев | ассеты |

## 9. Sequence

1. Перенести `NICHE_PROFILES` в код (§3).
2. Tier 1: фиксы багов + входы (§4.1) → per-niche структура (§4.2) → анти-бан (§4.3) →
   эволюция контракта (§5) → обновить валидатор + UI + харнесс.
3. Дешёвый харнесс-прогон (по 1/нишу) → подтвердить контракт и качество структуры.
4. Tier 2: полный сценарий (§6) → валидатор → UI → дешёвый прогон.
5. *Параллельно с 1–4: Lemon Squeezy регистрация (фон).*
6. Phase 2: LS интеграция + view-гейтинг. Phase 3: бета. Phase 4: Tier 3.

**Definition of Done (Phase 1):** скелет строится по правильной per-niche структуре с реальными
входами, анти-бан в проде, полный сценарий генерится, харнесс зелёный → продукт достоин покупки.
