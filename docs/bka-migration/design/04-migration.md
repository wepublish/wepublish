# Design 4 — Migration and compatibility

Moving BKa's production data into the new model, and keeping the old v1/v2 APIs answering while
their callers migrate.

Builds on designs [1](01-data-model.md), [2](02-api.md) and [3](03-editor.md). Constrained by
[`../decisions.md`](../decisions.md). All figures measured against the live BKa restore.

---

## 1. What is actually moving

| | Rows | Becomes |
| --- | --- | --- |
| `event` (mainevent) | 24,703 | `events.events` + a published revision |
| `event` (subevent) | 15,275 | `events.events.dates` on the parent event ([D14d](../decisions.md), [D24](../decisions.md)) |
| `event_occurrence` | 128,489 | re-derived, not copied |
| `image` | 32,079 | `Image` + `events.events.revisions.images` |
| `rate` | 15,206 | `events.rates` |
| `video` | 2,304 | Embed blocks on the revision; 2,278 map to an existing block type ([design 1](01-data-model.md) §11.2) |
| `place` | 1,369 | `events.places` |
| `organization` | 781 | `events.organizations` |
| `user` | 670 | `User` + `events.organizations.members` |
| `event_proposed_by` | 5,142 → 1,798 people | dormant `User` accounts ([D8](../decisions.md)) |
| `contact` | 90 | `events.contacts` |
| `technical_sheet` | 1 | `Document` referenced from the place |
| `category` | 30 | `Tag`s with `type: Event`, flattened, with no hierarchy and no hidden flag |
| other taxonomies | 23 | seeded by migration, not imported |
| `place_proposed` | 2,083 | open: the public form stays ([D32](../decisions.md)); venue proposals undecided |
| `ticketing` | 0 | dropped |

Occurrences are re-derived, never copied. They are derived state
([D10](../decisions.md)), so importing them would import BKa's bugs along with its data. Running
our own expansion over the migrated schedules and comparing the result against BKa's 128,489 rows
is the single best end-to-end test of the expansion algorithm (§7).

---

## 2. The id ledger

BKa keys everything on `bigint` autoincrement; We.Publish uses string uuids. A re-runnable
migration needs to know what it already created.

One table, written as the migration goes:

```prisma
model LegacyIdMap {
  entity   String   // 'event' | 'organization' | 'place' | 'user' | 'image' | ...
  legacyId BigInt
  newId    String
  note     String?  // e.g. 'subevent -> occurrence'

  @@id([entity, legacyId])
  @@index([entity, newId])
  @@map("events.legacy-id-map")
}
```

The ledger makes the migration idempotent: every step looks up the ledger first and skips what
already exists. A migration of this size will run many times against staging before it runs once
against production, and one that cannot be re-run gets tested only once.

Nothing needs it after cutover: BKa's old API is switched off ([D31](../decisions.md)), so no old id
has to resolve any more. It is dropped in one migration once the cutover is verified.

---

## 3. Order

Dependencies fix the order; the only open choice is where users go.

```
1. Taxonomies         all 30 categories -> flat tags; regions, audiences, affiliations seeded
2. Users              670 real + ~1,798 dormant proposers            (D8)
3. Organisations      781, + partner flag derived from users         (D14a)
4. Memberships        531 user↔organisation rows
5. Places             1,369, with ProInfirmis data as-is             (D7 syncs later)
6. Images             32,079 → Image rows
7. Events             24,703 mainevents → entity + published revision
8. Dates              15,275 subevents → explicit dates on the parent
9. Occurrences        re-derived by our own expansion                (§7)
10. Reconcile         the report in §7
```

Users before organisations, because `partner` is derived from user membership
([D14a](../decisions.md)): an organisation is a partner if any of its members had `member = true`.

---

## 4. The transformations that are not copies

### 4.1 Language — take German, drop the rest

Per [D13](../decisions.md). Every `labels` JSON collapses to its `de` value. BKa has no French
content ([D33](../decisions.md)); `analyze` reports where the `fr` values in the restore come from.

```
labels = {"description": {"de": "…", "fr": "…"}}  →  de only
```

Rows whose `de` key is null or missing are listed in the report instead of being emptied silently,
which is why this step uses a report and not a one-line transform.

### 4.2 Description — entity-encoded HTML inside JSON, to blocks

This is the most complex conversion in the migration. The source is HTML, entity-encoded, inside a JSON
column. The target is a Slate richtext block.

```
labels->'description'->>'de'
  → decode HTML entities
  → parse HTML
  → map to Slate nodes
  → wrap in a richtext block
```

Anything that cannot be mapped is kept as text and reported, never dropped. The reconciliation
report counts documents containing tags outside the supported set, so we learn what BKa's
organisers actually wrote rather than assuming.

### 4.3 Sub-events — the structural one

For each `mainevent` with children ([D14d](../decisions.md)):

```
parent.date_from/date_to          →  explicit date #1
each subevent (date_from, date_to, opening_time)  →  explicit date #2..n
                                      carrying legacyEventId = subevent.id
scheduleType = Explicit
```

The parent contributes its own first date. This was verified earlier: the parent holds exactly
one occurrence, and only 30 of 15,275 child occurrences coincide with it. Dropping the parent's
date would silently lose the first performance of every recurring event.

`opening_time` travels with each date. BKa's occurrence table has no such column, so a collapse
through occurrences would have lost door times for 2,434 sub-events.

### 4.4 Publication state

| BKa | Becomes |
| --- | --- |
| `publish` | published revision |
| `publish` + future `publication_date` | pending (scheduled) |
| `to_validate` | draft ([D1](../decisions.md)) |
| `draft` | draft |

### 4.5 Proposers to dormant accounts

The 5,142 provenance rows become 1,798 users, deduped on lower-cased email
([D8](../decisions.md)). Each gets a random unusable password and a null `emailVerifiedAt`, and no
mail is sent.
96 unreferenced rows still produce an account if the email is new.

A proposer whose email matches an existing BKa user is merged into that user. The unique email
column forces this, but the merge must decide deliberately which name wins: the existing user's.

### 4.6 Images

- `labels->'legend'->>'de'` → `EventImage.caption` (13,633 have one)
- 3,970 of those look like photo credits (`©`, `Foto`, `zvg`…) → `Image.source`, caption
  cleared where the whole value is a credit
- `Image.description` is left for alt text, which BKa has no equivalent of, so it stays empty
  instead of being filled with the caption ([design 1](01-data-model.md) §11.1)

The credit heuristic is a guess, so it is applied with a report listing every value it moved.
3,970 rows is small enough to eyeball in a spreadsheet, and getting it wrong is cheap to correct
before cutover and expensive after.

### 4.7 Dates beyond the horizon

20 events run past 2030, one to 2099 ([D15](../decisions.md)). They are clipped to the last allowed
day and listed in the report, so none is shortened silently. The clip uses the API's own horizon from
`@wepublish/event/schedule`, so a migrated event passes the same check on its next save. That
horizon counts whole Zurich days ([D40](../decisions.md)): `scheduleHorizon` is 23:59:59.999 on
`lastSchedulableDay`. A weekly event's `dateTo` also carries every occurrence's end time
([D39](../decisions.md)), so the clip should move the date to `lastSchedulableDay` and keep the original
time of day, rather than setting `dateTo` to `scheduleHorizon` and ending every occurrence at 23:59.
Details settled when this step is built.

Weekly events with no weekdays are imported as they are and listed in the report
([D38](../decisions.md)). Expansion gives them no occurrences, and their next save in the editor
asks for a day. 2,855 BKa rows store `[]` (`../research/bka-02-live-data-profile.md:686-692`); how
many of them are `week` rows is for `migrate-bka analyze` to count.

Times need no mapping: BKa keeps them inside `date_from`/`date_to`, which is where the new schedule
keeps them too ([D39](../decisions.md)).

### 4.8 Slugs

BKa slugs are unique across all 39,978 events; We.Publish slugs are unique only among *published*
rows. There are no duplicate slugs in BKa today, so the import carries them verbatim and the
looser constraint accepts them. `oldSlug` lookups go through the ledger.

---

## 5. Data that does not fit

Each of these cases from the live data needs an explicit answer instead of a silent default:

| | Rows | Handling |
| --- | --- | --- |
| Events with no organisation | 7,576 (19%) | Recovered from proposed names; remainder null ([D20](../decisions.md)). §5.1 |
| Events with no owner (`user_id`) | 14,899 | Owner becomes null; notifications skip them |
| Events with no place | 2,933 | Place stays optional |
| Orphan images | 328 | Not imported; listed |
| Orphan videos | 11 | Not imported, since a video with no event has no block to live on; listed |
| Organisations with no members | 315 (40%) | Imported, flagged in the editor ([D18](../decisions.md)) |

### 5.1 The 19% with no organisation — resolved

Profiling the gap turned a blocker into a mostly solved problem. Of the 5,026 mainevents with no
organisation (the other 2,550 are subevents, which inherit from their parent):

| | |
| --- | --- |
| Have a proposer who typed an organisation name | 4,961 (98.7%) |
| …matching an existing organisation exactly | 464 |
| Covered instead by the venue's organisation | 61 |
| Truly unresolvable | 4 |

Per [D20](../decisions.md), the recovery chain is:

```
subevent             → inherit the parent's organisation
proposer's org name  → match an existing organisation, else CREATE one
venue's organisation → where no name was given
otherwise            → null        (organizationId is nullable)
```

[D8](../decisions.md) depends on creating organisations from proposed names. Proposers
get accounts so they can manage the events they submitted; under [D19](../decisions.md)'s strict
scoping, a proposer who is not a member of the organisation owning their event would log in and
see nothing. Creating the organisation they named, with them as its member, fixes that.

The created organisations come from 1,835 distinct names covering 4,961 events:

| Events per created organisation | Count |
| --- | --- |
| 1 | 1,221 |
| 2–5 | 472 |
| 6+ | 142 (largest: 132 events) |

Three rules apply to the creation:

- Matching is exact after normalisation, never fuzzy. Normalising case, whitespace and punctuation
  moves the distinct count only from 1,911 to 1,870, so fuzzy matching buys almost nothing while
  risking the merge of two genuinely different groups, which is much harder to undo than merging
  duplicates afterwards.
- Created organisations are marked as migration-created (`Organization.createdByMigration`,
  `libs/api/prisma/schema.prisma:2446`), so the 1,221 single-event organisations can be found,
  reviewed and merged by an Agenda-Admin rather than disappearing into the list. The flag and its
  filter are sensitive data ([D37](../decisions.md)), visible to the Agenda-Admin but not the public.
- No details are fabricated. They have no address, region or contact; those stay empty rather than
  being invented.

## 6. How it runs

Following the in-repo precedent, `tools/migrate-article-authors/`: a Node tool with
`analyze` / `apply` / `cleanup` phases, a plan file, `--dry-run` and `--limit`.

Differences from that precedent, both forced by scale:

- Direct Prisma, not the GraphQL API. 40,000 events and 32,000 images through HTTP mutations
  would be slow and would fire the mail and revision side effects we do not want during an import.
- Batched and resumable. The ledger (§2) makes `--limit` useful: run 100, inspect,
  run the rest.

```bash
migrate-bka analyze                 # read-only; produces the report in §7
migrate-bka apply --dry-run
migrate-bka apply --limit 100
migrate-bka apply
migrate-bka verify
```

`analyze` is runnable today, against the live restore, before any code exists. It is the cheapest
way to find more problems like the ones in §5.

---

## 7. Verifying it worked

Nobody can trust a migration that reports success without evidence, so it runs three checks.

**Counts reconcile.** Every table, source against target, with the expected deltas stated up front
(39,978 events → 24,703 + 15,275 dates; 5,142 provenance → 1,798 users). An unexplained delta
is a failure, even a small one.

**Occurrences match BKa's.** We re-derive rather than copy (§1), so comparing our expansion against
BKa's 128,489 rows is a free, exhaustive test of the algorithm on real data, including the DST
boundaries and the 12,374-row outlier. Any mismatch is investigated before cutover, in either
direction: BKa's expansion has known bugs, so a difference may be ours or theirs, and the report
must make it possible to tell.

**Spot-check the awkward ones.** A weekly event crossing the March DST change; the 12,374-occurrence
event; an event with 200 sub-events; an event with no organisation; an image whose caption is a
credit; a proposer who is also a user.

---

## 8. The old v1/v2 API is switched off

Per [D31](../decisions.md) there is no compatibility stub and no interim layer. When BKa
migrates, its v1/v2 API is switched off; In Situ's, served by the same Symfony codebase, stays on.
This section replaces the stub that [D22](../decisions.md) and [D26](../decisions.md) had planned.

### 8.1 What clients lose

| | Surface |
| --- | --- |
| v1: hand-written controllers | 7 controllers, 19 actions (11 on `/api/v1/events`) |
| v2: API Platform resources | 8 resources, 23 operations |
| Total | 42 operations |

A client needs a We.Publish equivalent for each operation it uses. `agenda`
([D30](../decisions.md)) covers `/events/agenda`, and the event filters cover
`/events/agenda/organization` and `/events/agenda/place`. `/events/agenda/sponsored` has no data
(`ACTIVATE_SPONSORED_EVENTS=false`). `/events/agenda/similar` has no equivalent in
[design 2](02-api.md), which is an open question.

`public/openapi.yaml` in the BKa repo is stale (v1 only, 8 paths) and is no guide to what clients
actually call.

### 8.2 Who has to be told

Four OAuth clients are registered. By name they are the BKa website (`bka-frontend`), the Guidle
event exchange, a venue and an agency. Two `user_token` rows are named `Print Import` and
`Printimport V2`. Which of them still call the API is unknown, because the restored environment has
no access logs. Every one of them is told before cutover.

They move to the We.Publish GraphQL API and authenticate with We.Publish API keys
([D23](../decisions.md)). The `Print Import` tokens are stored hashed and cannot be migrated, so
the print pipeline needs new credentials and advance warning.

Switching BKa off must not touch In Situ's API on the same codebase.

---

## 9. Cutover

1. Run `analyze` against a production copy; resolve §5 and §10.
2. Dry run, then a full run against staging; verify (§7).
3. Tell every client of the old API; issue We.Publish API keys; warn the print pipeline (§8.2).
4. Freeze BKa writes.
5. Final run.
6. Verify, then switch off BKa's old API, leaving In Situ's on (§8).
7. Keep BKa readable, read-only, for a defined period; it is the only copy of anything the
   migration dropped.

Step 7 makes the irreversible steps reversible in practice, so it should not be skipped
because the migration "went fine".

---

## 10. Open questions

1. Is the photo-credit heuristic acceptable? (§4.6) 3,970 rows, reported for review.
2. How long does BKa stay readable after cutover? (§9)
3. What replaces `/events/agenda/similar`? (§8.1)
4. Does the public form still propose venues, and what happens to the 2,083 pending
   `place_proposed` rows? ([D32](../decisions.md))

---

Back to [the decision log](../decisions.md).
