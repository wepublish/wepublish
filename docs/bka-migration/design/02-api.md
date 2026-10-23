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
| `libs/event/api` | **replaced** | `EventModule`, `OrganizationModule` (built), `PlaceModule`, `EventTaxonomyModule`, and the scope module `event-scope.ts` (built, §3.2) |
| `libs/event/schedule` | **new, built** | `@wepublish/event/schedule`: occurrence expansion, the two-year horizon and schedule input validation (§4, §5). Pure functions, no Nest |
| `libs/event/editor` | **new** | design 3 |
| `libs/event/website` | **adapted** | public rendering — kept and re-pointed, not rewritten (§8) |
| `libs/event/import/*` | **deleted** | out of scope per the brief |
| `libs/api-token/api` | **new** | §9 |

One Nest library, four Nest modules. The schedule code is a separate library because it has no Nest
or Prisma dependency and the migration needs it as much as the API does. Organisations, places and taxonomies are separate *modules* but
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

# public; resolves to SensitiveDataOrganization per row for members and
# CanGetOtherOrganizations / CanUpdateOtherOrganizations holders — §2.1.1
organization(id: ID, slug: Slug): BaseOrganization
organizations(filter: OrganizationFilter, ...): PaginatedOrganizations!   # nodes: [BaseOrganization!]!

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

### 2.1.1 Public and sensitive organisation data

Organisations are readable without login (bka.ch lists them at `/organizations/` and renders a
page per organisation), but not every field is public ([D37](../decisions.md)). The split follows the
`SensitiveDataUser` pattern in `libs/user/api`: an interface `BaseOrganization` carries the public
fields, `Organization` implements it with nothing more, and `SensitiveDataOrganization` adds the rest
(`libs/event/api/src/lib/organization/organization.model.ts:27-107`). Because the same public query
serves anonymous visitors, members and admins, `BaseOrganization.resolveType` picks the type **per
row and per caller** with `canReadOrganizationSensitiveData`
(`libs/event/api/src/lib/event-scope.ts:94-100`): a member of that organisation, or a holder of
`CanGetOtherOrganizations` or `CanUpdateOtherOrganizations`, gets the sensitive type. API keys go
through the same check: a key bound to the organisation gets the sensitive type as a member does, and
a platform key follows its scopes ([D36](../decisions.md)). The writes return `SensitiveDataOrganization`
directly, as the user mutations return `SensitiveDataUser`.

| Public (`BaseOrganization`) | Sensitive only (`SensitiveDataOrganization`) |
| --- | --- |
| `id`, `name`, `slug`, `subTitle`, `about`, `website`, `legalStatus`, `enabled`, `address`, `zip`, `city`, `latitude`, `longitude`, `regionId` | `createdAt`, `modifiedAt`, `partner`, `createdByMigration`, `postOfficeBox`, `members` |

Evidence, checked on 2026-10-23: bka.ch's own `/api/organizations` list (the anonymous JSON behind
the `/organizations/` page) returns `id, slug, name, enabled, sub_title, categories, latitude,
longitude, labels{about, subTitle}`; detail pages render name, categories, address, zip and city,
region, about, contacts, website, `Rechtsform` (legal status, on 5 of 79 sampled pages) and
`Aktivitätsstatus` (enabled), plus coordinates for the map. Neither the v1 `default`/`reader`
groups nor v2 `OrganizationApi` serialise `member`/`partner`. `postOfficeBox` appears only in
the authenticated item groups (v1 `reader`, v2 `Org-I`). Only 8 of 741 organisations have one,
though, so the sample cannot prove the detail page never shows it.

The filters `partner`, `createdByMigration` and `hasMembers` would leak the sensitive fields, so
they need `CanGetOtherOrganizations` or `CanUpdateOtherOrganizations` and otherwise return FORBIDDEN
(`organization.service.ts:362-379`). Sorting by `CreatedAt` or `ModifiedAt` stays public.

Which rows are visible is a separate rule: anonymous callers see enabled organisations, members
also see their own disabled ones, and holders of either permission above see all
(`visibleOrganizationsWhere`, `event-scope.ts:72-86`). Changing `partner` or `enabled` needs
`CanUpdateOtherOrganizations` (`organization.service.ts:266-280`).

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
  partner: Boolean                    # D11 — public; what it reveals is accepted (D42)
  showInPrint: Boolean
  eventStatus: [EventStatus!]
}
```

Two things to get right:

**`partner` stays public on events** ([D42](../decisions.md)). BKa's `member` parameter is public,
and this filter keeps it so, with no permission check, although it reveals which organisations are
partners. That is accepted. It does not contradict [D37](../decisions.md): `Organization.partner`
stays on `SensitiveDataOrganization`, and filtering *organisations* by it still needs
`CanGetOtherOrganizations` / `CanUpdateOtherOrganizations` (§2.1.1).

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

One module is the only place the rule lives: `libs/event/api/src/lib/event-scope.ts`. Every
function takes `AuthSession | null | undefined` (`event-scope.ts:12`), so a user, an API key, a peer
token and an anonymous caller all go through the same code; there is no `UserSession`-only variant.

The event rule is two functions, because "what the public may read" and "what you may manage" are
different questions ([D19](../decisions.md)) — conflating them is how an organiser ends up browsing a
rival's programme. As built (`event-scope.ts:109-130`), apart from `publicEventsWhere`, which waits
for the `Event` model:

```ts
// planned, with the Event model
export const publicEventsWhere = (): Prisma.EventWhereInput =>
  ({ published: { isNot: null } });

// built
export const editorEventsWhere = (session: Session): EventScopeWhere => {
  if (holdsAcrossOrganizations(session, CanGetOtherOrganizationEvents)) {
    return {};
  }

  const organizationEvents = { organizationId: { in: organizationIdsOf(session) } };
  const userId = userIdOf(session);

  if (userId == null) {
    return organizationEvents;
  }

  return { OR: [organizationEvents, { ownerId: userId }] };
};

export const canModifyEvent = (session: Session, event: EventOwnership) =>
  isEventOwner(session, event) ||
  isOrganizationMember(session, event.organizationId) ||
  isOrganizationMember(session, event.place?.organizationId) ||
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents);
```

`EventOwnership` is `{ organizationId; ownerId; place?: { organizationId } }`, with `ownerId`
required so a caller cannot forget to load it (`event-scope.ts:14-18`). `EventScopeWhere` is a
structural type (`:20-27`) rather than `Prisma.EventWhereInput`, because the new `Event` model does
not exist yet.

The helpers the event and organisation services share:

| Function | Answers | Line |
| --- | --- | --- |
| `organizationIdsOf(session)` | the user's memberships, a bound key's one organisation, otherwise none | `:43-54` |
| `holdsAcrossOrganizations(session, p)` | holds `p` and is not a bound key ([D36](../decisions.md)) | `:29-34` |
| `isEventOwner(session, event)` | a user session whose user id equals `ownerId` ([D35](../decisions.md)) | `:56-63` |
| `isOrganizationMember(session, id)` | `id` is in `organizationIdsOf` | `:65-70` |
| `mayReadAnyOrganization` / `mayUpdateAnyOrganization` | `CanGetOtherOrganizations` or `CanUpdateOtherOrganizations` / only the latter | `:36-41` |
| `visibleOrganizationsWhere(session)` | which organisations a caller can list (§2.1.1) | `:72-86` |
| `memberOrganizationsWhere(session)` | the `mine` filter | `:88-92` |
| `canReadOrganizationSensitiveData(session, id)` | member, or `mayReadAnyOrganization` ([D37](../decisions.md)) | `:94-100` |
| `canManageOrganization(session, id)` | member, or `mayUpdateAnyOrganization` | `:102-107` |

Both read the owner from a **user** session only; an API key or a peer token carries no user and
owns nothing. An API key bound to an organisation ([D36](../decisions.md)) is a member of that
organisation for both functions, and `holdsAcrossOrganizations` is false for it whatever its scopes,
so it never reaches another organisation's events. Neither looks at the publication state: per [D35](../decisions.md) the owner keeps
access once the event is published or validated, because editing writes the draft revision and
publishing still needs `CanPublishEvent`, which ownership never grants.

Note that the two functions scope **differently on purpose**, and this is the one place the port
must not simplify. `editorEventsWhere` is organising-body only; `canModifyEvent` also accepts the
venue's organisation. That asymmetry is deliberate: D3 mails the venue's organisation admins
precisely when the organiser is *not* them, so if `canModifyEvent` were narrowed to match the list,
every validation mail would link to a 403. The venue admin reaches the event **by link, not by
browsing** — which is exactly what BKa does, where the admin list (`org ∪ proposer`) and the edit
voter (`own ∪ org ∪ place-org ∪ proposer`) disagree by that same branch
(`research/bka-06-security-auth-roles.md:453`, which found *five* different definitions of "my
event" across BKa's five implementations).

An organiser therefore sees **only their own organisation's events, plus the ones they own**, in the
editor — matching BKa, where `LIST_OWN_EVENTS_ONLY=true` lists `org ∪ proposer` in production. A
user with no membership, no events of their own and no cross-organisation permission sees an empty
list, and the empty state must say why rather than implying the agenda is empty.

Per-record checks live in **service bodies**, following the nearest existing pattern
(`comment.service.ts`: load, compare, throw `NotAuthorisedError`). The rule is tested once against
the builder rather than once per resolver.

### 3.3 Membership on the session

`editorEventsWhere` needs `session.organizationIds`, so membership must be loaded with the
session rather than fetched per check. **Built:** `UserSession.organizationIds`
(`libs/authentication/api/src/lib/auth-session.ts:22`) comes from a join on
`events.organizations.members` in the same query that loads the session's user
(`authentication.service.ts:52-83`). The organisation service invalidates the cached session when
membership changes (`SessionCacheInvalidator`, `libs/authentication/api/src/lib/session-cache.ts`; called from `organization.service.ts`).

That is a cost paid on **every** authenticated request, including the ~19 tenants with no agenda.
It is one indexed lookup returning a handful of ids, and it is cached for the session's lifetime —
but it is a shared-path change, so it needs a benchmark rather than an assumption.

### 3.4 Validation is publishing, not a workflow

Per [D3](../decisions.md): there is no approval state machine. Validating an event *is* publishing
a draft that belongs to another organisation, which `publishEvent` already does — gated by
`CanUpdateOtherOrganizationEvents` when the actor is not a member of the owning organisation.

The queue is a query, not a table: drafts where `reviewRequestedAt IS NOT NULL`, ordered oldest
first, scoped by `editorEventsWhere`.

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
weekDays            at least one when scheduleType = Weekly      (D38)
weekDays            each an integer 1–7, no repeats              (D43)
last date           on or before the Zurich day two years on     (D15, D40)
ticketingUrl        scheme in {http, https, mailto, tel}
geo coordinates     both latitude and longitude, or neither
zip                 ≤ 4 characters
```

Two deserve comment.

**The description limit is measured after stripping.** BKa counts characters of *text*, not of
markup, so a 6,400-character limit on the raw HTML would reject content BKa accepts. With blocks
([design 1](01-data-model.md) §7) the equivalent is the concatenated text of the richtext nodes.

**The two-year cap is the validation form of [D15](../decisions.md).** It is checked at save time
against the latest date the schedule describes, so a draft that sits for a year is re-checked when
it is finally published rather than grandfathered in.

The schedule rules are built in `libs/event/schedule`: `validateScheduleInput(schedule, now)`
returns every problem it finds as `'MissingWeekDays'`, `'InvalidWeekDays'` and/or
`'BeyondScheduleHorizon'` (`libs/event/schedule/src/lib/schedule-input.ts:4-28`), and the event
mutations turn each code into a `BadRequestException`. Nothing calls it yet, because the mutations
do not exist. The horizon counts whole days ([D40](../decisions.md)): `scheduleHorizon(now)` is the
last millisecond of `lastSchedulableDay(now)`, today's Zurich date two years on
(`schedule-horizon.ts:19-41`), so an evening date on that day is accepted whatever the time of the
save, and an end at 00:00 the next day is not.

---

## 5. Occurrence expansion

One function, three inputs, one output — the heart of the agenda.

Built in `libs/event/schedule` (`libs/event/schedule/src/lib/expand-occurrences.ts:100-115`). It
reads the schedule fields of the **entity** ([D24](../decisions.md)), passed as a plain value rather
than a Prisma row (`event-schedule.ts:3-25`):

```ts
expandOccurrences(schedule: EventSchedule): ExpandedOccurrence[]

type EventSchedule = {
  scheduleType: 'Continuous' | 'Weekly' | 'Explicit'
  dateFrom: Date | null
  dateTo: Date | null
  weekDays: readonly number[]
  openingTime: string | null
  dates: readonly EventScheduleDate[]   // dateFrom, dateTo, openingTime, sortOrder, legacyEventId
}

type ExpandedOccurrence = {
  dateFrom: Date
  dateTo: Date
  openingTime: string | null
  legacyEventId: bigint | null
}
```

- `Continuous` → one occurrence.
- `Weekly` → walk the span, emit on each selected weekday, from `dateFrom`'s wall-clock time to
  `dateTo`'s, ending the next day when the end time is earlier than the start. No weekdays → no
  occurrences ([D38](../decisions.md)). There is no `startTime`/`endTime` ([D39](../decisions.md)).
- `Explicit` → map the stored list, sorted by date.

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

The pure halves of 1–3 are in `libs/event/schedule` (`expand-occurrences.spec.ts`,
`schedule-horizon.spec.ts`, `schedule-input.spec.ts`); the save-time rejection still needs a test on
the mutation.

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
  id         String   @id @default(dbgenerated("uuidv7()"))
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  name      String
  tokenHash String   @unique
  prefix    String
  scopes    String[]

  expiresAt  DateTime  @db.Timestamptz(3)
  revokedAt  DateTime? @db.Timestamptz(3)
  lastUsedAt DateTime? @db.Timestamptz(3)

  createdById String?
  createdBy   User?   @relation(fields: [createdById], references: [id], onDelete: SetNull)

  organizationId String?        // null = platform key, limited by its scopes alone (D36)
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([createdAt])
  @@index([createdById])
  @@index([organizationId])
  @@map("api-tokens.tokens")
}
```

As built (`libs/api/prisma/schema.prisma:316-339`). The base table is on master; `organizationId`
arrives in its own migration, `20261023130000_add_api_token_organization`, kept separate from
`20261023120000_add_event_organizations` ([D44](../decisions.md)).

`ApiTokenStrategy` builds an `ApiTokenSession` — `{ type: ApiToken, id, name, token, permissions,
organizationId }`, where `permissions` are the key's scopes
(`libs/authentication/api/src/lib/auth-session.ts:29-36`, `api-token.strategy.ts:18-28`) — and
`organizationIdsOf` returns its `organizationId`, so §3.2's functions treat a bound key as a member of its
organisation with no separate rule. That is the point of doing it this way: one authorisation rule,
two ways of arriving at it. The key's scopes still gate every resolver through `@Permissions`, so a
bound key can do what its scopes allow, and only inside its organisation
([D36](../decisions.md)).

`createApiToken` takes an optional `organizationId`. A member may bind a key to their own
organisation; any other organisation needs `CanUpdateOtherOrganizations`, the permission that also
guards `addOrganizationMember`. A bound key may not carry any of `CrossOrganizationPermissions`
(`assertMayBindToOrganization`, `api-token.service.ts:221-257`). `ApiToken.organization` is resolved
in `libs/event/api` (`api-token-organization.resolver.ts`), so `libs/api-token/api` does not depend on
the events domain.

A bound key works only while its creator could still bind it. On every request `resolveToken`
checks that the creator is still a member of the key's organisation, or still holds
`CanUpdateOtherOrganizations` through their roles; otherwise the key resolves to nothing, like a
revoked one (`api-token.service.ts:131-154`, `creatorMayStillBind` at `:259-301`). A deleted creator
(`createdById` null) disables the key. Platform keys skip the check. Such a key still lists as
`Active`, and members do not see or revoke their organisation's keys; only the creator and holders
of `CanGetAllApiTokens` / `CanRevokeAllApiTokens` do. Both accepted ([D41](../decisions.md)).

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
| Scope | `publicEventsWhere`, `editorEventsWhere` and `canModifyEvent` for anonymous / owner / member / venue member / cross-org / peer / platform API key / API key bound to an organisation (with and without cross-organisation scopes), as a table |
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
3. ~~**Is `partner` public?**~~ (§2.2) The event filter stays public; what it reveals is accepted
   ([D42](../decisions.md)).
4. ~~**Is the two-year horizon an instant or a whole day?**~~ (§4) Whole day in Europe/Zurich
   ([D40](../decisions.md)).

---

Next: [design 3 — the editor](03-editor.md).
