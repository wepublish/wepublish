# BKA Event Domain Logic

Scope note: this document describes **what the BKA event domain actually does today** in
`/Users/itrulia/Documents/insitu-admin` (Symfony 6.4 + API Platform + Doctrine, `SYLIUS_THEME=in-situ-admin/bka`),
so it can be re-implemented in the We.Publish Nx monorepo without reading PHP. It covers the date/time/recurrence
model and the exact occurrence-expansion algorithm, the MainEvent/SubEvent split and the field propagation that
keeps them in sync, every maintenance command, the publication/visibility state machine, event duplication, and
both search engines (legacy entity search and the `USE_OPTIMIZED_EVENT_LOAD=true` occurrence search that BKA runs).
Every structural claim is grounded in a file path + line number, and every quantitative claim in a SQL query run
against the **restored BKA production database** (`docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin`,
34,279 events / 118,021 occurrences, snapshot date 2026-10-17). A short, clearly separated "Porting notes" section
is at the end — everything before it is description, not design.

---

## 1. Source inventory

| File | Role |
| --- | --- |
| `src/Entity/Event.php` (880 lines) | Abstract base, single-table inheritance root. All shared columns, status constants, archived-name lifecycle callbacks. |
| `src/Entity/MainEvent.php` (174 lines) | `type='mainevent'`. Owns `recurrence`, `recurrenceWeekDays`, `ticketingUrl`, `subEvents`. Implements `isMultiDayEvent()`. |
| `src/Entity/SubEvent.php` (72 lines) | `type='subevent'`. Owns only `mainevent_id`; delegates recurrence/ticketingUrl/publicationDate/user/images/rates to its main event. `isMultiDayEvent()` is hardcoded `true`. |
| `src/Entity/EventOccurrence.php` (72 lines) | Materialised `(event_id, date_from, date_to)` row. The search index for the whole agenda. |
| `src/Entity/EventProposedBy.php` (103 lines) | Contact details of an external person who proposed an event (firstname, lastname, email, phone, organization as free text). |
| `src/Event/EventDatesCalculator.php` (182 lines) | All date maths: next date, related dates, recurrence expansion, last end date. |
| `src/Event/EventDuplicator.php` (218 lines) | "Copy event" feature. |
| `src/Event/EventListManipulator.php` (191 lines) | In-PHP sorting by `nextDate` and grouping by `YYYY_MM`. |
| `src/Event/EventSearchEngine.php` (119 lines) | Thin facade over the two repository search methods. |
| `src/EventListener/OnFlushEventListener.php` (155 lines) | **The heart of the domain.** On every insert/update of an Event: recompute relatedDates, multiday flag, sub-event propagation, and regenerate all occurrences. |
| `src/EventListener/EventDoctrineListener.php` (30 lines) | `postLoad`: fills the transient `nextDate` — only when `USE_OPTIMIZED_EVENT_LOAD=false` (so **not** on BKA). |
| `src/EventListener/AffiliationAddedListener.php` (73 lines) | When an Organization gains an affiliation, bulk-set `show_in_print=true` on all of its events. |
| `src/EventListener/ArchivedRelationNameListener.php` (55 lines) | When an Organization/Place is renamed, bulk-refresh `archived_organization` / `archived_place` on its non-past events. |
| `src/Repository/EventRepository.php` (383 lines) | Legacy `engineSearch`, similar/organization/place/sponsored queries, the three bulk DQL UPDATEs. |
| `src/Repository/EventOccurrenceRepository.php` (310 lines) | `occurrenceEngineSearch` — the optimized search BKA actually uses. |
| `src/Repository/MainEventRepository.php` (76 lines) | `findByArchivedStatus()` — **dead code**, no caller anywhere in `src/`, `templates/`, `themes/`, `tests/`. |
| `src/Repository/EventProposedByRepository.php` (66 lines) | Plain save/remove, rest commented out. |
| `src/Command/Events*.php`, `src/Command/SubeventsUpdateCategoriesCommand.php` | Five backfill/repair jobs (section 6). |
| `src/Doctrine/Type/LocalDateTimeTzType.php` / `…ImmutableType.php` | Override Doctrine `datetimetz` so loaded values are converted to `Europe/Zurich`. |
| `src/Service/HtmlSanitizerService.php` (25 lines) | `sanitizeTranslatableFields(array $labels)` — runs the Symfony HtmlSanitizer over every string leaf of a labels array. |
| `src/Service/TimeChoiceGenerator.php` (19 lines) | Generates the 96 time choices `00:00 … 23:45` in 15-minute steps used by every time dropdown. |
| `tests/Event/SearchEngineTest.php` (431 lines) | The only domain test; a golden-file-ish fixture matrix (A1–A20, B1–B11). |
| `src/DataFixtures/EventFixtures.php` (400 lines) | Defines that matrix. Essential to read alongside the test. |

Support cast referenced below: `src/Form/EventType.php` (853 lines, the admin form that actually *composes*
`dateFrom`/`dateTo`), `src/Form/Type/SubEventType.php` (192 lines), `src/Controller/EventController.php` (659 lines),
`src/Security/Voters/EventVoter.php`, `src/ApiPlatform/EventExtension.php`, `src/ApiPlatform/OccurrenceExtension.php`,
`src/State/OccurrenceEntityToEventDtoProvider.php`, `src/Mapper/EventEntityToApiMapper.php`.

---

## 2. Feature flags that change event behaviour (BKA values)

All flags are bound in `config/services.yaml:17-41`. BKA values come from `docker-compose.yaml:40-55`.

| Flag | BKA | Where it changes event logic |
| --- | --- | --- |
| `USE_OPTIMIZED_EVENT_LOAD` | **true** | `EventDoctrineListener` skips the `postLoad` nextDate computation (`src/EventListener/EventDoctrineListener.php:22`). `ApiEventController` switches from `searchEvents()` to `optimizedSearchEvents()` (`src/Controller/ApiEventController.php:136-144`) and explicitly calls `completeEventsNextDates()` on the sponsored/similar/org/place endpoints (lines 234, 617, 678, 739). |
| `LIST_OWN_EVENTS_ONLY` | **true** | Non-admins see only events of their organizations or proposed with their e-mail in the admin lists (`src/Controller/EventController.php:66-70, 137-146, 368-372`). |
| `ACTIVATE_MEMBERS` | **true** | Enables the `member` search filter (`EventSearchEngine:71`, `EventOccurrenceRepository:102`) and the `/events/members-only` admin list. |
| `HAS_PRINT_OPTIONS` | **true** | Shows `showInPrint` + `printCategory` + `printDescription` in the form, only for members or admins (`src/Controller/EventController.php:435, 491`). |
| `ACTIVATE_PROPOSAL_PLACE` | **true** | Allows `placeProposed` instead of a real `place`; makes `place` optional on edit (`src/Controller/EventController.php:498`). |
| `ACTIVATE_EVENT_VIDEOS` | **true** | Adds the `videos` collection to the event form. |
| `ACTIVATE_SPONSORED_EVENTS` | **false** | Hides the "sponsor" action (`templates/datatables/event-actions.html.twig:3`). The `/events/sponsor/{slug}` route and `sponsored_*_date` columns still exist. **Confirmed by data: `SELECT count(*) FROM event WHERE sponsored_start_date IS NOT NULL` → 0.** |
| `ACTIVATE_PROINFIRMIS` | false locally | Only touches Place; the event search exposes an `accessibility_proinfirmis` filter that joins `place.proInfirmisPictograms`. **In the restored prod DB exactly 1 place has pictograms.** See §9.4 for a correctness problem with that filter. |
| `ACTIVATE_MULTI_TICKETINGS` | unset ⇒ **false** | `ticketing` table is **empty (0 rows)** in prod, confirming the flag is off. `labels.ticketingUrl` is used instead (28,334 events have it). |
| `ACTIVATE_EVENT_NAME_TRANSLATABLE` | unset ⇒ **false** | Confirmed by data: `SELECT count(*) FROM event WHERE labels::jsonb ? 'name'` → **0**. Only `description`, `printDescription`, `ticketingUrl` keys exist in `event.labels`. |
| `ACTIVATE_IMAGE_GENERATOR` | unset ⇒ false | Confirmed: `og_image` is NULL/empty on **all 34,279 events**. |
| `LOCALES` / `DEFAULT_LOCALE` | `fr\|de` / `de` | `labels` sub-keys are `fr` and `de`; `de` is primary. |

---

## 3. The event date model

### 3.1 Storage

`\d+ event` on the live DB (abridged to the date-relevant columns):

```
 Column                | Type                     | Nullable | Notes
-----------------------+--------------------------+----------+-------------------------------
 date_from             | timestamp with time zone | yes      | Types::DATETIMETZ_MUTABLE
 date_to               | timestamp with time zone | yes      | Types::DATETIMETZ_MUTABLE
 opening_time          | character varying(5)     | yes      | "HH:MM" wall clock string
 recurrence            | character varying(55)    | yes      | 'none' | 'week' | NULL (subevents)
 recurrence_week_days  | text  (DC2Type:json)     | yes      | JSON array of ISO weekday ints
 related_dates         | text  (DC2Type:json)     | yes      | serialized PHP \DateTime objects
 is_multi_day_event    | boolean                  | yes      | denormalised
 publication_date      | timestamp with time zone | yes      |
 sponsored_start_date  | timestamp with time zone | yes      |
 sponsored_end_date    | timestamp with time zone | yes      |
 created_at/updated_at | timestamp with time zone | not null |
```

```
 Table "public.event_occurrence"
 id        | bigint                   | not null
 event_id  | bigint                   | not null   FK -> event(id) ON DELETE CASCADE
 date_from | timestamp with time zone | not null
 date_to   | timestamp with time zone | not null
Indexes: idx_252833_datefrom_idx (date_from), idx_252833_dateto_idx (date_to),
         idx_252833_idx_e61358dc71f7e88b (event_id)
```

Note: `event.date_from` / `event.date_to` are **not indexed**, but `event_occurrence.date_from` / `date_to` are.
`event` has `idx_event_pub_status_date (publication_status, publication_date)`
(`migrations/Version20260626113538.php:19`).

In the live DB **no event has a NULL `date_from` or `date_to`** (`SELECT count(*) FILTER (WHERE date_from IS NULL)`
→ 0, same for `date_to`), even though both columns are nullable and `Event::$dateFrom`/`$dateTo` are `?\DateTime`.

### 3.2 Timezone handling

Three pieces must line up:

1. PHP's default timezone is pinned to `Europe/Zurich` in the image (`Dockerfile:114 → date.timezone=Europe/Zurich`),
   and Twig renders in the same zone (`config/packages/twig.yaml:4`). So every `new \DateTime(...)` constructed by a
   form or a listener is a *Zurich wall-clock* value.
2. PostgreSQL stores `timestamptz` as UTC and returns it in the session timezone (UTC).
3. `src/Doctrine/Type/LocalDateTimeTzType.php:20-39` overrides the built-in `datetimetz` type
   (wired in `config/packages/doctrine.yaml:10-13`) and does
   `$dateTime->setTimezone(new \DateTimeZone('Europe/Zurich'))` on every value loaded from the DB.
   Without it, `->format('H:i')` would return UTC hours. It also falls back to `date_create($value)` because
   Postgres returns fractional seconds (`2026-05-08 11:18:49.967444+00`) that
   `DateTimeTzType::convertToPHPValue()` refuses.
   `LocalDateTimeTzImmutableType` is the `\DateTimeImmutable` twin (used by `TimestampableEntity` and
   `reset_password_request` / `user_token`).

**Consequence that matters for the port:** all weekday arithmetic (`format('N')`), all `setTime()` calls and the
whole recurrence expansion happen in **Europe/Zurich wall-clock time**, not UTC. This is verifiable in the data —
event 32459 (`recurrence_week_days=[5,6]`, 20:00→00:30) expands to:

```
 464340 | 2026-01-23 20:00:00+01 | 2026-01-24 00:30:00+01   (winter, CET)
 ...
 464386 | 2026-07-03 20:00:00+02 | 2026-07-04 00:30:00+02   (summer, CEST)
```

The local time 20:00 is preserved across the DST boundary; the UTC instant shifts by an hour. Any port that
expands recurrences in UTC will drift by one hour for half the year.

### 3.3 How `date_from` / `date_to` are composed by the UI

The admin form never edits a datetime directly. `src/Form/EventType.php` has:

* `dateFrom`, `dateTo` → `DateType` with `widget: single_text`, `html5: true` — **date only** (lines 313-336).
* `slotTimeFrom`, `slotTimeTo`, `slotTimeOpening` → unmapped `ChoiceType` with the 96 choices from
  `TimeChoiceGenerator::generateTimeChoices()` (`00:00`…`23:45`, 15-minute steps) (lines 588-638).
  Defaults for a new event: `slotTimeFrom = 20:00`, `slotTimeTo = 23:30` (lines 677-678).
* `openingTime` is a separate free-text `HH:MM` field (pattern `([01]?[0-9]|2[0-3]):[0-5][0-9]`, line 339-347),
  overwritten from `slotTimeOpening` in POST_SUBMIT (lines 765-768).

`PRE_SUBMIT` (lines 721-755) fills a missing `dateTo`:

```
if schedule == 'continuous' or recurrence == 'week':  data.subEvents = []
if data.dateTo is empty:
    from = dateFrom @ slotTimeFrom
    to   = dateFrom @ slotTimeTo
    data.dateTo = (to <= from) ? dateFrom + 1 day : dateFrom      # overnight slot
```

`POST_SUBMIT` (lines 757-836) then concatenates date + time into the entity:

```
entity.dateFrom = DateTime(dateFrom.format('Y-m-d') + slotTimeFrom)
entity.dateTo   = DateTime(dateTo.format('Y-m-d')   + slotTimeTo)
if dateTo < dateFrom or to < from: form error 'event.flashError.dateTo'
```

Real-data confirmation of the 15-minute grid (`extract(minute from date_from)`):
`:00` 23,585 · `:30` 9,243 · `:15` 957 · `:45` 261 — plus a long tail of legacy minutes (`:02` 86, `:34` 59,
`:59` 49, …) from before the slot dropdowns existed.

`SubEventType` (`src/Form/Type/SubEventType.php`) is the same pattern for each extra date: `dateFrom` + unmapped
`timeFrom`/`timeTo`/`openingTime`, with the identical overnight rule in PRE_SUBMIT (lines 118-143) and the same
concatenation in POST_SUBMIT (lines 145-177).

### 3.4 The three schedule shapes

The form shows a radio `schedule` (unmapped, `continuous` | `recurrent`) plus a `recurrence` select
(`none` | `week`). Together they produce exactly three shapes (`EventType.php:683-696` on load, `:779-803` on submit):

| UI shape | `recurrence` | `recurrence_week_days` | sub-events | Meaning |
| --- | --- | --- | --- | --- |
| **Continuous** | `none` | `NULL` | none (cleared) | One uninterrupted block from `date_from` to `date_to`. May span several days (an exhibition) or cross midnight. |
| **Recurrent → custom dates** | `none` | `NULL` | 1..n `SubEvent` rows | A hand-picked list of slots. The MainEvent holds the first slot, each SubEvent holds one more. |
| **Recurrent → weekly** | `week` | `[1..7]` (ISO: 1=Mon … 7=Sun) | none (cleared) | Every selected weekday between `date_from` and `date_to`, at `date_from`'s time-of-day → `date_to`'s time-of-day. |

The two "recurrent" sub-shapes are mutually exclusive, enforced both in PRE_SUBMIT (`data['subEvents'] = []`
when `recurrence == 'week'`, line 724-731) and POST_SUBMIT (`removeSubEvent` loop, lines 796-802).
**Verified in production data: `SELECT count(*) FROM event s JOIN event m ON s.mainevent_id=m.id WHERE m.recurrence='week'` → 0.**
No weekly main event has a single sub-event.

Live distribution:

```sql
SELECT type, recurrence, count(*) FROM event GROUP BY 1,2 ORDER BY 3 DESC;
   type    | recurrence | count
-----------+------------+-------
 mainevent | none       | 20356
 subevent  | (null)     | 13163
 mainevent | week       |   760
```

`recurrence_week_days` values actually used (top of 34 distinct values):

```
 [2,3,4,5,6,7] 108 | [6,7] 73 | [6] 72 | [2,3,4,5] 56+34 | [7] 55 | [1,2,3,4,5,6,7] 51
 [3] 34 | [3,4,5,6,7] 34 | [3,4,5] 30 | [3,4,5,6] 27 | [4,5] 24 | [2] 22 | [1] 17 | [4] 16 …
 []  4   <-- produces zero occurrences
```

**Two rows store a JSON *object* instead of an array** — a PHP array whose keys were not re-indexed:

```
 27322 | {"1":3,"2":4,"3":5,"4":6}   -> Wed,Thu,Fri,Sat   (28 occurrences, all Wed..Sat)
 19682 | {"4":6,"5":7}               -> Sat,Sun           (24 occurrences, all Sat/Sun)
```

PHP's `in_array($dow, $weekDays)` matches on *values*, so both behave correctly; a port that assumes
`number[]` and `JSON.parse`s it as an array will break on these two rows. (Verified: the occurrence rows for
both events fall only on the weekdays implied by the *values*.)

### 3.5 What "multiday" means

`is_multi_day_event` is denormalised onto the row. It is recomputed on every flush
(`OnFlushEventListener.php:47`) from `MainEvent::isMultiDayEvent()` (`src/Entity/MainEvent.php:131-173`):

```
function mainEventIsMultiDay(e):
    if e.recurrence == 'none':
        if count(e.subEvents) > 0:           return true        # several hand-picked slots
        dayFrom      = e.dateFrom as 'dmY'
        dayTo        = e.dateTo   as 'dmY'
        dayAfterFrom = (e.dateFrom + 1 day) as 'dmY'
        timeFrom     = e.dateFrom as 'Hi'    # zero-padded, string compare
        timeTo       = e.dateTo   as 'Hi'
        if dayTo == dayFrom:                            return false   # same calendar day
        if dayTo == dayAfterFrom and timeFrom > timeTo: return false   # crosses midnight once
        return true                                                    # genuinely spans days

    if e.recurrence == 'week':
        wd = e.recurrenceWeekDays
        if wd is empty: return false
        twoDaysAfterFrom = midnight(e.dateFrom + 2 days)
        weekAfterFrom    = midnight(e.dateFrom + 7 days)
        dayTo            = midnight(e.dateTo)
        if (count(wd) > 1 and dayTo >= twoDaysAfterFrom)
           or (count(wd) > 0 and dayTo >= weekAfterFrom):  return true
        return false            # "can be improved to cover more edge cases" (source comment, line 164)

SubEvent.isMultiDayEvent() == true   (always, src/Entity/SubEvent.php:68-71)
```

**BUT**: the value a sub-event actually ends up with is *not* its own `true`. `OnFlushEventListener::updateSubEvent()`
line 105 overwrites it with the **main event's stored flag**: `$subEvent->setIsMultiDayEvent($mainEvent->isIsMultiDayEvent())`,
and that call runs *after* `completeEvent()` set the sub-event's own value (lines 47 then 54-56). Because a main
event with sub-events is multiday by definition, the two normally agree.

Verification against the live DB (reimplementing the predicate in SQL, in `Europe/Zurich`):

| type | recurrence | stored | derived | rows |
| --- | --- | --- | --- | --- |
| mainevent | none | f | f | 16,469 |
| subevent | — | t | t | 13,160 |
| mainevent | none | t | t | 3,887 |
| mainevent | week | t | t | 735 |
| mainevent | week | f | f | 23 |
| **subevent** | — | **f** | t | **3** |
| **mainevent** | **week** | **t** | **f** | **2** |

34,274 / 34,279 rows (99.99 %) match the predicate exactly. The 5 outliers:

* the 2 `week` mismatches are the two JSON-object `recurrence_week_days` rows (my SQL treats a non-array as empty);
  they are actually correct.
* the 3 `subevent` rows (ids 34060-34062, all children of main event 34006) are **genuinely stale**: their
  `updated_at == created_at == 2026-02-27 22:30`, while the main event was last updated 2026-04-27 and now reads
  `is_multi_day_event = t`. They were inserted while the main event still had no children, so
  `$mainEvent->isIsMultiDayEvent()` was `false` at that moment; the later main-event update recomputed the main
  but the sub-events' changes were not in that flush's changeset. This is the propagation hole described in §5.4.

Totals: `is_multi_day_event` → **t 17,784 / f 16,495 / NULL 0**.

### 3.6 `related_dates` — a denormalised display list

`related_dates` is a JSON column holding **serialized PHP `\DateTime` objects**, i.e. the `json_encode()` of the
object, not ISO strings:

```json
[{"date":"2025-10-01 14:00:00.000000","timezone_type":3,"timezone":"Europe\/Zurich"}, …]
```

Some older rows carry `"timezone_type":1,"timezone":"+02:00"` instead (a `\DateTime` built from an offset string).

It is rebuilt on every flush by `OnFlushEventListener::updateRelatedDates()` (lines 68-78):

```
if event.recurrence == 'week':
    relatedDates = EventDatesCalculator.getRelatedRecurrenceDates(event)
else:
    relatedDates = EventDatesCalculator.getRelatedSingleDates(event)
```

**`getRelatedSingleDates`** (`EventDatesCalculator.php:55-74`): resolve the main event (self if MainEvent, the
parent if SubEvent), then `[mainEvent.dateFrom, ...mainEvent.subEvents.map(s => s.dateFrom)]`.
It returns **only start dates**, never end dates.

**Verified exactly**: for all **20,356** non-recurring main events,
`json_array_length(related_dates) == 1 + (number of sub-events)` with **0 mismatches**.

**`getRelatedRecurrenceDates`** (lines 76-102) expands the weekly recurrence to a list of start dates:

```
function calculateWeeklyRecurrenceDates(weekDays, start, end):
    start = clone start
    end   = clone end
    end   = end.modify('+1 day')            # <-- NOTE: end bound is inclusive-ish here
    for d in DatePeriod(start, P1D, end):   # d keeps start's time-of-day; DatePeriod end is EXCLUSIVE
        if int(d.format('N')) in weekDays:
            yield d
```

Note `end.modify('+1 day')` mutates the clone **before** the period is built, so this list extends one day further
than the occurrence list (§3.7), which does not add a day. **Measured drift: of 760 weekly events, 177 have exactly
one more entry in `related_dates` than they have `event_occurrence` rows (sum of differences = 177, i.e. always +1).**

For sub-events, `relatedDates` is copied verbatim from the main event (`OnFlushEventListener.php:104`), so a
sub-event's `related_dates` starts with the *main event's* `dateFrom`, not its own.

`related_dates` is exposed on the API (`EventApi::$relatedDates`, group `api:occurrence:read-collection`), described
as *"Array of related dates based on the recurrence or the type (mainevent, subevent) of the event"*
(`src/Entity/Event.php:186-193`).

### 3.7 The occurrence expansion algorithm (the core)

This is the single most important algorithm in the domain. It runs inside `onFlush`, for **every** inserted or
updated `Event` (`src/EventListener/OnFlushEventListener.php:23-39`), and is duplicated verbatim in the repair
command `src/Command/EventsCalculateOccurrencesCommand.php:56-80`.

```
# ---- entry point: Doctrine onFlush -------------------------------------------------
on flush:
    for entity in unitOfWork.scheduledEntityInsertions + unitOfWork.scheduledEntityUpdates:
        if entity is Event:
            completeEvent(entity)

function completeEvent(event):
    updateRelatedDates(event)                       # §3.6
    event.isMultiDayEvent = event.computeMultiDay() # §3.5
    if event is MainEvent:
        for sub in event.subEvents: propagate(event -> sub)      # §5.3
    if event is SubEvent:
        propagate(event.mainEvent -> event)
    updateOccurrences(event)
    unitOfWork.recomputeSingleEntityChangeSet(Event, event)
    unitOfWork.computeChangeSet(Event, event)       # needed so association changes are flushed
                                                    # (see doctrine/orm discussion #11605, cited in source)

# ---- occurrence regeneration -------------------------------------------------------
function updateOccurrences(event):
    # 1. DELETE every existing occurrence. Always. Even if nothing date-related changed.
    for occ in event.occurrences:
        event.removeOccurrence(occ)
        entityManager.remove(occ)

    # 2. Re-create from scratch
    if event.recurrence == 'none':          # NB: a SubEvent delegates this to its MainEvent
        emit Occurrence(from = event.dateFrom, to = event.dateTo)
    else:                                   # 'week'
        for slot in expandWeekly(event):
            emit Occurrence(from = slot.from, to = slot.to)

# ---- weekly expansion: EventDatesCalculator::calculateWeeklyFromToRecurrenceDates ---
function expandWeekly(event):
    weekDays = event.recurrenceWeekDays        # list of ISO weekday numbers, values only
    start    = clone event.dateFrom            # carries the start time-of-day, Europe/Zurich
    end      = clone event.dateTo              # carries the end time-of-day,   Europe/Zurich
    result   = []

    # DatePeriod(start, P1D, end): iterates start, start+1d, start+2d, … while < end.
    # The END BOUND IS EXCLUSIVE and is compared against the full timestamp (date AND time).
    # Adding P1D to a zoned DateTime preserves the WALL-CLOCK time across DST.
    for d in DatePeriod(start, interval 1 day, end):
        if int(d.format('N')) not in weekDays: continue

        from = d                                     # d, i.e. this day at start's time-of-day
        if start.format('H:i') > end.format('H:i'):  # overnight slot (e.g. 20:00 -> 00:30)
            to = d + 1 day
        else:
            to = d
        to = to.setTime(end.hour, end.minute)        # seconds are dropped

        result.append({from, to})
    return result
```

Edge cases, all observable in the data:

| Edge case | Behaviour | Evidence |
| --- | --- | --- |
| `recurrence='week'` with `recurrence_week_days = []` | **zero occurrences** | Exactly 4 events have no occurrence row at all: ids 14, 6264, 11288, 20968 — and those are precisely the 4 events with `recurrence_week_days='[]'`. |
| End bound is exclusive on the *timestamp*, not the date | the final weekday is included iff `start-time-of-day < end-time-of-day` on that date | Event 17413 (`[6]`, Sat, 11:00→17:00, ends Sat 2025-06-14 17:00) — last occurrence **is** 2025-06-14 11:00→17:00. Event 4040 (`[2]`, Tue 21:00, ends Fri 2024-03-01 00:00) — last occurrence is Tue 2024-02-27, because the iteration stops at Thu 2024-02-29 21:00. |
| Overnight slot | `date_to` is the **next** calendar day | Event 4040: `2024-01-30 21:00+01 → 2024-01-31 00:00+01`. Event 32459 (`[5,6]`, 20:00→00:30): Fri→Sat and Sat→Sun pairs. |
| DST | wall-clock preserved, UTC offset changes | Event 17413: `2025-03-29 11:00+01` then `2025-04-05 11:00+02`. |
| `recurrence='none'` | exactly one occurrence, `= (event.date_from, event.date_to)` | `SELECT recurrence, count(DISTINCT e.id), count(o.id) …` → `none`: 20,356 events / 20,356 occurrences; sub-events (recurrence NULL, delegating to a `none` parent): 13,163 / 13,163. |
| Sub-events of a weekly main | impossible by construction | 0 rows. |
| Unbounded recurrence | faithfully expanded, no cap | Event 27002 (`[2,4,5]`, 2020-12-15 → **2099-12-31**) has **12,374** occurrence rows. 3793 → 10,332. 27005 → 8,248. 27000 / 27004 → 4,125 each. 20 events have `date_to > 2030-01-01`. |

Aggregate check:

```sql
SELECT e.recurrence, count(DISTINCT e.id) events, count(o.id) occurrences,
       round(count(o.id)::numeric/count(DISTINCT e.id),2) avg
FROM event e LEFT JOIN event_occurrence o ON o.event_id=e.id GROUP BY 1;
 recurrence | events | occurrences |  avg
------------+--------+-------------+--------
 week       |    760 |       84502 | 111.19
 none       |  20356 |       20356 |   1.00
 (null)     |  13163 |       13163 |   1.00     -- sub-events
```

Occurrence-count histogram (per event): 33,939 events have ≤20, 144 have 21-40, …, **41 events have ≥200**.

**`\DateTime` aliasing subtlety for the re-implementer**: in `calculateWeeklyFromToRecurrenceDates`
(`EventDatesCalculator.php:126-131`) the code does `$fromDate = clone $date; … $toDate = $fromDate->modify('+1 day')`.
PHP's `DateTime::modify()` mutates **and** returns `$this`, so `$fromDate` and `$toDate` are the *same object*.
It only works because `'from' => $date` uses the original period value, not `$fromDate`. A naive transliteration
to an immutable date library is fine; a naive transliteration that keeps the alias is not.

**Performance characteristic to be aware of**: saving an event always deletes and re-inserts its entire occurrence
set. Saving event 27002 means 12,374 DELETEs + 12,374 INSERTs in a single flush.

### 3.8 `nextDate` / `nextFilteredDate` (transient, never stored)

`Event::$nextDate` and `Event::$nextFilteredDate` are **not** ORM columns (`src/Entity/Event.php:183-202`) — they are
transient fields that get serialised into API responses. Three different mechanisms fill them:

1. **`postLoad`** (`EventDoctrineListener.php:20-29`) — `getNextEventDate($event)` with "now". **Disabled on BKA**
   because `USE_OPTIMIZED_EVENT_LOAD=true`.
2. **Occurrence search** — `EventOccurrenceNormalizer::normalize()` (`src/Serializer/Normalizer/EventOccurrenceNormalizer.php:18-39`)
   for API v1, and `OccurrenceEntityToEventDtoProvider` (`src/State/OccurrenceEntityToEventDtoProvider.php:73-74`)
   for API v2. Both set `nextDate = occurrence.dateFrom`. The v1 normalizer additionally sets it to **null** when
   `occurrence.dateFrom <= dateFromFilter` ("the occurrence has already started").
3. **`calculateNextDate` context** — `EventEntityToApiMapper::populate()` lines 120-125, enabled only for the API v2
   `get_published_events` collection (`src/State/EntityToDtoProvider.php:39-43`).

`getNextEventDate` (`EventDatesCalculator.php:11-53`):

```
function getNextEventDate(event, dateFromFilter = now):
    dateFrom = clone event.dateFrom
    weekDays = event.recurrenceWeekDays            # SubEvent delegates to its MainEvent

    if weekDays is falsy:                          # NULL or []  -> non-recurring
        return (dateFrom >= dateFromFilter) ? dateFrom : null

    end = event.dateTo
    if dateFrom < dateFromFilter: dateFrom = dateFromFilter     # clamp

    for d in DatePeriod(dateFrom, 1 day, end):     # end exclusive
        if d.format('N') in weekDays:
            return d.setTime(event.dateFrom.hour, event.dateFrom.minute)
    return null
```

Key semantics, asserted by `tests/Event/SearchEngineTest.php`:

* A **non-recurring event already in progress** (start in the past, end in the future) has `nextDate = null`.
  Test `testEventsNextDate`, fixtures `test-a5` (today, `now-1h` → `now+1h`) and `test-a10-1`: *"Ensure these events
  have a NULL nextDate"* (lines 143-168). It is still returned by the search.
* An event entirely in the past has `nextDate = null` and must not be in the results (10 fixtures, lines 121, 126-141).
* A regular future event has `nextDate == dateFrom` (14 fixtures, line 122).
* The weekly cases B3, B5, B6, B10, B11 are **commented out in the test with `// Fails … TODO`** (lines 202-261) —
  the clamping (`dateFrom = dateFromFilter`) makes `nextDate` "today" where the author expected "tomorrow". Also
  `// B7 Fails, in results TODO` (line 120). These are acknowledged, unfixed bugs.

### 3.9 `getLastDateTo` — the "is this event over?" helper

`EventDatesCalculator.php:157-181`:

```
function getLastDateTo(event):
    if event.recurrence == 'none':
        mainEvent = (event is SubEvent) ? event.mainEvent : event
        occurrences = mainEvent.occurrences + flatten(mainEvent.subEvents.map(s => s.occurrences))
    else:
        occurrences = event.occurrences
    return max(occurrences.map(o => o.dateTo))   # null if there are none
```

Used in two places only (`src/Controller/EventController.php:500, 573`): to decide whether an admin editing an event
sees the read-only "archived" organization/place text fields instead of the live selectors, and whether saving
redirects to `/events/archived` instead of `/events/`.

---

## 4. Main event vs sub event

### 4.1 Mapping

Single-table inheritance on `event`, discriminator column `type`
(`src/Entity/Event.php:23-27`):

```php
#[ORM\InheritanceType('SINGLE_TABLE')]
#[ORM\DiscriminatorColumn(name: 'type', type: 'string')]
#[ORM\DiscriminatorMap(['mainevent' => MainEvent::class, 'subevent' => SubEvent::class])]
```

`SubEvent.mainevent_id` is a self-referencing FK (`fk_3bae0aa7f1f4a01f … ON DELETE RESTRICT`), mapped
`ManyToOne(targetEntity: MainEvent, inversedBy: 'subEvents')` (`src/Entity/SubEvent.php:13-15`), with the inverse
side `OneToMany(mappedBy:'mainEvent', cascade:['persist','remove'], orphanRemoval:true)`
(`src/Entity/MainEvent.php:53-54`).

Columns that live **only** on MainEvent (and are therefore NULL for every sub-event row):
`recurrence`, `recurrence_week_days`, `ticketing_url`.

`SubEvent` overrides getters to *read through* to its parent instead of using its own column
(`src/Entity/SubEvent.php:30-63`): `getRecurrence()`, `getRecurrenceWeekDays()`, `getTicketingUrl()`,
`getPublicationDate()`, `getUser()`, `getImages()`, `getRates()`. Note the asymmetry: `getUser()` reads through but
`user_id` is *also* written onto the sub-event row by the flush listener (§4.3) and by a maintenance command (§6).
`getImages()` / `getRates()` read through and are **never** written — sub-event rows never own images or rates.

Live counts: 21,116 mainevents / 13,163 subevents. 3,285 main events have at least one sub-event
(1 → 1,389 · 2 → 581 · 3 → 321 · 4 → 223 · 5 → 160 · 6 → 81 · 7 → 99 · 8 → 51 · 9 → 108 · 10 → 41 · 11 → 46 · 12 → 23 · 13 → 15 · 14 → 11 · 15 → 7 · …).

### 4.2 How sub-events are created and linked

There is **no separate sub-event UI, route or API resource for creation**. Sub-events only exist as a
`CollectionType` of `SubEventType` inside the main event form (`src/Form/EventType.php:393-406`, with
`by_reference: false`, `allow_add`, `allow_delete`, `prototype`). `MainEvent::addSubEvent()`
(`src/Entity/MainEvent.php:112-119`) sets the back-reference. The cascade `persist`/`remove` + `orphanRemoval`
means removing a row from the collection deletes the DB row.

Three other creation paths exist:

* `EventDuplicator::duplicateSubEvents()` — §7.
* API v2 `EventApiToEntityMapper::populate()` lines 81-90: `$dto->subEvents` is mapped to `SubEvent` entities and
  assigned via the property accessor; it also forces `$entity->setUpdatedAt(new \DateTime())`
  *"to force update of entity by doctrine (previous only creates subEvents)"* — i.e. it manufactures a changeset so
  `onFlush` fires on the main event.
* `src/DataFixtures/EventFixtures.php:374-392` for tests.

### 4.3 Propagation (MainEvent → SubEvent), on every flush

`OnFlushEventListener::updateSubEvent()` (lines 89-119) copies the following from the main event to each sub-event.
It runs in both directions of the trigger: when the main event is in the changeset (iterating its children) and when
a sub-event is in the changeset (reaching up to its parent).

| Copied field | Source | Notes |
| --- | --- | --- |
| `name` | `mainEvent.getName()` | legacy non-translatable name |
| `eventStatus` | " | |
| `place` | " | |
| `organization` | " | denormalised for query performance (see command §6.3) |
| `description` | " | legacy non-translatable description |
| `specialRate` | " | |
| `publicationStatus` | " | **sub-events have their own copy of the publication status** |
| `audience` | " | |
| `labels` | " | the whole translated JSON (`description`, `printDescription`, `ticketingUrl`) |
| `relatedDates` | " | the main event's list, verbatim |
| `isMultiDayEvent` | `mainEvent.isIsMultiDayEvent()` | the *stored* flag, not a recomputation |
| `user` | " | |
| `showInPrint` | " | |
| `printCategory` | " | |
| `categories` | " | full remove-then-add of the ManyToMany (lines 110-116) |

**Never copied** (sub-event keeps its own): `dateFrom`, `dateTo`, `openingTime`, `slug`, `oldSlug`,
`publicationDate` (read-through), `proposedBy`, `placeProposed`, `sponsored*Date`, `ogImage`,
`archivedOrganization`, `archivedPlace`, `images`, `videos`, `rates`, `ticketings`.

### 4.4 How well propagation actually holds in production

```sql
SELECT count(*) subevents,
  count(*) FILTER (WHERE s.name               IS DISTINCT FROM m.name)               name,
  count(*) FILTER (WHERE s.event_status       IS DISTINCT FROM m.event_status)       status,
  count(*) FILTER (WHERE s.place_id           IS DISTINCT FROM m.place_id)           place,
  count(*) FILTER (WHERE s.organization_id    IS DISTINCT FROM m.organization_id)    org,
  count(*) FILTER (WHERE s.user_id            IS DISTINCT FROM m.user_id)            usr,
  count(*) FILTER (WHERE s.publication_status IS DISTINCT FROM m.publication_status) pubstatus,
  count(*) FILTER (WHERE s.audience_id        IS DISTINCT FROM m.audience_id)        audience,
  count(*) FILTER (WHERE s.labels             IS DISTINCT FROM m.labels)             labels,
  count(*) FILTER (WHERE s.special_rate       IS DISTINCT FROM m.special_rate)       rate,
  count(*) FILTER (WHERE s.show_in_print      IS DISTINCT FROM m.show_in_print)      print,
  count(*) FILTER (WHERE s.print_category_id  IS DISTINCT FROM m.print_category_id)  printcat,
  count(*) FILTER (WHERE s.related_dates      IS DISTINCT FROM m.related_dates)      reldates,
  count(*) FILTER (WHERE s.description        IS DISTINCT FROM m.description)        descr
FROM event s JOIN event m ON s.mainevent_id = m.id WHERE s.type='subevent';
```

| metric | mismatches / 13,163 |
| --- | --- |
| event_status, place, organization, user, publication_status, special_rate, description | **0** |
| audience | 2 |
| show_in_print | 26 |
| print_category | 29 |
| name | 54 |
| categories (separate query over `event_category`) | 61 |
| related_dates | 129 |
| labels | 173 |
| is_multi_day_event (§3.5) | 3 |

So propagation is ~99 % reliable but not a hard invariant. Two known mechanisms produce the drift:

1. `recomputeSingleEntityChangeSet` is called on the *triggering* entity only
   (`OnFlushEventListener.php:62-65`); fields the listener wrote onto *other* entities (the children) are only
   flushed if those entities were themselves already in the changeset.
2. The bulk DQL UPDATEs (`markEventsAsShownInPrint`, `updateArchived*ForUpcomingEvents`) bypass the unit of work
   entirely and never fire the listener.

---

## 5. The publication / visibility state machine

### 5.1 The columns that carry state

| Column | Type | Semantics |
| --- | --- | --- |
| `publication_status` | varchar(50), NOT NULL | the editorial workflow state |
| `publication_date` | timestamptz, nullable | embargo: "publish only from this instant" |
| `event_status` | varchar(50), NOT NULL | the *real-world* state of the event (confirmed/cancelled/…) — orthogonal to publication |
| `date_from` / `date_to` (+ sub-events / occurrences) | timestamptz | derive "past" / "archived" — **there is no archived flag** |
| `sponsored_start_date` / `sponsored_end_date` | timestamptz, nullable | the event is "sponsored" while now ∈ [start, end] |
| `show_in_print` | boolean, nullable | include in the printed BKa member edition |
| `print_category_id` | int FK → category, nullable | the single category used for the print edition |

### 5.2 `publication_status`

Constants (`src/Entity/Event.php:34-45`):

| Value | German label (`translations/messages.de.yml:394-397`) | Meaning |
| --- | --- | --- |
| `draft` | *Entwurf* | invisible to the public API and to the agenda search |
| `to_validate` | *zur Prüfung* | awaiting approval by an admin of the place's organization |
| `publish` | *Publizieren* | public (subject to `publication_date`) |

(The translation file also carries a `private` key at line 396, but there is **no such constant** — dead legacy.)

Transitions:

| From → To | Trigger | Code |
| --- | --- | --- |
| *(new)* → any of the three | Admin/user creates an event in the back-office and picks the value in the form `publicationStatus` select | `src/Form/EventType.php:564-576`. The select is `disabled: !$options['can_publish']`, and `can_publish` is `is_granted('publish', $event)` (`src/Controller/EventController.php:501`). |
| *(new)* → `to_validate` | External person completes the 6-step public "propose an event" wizard | `src/Controller/ProposeEventController.php:256-258` — hardcoded `setEventStatus(CONFIRMED)` + `setPublicationStatus(TO_VALIDATE)`. Also creates a user account for the proposer's e-mail if none exists, and e-mails the place's admins. |
| any → any | Back-office edit | `src/Controller/EventController.php:505-510`; if the actor lacks the `publish` voter attribute the select is disabled and the stored value is resubmitted unchanged. |
| `to_validate` → `publish` | detected explicitly to fire the "your event is online" mail | `src/Controller/EventController.php:522` and `:557` compare the pre-form value with the post-form value. |
| any → `draft` | `EventDuplicator` always resets a copy to `draft` with `publicationDate = null` | `src/Event/EventDuplicator.php:75-76` |
| MainEvent → all its SubEvents | automatic on flush | `OnFlushEventListener.php:101` |
| API v2 POST/PATCH | caller supplies `publicationStatus` (required, `NotBlank`, choice-constrained) | `src/Form/ApiForm/ApiEventType.php:179-185`, `src/Mapper/EventApiToEntityMapper.php:78`; `EventApi::$publicationStatus` defaults to `draft` (`src/ApiResource/EventApi.php:528`). |

There is **no Symfony Workflow component, no state-machine config, no transition guard table**. The "machine" is
three string constants plus the `publish` voter attribute.

### 5.3 Who may do what — `EventVoter`

`src/Security/Voters/EventVoter.php:12-105`. Attributes `view`, `edit`, `publish`.

```
voteOnAttribute(attr, event, token):
    if user is not a User:                  deny
    if user has ROLE_ADMIN:                 allow (all three attributes)
    view    -> ROLE_BROADCAST_PARTNER ? allow : canEdit(event, user)
    edit    -> canPublish(event,user) OR  event.proposedBy.email ==(ci) user.email
    publish -> event.user == user
            OR user.organizations contains event.organization
            OR user.organizations contains event.place.organization
```

So: the person who proposed an event by e-mail can **edit** it but not change its publication status; only the
owner, a member of the owning organization, a member of the place's organization, or an admin can publish.
`src/ApiPlatform/EventExtension.php:21` and `src/ApiPlatform/OccurrenceExtension.php:26` both carry the comment
*"WARNING: must be aligned with App\Security\Voters\EventVoter"* — the rule is hand-duplicated in three places.

### 5.4 `event_status` (orthogonal)

Constants `src/Entity/Event.php:47-61`, German labels `translations/messages.de.yml:286-293`:

| Value | DE label | Live count |
| --- | --- | --- |
| `confirmed` | Bestätigt | 33,831 |
| `full` | Ausverkauft | 366 |
| `canceled` | Annuliert | 65 |
| `postponed` | Verschoben | 17 |

Settable freely in the form (no transition rules), propagated to sub-events, and used only for display/filters.

### 5.5 `publication_date` (embargo)

Every read path repeats the same predicate:

```sql
publication_status = 'publish'
AND (publication_date IS NULL OR publication_date <= :now)
```

in `EventRepository::engineSearch` (lines 122-125), `EventOccurrenceRepository::occurrenceEngineSearch`
(lines 70-76), `EventExtension::applyCommonRules` (lines 86-96) and `OccurrenceExtension` (lines 94-110).
For the API v2 `/events/agenda` and `/events/agenda-lite` operations the comparison instant is the **`date_from`
query parameter**, not "now" (`OccurrenceExtension.php:105-110`) — so an embargoed event *does* appear when the
caller asks for a future window. For every other operation it is `now`.

The admin form allows a date only (`DateType`, `min = today`, `src/Form/EventType.php:577-586`).

Live: **176** events carry a `publication_date`; **0** of them are in the future.

### 5.6 "Archived" / "past" — a derived state, not a column

There is no archived flag anywhere. Three slightly different definitions coexist:

| Definition | Where |
| --- | --- |
| `COALESCE(date_to, date_from) < now()` | `Event::isPast()` (`src/Entity/Event.php:312-317`) and the two bulk DQL UPDATEs (`EventRepository.php:63, 84`) |
| MainEvent `date_to < now()` | the `/events/archived` datatable (`src/Controller/EventController.php:385-388`) |
| MainEvent `date_to >= now()` **OR** it has a sub-event with `date_to >= now()` | the `/events/` (current) datatable (`src/Controller/EventController.php:98-154`), built as a sub-query collecting `mainevent_id`s then `orWhere e.id IN (…)` |
| `max(occurrence.date_to) < now()` | `EventDatesCalculator::getLastDateTo()`, used for the edit-form archived fields and the post-save redirect |

`MainEventRepository::findByArchivedStatus(bool)` (lines 27-75) implements a fifth variant and is **unused**.

Live, as of 2026-10-17, main events only: **399 upcoming / 20,717 past**.

### 5.7 Archived relation names (`archived_organization`, `archived_place`)

Denormalised snapshots of the organization's and the place's `name`, so an archived event keeps the name it had at
the time even if the related row is renamed or deleted (both FKs are `ON DELETE SET NULL`).

| Moment | Behaviour | Code |
| --- | --- | --- |
| `PrePersist` | fill from the current relation if still NULL | `src/Entity/Event.php:265-278` |
| `PreUpdate` | if the event is **not** past and either name changed, overwrite both and call `recomputeSingleEntityChangeSet` (PreUpdate runs after the changeset is computed) | `src/Entity/Event.php:281-306` |
| Organization/Place renamed | a bulk DQL `UPDATE event SET archived_* = :name WHERE … AND (COALESCE(date_to,date_from) IS NULL OR >= now)` | `ArchivedRelationNameListener` (postUpdate, guarded on `getEntityChangeSet($entity)['name']` being set) → `EventRepository::updateArchivedOrganizationForUpcomingEvents` / `…Place…` (lines 56-90) |

They were introduced as JSON columns (`migrations/Version20251027150826.php:23`), converted to `VARCHAR(255)`
with a wipe (`Version20260608120000.php:20-23`) and back-filled from the live relations
(`Version20260612090000.php`). Live fill rate: `archived_organization` 27,949 (= exactly the number of events with
an `organization_id`), `archived_place` 31,717 (= exactly the number with a `place_id`).

The archived admin list shows `e.archivedPlace` / `e.archivedOrganization` as the searchable/sortable column but
falls back to the live relation name for display (`src/Controller/EventController.php:371-392`).

### 5.8 `show_in_print` / `print_category`

* `show_in_print` defaults to **true** in the form when it is NULL (`src/Form/EventType.php:666-668`).
* `print_category` is forced to NULL when `show_in_print` is not `true`, and is **required** when it is
  (`src/Form/EventType.php:770-777`, error `event.flashError.printCategory`).
* `AffiliationAddedListener` sets `show_in_print = true` on **all** events of an organization (regardless of date)
  the moment that organization gains an affiliation. It must hook `onFlush` + `postFlush` because a
  many-to-many-only change produces no entity changeset and never fires `postUpdate`
  (`src/EventListener/AffiliationAddedListener.php:13-19` explains this); it checks
  `$collection->getInsertDiff()` so an affiliation *removal* does not flag anything.
  The bulk query is `EventRepository::markEventsAsShownInPrint()` (lines 99-109).
* BKa-specific labels: `showInPrint` is *"BKa Mitgliederanlass"* and `printCategory` is *"Print-Kategorie … für
  BKa Mitglieder in der Printausgabe"* (`themes/bka/translations/messages.de.yml:17-25`).
* There is **no print-export code in this repository** — the data is consumed elsewhere through the API.

Live: `show_in_print` t 21,987 / f 11,958 / NULL 334. `print_category_id` set on 21,981 rows.
`labels.printDescription` present on 25,164 rows. 7 affiliations, 85 organization↔affiliation links.

### 5.9 Sponsoring

`sponsored_start_date` / `sponsored_end_date`, edited through `/events/sponsor/{slug}` with `SponsorEventType`
(`src/Controller/EventController.php:608-635`), gated by the `edit` voter attribute.
Read by `EventRepository::getSponsoredEvents()` (lines 357-370: `start <= now <= end AND publicationStatus='publish'
AND dateTo >= now`) and by the API v2 `get_published_events_sponsored` operation.
**Inert on BKA**: `ACTIVATE_SPONSORED_EVENTS=false` hides the action and 0 production rows have the dates set.

### 5.10 Live distribution of the state columns

```sql
SELECT publication_status, count(*) FROM event GROUP BY 1;
 publish     34076
 to_validate   109
 draft          94

SELECT publication_status,
       count(*) FILTER (WHERE date_to >= now()) upcoming,
       count(*) FILTER (WHERE date_to <  now()) past
FROM event WHERE type='mainevent' GROUP BY 1;
 draft       |   0 |    68
 publish     | 399 | 20556
 to_validate |   0 |    93
```

Every non-`publish` event in the database is already in the past: the workflow states are transient in practice.

Other fill rates (all 34,279 events): `proposed_by_id` 4,288 · `place_proposed_id` 1,823 · `opening_time` 8,729 ·
`old_slug` 28,355 · `user_id` 21,378 (8,613 rows have neither a user nor a proposer) · `place_id` 31,717 ·
`organization_id` 27,949 · `special_rate`: NULL 26,176 / `free_entry` 5,103 / `free_price` 3,000.
Categories per event: 0 → 7 · 1 → 18,999 · 2 → 10,021 · 3 → 5,230 · 4 → 6 · 6 → 16 (the form constraint is
`Count(min 1, max 3)`, `src/Form/EventType.php:308-311`, so the 22 rows with 4+ predate it).

---

## 6. The maintenance commands

All five are one-shot backfills for columns/rows that were introduced after the data existed. None are scheduled.

| Command | Name | What it fixes | Batching |
| --- | --- | --- | --- |
| `EventsCalculateOccurrencesCommand` | `app:events:calculate-event-occurences` *(sic, one "r")* | Rebuilds **every** `event_occurrence` row from scratch, re-running the §3.7 algorithm inline. Loads only IDs first (`SELECT e.id FROM Event e`), then `find()`s each event. | flush + clear every **100** events |
| `EventsUpdateMultidayCommand` | `app:events:update-multiday` | `event.is_multi_day_event = event.isMultiDayEvent()` for every event. *"before, was calculated on the flight but now stored in db"* | `findAll()` then a single flush at the end — loads all 34k events into memory |
| `EventsUpdateRelatedDatesCommand` | `app:events:update-related-dates` | Touches `updated_at` on every event so that `OnFlushEventListener` recomputes `related_dates` (and, as a side effect, everything else `completeEvent` does). | `add($event, true)` → **one flush per event** |
| `EventsUpdateSubeventOrganizationCommand` | `app:events:update-subevent-organization` | `subEvent.organization = subEvent.mainEvent.organization`. *"Before subevents get their organization from main event but for optimization, now stored in subevents as well."* | flush every >100 sub-events |
| `EventsUpdateSubeventUsersCommand` | `app:events:update-subevent-users` | `subEvent.user = subEvent.mainEvent.user`. | flush every >100 sub-events |
| `SubeventsUpdateCategoriesCommand` | `app:events:update-subevents-categories` | `subEvent.categories = mainEvent.categories` (assigns the main event's `Collection` object directly — `$event->setCategories($mainEvent->getCategories())`, `src/Command/SubeventsUpdateCategoriesCommand.php:39`, so both entities share one collection instance during the run). | single flush at the end |

The commands' descriptions are the clearest statement of why these columns exist: they are all
*"used to be computed on read, now denormalised for query performance"*.

---

## 7. Event duplication

Route `GET /events/copy/{slug}` → `EventController::copy()` (lines 593-606), guarded by the `edit` voter
attribute, immediately persists the copy and redirects to its edit form.
Implementation: `src/Event/EventDuplicator.php:48-93`.

**Copied:**

| Field | Note |
| --- | --- |
| `labels` | whole JSON; every `labels['name'][lang]` is run through `copyName` (BKA has no `name` labels, so effectively untouched) |
| `name` | → `trans('event.copy.name', {name})` = `"Kopie von %name%"` (de) / `"Copie de %name%"` (fr), **truncated with `mb_substr` to 130 chars** (`NAME_MAX_LENGTH`, matching the form's max length) |
| `eventStatus`, `place`, `organization`, `audience` | as-is |
| `dateFrom`, `dateTo` | **cloned, not shifted** — the copy has the same dates as the original |
| `openingTime`, `description`, `specialRate` | as-is |
| `showInPrint`, `printCategory` | as-is |
| `recurrence`, `recurrenceWeekDays` | as-is |
| `ticketingUrl` | as-is |
| `categories` | each added via `addCategory` |
| sub-events | **only `dateFrom`, `dateTo`, `openingTime`** per child; everything else is re-synchronised by `OnFlushEventListener` (source comment line 131) |
| images | each file is **physically copied in the R2 bucket** to a new `uniqid()` name so deleting one event cannot orphan the other's file; copies `legend`, `labels`, `position`. `Config::OPTION_RETAIN_VISIBILITY => false` is passed because Cloudflare R2 has no `GetObjectAcl` (lines 157-184). A failed copy is logged and the image skipped — it never aborts the duplication. |
| videos | only `embedLink` |
| rates | `price`, `designation`, `labels` |
| ticketings | `ticketingDesignation`, `labels` |

**Deliberately not copied** (source comment lines 88-90 + code):

* `publicationStatus` → forced to **`draft`**; `publicationDate` → **null**.
* `user` → set to the **current user**, so they can edit and publish it.
* `slug` / `oldSlug` → regenerated by Gedmo from the new name.
* `sponsoredStartDate` / `sponsoredEndDate`.
* `proposedBy`, `placeProposed`.
* `ogImage`.
* `occurrences`, `relatedDates`, `isMultiDayEvent`, `archivedOrganization`, `archivedPlace` → all recomputed by the
  lifecycle callbacks / flush listener.

Flash message (de): *"Kopie erfolgreich erstellt. Es ist als Entwurf gespeichert und wird erst nach dem Speichern
veröffentlicht."*

---

## 8. The search engine

### 8.1 Two implementations, one facade

`src/Event/EventSearchEngine.php` exposes two methods:

* `searchEvents(array $searchParams)` — marked `@deprecated prefer usage of method optimizedSearchEvents`
  (line 27). Queries `Event` entities and post-filters in PHP.
* `optimizedSearchEvents(array $searchParams, bool $ignoreSecurity = false)` — queries `EventOccurrence` rows.

`src/Controller/ApiEventController.php` (API **v1**, `/api/v1/events`, itself `@deprecated prefer usage of API v2`)
picks one based on the flag (lines 136-155):

```
if USE_OPTIMIZED_EVENT_LOAD:                      # BKA
    events = optimizedSearchEvents(params)
    total  = count(events)
    events = groupEventsArrayByMonth(events, params)
else:
    events = searchEvents(params)
    events = events.filter(e => isGranted('view', e))   # per-row voter, in PHP
    total  = count(events)
    events = groupEventsByMonth(events, params)
```

API **v2** (`/api/v2/…`, API Platform) does not use `EventSearchEngine` at all; it re-implements the same filters in
`src/ApiPlatform/OccurrenceExtension.php` (which carries the comment *"must be aligned with what's in
EventOccurrenceRepository.occurrenceEngineSearch(), representing still in use api v1 search"*, line 27).

### 8.2 Legacy path — `EventRepository::engineSearch()` (lines 116-271)

Base query (DQL):

```
SELECT e FROM Event e
  LEFT JOIN e.place p
  LEFT JOIN e.placeProposed pp
  LEFT JOIN e.organization o
WHERE e.publicationStatus = 'publish'
  AND (e.publicationDate IS NULL OR e.publicationDate <= :now)
```

Date window (lines 137-156) — four mutually exclusive branches:

| `date_from` | `date_to` | Predicate |
| --- | --- | --- |
| set | — | `e.dateTo >= :from` |
| set | set | `e.dateTo >= :from AND e.dateFrom <= :to+23:59:59` |
| — | set | `e.dateTo >= now() AND e.dateFrom <= :to+23:59:59` |
| — | — | `e.dateTo >= now()` |

Remaining filters:

| Param | SQL |
| --- | --- |
| `keyword` | `ILIKE(...)` over `e.archivedOrganization`, `e.archivedPlace`, `e.name`, `p.city`, `p.name`, `pp.name`, `o.name`, plus `JSON_KEY_VALUES_TEXT(p.labels,'name')`, `…(o.labels,'name')`, `…(e.labels,'name')` — OR-combined |
| `category` | `INNER JOIN e.categories c … c.id IN (:ids)` |
| `place` | scalar or array → OR of `e.place = :placeN` |
| `region` | scalar or array → OR of `p.region = :regionN` |
| `audience` | scalar or array → OR of `e.audience = :audienceN` |
| `affiliation` | `INNER JOIN p.organization o INNER JOIN o.affiliations a … a.id IN (:ids)` (**note: re-uses the alias `o` already bound to `e.organization` by the base query**) |
| `accessibility_auto_declaration` | OR of `p.<field> = true` where `<field>` is **interpolated straight into the DQL from the query string** (line 240) |
| `accessibility_proinfirmis` | `JSON_CONTAINS(JSON_EXTRACT(p.proInfirmisPictograms,'$[*].Id'), :id, '$') = 1` |
| `geoNorthEast` + `geoSouthWest` | bounding box on `p.latitude/longitude` OR `pp.latitude/longitude` |

No `ORDER BY`, no `LIMIT`. Everything else happens in PHP, in `EventSearchEngine::searchEvents()` (lines 29-82),
**in this order**:

```
1. multi_day == 'false'  -> drop events where isMultiDayEvent() is true   (in-PHP recomputation)
2. date_from set         -> for each event compute nextFilteredDate = getNextEventDate(event, date_from@00:00);
                            if null, DROP the event from the result set
3. array_values()        -> reindex
4. limit                 -> array_slice(0, limit)        <-- applied BEFORE the free/member filters
5. free == 'true'        -> keep specialRate in (free_entry, free_price)
6. member present && ACTIVATE_MEMBERS -> keep events whose user.isMember()
```

Because the limit is applied at step 4, asking for `limit=10&free=true` can legitimately return fewer than 10 rows.

The result is then sorted/grouped by `EventListManipulator` (§8.5).

### 8.3 Optimized path — `EventOccurrenceRepository::occurrenceEngineSearch()` (lines 50-309)

This is what BKA runs. The root entity is `EventOccurrence`, so **each occurrence is a result row**; an event
recurring 30 times appears 30 times.

```
SELECT eventOccurrence, event, place, organization, placeProposed, categories, rates, images, videos
FROM EventOccurrence eventOccurrence
  LEFT JOIN eventOccurrence.event  event
  LEFT JOIN event.place            place
  LEFT JOIN event.organization     organization
  LEFT JOIN event.placeProposed    placeProposed
  LEFT JOIN event.categories       categories
  LEFT JOIN event.rates            rates
  LEFT JOIN event.images           images
  LEFT JOIN event.videos           videos
WHERE event.publicationStatus = 'publish'
  AND (event.publicationDate IS NULL OR event.publicationDate <= :now)
```

**Security** (`EventSearchEngine::optimizedSearchEvents` lines 87-100 + repository lines 78-99):

```
filterByUser = true
if ignoreSecurity or ROLE_ADMIN or ROLE_BROADCAST_PARTNER: filterByUser = false
else:
    user = security.getUser()
    if not a User:  throw UnauthorizedHttpException('Bearer Token')

if filterByUser:
    JOIN place.organization placeOrganization            # NB: inner join -> drops placeless events
    AND ( (event.user IS NOT NULL AND event.user = :user)
          OR (place IS NOT NULL AND place.organization IS NOT NULL
              AND placeOrganization.id IN :userOrganizationIds) )
```

**Date window** (lines 124-167) — *always* applied, unlike the legacy path:

```
start = date_from ? new DateTime(date_from) : now()      # parse errors silently become null -> now()
AND eventOccurrence.dateTo >= :start

# "ignore current events with starting date the day before startDate"
dayBefore      = (start - 1 day) @ 00:00:00
endOfDayBefore = (start - 1 day) @ 23:59:59
AND ( eventOccurrence.dateFrom <  :dayBefore
   OR eventOccurrence.dateFrom >  :endOfDayBefore )      # i.e. EXCLUDE occurrences starting yesterday

if date_to:
    if date_to has time 00:00:00: date_to += 23:59:59
    AND eventOccurrence.dateFrom <= :date_to
```

The "day before" clause suppresses overnight occurrences that started yesterday and are technically still running
at `start`, while keeping genuinely long-running continuous events (which started two or more days earlier).

**Filters** (same parameter names as the legacy path, but expressed in SQL rather than PHP):

| Param | Implementation |
| --- | --- |
| `member` (and `ACTIVATE_MEMBERS`) | `JOIN event.user user … user.member = true` |
| `free` (truthy — **not** `'true'`, unlike the legacy path, line 113) | `event.specialRate IN ('free_entry','free_price')` |
| `keyword` | `ILIKE` over `event.name`, `place.city`, `place.name`, `placeProposed.name`, `organization.name` — **note: no `archived*` columns and no `JSON_KEY_VALUES_TEXT` here**, unlike `engineSearch` and unlike `OccurrenceExtension` |
| `category` | `categories.id IN (:ids)` (the collection is already joined) |
| `place`, `region`, `audience` | scalar or array → OR-ed equalities |
| `affiliation` | `INNER JOIN place.organization o INNER JOIN o.affiliations a` |
| `accessibility_auto_declaration` | OR of `place.<field> = true`, field interpolated from the query string |
| `accessibility_proinfirmis` | `JSON_CONTAINS(JSON_EXTRACT(place.proInfirmisPictograms,'$[*].Id'), :id,'$') = 1` |
| `geoNorthEast`/`geoSouthWest` | bounding box on place or placeProposed |
| `multi_day == 'false'` | `event.isMultiDayEvent = false` (uses the **stored** column) |

**Ordering**: `ORDER BY eventOccurrence.dateFrom ASC` (line 301). That is the only ordering in the optimized path —
there is no relevance ranking anywhere in the codebase.

**Pagination** (lines 280-308):

```
limit = 50 (default)
if searchParams['limit'] is a positive int <= 2000:  limit = that     # hard cap 2000
page  = 0
if searchParams['page'] is a positive int:           page = page - 1  # 1-based input
setMaxResults(limit); setFirstResult(page * limit)
paginator = new Doctrine Paginator(query, fetchJoinCollection: true)
paginator->setUseOutputWalkers(false)
```

Then `EventSearchEngine::optimizedSearchEvents` normalises the paginator with the Symfony serializer
(groups `['default']`, `ENABLE_MAX_DEPTH => false`) and returns `normalized['event']` for each occurrence
(lines 105-117). **Despite the `@return Event[]` docblock the method returns an array of associative arrays, not
entities** — which is why `ApiEventController` then calls `groupEventsArrayByMonth` (array variant) rather than
`groupEventsByMonth` (entity variant), and why `SearchEngineTest::testOccurrenceEventsNextDate` indexes with
`$event['slug']`, `$event['next_date']`, `$event['date_from']`.

The normalisation step is what sets `nextDate`: `EventOccurrenceNormalizer` (lines 24-34) assigns
`event.nextDate = occurrence.dateFrom` when `occurrence.dateFrom > dateFrom-filter`, otherwise **null**.
Because the same `Event` object is shared across its occurrences within one result set, the last normalised
occurrence wins for any event that appears more than once.

### 8.4 API v2 — `OccurrenceExtension`

`src/ApiPlatform/OccurrenceExtension.php` re-implements the same thing as a Doctrine ORM query extension, for six
named operations (lines 33-38):

| Operation | URI | Extra constraints |
| --- | --- | --- |
| `get_published_events_occurrences` | `GET /api/v2/events/agenda` | full filter set (identical to §8.3 plus `archived*` and `JSON_KEY_VALUES_TEXT` in the keyword clause, lines 292-310) |
| `get_published_events_occurrences_lite` | `GET /api/v2/events/agenda-lite` | same, lighter serialization group |
| `get_published_events_for_organization` | `GET /api/v2/events/agenda/organization?slug=` | `(place.organization = :org OR event.organization = :org) AND occurrence.dateFrom >= now` |
| `get_published_events_for_place` | `GET /api/v2/events/agenda/place?slug=` | `event.place = :place AND occurrence.dateFrom >= now` |
| `get_published_events_similar` | `GET /api/v2/events/agenda/similar?slug=` | `event.id != :id AND occurrence.dateFrom >= now AND categories IN (:event's categories)` + optional `region` |
| `get_published_events_sponsored` | `GET /api/v2/events/agenda/sponsored` | `sponsoredStartDate <= now <= sponsoredEndDate AND occurrence.dateFrom >= now` |

Plus `get_published_events` on the `Event` root (`src/ApiPlatform/EventExtension.php`), `GET /api/v2/events`, which
filters `dateFrom >= :date_from`, a reduced keyword set, `region`, and `onlyMainEvents=true`
(`e INSTANCE OF MainEvent`), ordered by `dateFrom ASC` (`ApiResource/EventApi.php:396`).

All v2 operations require `is_granted("ROLE_USER") or is_granted("ROLE_BROADCAST_PARTNER")`
(`src/ApiResource/EventApi.php:397`) and JWT — an unauthenticated `GET /api/v2/events/agenda` returns
`{"code":401,"message":"JWT Token not found"}` (verified against the running instance).

`OccurrenceEntityToEventDtoProvider` (`src/State/OccurrenceEntityToEventDtoProvider.php`) turns the occurrence
paginator into an `EventApi` paginator, setting `nextDate = nextFilteredDate = occurrence.dateFrom` for each
(lines 73-74), and honours `count_only=true` (empty `member` array, `totalItems` preserved) and
`group_by_month=true` (lines 78-85). Pagination metadata still comes from the *occurrence* paginator — the comment
calls this out: *"trick here, we use the occurrence pagination even if we return events dtos"* (line 87).

API Platform pagination defaults: `itemsPerPage` parameter, client-settable, max 500
(`config/packages/api_platform.yaml:23-27`).

### 8.5 Sorting and month grouping — `EventListManipulator`

```
sortEventsByStartDate(events):          # static, lines 15-35
    usort by nextDate timestamp ASC; NULL nextDate sorts LAST
```

Three near-duplicate grouping methods, differing only in the shape of the input:

| Method | Input | Used by |
| --- | --- | --- |
| `groupEventsByMonth` (42-95) | `Event[]` entities; sorts first | API v1, legacy path |
| `groupEventsArrayByMonth` (97-149) | normalised arrays (`next_date`, `date_from`); **does not sort** (the SQL order is already correct) | API v1, optimized path |
| `groupApiEventsArrayByMonth` (154-190) | `EventApi[]` DTOs; **does not sort** | API v2 `group_by_month=true` |

Output shape: `[ {date: "YYYY_MM", events: [...]}, ... ]` sorted chronologically by
`DateTime::createFromFormat('Y_m', …)`.

The bucket for an event with **no** `nextDate` (a continuous event already in progress) is resolved differently in
each variant:

* `groupEventsByMonth`: if `date_from` filter present and it is in the past → use the filter date; else if
  `event.dateFrom < now` → use **now**; else use `event.dateFrom`; else skip the event.
* `groupEventsArrayByMonth`: if a `date_from` filter is present → use it (past *or* future); otherwise same as above.
  **Line 119 is a live bug**: inside an array-shaped branch it calls `$event->getDateFrom()` on an array.
* `groupApiEventsArrayByMonth`: if `nextDate` is null **or earlier than the filter** → use the filter date.

### 8.6 What the test suite pins down

`tests/Event/SearchEngineTest.php` + `src/DataFixtures/EventFixtures.php` define 31 main events and 13 sub-events
with relative dates, in two families:

* **A1–A20** — `recurrence = none`, exercising: all-past, single future, multiple future sub-events, mixed
  past/future sub-events, in-progress today, starting later today, finished earlier today, a long continuous event,
  a future `publicationDate`, and every combination of "sub-event today/tomorrow, ±1 h".
* **B1–B11** — `recurrence = week` with `recurrenceWeekDays = [1..7]`, exercising the boundaries of
  `date_from`/`date_to` around "now" and "tomorrow".

`eventSlugProvider()` (lines 50-100) is the authoritative in/out matrix for "which events does the search return".
Notable expectations:

| Slug | Shape | In results? |
| --- | --- | --- |
| `test-a1` | all dates one week ago | no |
| `test-a4` / `test-a4-1` | main + sub-event in the past … | no |
| `test-a4-2` | …but the future sub-event | **yes** |
| `test-a5` | in progress right now | **yes**, with `nextDate = null` |
| `test-a7` | ended an hour ago | no |
| `test-a8` | continuous, one week ago → one week ahead | **yes**, `nextDate = null` |
| `test-a9` | future `publicationDate` | no (legacy path); in the optimized path the test tolerates its absence (line 331) |
| `test-b1` | weekly, entirely past | no |
| `test-b7` | weekly ending an hour ago | *expected* no — the source comment says *"B7 Fails, in results TODO"* (line 120) |

Warning repeated at the top of both files: *"because we often use +/- 1/2 hour with relative dates in the fixture,
testing between 22:00 and 02:00 is not relevant."*

Five weekly assertions (B3, B5, B6, B10, B11) are commented out with `// Fails … TODO` — known, unfixed
discrepancies in `getNextEventDate` for weekly recurrences.

---

## 9. Cross-cutting details a port must not miss

### 9.1 Slugs

`#[Gedmo\Slug(fields: ['name'])]` on `Event::$slug`, `unique: true`, nullable (`src/Entity/Event.php:93-95`).
`old_slug` keeps the previous value so old URLs resolve (`src/State/SlugEntityToDtoItemProvider.php:60`,
`src/Resolver/SlugEntityValueResolver.php:47`). Live: 28,355 of 34,279 events have an `old_slug`.
Sub-events get their own slug derived from the (propagated) main-event name, so they collide-and-suffix.

### 9.2 `labels` (translations)

`src/Traits/TranslatableEntity.php`. Shape: `{ "<property>": { "fr": "...", "de": "..." } }`.
Keys actually present on BKA events: `description` (34,279), `ticketingUrl` (28,334), `printDescription` (25,164).
`name` is **never** translated on BKA. `setLabels(null)` nulls the column; `setLabels([])` empties it.
`getLabelWithLocales(locale, locales, prop)` falls back through the configured locale list.
`HtmlSanitizerService::sanitizeTranslatableFields()` sanitises every string leaf.

### 9.3 Deleting

`event.id` cascades to `event_category`, `video`, `ticketing`, `image`, `rate`, `event_occurrence`,
`place_proposed` (all `ON DELETE CASCADE`), but `mainevent_id` is `ON DELETE RESTRICT` — the ORM-level
`orphanRemoval: true` + `cascade: ['remove']` is what actually deletes sub-events.
`proposed_by_id` is `ON DELETE RESTRICT` with ORM cascade `persist` only — `event_proposed_by` rows are never
cleaned up.

### 9.4 Two filters that are broken on PostgreSQL

`config/packages/doctrine.yaml:29-31` maps the DQL functions `JSON_CONTAINS`, `JSON_EXTRACT`, `JSON_VALUE` to the
**MySQL/MariaDB** implementations from `scienta/doctrine-json-functions`
(`vendor/scienta/.../Mysql/JsonContains.php` emits a literal `JSON_CONTAINS(...)` call). The database is
PostgreSQL. Verified directly:

```
insitu-admin=# SELECT JSON_CONTAINS('[1,2]','1','$');
ERROR:  function json_contains(unknown, unknown, unknown) does not exist
```

Both `EventRepository::engineSearch` (line 249) and `EventOccurrenceRepository::occurrenceEngineSearch` (line 253)
and `OccurrenceExtension` (line 412) use it for `accessibility_proinfirmis`. Conclusion: **the
`accessibility_proinfirmis` filter raises an SQL error on the current (PostgreSQL) deployment.** It is unreachable
in practice on BKA — the UI flag is off and exactly one place in the production DB carries pictograms — which is
presumably why nobody noticed. *(The failure mode is inferred from the function mapping plus the proven absence of
`json_contains` in Postgres; I did not trigger the code path over HTTP because API v2 requires a JWT.)*

The PostgreSQL-specific DQL functions that *are* correct: `ILIKE` →
`unaccent(CAST(x AS TEXT)) ILIKE unaccent(CAST(y AS TEXT)) ESCAPE '!'` (`src/DQL/ILike.php:16-24`),
`UNACCENT` (`src/DQL/Unaccent.php`), `JSON_KEY_VALUES_TEXT` →
`jsonb_path_query_array(CAST(x AS JSONB), '$.<key>.** ? (@.type() == "string")')::text`
(`src/DQL/JsonKeyValuesText.php:25-32`, key restricted to `[A-Za-z0-9_]+`).
`LikeQueryHelpers::makeLikeParam()` wraps the term in `%…%` and escapes `% _ \` with `!`.

### 9.5 Migration history is MySQL-first

`migrations/Version20221124093828.php:28` creates `event` with `AUTO_INCREMENT`, `DATETIME`, `ENGINE = InnoDB` and
`COMMENT '(DC2Type:json)'`. `event_occurrence` is added in `Version20240325085357.php` (MySQL syntax), its indices in
`Version20240326100340.php`, `is_multi_day_event` in `Version20240325083605.php`, `show_in_print` in
`Version20240627123339.php`, `related_dates` in `Version20231109080212.php`, `archived_*` in
`Version20251027150826.php`, `print_category_id` in `Version20260925090000.php`. From roughly
`Version20260608120000` onward the migrations are PostgreSQL-only (`skipIf(!PostgreSQLPlatform)` in some).
There is **no migration that converts `DATETIME` → `timestamptz`** — that happened during the data move itself.
All 67 migrations are recorded as applied in the restored DB. The schema cannot be rebuilt from scratch on Postgres
by replaying them.

---

## Porting notes

*(Opinion, clearly separated from the facts above.)*

1. **The occurrence table is the real index, and it is the thing to preserve.** Everything the public agenda does is
   `event_occurrence` ordered by `date_from`. The We.Publish port needs an equivalent materialised table with the
   same two indexes; filtering on a recurrence rule at query time will not scale (118,021 rows, one event with
   12,374 of them).

2. **Expand recurrences in `Europe/Zurich` wall-clock, then convert to UTC.** This is the single highest-risk
   behavioural difference. Verified: 20:00→00:30 stays 20:00→00:30 across the March DST change. Use a library with
   explicit zoned arithmetic (Temporal / Luxon `setZone`), never UTC millisecond addition.

3. **Reproduce the end-bound semantics exactly**, including the inconsistency: occurrences use an *exclusive*
   `dateTo` bound compared on the full timestamp, while `relatedDates` adds `+1 day` first. 177 of 760 weekly
   events in production depend on that difference. If the port unifies them, `relatedDates` output changes for
   those rows.

4. **`recurrence_week_days` is not reliably a JSON array.** Two production rows store a JSON object
   (`{"1":3,"2":4,…}`). Normalise to `number[]` by taking the *values* during the data migration.

5. **`isMultiDayEvent` should be derived, not stored.** The stored flag is already drifting (3 stale sub-events).
   In the We.Publish model it is a trivial function of the occurrence set
   (`occurrences.length > 1 || spans more than one local day && not a single overnight slot`), and the
   `multi_day=false` search filter is the only consumer.

6. **MainEvent/SubEvent maps badly onto a revisioned block-content model.** A sub-event is not an event; it is an
   extra time slot whose 14 shared fields are copy-propagated on every save (99 % consistent, ~1 % drifted). The
   natural target shape is one Event with a list of date slots, which collapses the whole propagation layer, the
   three sub-event repair commands, and the `relatedDates` column. The cost is losing the per-sub-event slug and
   the `mainevent_id`/`mainevent_slug` fields the public API exposes.

7. **`publication_status` + `publication_date` maps cleanly onto draft/pending/published**: `draft` → draft,
   `to_validate` → pending, `publish` → published, `publication_date` → `publishedAt`/scheduled publication.
   `event_status` (confirmed/cancelled/postponed/full) is orthogonal editorial metadata and must stay a separate
   enum on the published revision. Note that in the current data every non-`publish` event is already in the past —
   the review workflow is used, but nothing lingers in it.

8. **"Archived" has four slightly different definitions in the current code.** Pick one (`max(occurrence.dateTo) < now`
   is the most defensible and already exists as `getLastDateTo`) and use it everywhere.

9. **`archived_organization` / `archived_place` are a hand-rolled historical snapshot.** A revision system gives
   this for free: the published revision of a past event already holds the names as they were. The two bulk DQL
   updates and the `PrePersist`/`PreUpdate` pair can be dropped.

10. **Do not port `accessibility_proinfirmis` as-is** — see §9.4; it is currently a runtime SQL error.

11. **The regenerate-all-occurrences-on-every-save strategy is O(occurrences) per save.** Worth replacing with a
    diff, or at minimum a guard that skips regeneration when no date/recurrence field changed.

12. **`relatedDates` stores serialized PHP `\DateTime` objects** (`{date, timezone_type, timezone}`) and two
    timezone representations appear in the data (`timezone_type:3 "Europe/Zurich"` and `timezone_type:1 "+02:00"`).
    Any migration script reading that column must handle both.

---

## Open questions / unverified

* Whether the real BKA **production** deployment sets `ACTIVATE_PROINFIRMIS=true`. The data argues against it being
  meaningfully used (1 place with pictograms) and the filter would error on Postgres anyway, but the compose file is
  explicitly unreliable and I could not reach a production config.
* Whether `ACTIVATE_MULTI_TICKETINGS` / `ACTIVATE_EVENT_NAME_TRANSLATABLE` / `ACTIVATE_SLUG_GENERATOR_WITH_ID` are
  flipped in production. The restored data says no for the first two (0 `ticketing` rows, 0 `labels.name`);
  I found no evidence either way for the slug flag.
* The exact HTTP behaviour of `accessibility_proinfirmis` — reasoned from the DQL function mapping and a direct
  Postgres probe, not from an executed request (API v2 requires a JWT I did not mint).
* Whether any scheduled job runs the `app:events:*` commands in production. Nothing in `Dockerfile`,
  `docker/entrypoint.sh` or `.github/` references them; they look like manual one-shots.
