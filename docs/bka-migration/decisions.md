# BKa → We.Publish port: decision log

Running record of every decision taken while porting the BKa admin backend
(`/Users/itrulia/Documents/insitu-admin`, Symfony 6.4 + API Platform + Doctrine)
into the We.Publish API and editor, replacing the current event implementation.

Research that backs these decisions lives in [`research/`](research/).

---

## D1 — `to_validate` maps to draft, not to a new state

**Context.** BKa events carry two independent status columns. The real production
distribution across 39,978 events:

| `publication_status` | count |
| --- | --- |
| `publish` | 39,692 |
| `to_validate` | 136 |
| `draft` | 150 |

`to_validate` means "waiting for someone to confirm this". We.Publish's revision system
has draft / pending / published, where *pending* means "scheduled for future publication",
so there was no obvious slot for it.

**Decision.** `to_validate` collapses into **draft**. We do not introduce a fourth
publication state.

**Why.** Confirmed by Karl: `to_validate` is draft in practice. Both states are equally
invisible on the website, so collapsing them loses nothing a reader or editor can observe.
What `to_validate` really encoded was not a *state* but a *relationship* — see
[D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state).

**Consequences.**
- `publication_status` maps to We.Publish states as:
  `draft` → draft, `to_validate` → draft, `publish` → published,
  and `publish` with a future `publication_date` → pending (scheduled).
- The data migration folds `to_validate` into draft.
- Transitions that BKa keyed off `to_validate → publish` are re-expressed in terms of
  *who* publishes a draft, not *which* unpublished state it was in. See D3.

---

## D2 — The "propose an event" flow is not ported

> **Superseded by [D32](#d32--the-public-submission-form-stays-it-creates-the-account-first-then-the-event).** The public form stays; it now creates the account before the event.

**Context.** BKa lets an outside organiser submit an event without an account, through a
multi-step public wizard (`src/Controller/ProposeEventController.php`,
`ProposeEventStep1..4Type`, `templates/propose_event/step1..6`). A submission lands as
`publication_status = to_validate` with a row in `event_proposed_by` (5,142 rows), and
with `ACTIVATE_PROPOSAL_PLACE=true` the organiser may also propose a venue, parked in the
separate `place_proposed` table (2,083 rows) rather than becoming a `place`.

**Decision.** None of this is ported. No public submission wizard, no `EventProposedBy`,
no `PlaceProposed`, no `ACTIVATE_PROPOSAL_PLACE` equivalent. Events are created by
authenticated users in the editor, or through the API.

**What replaces it.** Nothing purpose-built. An event that would have been "proposed" is
simply a **draft event that has not been published yet** — the ordinary unpublished state
every article and page already has.

**Why.** Confirmed by Karl: proposed events are being retired and become plain drafts.

**Consequences.**
- Drops from scope: the wizard and its 6 templates, `ProposeEventController`, the
  `EventProposedBy` and `PlaceProposed` entities and their API resources
  (`EventProposedByApi`, `PlaceProposedApi`), and the proposal half of the place model.
- Venue creation becomes an ordinary authenticated action, so a `Place` has a single
  lifecycle instead of two.
- In `EventController::edit` the entire `$event->getProposedBy() !== null` branch
  disappears. The parallel `$event->getUser() !== null` branch — the one that handles
  events owned by a real user — is what we port. **The notification emails survive**; see D3.

---

## D3 — Validation is cross-organisation publishing, not a publication state

> **Updated by [D48](#d48--publishing-stays-with-the-organising-organisation) and [D58](#d58--a-review-request-is-a-state-stamped-once), awaiting Karl's confirmation.** `publishEvent` and `unpublishEvent` need `CanPublishEvent` plus membership of the organising organisation, ownership of an orphan event, or `CanUpdateOtherOrganizationEvents`. A venue member without the last can edit a foreign event but not publish it, and asks for review instead.

**Context.** The email logic in `EventController` (lines ~450-470 for create, ~515-570 for
edit) is not keyed on the proposal wizard. It is keyed on **venue ownership**:

> An event takes place at a `Place`. A `Place` belongs to an `Organization`. Users belong
> to organisations (`user_organization`, 531 rows). If you create or edit an event at a
> venue whose organisation you are **not** a member of, the venue's organisation admins
> are notified, and it is theirs to validate.

Concretely, on create:

```php
if (null === $event->getPlace()->getOrganization()
    || !$user->getOrganizations()->contains($event->getPlace()->getOrganization())) {
    // always: confirm to the creating user
    $this->mailer->newEventCreatedByAnotherOrganizationUser($event, $user);
    // then, to the venue's organisation admins:
    if (TO_VALIDATE === $event->getPublicationStatus()) {
        $this->mailer->newEventCreatedByAnotherOrganizationAdmin($event, $user);
    } else {
        $this->mailer->newEventProposedByPublishedAdmin($event, $user);
    }
}
```

and on edit, `TO_VALIDATE → PUBLISH` performed by someone other than the owner sends
`eventPublished` to the owner. Note the whole edit block is skipped for `ROLE_ADMIN`.

**Decision.** Validation is kept, and modelled as a **permission plus ownership**, not as a
publication state:

- An event is owned by a user and belongs to an organisation.
- Publishing a draft event that belongs to **another** organisation is "validating" it, and
  requires the new cross-organisation permission.
- The notification emails fire on the same real-world transitions, now expressed as
  "a user from another organisation published / edited your draft".

**Why.** Confirmed by Karl: validation still happens, on normal events, and the emails are
still needed. Reading the code shows validation never depended on the wizard — it depends
on the venue's organisation differing from the actor's. That survives D2 untouched, and it
is exactly the capability the new permissions and the Agenda-Admin role are for.

**Consequences.**
- This is the concrete job of the requested permissions ("see, edit and delete another
  organisation's events") and of the **Agenda-Admin** role. Agenda-Admin is the validator.
- The API and editor need the actor's organisation membership available at publish time to
  decide both authorisation and whether to notify.
- `ROLE_ADMIN` currently bypasses all notification. We must decide whether Agenda-Admin
  inherits that silence or notifies like everyone else — see open questions.
- **Six of the eight `admin_event_*` templates survive**, now confirmed in
  [`research/bka-03-emails.md`](research/bka-03-emails.md). The `a`/`b` suffix is the
  recipient: **`a` = the event's owner/creator, `b` = the venue organisation's users** —
  which is D3 restated in the naming scheme.

  | # | Mailer method | Recipient | Trigger | Ported? |
  | --- | --- | --- | --- | --- |
  | 1a | `newEventCreatedByAnotherOrganizationUser` | the creating user | create at a foreign venue | yes |
  | 1b | `newEventCreatedByAnotherOrganizationAdmin` | venue org's users | same create, awaiting validation | yes |
  | 2a | `newEventProposedBy` | guest proposer | propose-event wizard | **no — [D2](#d2--the-propose-an-event-flow-is-not-ported)** |
  | 2b | `newEventProposedByExternalPerson` | venue org's users | propose-event wizard | **no — [D2](#d2--the-propose-an-event-flow-is-not-ported)** |
  | 3a | `eventPublished` | the event's owner | validated → published | yes |
  | 3b | `newEventProposedByPublishedAdmin` | venue org's *other* users | published without validation | yes |
  | 4a | `eventModifiedByOwnerAdminPlace` | the event's owner | edited by someone else | yes |
  | 4b | `eventModifiedByEventOwner` | venue org's users | edited by the owner | yes |

  Only the `2a`/`2b` pair — the wizard's own two — dies with D2. Every remaining template is
  about venue ownership and survives untouched, exactly as D3 predicts.
- **Do not port the templates verbatim.** The research found real defects in the BKa
  overrides: an unreachable "who to contact" block in `3b` (the template tests a `user`
  variable the builder never passes), a sender-locale instead of recipient-locale bug in
  `2a`, hard-coded German strings bypassing the translation keys, and malformed HTML in
  `3a`. These are reproduced faithfully only if we are careless.
- Several of these mail **organisation admins** and **event owners** who are real users, so
  We.Publish's user-centric mail flow fits — but `eventPublished` can target an arbitrary
  address, which is the constraint being checked in
  [`research/wp-02-mail-flow.md`](research/wp-02-mail-flow.md).

---

## D4 — `CanPublishEvent` decides who needs validating

> **Updated by [D66](#d66--the-editor-role-files-and-publishes-its-own-events-agenda-admin-is-a-predefined-role) and [D68](#d68--the-event-tells-the-editor-what-the-caller-may-do-with-it).** Karl decided on 2026-10-24 that the predefined editor role holds `CanPublishEvent` and the other event permissions, scoped to its own organisations' events and the events it owns; only admin and the new `agenda-admin` role hold the cross-organisation permissions. Whether a button shows for a given event comes from `Event.viewerCan`, not from the role alone (awaiting Karl's confirmation).

> **Updated by [D48](#d48--publishing-stays-with-the-organising-organisation), [D49](#d49--deleting-an-event-needs-membership-or-the-cross-organisation-delete-permission) and [D55](#d55--place-writes-reuse-the-organisation-permissions), awaiting Karl's confirmation.** Publishing also needs a link to the event's organisation (`canPublishEvent`); deleting needs membership or `CanDeleteOtherOrganizationEvents`, with no owner branch; places have no permissions of their own and reuse `CanUpdateOrganization` / `CanUpdateOtherOrganizations`.

**Context.** [D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state)
keeps validation but models it as cross-organisation publishing. That still leaves the
question of who is subject to it. BKa answered this implicitly — `ROLE_ADMIN` bypassed the
whole notification block, everyone else did not — which made "who must be validated" a
side effect of a role check buried in a controller.

**Decision.** Introduce an explicit permission, following the existing convention in
`libs/permissions/src/lib/permissions.ts`:

```ts
export const CanPublishEvent: Permission = {
  id: 'CAN_PUBLISH_EVENT',
  description: 'Allows to publish events without validation',
  deprecated: false,
}
```

Holding `CanPublishEvent` means your events go live directly. Without it, publishing leaves
the event as a draft for someone with the cross-organisation permissions to validate.
**Agenda-Admin holds it**, so Agenda-Admin never needs validating.

**Why.** Confirmed by Karl. Making it a permission rather than a role check means the rule
is declarative, visible in the editor's role UI, and adjustable per medium without code
changes — and it keeps the guard honest: `@Permissions(CanPublishEvent)` instead of an
`isGranted('ROLE_ADMIN')` buried in a branch.

**The events permission set.** Exact names provisional until
[`research/wp-03-permissions-and-roles.md`](research/wp-03-permissions-and-roles.md) lands;
all verbs below (`Get`/`Create`/`Update`/`Delete`/`Publish`) are ones the repo already uses.

| Permission | Grants |
| --- | --- |
| `CanGetEvent` / `CanGetEvents` | Read events |
| `CanCreateEvent` | Create an event for your own organisation |
| `CanUpdateEvent` | Edit your own organisation's events |
| `CanDeleteEvent` | Delete your own organisation's events |
| `CanPublishEvent` | Publish directly, bypassing validation |
| `CanGetOtherOrganizationEvents` | See other organisations' events |
| `CanUpdateOtherOrganizationEvents` | Edit them — this is what validating one is |
| `CanDeleteOtherOrganizationEvents` | Delete them |

**The Agenda-Admin role** gets all eight, plus `CanLoginEditor` and the preview permission,
per the brief.

**Consequences.**
- Resolves the open question about whether Agenda-Admin notifies on validation: it does not
  need validating itself, and when it validates someone else's event the owner is still
  notified (`eventPublished`), because that notification is about the owner, not the actor.
- An ordinary organisation user keeps `CanCreateEvent` / `CanUpdateEvent` but **not**
  `CanPublishEvent`, which reproduces BKa's behaviour without a `to_validate` state.
- The cross-organisation permissions are what make an Agenda-Admin's validation queue
  simply "draft events I can see but do not own".

---

## D5 — "Ready for review" is an explicit action backed by a field on the event

> **Updated by [D69](#d69--a-review-request-can-be-withdrawn) and [D75](#d75--the-review-queue-is-a-filter-a-sort-and-a-dashboard-card-for-whoever-can-publish), awaiting Karl's confirmation.** A request can be withdrawn. The queue is the list's Review requested filter, oldest first, with a dashboard card for everyone who can list events and publish.

> **Updated by [D58](#d58--a-review-request-is-a-state-stamped-once), awaiting Karl's confirmation.** "Cannot publish" means `canPublishEvent` is false for this event, not that the caller lacks `CanPublishEvent`. Asking again keeps the first `reviewRequestedAt`.

**Context.** [D1](#d1--to_validate-maps-to-draft-not-to-a-new-state) folded `to_validate`
into draft, which removed the organiser's only way to say "I am finished, please look at
this". Without it, a validator cannot tell a half-written draft from one that is waiting on
them, and every unpublished event looks identical in the queue.

**Decision.** Add an explicit action rather than reinstating the state.

- A **new field on the event** records the request. Proposed:
  `reviewRequestedAt DateTime?` plus `reviewRequestedById String?`.
- On a **draft** event, a user who does **not** hold
  [`CanPublishEvent`](#d4--canpublishevent-decides-who-needs-validating) sees a
  **"Ready for review"** button. Users who can publish see the normal publish control
  instead — they never need it.
- Pressing it stamps the field and notifies the validators. Once set, the button is
  replaced by the request's status ("Review requested on …") so it reads as state, not as a
  repeatable action.
- Publishing clears the field, so the next edit cycle starts clean.

**Why.** Confirmed by Karl: it should be a button on a draft event, shown when you are not
allowed to publish, and probably a new field. Keeping it off the publication-state enum is
what preserves D1 — draft stays a single state, and "waiting on a validator" becomes an
attribute of the draft rather than a fourth value nobody else needs to understand.

**Why a timestamp rather than a boolean.** Same storage cost, strictly more information:
the validation queue can order oldest-first, and "waiting 3 weeks" becomes answerable
without an audit log.

**Consequences.**
- Gives the Agenda-Admin a real queue: draft events with `reviewRequestedAt` set, ordered by
  age — rather than "every unpublished event I can see", which was the weak point of D4.
- The notification reuses BKa's existing admin-facing mail
  (`newEventCreatedByAnotherOrganizationAdmin` — "something needs validating"), so this adds
  a trigger, not a new template.
- Needs one mutation (`requestEventReview`) guarded so it is only callable on a draft, and
  only by someone who can edit the event but cannot publish it.
- **Placement settled by [D24](#d24--the-revision-carries-what-an-editor-writes-the-event-carries-what-the-event-is).**
  The field sits on the event entity: the queue has to be queryable without joining revisions,
  and a review request is about the event rather than about a particular draft. D24's rule —
  the revision carries prose, the entity carries facts — puts it there on principle, not just
  on convenience.

---

## D6 — Submission provenance is carried over as metadata

> **Superseded by [D8](#d8--former-proposers-become-dormant-user-accounts).** Kept for the
> record. The provenance still survives the migration, but as real user accounts rather than
> as inert metadata.

**Context.** 5,142 `event_proposed_by` rows record who submitted an event through the
retired wizard: name, email, and contact details of the organiser. [D2](#d2--the-propose-an-event-flow-is-not-ported)
drops the wizard, which raised the question of whether this history goes with it.

**Decision.** The provenance is **kept**, as plain metadata on the migrated event — not as a
live relation, and not as a feature. No `EventProposedBy` entity, no API resource, no editor
form. It is a record of where an event came from, nothing more.

**Why.** Confirmed by Karl. The events themselves are migrated, so discarding who submitted
them loses the only answer to "who do we contact about this one" for 5,142 historical events,
at no saving worth having.

**What the data actually is.** `event_proposed_by` is a flat contact record, one row per
submission — not a relation to anything:

| Column | Type | Filled |
| --- | --- | --- |
| `firstname` | `varchar(55)` NOT NULL | 100% |
| `lastname` | `varchar(55)` NOT NULL | 100% |
| `email` | `varchar(155)` NOT NULL | 100% |
| `phone` | `varchar(35)` nullable | 100% in practice |
| `organization` | `varchar(255)` nullable | 100% in practice — **free text**, not a FK |
| `created_at` / `updated_at` | `timestamptz` | 100% |

5,142 rows spanning 2023-12-29 to 2026-05-20, of which 4,288 are linked to an event and 78
are unreferenced. They represent **1,798 distinct people** and 1,641 distinct free-text
organisation strings.

**Consequences.**
- Modelled as metadata on the event rather than its own table, since nothing queries or
  writes it after the migration. The exact shape follows whatever metadata mechanism the port
  adopts for the event (see the design doc).
- The 78 unreferenced rows are dropped.
- **This is the full contact detail — name, email, phone — of 1,798 external people, and it
  has no live purpose after the migration.** Carrying it over means importing that into the
  new system and keeping it indefinitely. Worth a deliberate choice between three options:
  keep everything; keep only the organisation name and date, dropping the personal fields; or
  keep everything but treat it as restricted, not exposed through the API. Defaulting to
  "keep everything, exposed like any other field" is the one option that should not happen by
  accident. Flagged for Karl.
- It must never be echoed into research or documentation. See
  [`research/README.md`](research/README.md).

---

## D7 — ProInfirmis is in scope, and we build against Ginto

> **Updated by [D34](#d34--in-situ-finishes-ginto-before-the-end-of-2026).** In Situ finishes Ginto in the old system before the end of 2026; We.Publish still builds its own integration.

**Context.** `ACTIVATE_PROINFIRMIS=false` in the local compose file, which made it look
optional. It is not: BKa runs the integration in production. Separately, the upstream API is
changing — the ZUERST API (`zuerst.proinfirmis.ch`) **shuts down at the end of 2026** and is
replaced by the Ginto GraphQL API, which BKa already supports behind `ACTIVATE_GINTO`.

**Decision.** The accessibility integration is ported. We implement it **against Ginto**, not
ZUERST, while keeping the legacy numeric pictogram ids in the stored data and the public API.

**Why.** Karl confirmed production uses ProInfirmis and only the local environment disables
it. Building a fresh NestJS integration against an API with a known shutdown date would mean
writing it twice. BKa already proved the shape of the migration: it normalises the Ginto
payload back into the legacy ZUERST form precisely so the stored `pro_infirmis_pictograms`
JSON, the `accessibility_proinfirmis[]` filter and the admin form keep working. We inherit
that normalisation rather than the old transport.

**Consequences.**
- The legacy numeric rating ids are part of BKa's public API contract, so the Ginto string
  `key` → numeric id mapping must be ported with the integration. BKa keeps it in the
  `ginto_rating_legacy_ids` parameter; see
  [`research/bka-07-proinfirmis-ginto.md`](research/bka-07-proinfirmis-ginto.md).
- The API key has arrived and the two High-severity unknowns are now **settled against the live
  API**. Both were real — see [D21](#d21--the-ginto-branch-is-unfinished-the-live-api-settles-its-two-open-questions).
  A filter id is still needed for `entriesByFilter`.
- There is no ZUERST fallback path. If Ginto is unreachable the sync no-ops and the last
  synced data stands, rather than degrading to a dead API.
- The local environment stays disabled by default, as today.

---

## D8 — Former proposers become dormant user accounts

**Context.** [D6](#d6--submission-provenance-is-carried-over-as-metadata) would have imported
1,798 people's names, emails and phone numbers as inert metadata with no live purpose — data
we hold but never use, which is the worst of both worlds.

**Decision.** Instead of metadata, **create real user accounts** for the 1,798 distinct
proposers and attach their historical events to them.

| BKa field | Becomes |
| --- | --- |
| `firstname` | `User.firstName` |
| `lastname` | `User.name` |
| `email` | `User.email` (unique — this is the dedupe key, 5,142 rows → 1,798 users) |
| `phone` | `User.properties` (there is no phone field on `User`) |
| `organization` (free text) | `UserAddress.company`, and matched to a real events organisation where it resolves |
| `created_at` | retained as the account's provenance timestamp |

The account is created **dormant**:

- `password` is a cryptographically random value that is **never transmitted to anyone** — it
  exists only because the column is non-nullable, and it is not a usable credential.
- `emailVerifiedAt` and `lastLogin` stay null.
- **No email is sent at migration time.** Nobody is contacted out of the blue.
- The person claims the account whenever they choose, by entering their email in the ordinary
  login-link / password-reset flow. First login is the verification.

**Why.** Karl's suggestion, and it is strictly better than D6. The same data that would have
sat dead in a metadata blob instead becomes an account that gives its owner access to the
events they submitted. It also closes the gap D2 opened: the wizard existed so people without
accounts could submit events, and the answer to "what replaces it" is now simply *they have
accounts*.

**Why dormant rather than invited.** These people submitted an event to a cultural agenda;
they did not ask to be given a login. Creating the account silently and letting them claim it
means nobody receives mail they did not ask for, while the data stops being an orphan: there
is now an account to delete, export, or correct on request, which inert rows in a provenance
table do not give you.

**Consequences.**
- They get a minimal organiser role: enough to log into the editor and manage their own
  organisation's events, and explicitly **not**
  [`CanPublishEvent`](#d4--canpublishevent-decides-who-needs-validating). Their events
  therefore need validating — which is exactly the class
  [D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state) already
  describes. No special case.
- The 4,288 events with a `proposed_by_id` get their proposer as owner, so ownership-based
  permissions have real data from day one rather than a backfilled guess.
- The 1,641 distinct free-text organisation strings need reconciling against real
  organisations; whatever does not resolve stays as `UserAddress.company` text.
- 78 unreferenced provenance rows still produce an account if the email is new, or merge into
  an existing one.
- **Known conflict with the mail research, and it is the main risk.**
  [`research/wp-02-mail-flow.md`](research/wp-02-mail-flow.md) explicitly considers and
  *rejects* creating shadow `User` rows for proposers, because they would pollute `users`, the
  manual-send audiences (`allUsers` would mail 1,500 strangers), the Mailchimp contact sync, and
  the login system. D8 does it anyway, on the grounds that the alternative — holding the same
  personal data with no account attached to it — is worse. That makes the following mandatory,
  not optional:
  - audit every query that counts or mails "all users" and confirm dormant accounts are excluded
    (`allUsers` audiences, Mailchimp sync, member counts, billing);
  - decide the exclusion predicate deliberately — most likely `emailVerifiedAt IS NULL` combined
    with `lastLogin IS NULL`, rather than `active`, which may carry other meaning;
  - verify no onboarding or lifecycle mail fires on user creation.
  If that audit shows the blast radius is wider than expected, the fallback is wp-02's preference:
  keep the provenance as metadata (the superseded [D6](#d6--submission-provenance-is-carried-over-as-metadata))
  and create accounts lazily, on first claim.

---

## D9 — The `events.` table prefix uses the existing dotted `@@map` convention

> **As built ([D65](#d65--one-migration-replaces-the-old-event-tables-in-place)).** The old `events.tagged-events` table is dropped and created again under the same name, against `events.events`.

**Context.** The brief asks for new tables grouped under an `events` prefix, like
`events.organizations`. The obvious reading is a PostgreSQL schema, which would mean enabling
Prisma's `multiSchema` preview feature.

**Decision.** No PostgreSQL schema and no `multiSchema`. Use a **literal table name containing
a dot**, via `@@map("events.organizations")` — because that is already how this repository
names tables.

**Why.** Verified, not assumed: the schema already contains **57** such names, and they are
plain quoted identifiers rather than schemas —
`libs/api/prisma/migrations/20220812113731_init/migration.sql:427` creates
`CREATE TABLE "users.addresses"`. Existing examples include `articles.revisions`,
`articles.revisions.published`, `mail.send_jobs`, `member.plans`, `comments.ratings`,
`notifications.reads` — and, decisively, **`events.tagged-events` already exists**, so the
`events.` prefix is not merely permitted, it is already in the schema.

*(An earlier revision of this entry said 38. That came from a regex that excluded hyphenated
names such as `articles.tagged-articles`; the real count is 57.)*

So the requested grouping is the house style, and it costs nothing: no preview feature, no
migration-tooling changes, no connection-string `?schema=` juggling, and no risk to the 38
tables already named this way.

**Consequences.**
- New tables are `events.organizations`, `events.places`, `events.occurrences`, and so on.
- Every identifier must be quoted in raw SQL, exactly as the existing dotted tables already
  require.
- `events.tagged-events` belongs to the **old** event implementation being deleted, so the name
  is reused rather than shared. Worth not tripping over during the migration.
- This is independent of the multi-file schema question (whether to use `prismaSchemaFolder`),
  which [`research/wp-06-prisma-conventions.md`](research/wp-06-prisma-conventions.md) is
  still testing.

---

## D10 — Occurrences belong to the entity; the recurrence rule belongs to the revision

> **Partly superseded by [D24](#d24--the-revision-carries-what-an-editor-writes-the-event-carries-what-the-event-is).**
> Occurrences staying entity-scoped still holds. The recurrence *rule* moved to the entity with them.
>
> **Updated by [D45](#d45--occurrences-are-written-whenever-the-schedule-is-saved), awaiting Karl's confirmation.** Occurrences are re-expanded on every save that changes the schedule and re-synced on publish, not only on publish and unpublish. Unpublishing keeps them; the public agenda hides them through `publicEventsWhere`. The expansion timing in the consequences below no longer describes the code.

**Context.** This was the port's central open question. A BKa `mainevent` with a recurrence
materialises 128,489 `event_occurrence` rows, and BKa regenerates **all** of an event's
occurrences on **every save** (`OnFlushEventListener`). Adopting the article revision system
raised the question of whether occurrences hang off the revision or off the event.

**Decision.** Occurrences are **entity-scoped**. The recurrence *rule* lives on the
**revision**; only the materialised expansion is entity-level. Drafts expand **in memory** for
preview and materialise nothing.

**Why.** From [`research/wp-05-revision-publication-system.md`](research/wp-05-revision-publication-system.md) §11:
occurrence volume is driven by the recurrence rule (up to 12,374 rows for a single BKa event)
while revision volume is driven by typing (a revision per edit). Attaching the first to the
second multiplies a 12,000× range by a 120-per-hour range. Nothing in the article system has
that shape — its largest per-revision child set is an author list of three or four rows.

The rule itself is content the editor edits and version history should show, so it stays on the
revision. The expansion is derived state, so it belongs to the entity and must be reproducible.

**Consequences.**
- `events.occurrences` gets `eventId`, `dateFrom`, `dateTo`, FK `ON DELETE CASCADE`, and indexes
  on `(dateFrom)`, `(dateTo)`, `(eventId)`.
- Expansion runs on `publishEvent` / `unpublishEvent`, plus a backfill for the data migration and
  a repair command equivalent to BKa's `EventsCalculateOccurrencesCommand`. A test must assert
  that re-expanding a published event is idempotent.
- **This deliberately differs from BKa**, which re-expands on every save because it has no
  revisions. [`research/bka-04-api-v2-apiplatform.md`](research/bka-04-api-v2-apiplatform.md)
  §19.5 warns that a port must reproduce the on-save behaviour "or the agenda endpoints will go
  stale". That warning does not apply once drafts exist: the public agenda only ever reads
  published state, and publishing is exactly when we re-expand.
- **Open sub-problem — hand-entered dates.** wp-05 reasons entirely in terms of a recurrence
  *rule*, but BKa has a second mechanism: `recurrence = none` on a recurrent schedule means the
  organiser types an arbitrary list of dates, each with its own times. That is the 15,275
  sub-events, and it is not derivable from a rule — it is content, so it must live on the
  revision as an explicit list and be expanded like a rule. The editor has no sortable repeatable
  row component today ([`research/wp-07-editor-architecture.md`](research/wp-07-editor-architecture.md)
  §10.1), so this needs building.
- **Unbounded recurrences need a cap.** 20 BKa events run past 2030, one to 2099. A horizon such
  as `now + 2 years`, re-expanded periodically, avoids BKa's 12,374-row outlier — but reintroduces
  a scheduled job. Product decision, deferred to the design.

---

## D11 — BKa's `member` flag is called `partner`

> **Updated by [D37](#d37--organisations-are-public-their-sensitive-fields-are-not) and [D42](#d42--the-public-event-partner-filter-stays).** `partner` is sensitive organisation data: anonymous callers can neither read it nor filter organisations by it. The public event filter on `partner` stays, and what it reveals is accepted.

**Context.** 279 of BKa's 670 users carry `member = true`. It gates three real behaviours: the
print fields on the event form, the admin-only `/events/members-only` list, and the `member`
search parameter exposed through both public APIs. We.Publish already uses "member" for an
entirely different thing — a paying subscriber, with `member.plans`, `Subscription`, and the
whole membership domain behind it.

**Decision.** Port the flag as **`partner`**.

**Why.** Confirmed by Karl, who preferred it to the interim `bkaMember`. Two unrelated concepts
sharing one word in the same schema is the kind of collision that survives for years and
misleads everyone who meets it second — but `bkaMember` only avoided the collision by naming the
system it came from, which says nothing about what the flag means. `partner` is what these
organisations actually are: affiliated bodies whose events qualify for the print edition. It
describes the domain rather than the migration, so it still reads correctly once BKa is history.

**Consequences.**
- Named `partner` wherever it lands — field, GraphQL, API filter, editor label.
- Explicitly **not** related to `Subscription` or `member.plans`; nothing should join the two.
- The BKa-facing labels ("BKa Mitgliederanlass", "Nur Veranstaltungen von Mitgliedern anzeigen")
  are presentation strings and can keep saying *Mitglied* without the schema doing so.

---

## D12 — No Prisma schema split; the events domain goes in the existing `schema.prisma`

**Context.** The original brief asked to "split the prisma schema for the work you are doing
into a separate file". [`research/wp-06-prisma-conventions.md`](research/wp-06-prisma-conventions.md)
§5 tested this rather than assuming: moving to Prisma's `prismaSchemaFolder` produces an
**empty SQL diff** and a client identical in shape, so it is technically free. The costs are
organisational — a whole-file rename that conflicts with every open branch, three changes to
the Dockerfile, and `migrations.path`, which fails silently if forgotten.

**Decision.** **No split.** The events domain is added as one contiguous block in the existing
`libs/api/prisma/schema.prisma`.

**Why.** Karl's call, reversing the original brief once the trade-off was measured. The split's
only real benefit here was giving the port a file of its own, which is a tidiness win, not a
capability. Against that sits a rename touching every in-flight branch and a silent-failure
trap, for a schema that is large but not unmanageable at 2,352 lines.

**Consequences.**
- The events models — roughly 400-600 lines — go at the bottom of `schema.prisma`, grouped
  together and clearly delimited, so they stay easy to find without a file boundary.
- Table naming still groups them: the `events.` prefix from
  [D9](#d9--the-events-table-prefix-uses-the-existing-dotted-map-convention) does the job the
  file split would have done, and does it in the database where it is more useful.
- The split stays available later as its own commit if the schema becomes unwieldy. It is not
  made harder by deciding against it now.
- The same reasoning applies to the API-token library the brief wanted on a separate schema
  file: it gets its own table prefix, not its own file.

---

## D13 — French content is dropped, not parked

> **Premise corrected by [D33](#d33--bka-has-no-french-content-d13s-premise-is-corrected).** BKa has no French content. The outcome — migrate only `de` — is unchanged.

**Context.** BKa is bilingual de|fr. Content entities store translations in a `labels` JSON
column shaped `{property: {lang: value}}`. The brief put localisation out of scope, which left
the question of what happens to the French values that exist: 3,212 event descriptions, 2,798
image labels, and scattered values on places, organisations, rates and contacts. The data-model
design recommended parking the raw `labels` JSON in a migration-only column on the grounds that
deleting it is irreversible.

**Decision.** **Drop it.** French content is not migrated and no column is kept to hold it. The
`labels` JSON collapses to the German value and nothing else is carried over.

**Why.** Karl's call, overriding the recommendation. The argument for parking it was optionality;
the argument against is that an unused column full of data nothing reads is a liability, not an
asset — it ages, it confuses the next reader, it shows up in exports and backups, and the
"someday" that justifies it rarely arrives. The original BKa database is not being destroyed, so
the French text is not actually unrecoverable: it remains in the source system and in the dumps.
Parking it in the new schema buys very little that a dump does not already provide.

**Consequences.**
- The migration reads only the `de` key from every `labels` JSON and discards the rest.
- No `legacyLabels`, no migration-only column, no commented-out field.
- `ACTIVATE_EVENT_NAME_TRANSLATABLE` is already false in BKa, so names were never translated
  anyway — this affects descriptions, image legends, rate designations, place and organisation
  `about` text, and contact labels.
- Should the agenda ever need French again, it is a new feature built on We.Publish's own
  localisation story, not a revival of BKa's `labels` column. The historical text can be pulled
  from the BKa dump at that point.
- Rows whose `de` key is null or missing need a defined fallback — the migration must report them
  rather than silently writing empty strings.

---

## D14 — Data-model answers: partner, recurrence horizon, shared schema, sub-events

Four questions raised by [design 1](design/01-data-model.md) §14, all confirmed by Karl.

### 14a — `partner` lives on the organisation, not the user

BKa stores `member` on the user (279 of 670). It moves to `Organization`.

Print eligibility is a property of the body running the event, not of whichever person typed it
in. On BKa's model two people maintaining the same organisation can produce differently eligible
events, which is a bug the schema permits rather than a feature. The migration sets
`Organization.partner = true` for every organisation with at least one `member = true` user.

### 14b — Recurrence expansion is capped at two years

*Superseded by [D15](#d15--the-two-year-cap-is-a-validation-rule-not-a-refreshing-window) on the
mechanism. The two-year limit stands; the scheduled refresh does not.*

### 14c — The events tables live in the shared schema

They go in `libs/api/prisma/schema.prisma` alongside everything else, in every tenant's database.

Karl expects other media to adopt the agenda, so this is not BKa-only infrastructure being
imposed on twenty unrelated sites — it is a feature arriving where the next tenant can reach it.
Tables stay empty for anyone not using it, which costs nothing.

### 14d — Sub-events collapse into occurrences

The 15,275 `subevent` rows become `EventDate` rows and occurrences, both on the entity (D24).

Karl asked whether a sub-event is "more like an occurrence than an event". The data says it *is*
one:

| Check | Result |
| --- | --- |
| Occurrences per sub-event | exactly 1.00 (15,275 : 15,275) |
| Occurrences on the parent of an explicit-list event | 1 — its own first date |
| Child occurrences coinciding with a parent occurrence | 30 of 15,275 |
| Children drifted from their parent despite the copy-down | 67 |

The parent's `date_from`/`date_to` hold exactly one span, so a second date had nowhere to go but
another row of the same table — which then inherited an id, a slug, and fourteen fields needing
permanent synchronisation. The 67 drifted children are what that costs. A sub-event is a storage
workaround for a single-span column, not a domain concept.

**Caught while verifying this:** `event_occurrence` has no `opening_time` column, but 2,434
sub-events have one. Collapsing into BKa's occurrence shape unchanged would have silently dropped
door times for ~2,400 dates. `Occurrence` carries `openingTime` in the new model.

**Consequences.** Sub-event ids are addressable in the public v1/v2 API, so the compatibility stub
resolves them through `legacyEventId` carried onto the occurrence. This is the one choice that is
expensive to reverse after data is migrated.

---

## D15 — The two-year cap is a validation rule, not a refreshing window

> **Updated by [D76](#d76--ends-in-n-days-marks-weekly-series-only-in-zurich-calendar-days), awaiting Karl's confirmation.** The editor list marks weekly series whose last date is at most 30 Zurich days away ("Ends in N days") and offers **Extend**, so a series running into the cap does not lapse unseen.

> **Updated by [D38](#d38--a-weekly-schedule-needs-at-least-one-weekday), [D40](#d40--the-two-year-cap-counts-whole-days-in-zurich) and [D43](#d43--weekdays-outside-monday-to-sunday-are-rejected-on-input).** The same input check (`validateScheduleInput`) also rejects a weekly schedule with no weekdays, or with weekday values outside 1–7. The cap counts whole days: the last date may fall anywhere on the Zurich calendar day two years after the save.
>
> **Updated by [D45](#d45--occurrences-are-written-whenever-the-schedule-is-saved), awaiting Karl's confirmation.** Expansion runs on every save that changes the schedule, not once at publish. The cap, the purity and the idempotence are unchanged, and `publishEvent` still re-checks the cap.

**Context.** [D14b](#d14--data-model-answers-partner-recurrence-horizon-shared-schema-sub-events)
capped expansion at `now + 2 years` and accepted a periodic job to extend the window as time
passed. Karl proposed the inverse: **forbid entering dates more than two years ahead**, and let an
organiser who wants more come back and extend the event.

**Decision.** The cap is enforced at **input validation**. An event's last date may not exceed
`now + 2 years` at the time it is saved. Expansion then materialises every date the revision
describes, once, at publish. **No scheduled job, no refreshing window.**

**Why.** Better on three counts.

1. **Expansion stays a pure function of the published revision.** A refreshing window makes it
   time-dependent — re-expanding the same revision a year later would legitimately produce
   different rows, which breaks the idempotence test [D10](#d10--occurrences-belong-to-the-entity-the-recurrence-rule-belongs-to-the-revision)
   depends on. With a validation cap, re-expansion is deterministic forever.
2. **The limit becomes honest.** A refreshing horizon silently truncates: the organiser types
   dates to 2099, the system accepts them, and shows two years without saying so. A validation
   rule refuses at the point of entry, which is where a limit belongs and where it can be
   explained.
3. **No rows appear that nobody typed.** What exists after publish is what the organiser entered.

**Consequences.**
- One validation rule on the event: the last date — `dateTo` for a span or a rule, the latest
  entry for an explicit list — must be within two years of the save.
- Measured at save time, so a draft that sits for a year is re-checked when it is finally
  published rather than grandfathered in.
- Past dates stay valid. The cap is a ceiling, not a window; an event does not become invalid as
  time passes.
- **The editor needs an expiry warning.** The cost of this choice is that an open-ended weekly
  event — a regular club night — needs an organiser back every two years. Expiring silently would
  make the event vanish from the agenda with no signal. The editor surfaces events whose last
  occurrence is approaching; specified in [design 3](design/03-editor.md).
- **The migration must truncate and report.** 20 BKa events run past 2030 and one to 2099. They
  are clipped to the cap and listed in the migration report, never silently shortened.
- The scheduled job [D14b](#d14--data-model-answers-partner-recurrence-horizon-shared-schema-sub-events)
  conceded is no longer needed, so the architecture keeps its property of having none.

---

## D16 — Accent-insensitive search gets a real index

> **Built.** Migration `20261023140000_replace_events_with_agenda` creates `unaccent`, an `IMMUTABLE` wrapper `events_unaccent(text)` and the GIN index `event_revisions_search_trgm_idx` on the revision's name and `descriptionText`. The query uses the same text (`EVENT_SEARCH_EXPRESSION`, `libs/event/api/src/lib/event-search.ts:9`). `event-search.db.spec.ts` runs it against a real database, including the unaccented-finds-accented test. The searched text is `EventRevision.descriptionText` ([D51](#d51--the-revision-keeps-its-description-as-plain-text-for-search)), and `unaccent` in the `public` schema is a deployment prerequisite on every tenant database ([D65](#d65--one-migration-replaces-the-old-event-tables-in-place)).

**Context.** BKa's event search is `unaccent()` + `ILIKE '%…%'` across the event name and
description, with no index. Bernese venue and production names are full of accents, so a search
for `theatre` must find *Théâtre* — the accent folding is not optional. We.Publish offers only
German `to_tsvector` raw SQL and GIN trigram indexes on slugs; nothing accent-insensitive.

**Decision.** Port the behaviour and **add the index BKa never had**: enable the `unaccent`
extension in a migration, and create a GIN trigram index over the unaccented searched columns.

**Why.** Karl's call to do it properly. `ILIKE '%…%'` is a leading-wildcard match, so without a
trigram index it is a sequential scan over ~25,000 event rows — on every keystroke of a
type-ahead. BKa gets away with it on a smaller working set and a slower UI; reproducing the
query without the index would be porting the bug along with the feature.

**Consequences.**
- A migration enables `unaccent` and `pg_trgm` and creates the index. Both are standard
  PostgreSQL extensions and need superuser at creation time — a deployment prerequisite worth
  confirming against the managed database before the migration ships.
- The index must be built on the **same expression** the query uses, or it will not be used. An
  `EXPLAIN` in review is the cheapest way to be sure.
- `unaccent()` is not immutable by default, which blocks indexing it directly; the usual remedy
  is an immutable wrapper function. This is the detail most likely to go wrong, so it gets a test
  asserting that a search for an unaccented term finds an accented row.

---

## D17 — BCC is a per-template setting, not a global environment variable

**Context.** BKa copies `MAILER_BCC_ADDRESS` onto **every** outbound notification. It is set once
in the environment, applies to all eight templates, and is invisible to anyone reading the
application.

**Decision.** Do not port the global variable. Add a nullable **`bccAddress` on `MailTemplate`**,
editable in the editor beside the subject and body.

**Why.** Karl's suggestion. A silent global BCC on every message is a surveillance default: it
copies an unrelated address on mail to people who cannot see that it is happening, and nothing in
the application discloses it. Per-template makes it a deliberate, visible choice — an operator who
wants a copy of "an event needs validating" can have one without also copying every message to an
organiser.

It also fits where the rest of this work is going. The templates become editor-editable anyway, so
the recipient configuration belongs in the same place as the content rather than in a deploy-time
variable nobody edits.

**Consequences.**
- `MailTemplate` gains `bccAddress String?`. Null means no BCC, which is the default for every
  template — the behaviour change from BKa is deliberate and should be called out at cutover.
- The editor exposes it on the template form, with help text saying plainly that the recipient
  will not see it.
- The mail service reads it per send rather than from configuration.
- Applies to all templates, not only the agenda's — this is a general improvement that the port
  happens to be the occasion for.

---

## D18 — Mail with no user recipient is skipped, and the gap is shown in the editor

**Context.** Three of the six surviving BKa templates
([D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state)) address "the
users of the venue's organisation", and fall back to a configured reply-to address when that
organisation has **no users at all**. We.Publish cannot log such a send: `MailLog.recipientID` is
a **NOT NULL foreign key to `users(id)`**, and a bare address is not a user row.

**Decision.** **Skip the send.** No mail goes to a fallback address. Instead, an organisation with
no members is surfaced as a problem in the editor.

**Why.** Karl's call. The alternative — making `recipientID` nullable and adding a
`recipientEmail` column — touches a shared table that every mail in the system writes to, in order
to support a case that exists only because BKa had nowhere else to put these people.
[D8](#d8--former-proposers-become-dormant-user-accounts) removes most of that reason by giving
former proposers real accounts.

It is also the better behaviour on its own terms. BKa's fallback quietly redirects mail about an
organisation to whoever happens to be on the reply-to address; nobody learns that the organisation
is unmaintained, so it stays unmaintained. Making the gap visible fixes the actual problem rather
than papering over it with a redirect.

**Consequences.**
- The mail service resolves recipients to user rows. An empty set means no send — not an error,
  and not a fallback.
- The editor shows organisations with zero members as needing attention, so the condition is
  discoverable rather than silent. Specified in [design 3](design/03-editor.md).
- `MailLog` keeps its NOT NULL constraint, and no shared mail schema changes.
- A skipped send should still be observable — it is a condition worth seeing in logs, not a
  silent no-op, or we have replaced one invisible behaviour with another.
- **The gap is far larger than assumed: 315 of 781 organisations (40%) have no members at all.**
  Measured after the data was re-restored (see the correction note in
  [`research/README.md`](research/README.md)). That makes surfacing it the substantive half of
  this decision rather than a tidy-up — two in five organisations would otherwise silently
  receive no notifications, and nobody would learn why.
- The migration reports the figure at cutover so the backlog is known rather than discovered.

---

## D19 — An organiser sees only their own organisation's events in the editor

> **Updated by [D35](#d35--an-events-owner-reaches-it-without-an-organisation) and [D36](#d36--an-api-key-can-belong-to-one-organisation).** The event's owner also sees and edits their own events, with or without an organisation, and a key bound to an organisation counts as a member of it. The scope functions take any `AuthSession`, not only a `UserSession`.
>
> **Updated by [D46](#d46--editor-mode-needs-the-preview-header-an-event-permission-and-reach), awaiting Karl's confirmation.** A public event query runs in editor mode only with the `preview` header and `CanGetEvent` / `CanGetEvents`, and shows an event's draft only to a caller who can reach that event. A single event in editor mode is looked up with `reachableEventsWhere`, which includes the venue branch.

**Context.** [Design 2](design/02-api.md) §3.2 originally scoped the editor's event list as
"everything published, plus everything my organisation owns":

```ts
return { OR: [ { published: { isNot: null } },
               { organizationId: { in: session.organizationIds } } ] }
```

That let any logged-in organiser browse every other organisation's published events. The open
question was whether that was deliberate — it helps avoid double-booking a venue, but exposes
other people's programming.

**Decision.** **No.** In the editor, a user sees only the events of organisations they belong to.
Seeing anyone else's requires the cross-organisation permissions from
[D4](#d4--canpublishevent-decides-who-needs-validating)
(`CanGetOtherOrganizationEvents` and friends), which the **Agenda-Admin** role carries.

**Why.** Karl's call, and it matches BKa (`LIST_OWN_EVENTS_ONLY=true` in production). An agenda is
a competitive space: unannounced programming is commercially sensitive, and "published on the
public website" is not the same permission as "visible in my colleague-of-nobody admin tool". The
double-booking argument is real but weaker — the venue's own admins can reach their venue's
events, which is where that conflict actually surfaces.

**Confirmed by Karl after review**, in the sentence that settles it: *"it's fine when the admin
backend doesn't show published events to other organisations — you care about editing events
there, not seeing events."* The scoping question and the editing question are simply different
questions, and only the second one has to let the venue's organisation in.

**Precision added after review.** "Can reach" is not "can list", and the difference is load-bearing.
The list is scoped to the organising body only. The venue's organisation enters through
`canModifyEvent`, not `editorEventsWhere`, so a venue admin opens the event from
[D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state)'s mail rather than
by browsing to it. Narrowing `canModifyEvent` to match the list would point every validation mail
at a 403. BKa splits it the same way — its admin list is `org ∪ proposer` while its edit voter is
`own ∪ org ∪ place-org ∪ proposer` (`research/bka-06-security-auth-roles.md:443,453`).

**Consequences — this splits one function into two.** Conflating "what the public may read" with
"what you may manage" was the original mistake. They are different questions:

```ts
/** Public agenda — website and public API. Published events, full stop. */
export const publicEventsWhere = (): Prisma.EventWhereInput =>
  ({ published: { isNot: null } })

/** Editor — what this user may see and manage. */
export const editorEventsWhere = (session: UserSession): Prisma.EventWhereInput =>
  hasPermission(CanGetOtherOrganizationEvents, session.roles)
    ? {}
    : { organizationId: { in: session.organizationIds } }
```

- The public website is unaffected: it reads published events through `publicEventsWhere`.
- A user with no organisation membership and no cross-organisation permission sees an **empty**
  event list in the editor. That is correct, and the empty state must say so clearly rather than
  implying the agenda is empty.
- Venue admins still see events at their venue through their organisation's ownership of the
  venue — the case the double-booking argument cares about.
- The same split applies to organisations and venues: the editor's lists are scoped, the public
  API is not.

---

## D20 — Organisation is optional, and proposed organisations become real ones

> **Updated by [D35](#d35--an-events-owner-reaches-it-without-an-organisation) and [D37](#d37--organisations-are-public-their-sensitive-fields-are-not).** An orphan event is also listed to, and editable by, its owner; it stays invisible to every other organiser. The migration-created mark is `Organization.createdByMigration`, which is sensitive data.
>
> **Updated by [D47](#d47--who-may-set-an-events-organisation-and-owner) and [D48](#d48--publishing-stays-with-the-organising-organisation), awaiting Karl's confirmation.** Only the owner can move an orphan event into an organisation, and only into one they belong to. The owner may publish it if they hold `CanPublishEvent`.

**Context.** 7,576 events (19%) have no `organization_id`. [Design 1](design/01-data-model.md)
made `Event.organizationId` required, because [D19](#d19--an-organiser-sees-only-their-own-organisations-events-in-the-editor)
scopes everything by it — which would have blocked the migration. Profiling the gap:

| Of the 5,026 **mainevents** with no organisation | |
| --- | --- |
| Have a proposer who typed an organisation name | **4,961 (98.7%)** |
| …whose name matches an existing organisation exactly | 464 |
| Covered instead by the venue's organisation | 61 |
| **Truly unresolvable** | **4** |

(The other 2,550 are subevents, which inherit from their parent.)

Those 4,961 events name **1,835 distinct organisations** that mostly do not exist as rows:
1,221 with a single event, 472 with two to five, 142 with six or more, the largest with 132.

**Decision.** Two parts, per Karl.

1. **`Event.organizationId` becomes nullable.** Not every event needs an organisation.
2. **Proposed organisation names become real organisations.** Match an existing organisation
   where the name resolves; otherwise create one.

The recovery chain, in order:

```
subevent                → inherit the parent's organisation
proposer's org name     → match an existing organisation, else create one
venue's organisation    → where no name was given
otherwise               → null
```

**Why.** The alternative — parking everything in a catch-all organisation — quietly breaks
[D8](#d8--former-proposers-become-dormant-user-accounts). Proposers get accounts so they can
manage the events they submitted; but under D19's strict scoping a proposer who is not a member of
the organisation owning their event would log in and see **nothing**. Creating the organisation
they named, with them as its member, is what makes D8 do what it was for.

It is also the more honest representation. These groups *are* organisations in the domain sense —
BKa simply never registered them, because its wizard had no way to. The new model has no such gap.

Nullable rather than a catch-all because an orphan event with no owner is a real state, and a
column that says so is clearer than a sentinel row that pretends otherwise.

**Consequences.**
- `editorEventsWhere` filters `organizationId: { in: session.organizationIds }`, which excludes
  nulls naturally — so an organiser never sees orphan events, and only a holder of
  `CanGetOtherOrganizationEvents` (Agenda-Admin) can. That is the right default and needs no
  special case.
- ~1,835 organisations are created, most with a single event. They are **marked as
  migration-created** so an Agenda-Admin can review, merge and tidy them; 1,221 single-event
  organisations is a long tail worth being able to find.
- Name matching is **exact after normalisation**, never fuzzy. Normalising case, whitespace and
  punctuation only lifts matches from 1,911 to 1,870 distinct names, so fuzzy matching would buy
  little and risks merging two genuinely different groups — which is far harder to undo than
  merging duplicates later.
- The created organisations have no address, region or contact details, all of which are required
  or expected elsewhere. They need sensible empty states rather than fabricated values.
- The editor must handle an event with no organisation without crashing — in the form, in the
  list, and in the notification logic ([D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state)),
  which has nobody to notify for such an event.

---

## D21 — The Ginto branch is unfinished; the live API settles its two open questions

> **Updated by [D34](#d34--in-situ-finishes-ginto-before-the-end-of-2026).** In Situ's finished integration replaces this branch as the reference.

**Context.** The Ginto integration exists on branch `f/lab-insitu-386` — **unfinished work, not
shipped code**, as Karl confirmed. It is still the best starting point we have, so the question is
which parts to carry over. Branch files:
(`GintoHttpClient`, `GintoDataProvider`, `GintoLegacyNormalizer`, `GintoRatingLegacyIdMap`,
`GintoRatingsCommand`). [`research/bka-07-proinfirmis-ginto.md`](research/bka-07-proinfirmis-ginto.md)
§14 rated two discrepancies **High** but could not verify either without a key. With the key, both
were tested directly against `https://api.ginto.guide/graphql`.

Both turned out to be real, which is what you would expect of a branch that has not yet met the
live API. They are recorded here so the port starts from what the API actually does.

**1. The ratings query fails outright.** The branch sends:

```graphql
query AvailableDefaultRatings {
  availableDefaultRatings {
    key
    nameDE: name(locale: DE)   # ← this field does not exist
    ...
  }
}
```

The live API answers:

```
Field 'name' doesn't exist on type 'DefaultAccessibilityRating'
```

GraphQL rejects the **whole document** on an unknown field, so this returns no data at all —
`availableDefaultRatings` comes back empty, the legacy id map cannot be built, and every place
sync writes zero pictograms. Silently, because the branch treats an empty list as "no ratings".

`DefaultAccessibilityRating` has exactly three fields:

| Field | Returns |
| --- | --- |
| `key()` | `String` |
| `description(locale)` | `String` |
| `iconUrl()` | `Url` |

So the localised label is `description(locale: DE)`, not `name(locale: DE)`.

**2. Entry ids are 36-character UUIDs.** Sampled from `allEntries`:

```
f9e71950-b99d-417b-b9ec-1ebf623d7113   len=36
79b89cbf-15a0-4512-b8d1-17abf95b3bd4   len=36
```

BKa stores the fallback in `place.pro_infirmis_id_source`, a **`varchar(24)`** — every id would be
truncated or rejected. The new column is sized for a UUID.

**Decision.** Take the *approach* from the branch — normalising Ginto back to the legacy numeric
pictogram ids ([D7](#d7--proinfirmis-is-in-scope-and-we-build-against-ginto)) is sound and worth
keeping — and correct these two details against the live schema: `description(locale:)` for
labels, and a UUID-sized source-id column.

**Why it matters beyond the two fixes.** The ratings query would have failed on first contact, so
the branch has clearly never run against the live API. Expected for unfinished work — but it means
the rest of it is **unverified against reality** too, and should be read as a design sketch rather
than behaviour to preserve. The 14 live rating keys are:

```
completely_wheelchair_accessible          toilet_completely_wheelchair_accessible
partially_wheelchair_accessible           toilet_partially_wheelchair_accessible
not_wheelchair_accessible                 toilet_not_wheelchair_accessible
parking_completely_wheelchair_accessible  walking_disability_accessible
parking_partially_wheelchair_accessible   visual_disability_services_available
parking_not_wheelchair_accessible         inductive_hearing_aid_available
sign_language_available                   cognitive_disability_services_available
```

The legacy-id map in `GintoRatingLegacyIdMap` must be checked key-by-key against this list before
it is trusted, since the numeric ids are part of BKa's public API contract.

**Consequences.**
- An integration test hits the real API for the ratings query, so a schema change upstream fails
  loudly instead of silently emptying the pictograms.
- A sync that retrieves **zero** ratings is an error, never a quiet no-op. That is the specific
  failure this bug produced.
- **A third bug, found while creating the filter: the source key is wrong.** `.env` ships
  `GINTO_SOURCE_KEY=zuerst`, but the key Ginto actually uses is **`ch.proinfirmis.zuerst`**.
  Sampled live: of 400 entries, the sources seen are `org.openstreetmap` (217), `ch.didok` (13),
  `ch.proinfirmis.zuerst` (8) and a long tail — nothing called plain `zuerst`. With the shipped
  default, matching would find nothing. Same silent-no-op shape as the ratings bug.
- **The filter now exists and is verified.** Created in the Ginto admin for the We.Publish
  organisation, scoped to all **89 ZUERST-derived sources** (so an entry qualifies if it carries
  any legacy ZUERST id), with no category, campaign, verification or detail-level restriction.
  `entriesByFilter` returns **12,238 entries**, each with numeric `originIds` such as `4869` —
  exactly the shape of BKa's `place.pro_infirmis_id_source`.
  The admin's "Entries" column shows 0; that count is not what the API serves, and the API was
  tested directly.
- The key, the filter id and the corrected source key live in `.env.local` in both checkouts —
  never in this repository, which is public.
- **BKa has almost no ProInfirmis data — but that is a statement about BKa, not about the
  feature.** Exactly **1 of 1,369** BKa places carries a ProInfirmis id (`265`). Karl confirms
  other tenants, InSitu in particular, do use it — InSitu runs with `ACTIVATE_PROINFIRMIS=true`
  by default, where BKa's local compose has it off. So this is built as a **first-class,
  multi-tenant integration**, not a BKa courtesy.

  Two practical consequences. The **data migration** carries essentially nothing, so there is no
  import to get right. The **integration** carries everything, so it must be correct on its own
  terms — and all three bugs found above fail **silently**, writing zero pictograms rather than
  erroring. For a tenant whose venues depend on this, silent emptiness is the worst failure mode
  available: the accessibility information simply stops appearing and nobody is told.

  Hence the rule in the consequences above, which matters more for InSitu than for BKa: a sync
  that retrieves zero ratings, or matches zero entries, is an **error**, not a quiet no-op.

---

## D22 — The v1/v2 compatibility stub is required

> **Superseded by [D31](#d31--bkas-old-api-is-switched-off-at-cutover-there-is-no-interim-layer).** There is no stub: BKa's old API is switched off at cutover.

**Context.** [Design 4](design/04-migration.md) §8 left the stub's scope open because nobody knew
whether anything still called the old APIs, and the restored environment has no access logs.

**Decision.** Confirmed by Karl: **multiple clients call v1 and v2.** The stub is built.

**Consequences.**
- It is no longer contingent work — it belongs in the plan with the rest.
- ~~Mounted away from the GraphQL endpoint~~ — superseded by [D26](#d26--the-compatibility-stub-stays-in-the-php-application-and-calls-wepublish): it does not live in We.Publish at all.
- A translation layer only: old route in, ledger lookup, service call, old response shape out.
- **Every endpoint is covered**, not a guessed subset — Karl's instruction, and the surface is
  small enough to make that a real commitment rather than an aspiration:

  | | Surface |
  | --- | --- |
  | **v1** — hand-written controllers | 7 controllers, **19 actions** (11 of them on `/api/v1/events`) |
  | **v2** — API Platform resources | 8 resources, **23 operations** (14 collection, 4 item, 2 POST, 1 PATCH, 2 DELETE) |
  | **Total** | **42 operations** |

  Coverage is therefore enumerable, and the stub gets a checklist rather than a judgement call.
  The v2 side includes four agenda sub-collections that are easy to miss —
  `/events/agenda/organization`, `/events/agenda/place`, `/events/agenda/similar`,
  `/events/agenda/sponsored`.
- Per-call logging with the calling token ([design 4](design/04-migration.md) §8.3) still matters:
  it is what eventually tells us which of the 42 are actually used, and the only way anyone will
  be able to prove the stub is safe to retire.
- **`public/openapi.yaml` is stale** — it documents v1 only (8 paths, 17 operations) and predates
  the v2 surface. Generate it fresh from the running app before using it as the contract.
- ~~The two `Print Import` tokens cannot be migrated (stored hashed)~~ — moot under
  [D26](#d26--the-compatibility-stub-stays-in-the-php-application-and-calls-wepublish): the PHP app
  keeps its own token table, so they keep working untouched.

---

## D23 — API keys are opaque, hashed, scoped and shown once

> **Updated by [D36](#d36--an-api-key-can-belong-to-one-organisation).** A key can now be bound to one organisation.

**Context.** The brief asks for BKa's API tokens re-implemented as a separate library with its
own table prefix. BKa issues them as **JWTs stored in plaintext** (7 live tokens, ~920 characters
each), re-displayable from the admin forever, inheriting the full permissions of the user who owns
them. We are not porting that design.

**Decision.** Build to current practice instead:

| | Decision | Why |
| --- | --- | --- |
| Format | **Opaque random**, 256 bits, base64url | A JWT is self-verifying so it can only be revoked via a blocklist — and once you consult a database anyway, the JWT buys nothing while costing ~900 bytes per request and exposing its claims to anyone who base64-decodes it. |
| Storage | **SHA-256 hash only** | Treat it like a password: a leaked database must not yield working keys. |
| Hash choice | **SHA-256, not bcrypt/argon2** | The usual advice inverts here. Slow KDFs defend *low-entropy human* passwords; a 256-bit random token has nothing to brute-force, so the slow hash buys no security, costs latency on every API call, and — being salted — cannot be indexed, forcing a table scan per request. |
| Visibility | **Shown once, at creation** | Lost keys are rotated, not recovered. |
| Identification | A stored **prefix** (`wep_` + first 8 chars), non-secret | Lets the editor and the logs name a key without holding the secret. |
| Detectability | A fixed `wep_` prefix | Secret scanners (GitHub push protection and friends) can recognise a leaked key. |
| Authority | **Explicit scopes on the key** | BKa keys inherit their owner's permissions, so a print-import key can do whatever an admin can. Least privilege instead. |
| Lifecycle | `expiresAt`, `revokedAt`, `lastUsedAt` | Revocation is a row update; `lastUsedAt` tells you which keys are dead before you delete them. |
| Transport | `Authorization: Bearer` only | Query strings leak into access logs, referrers and browser history. |

**Consequences.**
- BKa's 7 existing tokens **cannot be migrated** — we never learn their plaintext, and would not
  reuse a JWT anyway. Every consumer is reissued a key at cutover. Two of them are named
  `Print Import` and `Printimport V2`, so that pipeline needs warning.
- `lastUsedAt` must be written **lazily** (throttled, say once a minute per key) or it turns every
  read request into a write.
- Scoping a key to an organisation plugs into the same predicate the user path uses
  ([D19](#d19--an-organiser-sees-only-their-own-organisations-events-in-the-editor)), so one
  authorisation rule serves both.
- Lives in `libs/api-token/api` with the `api-tokens.` table prefix, per the brief and
  [D12](#d12--no-prisma-schema-split-the-events-domain-goes-in-the-existing-schemaprisma)
  (prefix, not a separate schema file).

---

## D24 — The revision carries what an editor writes; the event carries what the event *is*

> **Updated by [D39](#d39--the-event-has-no-starttime-or-endtime).** The schedule has no `startTime`/`endTime`. The time of day comes from `dateFrom`/`dateTo`, so "times" in the table below now means `openingTime` only.
>
> **Updated by [D51](#d51--the-revision-keeps-its-description-as-plain-text-for-search) and [D52](#d52--ticketingurl-and-showinprint-are-facts-on-the-event), awaiting Karl's confirmation.** `EventRevision` also stores `descriptionText`, derived from `blocks` for search and the 6,400 rule. `Event` also carries `ticketingUrl` and `showInPrint`.

**Supersedes the second half of [D10](#d10--occurrences-belong-to-the-entity-the-recurrence-rule-belongs-to-the-revision).**

**Context.** The first cut put almost everything on `EventRevision`: name, slug, schedule,
`event_status`, taxonomies, rates, images. Only identity, ownership and the review flag sat on
`Event`. Karl's correction: *"lots of things that are currently in revisions should be on the event
itself. The revision is mostly for the content of the event and less so for the metadata."*

**Decision.** A field lives on the **revision** only if it is prose an editor composes. Everything
that states a present fact about the event — when it happens, where, who runs it, what it costs,
whether it is still on — lives on the **entity** and changes immediately.

| On `Event` | On `EventRevision` |
| --- | --- |
| `slug`, `organizationId`, `placeId`, `ownerId` | `name` |
| `status` (`EventStatus`) | `printDescription` |
| the whole schedule: `scheduleType`, `dateFrom`/`dateTo`, `weekDays`, times, `EventDate[]` | `blocks` |
| `occurrences` | images, via `EventImage` |
| tags (`Tag[]`), `audienceId` | |
| `rates` (`Rate[]`) | |
| the SEO/social set — a deliberate divergence from `ArticleRevision`/`PageRevision`, which version it | |
| `reviewRequestedAt` / `reviewRequestedById` | |
| `legacyId`, `legacyProposedBy` | |

**Why.**

- **Cancelling must not require publishing.** With `event_status` on the revision, marking an event
  cancelled means creating a revision and publishing it. That is the wrong shape for the one field
  whose entire purpose is to be true *right now*.
- **It repairs D10's split brain.** D10 put occurrences on the entity but the recurrence rule on the
  revision, so the expansion's input and output lived in different tables and expansion depended on
  which revision you read. Rule and expansion now sit together.
- **Filtering stops needing a join.** The public agenda filters by tag, audience, region and
  date. On the revision, every filter joins through the published view; on the entity it is a plain
  index.
- **Validation keeps its teeth.** D3/D4 review is about what an organiser *writes*. Prose still goes
  through review; a corrected start time or a cancellation does not, which is what an agenda needs.

**Consequences.**
- `EventRevisionDate` becomes `EventDate`, keyed on `eventId`, mapped `events.events.dates`.
- `EventRevision` shrinks to four content fields plus bookkeeping. This is thinner than
  `ArticleRevision` by design; events carry far less prose than articles.
- The API splits: `updateEvent` for facts, `updateEventContent` for prose. Design 2 §2.3 and
  design 3 §4 are reworked to match.
- **`name` stays on the revision — confirmed, for now.** It is prose, and `ArticleRevision` holds
  `title`. The accepted cost: an organiser who needs validation ([D4](#d4--canpublishevent-decides-who-needs-validating))
  goes through a review cycle to fix a typo in a title. The alternative — name on the entity —
  makes renaming immediate but lets that same organiser publish and then rename to anything.
  Revisit if the review cycle proves annoying in practice.
- Images likewise follow the article precedent and stay on the revision, through the existing
  `EventImage` join (caption, sort order, main flag) rather than a single `imageId`.

---

## D25 — Every table carries `createdAt`; every non-revision table also carries `modifiedAt`

> **As built:** `OrganizationMember` carries `modifiedAt` as well (`libs/api/prisma/schema.prisma:2468-2479`), so it follows the general rule rather than the join-table exception below.

**Context.** The first cut gave timestamps to `Event`, `Organization` and `Video` but not to
`Occurrence`, `EventDate`, `Place`, `Tag`, `EventImage` or `EventRevision`, and gave
`OrganizationMember` only `createdAt`. That was abbreviation in the snippets, not a decision.

**Decision.** Follow the schema's own convention, measured rather than assumed. Of 91 models in
`libs/api/prisma/schema.prisma`:

- **82 carry both** `createdAt` and `modifiedAt` — this is the rule for every entity table.
- **6 carry `createdAt` only**, and three of those are `ArticleRevision`, `PageRevision` and
  `CommentsRevisions`. Revision tables deliberately omit `modifiedAt`, so `EventRevision` does too.
- **3 carry neither** — `ArticleRevisionAuthor` and `ArticleRevisionSocialMediaAuthor` (pure join
  tables) and `PeerProfile`. `OrganizationMember` is a join table but keeps `createdAt`, because
  "member since" is a fact worth having.

Both columns are `@db.Timestamptz(3)`, `createdAt @default(now())`, `modifiedAt @updatedAt`.

---

## D26 — The compatibility stub stays in the PHP application and calls We.Publish

> **Superseded by [D31](#d31--bkas-old-api-is-switched-off-at-cutover-there-is-no-interim-layer).** There is no proxy.

**Resolves the open question "the compatibility stub has no target research, and GraphQL already
occupies `path: 'v1'`". Supersedes the placement bullets in
[D22](#d22--the-v1v2-compatibility-stub-is-required).**

**Context.** [D22](#d22--the-v1v2-compatibility-stub-is-required) settled that the stub is required
and enumerated its 42 operations, but assumed it would be built *inside* We.Publish — which
collided with GraphQL already serving `path: 'v1'` and meant re-implementing 42 legacy response
shapes in Nest.

**Decision.** Karl: *"the stub should live in the php application that then calls the WeP
application."* The BKa Symfony app survives cutover as a **stateless proxy**. Its routes,
controllers, serialisers and token auth stay exactly as they are; only the data layer changes —
Doctrine reads become GraphQL calls to We.Publish.

**Why this is better than building it in Nest.**

- **Response fidelity comes free.** The PHP serialisers already emit the exact bytes clients parse.
  Re-implementing 42 shapes in Nest is 42 chances to get a field name, a date format or a null
  convention subtly wrong, and the clients are the ones who would find out.
- **The new codebase never carries legacy.** `libs/event/legacy-api/` is struck from the plan. No
  REST surface in an otherwise-GraphQL monorepo, no mount-point collision, and no reason to install
  `@nestjs/swagger` or `class-validator`.
- **Retirement is one act.** When the last client moves, the PHP app is switched off. Nothing has
  to be untangled from the new codebase.
- **The Print Import tokens stop being a problem.** D22 flagged that `Print Import` and
  `Printimport V2` are stored hashed and cannot be migrated. They do not need to be: the PHP app
  keeps its own `user_token` table and keeps authenticating its own callers. That pipeline needs no
  new credentials and no advance warning.
- **Per-call logging lands where the caller is known.** §8.3's telemetry stays in PHP, which sees
  the client token. We.Publish would only ever see "the stub".

**Consequences.**

- **The PHP app authenticates to We.Publish with one scoped API key** ([D23](#d23--api-keys-are-opaque-hashed-scoped-and-shown-once)) —
  the first real consumer of that feature. Its scopes are read-mostly plus whatever the two POST,
  one PATCH and two DELETE v2 operations need.
- **We.Publish must support lookup by `legacyId`.** Clients pass BKa's BigInt ids. The entities
  already carry `legacyId`; the GraphQL surface needs filters and single-record lookups on it, or
  the stub is forced to keep the old database alive just to hold the ledger. Design 2 §2 gains
  these. This is what makes the proxy stateless.
- **The BKa database can be retired at cutover**, given the point above. That is the test of whether
  the proxy is really stateless: if anything still reads Doctrine, it is not done.
- **The work is the input side, not the output side.** Each of the 42 actions swaps its Doctrine
  query for a GraphQL call. The output path is untouched.
- **Watch for N+1.** API Platform collections lazily hydrated relations through Doctrine. Ported
  naively, one collection request becomes dozens of GraphQL round trips. Each collection endpoint
  needs a single query with the right selection set, and that is where the real care goes.
- **Someone has to own the PHP app** through the transition — its runtime, its dependencies and its
  deploy target all keep ageing. This is the cost being accepted, and the deprecation date in §8.3
  is what bounds it.

---

## D27 — The events domain ships to every tenant

> **Updated by [D56](#d56--taxonomies-are-read-only-for-now-and-the-sql-migration-seeds-nothing) and [D61](#d61--the-old-editor-event-screens-are-removed-until-slice-f).** The SQL migration seeds no reference data; it arrives with the slice G import or an opt-in seed. Until slice F no tenant has editor event screens, and the predefined editor role lacks `CanGetEvents` and `CanPublishEvent`.

**Resolves the "multi-tenancy" open question.**

**Context.** The new tables land in the Prisma schema shared by roughly 20 tenant sites under
`apps/`. Nobody had decided whether organisations, venues, accessibility data and the events domain
belong to every tenant or only to the agenda sites (BKa, InSitu).

**Decision.** Karl: *"yes do for everyone."* The events domain is part of the platform, not a
per-tenant bolt-on. Every tenant gets the tables.

**Why this is cheap.** An unused table costs a row in `pg_class` and nothing else — no rows, no
queries, no indexes doing work. It is the same bargain the schema already makes: every tenant
carries `polls`, `crowdfundings`, `banners` and `events.tagged-events` whether or not it runs any.
The alternative — a conditional schema — would mean per-tenant migrations, which this repo has
deliberately never had.

**Consequences.**
- One migration, applied everywhere, exactly like every other migration in `libs/api/prisma/migrations`.
- The editor's **Agenda** section is permission-gated ([design 3](design/03-editor.md) §2), so a
  tenant that does not run an agenda simply grants nobody the events permissions and the navigation
  entry never appears. No feature flag is needed to hide it.
- Seed data — the 13 regions, 4 audiences, 7 affiliations ([design 1](design/01-data-model.md) §10.2) —
  is **BKa's**, and seeding it into 20 unrelated tenants would be wrong. The migration seeds
  reference data only for the tenants that run an agenda; everywhere else the tables stay empty.
  This is the one place where "ships to everyone" does not mean "populated for everyone".
- The ~39,978 BKa events import into the BKa tenant's database only. Nothing crosses tenants.

---

## Working agreements

- **Everything in this dossier ships in 2026.** Karl, 2026-10-19.

Not architectural decisions — how the work itself is carried out.

- **Design uses the design skills; implementation uses the MUI skill.** The editor half of
  the *design* is written with `/intent` (UX structure, flows, information architecture),
  `/impeccable` (interface quality, visual hierarchy, states and edge cases) and
  `/material-3` (design language). When it comes to *building* it, `/material-ui-theming` is
  the one that applies — the editor is MUI, while `/material-3` targets Compose, Flutter and
  `@material/web`, so it informs the design language rather than the code. Requested by Karl.
- **Design documents ship as an artifact.** The four design documents (data model, API,
  editor, migration) are written as separate documents and published together as one artifact
  with navigation, so there is a single link to share.
- **Research is redacted.** See [`research/README.md`](research/README.md): aggregate over
  production data, never transcribe it. This repository is public.

---

## D28 — The PHP proxy authenticates with one admin API token, and keeps its own voters

> **Superseded by [D31](#d31--bkas-old-api-is-switched-off-at-cutover-there-is-no-interim-layer).** There is no proxy, so there is no proxy token. Its "`ApiToken` gains no `organizationId`" consequence is reversed by [D36](#d36--an-api-key-can-belong-to-one-organisation).

**Context.** [D26](#d26--the-compatibility-stub-stays-in-the-php-application-and-calls-wepublish)
makes the surviving Symfony app a proxy in front of We.Publish, which made it the busiest caller of
the new API — and nothing in the authorisation model fitted it. `ApiToken` carries no
`organizationId`, and `ApiTokenSession` carries no `roles`
(`libs/authentication/api/src/lib/auth-session.ts`), so any scope predicate typed against
`UserSession` would have excluded the proxy outright.

**Decision.** Karl's call: **the PHP app gets an admin API token that can set whatever it wants.**
Per-caller authorisation stays in the PHP app, where it already lives.

**Why.** It is the only option that does not duplicate BKa's authorisation into We.Publish. The
Symfony app already authenticates its own callers against its own `user_token` table and already
runs the voters — D26 changes only its data layer, so the voters survive cutover untouched. Giving
the proxy an organisation-scoped token instead would mean re-implementing BKa's ownership rules on
the We.Publish side, and those rules are not even self-consistent: the research found **five
different definitions of "my event"** across BKa's five implementations
(`research/bka-06-security-auth-roles.md:453`). Porting that mess is worse than fronting it.

**Consequences.**
- `ApiToken` gains **no** `organizationId`, and `editorEventsWhere` / `canModifyEvent` stay typed
  against `UserSession`. The proxy never passes through them.
- **The proxy becomes the sole enforcement point for every BKa API caller.** A bug there is an
  admin-level bug on We.Publish, not a scoped one. This is the price of the decision and it should
  be stated plainly rather than discovered later.
- The voters now need their ownership facts from We.Publish rather than Doctrine, so the API must
  expose `Event.organizationId` and `Event.place.organizationId`, plus the caller's organisation
  memberships. That is a hard requirement on [design 2](design/02-api.md), not a nicety.
- An admin token bypasses *scoping*, not *validation*. The zod rules in design 2 still apply to
  everything the proxy writes.
- **All BKa traffic is one session, which is already the behaviour.** `ApiTokenStrategy` builds
  the session with `id: apiToken.id` (`libs/api-token/api/src/lib/api-token.strategy.ts:19-24`),
  so a token *is* a single stable session rather than one session per request or per caller. Every
  audit row from the proxy therefore shares one `sessionId`. Karl confirmed this is what is wanted,
  so nothing is built here — it is recorded only so that a later change does not "fix" it into
  per-caller sessions. The token's reach comes from `permissions: apiToken.scopes`, so "can set
  whatever it wants" means a token whose scopes cover the whole event surface.
- **The audit log shows the token, and that is accepted.** `describeActor` records an API-token
  call as `actorType: token` with `userId: null` and only a `tokenName`
  (`libs/audit-log/api/src/lib/audit-log.interceptor.ts:34-42`), so every BKa-originated change
  lands in the audit log as one actor. Karl considered threading the acting user through the
  existing `impersonatedBy` field and **declined** — showing the token is enough. The proxy
  therefore passes no actor, the token branch keeps `impersonatedBy: null`, and no audit-log
  change is in scope. The real per-user history stays in the PHP app, which keeps its own
  `user_token` table and its own logs.

## D29 — The PHP app maps BKa categories to tags by name, and keeps the category table

> **Superseded by [D31](#d31--bkas-old-api-is-switched-off-at-cutover-there-is-no-interim-layer).** With no proxy there is no category mapping; clients move to We.Publish tag ids.

**Context.** BKa's numeric category ids are part of a frozen contract. Clients POST
`"categories": ["/api/v2/categories/1"]` and read a `CategoryApi` — `id`, `label{fr,de}`,
`tag_color`, `hidden`, `children`, `level` — out of the collection endpoint
(`research/bka-04-api-v2-apiplatform.md:559-564`). Making the vocabulary editable We.Publish `Tag`s
left nothing holding the id→tag mapping: `Tag` has no `legacyId`, and
[D26](#d26--the-compatibility-stub-stays-in-the-php-application-and-calls-wepublish) describes the
proxy as stateless.

**Decision.** Karl's call: **the mapping happens in the PHP app, by querying the tags and matching
on names.** `Tag` gains no `legacyId`.

**Why.** It keeps BKa's vocabulary out of the shared schema. A `legacyId` on `Tag` would appear in
every tenant's database to serve one tenant's compatibility shim — exactly the pollution the port
has been avoiding. Name matching is also better defined here than it looks from the outside:
`Tag` carries `@@unique([type, tag])` (`libs/api/prisma/schema.prisma`), so a name is a unique key
within a tag type, not a fuzzy match.

**Why the hierarchy problem evaporates.** `CategoryApi` is hierarchical (`children`, and a `level`
computed as 1 with children / 2 for a leaf with a parent) while `Tag` is flat — which looked like a
blocker. It is not, for two reasons. `children` **is not in any event serialization group**
(`research/bka-04-api-v2-apiplatform.md:798`), so an event payload never carries it. And the PHP
app keeps its own `category` table regardless, so it can serve `GET /api/v2/categories` entirely
from its own data — ids, bilingual labels, colours, `hidden`, hierarchy and all. We.Publish tags
are consulted only for the **event↔category association**, which is flat.

**Consequences.**
- The proxy resolves a category to a tag by name at call time. BKa's `DEFAULT_LOCALE` is `de`, so
  the German label is the matching key; the French label stays a PHP-side display concern.
- Renaming a tag in the editor silently breaks the association for that category until the PHP
  table is updated. This is the accepted cost of not carrying a `legacyId`. It is worth a note in
  the tag editor rather than a schema change.
- `Tag.tag` is nullable, so an unnamed tag is unmappable. The proxy treats a miss as "no such
  category" rather than guessing.
- Categories stay editable in the We.Publish editor as ordinary tags, which was the point of
  routing them through `Tag` in the first place.

## D30 — The agenda lists occurrences; the catalogue lists events

> **Built ([D62](#d62--websites-read-events-by-slug-and-keep-a-lean-list-fragment)).** `agenda` and `events` both exist. Tenant `/event` lists stay on the `events` catalogue for now, pending Karl's confirmation.

**Context.** Keeping the `EventBlock` made the public `Event` type a consumer contract, which
raised a sorting problem: if an event has one `startsAt`, a weekly series running 2023→2026 sorts
under 2023 forever and sinks to the bottom of an ascending agenda. The proposed fixes were all
bad — a time-dependent `nextOccurrenceAt` column that defeats the response cache, or accepting
the mis-sort.

**Decision.** Neither. **Ship both list shapes, because BKa ships both.** Karl's instruction —
*"you can disregard what the old event does"* — is what surfaced this: the problem was an artefact
of reasoning from We.Publish's old flat event instead of from BKa.

| Query | Returns | Ordered by | Question it answers |
| --- | --- | --- | --- |
| `events` | one row per **event** | `firstDateAt` | "this organiser's productions" |
| `agenda` | one row per **occurrence** | `occurrence.dateFrom` | "what is on this week" |

This mirrors `GET /api/v2/events` (`event.dateFrom ASC`) and `GET /api/v2/events/agenda`
(one member **per occurrence**, `occurrence.dateFrom ASC`) exactly
(`research/bka-04-api-v2-apiplatform.md:296-297`).

**Why.** A recurring series genuinely *is* many things in a calendar and one thing in a catalogue.
BKa never had the sorting problem because it never asked an event to carry a single agenda
position. Copying that costs one extra query and removes a column, a cache hazard and a false
choice.

**Consequences.**
- `firstDateAt` / `lastDateAt` keep a narrower job: they back the compatibility scalars
  `Event.startsAt` / `Event.endsAt` that the `EventBlock` and teasers read, and they order the
  `events` catalogue. They do **not** back the agenda.
- No `nextOccurrenceAt`, and no `EventSort.NextOccurrence`.
- The agenda needs `PaginatedOccurrences` and cursor pagination over `occurrence.dateFrom`.
- The existing date filters already match occurrences (design 2 §2), so the filter surface is
  shared between the two queries and only the projection differs.

---

## D31 — BKa's old API is switched off at cutover; there is no interim layer

> **Updated by [D36](#d36--an-api-key-can-belong-to-one-organisation).** The We.Publish API key a client receives can be bound to that client's organisation.

Supersedes [D22](#d22--the-v1v2-compatibility-stub-is-required),
[D26](#d26--the-compatibility-stub-stays-in-the-php-application-and-calls-wepublish),
[D28](#d28--the-php-proxy-authenticates-with-one-admin-api-token-and-keeps-its-own-voters) and
[D29](#d29--the-php-app-maps-bka-categories-to-tags-by-name-and-keeps-the-category-table).

**Context.** D22 required a compatibility stub for BKa's 42 v1/v2 operations. D26 placed it in the
Symfony app as a stateless proxy in front of We.Publish, D28 gave that proxy an admin API token, and
D29 had it map BKa categories to tags by name.

**Decision.** Karl, 2026-10-19: **no interim version.** When BKa migrates, its v1/v2 API is switched
off. In Situ's API, served by the same Symfony codebase, stays on.

**What it removes.** The Symfony app drops out of BKa's future entirely: no proxy to own and keep
patched, no admin token whose holder becomes the sole enforcement point (D28), no name-based category
mapping that breaks on a rename (D29), and no N+1 work porting 42 collection endpoints.

**Consequences.**
- Every client of BKa's old API must move to the We.Publish GraphQL API before cutover. They
  authenticate with We.Publish API keys ([D23](#d23--api-keys-are-opaque-hashed-scoped-and-shown-once)).
- Which clients are still active is unknown: four OAuth clients are registered (by name the BKa
  website, the Guidle event exchange, a venue and an agency) plus the two `Print Import` tokens, and
  the restored environment has no access logs. **All of them have to be told before cutover.**
- The `Print Import` tokens are stored hashed and cannot be migrated — D22's original note applies
  again. The print pipeline needs new credentials and advance warning.
- A client moving off v2 needs a We.Publish equivalent for each operation it uses. `agenda`
  ([D30](#d30--the-agenda-lists-occurrences-the-catalogue-lists-events)) covers
  `/events/agenda`, and the event filters cover the organisation and place sub-collections.
  `/events/agenda/similar` has no equivalent in [design 2](design/02-api.md).
- The `…ByLegacyId` queries in design 2 existed only for the proxy and are dropped. Old sub-event
  ids and old slugs no longer need to resolve after cutover ([design 1](design/01-data-model.md)
  §4.4, §6.2).
- The id ledger ([design 4](design/04-migration.md) §2) becomes migration-only: it keeps the
  migration re-runnable and can be dropped once the cutover is verified.
- Switching BKa off must not touch In Situ, which runs on the same codebase.
- D7 kept the legacy numeric ProInfirmis pictogram ids because they were part of BKa's public
  contract. That reason is gone for BKa; whether the ids are still wanted is an open question below.

---

## D32 — The public submission form stays: it creates the account first, then the event

Supersedes [D2](#d2--the-propose-an-event-flow-is-not-ported).

**Context.** D2 retired BKa's public "propose an event" wizard and treated a proposal as a plain
draft created by an authenticated user.

**Decision.** Karl, 2026-10-19: **the public form still exists.** It creates an account for the
submitter, as the form already does today; only the order changes. The account is created first,
then the event — instead of the event first, then the account.

**Consequences.**
- A submission is an ordinary draft owned by a real user from the moment it exists. There is still
  no `EventProposedBy` entity and no provenance metadata; that part of D2 stands.
- [D8](#d8--former-proposers-become-dormant-user-accounts) still covers the historical proposers.
  New submitters get their account through the form.
- Following D8, a submitter's account has the minimal organiser role without `CanPublishEvent`, so
  the submission needs validating ([D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state)).
- Open: whether the form can still propose a venue (`PlaceProposed`, 2,083 rows), where the form
  lives, and which mails it sends. Listed below.

---

## D33 — BKa has no French content; D13's premise is corrected

**Context.** [D13](#d13--french-content-is-dropped-not-parked) dropped French content, citing 3,212
French event descriptions and 2,798 French image labels in the restored BKa database.

**Correction.** Karl, 2026-10-19: **BKa had no French texts.**

**Consequences.**
- D13's outcome is unchanged — the migration reads only `de` — but nothing is being taken away
  from BKa.
- The `fr` values counted in the restore still exist somewhere. `migrate-bka analyze` should
  establish where they come from (for example In Situ data, or values that were never shown) before
  the migration report quotes those numbers.
- Design 4 §9 no longer gives French content as a reason to keep the old database readable.

---

## D34 — In Situ finishes Ginto before the end of 2026

Updates [D7](#d7--proinfirmis-is-in-scope-and-we-build-against-ginto) and
[D21](#d21--the-ginto-branch-is-unfinished-the-live-api-settles-its-two-open-questions).

**Decision.** Karl, 2026-10-19: **In Situ completes the Ginto integration in the shared Symfony app
before ZUERST shuts down at the end of 2026.**

**Consequences.**
- BKa's accessibility data keeps syncing in the old system until cutover, so there is no gap.
- We.Publish still builds its own Ginto integration (D7 stands); the old app's integration does not
  come along.
- In Situ's finished integration replaces the unfinished branch `f/lab-insitu-386` as the
  reference D21 used. The three defects D21 found should be checked against it.

---

## D35 — An event's owner reaches it without an organisation

> **Updated by [D92](#d92--only-the-events-owner-may-take-it-out-of-every-organisation), awaiting Karl's confirmation.** An owner who is also a member may take the event out of every organisation; a member who does not own it may not.

> **Updated by [D47](#d47--who-may-set-an-events-organisation-and-owner), [D48](#d48--publishing-stays-with-the-organising-organisation) and [D49](#d49--deleting-an-event-needs-membership-or-the-cross-organisation-delete-permission), awaiting Karl's confirmation.** The open item below is answered by D47. The owner of an orphan event may publish it with `CanPublishEvent` (D48), and owners cannot delete their events (D49).

Updates [D19](#d19--an-organiser-sees-only-their-own-organisations-events-in-the-editor) and
[D20](#d20--organisation-is-optional-and-proposed-organisations-become-real-ones).

**Context.** [D32](#d32--the-public-submission-form-stays-it-creates-the-account-first-then-the-event)
keeps the public form: it creates the account, then a draft owned by that account. D19 scopes the
editor by organisation only, so a submitter who belongs to no organisation would log in and see
nothing, and could not edit the event they just submitted. D20 names that failure as the reason not
to park events in a catch-all organisation, but its fix (create the organisation the proposer named)
only covers migrated proposers who typed a name.

**Decision.** Karl, 2026-10-23: **the owner (`Event.ownerId`) can list and edit their own events,
with or without an organisation.**

- `editorEventsWhere` is `organisation ∪ owner`; `canModifyEvent` is
  `owner ∪ organisation ∪ venue organisation ∪ CanUpdateOtherOrganizationEvents`
  (`libs/event/api/src/lib/event-scope.ts:163-178,209-213`).
- "Owner" means a **user** session whose user id equals `ownerId` (`isEventOwner`,
  `event-scope.ts:57-61`). API keys and peer tokens own nothing: their sessions carry no user, so a token id that happens to equal an `ownerId` matches
  nothing. ~~API keys own nothing~~ Superseded by [D94](#d94--an-api-key-acts-as-the-user-who-created-it): a key acts as its creator.
- D20 still holds for everyone else: an orphan event (no organisation) is listed only to its owner
  and to holders of `CanGetOtherOrganizationEvents`, and editable only by its owner, its venue's
  organisation and holders of `CanUpdateOtherOrganizationEvents`.

**Owner rights survive publication and validation.** `canModifyEvent` does not look at the
publication state, on purpose:

- Editing is not publishing. Prose lands in the draft revision
  ([D24](#d24--the-revision-carries-what-an-editor-writes-the-event-carries-what-the-event-is)), and
  publishing it needs `CanPublishEvent` ([D4](#d4--canpublishevent-decides-who-needs-validating)).
  Ownership never grants that permission, and a submitter's role does not hold it
  ([D8](#d8--former-proposers-become-dormant-user-accounts), D32), so every change an owner makes to
  a validated event goes back through validation. The scope module has no publish check; it stays
  on the publish mutation (design 2 §3.4).
- BKa does the same. Its edit voter's `own` branch ignores the status, and mail `4b`
  (`eventModifiedByEventOwner`, [D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state))
  exists for exactly this case: the owner edits an event the venue has already validated.
- Facts (dates, status, place) take effect on save. That is D24's accepted cost, the same as for an
  organiser without `CanPublishEvent` (design 2 §2.3).
- An owner who cannot publish may call `requestEventReview` (D5), since they can edit the event.

**Consequences.**
- The list matches BKa's `org ∪ proposer` and the edit check gains BKa's `own` branch
  (`research/bka-06-security-auth-roles.md` §6.1).
- ~~**Open for the event service:** who may change `ownerId` and `organizationId` through
  `updateEvent`. Owner-only access must not let an owner move their event into an organisation
  they do not belong to, or hand it to another user. Not decided here.~~ Answered by
  [D47](#d47--who-may-set-an-events-organisation-and-owner), awaiting Karl's confirmation.

---

## D36 — An API key can belong to one organisation

> **Updated by [D41](#d41--an-organisations-api-keys-stay-with-their-creator) and confirmed by [D44](#d44--the-api-key-organisation-keeps-its-own-migration).** Members do not see or revoke the organisation's keys, and a key disabled by its creator leaving still shows as `Active`; both accepted. The column stays in its own migration.

Updates [D23](#d23--api-keys-are-opaque-hashed-scoped-and-shown-once). Replaces the "`ApiToken`
gains no `organizationId`" consequence of
[D28](#d28--the-php-proxy-authenticates-with-one-admin-api-token-and-keeps-its-own-voters), which
[D31](#d31--bkas-old-api-is-switched-off-at-cutover-there-is-no-interim-layer) already superseded.

**Context.** Under D31, BKa's API clients move to the We.Publish GraphQL API with We.Publish API
keys. Two of the four registered OAuth clients are a venue and an agency. A D23 key carries scopes
and nothing else, and the scope module treated every key as belonging to no organisation. So a
venue's key could reach its own events only through a cross-organisation permission, and that
permission reaches every organisation's events.

**Decision.** Karl, 2026-10-23: **API keys are tied to an organisation, so a venue's or agency's key
can only touch its own organisation's events.**

- `ApiToken.organizationId` is a nullable foreign key to `Organization`. A key without one is a
  **platform key** and behaves as before: only its scopes limit it.
- `ApiTokenSession.organizationId` carries it (`libs/authentication/api/src/lib/auth-session.ts:29-36`,
  set in `libs/api-token/api/src/lib/api-token.strategy.ts:18-28`), and `organizationIdsOf` returns
  it (`libs/event/api/src/lib/event-scope.ts:41-52`). The scope module therefore treats a bound key as a member of
  that one organisation, through the same functions the user path uses.
- **Least privilege comes from intersecting the two.** Every right a member exercises goes through a
  resolver guarded by `@Permissions`, and for a key that guard checks the key's scopes. A bound key
  needs both the scope and the organisation. The scope module also **ignores cross-organisation
  permissions on a bound key** (`holdsAcrossOrganizations`, `event-scope.ts:30-32`), so it cannot reach past its
  organisation even if its row somehow carried one.
- **Who may bind a key to which organisation.** `createApiToken(organizationId)` accepts an
  organisation the creator is a member of, or any organisation for a holder of
  `CanUpdateOtherOrganizations`. A bound key gets a member's rights, and granting membership
  (`addOrganizationMember`) is guarded by that same permission. `CanCreateApiToken` alone does not
  count, and neither do the event-level cross-organisation permissions. The organisation must exist
  (`assertMayBindToOrganization`, `libs/api-token/api/src/lib/api-token.service.ts:221-257`).
- **A bound key cannot carry cross-organisation permissions.** Creation refuses any of
  `CrossOrganizationPermissions` (`libs/permissions/src/lib/permissions.ts:1603-1609`) on a bound key and names them. Refusing is
  better than silently ignoring them, because the key's listed scopes then say what it can really
  do. A platform key may still carry them.
- **One membership right has no permission behind it: reading the organisation's sensitive data**
  (`SensitiveDataOrganization`, including `members`). A bound key gets it, as a member does. That
  is accepted: it is the organisation's own data, and the creator could read it.
- **`onDelete: Cascade`.** Deleting an organisation deletes its keys. `SetNull` would silently turn
  an organisation's key into a platform key, which widens it from one organisation to "whatever its
  scopes allow". `Restrict` would make any organisation that ever had a key undeletable, because
  revoking only stamps `revokedAt`. The cost is that the key rows go with the organisation. The
  audit log keeps the key's name, since it stores `tokenName` and has no foreign key to the key.
- The column arrives in its own migration, `20261023130000_add_api_token_organization`, because
  `ApiToken` is already on master.
- **Editor.** The generate panel has an organisation picker. It lists the creator's own
  organisations, or all of them for a holder of `CanUpdateOtherOrganizations`. Once an organisation
  is picked, the panel stops offering cross-organisation permissions and drops any already picked.
  The list shows the key's organisation, or "Platform key".

**Consequences.**
- D35 is unchanged. A bound key owns no events. It cannot create organisations either:
  `createOrganization` refuses a caller with no user and no `CanUpdateOtherOrganizations`.
- A bound key holding `CanDeleteOrganization` can delete its own organisation, and that deletes the
  key.
- **A bound key works only while its creator could still bind it.** `resolveToken`
  (`libs/api-token/api/src/lib/api-token.service.ts:131-154`, via `creatorMayStillBind` at
  `:259-301`) checks, on every request, that the creator is
  still a member of the key's organisation, or still holds `CanUpdateOtherOrganizations` through
  their roles. Otherwise the key resolves to nothing, exactly like a revoked one. So removing a
  member, deleting the creator (`createdById` becomes null) or taking the permission away disables
  their bound keys at once, and re-adding the member brings them back. The row is not touched, so
  nothing is revoked behind anyone's back. The cost is one membership lookup per request for a
  bound key, plus a role lookup when the creator is not a member. Platform keys skip the check and
  still keep the scopes their creator had at creation, as in D23.
- ~~**Open:** the list still reports such a key as `Active`, because `status` only reads `revokedAt`
  and `expiresAt`. And should members of an organisation see and revoke its keys? Today the list
  shows your own keys, or everyone's with `CanGetAllApiTokens`.~~ Settled by [D41](#d41--an-organisations-api-keys-stay-with-their-creator): the
  `Active` status is accepted, and members do not see or revoke the organisation's keys.

---

## D37 — Organisations are public; their sensitive fields are not

> **Updated by [D72](#d72--organisation-tags-affiliations-and-contacts-are-public-and-written-through-the-organisation), awaiting Karl's confirmation.** Tags, affiliations and contacts are public fields of `BaseOrganization`.
>
> **Updated by [D42](#d42--the-public-event-partner-filter-stays).** The public `partner` filter on events stays, and revealing partner status through it is accepted. `partner` itself stays sensitive on the organisation.
>
> **Updated by [D54](#d54--places-are-public-and-private-only-narrows-the-venue-picker).** Places get no public/sensitive split: every place field is public, visibility follows the organisation rule, and `private` only narrows which venues an event may be filed at.

Updates [D11](#d11--bkas-member-flag-is-called-partner) and
[D20](#d20--organisation-is-optional-and-proposed-organisations-become-real-ones).

**Context.** The first cut of the organisation module returned one `Organization` type, so a
query either exposed every field or required a login. bka.ch reads organisations without login:
the `/organizations/` page fetches `/api/organizations` anonymously and renders a page per
organisation. But not every column is shown there, and BKa's own APIs keep some fields behind a
login (`research/bka-05-api-v1-legacy.md`, `research/bka-04-api-v2-apiplatform.md` §6.3).

**Decision.** Karl, 2026-10-23: **organisations can be read without login, but not all of their
data is public. Follow the `SensitiveDataUser` pattern.**

- An interface `BaseOrganization` carries the public fields, `Organization` implements it with
  nothing more, and `SensitiveDataOrganization` adds the rest
  (`libs/event/api/src/lib/organization/organization.model.ts:27-107`).

  | Public (`BaseOrganization`) | Sensitive only (`SensitiveDataOrganization`) |
  | --- | --- |
  | `id`, `name`, `slug`, `subTitle`, `about`, `website`, `legalStatus`, `enabled`, `address`, `zip`, `city`, `latitude`, `longitude`, `regionId` | `createdAt`, `modifiedAt`, `partner`, `createdByMigration`, `postOfficeBox`, `members` |

- `organization` and `organizations` are `@Public()` and return `BaseOrganization`
  (`organization.resolver.ts:27-48`). Its `resolveType` picks the type **per row and per caller**
  with `canReadOrganizationSensitiveData` (`libs/event/api/src/lib/event-scope.ts:91-97`): a member
  of that organisation, or a holder of `CanGetOtherOrganizations` or `CanUpdateOtherOrganizations`,
  gets `SensitiveDataOrganization`; everyone else gets `Organization`. API keys go through the same
  check ([D36](#d36--an-api-key-can-belong-to-one-organisation)).
- The writes (`createOrganization`, `updateOrganization`, `deleteOrganization`) return
  `SensitiveDataOrganization` directly (`organization.resolver.ts:50-81`), as the user mutations
  return `SensitiveDataUser`. `members` is resolved by `sensitive-data-organization.resolver.ts`.
- The filters `partner`, `createdByMigration` and `hasMembers` would reveal sensitive values, so
  they need `CanGetOtherOrganizations` or `CanUpdateOtherOrganizations` and otherwise return
  FORBIDDEN (`organization.service.ts:362-379`). Sorting by `CreatedAt`/`ModifiedAt` stays public.
- Anonymous callers see enabled organisations only; a member also sees their own disabled ones; a
  holder of either cross-organisation organisation permission sees all
  (`visibleOrganizationsWhere`, `event-scope.ts:69-83`).
- A new permission, `CanGetOtherOrganizations` (`libs/permissions/src/lib/permissions.ts:793-797`),
  reads the sensitive data without granting any write. The predefined admin role gets it through
  `AllPermissions` (`libs/permissions/api/src/lib/predefined-permissions.ts:16-22`); the editor and
  peer roles do not.

**Why.**
- `SensitiveDataUser` is the house precedent for the same problem, so readers and the codegen
  clients already know the shape.
- One query serves the website, the editor and API keys. A list can mix the caller's own
  organisations with other ones, which is why the type is resolved per row rather than per query.
  The same resolution covers `OrganizationMember.organization` and, later, `Event.organization`.
- The split follows what BKa shows in public, checked on 2026-10-23. The anonymous
  `/api/organizations` list returns `id, slug, name, enabled, sub_title, categories, latitude,
  longitude, labels{about, subTitle}`. Detail pages (79 sampled) render name, categories, address,
  zip and city, region, about, contacts, website, `Aktivitätsstatus` and, on 5 pages, `Rechtsform`
  (legal status). Neither BKa API serialises `member`/`partner`, and `postOfficeBox` appears only in
  the authenticated item groups (v1 `reader`, v2 `Org-I`).
- A read-only permission lets a read-only key (the print pipeline needs `partner`) see the data
  without update rights.

**Consequences.**
- `legalStatus` is public because bka.ch prints it as *Rechtsform*.
- `postOfficeBox` is sensitive on weaker evidence: only 8 of 741 organisations have one, so 79
  sampled pages cannot prove bka.ch never shows it.
- `createdAt`/`modifiedAt` sit on the sensitive type, as they do on `SensitiveDataUser`.
- Changing `partner` or `enabled` needs `CanUpdateOtherOrganizations`; resending the stored values
  is allowed (`assertMayChangePrivilegedFields`, `organization.service.ts:266-280`).
- [D18](#d18--mail-with-no-user-recipient-is-skipped-and-the-gap-is-shown-in-the-editor)'s "No
  members" filter (`hasMembers`) is therefore only available to holders of a cross-organisation
  organisation permission, which the Agenda-Admin is.
- bka.ch also shows categories, images, contacts (phone, email) and assigned places publicly. None
  of these is on `Organization` yet; each needs the same public/sensitive call when it lands.
- ~~**Open:** [design 2](design/02-api.md) §2.2 plans a public `partner` filter on events (BKa's
  public `member` parameter). It would reveal which organisations are partners. Either `partner`
  counts as public and moves to `BaseOrganization`, or the event filter needs the same permission.~~
  Settled by [D42](#d42--the-public-event-partner-filter-stays): the event filter stays public and `partner` stays sensitive here.

---

## D38 — A weekly schedule needs at least one weekday

> **Updated by [D40](#d40--the-two-year-cap-counts-whole-days-in-zurich) and [D43](#d43--weekdays-outside-monday-to-sunday-are-rejected-on-input).** The horizon counts whole Zurich days, and weekday values outside 1–7 (or repeated) are rejected as `'InvalidWeekDays'`.
>
> **Built ([D53](#d53--the-shared-input-rules-live-in-the-schedule-library)).** `createEvent`, `updateEvent` and `duplicateEvent` run `validateScheduleInput` through `eventScheduleProblems` and turn the codes into one `BadRequestException`.

Updates [D15](#d15--the-two-year-cap-is-a-validation-rule-not-a-refreshing-window).

**Context.** BKa stores `recurrence_week_days` as a JSON array, and `[]` is common: 2,855 of the
3,611 non-null values are empty (`research/bka-02-live-data-profile.md:686-692`). A weekly
schedule with no weekdays expands to **no occurrences** (`expandWeekly`,
`libs/event/schedule/src/lib/expand-occurrences.ts:58-60`), so an event saved that way would
publish and then never appear in the agenda, with nothing telling the organiser why.

**Decision.** Karl, 2026-10-23: **reject a weekly schedule with empty `weekDays` on input.** Stored
rows that already have one are tolerated, not crashed on.

- `hasRequiredWeekDays(schedule)` is false only for `scheduleType: 'Weekly'` with no weekdays, and
  `validateScheduleInput(schedule, now)` returns every problem it finds as `'MissingWeekDays'`
  and/or `'BeyondScheduleHorizon'` (`libs/event/schedule/src/lib/schedule-input.ts:4-28`). One
  entry point runs both input checks, so a mutation cannot run one and forget the other.
- `expandOccurrences` is unchanged and still returns `[]` for such a row.

**Why.** An input that the system accepts and then silently turns into nothing is the failure D15
already rejected for dates past the horizon: the limit belongs at the point of entry, where it can
be explained. Expansion stays tolerant so the migration and any old row cannot crash a publish.

**Consequences.**
- ~~Nothing calls `validateScheduleInput` yet. `createEvent`/`updateEvent` must call it and turn each
  code into a `BadRequestException` when the event mutations land.~~ Built: [D53](#d53--the-shared-input-rules-live-in-the-schedule-library).
- The migration imports BKa rows as they are and lists weekly events with no weekdays in its report
  ([design 4](design/04-migration.md) §4.7). How many of the 2,855 empty arrays sit on `week` rows
  rather than `none` rows is for `migrate-bka analyze` to establish.
- The editor's weekly mode needs at least one day ticked before it can save
  ([design 3](design/03-editor.md) §5).
- ~~**Open:** weekday values outside ISO 1–7 (`[0]`, `[8]`) are still accepted and also expand to
  nothing. Reject them too?~~ Yes: [D43](#d43--weekdays-outside-monday-to-sunday-are-rejected-on-input).
- ~~**Open (from D15):** the two-year horizon is measured to the **exact instant**: `scheduleHorizon`
  takes the current Zurich wall-clock time two years ahead
  (`libs/event/schedule/src/lib/schedule-horizon.ts:12-19`), and `isWithinScheduleHorizon` compares
  the last date against it (`:38-45`). So on the horizon day itself an evening date is rejected
  after a morning save. The editor copy in design 3 §5 promises a whole day ("Dates can be set up to
  30 October 2028"). One of the two has to change.~~ Settled by [D40](#d40--the-two-year-cap-counts-whole-days-in-zurich): the API counts the whole day, as the copy does.

---

## D39 — The event has no `startTime` or `endTime`

> **Updated by [D79](#d79--the-date-editor-takes-zurich-wall-clock-dates-and-times-and-never-expands-what-it-cannot-save), awaiting Karl's confirmation.** In the editor an explicit date row whose end time is earlier than its start time also ends on the next day, as a weekly sitting does.

Updates [D24](#d24--the-revision-carries-what-an-editor-writes-the-event-carries-what-the-event-is).

**Context.** [Design 1](design/01-data-model.md) §5 and §6 sketched `startTime String?` and
`endTime String?` on `Event` beside `dateFrom`/`dateTo`. BKa has no such columns: its `event` table
has `date_from` and `date_to` as `timestamptz` and a free-text `opening_time varchar(5)`
(`research/bka-01-data-model.md:388-390`). A timestamp already carries the time of day, so the two
string fields would have been a second, possibly disagreeing, source for it.

**Decision.** Karl, 2026-10-23: **`startTime` and `endTime` go.** He asked whether the times could
generate the dates instead; that is what expansion already does with the times inside `dateFrom` and
`dateTo`:

- `Continuous`: one occurrence from `dateFrom` to `dateTo`.
- `Weekly`: each occurrence starts at `dateFrom`'s Zurich wall-clock time and ends at `dateTo`'s,
  on the next day when the end time is earlier than the start, as for a club night
  (`libs/event/schedule/src/lib/expand-occurrences.ts:53-98`, overnight test at `:63-64`).
- `Explicit`: each `EventDate` carries its own `dateFrom`/`dateTo`.
- `openingTime` stays: it is the door time, an `HH:MM` string, and BKa has it.

**Consequences.**
- The schedule types in `libs/event/schedule` have no time fields besides `openingTime`
  (`libs/event/schedule/src/lib/event-schedule.ts:3-18`), and neither will the Prisma model.
- The editor enters a weekly series' times with its From and To dates rather than in separate time
  fields ([design 3](design/03-editor.md) §5).
- The migration has nothing to map: BKa's times are already inside its timestamps.

---

## D40 — The two-year cap counts whole days in Zurich

Updates [D15](#d15--the-two-year-cap-is-a-validation-rule-not-a-refreshing-window) and closes the
horizon question left open in [D38](#d38--a-weekly-schedule-needs-at-least-one-weekday).

**Context.** `scheduleHorizon` took the current Zurich wall-clock time two years ahead, so the cap
was measured to the instant. On the last allowed day an evening date was refused after a morning
save, while the editor copy in [design 3](design/03-editor.md) §5 names a date ("Dates can be set up
to …"), which reads as the whole day.

**Decision.** Karl, 2026-10-23: **whole day.** The last allowed date is a Zurich calendar day, and
anything on that day is accepted.

- `lastSchedulableDay(now)` returns that day: today's Zurich date, two years on
  (`libs/event/schedule/src/lib/schedule-horizon.ts:19-26`).
- `scheduleHorizon(now)` returns the last millisecond of that day, one millisecond before the next
  Zurich midnight (`schedule-horizon.ts:28-41`). `isWithinScheduleHorizon` still accepts a last date
  at or before it (`:60-67`), unchanged.
- On 23 October 2026 the last allowed day is 23 October 2028, whatever the time of the save. An
  event ending at 20:00 or 23:30 that day is accepted; anything ending on 24 October is refused.
- **Midnight belongs to the next day.** An end at exactly 00:00 on 24 October is refused, so the
  latest end on the last day is 23:59.
- **29 February falls back to 28 February**, as before. Two years after a leap day is never a leap
  year, and the only alternative, 1 March, would allow more than two calendar years and put the
  limit in a different month from the one the editor names. Temporal's default and date-fns
  `addYears` do the same.
- **Clock changes need no special case.** Zurich changes its clocks at 02:00/03:00, so midnight is
  never skipped or doubled; the next midnight minus 1 ms ends a 23-hour or 25-hour day correctly,
  and the offset used is the limit day's, not today's (`schedule-horizon.spec.ts:76-123`).

**Why.** The editor tells an organiser a date, not a time. A limit that refuses part of the day it
names is the kind of hidden rule D15 set out to avoid. The cap stays a ceiling checked at save, so
D15's reasons (pure expansion, an honest limit, no rows nobody typed) all still hold.

**Consequences.**
- The editor message shows `lastSchedulableDay(now)` directly ([design 3](design/03-editor.md) §5).
- **The migration clip must not move a weekly event's end time.** [Design 4](design/04-migration.md)
  §4.7 clips to the API's horizon. `scheduleHorizon` is now 23:59:59.999 Zurich time, and a weekly
  event's `dateTo` carries the end time of every occurrence ([D39](#d39--the-event-has-no-starttime-or-endtime)),
  so clipping `dateTo` to that instant would make every occurrence end at 23:59. The clip should
  move the date to `lastSchedulableDay` and keep the original time of day; settled in detail when
  §4.7 is built.

---

## D41 — An organisation's API keys stay with their creator

Updates [D36](#d36--an-api-key-can-belong-to-one-organisation) and closes both of its open items.

**Context.** D36 binds a key to an organisation and disables it as soon as its creator could no
longer bind it. That left two questions: should the organisation's other members see and revoke
its keys, and is it a problem that such a disabled key still shows as `Active`?

**Decision.** Karl, 2026-10-23:

- **Members of an organisation do not see or revoke its API keys.** The list shows a caller's own
  keys, or every key to a holder of `CanGetAllApiTokens`; revoking works the same way with
  `CanRevokeAllApiTokens` (`libs/api-token/api/src/lib/api-token.resolver.ts:61-64`, `:98-101`).
  Binding a key to an organisation changes what the key can reach, not who manages it.
- **A bound key that stops working because its creator left keeps showing as `Active`.** Accepted.
  `status` reads only `revokedAt` and `expiresAt`, and the row is never touched when the creator
  leaves (D36).

**Why.** Membership already decides what a bound key can do. Letting it also decide who manages the
key would hand every member control of keys someone else created, and their secrets were shown only
to that creator anyway (D23). The status is a fact about the key row; the creator check is a rule
applied per request, and re-adding the member brings the key back without any change to the row.

**Consequences.**
- When a member leaves, the organisation cannot see which keys stopped working. A holder of
  `CanGetAllApiTokens` sees them all and can reissue one for the organisation.
- The editor's key list needs no change ([design 3](design/03-editor.md) §8).

---

## D42 — The public event `partner` filter stays

> **Updated by [D59](#d59--event-filters-match-the-venue-and-false-means-not-flagged), awaiting Karl's confirmation.** `partner: false` matches events whose organisation is not a partner, including events with no organisation.

Updates [D37](#d37--organisations-are-public-their-sensitive-fields-are-not) and closes its open
item. Read with D37's public/sensitive table.

**Context.** D37 keeps `Organization.partner` on `SensitiveDataOrganization` and puts the
organisation filter on it behind `CanGetOtherOrganizations` / `CanUpdateOtherOrganizations`.
[Design 2](design/02-api.md) §2.2 plans a public `partner: Boolean` filter on events, the
successor of BKa's public `member` parameter. Filtering events by it reveals which organisations
are partners, so the two looked contradictory.

**Decision.** Karl, 2026-10-23: **the event filter stays public, as designed, and revealing partner
status through it is accepted.** D37 is otherwise unchanged:

| Surface | Who |
| --- | --- |
| Reading `Organization.partner` | members, and holders of `CanGetOtherOrganizations` / `CanUpdateOtherOrganizations` (D37) |
| Filtering organisations by `partner` | holders of those two permissions (D37) |
| Filtering **events** by `partner` | everyone, without login (this decision) |
| Changing `partner` | holders of `CanUpdateOtherOrganizations` (D37) |

**Why.** BKa's public `member` parameter answers the same question today, so the filter reveals
nothing that is not public already, and its callers keep working. D37 keeps the field off the
public organisation type because neither BKa API serialises it, which is a decision about the
organisation's shape, not a claim that partner status is secret.

**Consequences.**
- `partner` does not move to `BaseOrganization`. A public caller can work out an organisation's
  partner status only from its published events, and only by filtering.
- The event filter's spec carries no permission check ([design 2](design/02-api.md) §2.2).

---

## D43 — Weekdays outside Monday to Sunday are rejected on input

> **Built ([D53](#d53--the-shared-input-rules-live-in-the-schedule-library)).** The event mutations map `'InvalidWeekDays'` to a `BadRequestException` with the other schedule codes.

Updates [D38](#d38--a-weekly-schedule-needs-at-least-one-weekday) and closes its weekday item.

**Context.** D38 rejects an empty weekly `weekDays` on input, but `[0]` or `[8]` passed and also
expanded to nothing.

**Decision.** Karl, 2026-10-23: **reject weekday values outside ISO 1–7 on input.**

- `hasValidWeekDays(schedule)` accepts only whole numbers from 1 to 7 (Monday to Sunday), with no
  repeats (`libs/event/schedule/src/lib/schedule-input.ts:9-17`).
- `validateScheduleInput` reports it as `'InvalidWeekDays'`, between `'MissingWeekDays'` and
  `'BeyondScheduleHorizon'` (`schedule-input.ts:19-28`).
- The check applies to every schedule type. An empty list passes it, because `hasRequiredWeekDays`
  already covers that case.
- **Repeats are rejected too.** Ticking days in the editor can never produce `[1, 1]`, so a repeat
  from an API client points to a bug, and rejecting it keeps the stored arrays tidy.
- **Stored rows are tolerated**, as D38 promised. `expandOccurrences` is unchanged: `[0, 1, 1, 8]`
  gives only the Mondays, once each, and `[0, 8, 1.5]` gives nothing without throwing
  (`libs/event/schedule/src/lib/schedule-input.spec.ts:91-107`).

**Why.** The same reason as D38: a value the system accepts and then silently turns into nothing
belongs refused at the point of entry.

**Consequences.**
- `createEvent`/`updateEvent` map `'InvalidWeekDays'` to a `BadRequestException` alongside the other
  two codes when the event mutations land ([design 2](design/02-api.md) §4).
- The editor's day toggles cannot produce an invalid value, so it needs no new message.

---

## D44 — The API key organisation keeps its own migration

Confirms the migration split stated in [D36](#d36--an-api-key-can-belong-to-one-organisation).

**Decision.** Karl, 2026-10-23: **two migrations.** `ApiToken.organizationId` stays in
`20261023130000_add_api_token_organization` and is not folded into
`20261023120000_add_event_organizations`.

**Why.** `20261023120000` creates the events domain's organisation tables; `20261023130000` changes
`ApiToken`, which is already on master. One migration per topic keeps each reviewable on its own.
The order is fixed by the foreign key: the key's organisation can only be added once
`Organization` exists.

---

## D45 — Occurrences are written whenever the schedule is saved

Updates [D10](#d10--occurrences-belong-to-the-entity-the-recurrence-rule-belongs-to-the-revision) and [D15](#d15--the-two-year-cap-is-a-validation-rule-not-a-refreshing-window), and closes the zero-occurrence gap for scheduled publication
listed under [open questions](#open-questions).

**Status.** Built in `181c71168`. Awaiting Karl's confirmation.

**Context.** D10 and D15 expand occurrences once, at `publishEvent`, and expand drafts in memory.
That was written before [D24](#d24--the-revision-carries-what-an-editor-writes-the-event-carries-what-the-event-is) moved the schedule from the revision to the event. Since D24 a
corrected date is a fact: it takes effect on save and has to reach the public agenda without a
publish ([design 2](design/02-api.md) §2.3). Publish-only expansion also left a gap the log
already recorded: a scheduled publication (`publishEvent` with a future `publishAt`) went live with
no occurrences.

**Decision.** The build expands on every write that changes the schedule.

- `createEvent`, `updateEvent` (when the schedule changes) and `duplicateEvent` call
  `syncOccurrences` inside their write transaction, and `publishEvent` calls it again
  (`libs/event/api/src/lib/event.service.ts:411,518,621,780`).
- `syncOccurrences` compares the stored rows with `expandOccurrences(schedule)` through
  `sameOccurrences`, and deletes and re-inserts only when they differ
  (`libs/event/api/src/lib/event-occurrences.ts:40-70`). A save that does not change the dates
  writes nothing.
- `unpublishEvent` keeps the rows. Public reads of occurrences go through `publicEventsWhere` on the
  event (`event-scope.ts:159-161`), so occurrences of drafts and unpublished events stay invisible.
- `publishEvent` invalidates the `events` cache at once and schedules a second invalidation at
  `publishAt` (`event.service.ts:626-627`). `EventScheduleWatcher` also watches revision
  `publishedAt` in its look-ahead window (`event-schedule.watcher.ts:48-65`), so a restart in
  between does not lose it.

**Why.**
- D24 makes the schedule a fact on the entity, and facts take effect on save. Expanding only at
  publish would have left the agenda on the old date until someone published again.
- Scheduled publication needs no extra job. The rows already exist, and the published view switches
  over when `publishedAt <= now`.
- D15's guarantees hold. Expansion is still a pure function of the schedule (the entity's now, not
  a revision's), so re-expanding is idempotent, and the two-year cap is still a ceiling checked at
  save. `publishEvent` checks it again (`assertWithinHorizon`, `event.service.ts:584`).
- The editor gets real next dates for drafts (design 3) without a second, in-memory expansion path.

**Consequences.**
- This is BKa's on-save behaviour after all. D10's argument against it (the public agenda reads only
  published state, and publishing is when we expand) stopped holding once D24 put the schedule on
  the entity.
- Drafts have occurrence rows. Every public read of occurrences must join `publicEventsWhere`, as
  `getAgenda` does through `createOccurrenceWhere` (`event-filter.ts`).
- `content:events` is a shared cache namespace
  (`libs/kv-ttl-cache/api/src/lib/kv-ttl-cache-shared-namespaces.ts:39`), so a save on one API
  replica clears the cache on all of them.
- Rows written straight to the database, such as the slice G import or a manual fix, invalidate
  nothing. The import has to invalidate `events` when it finishes.
- Still to build in slice G: the migration backfill and the repair command (BKa's
  `EventsCalculateOccurrencesCommand`). Both call `syncOccurrences`.
- If Karl declines, removing the call from the three save paths restores publish-only expansion,
  and the scheduled-publication gap opens again.

---

## D46 — Editor mode needs the preview header, an event permission and reach

> **Updated by [D71](#d71--the-editor-list-filters-by-publication-review-and-last-date-and-lookups-by-id-use-reach), awaiting Karl's confirmation.** `events` and `agenda` with a non-empty `filter.ids` are scoped by `reachableEventsWhere` in editor mode, like a single event, and `draft`, `pending` and `reviewRequested` filters are dropped outside editor mode.

Updates [D19](#d19--an-organiser-sees-only-their-own-organisations-events-in-the-editor).

**Status.** Built in `181c71168` and tightened in `e3dd54e34`. Awaiting Karl's confirmation.

**Context.** `event`, `events` and `agenda` are public queries, and the editor uses them too.
Articles settle the same problem by narrowing public queries to published content unless the
request is a preview (`libs/article/api/src/lib/article.resolver.ts:113-131,234-252`), and the
editor sends the `preview` header on every request (`libs/editor/api/src/lib/setup.tsx:44-57`).
D19 split the public scope from the editor scope but did not say how a request picks one.

**Decision.**
- A request is in **editor mode** when it carries the `preview` header and the caller holds
  `CanGetEvent` (for `event`) or `CanGetEvents` (for `events` and `agenda`)
  (`isEventEditorRequest`, `libs/event/api/src/lib/event-editor-mode.decorator.ts:11-16`).
  `CanPreview` plays no part.
- Editor mode scopes lists with `editorEventsWhere` and a single event with `reachableEventsWhere`,
  which adds the venue's organisation so the link in a validation mail opens
  (`event-scope.ts:180-200`, `event.service.ts:184-191`). Every other request uses
  `publicEventsWhere`.
- The draft view is decided **per event**. `latest`, `name`, `description` and `image` resolve from
  `draft ?? pending ?? published` only in editor mode and only for an event the caller can reach
  (`canReachEvent`, `event-scope.ts:202-207`, through `canReachLoadedEvent`, `event-reach.ts:9-25`).
  Otherwise they resolve from `published`.
- `draft`, `pending`, `ownerId`, `reviewRequestedAt`, `reviewRequestedById` and `legacyId` need
  `CanGetEvent` and reach, checked in the resolver body (`mayReadEditorView`,
  `event.resolver.ts:378-383`), and are null for everyone else.
- `HasOptionalEvent.event`, which teasers use, returns a published event to anyone and an
  unpublished one only to an editor-mode caller who can reach it
  (`has-event/has-event.resolver.ts:50-77`).

**Why.**
- Using the event permissions rather than `CanPreview` lets an organiser role without `CanPreview`
  list its own drafts.
- Deciding per event closes a leak. With the header and `CanGetEvents`, a member of one organisation
  browsing the public agenda would otherwise have seen another organisation's draft names and
  scheduled revisions. `e3dd54e34` fixed it, and `event.resolver.spec.ts` and
  `has-event.resolver.spec.ts` cover foreign members and foreign bound keys.
- `@Permissions` on a `@ResolveField` is metadata only. The app registers no
  `fieldResolverEnhancers`, so the guard never runs for fields, and the check has to sit in the
  resolver body. The fields keep `@Permissions(CanGetEvent)` as documentation.

**Consequences.**
- `reachableEventsWhere` and `canReachEvent` must stay equal to `editorEventsWhere` plus
  `canModifyEvent`. `event-scope.spec.ts` checks that for every session in its table.
- The editor's lists stay organising-body only (D19). The venue's organisation reaches a single
  event by link.
- A new field that exposes unpublished content must go through `displayedRevision` or
  `mayReadEditorView`. `@Permissions` alone does nothing on a field.

---

## D47 — Who may set an event's organisation and owner

> **Updated by [D68](#d68--the-event-tells-the-editor-what-the-caller-may-do-with-it), [D81](#d81--on-a-new-event-the-organisation-picker-offers-your-own-organisations-and-the-owner-is-you) and [D92](#d92--only-the-events-owner-may-take-it-out-of-every-organisation), awaiting Karl's confirmation.** Taking an event out of every organisation needs you to own it, or `CanUpdateOtherOrganizationEvents` (D92). `Event.viewerCan` reports `moveOrganization`, `clearOrganization` and `reassignOwner`, and the editor's pickers follow them.

Updates [D35](#d35--an-events-owner-reaches-it-without-an-organisation) and answers its open item. Updates [D20](#d20--organisation-is-optional-and-proposed-organisations-become-real-ones).

**Status.** Built in `181c71168`. Awaiting Karl's confirmation.

**Context.** D35 lets an event's owner edit it without an organisation, and left open who may change
`organizationId` and `ownerId`. Without a rule, a venue member, who may edit a foreign event
([D19](#d19--an-organiser-sees-only-their-own-organisations-events-in-the-editor)), could move it into their own organisation or make themselves its owner, and so take it
over.

**Decision.**
- **Creating.** The organisation must be one you belong to, or none, unless you hold
  `CanUpdateOtherOrganizationEvents` (`mayAssignEventOrganization`, `event-scope.ts:225-231`). A key
  bound to an organisation files under that organisation by default (`boundOrganizationIdOf`,
  `:262-265`). The owner defaults to the creating user, and naming anyone else needs
  `CanUpdateOtherOrganizationEvents` (`mayAssignEventOwner`, `:233-235`).
- **Moving.** Changing an event's organisation needs you to hold the event now (as a member of its
  organisation, or as the owner of an event with none) and to belong to the target, unless you hold
  `CanUpdateOtherOrganizationEvents` (`mayMoveEventToOrganization`, `:237-257`). A venue member does
  not hold the event, so cannot move it. Taking the event out of every organisation also needs you to
  own it ([D92](#d92--only-the-events-owner-may-take-it-out-of-every-organisation)).
- **Changing the owner** of an existing event needs `CanUpdateOtherOrganizationEvents`
  (`mayReassignEventOwner`, `:259-260`).
- A key bound to an organisation never counts as holding the cross-organisation permission
  ([D36](#d36--an-api-key-can-belong-to-one-organisation)).

**Why.** The owner and the organisation are what every access rule reads (D19, D35). If anyone who
may edit an event could also rewrite them, edit access would become ownership. The rule still lets a
submitter file an event under their own organisation, or move their orphan event into it, which
D20's recovery chain expects.

**Consequences.**
- An owner who is not a member of the event's organisation cannot move it anywhere.
- An API key owns nothing (D35). A key creates events without an owner unless it holds the
  cross-organisation permission and names one, which a bound key never can. Superseded by
  [D94](#d94--an-api-key-acts-as-the-user-who-created-it): a key's events are owned by its creator.

---

## D48 — Publishing stays with the organising organisation

> **Updated by [D66](#d66--the-editor-role-files-and-publishes-its-own-events-agenda-admin-is-a-predefined-role) and [D68](#d68--the-event-tells-the-editor-what-the-caller-may-do-with-it), awaiting Karl's confirmation.** The predefined editor role now holds `CanPublishEvent`, so its members publish their organisations' events and their own orphan events. `Event.viewerCan.publish` is `canPublishEvent`, which the editor reads to choose between Publish and Ready for review.

Updates [D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state), [D4](#d4--canpublishevent-decides-who-needs-validating) and [D35](#d35--an-events-owner-reaches-it-without-an-organisation).

**Status.** Built in `181c71168`. Awaiting Karl's confirmation.

**Context.** D4 makes `CanPublishEvent` decide who needs validating, and D3 makes validating a
foreign event the same act as publishing it with a cross-organisation permission.
`@Permissions(CanPublishEvent)` on its own would let anyone holding it publish any event they can
edit, including a venue member editing another organiser's event through D19's venue branch.

**Decision.** `canPublishEvent(session, event)` is `CanPublishEvent` **and** one of: membership of
the organising organisation; ownership of an event that has no organisation;
`CanUpdateOtherOrganizationEvents` (`event-scope.ts:215-219`). It gates both `publishEvent` and
`unpublishEvent` (`event.service.ts:567,636`).

**Why.**
- The venue branch exists so that validation mail does not lead to a 403 (D19). It lets a venue
  member edit a foreign event, not publish it. Publishing a foreign event is validation, and D3 and
  D4 put that behind the cross-organisation permission.
- The owner of an orphan event may publish it if they hold `CanPublishEvent`; otherwise only
  cross-organisation users could ever publish an event with no organisation. Submitters do not hold
  `CanPublishEvent` ([D8](#d8--former-proposers-become-dormant-user-accounts), [D32](#d32--the-public-submission-form-stays-it-creates-the-account-first-then-the-event)), so this does not let them skip validation.

**Consequences.**
- A venue member who cannot publish a foreign event may call `requestEventReview` ([D58](#d58--a-review-request-is-a-state-stamped-once)).
- Unpublishing follows the same rule, so a venue member cannot take a foreign event off the agenda
  either.

---

## D49 — Deleting an event needs membership or the cross-organisation delete permission

Updates [D4](#d4--canpublishevent-decides-who-needs-validating) and [D35](#d35--an-events-owner-reaches-it-without-an-organisation).

**Status.** Built in `181c71168`. Awaiting Karl's confirmation.

**Decision.** `canDeleteEvent(session, event)` is membership of the organising organisation, or
`CanDeleteOtherOrganizationEvents` (`event-scope.ts:221-223`), behind
`@Permissions(CanDeleteEvent)`. There is no owner branch and no venue branch.

**Why.** No decision gives owners deletion: D35 gives an owner list and edit access. The venue
branch exists for validation ([D19](#d19--an-organiser-sees-only-their-own-organisations-events-in-the-editor)), and deleting a foreign organiser's event is not
validation. D4 gives deleting other organisations' events a permission of its own.

**Consequences.**
- A submitter cannot delete their own orphan event; an Agenda-Admin can.
- If owners should delete after all, adding `isEventOwner` to `canDeleteEvent` is a one-line change.

---

## D50 — Event slugs are unique among published events only

**Status.** Built in `181c71168`. Awaiting Karl's confirmation.

**Context.** [Design 1](design/01-data-model.md) §6.2 keeps the We.Publish rule (slugs are unique
among published rows, and drafts may share one), but its first `Event` sketch had
`slug String? @unique`, which contradicts it.

**Decision.** `Event.slug` is a nullable, indexed, non-unique column
(`libs/api/prisma/schema.prisma:2580,2631`). `createEvent`, `updateEvent` and `publishEvent` refuse
a slug that another published event already uses (`assertSlugAvailable`,
`event.service.ts:903-926`). `event(slug:)` prefers the published event when several share the slug
(`:184-191`).

**Why.** The prose states the rule; the `@unique` was a slip in the sketch. Drafts stay cheap, and
`Article` also keeps a non-unique slug.

**Consequences.**
- Two drafts may share a slug. The second one to publish is refused and needs another.
- The migration de-duplicates BKa's slugs against published events only ([design 4](design/04-migration.md)).
- `Article` has no such check in its service, so events are stricter than articles here.

---

## D51 — The revision keeps its description as plain text for search

Updates [D16](#d16--accent-insensitive-search-gets-a-real-index) and [D24](#d24--the-revision-carries-what-an-editor-writes-the-event-carries-what-the-event-is).

**Status.** Built in `b2a151771` and `181c71168`. Awaiting Karl's confirmation.

**Context.** D16 asks for an indexed, accent-insensitive search over name and description. The
description now lives in `EventRevision.blocks` JSON, which cannot be trigram-indexed sensibly, and
`blocks::text` would also match JSON keys and node types.

**Decision.**
- `EventRevision.descriptionText` holds the plain text of the revision's richtext blocks, joined with
  line breaks (`blocksPlainText`, `libs/event/schedule/src/lib/blocks-plain-text.ts`).
  `createEvent`, `updateEventContent` and `duplicateEvent` write it (`event.service.ts:129,761`).
- The GIN trigram index is built on
  `events_unaccent(coalesce("name", '') || ' ' || coalesce("descriptionText", ''))`, through an
  `IMMUTABLE` wrapper around `public.unaccent`
  (`libs/api/prisma/migrations/20261023140000_replace_events_with_agenda/migration.sql:446-455`).
  The query uses the same text (`EVENT_SEARCH_EXPRESSION`,
  `libs/event/api/src/lib/event-search.ts:9`), and a spec pins the two together.
- A search returns the matching event ids, which are ANDed into the list query as `id IN (…)`.
  Public search reads the published view; editor search reads every revision that is not archived,
  inside the editor scope.
- The 6,400-character limit adds up the text of each richtext block without separators
  (`blocksTextLength`), so the line breaks between blocks do not count against it.

**Why.** It is the only indexable form of the description, it is what BKa searched (`unaccent()`
over the description text), and the same text measures the 6,400 rule, so search and validation
cannot disagree about what the description says.

**Consequences.**
- Paragraphs inside one richtext block run together in `descriptionText`, because `toPlaintext` adds
  no separator between them, as BKa's `strip_tags` count did. A search term can match across a
  paragraph boundary.
- `event-search.db.spec.ts` checks the accent folding, the public/editor split, the escaping and the
  `EXPLAIN` plan against a real database. It runs the migration's own SQL on temporary tables in a
  transaction that is always rolled back. Without a database it skips locally and fails in CI. In a
  plain local run its connection is the default `wepublish` database from `.env`.
- A very common term returns a long id list. That is fine at BKa's ~25,000 events; a raw-SQL join
  can replace `IN (…)` if a larger tenant needs it.

---

## D52 — `ticketingUrl` and `showInPrint` are facts on the event

> **Updated by [D95](#d95--copies-venue-switches-and-the-print-flag-follow-the-organisation-rules), awaiting Karl's confirmation.** Changing `showInPrint` needs the event's organisation to be a partner, or `CanUpdateOtherOrganizationEvents`.

Updates [D24](#d24--the-revision-carries-what-an-editor-writes-the-event-carries-what-the-event-is).

**Status.** Built in `181c71168`. Awaiting Karl's confirmation.

**Context.** [Design 2](design/02-api.md) validates `ticketingUrl` (§4) and filters on `showInPrint`
(§2.2), [design 1](design/01-data-model.md) §12 says BKa's scalar ticketing link survives, and
design 3 has a ticketing link on its pricing tab. Neither field was in design 1's `Event` sketch.

**Decision.** `Event.ticketingUrl String?` and `Event.showInPrint Boolean @default(false)`
(`libs/api/prisma/schema.prisma:2599-2600`), on the entity, because both state facts about the
event. `ticketingUrl` must use `http`, `https`, `mailto` or `tel` (`ticketingUrlSchema`,
`libs/event/schedule/src/lib/event-input-rules.ts`).

**Consequences.**
- Both take effect on save, like D24's other facts, and `duplicateEvent` copies them.
- BKa's `print_category_id` (`research/bka-01-data-model.md:415-443`) is not ported. Whether it
  comes over as an event-tag reference or is dropped is open.

---

## D53 — The shared input rules live in the schedule library

Updates [D38](#d38--a-weekly-schedule-needs-at-least-one-weekday) and [D43](#d43--weekdays-outside-monday-to-sunday-are-rejected-on-input): the mutations now run their checks.

**Status.** Built in `b2a151771` and `181c71168`. Follows [design 2](design/02-api.md) §4; recorded
for reference.

**Decision.** Every rule in design 2 §4 lives in `libs/event/schedule/src/lib/event-input-rules.ts`
as zod v3 schemas and limits: name, print description, description length, tag count, ticketing
URL, opening time and rates. `eventScheduleProblems(schedule, now)` puts `'MissingDateRange'`,
`'MissingDates'`, `'DateToBeforeDateFrom'` and `'InvalidOpeningTime'` in front of
`validateScheduleInput`'s codes, each at most once and in a fixed order.
`libs/event/api/src/lib/event-input.ts` runs them and turns the problems into one
`BadRequestException` (`assertValidSchedule`, `:49-55`).

Details the build settled:

- Lengths count code points (`[...s].length`), not UTF-16 units, so an emoji counts as one
  character.
- The name is trimmed and may not be blank, since the GraphQL non-null type lets `"  "` through.
- Tag ids must be distinct, because a repeat would break the composite key of
  `events.tagged-events`.
- The ticketing URL is parsed with `new URL()`, which already refuses a bare host or `https://`
  before the scheme check.
- `DateToBeforeDateFrom` and `InvalidOpeningTime` are checked on the span and on every explicit
  date.

**Why.** The editor (slice F) and the migration (slice G) need the same rules without Nest or
Prisma, and `libs/event/schedule` is already the pure library both of them use.

**Consequences.**
- `libs/event/schedule` depends on `@wepublish/richtext` for `toPlaintext`, which brings in `ramda`
  and type-only `@tiptap/core` imports.

---

## D54 — Places are public, and `private` only narrows the venue picker

Updates [D37](#d37--organisations-are-public-their-sensitive-fields-are-not), whose consequences asked for a public/sensitive call on places.

**Status.** Built in `595956a6f`. Awaiting Karl's confirmation on the cross-organisation case.

**Context.** D37 split organisations into public and sensitive fields and named places as needing
the same call. The research shows that BKa's `place.private` hides nothing in its APIs, and every
place field is in BKa's item groups (`research/bka-04-api-v2-apiplatform.md:465-490,1150`). Only
the admin event form restricts private places, through `findActiveAndNotPrivate`
(`research/bka-06-security-auth-roles.md:473`).

**Decision.**
- `Place` is one GraphQL type with no sensitive split, and `place` and `places` are public.
- Which places are listed follows the organisation rule: anonymous callers see enabled places,
  members also see their own disabled ones, and holders of `CanGetOtherOrganizations` or
  `CanUpdateOtherOrganizations` see all (`visiblePlacesWhere`, `event-scope.ts:114-130`).
- Which place an event may be filed at is a separate rule, enforced by `createEvent` and by
  `updateEvent` when the venue changes: the place must be enabled, and either not private or one of
  your organisations' (`selectablePlacesWhere`, `event-scope.ts:132-149`; `assertPlaceSelectable`,
  `event.service.ts:884-901`). Holders of `CanUpdateOtherOrganizationEvents` may pick any enabled
  place, private ones included. Disabled places are never selectable.
  `places(filter: { selectable: true })` gives the editor the same list.
- `Place.proInfirmisPictograms` is exposed as the `JSON` scalar (a new `scalar JSON`), because its
  shape is still open ([design 2](design/02-api.md) §7).

**Why.** A sensitive type would protect nothing that BKa protects. A restriction that exists only in
a form is not a boundary, so the server enforces the venue rule. Checking only when the venue
changes keeps events at a venue that was disabled later editable.

**Consequences.**
- `Event.organization` and `Place.organization` resolve to null for an organisation the caller may
  not see (`canSeeOrganization`).
- `JSON` is unmapped in codegen, as `JSONObject` is, so clients get it untyped.
- Open: BKa's form applies `findActiveAndNotPrivate` to everyone, while the build lets an
  Agenda-Admin pick a private venue.

---

## D55 — Place writes reuse the organisation permissions

> **Updated by [D95](#d95--copies-venue-switches-and-the-print-flag-follow-the-organisation-rules), awaiting Karl's confirmation.** Changing a place's `enabled` needs `CanUpdateOtherOrganizations`, as for organisations; `private` stays with the place's managers, and `Place.viewerCan` gains `updatePrivileged`.

> **Updated by [D73](#d73--organisations-and-places-tell-the-editor-what-the-caller-may-do-and-places-filter-by-mine) and [D87](#d87--organisations-and-venues-are-list-and-edit-records-gated-on-viewercan), awaiting Karl's confirmation.** `Place.viewerCan` reports `update` and `delete` from `CanUpdateOrganization` and `canManagePlace`, and `places` gains the `mine` filter. The predefined editor role holds no organisation permission (D66), so editor-role members see their venues read-only.

Updates [D4](#d4--canpublishevent-decides-who-needs-validating).

**Status.** Built in `595956a6f`. Awaiting Karl's confirmation.

**Context.** D4 and [design 1](design/01-data-model.md) §13 define event and organisation
permissions but none for places. BKa lets only `ROLE_ADMIN` create and delete places, and lets
members edit them (`research/bka-06-security-auth-roles.md:268,471-472`).

**Decision.**
- `createPlace`, `updatePlace` and `deletePlace` carry `@Permissions(CanUpdateOrganization)`
  (`libs/event/api/src/lib/place/place.resolver.ts`). The service then requires `canManagePlace`:
  membership of the place's organisation, or `CanUpdateOtherOrganizations`, which alone may act on a
  place with no organisation (`event-scope.ts:151-157`).
- `deletePlace` refuses a place that still has an occurrence ending in the future
  (`place/place.service.ts:217-240`), as BKa's `PlaceController.php:167-172` does. Otherwise
  `Event.place` would silently become null on live events.
- The writes check coordinates and zip with the organisations' location rules (`location-rules.ts`),
  refuse a disabled region, and invalidate the `events` cache, because `place.name` is an event's
  `location`.

**Why.** A place belongs to an organisation the way its events do, and `CanUpdateOrganization` with
membership already means "may manage this organisation". Separate place permissions would be one
more thing to grant for no gain the build could see.

**Consequences.**
- Members holding `CanUpdateOrganization` may create and delete their own organisation's places,
  which BKa reserves for admins. Open: keep that, or add `CanCreatePlace`, `CanUpdatePlace` and
  `CanDeletePlace`.

---

## D56 — Taxonomies are read-only for now, and the SQL migration seeds nothing

> **Updated by [D93](#d93--taxonomy-screens-are-not-part-of-slice-f), awaiting Karl's confirmation.** Creating and editing regions, audiences and affiliations did not land in slice F; it waits until the slice G import fills the tables.

> **Updated by [D72](#d72--organisation-tags-affiliations-and-contacts-are-public-and-written-through-the-organisation), awaiting Karl's confirmation.** An organisation's tags, affiliations and contacts now have public GraphQL fields and are written through the organisation inputs.

Updates [D27](#d27--the-events-domain-ships-to-every-tenant).

**Status.** Built in `595956a6f`. Follows D27; recorded for reference.

**Decision.**
- Regions, audiences and affiliations have read-only public queries, `eventRegions`,
  `eventAudiences` and `eventAffiliations` (`libs/event/api/src/lib/taxonomy/event-taxonomy.resolver.ts:18-40`).
  A disabled region is listed only to holders of `CanGetOtherOrganizations` or
  `CanUpdateOtherOrganizations`. Creating and editing them is slice F work.
- The SQL migration seeds no reference data. D27 seeds BKa's 13 regions, 4 audiences and 7
  affiliations only for agenda tenants, which a migration applied to every tenant cannot do. The
  data arrives with the slice G import or an opt-in seed.
- Event categories are tags of type `Event`, served by the platform `tags` query, with no BKa id
  mapping ([design 1](design/01-data-model.md) §10.1; [D29](#d29--the-php-app-maps-bka-categories-to-tags-by-name-and-keeps-the-category-table) is superseded).
- Of an organisation's new relations only `BaseOrganization.region` is exposed
  (`organization/organization-region.resolver.ts`). Tags, affiliations and contacts have Prisma
  relations and no GraphQL fields yet. The new relation fields live in their own resolvers
  (`EventRelationsResolver`, `OrganizationRegionResolver`), so `OrganizationResolver` and its spec,
  which lists its handlers exactly, stay unchanged.

**Consequences.**
- The taxonomy tables are empty on every tenant until slice G, so filtering events by `audienceId`
  or `regionId` matches nothing before then.

---

## D57 — `duplicateEvent` copies the way BKa's duplicator does

> **Updated by [D95](#d95--copies-venue-switches-and-the-print-flag-follow-the-organisation-rules), awaiting Karl's confirmation.** The check is now `mayDuplicateEvent`, which also refuses a venue member an event without organisation, and the copy's venue must still be selectable.

**Status.** Built in `595956a6f`. Awaiting Karl's confirmation.

**Context.** [Design 2](design/02-api.md) lists `duplicateEvent` without rules. BKa's
`EventDuplicator` defines them (`research/bka-08-event-domain-logic.md:812-852`).

**Decision.**
- The copy takes the facts (status, organisation, venue, audience, ticketing link and print flag),
  the schedule and explicit dates unchanged, the rates, the tags, and the newest unarchived revision
  as its first draft, image rows included (`event.service.ts:674-789`).
- Its name is `Kopie von <name>`, cut to 130 characters (`:95`), in German only ([D33](#d33--bka-has-no-french-content-d13s-premise-is-corrected)).
- Not copied: the slug, the SEO and social fields, `legacyId`, the review fields and the publication.
  The caller becomes the owner.
- The caller needs `canModifyEvent` on the source **and** `mayAssignEventOrganization` for the
  source's organisation. A venue member may edit a foreign event but may not duplicate it.
- The image rows point at the same `Image` records. BKa copies the files because its images belong
  to one event; We.Publish images are shared.

**Why.** It matches the tool BKa's organisers already use. The organisation check stops duplication
from getting round [D47](#d47--who-may-set-an-events-organisation-and-owner): without it, a venue member could create events inside the
organiser's organisation.

**Consequences.**
- Open: whether `Kopie von` is the wording wanted, and whether refusing the venue member is right.

---

## D58 — A review request is a state, stamped once

> **Updated by [D68](#d68--the-event-tells-the-editor-what-the-caller-may-do-with-it), [D69](#d69--a-review-request-can-be-withdrawn) and [D85](#d85--ready-for-review-and-withdraw-request-follow-viewercan-and-name-who-can-publish), awaiting Karl's confirmation.** A request can be withdrawn by anyone who may edit the event (`withdrawEventReview`). `viewerCan.requestReview` and `viewerCan.withdrawReview` decide which button shows, and the confirmation names who can publish without promising a notification until slice E.

Updates [D5](#d5--ready-for-review-is-an-explicit-action-backed-by-a-field-on-the-event).

**Status.** Built in `595956a6f`. Awaiting Karl's confirmation.

**Decision.**
- `requestEventReview` needs `canModifyEvent`, an unpublished draft, and that the caller **cannot**
  publish this event, judged by `canPublishEvent(session, event)` rather than the bare
  `CanPublishEvent` permission (`event.service.ts:791-827`).
- Asking again keeps the first `reviewRequestedAt` and returns the event unchanged.
- `publishEvent` clears both review fields.

**Why.** A venue member holding `CanPublishEvent` still cannot publish a foreign event
([D48](#d48--publishing-stays-with-the-organising-organisation)), so they need the request, and the bare permission would have refused it. D5 orders
the queue by age, so stamping again would send a waiting event to the back each time someone asked.

**Consequences.**
- Open: whether asking again should stamp again, and so, once the mails exist, notify again.

---

## D59 — Event filters match the venue, and `false` means "not flagged"

> **Updated by [D71](#d71--the-editor-list-filters-by-publication-review-and-last-date-and-lookups-by-id-use-reach), awaiting Karl's confirmation.** `EventFilter` also takes `draft`, `pending`, `published`, `reviewRequested`, `endsBefore` and `endsAfter`; `draft`, `pending` and `reviewRequested` are dropped outside editor mode.

Updates [D42](#d42--the-public-event-partner-filter-stays).

**Status.** Built in `15c79e2c4`. Awaiting Karl's confirmation.

**Decision.** In `EventFilter` (`libs/event/api/src/lib/event-filter.ts`):

- `regionId`, `geoBoundingBox`, `wheelchairAccessible` and `accessibilityProInfirmis` match the
  **venue** (`event-filter.ts:37-70`).
- `accessibilityProInfirmis` matches a venue that has **any** of the given pictogram ids, as BKa ORs
  them over `$[*].Id` (`research/bka-04-api-v2-apiplatform.md:1088`,
  `research/bka-07-proinfirmis-ginto.md` §8.4).
- `wheelchairAccessible: false` and `partner: false` match events whose venue or organisation is
  **not** flagged, including events with no venue or no organisation (`flagWhere`, `:11-14`). `true`
  matches flagged ones; leaving the field out ignores the flag.
- `from`, `to` and `upcoming` match occurrences ([D30](#d30--the-agenda-lists-occurrences-the-catalogue-lists-events)). `upcoming` means an occurrence whose
  `dateTo` has not passed.

**Why.** Regions sit on venues as well as on organisations ([design 1](design/01-data-model.md)
§10.2), and someone filtering by region is asking where the event takes place, not where its
organiser is based. BKa only ever sends `true` for the flags, and giving `false` a meaning is better
than silently ignoring it.

**Consequences.**
- D42 is otherwise unchanged: the `partner` filter stays public.
- Open: `regionId` on the venue rather than the organisation, and the meaning of `false`.

---

## D60 — The `EventBlock` keeps its stored filter

**Status.** Built in `181c71168`. Follows Karl's calls to keep the block and to let stale ids render
nothing; the ordering of tag matches awaits confirmation.

**Decision.**
- The stored block keys `filter.tags` and `filter.events` are unchanged
  (`libs/block-content/api/src/lib/event/event-block.model.ts`). Only the query variables were
  renamed (`EventFilter.tags` to `tagIds`, `upcomingOnly` to `upcoming`), and `ids` is new.
- `getPublicEventsForBlock` (`event.service.ts:318-348`) returns published events only.
  Cherry-picked ids keep the editor's order, and ids that no longer exist, every old-model id
  among them, resolve to nothing. Tag matches follow, ordered by `firstDateAt` and capped at
  `getMaxTake`, past events included.
- Block-content and the event library import each other, so providers that inject `EventService`
  use `@Inject(forwardRef(() => EventService))`, and `BlockContentModule` imports
  `forwardRef(() => EventModule)` (`libs/block-content/api/src/lib/block-content.module.ts:34`,
  `event/event-block.resolver.ts:9`), as article and page already do (`.claude/docs/gotchas.md`).

**Why.** Renaming the stored JSON would need a data migration, and Karl's call on stale ids makes
one unnecessary.

**Consequences.**
- Open: whether a block filed by tag should hide events that have ended. Today it keeps showing them.

---

## D61 — The old editor event screens are removed until slice F

> **Updated by [D66](#d66--the-editor-role-files-and-publishes-its-own-events-agenda-admin-is-a-predefined-role), [D74](#d74--the-agenda-editor-lives-in-libseventeditor-and-the-list-comes-first), [D84](#d84--the-event-editor-is-the-article-editors-shell-with-four-metadata-tabs-kept-in-the-address) and [D87](#d87--organisations-and-venues-are-list-and-edit-records-gated-on-viewercan).** Slice F brought the event screens back, built per design 3: the Agenda section with Events, Organisations, Venues and Tags, the event editor, and the `events`, `createEvent`, `organizations`, `venues`, `createOrganization` and `createVenue` commands. The activity feed links new events again. The predefined editor role holds `CanGetEvents` and `CanPublishEvent` (Karl, 2026-10-24).

Updates [D27](#d27--the-events-domain-ships-to-every-tenant).

**Status.** Built in `181c71168` (import screens) and `f5e738261` (event screens). Awaiting Karl's
confirmation for tenants that have live events.

**Context.** The old editor form (`apps/editor/src/app/routes/events/eventForm.tsx`, 330 lines)
edited the flat old event. Adapting it to schedules, revisions, rates and the fact/prose split would
be thrown away when [design 3](design/03-editor.md) replaces it with an editor built like the
article one.

**Decision.**
- Removed: the event list, create and edit views and the delete modal, their three routes, the
  `/events` navigation item, and the `events` and `createEvent` commands.
- Kept: the Event tags routes and menu, now gated on the tag permissions. The editor keeps the
  `FullEvent` fragment and the `EventList` query for the EventBlock and teaser pickers.
- `libs/event/import/*` went with the schema change, together with its app-module wiring, the
  `events/import` route and command, and `CanGetImportedEvents`: its services wrote
  `prisma.event.externalSource*` and stopped compiling once the client was regenerated.
- The activity feed's EventCreated tile no longer links anywhere until slice F adds an edit route.

**Why.** Five deletions and a few small edits, against a rewrite that would not survive slice F.
`commands.spec.ts` keeps the route registry honest.

**Consequences.**
- Until slice F the editor cannot create or edit events on any tenant.
- The migration drops every tenant's old event rows ([D65](#d65--one-migration-replaces-the-old-event-tables-in-place)), and tsri and ganzgraz have custom
  event pages.
- The predefined editor role has the four old event permissions but neither `CanGetEvents` nor
  `CanPublishEvent` (`libs/permissions/src/lib/permissions.ts:1513-1592`), so editor-role users can
  neither list event drafts nor publish until the role is extended.
- i18n keys used only by the removed views (`commandPalette.create.event`, `event.list.*`) stay for
  slice F.
- Open: whether this is acceptable for every tenant, or the deploy waits for slice F.

---

## D62 — Websites read events by slug and keep a lean list fragment

Updates [D30](#d30--the-agenda-lists-occurrences-the-catalogue-lists-events).

**Status.** Built in `f5e738261`. Awaiting Karl's confirmation on the tenant lists.

**Decision.**
- In the website documents (`libs/website/api/src/lib/schemas/event.graphql`), `FullEvent` is the
  list fragment: the nullable flat fields, no blocks. `FullEventDetail` adds `latest { blocks }` and
  is used only by the `Event` query. `FullBlock` includes `FullEventBlock`, which includes
  `FullEvent`, so blocks inside `FullEvent` would recurse and codegen would reject the documents.
- The shared detail page renders `latest.blocks` and falls back to `description` when there is no
  revision. The ganzgraz and tsri overrides keep reading the flat fields, with null guards.
- Each tenant's `pages/event/[id].tsx` moved with `git mv` to `pages/event/id/[id].tsx`, and
  `pages/event/[slug].tsx` is new. An event's URL is `/event/<slug>`, or `/event/id/<id>` when it
  has no slug (`libs/nest-modules/src/lib/urls/url-adapter.ts:52-54`).
- Tenant `/event` lists stay on the `events` catalogue rather than `agenda`. They send the variable
  `upcoming` and keep the URL parameter `upcomingOnly`, so existing links work.

**Why.** It is design 2 §8.2's route split with the least churn in the tenants.

**Consequences.**
- Already true before this slice: tenant list pages prefetch `EventList` without the filter while
  the page queries with `upcoming: true`, so the server-rendered list is empty until the client
  fetch fills it.
- Open: whether tenant lists should move to `agenda`, one row per date (D30).

---

## D63 — Status badges are German, and SoldOut stays scheduled in SEO

**Status.** Built in `f5e738261`. Awaiting Karl's confirmation of the labels.

**Decision.**
- `EventStatusBadge` shows **Abgesagt** (Cancelled), **Verschoben** (Postponed) and **Ausverkauft**
  (SoldOut), and nothing for Confirmed
  (`libs/event/website/src/lib/event-status/event-status.tsx:4-9`), on the list item and on the
  detail page. The EventBlock and the teasers render through the list item, so they show it too.
- SEO maps Cancelled and Postponed to schema.org `EventCancelled` and `EventPostponed`, and SoldOut
  to `EventScheduled` with an offer whose `availability` is `SoldOut`, since schema.org has no
  sold-out event status. `duration` is emitted only for Continuous events: for Weekly and Explicit
  schedules the span is not the length of one sitting ([design 2](design/02-api.md) §8.3).

**Why.** German only ([D33](#d33--bka-has-no-french-content-d13s-premise-is-corrected)). "Abgesagt" rather than BKa's misspelt "Annuliert". A cancelled
event must not look as if it is still on, so the detail page shows the badge as well.

**Consequences.**
- Open: "Abgesagt" or "Annulliert".

---

## D64 — `event` and `place` are non-null and fail with NotFound

**Status.** Built in `181c71168` and `595956a6f`. Awaiting Karl's confirmation.

**Decision.** `event(id, slug): Event!` and `place(id, slug): Place!` throw `NotFoundException` for
a record that is missing or that the caller may not see (`event.service.ts:194-196`,
`place/place.service.ts:92-94`), as `article` does. [Design 2](design/02-api.md) sketched both as
nullable. `organization` stays nullable. Ids are `String` in the schema, as everywhere else in
We.Publish, not `ID`.

**Why.** It matches `article`, so the website's detail pages treat a missing event the way they
treat a missing article.

---

## D65 — One migration replaces the old event tables in place

Updates [D9](#d9--the-events-table-prefix-uses-the-existing-dotted-map-convention) and [D16](#d16--accent-insensitive-search-gets-a-real-index).

**Status.** Built in `181c71168`. Follows Karl's call to drop the old rows. The `unaccent`
prerequisite needs checking against every tenant's database.

**Decision.** `20261023140000_replace_events_with_agenda` drops the old `events.tagged-events` and
`events` tables and the `EventStatus` type, creates `EventStatus` again with `confirmed`,
`cancelled`, `postponed` and `soldOut`, and creates `events.tagged-events` again against the new
`events.events` (`libs/api/prisma/migrations/20261023140000_replace_events_with_agenda/migration.sql:1-11,210-216,394-397`).
It creates the event tables with `uuidv7()` ids, copies the three revision views and their partial
indexes from the article migration, and adds `pg_trgm`, `unaccent` and the search index
([D51](#d51--the-revision-keeps-its-description-as-plain-text-for-search)).

**Why.** Karl dropped the old rows rather than migrating them, so nothing has to be carried over.
Creating the enum again avoids altering its values in place, which a diff would attempt and fail on.
Reusing the `events.tagged-events` name and `TagType.Event` keeps the tag model unchanged
([design 1](design/01-data-model.md) §10.1).

**Consequences.**
- Every tenant loses its old event rows on deploy ([D61](#d61--the-old-editor-event-screens-are-removed-until-slice-f)).
- `CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public` must be allowed on every tenant
  database, and `unaccent` must live in `public`, or the migration fails.
- Prisma does not manage the three views, so every later `prisma migrate diff` must be checked for
  attempts to drop them.

---

## D66 — The editor role files and publishes its own events; Agenda-Admin is a predefined role

Updates [D4](#d4--canpublishevent-decides-who-needs-validating) and [D61](#d61--the-old-editor-event-screens-are-removed-until-slice-f).

**Status.** Built in slice F stage 1 (`89503d801`). The scoping of the editor role is Karl's decision
of 2026-10-24 and is settled. The Agenda-Admin set and the role's existence on every tenant are
awaiting Karl's confirmation.

**Karl's decision (2026-10-24).** The predefined editor role gets the event permissions, scoped to
its own events: its organisations' events plus the events it owns, through `event-scope.ts`. Seeing
**all** events is a separate permission, `CanGetOtherOrganizationEvents`, together with the other
cross-organisation permissions, and only admin and the Agenda-Admin role hold them.

**Context.** D61 left the predefined editor role without `CanGetEvents` or `CanPublishEvent`, so an
editor could neither list event drafts nor publish. Karl decided that the editor role gets the event
permissions, scoped to its own events, and that seeing every event stays with admin and an
Agenda-Admin role, which did not exist.

**Decision.**
- `EditorPermissions` holds `CanGetEvent`, `CanGetEvents`, `CanCreateEvent`, `CanUpdateEvent`,
  `CanDeleteEvent` and `CanPublishEvent`, and none of `CrossOrganizationPermissions` or the
  organisation permissions (`libs/permissions/src/lib/permissions.ts:1513-1591`). Its duplicate
  `CanCreateEvent`, `CanGetComments` and `CanUpdateComments` entries are gone. The scope comes from
  `event-scope.ts` unchanged: its organisations' events plus the events it owns.
- `AgendaAdminPermissions` (`permissions.ts:1607-1629`) holds the nine event permissions, the five
  organisation permissions, `CanLoginEditor`, `CanPreview`, and what its screens need:
  `CanGetTags`, `CanGetImage`, `CanGetImages`, `CanCreateImage` and `CanGetUsers` (owner and member
  pickers).
- `agenda-admin` is a system role on every tenant. It is seeded last in `seedRoles`
  (`libs/api/prisma/seed.ts`), because `apps/api-example` destructures the seed result by position,
  and mirrored in `addPredefinedPermissions` and `UserRoleResolver.permissions`.
- The `EventBlock` and event-teaser pickers run their `events` query with an empty `preview` header
  (`libs/ui/editor/src/lib/panel/publicEventsContext.ts`), so they stay on the public list.
  Otherwise an editor-role journalist would see only their own organisation's events, drafts
  included.

**Why.** `editorEventsWhere`, `canPublishEvent` and `canDeleteEvent` already scope by membership and
ownership, so no scope code changes. An editor on a tenant without organisations files events that
it owns and may publish them through D48's owner branch. A `published: true` filter would not have
been enough for the pickers, since editor mode also drops every other organisation's published
events.

**Consequences.**
- Editor-role users can now list their drafts and publish; D61's "deploy as it is" question
  narrows to the dropped rows.
- `agenda-admin` reaches existing tenants at their next `pnpm migrate`, which runs `prisma db seed`
  after the migrations; the upsert leaves an existing row alone. A local database has no such role
  until `prisma db seed` runs.
- Open: whether the editor role should also hold `CanUpdateOrganization`, without which it cannot
  edit its organisation or venues (D55).

---

## D67 — Events keep BKa's special rate as a nullable enum

**Status.** Built in slice F stage 1 (migration `20261024100000_add_event_special_rate`). Awaiting
Karl's confirmation.

**Context.** Design 3's Pricing tab has BKa's special rate (`free_entry`, `free_price`), and the data
model had no column for it.

**Decision.** `Event.specialRate` is a nullable `EventSpecialRate` enum, `FreeEntry` or `FreePrice`,
mapped to `freeEntry` and `freePrice`. `EventInput` and `UpdateEventInput` take it as a fact (live on
save), and `duplicateEvent` copies it.

**Why.** It is a fact about the event, like the rates, and BKa's two values are all there is.

---

## D68 — The event tells the editor what the caller may do with it

Updates [D47](#d47--who-may-set-an-events-organisation-and-owner), [D48](#d48--publishing-stays-with-the-organising-organisation) and [D58](#d58--a-review-request-is-a-state-stamped-once).

**Status.** Built in slice F stage 1. Awaiting Karl's confirmation.

**Context.** D48 and D58 made publishing and asking for review per-event rules, and the editor does
not know the session's memberships, so it cannot work out which buttons to offer.

**Decision.**
- `Event.viewerCan` returns `update`, `publish`, `delete`, `duplicate`, `requestReview`,
  `withdrawReview`, `moveOrganization`, `clearOrganization` and `reassignOwner`. Each flag is the permission the
  mutation's guard checks **and** the record rule the service checks (`eventViewerPermissions`,
  `event-scope.ts:267-295`): `update` is `CanUpdateEvent` and `canModifyEvent`; `delete` is
  `CanDeleteEvent` and `canDeleteEvent`; `duplicate` is `CanCreateEvent`, `canModifyEvent` and
  `mayAssignEventOrganization`; `requestReview` needs `update`, no `publish`, a draft and no pending
  request; `withdrawReview` needs `update` and a pending request.
- `viewerCan`, `owner` and `reviewRequestedBy` (both `User`) are null outside the event's editor view,
  under the same reach check as `draft` ([D46](#d46--editor-mode-needs-the-preview-header-an-event-permission-and-reach)).
- `viewerCan` describes an existing event. A form creating one has no event to ask, so it gates the
  organisation and owner pickers on the caller's permissions instead.

**Why.** Computing the flags from the scope helpers alone would offer Save and Delete to a member
with a read-only role, and the API would refuse them. Using the same functions as the mutations keeps
the two from drifting.

---

## D69 — A review request can be withdrawn

Updates [D58](#d58--a-review-request-is-a-state-stamped-once).

**Status.** Built in slice F stage 1. Awaiting Karl's confirmation.

**Decision.** `withdrawEventReview(id)` (`@Permissions(CanUpdateEvent)`) needs `canModifyEvent`, clears
`reviewRequestedAt` and `reviewRequestedById`, and resets the events draft cache
(`event.service.ts:864`). Without a pending request it returns the event unchanged.

**Why.** Design 3 §7 offers "Withdraw request". Anyone who may edit the event may withdraw, as anyone
who may edit it may ask.

**Consequences.**
- Open: whether only the person who asked should be able to withdraw.

---

## D70 — Event content takes only the blocks the agenda can show

> **Reversed by Karl: events take every block an article takes.** `EVENT_BLOCK_TYPES`, the
> block-type check in `eventBlocksSchema` and `assertValidContent`, and the editor's subset map
> `EventBlockMap` are gone. The event editor passes the article `BlockMap`, and the API checks only
> the 6,400-character description limit, which counts rich text alone. The agenda's pages and
> print export must render, or skip, whatever blocks an event holds.

**Status.** Built in slice F stage 1, then reversed.

**Context.** Design 3 §4.2 restricts the event canvas to rich text, image, embed and quote, and asks
(§13 Q2) whether that is an editor-only restriction.

**Decision.** `EVENT_BLOCK_TYPES` in `@wepublish/event/schedule` lists `richText`, `image`, `quote`,
`embed` and the embed family the editor's embed block produces (`facebookPost`, `facebookVideo`,
`instagramPost`, `twitterTweet`, `vimeoVideo`, `youTubeVideo`, `soundCloudTrack`,
`polisConversation`, `tikTokVideo`, `bildwurfAd`, `streamableVideo`)
(`event-input-rules.ts:18-34`). `eventBlocksSchema` refuses anything else, and `assertValidContent`
answers BadRequest naming the refused type. The editor's restricted block map will read the same
list.

**Why.** API keys post content too, and the agenda's pages and print export cannot render teasers,
polls or event blocks. One list keeps the editor and the server in step.

**Consequences.**
- `duplicateEvent` copies stored blocks without checking them, so an event written before this
  check keeps its blocks until it is next saved.

---

## D71 — The editor list filters by publication, review and last date, and lookups by id use reach

Updates [D46](#d46--editor-mode-needs-the-preview-header-an-event-permission-and-reach) and [D59](#d59--event-filters-match-the-venue-and-false-means-not-flagged).

**Status.** Built in slice F stage 1. Awaiting Karl's confirmation.

**Decision.**
- `EventFilter` gains `draft`, `pending` and `published` (an existing row in the matching revision
  view, `false` meaning none), `reviewRequested`, and `endsBefore` / `endsAfter` on `lastDateAt`
  (`event-filter.ts`). `draft`, `pending` and `reviewRequested` are dropped outside editor mode, so
  the public cannot probe which events have unpublished work.
- `EventSort.ReviewRequestedAt` orders the queue by `reviewRequestedAt` with nulls last, then by id.
- `Event.nextOccurrence` is the earliest occurrence that has not ended, and
  `Event.upcomingOccurrenceCount` counts every occurrence that has not ended, **the next one
  included** ("+3 more dates" is the count minus one). Both come from one batched `groupBy` plus one
  fetch (`event-occurrence-summary.dataloader.ts`).
- In editor mode, `events` and `agenda` with a non-empty `filter.ids` are scoped by
  `reachableEventsWhere`, as a single `event` is, rather than by `editorEventsWhere`.

**Why.** The list needs the publication and review chips, the review queue oldest first ([D5](#d5--ready-for-review-is-an-explicit-action-backed-by-a-field-on-the-event)), and
"Ending soon" and "Ended" (design 3 §9), which `upcoming` and `to` cannot express because they match
occurrences. Naming events by id is a lookup, not a list: a venue member who opens a foreign event
through D19's venue branch would otherwise see none of its dates.

---

## D72 — Organisation tags, affiliations and contacts are public, and written through the organisation

Updates [D37](#d37--organisations-are-public-their-sensitive-fields-are-not) and [D56](#d56--taxonomies-are-read-only-for-now-and-the-sql-migration-seeds-nothing).

**Status.** Built in slice F stage 2. Awaiting Karl's confirmation.

**Context.** D56 left an organisation's tags, affiliations and contacts as Prisma relations with no
GraphQL fields, and D37 asked for a public/sensitive call on each when it lands. Design 3 §8's
organisation form edits all three.

**Decision.**
- `BaseOrganization` gains `tags` (`Tag`, event tags), `affiliations` (`EventAffiliation`) and
  `contacts` (`OrganizationContact`: `id`, `label`, `email`, `phone`). All three are **public**: an
  anonymous caller reads them on `Organization` as a member reads them on
  `SensitiveDataOrganization`. They are resolved by `OrganizationRelationsResolver` through one
  batched dataloader each (`organization/organization-relations.resolver.ts`,
  `organization-relations.dataloader.ts`), so `OrganizationResolver` stays unchanged, as D56 asked.
- Tags and affiliations come back by name, contacts in the order they were written. None of the three
  join tables has a sort column.
- `createOrganization` and `updateOrganization` take `tagIds`, `affiliationIds` and `contacts`
  (`OrganizationContactInput`). A list given replaces the stored one wholesale; a list left out, or
  `null`, leaves it untouched; `[]` clears it. Whoever may update the organisation may change them
  (members and `CanUpdateOtherOrganizations`, as for the other fields).
- The rules live in `@wepublish/event/schedule` (`organization-input-rules.ts`), for the editor form
  to reuse: at most 3 distinct tags, which must be existing `Event` tags; distinct, existing
  affiliations; at most 6 contacts, each with an email or a phone, a valid email and a label of at
  most 24 characters. Blank strings are stored as null. A broken rule answers BadRequest.
- `updateOrganization` and `deleteOrganization` reset the events response cache, since cached
  `events` responses embed the organisation.

**Why.** bka.ch shows an organisation's categories and contacts (phone, email) on its public page
(D37's evidence), so hiding them would break what the website must render. BKa uses one category
list for organisations and events (`research/bka-09-admin-feature-inventory.md` §8), and caps
categories at 3 and contacts at 6.

**Consequences.**
- Open: whether contacts (phone, email) should be sensitive instead.
- Open: whether affiliations need a cap; BKa has 7 and sets none.

---

## D73 — Organisations and places tell the editor what the caller may do, and places filter by `mine`

Follows [D68](#d68--the-event-tells-the-editor-what-the-caller-may-do-with-it). Updates [D55](#d55--place-writes-reuse-the-organisation-permissions).

**Status.** Built in slice F stage 2. Awaiting Karl's confirmation.

**Decision.**
- `BaseOrganization.viewerCan` (`OrganizationViewerPermissions`) returns `update`
  (`CanUpdateOrganization` and `canManageOrganization`), `updatePrivileged` (`update` and
  `CanUpdateOtherOrganizations`, for `partner` and `enabled`), `delete` (`CanDeleteOrganization` and
  `canManageOrganization`) and `manageMembers` (`CanUpdateOtherOrganizations`, never for a key bound
  to an organisation, which cannot hold it anyway). `Place.viewerCan` (`PlaceViewerPermissions`)
  returns `update` and `delete`, both `CanUpdateOrganization` and `canManagePlace`. Both are built in
  `event-scope.ts` (`organizationViewerPermissions`, `placeViewerPermissions`) and are non-null:
  an anonymous caller gets all false.
- `Place.viewerCan.delete` does not look at upcoming events; the API still refuses that delete and
  says why.
- `PlaceFilter.mine` keeps the places of the caller's organisations, nothing for a caller with none,
  and combines with every other filter.

**Why.** As for events (D68), the forms disable fields with a reason instead of failing on save, and
using the guards' permissions plus the services' rules keeps the two in step. `places` is public and
lists every enabled venue, so an organiser's venue list needs `mine` to show their own.

**Consequences.**
- The response cache serves only anonymous requests, so a cached `places` answer never carries
  someone else's `viewerCan`.

---

## D74 — The agenda editor lives in `libs/event/editor`, and the list comes first

Follows [D61](#d61--the-old-editor-event-screens-are-removed-until-slice-f) and [D66](#d66--the-editor-role-files-and-publishes-its-own-events-agenda-admin-is-a-predefined-role).

**Status.** Built in slice F stage 3. Awaiting Karl's confirmation.

**Decision.**
- The agenda screens live in a new library, `libs/event/editor` (`@wepublish/event/editor`, project
  `event-editor`), set up like `crowdfunding-editor`. It depends on `ui-editor`, `editor-api`,
  `@wepublish/event/schedule` and `@wepublish/permissions`. `apps/editor` only wires the route,
  the navigation, the command and the dashboard card.
- The sidebar section is **Agenda** (design 3 §2), with Events (`CanGetEvents`) and the existing
  event Tags. Organisations and Venues follow in stage 6. The command palette gets `events` under
  the Agenda section.
- `/events` lists the caller's editor view of the events (`EditorEventList`, sent with the preview
  header, so editor mode and `editorEventsWhere` apply). Its columns are name, next date with
  "+N more dates", venue, organisation, status, publication, last date and last change. Rows can be
  unpublished (`viewerCan.publish`, published or scheduled events) and deleted
  (`viewerCan.delete`), each after a confirmation.
- Event names are plain text, and the list has no "New event" or duplicate action, until the event
  editor exists (stage 5). No command or link points at a route that does not exist yet.
- The publication column uses the composite states articles use, each with a mark so colour is
  never the only signal: ○ draft, ◐ review requested (with how long ago), ◔ scheduled, ● published.
  A published event with unpublished changes shows both ○ and ●.
- Dates are shown in Zurich time with `Intl.DateTimeFormat` in the editor language, whatever the
  browser's zone (`event-format.ts`).
- Filters: search, organisation (the caller's own, unless they hold
  `CanGetOtherOrganizationEvents`), venue, tags, status, publication, dates, end of run (Ending
  within 30 days / Ended) and review requested. The list stores the filter in the browser like
  every other list, but keeps "end of run" as a choice and computes its instants from the time the
  page loads, so a stored filter never goes stale.

**Why.** Design 2 §1 names the library, and the crowdfunding and banner editors are the precedent.
Building the list before the editor keeps every commit free of dangling routes, which
`commands.spec.ts` enforces.

---

## D75 — The review queue is a filter, a sort and a dashboard card for whoever can publish

Follows [D5](#d5--ready-for-review-is-an-explicit-action-backed-by-a-field-on-the-event) and [D71](#d71--the-editor-list-filters-by-publication-review-and-last-date-and-lookups-by-id-use-reach).

**Status.** Built in slice F stage 3. Awaiting Karl's confirmation.

**Decision.**
- Turning on "Review requested" in the filters also sorts by `ReviewRequestedAt`, oldest first;
  turning it off goes back to the latest change first.
- The dashboard has a configurable **Review queue** card with the count and a link to
  `/events?review=1`. That parameter shows the queue whatever filter the browser had stored, and the
  first filter or sort change drops it. It is read during render, not copied into state.
- The card is shown to holders of `CanGetEvents` who also hold `CanPublishEvent` or a
  cross-organisation event permission (`useReviewQueueAccess`). The count is scoped by
  `editorEventsWhere`, so an editor-role member counts the requests of their own organisations'
  events, which they may publish (D48). Without `CanGetEvents` the API would ignore
  `reviewRequested` and count public events, so those users never get the card. Users without
  access do not see it in the grid or in the dashboard settings.

**Why.** Design 3 §3 puts the queue in the Filters panel and its discovery on the dashboard. Since
D66, every editor-role member may publish their organisation's events, so limiting the card to the
cross-organisation permissions would hide the queue from the people who answer most requests.

---

## D76 — "Ends in N days" marks weekly series only, in Zurich calendar days

Updates design 3 §9.

**Status.** Built in slice F stage 3. Awaiting Karl's answer on the scope.

**Decision.**
- The list marks a **weekly** event whose last date is still to come and at most 30 Zurich calendar
  days away: "Ends in 12 days", or "Ends today" (`event-expiry.ts`). The day count compares Zurich
  dates, not 24-hour periods.
- Single dates, consecutive-day runs and explicit date lists are never marked: they end when they
  were meant to.
- Design 3 §9's *Past* tab is the **Ended** filter (last date before now), and "Ending within
  30 days" is a filter too.
- "Extend" (open the Dates tab with the end date focused) waits for the event editor (stage 5).

**Why.** The warning exists because D15 caps open-ended weekly series at two years with no
auto-extension. Marking every event that ends within a month would mark almost every concert.

---

## D77 — Empty lists say why, and organisers who cannot publish get a simple stack

Updates design 3 §2, §3.1 and §10.

**Status.** Built in slice F stage 3. Awaiting Karl's confirmation.

**Decision.**
- An empty list explains itself (`event-list-empty-state.tsx`):
  - an empty review queue: "Nothing waiting for review";
  - any other filter: "No events match these filters", the search repeated, and "Clear filters";
  - no events, no membership and no `CanCreateEvent`: "You are not a member of any organisation
    yet", with whom to ask;
  - otherwise: "No events yet" and what the agenda is for, plus, for someone without a membership
    and without the cross-organisation read permission, that an organisation's events appear once
    they are a member. Stage 5 adds "Create your first event" here.
- Membership is read with `organizations(filter: {mine: true}, take: 1)`, only for callers who do
  not see every event.
- The list becomes a stack of cards (name, publication, next date, venue) when the caller lacks
  `CanPublishEvent` (checked with `=== false`, so nothing changes while roles load), no filter is
  active, and the caller has between 1 and 10 events, all loaded.

**Why.** Design 2 §2 asks for the membership message, but on a tenant without organisations an
editor files events of their own (D66), and the message would send them looking for a membership
they do not need. Since D66 the editor role can publish, so the stack now serves custom organiser
roles, as design 3 §3.1's organiser is someone who cannot publish.

---

## D78 — `ListInput` reorders by keyboard

Implements design 3 §5.1.

**Status.** Built in slice F stage 3.

**Decision.**
- `ListInput` registers a `KeyboardSensor` with `sortableKeyboardCoordinates` beside the pointer
  sensor: Space or Enter on the handle picks a row up, the arrow keys move it, Space or Enter drops
  it, Escape cancels. The moves are announced in the editor language
  (`listInput.announcements.*`).
- The sortable attributes and listeners sit on the handle button itself, so each row has one tab
  stop and no button inside a button. The rows are an ordered list.
- New props for the agenda: `showIndex`, `dense`, `addLabel`, `maxItems` (hides Add and Duplicate
  at the limit), and `duplicateLastLabel` with an optional `duplicateValue`, which appends a copy of
  the last row under a new id.
- `useListViewState` gains `update`, which writes filter, sort and limit in one go; two setters in
  a row overwrote each other.

**Why.** Without the keyboard sensor the handle announced an affordance it did not provide. The fix
applies to every `ListInput` in the editor (teaser grid, teaser slots, subscribe block, metadata
properties and others).

---

## D79 — The date editor takes Zurich wall-clock dates and times, and never expands what it cannot save

Implements design 3 §5. Updates [D39](#d39--the-event-has-no-starttime-or-endtime).

**Status.** Built in slice F stage 4. Awaiting Karl's confirmation.

**Decision.**
- Dates and times are native `date` and `time` inputs whose values are read as **Zurich wall clock**
  and turned into instants with `zurichWallClockToInstant` (`schedule-form.ts`). The browser's own
  time zone plays no part, which the house `DatePicker` (local `Date`) could not promise.
- Each mode keeps its own values (`continuous`, `weekly`, `explicit`), so switching modes and back
  loses nothing; only the chosen mode is sent.
- **An explicit row whose end time is earlier than its start time ends on the next day**, as a
  weekly series does (D39) and as BKa's sub-event form already did (it adds a day when the end time
  wraps past midnight, research `bka-09` §7.2). Without it, 22:00–01:00 could not be entered.
- **Duplicate last** copies the last row's times onto the **following day**: the case it exists
  for is the same show on consecutive evenings.
- New schedules start at 20:00–23:30, BKa's defaults.
- The `→ N dates` count runs `eventScheduleProblems` first and calls `expandOccurrences` only when
  there are none (`occurrence-preview.ts`). An incomplete explicit row (`IncompleteDates`) and a
  span longer than ten years (`SpanTooLongToPreview`, which catches a year still being typed) are
  editor-side problems that also stop the expansion. Years before 1000 are treated as not entered.
- Problems show at their field (`schedule-problems.ts`) once the schedule has been changed or the
  form submitted, and the form resolver refuses the same problems on save. The horizon line names
  `lastSchedulableDay(now)` as a date without a time (D40) and turns into the error when it is hit.

**Why.** Design 3 asks for the consequence before it is committed and for limits explained where
they are met; expanding an invalid or unbounded schedule would show a wrong number or hang the tab.

---

## D80 — Event images: caption on the event, alt text on the image, one main image

Implements design 3 §6. Follows design 1 §11.1.

**Status.** Built in slice F stage 4. Awaiting Karl's confirmation.

**Decision.**
- Each image row has a thumbnail, a **Main image** radio (exactly one is main; removing it makes
  the first remaining image main), a caption and an alt text, each with its own help and a `n/125`
  counter.
- The caption is refused above 125 characters (BKa's `legend` limit). **The API does not enforce
  this yet**; the rule lives in the editor's form schema.
- The alt text is `Image.description`, prefilled from it and saved through `updateImage` in stage 5.
  Its help says every article using the image shares it. An empty or over-long alt text gets a
  warning and never blocks saving.
- Adding opens the image library in a drawer (`ListInput` gains `onAdd`, and `defaultValue` becomes
  optional). An image already on the event is not added twice.

**Why.** Blocking on alt text teaches people to type `x` (design 3 §6). The caption limit keeps
what the editor writes inside what BKa's data and print layout assume.

---

## D81 — On a new event the organisation picker offers your own organisations and the owner is you

Implements [D47](#d47--who-may-set-an-events-organisation-and-owner) in the editor.

**Status.** Built in slice F stage 4. Awaiting Karl's confirmation.

**Decision.**
- **Organisation.** Without `CanUpdateOtherOrganizationEvents` the picker lists `mine` only, on
  create and on move, because D47 only lets you file or move an event into an organisation you
  belong to. On an existing event it is enabled only when `viewerCan.moveOrganization` is true; when
  that is false it says who can move the event, and while it loads it is disabled without a reason.
  It offers clearing only when `viewerCan.clearOrganization` is true (D47: the owner, or
  `CanUpdateOtherOrganizationEvents`); otherwise it says why the organisation must stay.
- **Owner.** On a new event it reads "You" and is read-only, unless the caller holds
  `CanUpdateOtherOrganizationEvents`, who gets a user picker (empty means "you"). On an existing
  event it shows the owner, or "No owner", read-only with the reason, unless
  `viewerCan.reassignOwner` is true. The user list is queried only when the picker shows, so the
  editor role, which lacks `CanGetUsers`, never sends a query it would be refused.

**Why.** `viewerCan` belongs to an existing event and does not exist on `/events/create`; gating
only on it would have offered every organisation and every user on create, and the API would have
refused the save (critique of the slice F plan).

---

## D82 — The event form schema reuses the shared rules and splits fields into facts and content

Follows [D53](#d53--the-shared-input-rules-live-in-the-schedule-library) and design 3 §4.1.

**Status.** Built in slice F stage 4. Awaiting Karl's confirmation.

**Decision.**
- `eventFormSchema(now)` (`event-form-schema.ts`) wraps the rules of `@wepublish/event/schedule`
  (name, print blurb, description length, tags, ticketing URL, rates, the schedule problems) and
  replaces their English messages with translation keys; `formErrorValues` supplies the limits.
- Every field belongs to exactly one of `CONTENT_FIELDS` (name, print blurb, blocks, images, sent
  with `updateEventContent`) or `FACT_FIELDS` (everything else, sent with `updateEvent`), so stage 5
  can send only the dirty group.
- The canvas offers the article editor's `BlockMap`, every block an article offers
  ([D70](#d70--event-content-takes-only-the-blocks-the-agenda-can-show), reversed).
- Tags use `SelectTags`, which gains `label`, `helperText`, `error` and `maxTags` (unpicked tags
  are disabled at the limit). The venue picker queries `places(filter: {selectable: true})` and
  explains when there is none. Audience is a select with "Not specified".
- `showInPrint` starts checked on a new event, as BKa does.

**Why.** One source for the rules (D53), and the split save of design 3 §4.1 needs to know which
mutation each field belongs to.

---

## D83 — One Save sends only what changed, and a partial failure keeps what was not saved

Implements design 3 §4.1 and §10. Follows [D82](#d82--the-event-form-schema-reuses-the-shared-rules-and-splits-fields-into-facts-and-content).

**Status.** Built in slice F stage 5. Awaiting Karl's confirmation.

**Decision.**
- The event editor (`libs/event/editor/src/lib/event-editor/`) has one Save button and no autosave.
  Save compares the form with what was loaded (`event-form-mapping.ts`) and sends, in this order:
  `updateEvent` with only the changed facts (the schedule always goes whole, and a non-explicit
  schedule sends `dates: []` so old explicit dates do not linger), `updateEventContent` when the
  name, print blurb, blocks or images changed, and `updateImage` for each image whose alt text
  changed (with its focal point, because `updateImage` resets an omitted focal point to 0.5).
  A new event is one `createEvent(input, content)`, then the alt texts, and the page is replaced by
  `/events/edit/:id`.
- An alt-text change alone is not a content change, so it creates no new revision.
- When one part fails, the others are still sent. The page and the open drawer show what was saved,
  what was not and the API's reason, and the form keeps the unsaved part dirty
  (`defaultsAfterSave` moves only the saved groups into the form's defaults), so the next Save
  retries only that.
- A save that does not pass the form schema opens the Metadata tab with the first problem (or
  focuses the name) and says that fields are marked; nothing is sent.
- Publish, Ready for review and Withdraw save unsaved changes first and stop if that fails.

**Why.** Facts go live on save (D24), so autosaving them would publish half-typed dates; sending
only the changed facts also keeps a venue member who may edit a foreign event from resending fields
the API checks separately (organisation, owner). Design 3 §10: a failed save never loses the draft.

---

## D84 — The event editor is the article editor's shell with four Metadata tabs kept in the address

Implements design 3 §4.

**Status.** Built in slice F stage 5. Awaiting Karl's confirmation.

**Decision.**
- Routes `/events/create` and `/events/edit/:id`, outside the sidebar layout as the article editor
  is; the form is keyed by the id, so duplicating or creating loads the new event fresh.
- The canvas is a fixed name field (`n/130`) above the article editor's block list, with a
  description counter (`n/6,400`) that counts rich text only. Every stored block is shown (D70,
  reversed).
- The Metadata drawer has **General** (print blurb, images, status, venue, tags, audience,
  organisation, owner, show in print), **Dates** (the date editor and 20 upcoming dates at a time),
  **Pricing** (prices, special rate, ticket link) and **Social Media** (slug, SEO and social fields,
  social image, previews). Properties and Tracking are left out: events have neither. The open tab
  is the `tab` query parameter, so `?tab=dates&focus=dateTo` (the list's **Extend**) opens Dates
  with the end date focused.
- The top bar has the state chip (Draft / Published / Published · unpublished changes / Scheduled
  for … / Review requested · …), "Last saved" (the later of the event's change and its latest
  revision), Metadata, Duplicate (when `viewerCan.duplicate`), Save, and the publication control.
  There is no History or Preview yet: no event revision listing exists, and the website's event page
  does not read drafts.
- A read-only event (`viewerCan.update` false) says who can change it and hides Save; the drawer
  fields are disabled.
- Publish opens a dialog: now, or a moment typed as Swiss time (refused in the past). Publish is
  disabled while there is nothing new to publish.
- The list's names link to the editor; the list gains **New event**, a **Duplicate** row action and
  **Extend** beside "Ends in N days"; the empty list offers **Create your first event**; the
  activity feed links new events again; the command palette has **Create event**.

**Why.** Design 3 §4: an event is content and is edited like an article. The address-held tab
makes Extend a plain link and survives a reload.

---

## D85 — Ready for review and Withdraw request follow `viewerCan`, and name who can publish

Implements design 3 §7 and [D5](#d5--ready-for-review-is-an-explicit-action-backed-by-a-field-on-the-event) / [D58](#d58--a-review-request-is-a-state-stamped-once).

**Status.** Built in slice F stage 5. Awaiting Karl's confirmation.

**Decision.**
- Nothing renders while `viewerCan` is unknown. With `viewerCan.publish` the control offers
  Publish (and Unpublish when the event is public). Without it, it offers **Ready for review** when
  `viewerCan.requestReview` holds and **Withdraw request** when a request is pending and
  `viewerCan.withdrawReview` holds.
- The confirmation names who can then publish: the event's organisation, or "the agenda team" when
  it has none. It promises no notification, because mail is slice E.
- The state is repeated in a polite live region, so a screen reader hears "Review requested" or
  "Draft" after the action.

**Why.** D58 makes publishing a per-event rule, so the role alone cannot decide which button shows.
Promising a notification before slice E sends one would be a lie.

---

## D86 — The SEO preview treats an event like an article

**Status.** Built in slice F stage 5. Awaiting Karl's confirmation.

**Decision.** `SeoContentType.Event` previews the SEO title before the name and the SEO description
before the print blurb, as articles do. Pages ignore their SEO fields; events do not.

**Why.** The website's event page does not render SEO fields yet; when it does, it should prefer
them, as the article page does.

---

## D87 — Organisations and venues are list-and-edit records, gated on `viewerCan`

Implements design 3 §8. Uses [D72](#d72--organisation-tags-affiliations-and-contacts-are-public-and-written-through-the-organisation) and [D73](#d73--organisations-and-places-tell-the-editor-what-the-caller-may-do-and-places-filter-by-mine).

**Status.** Built in slice F stage 6. Awaiting Karl's confirmation.

**Decision.**
- Routes `/organizations`, `/organizations/create`, `/organizations/edit/:id`, `/venues`,
  `/venues/create` and `/venues/edit/:id`, inside the sidebar layout, in `libs/event/editor`
  (`organization/`, `venue/`). The Agenda menu lists Events, Organisations, Venues and Tags; the
  command palette has `organizations`, `venues`, `createOrganization` and `createVenue`.
- Organisations appear for `CanGetOtherOrganizations`, `CanUpdateOtherOrganizations` or
  `CanUpdateOrganization`; venues also for `CanGetEvents` and `CanCreateEvent`, because an
  organiser needs to see where they can file. Creating a venue needs `CanUpdateOrganization`
  ([D55](#d55--place-writes-reuse-the-organisation-permissions)), creating an organisation
  `CanCreateOrganization`.
- Both lists start on the caller's own organisations (`mine`) unless they hold a cross-organisation
  organisation permission, and both offer the toggle. The organisation list shows **No members**,
  **Partner** and **From the migration** markers and filters for members, partner and migration
  only to holders of `CanGetOtherOrganizations` or `CanUpdateOtherOrganizations`, and only on rows
  of the sensitive type ([D37](#d37--organisations-are-public-their-sensitive-fields-are-not),
  [D18](#d18--mail-with-no-user-recipient-is-skipped-and-the-gap-is-shown-in-the-editor)).
- The organisation form edits name, subtitle, about, website, legal form (BKa's ten, stored as
  BKa's keys), street, PO box, postcode, city, region, categories (event tags, at most 3),
  memberships and discounts (affiliations) and up to six contacts. Partner is labelled by its
  effect ("Partner — events qualify for the print edition"); partner and enabled are disabled with
  "Only the agenda administrators can change this" unless `viewerCan.updatePrivileged` (or, on
  create, `CanUpdateOtherOrganizations`), and the whole form, including unchanged partner and
  enabled, is sent on save. Latitude and longitude are not edited; the API keeps them.
- The edit page shows the members, with add and remove only for `viewerCan.manageMembers`, and
  the D18 warning when there are none; and the organisation's venues, with a "no venues" message
  that links to `/venues/create?organizationId=…`, which preselects the organisation.
- The venue form labels `private` by its effect ("Only this venue's organisation can file events
  here") with a note that the venue stays public and the agenda administrators can still file there
  ([D54](#d54--places-are-public-and-private-only-narrows-the-venue-picker)). The accessibility
  self-declaration is a labelled group of three checkboxes. A member must pick one of their
  organisations; a holder of `CanUpdateOtherOrganizations` may leave it empty.
- A read-only organisation or venue (`viewerCan.update` false) says who can change it and disables
  Save. Delete is offered only where `viewerCan.delete` holds; a refused venue delete keeps the
  dialog open and says how many upcoming events block it and what to do.
- The event venue picker's "no venues" message links to `/venues/create` in a new tab for callers
  holding `CanUpdateOrganization`, so an unsaved event is not lost.

**Why.** Design 3 §8: these are records, not content. `viewerCan` lets the forms explain a limit
instead of failing on save, as for events (D68).

**Consequences.**
- The refused-delete count is read from the API's message (`still has N upcoming events`); if
  the message changes, the dialog falls back to showing it as it is.
- Regions and affiliations are read-only lists (D56) and empty until slice G imports them, so both
  pickers are empty on a fresh tenant.
- Contacts are organisation fields, edited here, and the event form has none: design 1 §11 attaches
  them to the organisation, as BKa's `OrganizationType` does.

---

## D88 — ProInfirmis data is shown read-only, without a sync time

Implements design 3 §8 in part.

**Status.** Built in slice F stage 6. Awaiting Karl's confirmation.

**Decision.** The venue page shows the ProInfirmis entry read-only: the pictogram names (read from
strings or `name`/`title` fields, since the JSON shape is still open, D54) and a link to the Ginto
entry, or "No ProInfirmis entry is linked". `proInfirmisIdSource` is not editable in the editor.

**Why.** Synced data that an editor could change would be overwritten on the next sync (design 3
§8).

**Consequences.**
- Design 3 asks for a "Last synced" time. `Place` has no sync timestamp, so none is shown. It
  belongs with the Ginto sync ([D7](#d7--proinfirmis-is-in-scope-and-we-build-against-ginto), D21): add a
  nullable `proInfirmisSyncedAt` when the sync is built.

---

## D89 — Organisation and venue limits are mirrored in the editor

**Status.** Built in slice F stage 6. Awaiting Karl's confirmation.

**Decision.** The forms reuse the shared contact and tag rules from `@wepublish/event/schedule`
(`organizationContactSchema`, the caps). The name and postcode limits (organisation name 100,
venue name 90, postcode 4) live only in the API services, so the editor schemas repeat them.

**Why.** Moving three constants into the schedule library would touch the API for no behaviour
change in this stage.

**Consequences.** If an API limit changes, `organization-form-schema.ts` and
`venue-form-schema.ts` need the same change; moving the constants to the schedule library (D53)
would remove that.

---

## D90 — The agenda screens were audited for accessibility; what was fixed, and what belongs to the house

Implements design 3 §11, and §10's "No permission" row in part (see D91).

**Status.** Built in slice F stage 7. Awaiting Karl's confirmation.

**Decision.** The automated scan (`accesslint`, WCAG 2.2 AA) and a manual keyboard and
accessibility-tree pass were run on 2026-10-23 against `/events`, `/events/edit/:id`,
`/organizations/edit/:id` and `/venues/edit/:id` in the running editor, as an administrator and as
an organiser without `CanPublishEvent`. Every finding in agenda code was fixed, with a spec first:

| Finding | Fix |
| --- | --- |
| The list's tags filter was labelled by its placeholder only | it has a label (`event-list-filters.tsx`) |
| The event editor had no level-one heading | a visually hidden `h1`, "Event: name" or "New event" |
| The Metadata drawer was a dialog without a name | it is named by its "Metadata" title |
| Inside the drawer, every autocomplete's option list (venue, tags, organisation, owner) was missing from the accessibility tree: MUI portals the list to `body`, outside the `aria-modal` dialog, so a screen reader heard no options | the drawer gives its autocompletes `disablePortal`, so the list renders inside the dialog |
| Explicit dates: five "Delete" and five "Drag to change the order" buttons with nothing to tell them apart | a numbered `ListInput` names its row: "Delete entry 2", "Move entry 2" |
| A disabled Publish button hid its reason in a `title` that no keyboard or touch user could reach | D91 |
| A long organisation or venue form that failed validation said so only at the fields, possibly below the fold | a warning at the top of the form says fields need attention |

Confirmed as working, with no change: focus order in the top bar and the drawer, Escape closing
the drawer and returning focus to Metadata, tabs moving with the arrow keys, weekday toggles as
named checkboxes inside a fieldset with a legend, the "→ N dates" count updating in a polite live
region, keyboard reordering of explicit dates with its announcements, the review state in a live
region, status marks beside the words, and no horizontal scrolling at 320 CSS pixels.

**Why.** Design 3 §11: non-negotiable for a product that catalogues wheelchair access.

**Consequences.** Five findings belong to the shell every editor screen shares, not to the agenda,
and are left for a change of their own:
- Contained primary buttons fail text contrast: white on `#3498ff` is 2.97:1 (needs 4.5:1). This
  is the theme's primary colour on every screen; fixing it is a theme decision.
- No `main` landmark and no skip link on any editor page (`Base`, `EditorTemplate`).
- The sidebar menu is a `ul` whose children are `div`s.
- The version status dot in the sidebar is `role="img"` without a name.
- The table's row actions read "Duplicate" and "Delete" without the event's name; a screen reader
  user gets the row from table navigation, and the house lists all do the same.

One scanner finding was not reproducible: the list toolbar's Filters and Columns buttons measured
1.11:1 in a headless background tab, caught mid-way through their 250 ms colour transition. In a
foreground tab they resolve to the dark scheme's secondary text colour.

What needs a person with assistive technology: whether VoiceOver and NVDA announce the
live regions and the drag-and-drop instructions as intended, and whether the date fields'
native pickers are usable with a screen reader.

---

## D91 — An unavailable action says why, and stays reachable

Implements design 3 §10 ("No permission: why the action is unavailable and who to ask, not a
disabled button with no tooltip").

**Status.** Built in slice F stage 7. Awaiting Karl's confirmation.

**Decision.**
- When there is nothing new to publish, Publish stays focusable with `aria-disabled`, its reason
  ("Nothing new to publish. Change the name, text or images first.") as its accessible description
  and as a tooltip on hover and focus, and a click does nothing. It used to be `disabled`, which
  swallowed the pointer and took it out of the tab order, so the `title` holding the reason was
  never shown.
- Ready for review behaves the same way when the event has nothing unpublished to review: it is
  shown, with "Nothing new to send for review. Change the event and save it first." It used to
  disappear. It becomes available as soon as the form has unsaved changes, because Ready for review
  saves them first (D83).
- Someone who may not change the event at all gets no publication button; the read-only notice
  already names who can change it (D84). The organisation and venue forms keep their read-only
  notices and the explained partner, enabled and member-management locks from D87.

**Why.** A disabled button cannot be focused or hovered, so whatever explains it is unreachable.
`aria-disabled` keeps the control in the tab order and lets its reason be read and seen.

**Consequences.** The same pattern would help the article and page editors' disabled buttons; that
is not part of this slice.

---

## D92 — Only the event's owner may take it out of every organisation

Updates [D47](#d47--who-may-set-an-events-organisation-and-owner), [D68](#d68--the-event-tells-the-editor-what-the-caller-may-do-with-it) and [D81](#d81--on-a-new-event-the-organisation-picker-offers-your-own-organisations-and-the-owner-is-you).

**Status.** Built in the slice F verification round (`27185a677`). Awaiting Karl's confirmation.

**Context.** D47 let anyone who holds an event, as a member of its organisation, move it to another
organisation they belong to, and the target could be none. A member who does not own the event could
therefore clear its organisation. The event then dropped out of their agenda (`editorEventsWhere`
lists organisation events and owned events only), and they could not undo the change.

**Decision.**
- `mayMoveEventToOrganization(session, event, null)` needs the caller to own the event, unless they
  hold `CanUpdateOtherOrganizationEvents` (`event-scope.ts:237-257`). Moving between organisations the
  caller belongs to is unchanged.
- `Event.viewerCan.clearOrganization` is `update` and that rule (`eventViewerPermissions`,
  `event-scope.ts:291-292`). `moveOrganization` now checks against the event's current organisation,
  which gives the same answer as before in every case.
- The editor's organisation picker offers clearing only when `viewerCan.clearOrganization` holds
  (`OrganizationSelectPicker` gains an optional `disableClearable`, which also blocks clearing with
  Backspace). Otherwise its help text says that only the owner can leave the event without an
  organisation, because it would drop out of the member's agenda.

**Why.** A member who clears the organisation of an event they do not own loses it with no way back,
and the organisation loses it too. The owner keeps reaching an orphan event (D35), so the owner can
always undo.

**Consequences.**
- Checked live as an editor-role member: moving an admin-owned event between two of their
  organisations works; clearing it is refused, by the API and in the picker. Clearing an event they
  own works, and it stays reachable.
- The API's refusal for a non-owner who clears through the API reads "You may only move events
  between organisations you belong to.", which names the wrong reason. The editor never sends that
  request. A message of its own is open.

---

## D93 — Taxonomy screens are not part of slice F

Updates [D56](#d56--taxonomies-are-read-only-for-now-and-the-sql-migration-seeds-nothing) and design 3 §2.

**Status.** Slice F shipped without them. Awaiting Karl's confirmation.

**Context.** D56 called the create and edit screens for regions, audiences and affiliations slice F
work, and design 3 §2 puts a Taxonomies entry under Agenda. Slice F's scope named events,
organisations and venues only.

**Decision.** No Taxonomies menu entry, route or mutation. Regions, audiences and affiliations stay
read-only queries, used by the event and organisation pickers. Event tags stay where they are, as
**Tags** under Agenda ([D74](#d74--the-agenda-editor-lives-in-libseventeditor-and-the-list-comes-first)).

**Why.** The tables are empty on every tenant until the slice G import fills them with BKa's 13
regions, 4 audiences and 7 affiliations (D56). Screens built now would have nothing to show.

**Consequences.**
- The region, audience and affiliation pickers are empty on a fresh tenant.
- Open: whether the screens come with slice G, or whether the imported lists are edited in the
  database until someone needs a screen.

---

## D94 — An API key acts as the user who created it

Updates [D35](#d35--an-events-owner-reaches-it-without-an-organisation), [D36](#d36--an-api-key-can-belong-to-one-organisation) and [D47](#d47--who-may-set-an-events-organisation-and-owner). Closes gap 2 of [permissions.md](permissions.md) §8.

**Status.** Karl, 2026-10-23: a key acts as its creator everywhere (profile, subscriptions,
ownership). Its permissions stay its scopes.

**Context.** `ApiTokenSession` carried no user. Events created by a key had no owner, a platform
key could not edit them afterwards, and every resolver that reads `session.user` crashed for a key.
BKa's tokens act as their owner user (permissions.md, row T3 and K3).

**Decision.**
- `resolveToken` loads `createdBy` without the password (`unselectPassword`), and
  `ApiTokenSession.user` is that user, or null once the creator is deleted
  (`api-token.service.ts`, `api-token.strategy.ts`). `actingUserOf(session)` in
  `libs/authentication/api` returns the user of a user session or a key session.
- **Permissions never come from the creator.** `permissionsOf` reads the key's scopes. The consent
  "admin" shortcut (`holdsAdminRole`) only counts user sessions, and `me.permissions` on the creator
  lists the key's scopes.
- **Event scope.** `userIdOf` is the acting user, so a key creates and copies events owned by its
  creator, writes revisions as its creator, and reaches its creator's events. A bound key owns an
  event only inside its organisation (`isEventOwner`), so it cannot take an event out of every
  organisation unless its creator owns it, and it never lists its creator's events elsewhere.
- **Audit log.** A key call records `actorType token`, the key's name, and the creator's id and email.
- **Things that would hand out the creator's whole account are refused for keys**
  (`requireUserSession`): `createApiToken`, `updatePassword`, `requestEmailChange`,
  `confirmEmailChange`, `generateTotpSetup`, `enableTotp`, `createJWTForWebsiteLogin` and
  `createExternalAppToken`. `revokeActiveSession` answers false for a key.

**Why.** A key that changes the password or email, mints a login JWT, or mints a longer-lived or
unbound key would turn its narrow scopes into every role its creator holds. Refusing those few
calls keeps "acts as its creator" from becoming "is its creator".

**Consequences.**
- Organisation creation is unchanged: a platform key still cannot create an organisation, because
  the key itself would not be a member of it.
- A key whose creator was deleted acts as nobody. Resolvers that destructure `{ user }` throw a
  TypeError for it, as they did for every key before.
- A key keeps acting for a creator whose account was deactivated (`active: false`). Open.

---

## D95 — Copies, venue switches and the print flag follow the organisation rules

Updates [D52](#d52--ticketingurl-and-showinprint-are-facts-on-the-event), [D55](#d55--place-writes-reuse-the-organisation-permissions), [D57](#d57--duplicateevent-copies-the-way-bkas-duplicator-does) and [D87](#d87--organisations-and-venues-are-list-and-edit-records-gated-on-viewercan). Closes gaps 3, 4, 5 and 7 of [permissions.md](permissions.md) §8.

**Status.** Built in the permission-gap round. Awaiting Karl's confirmation.

**Decision.**
- **Copying (gaps 3 and 4).** `duplicateEvent` and `Event.viewerCan.duplicate` use
  `mayDuplicateEvent` (`event-scope.ts`): a member of the source's organisation, the owner of a
  source with no organisation, or a holder of `CanUpdateOtherOrganizationEvents`. A venue member is
  refused whether or not the event has an organisation, as D57 says. The copy's venue goes through
  `assertPlaceSelectable`, as on `createEvent`, so a disabled venue, or one private to another
  organisation, refuses the copy.
- **Venue switches (gap 5).** Changing a place's `enabled` needs `CanUpdateOtherOrganizations`, on
  create and update (`place.service.ts`, `assertMayChangeEnabled`); resending the stored value, or
  `true` on create, is allowed. `private` stays with anyone who manages the place.
  `Place.viewerCan.updatePrivileged` reports it, and the venue form disables the switch with
  "Only the agenda administrators can switch a venue on or off" unless it holds (or, on create,
  `CanUpdateOtherOrganizations`).
- **Print flag (gap 7).** Changing `showInPrint` on `createEvent` or `updateEvent` needs the event's
  organisation, after the update, to be a partner, or `CanUpdateOtherOrganizationEvents`, which a
  key bound to an organisation never counts as holding (`mayChangeShowInPrint`). Resending the
  stored value is allowed. `duplicateEvent` still copies the flag unchanged.

**Why.** BKa lets members switch both their organisation and their venues on and off
(`OrganizationType.php:91-98`, `PlaceType.php:112-124`). We.Publish already reserves the
organisation switch for the agenda administrators (D37, open as Q22), and disabling a venue has the
same effect: it disappears from the public lists and from the venue picker. One rule for both keeps
the answer to Q22 in one place. `private` decides only who else may file events at the venue (D54),
which is the organisation's own business, so it stays with the members, as in BKa. BKa shows its
print fields only to users with the member flag and to admins (`EventType.php:136,251,433`). The
flag is now `Organization.partner` (D11, D14a), so print eligibility follows the organisation that
runs the event, not the person typing.

**Consequences.**
- Open: BKa's print section also holds `printDescription`, which stays ungated here because it is
  revision content.
- Open: the editor's print checkbox is not yet locked for events of organisations that are not
  partners, so such a save fails with "Only events of partner organisations can be marked for
  print."
- Moving an event marked for print to an organisation that is not a partner keeps the flag.
- Copying an event whose venue was disabled since now fails, where it used to copy the venue.

## Open questions

Recorded as they surface; resolved ones become decisions above.

**This file is authoritative where it disagrees with `research/`.** The research documents were
written in parallel and several reached different conclusions before a decision was taken — most
notably on `to_validate`, which `bka-02` and `bka-04` map to *pending* while
[D1](#d1--to_validate-maps-to-draft-not-to-a-new-state) maps it to *draft*. D1 wins.

Raised by the completeness critic, to be resolved in the design:

- ~~**We.Publish has no concept of an organisation.**~~ Built: `Region`, `Organization` and
  `OrganizationMember` (`libs/api/prisma/schema.prisma:2418-2479`, migration
  `20261023120000_add_event_organizations`), and membership on the session as
  `UserSession.organizationIds` (`libs/authentication/api/src/lib/auth-session.ts:22`, loaded in
  `authentication.service.ts:59-83`).
- ~~**Per-record authorisation has no home.**~~ Built: one shared scope module,
  `libs/event/api/src/lib/event-scope.ts`, typed against `AuthSession` so users, API keys and peer
  tokens go through the same functions ([design 2](design/02-api.md) §3.2).
- ~~Mail to non-users is blocked by the schema.~~ Resolved by
  [D18](#d18--mail-with-no-user-recipient-is-skipped-and-the-gap-is-shown-in-the-editor), which
  decided the schema does not change and the send is skipped. The question survived here because it
  was written before D18; the only alternative it pointed at is the one D18 names and rejects.
- ~~The compatibility stub has no target research, and GraphQL already occupies `path: 'v1'`.~~
  Resolved by [D26](#d26--the-compatibility-stub-stays-in-the-php-application-and-calls-wepublish).
- **Unowned cross-cutting subjects:** BKa's ~30 feature flags vs `Setting`/`@Feature`.
  The rest is settled or built: fr|de content by [D33](#d33--bka-has-no-french-content-d13s-premise-is-corrected);
  categories are event tags and region, audience and affiliation are tables with read-only queries
  (`libs/event/api/src/lib/taxonomy/`); the Zurich wall clock in `@wepublish/event/schedule`;
  accent-insensitive search ([D16](#d16--accent-insensitive-search-gets-a-real-index)); the geo
  bounding box (`geo-bounding-box.ts`, on places and events); validation parity
  (`libs/event/schedule/src/lib/event-input-rules.ts`, [design 2](design/02-api.md) §4,
  [D53](#d53--the-shared-input-rules-live-in-the-schedule-library)); and `duplicateEvent` ([D57](#d57--duplicateevent-copies-the-way-bkas-duplicator-does)). (`user.member` is resolved by [D11](#d11--bkas-member-flag-is-called-partner).)
- ~~**Multi-tenancy.** The new tables land in the schema shared by ~20 tenant sites.~~
  Resolved by [D27](#d27--the-events-domain-ships-to-every-tenant).

Raised by the adversarial review of the subjects above, and verified against the code:

- ~~D19 contradicts the scope predicate it depends on.~~ Resolved in place: the list predicate was
  right and the *modify* check was wrong. `canModifyEvent` now also accepts the venue's
  organisation, so [D3](#d3--validation-is-cross-organisation-publishing-not-a-publication-state)'s
  validation mail links to something the recipient can open, while the list stays organising-body
  only. D19's rationale was corrected from "can see" to "can reach". Matches BKa, whose admin list
  (`org ∪ proposer`) and edit voter (`own ∪ org ∪ place-org ∪ proposer`) disagree by exactly that
  branch (`research/bka-06-security-auth-roles.md:443,453`).
- ~~The PHP proxy has no identity in the authorisation model.~~ Resolved by
  [D28](#d28--the-php-proxy-authenticates-with-one-admin-api-token-and-keeps-its-own-voters).
- ~~Frozen BKa category ids versus an editable tag vocabulary.~~ Resolved by
  [D29](#d29--the-php-app-maps-bka-categories-to-tags-by-name-and-keeps-the-category-table).
- ~~The blast radius of deleting the old events is larger than "barely used" suggests.~~
  **Reversed by Karl, twice over.** First: nobody meaningfully uses `EventBlock` today. Then:
  **keep it anyway** — "people will be using it in the future". So the block is *not* deleted; it
  is re-pointed at the new events domain. That changes [design 2](design/02-api.md) §8 from a
  deletion list into a migration list, and it makes the new public `Event` GraphQL type a
  **consumer-facing contract**, not just an editor one — `libs/event/website/**`,
  `libs/block-content/website/src/lib/event/event-block.tsx`, the event teaser in
  `base-teaser.tsx`, and the editor's `eventBlock.tsx` / `selectEventsPanel.tsx` all read it.
  Two further calls from Karl: **stale ids may resolve to nothing** — an `EventBlock` whose
  `filter.events` points at deleted old-event rows simply renders empty, so no data migration of
  stored block payloads is required; and **`lead` is just `description`** — the old `lead` and
  `description` are one concept, so `EventRevision` gains no `lead` field.

Mechanical gaps, no decision needed — fold into the build:

- `EventRevision` needed `archivedAt` for the three-view mechanism to work. Fixed in
  [design 1 §3](design/01-data-model.md).
- `Organization`'s address block and `regionId` had to become nullable or D20 cannot run. Fixed in
  [design 1 §8](design/01-data-model.md).
- `MailTemplateContext` is a closed enum of seven membership contexts
  (`libs/api/prisma/schema.prisma`). Events need a new member and a branch in `assembleMailData`.
- ~~`PublicContent` is a six-member union with no `'events'`.~~ Built: `'events'` is a
  `PublicContent` member and a shared namespace, versioned by drafts, and `agenda`, `event`,
  `events`, `place`, `places` and the three taxonomy queries are cacheable
  (`graphql-response-cache.plugin.ts:29-30,81-114,129-133`, `kv-ttl-cache-shared-namespaces.ts:39`, both in `libs/kv-ttl-cache/api/src/lib/`).
- ~~`libs/api-token/api` now exists and differs from what design 2 describes.~~ Reconciled:
  design 2 §9 describes the built library, and there is no proxy ([D31](#d31--bkas-old-api-is-switched-off-at-cutover-there-is-no-interim-layer)).
- ~~Scheduled publication produces an event with **zero occurrences**.~~ Closed by
  [D45](#d45--occurrences-are-written-whenever-the-schedule-is-saved), if Karl confirms it: occurrences already exist before `publishAt`, and
  `publishEvent` schedules a cache invalidation for that moment.

Raised by D31–D34:

- **Venue proposals in the public form.** BKa's form could propose a venue (`PlaceProposed`,
  2,083 rows). Does the account-first form still do that, and what happens to the 2,083 pending
  rows? **Needs a decision.**
- **Where the public form lives and which mails it sends.** It is not an editor surface, so
  [design 3](design/03-editor.md) does not cover it. **Needs a decision.**
- **Legacy numeric ProInfirmis pictogram ids.** Kept for BKa's public contract (D7), which D31
  removes. Keep them for In Situ parity, or store Ginto's string keys? **Needs a decision.**
- **`/events/agenda/similar`.** No We.Publish equivalent exists. Build one, or tell clients it goes
  away? **Needs a decision.**

Raised by D35:

- **Who may change an event's owner or organisation.** Owner access must not let a submitter move
  their event into an organisation they do not belong to, or hand it to another user. Built as
  [D47](#d47--who-may-set-an-events-organisation-and-owner). **Needs confirmation.**

Raised by D36:

- ~~**Who sees and revokes an organisation's API keys.**~~ Resolved by [D41](#d41--an-organisations-api-keys-stay-with-their-creator): only the
  creator and holders of `CanGetAllApiTokens` / `CanRevokeAllApiTokens`. A key that went dark when
  its creator left keeps showing as `Active`, which is accepted.

Raised by D37–D39:

- ~~**Is `partner` public after all?**~~ Resolved by [D42](#d42--the-public-event-partner-filter-stays): the public event filter stays
  as designed, revealing partner status through it is accepted, and the field stays sensitive on
  the organisation.
- **Is `postOfficeBox` really private?** Classed sensitive because it appears only in BKa's
  login-only groups; 8 of 741 organisations have one, too few to confirm from sampled pages.
- ~~**Exact instant or whole day for the two-year horizon?**~~ Resolved by [D40](#d40--the-two-year-cap-counts-whole-days-in-zurich): whole
  day in Europe/Zurich.
- ~~**Weekday values outside 1–7.**~~ Resolved by [D43](#d43--weekdays-outside-monday-to-sunday-are-rejected-on-input): rejected on input as
  `'InvalidWeekDays'`, repeats included.

Raised by D40:

- **The migration clip keeps each weekly event's end time.** Clipping a weekly `dateTo` to
  `scheduleHorizon` (23:59:59.999 Zurich) would make every occurrence end at 23:59. Move the date to
  `lastSchedulableDay` and keep the time of day; settle the detail when
  [design 4](design/04-migration.md) §4.7 is built.

### Raised by the slice C+D build

Slices C and D replaced the old event model with the agenda domain end to end (commits `b2a151771`
to `e3dd54e34`). Where the design left a choice open, the build made one, and each is recorded as a
decision, [D45](#d45--occurrences-are-written-whenever-the-schedule-is-saved) to [D65](#d65--one-migration-replaces-the-old-event-tables-in-place). **The ones marked "awaiting Karl's confirmation" need a yes, or
the change he wants:**

1. [D45](#d45--occurrences-are-written-whenever-the-schedule-is-saved): occurrences are written on every save that changes the schedule, not only at
   publish. Accepting it supersedes the expansion timing in D10, D15 and design 1 §5.2.
2. [D46](#d46--editor-mode-needs-the-preview-header-an-event-permission-and-reach): editor mode is the `preview` header plus `CanGetEvent` / `CanGetEvents`, not
   `CanPreview`, and the draft view needs reach on each event.
3. [D47](#d47--who-may-set-an-events-organisation-and-owner): who may set an event's organisation and owner (D35's open item).
4. [D48](#d48--publishing-stays-with-the-organising-organisation): a venue member cannot publish or unpublish a foreign event without
   `CanUpdateOtherOrganizationEvents`, and the owner of an orphan event may publish it with
   `CanPublishEvent`.
5. [D49](#d49--deleting-an-event-needs-membership-or-the-cross-organisation-delete-permission): owners cannot delete their own events.
6. [D50](#d50--event-slugs-are-unique-among-published-events-only): slugs are unique among published events only, checked in the service.
7. [D51](#d51--the-revision-keeps-its-description-as-plain-text-for-search): the `EventRevision.descriptionText` column, with paragraphs running together.
8. [D52](#d52--ticketingurl-and-showinprint-are-facts-on-the-event): `ticketingUrl` and `showInPrint` on `Event`. Port BKa's `print_category_id` as an
   event-tag reference, or drop it?
9. [D54](#d54--places-are-public-and-private-only-narrows-the-venue-picker): holders of `CanUpdateOtherOrganizationEvents` may file events at private venues.
10. [D55](#d55--place-writes-reuse-the-organisation-permissions): members may create and delete their own organisation's places. Keep that, or add
    dedicated place permissions?
11. [D57](#d57--duplicateevent-copies-the-way-bkas-duplicator-does): the "Kopie von …" name, and refusing a venue member.
12. [D58](#d58--a-review-request-is-a-state-stamped-once): asking for review again keeps the first timestamp.
13. [D59](#d59--event-filters-match-the-venue-and-false-means-not-flagged): `regionId` matches the venue, and `false` means "not flagged".
14. [D60](#d60--the-eventblock-keeps-its-stored-filter): a block filed by tag keeps showing events that have ended.
15. [D61](#d61--the-old-editor-event-screens-are-removed-until-slice-f): no editor event screens until slice F, a predefined editor role without
    `CanGetEvents` or `CanPublishEvent`, and old event rows dropped on every tenant, tsri and
    ganzgraz included. Deploy as it is, or hold until slice F?
16. [D62](#d62--websites-read-events-by-slug-and-keep-a-lean-list-fragment): tenant `/event` lists stay on the `events` catalogue rather than `agenda`.
17. [D63](#d63--status-badges-are-german-and-soldout-stays-scheduled-in-seo): "Abgesagt" or "Annulliert" for Cancelled.
18. [D64](#d64--event-and-place-are-non-null-and-fail-with-notfound): `event` and `place` return non-null and fail with NotFound.
19. [D65](#d65--one-migration-replaces-the-old-event-tables-in-place): `unaccent` must be allowed in the `public` schema on every tenant database.

Open, no decision needed, folded into later slices:

- The occurrence repair command and the migration backfill are not built (slice G, [D45](#d45--occurrences-are-written-whenever-the-schedule-is-saved)).
- The slice G import writes straight to the database, so it must invalidate the `events` cache when
  it finishes ([D45](#d45--occurrences-are-written-whenever-the-schedule-is-saved)).
- ~~The editor's review queue query is slice F.~~ Built as the `reviewRequested` filter and the
  `ReviewRequestedAt` sort ([D71](#d71--the-editor-list-filters-by-publication-review-and-last-date-and-lookups-by-id-use-reach), [D75](#d75--the-review-queue-is-a-filter-a-sort-and-a-dashboard-card-for-whoever-can-publish)).
- Taxonomy create and edit did not land in slice F ([D93](#d93--taxonomy-screens-are-not-part-of-slice-f)), and the taxonomy tables stay empty until slice G
  ([D56](#d56--taxonomies-are-read-only-for-now-and-the-sql-migration-seeds-nothing)).

### Raised by the slice F build

Slice F built the agenda editor (commits `89503d801` to `27185a677`). Karl decided on 2026-10-24
that the predefined editor role gets the event permissions scoped to its own events, and that seeing
every event stays a separate permission held only by admin and Agenda-Admin; that call is settled
and recorded in [D66](#d66--the-editor-role-files-and-publishes-its-own-events-agenda-admin-is-a-predefined-role). The build choices are recorded as decisions
[D66](#d66--the-editor-role-files-and-publishes-its-own-events-agenda-admin-is-a-predefined-role) to [D93](#d93--taxonomy-screens-are-not-part-of-slice-f). **Each needs a yes, or the change Karl wants:**

1. [D66](#d66--the-editor-role-files-and-publishes-its-own-events-agenda-admin-is-a-predefined-role): the Agenda-Admin set, the role on every tenant, and whether the editor role should
   also hold `CanUpdateOrganization`.
2. [D67](#d67--events-keep-bkas-special-rate-as-a-nullable-enum): `Event.specialRate`, or drop the special rate.
3. [D68](#d68--the-event-tells-the-editor-what-the-caller-may-do-with-it): `viewerCan` as guard permission plus record rule.
4. [D69](#d69--a-review-request-can-be-withdrawn): anyone who may edit may withdraw a review request.
5. [D70](#d70--event-content-takes-only-the-blocks-the-agenda-can-show): answered. Events take every block an article takes, and the restriction is removed.
6. [D71](#d71--the-editor-list-filters-by-publication-review-and-last-date-and-lookups-by-id-use-reach): lookups by id use reach, and the count includes the next date.
7. [D72](#d72--organisation-tags-affiliations-and-contacts-are-public-and-written-through-the-organisation): organisation tags, affiliations and contacts are public; contacts capped at 6, tags at 3,
   affiliations uncapped.
8. [D73](#d73--organisations-and-places-tell-the-editor-what-the-caller-may-do-and-places-filter-by-mine): `viewerCan` on organisations and places, and `PlaceFilter.mine`.
9. [D74](#d74--the-agenda-editor-lives-in-libseventeditor-and-the-list-comes-first): the Agenda section, the list's columns and filters, and "Tags" staying under Agenda
   (design 3 §2 puts tags under Content Blocks).
10. [D75](#d75--the-review-queue-is-a-filter-a-sort-and-a-dashboard-card-for-whoever-can-publish): the review-queue card for every holder of `CanPublishEvent`, not only the cross-organisation
    permissions.
11. [D76](#d76--ends-in-n-days-marks-weekly-series-only-in-zurich-calendar-days): "Ends in N days" for weekly series only, or for every event.
12. [D77](#d77--empty-lists-say-why-and-organisers-who-cannot-publish-get-a-simple-stack): the membership message only for those who cannot file events, and the stack's trigger
    (cannot publish, no filter, at most 10 events).
13. [D79](#d79--the-date-editor-takes-zurich-wall-clock-dates-and-times-and-never-expands-what-it-cannot-save): an explicit row ending before it starts runs into the next day, and Duplicate last
    moves the copy to the following day.
14. [D80](#d80--event-images-caption-on-the-event-alt-text-on-the-image-one-main-image): alt text written to the shared `Image.description`, and the 125-character caption limit
    held by the editor only (should the API refuse it too?).
15. [D81](#d81--on-a-new-event-the-organisation-picker-offers-your-own-organisations-and-the-owner-is-you): the organisation and owner pickers on a new event.
16. [D82](#d82--the-event-form-schema-reuses-the-shared-rules-and-splits-fields-into-facts-and-content): `showInPrint` checked by default on new events, as in BKa.
17. [D83](#d83--one-save-sends-only-what-changed-and-a-partial-failure-keeps-what-was-not-saved): one Save that sends only the changed facts and content, no autosave for events, and
    unsaved changes saved before Publish or Ready for review.
18. [D84](#d84--the-event-editor-is-the-article-editors-shell-with-four-metadata-tabs-kept-in-the-address): no Properties, Tracking, History or Preview for events for now. Every stored block is
    shown, since events take every block an article takes ([D70](#d70--event-content-takes-only-the-blocks-the-agenda-can-show), reversed).
19. [D85](#d85--ready-for-review-and-withdraw-request-follow-viewercan-and-name-who-can-publish): the review confirmation names the organisation (or the agenda team) and promises no
    notification until slice E.
20. [D86](#d86--the-seo-preview-treats-an-event-like-an-article): event SEO fields preferred over name and print blurb, as for articles.
21. [D87](#d87--organisations-and-venues-are-list-and-edit-records-gated-on-viewercan): who sees the Organisations and Venues screens, both lists starting on your own
    organisations, and members of an organisation (with `CanUpdateOrganization`) editing its tags,
    contacts and venues while partner, enabled and the member list stay with the agenda administrators.
22. [D88](#d88--proinfirmis-data-is-shown-read-only-without-a-sync-time): no "Last synced" time until the Ginto sync adds one.
23. [D89](#d89--organisation-and-venue-limits-are-mirrored-in-the-editor): the name and postcode limits repeated in the editor, or moved to the schedule library.
24. [D90](#d90--the-agenda-screens-were-audited-for-accessibility-what-was-fixed-and-what-belongs-to-the-house): the five shell findings left for a change of their own, above all the
    2.97:1 contrast of the theme's primary buttons.
25. [D91](#d91--an-unavailable-action-says-why-and-stays-reachable): Publish and Ready for review stay focusable and explain why they are unavailable,
    instead of being disabled or hidden.
26. [D92](#d92--only-the-events-owner-may-take-it-out-of-every-organisation): only the owner (or `CanUpdateOtherOrganizationEvents`) may take an event out of every
    organisation; a member who does not own it may still move it between their organisations.
27. [D93](#d93--taxonomy-screens-are-not-part-of-slice-f): no taxonomy screens in slice F. Do they come with slice G, or not at all until
    someone needs them?
28. [D54](#d54--places-are-public-and-private-only-narrows-the-venue-picker) in the editor: Agenda-Admin holds `CanUpdateOtherOrganizationEvents`, so its venue picker
    offers private venues. Keep that?

Open, no decision needed, from the slice F build:

- The API's refusal for a non-owner who clears an event's organisation names the wrong reason
  ([D92](#d92--only-the-events-owner-may-take-it-out-of-every-organisation)); it needs its own message and a spec.
- The 125-character caption limit is enforced by the editor only ([D80](#d80--event-images-caption-on-the-event-alt-text-on-the-image-one-main-image)).
- "Ends in N days" counts from the schedule's `dateTo` (the Last day field), not from the last actual
  occurrence: a weekly series whose last day is not one of its weekdays shows a few days too many
  ([D76](#d76--ends-in-n-days-marks-weekly-series-only-in-zurich-calendar-days)).
- The development database's `BlockType` enum still holds `teaserGrid1` and `teaserGrid6`, so
  `prisma migrate diff` keeps proposing to rebuild it. The drift predates slice F and needs a change of
  its own.
- Nx reports `event-api:test` as flaky although every test passes. Two specs have failed once each
  under load (an organisation-relations resolver spec and a "next date of an event that is over"
  case); the shared state or timing behind them is not found yet.
- The same Autocomplete-in-Drawer problem fixed for the event drawer ([D90](#d90--the-agenda-screens-were-audited-for-accessibility-what-was-fixed-and-what-belongs-to-the-house)) still affects the article
  and page Metadata drawers (`.claude/docs/gotchas.md`).
- VoiceOver and NVDA have not been tried on the live regions, the drag-and-drop instructions or the
  native date and time pickers; that needs a person with assistive technology.
- At 1440 px the event table scrolls sideways and the pinned Actions column covers part of the
  Publication column. The house lists behave the same way (`DataTable`).
- Editor polish from the verification: errors show on schedule and price fields before they are
  touched; the publish dialog's copy still mentions two kinds of save; the organisation members panel
  shows US-format dates and help text that does not match what it does; 13 non-null-assertion lint
  warnings in the `event-editor` specs.
