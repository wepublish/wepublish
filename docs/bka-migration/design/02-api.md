# Design 2 — The API

The NestJS/GraphQL surface for the agenda: which libraries exist, what the schema exposes, how
authorisation and validation work, and where the mail and ProInfirmis integrations hang.

Builds on [design 1 — the data model](01-data-model.md). Constrained by
[`../decisions.md`](../decisions.md) and grounded in
[`../research/wp-08-api-module-conventions.md`](../research/wp-08-api-module-conventions.md).

---

## 1. Libraries

The current event implementation is deleted ([`../research/wp-01-current-event-implementation.md`](../research/wp-01-current-event-implementation.md))
and its path reused — the tables are `events.*`, so the library should be `event` too.

| Library | Status | Contains |
| --- | --- | --- |
| `libs/event/api` | **replaced** | `EventModule`, `OrganizationModule`, `PlaceModule`, `EventTaxonomyModule` |
| `libs/event/editor` | **new** | design 3 |
| `libs/event/website` | **adapted** | public rendering — kept and re-pointed, not rewritten (§8) |
| `libs/event/import/*` | **deleted** | out of scope per the brief |
| `libs/api-token/api` | **new** | §9 |

One library, four Nest modules. Organisations, places and taxonomies are separate *modules* but
not separate *libraries*: they have no meaning outside the agenda, and four path aliases for one
cohesive domain buys nothing. If an organisation ever becomes a cross-domain concept it can be
lifted out then.

Each follows the canonical file set — `*.module.ts`, `*.model.ts`, `*.service.ts`, `*.resolver.ts`,
`*-dataloader.service.ts`, colocated `*.spec.ts`, and a `vitest.config.ts` calling
`createVitestConfig({nest: true})`.

---

## 2. The GraphQL surface

### 2.1 Queries

```graphql
event(id: ID, slug: Slug): Event
events(filter: EventFilter, sort: EventSort = StartsAt, order: SortOrder = Ascending,
       take: Int = 10, skip: Int = 0, cursorId: String): PaginatedEvents!

# one row per OCCURRENCE, ordered by its own date — see §2.1
agenda(filter: EventFilter, order: SortOrder = Ascending,
       take: Int = 10, skip: Int = 0, cursorId: String): PaginatedOccurrences!

organization(id: ID, slug: Slug): Organization
organizations(filter: OrganizationFilter, ...): PaginatedOrganizations!

place(id: ID, slug: Slug): Place
places(filter: PlaceFilter, ...): PaginatedPlaces!

# tags come from the platform `tags` query, filtered to `type: Event` — §10.1 of design 1

eventRegions: [EventRegion!]!          # 13
eventAudiences: [EventAudience!]!      # 4
eventAffiliations: [EventAffiliation!]! # 7

```

The five-slot args shape (`filter` / `sort` / `order` / `take` / `skip` / `cursorId`) is the house
convention and is followed exactly. The taxonomies are unpaginated — all four fit in one response
and are effectively static.

### 2.2 The event filter

This is where the agenda earns its keep. Every filter below exists in BKa's v1/v2 API today and
has real callers.

```graphql
input EventFilter {
  # text
  search: String                     # unaccent + ILIKE across name and description

  # time — matched against occurrences, not the event
  from: DateTime
  to: DateTime
  upcoming: Boolean

  # taxonomy
  tagIds: [ID!]
  audienceId: ID
  regionId: ID

  # relations
  organizationIds: [ID!]
  placeIds: [ID!]

  # geography
  geoBoundingBox: GeoBoundingBox      # northEast + southWest lat/lng

  # accessibility (D7)
  wheelchairAccessible: Boolean
  accessibilityProInfirmis: [Int!]    # legacy numeric pictogram ids

  # agenda-specific
  partner: Boolean                    # D11
  showInPrint: Boolean
  eventStatus: [EventStatus!]
}
```

Two things to get right:

**Date filtering matches occurrences, not events.** "What is on next Saturday" is a question about
occurrences. The query filters `occurrences` and returns distinct events, which is why the
occurrence table carries its own `(dateFrom)` and `(dateTo)` indexes.

### 2.1 Two list shapes, because BKa has two

This was nearly got wrong by reasoning from We.Publish's old flat event instead of from BKa. BKa
ships **both** shapes and they are not interchangeable
(`research/bka-04-api-v2-apiplatform.md:296-297`):

| BKa endpoint | Returns | Ordered by |
| --- | --- | --- |
| `GET /api/v2/events` | one member per **event** | `event.dateFrom ASC` |
| `GET /api/v2/events/agenda` | one member per **occurrence** | `occurrence.dateFrom ASC` |

`events` is the catalogue — "show me this organiser's productions". `agenda` is the calendar —
"what is on this week" — and a weekly series appears in it **once per date**, each row at its own
date.

This dissolves what looked like a hard problem. Sorting events by a single `startsAt` means a
weekly series that began in 2023 and runs to 2026 sorts under 2023 forever, sinking to the bottom
of an ascending agenda. BKa never has that problem because its agenda does not sort events at
all — it sorts occurrences. So there is no need for a time-dependent `nextOccurrenceAt` column,
which would have been hostile to the response cache and inexpressible as a plain index.

`firstDateAt` / `lastDateAt` therefore keep a narrower job than first specified: they back the
**compatibility scalars** `Event.startsAt` / `Event.endsAt` that the `EventBlock` and the teasers
read (§8.3), and they order the `events` catalogue. They do **not** back the agenda.

**`search` must be accent-insensitive, and indexed** ([D16](../decisions.md)). BKa uses
`unaccent()` + `ILIKE '%…%'` with no index; a search for `theatre` must find *Théâtre*. A migration
enables `unaccent` and `pg_trgm` and builds a GIN trigram index over the same unaccented expression
the query uses — otherwise the leading-wildcard match is a sequential scan over ~25,000 rows on
every keystroke of a type-ahead.

The detail most likely to go wrong: `unaccent()` is not immutable by default, so it cannot be
indexed directly without an immutable wrapper. A test asserts that searching an unaccented term
finds an accented row, and an `EXPLAIN` in review confirms the index is actually used.

### 2.3 Mutations

[D24](../decisions.md) splits the write surface in two, because the two halves have different
rules: facts take effect immediately, prose waits for publication.

```graphql
# facts — take effect on save
createEvent(input: EventInput!): Event!
updateEvent(id: ID!, input: EventInput!): Event!     # schedule, place, organisation,
                                                     # status, tags, rates, owner
deleteEvent(id: ID!): Event!
duplicateEvent(id: ID!): Event!

# prose — lands in the draft revision
updateEventContent(id: ID!, input: EventContentInput!): Event!   # name, printDescription,
                                                                 # blocks, images

# publication
publishEvent(id: ID!, publishAt: DateTime): Event!   # publishAt => pending
unpublishEvent(id: ID!): Event!
requestEventReview(id: ID!): Event!                  # D5

createOrganization / updateOrganization / deleteOrganization
createPlace / updatePlace / deletePlace
```

`updateEvent` never touches a revision; `updateEventContent` only ever writes the draft one,
creating it if the event has none. `createEvent` does both — it takes the facts and an initial
content payload, and writes an entity plus its first draft revision in one transaction.

Two consequences worth stating. Changing a date or cancelling an event is visible to the public
agenda **without publishing**, which is the point. And an organiser who needs validation
([D4](../decisions.md)) can still correct a start time on a published event — review gates what
they *write*, not the facts they maintain.

`requestEventReview` is the only unusual one. It is callable **only** on a draft, and **only** by
someone who can edit the event but cannot publish it — a user holding `CanPublishEvent` has no use
for it and gets an error rather than a no-op, because silently accepting it would leave the
organiser believing they had asked for something.

---

## 3. Authorisation

### 3.1 What the framework does and does not give us

Verified in [`../research/wp-03-permissions-and-roles.md`](../research/wp-03-permissions-and-roles.md):

- The guard chain sees **only route metadata and `req.user.roles`**. Nothing reaches a record.
- `@Permissions(A, B)` means **A and B** in the API, but the editor's `useHasPermission` is **or**.
- `@Public()` beside `@Permissions(X)` makes the handler **public** — the guards are OR'd.
- `CanLoginEditor` is a **client-side gate only**; server-side it guards two chrome resolvers.

So permissions answer "may this user do this *kind* of thing", and nothing more. Every "…to *this*
record" question is ours to implement.

### 3.2 One predicate builder, used everywhere

BKa spread its visibility rule across four Doctrine query extensions plus a voter, and
[`../research/bka-04-api-v2-apiplatform.md`](../research/bka-04-api-v2-apiplatform.md) §19.3 records
that they have **already drifted out of agreement**. That is the failure mode to design against.

A single exported function is the only place the rule lives:

Two functions, because "what the public may read" and "what you may manage" are different
questions ([D19](../decisions.md)) — conflating them is how an organiser ends up browsing a rival's
programme:

```ts
// libs/event/api/src/lib/event-scope.ts

/** Public agenda — website and public API. Published events, full stop. */
export const publicEventsWhere = (): Prisma.EventWhereInput =>
  ({ published: { isNot: null } });

/** Editor — what this user may see and manage. Own organisations only,
 *  unless they hold the cross-organisation permission. */
export const editorEventsWhere = (session: UserSession): Prisma.EventWhereInput =>
  hasPermission(CanGetOtherOrganizationEvents, session.roles)
    ? {}
    : { organizationId: { in: session.organizationIds } };

/** Whether this session may modify this specific event. Membership of the
 *  organising body OR of the venue's organisation — the second branch is what
 *  makes D3's validation mail land on something the recipient can open. */
export const canModifyEvent = (
  session: UserSession,
  event: Event & { place: { organizationId: string | null } | null }
): boolean =>
  session.organizationIds.includes(event.organizationId) ||
  (event.place?.organizationId != null &&
    session.organizationIds.includes(event.place.organizationId)) ||
  hasPermission(CanUpdateOtherOrganizationEvents, session.roles);
```

Note that the two functions scope **differently on purpose**, and this is the one place the port
must not simplify. `editorEventsWhere` is organising-body only; `canModifyEvent` also accepts the
venue's organisation. That asymmetry is deliberate: D3 mails the venue's organisation admins
precisely when the organiser is *not* them, so if `canModifyEvent` were narrowed to match the list,
every validation mail would link to a 403. The venue admin reaches the event **by link, not by
browsing** — which is exactly what BKa does, where the admin list (`org ∪ proposer`) and the edit
voter (`own ∪ org ∪ place-org ∪ proposer`) disagree by that same branch
(`research/bka-06-security-auth-roles.md:453`, which found *five* different definitions of "my
event" across BKa's five implementations).

An organiser therefore sees **only their own organisation's events** in the editor — matching BKa,
where `LIST_OWN_EVENTS_ONLY=true` in production. A user with no membership and no cross-organisation
permission sees an empty list, and the empty state must say why rather than implying the agenda is
empty.

Per-record checks live in **service bodies**, following the nearest existing pattern
(`comment.service.ts`: load, compare, throw `NotAuthorisedError`). The rule is tested once against
the builder rather than once per resolver.

### 3.3 Membership on the session

`editorEventsWhere` needs `session.organizationIds`, so membership must be loaded with the
session rather than fetched per check. `AuthenticationService.loadUserSession` already assembles
roles; it gains a join on `events.organizations.members`.

That is a cost paid on **every** authenticated request, including the ~19 tenants with no agenda.
It is one indexed lookup returning a handful of ids, and it is cached for the session's lifetime —
but it is a shared-path change, so it needs a benchmark rather than an assumption.

### 3.4 Validation is publishing, not a workflow

Per [D3](../decisions.md): there is no approval state machine. Validating an event *is* publishing
a draft that belongs to another organisation, which `publishEvent` already does — gated by
`CanUpdateOtherOrganizationEvents` when the actor is not a member of the owning organisation.

The queue is a query, not a table: drafts where `reviewRequestedAt IS NOT NULL`, ordered oldest
first, scoped by `visibleEventsWhere`.

---

## 4. Validation

`class-validator` is **not installed**. Validation happens in four places, and the agenda uses all
four:

| Rule | Where |
| --- | --- |
| Required / nullable / enums | the GraphQL type system |
| Slug shape | the `GraphQLSlug` scalar |
| Structured values (schedule, rates) | zod schemas called explicitly in the service |
| Cross-field and business rules | hand-written guards throwing `BadRequestException` |

The rules the agenda must enforce, all ported from BKa:

```
name                ≤ 130 characters
description         ≤ 6,400 characters after HTML-stripping and entity-decoding
printDescription    ≤ 256 characters, same measurement
tags                1 ≤ n ≤ 3
dateFrom ≤ dateTo   on every span and every explicit date
last date           ≤ now + 2 years                              (D15)
ticketingUrl        scheme in {http, https, mailto, tel}
geo coordinates     both latitude and longitude, or neither
zip                 ≤ 4 characters
```

Two deserve comment.

**The description limit is measured after stripping.** BKa counts characters of *text*, not of
markup, so a 6,400-character limit on the raw HTML would reject content BKa accepts. With blocks
([design 1](01-data-model.md) §7) the equivalent is the concatenated text of the richtext nodes.

**The two-year cap is the validation form of [D15](../decisions.md).** It is checked at save time
against the latest date the revision describes, so a draft that sits for a year is re-checked when
it is finally published rather than grandfathered in.

---

## 5. Occurrence expansion

One function, three inputs, one output — the heart of the agenda.

```ts
expandOccurrences(revision: EventRevision): Array<{
  dateFrom: Date
  dateTo: Date
  openingTime: string | null
  legacyEventId: bigint | null
}>
```

- `Continuous` → one occurrence.
- `Weekly` → walk the span, emit on each selected weekday.
- `Explicit` → map the stored list.

Called from exactly two places — `publishEvent` and `unpublishEvent` — plus a backfill for the
migration and a repair command (BKa's `EventsCalculateOccurrencesCommand` equivalent). Drafts
expand **in memory** for preview and materialise nothing.

**The walk must happen in `Europe/Zurich`.** BKa adds `P1D` in that zone, which preserves the wall
clock across DST; We.Publish runs `TZ=UTC`, where a naive 24-hour loop silently shifts a Saturday
11:00 series to 10:00 for half the year. Storage stays `Timestamptz`; only the arithmetic is zoned.

Three tests this needs, written first:

1. Re-expanding a published event is idempotent.
2. A weekly series spanning the last Sunday in March keeps its local time.
3. An event whose last date exceeds two years is rejected at save, not truncated at expand.

---

## 6. Mail

Six BKa templates survive ([D3](../decisions.md)); `requestEventReview` adds a trigger to one of
them rather than a seventh template.

| Trigger | Recipient | BKa template |
| --- | --- | --- |
| Event created at another organisation's venue | the creator | `1a` |
| …and left as a draft | venue organisation's users | `1b` |
| `requestEventReview` ([D5](../decisions.md)) | venue organisation's users | `1b` |
| A draft is published by someone else | the event's owner | `3a` |
| Published directly at a foreign venue | venue organisation's other users | `3b` |
| Edited by someone who is not the owner | the event's owner | `4a` |
| Edited by the owner | venue organisation's users | `4b` |

All become editor-editable templates, not hardcoded Twig.

### 6.1 The blocker

`MailLog.recipientID` is a **NOT NULL foreign key to `users(id)`**. Three of the six templates fall
back to a reply-to address when the venue organisation has no users at all — and that fallback is
not a user row, so it cannot be logged, and therefore cannot be sent through the existing path.

[D8](../decisions.md) shrinks this problem by giving former proposers real accounts, but does not
remove it: an organisation can still have zero members.

**Resolved by [D18](../decisions.md): skip the send.** Recipients resolve to user rows; an empty
set means no mail, and no fallback address is used. `MailLog` keeps its NOT NULL constraint and no
shared mail schema changes.

The gap becomes visible instead: the editor shows organisations with zero members as needing
attention. BKa's fallback quietly redirected mail about an unmaintained organisation to whoever
held the reply-to address, so nobody ever learned it was unmaintained. A skipped send is still
logged — replacing an invisible redirect with an invisible no-op would be no improvement.

### 6.2 BCC becomes a per-template setting

Per [D17](../decisions.md): `MAILER_BCC_ADDRESS` is not ported. `MailTemplate` gains a nullable
`bccAddress`, editable in the editor beside the subject and body.

BKa's global BCC copies an unrelated address on every message, invisibly to both sender and
recipient. Per-template makes it deliberate and visible: an operator can take a copy of "an event
needs validating" without also copying every message sent to an organiser. Default is null — no
BCC — which is a behaviour change from BKa and should be called out at cutover.

This applies to all mail templates, not only the agenda's. The port is the occasion, not the scope.

---

## 7. ProInfirmis / Ginto

Per [D7](../decisions.md) and [D21](../decisions.md): a Ginto GraphQL client, normalising to the
legacy numeric pictogram ids. Whether those ids are still wanted now that BKa's old API is switched
off ([D31](../decisions.md)) is an open question.

Per [D34](../decisions.md), In Situ finishes Ginto in the old system before the end of 2026, so BKa's
accessibility data keeps syncing until cutover. Its finished integration is the reference to check
the three defects below against.

**This is a multi-tenant feature, not a BKa one.** BKa has a single place with ProInfirmis data;
InSitu and other tenants are the real consumers and run with the integration enabled by default.
It is built and tested accordingly.

- `GintoService` — query, paginate, map `key` → legacy numeric id.
- `SyncPlacesFromGintoCommand` — matched on `place.proInfirmisIdSource`.
- Writes `proInfirmisPictograms`, `proInfirmisDetailUrl`.
- Feeds the `accessibilityProInfirmis` filter (§2.2).

The key and filter now exist, and the three defects in the unfinished branch are settled against
the live API ([D21](../decisions.md)): the ratings query asks for a `name` field that does not
exist (use `description(locale:)`), entry ids are 36-char UUIDs against a `varchar(24)` column,
and the source key is `ch.proinfirmis.zuerst`, not `zuerst`. All three fail silently.

Credentials live in `.env.local`, never in this repository.

No ZUERST fallback: if Ginto is unreachable the last synced data stands. But a sync that returns
**zero ratings or zero matches is an error**, not a quiet no-op — that is precisely how all three
bugs would otherwise hide, and for a tenant whose venues depend on this the accessibility data
would simply stop appearing with nobody told.

---

## 8. What gets deleted, and what gets re-pointed

This section used to be a deletion list. It is not one any more:
[Karl kept the `EventBlock`](../decisions.md) — "people will be using it in the future" — which
turns most of the old event surface from something removed into something **re-pointed at the new
domain**. The practical effect is that the new public `Event` type is a *consumer-facing contract*,
not just an editor one.

### 8.1 Deleted outright

1. `libs/event/import/*` — three projects, their aliases and `project.json`s. Deleted **last**,
   once nothing imports them.
2. The old `Event` and `TaggedEvents` rows and the old `EventStatus` type. Per Karl, existing
   event rows are **dropped, not migrated** — so there is no value-level `CASE` mapping and no
   rescue path for old `lead` strings. Everything in §8.3 depends on this being literal.
3. `Event.lead`, `Event.slateDescription`, `Event.externalSourceName`, `Event.externalSourceId`.
   `lead` goes because [Karl settled that `lead` is just `description`](../decisions.md) — the two
   were one concept, and the website already treats them that way as a fallback chain
   (`event-seo.tsx:13`, `event-list-item.tsx:103-105`, `base-teaser.tsx:66-72`). Each call site
   drops its `lead ||` branch and keeps the description branch.

### 8.2 Re-pointed, not deleted

| Surface | What happens |
| --- | --- |
| `libs/event/website/**` | **adapted.** Detail page renders `latest.blocks` through `<Blocks/>` instead of a `description` scalar; list items keep using the derived `description`. |
| `block-content/api` `EventBlock` | resolver rewritten against the new model — see §8.4 |
| `block-content/website` event block + `base-teaser` | drop `lead`, tolerate null `name`/dates |
| `ui/editor` `eventBlock`, `selectEventsPanel`, `teaserSelectPanel`, `TeaserCard` | filter-key renames and null guards |
| 21 tenant `/event` routes | `[id].tsx` → `[slug].tsx` plus `id/[id].tsx`; 16 of 21 are byte-identical scaffolding |

### 8.3 The compatibility surface on `Event`

The old consumers read `name`, `description`, `image`, `location`, `startsAt`, `endsAt` **flat off
the event**. The new model puts prose on `EventRevision` and the schedule on the entity, so those
reads would all break. The platform already has an answer for this and it is **not** the `Article`
shape: `Comment` flattens its revision prose onto the entity as nullable scalars *beside* a
revisions accessor (`libs/comments/api/src/lib/comment.model.ts:117-125`,
`comment.resolver.ts:219-249`). `Event` takes both halves — `Comment`'s flattening for the
compatibility surface, `Article`'s `draft`/`pending`/`published`/`latest` for the editor.

Every flattened field is **nullable**, including `latest` — unlike `Article`, which declares it
non-null. A draft-only event legitimately has no public revision, and a non-null field that
resolves null nulls the whole `Event` out of a list.

| Flat field | Resolves from |
| --- | --- |
| `name` | `published.name` (preview: `draft ?? pending ?? published`) |
| `description` | first richtext block of that revision's `blocks` |
| `image` | the revision's `EventImage` with `isMain`, else lowest `sortOrder` |
| `location` | `place.name` — not `"{name}, {city}"` |
| `startsAt` / `endsAt` | the new `firstDateAt` / `lastDateAt` columns |

`startsAt`/`endsAt` are **plain denormalised columns written in `createEvent`/`updateEvent` from
the entity schedule — never derived from materialised occurrences.** Three reasons: D24 puts the
schedule on the entity precisely so a date fix lands on save, while occurrences are only
regenerated at publish; a pending publication produces an event with zero occurrences
([recorded in the decision log](../decisions.md)); and Prisma cannot `orderBy` a relation
aggregate, so plain columns are what keep sorting and cursor pagination on index scans without
`$queryRaw`.

One accepted semantic change: for `Weekly` and `Explicit` schedules `endsAt` is the **end of the
span**, not the end of one sitting. It reads correctly in a list ("1 Jan – 3 Mar") and wrongly in
the JSON-LD `duration`, which must therefore stop emitting a duration for those schedule types.

### 8.4 The `EventBlock` resolver becomes scope-bearing

Today it is `prisma.event.findMany` with no publication check — harmless when every event row is
public, wrong the moment events have revisions. It routes through `EventService.getPublicEvents`
and applies `publicEventsWhere()` so an unpublished event cannot leak through a block on a public
page. It is **not** organisation-scoped: it is a public website block, and D19's editor scoping
must not reach it.

Dangling `filter.events` ids are **made visible, not migrated away** — per Karl, a block pointing
at deleted rows simply renders nothing. The editor warns; the website renders an empty block.

### 8.5 Also required

- `PublicContent` gains `'events'` (`libs/kv-ttl-cache/.../graphql-response-cache.plugin.ts:29-35`)
  so the new public queries are cacheable and invalidatable.
- `EventScheduleWatcher` repoints from `prisma.event` to occurrences.
- `EventFilter` renames `tags`→`tagIds` and `upcomingOnly`→`upcoming` and gains `ids`. This is a
  **separate step** from the fragment rewrite, because query variables are built by hand outside
  the fragments.
- `getEventURL` becomes `/event/<slug>` with `/event/id/<id>` as fallback.

## 9. API tokens

The brief asks for BKa's API tokens reimplemented separately from We.Publish's `Token`.

`libs/api-token/api`, tables prefixed `api-tokens.` (its own prefix, not its own schema file —
[D12](../decisions.md)):

```prisma
model ApiToken {
  id             String    @id @default(dbgenerated("gen_random_uuid()"))
  name           String
  tokenHash      String    @unique
  organizationId String?           // scope: null = all organisations
  lastUsedAt     DateTime?
  expiresAt      DateTime?
  revokedAt      DateTime?

  @@map("api-tokens.tokens")
}
```

A Nest guard resolves the token to a scope and populates the same `session.organizationIds` the
user path uses — so §3.2's predicate builder works unchanged for token callers. That is the point
of doing it this way: one authorisation rule, two ways of arriving at it.

Tokens are stored **hashed**. BKa's five live tokens are not recoverable from the migration and
must be reissued; two of them are named `Print Import` and `Printimport V2`, so whoever runs that
pipeline needs warning before cutover.

---

## 10. Testing

TDD is mandatory here. Per [`../.claude/docs/testing.md`](../../../.claude/docs/testing.md): Vitest
everywhere, `vi.fn()` / `vi.mock()`, `createVitestConfig({nest: true})`, specs colocated as
`*.spec.ts`.

The tests that carry the most weight:

| Area | Test |
| --- | --- |
| Expansion | idempotent re-expansion; DST wall-clock stability; two-year rejection |
| Scope | `publicEventsWhere` and `editorEventsWhere` for anonymous / member / cross-org, as a table |
| Permissions | the **deny** path for every guarded resolver |
| Mail | each of the six triggers fires exactly once, to the right recipients |
| Validation | each limit in §4, at and over the boundary |

The deny path matters most. A resolver with no guard passes a spec that only checks the happy
path, which is how an unguarded mutation reaches production.

---

## 11. Open questions

1. **Does loading membership on every session need a benchmark?** (§3.3) It is one indexed lookup
   on a shared path used by every tenant.
2. **How is the tenant regression sequenced?** (§8) 17 sites lose their event rendering before the
   replacement is ready for them.

---

Next: [design 3 — the editor](03-editor.md).
