# Design 3 — The editor

How the agenda is operated in the We.Publish editor: navigation, the event list and validation
queue, the event editor, organisations and venues, and the review flow for people who cannot
publish.

Builds on [design 1 — the data model](01-data-model.md) and [design 2 — the API](02-api.md).
Constrained by [`../decisions.md`](../decisions.md). Produced with `/intent` and `/impeccable`;
design language per `/material-3`, implementation per `/material-ui-theming`
(see [working agreements](../decisions.md)).

Screens below were designed against the **running editor**, not inferred from source.

**State of the editor while this is unbuilt.** Slices C and D replaced the event API, and the old
event list, create and edit views went with it (`apps/editor/src/app/routes/events/*`, their routes,
the `Events` nav item and the `events`/`createEvent` commands). Adapting them to schedules,
revisions and rates would have been thrown away by this design. What survives: the Event tags
routes and menu item, now gated on tag permissions, and the event pickers in the EventBlock and
teaser panels, which read the `EventList` query. Until this design is built (slice F), events can be
created and edited only through the API ([design 2](02-api.md) §8.1).

---

## 1. Who uses this, and what for

Three people, with genuinely different needs. Designing for the average of them produces something
that serves none.

| | **Organiser** | **Agenda-Admin** | **Venue admin** |
| --- | --- | --- | --- |
| Who | Runs a theatre, festival or collective | Curates the whole agenda | Runs a venue others perform at |
| Volume | A handful of events a season | Hundreds | Tens |
| Frequency | A few times a year — **relearns the form every time** | Daily | Monthly |
| Can publish? | No ([D4](../decisions.md)) | Yes | Yes, for their venue |
| Needs | To get one event in, correctly, without help | To clear a queue fast | To know what is happening at their venue |

The organiser is the hard case and the one BKa served worst. They use this two or three times a
year, which means **every session is a first session**. They will not remember what "Durchgängig"
versus "Wiederkehrend" meant last time. Anything that relies on recall rather than recognition
will fail for them, every time.

The Agenda-Admin is the opposite: high volume, high familiarity, and their enemy is clicks. The
same screen must not slow them down to help the organiser.

---

## 2. Navigation

`Events` in the sidebar becomes **`Agenda`** — the word BKa's own public page uses, and
distinguishable from an "event" in the analytics sense.

```
Agenda
├── Events            ← includes the validation queue
├── Organisations
├── Venues
└── Taxonomies        ← regions, audiences, affiliations (tags live under Content Blocks)
```

**Venues**, not "Places". *Place* is what the database calls it; *venue* is what the domain calls
it, and nobody running a theatre says "place". Vocabulary is part of the interface.

Each entry is permission-gated. An organiser with no cross-organisation permission sees Events and
Venues; Organisations and Taxonomies are administrative.

Scoping is strict ([D19](../decisions.md)): an organiser's event list contains **only their own
organisation's events, plus the events they own** ([D35](../decisions.md)), so a submitter from the
public form finds their own draft with no organisation at all. Someone with no membership and no
events of their own sees an empty list, and the empty state has to say *why* — "You are not a member
of any organisation yet" — rather than the bare `Nothing to show` that would imply the agenda itself
is empty.

---

## 3. The event list

Follows the house list pattern with no additions: title, `Filters` / `Columns`, a sortable table,
row actions, `N / page` with an entry count — identical in structure to Articles, Pages and
Authors.

```
Agenda › Events                                        [ + New event ]

 ⚑ Filters   ⊞ Columns

 │ Name              Next date        Venue          Organisation   Status      Publication
 │ ───────────────────────────────────────────────────────────────────────────────────────
 │ Qui-vive          Wed 26 May 19:00 Nuithonie      Equilibre      Confirmed   ● Published
 │                   +3 more dates
 │ Les Limbes        Fri 28 May 20:00 Th. Equilibre  Equilibre      Confirmed   ○ Draft
 │ INSÂN             Fri 30 Apr 20:00 Nuithonie      Equilibre      Sold out    ◐ Review requested
```

An earlier draft of this document put a tab strip above the table (`All / Awaiting review /
Drafts / Past`). That is **not** a We.Publish pattern — no list in the editor has one, and
introducing it here would make the agenda the odd screen out. The same need is met by existing
machinery:

- **The validation queue is a filter.** `Review requested` in the Filters panel, alongside
  organisation, venue, tag, status and date range. Editors already know where filters live.
- **Discovery comes from the Dashboard.** The editor's dashboard is configurable
  (`apps/editor/src/app/routes/dashboard/dashboardConfig.tsx`), which is where a count belongs —
  *"3 events awaiting review"*, linking to the filtered list. A count on a dashboard card is how
  this editor already surfaces pending work; a bespoke badge on one list is not.

Two column choices are domain-specific rather than inventions:

**Next date, not start date.** A recurring event's `dateFrom` is historical trivia; what an editor
needs is when it next happens. `+3 more dates` appears inline, not on hover.

**Two status columns, because BKa has two concepts.** `Status` is "is it still happening"
(confirmed / cancelled / postponed / sold out); `Publication` is "can the public see it". Articles
already show composite state chips (`Draft / Published`), so the second column uses the same chip
component and vocabulary — a cancelled event is still *published*, which is the whole point of
marking it cancelled.

### 3.1 What the organiser sees instead

An organiser with three events does not need a table, filters, or pagination. Showing them the
Agenda-Admin's screen is the "design for the average user" failure.

When the result set is small and the user cannot publish, the list collapses to a simple stack:
each event, its next date, its state, and one obvious action. Same route, same component, fewer
affordances.

---

## 4. The event editor

**It is the article editor.** Block canvas for the body, Metadata drawer for everything else, the
same top bar. An event is content; We.Publish already knows how to edit content.

```
┌────────────────────────────────────────────────────────────────────────┐
│ ←  ○ Draft · Last saved 14:02   [Autosave ▢]  ⊞ Metadata  ⟲ History    │
│                                  👁 Preview  │  💾 Save  │ ☁ Publish    │
└────────────────────────────────────────────────────────────────────────┘

                              ＋
      ┌──────────────────────────────────────────────────┐
      │  Dirk Steffens — «Hoffnungslos optimistisch»      │   ← title block
      └──────────────────────────────────────────────────┘
                              ＋
      ┌──────────────────────────────────────────────────┐
      │  [rich text toolbar]                              │   ← description
      │  Der Wissenschaftsjournalist …                    │
      └──────────────────────────────────────────────────┘
```

BKa's description becomes a richtext block ([design 1](01-data-model.md) §7). Everything else
lives in **Metadata** — the same right-hand drawer with tabs and `Save & Close` that articles use.

The tabs are We.Publish's, not BKa's. An article has `General · Social Media · Properties ·
Comments · Tracking`; an event keeps the three that still apply and adds two for the domain:

| Tab | Holds | |
| --- | --- | --- |
| **General** | Name, print blurb, images *(published on Publish)*; status, organisation, venue, tags (max 3), audience *(live on save)* | *as articles: the main attributes plus the image* |
| **Dates** | Schedule type and the date editor (§5) | new |
| **Pricing** | Rates, special rate, ticketing link | new |
| **Social Media** | SEO title and description, social title, description and image — the same five fields as a page, but on the event rather than the revision ([design 1](01-data-model.md) §7.1) | unchanged |
| **Properties** | Key-value properties | unchanged |
| **Tracking** | Unchanged | unchanged |

Images sit in **General** because that is where an article puts *Image for Post* — grouping them
into a separate "Media" tab would have been tidier in the abstract and less familiar in practice.
Publication state is **not** a tab: the top bar already owns it for every other content type, and
duplicating it inside Metadata would create two places to publish from.

Character counters are already the house pattern (`26/30`, `198/350`) and map directly onto BKa's
own limits — `name` 130, `printDescription` 256, description 6,400.

### 4.1 Two kinds of save — not surfaced, by decision

[D24](../decisions.md) splits the event in two, so some fields go live on save and others wait for
**Publish**:

| | Goes live | Mutation |
| --- | --- | --- |
| Canvas: name, description blocks | on **Publish** | `updateEventContent` |
| General: print blurb, images | on **Publish** | `updateEventContent` |
| General: status, organisation, venue, tags, audience | **immediately** | `updateEvent` |
| Dates, Pricing, Social Media | **immediately** | `updateEvent` |

An earlier draft of this section proposed telling the organiser — a note on the fact tabs reading
*"Changes here are live as soon as you save"* — on the grounds that a **Draft** chip beside a
Publish button promises nothing is live yet.

**That is not what we do.** Karl's decision: one Save button, no annotation, exactly as articles and
pages behave.

The reason it is the right call is that events are not special here. `Article` already carries
`slug`, `shared`, `hidden`, `disableComments`, `paywallId` and `tags` on the **entity**
(`schema.prisma`), every one of them editable in the Metadata drawer and live the moment it is
saved, while the chip says Draft. `Page` is the same. The half-true chip is a **platform-wide**
property of We.Publish's revision model, not something the events port invents — and solving it in
the events editor alone would leave three content types behaving three different ways.

So it is recorded here and left alone. When it is solved it should be solved once, for every
content type that has entity-level fields, which is all of them.

### 4.2 Blocks need a restricted palette

An event description is a paragraph or two. The full article palette — teasers, polls, embeds,
image galleries — makes no sense here and invites content the agenda's public rendering cannot
show.

The event canvas offers **richtext, image, embed, quote**. Nothing else. This needs per-entity
block allow-listing, which [`../research/wp-04-block-content-framework.md`](../research/wp-04-block-content-framework.md)
should be checked for before implementation; if it does not exist, it is a small addition and
worth making properly rather than hiding blocks in CSS.

---

## 5. The date editor

The hardest control, the one BKa gets most wrong, and the one the organiser meets twice a year.

BKa presents two radio cards — *Durchgängig* and *Wiederkehrend* — then, inside the second, a
dropdown offering *Daten und Uhrzeiten anpassen* or *Wöchentliche Wiederholung*. The real
structure is three modes, presented as two levels, with the distinction buried in a dropdown whose
label describes a mechanism rather than a situation.

**Three options, one level, described by situation:**

```
 When does it happen?

 ( ) Once, or over consecutive days
     A concert, a vernissage, a run of an exhibition
     ┌──────────────────────────────────────────────┐
     │ From  [09.03.2028]  [20:00]                   │
     │ To    [09.03.2028]  [22:00]                   │
     │ Doors open  [--:--]  (optional)               │
     └──────────────────────────────────────────────┘

 ( ) Every week on certain days
     An exhibition open Thursdays to Sundays
     ┌──────────────────────────────────────────────┐
     │ [M][T][W][T*][F*][S*][S*]                     │
     │ From  [01.04.2028]  [20:00]                   │
     │ To    [30.06.2028]  [22:00]                   │
     │ Doors open  [19:30]  (optional)               │
     │ → 39 dates, each 20:00–22:00                  │
     └──────────────────────────────────────────────┘

 ( ) On specific dates
     Several performances on dates you choose
     ┌──────────────────────────────────────────────┐
     │ ⠿ 1  [12.05.2028] [20:00]–[23:30] [19:00] 🗑 │
     │ ⠿ 2  [13.05.2028] [20:00]–[23:30] [19:00] 🗑 │
     │ + Add date            ⧉ Duplicate last        │
     └──────────────────────────────────────────────┘
```

The weekly mode has no separate start and end time fields ([D39](../decisions.md)). The times typed
beside From and To are the times of every sitting: each date runs from the From time to the To time,
into the next morning when the To time is earlier. The preview line repeats them so nobody has to
work that out. The mode cannot be saved with no day ticked ([D38](../decisions.md)); the inline
message says *"Pick at least one day"* at the day toggles rather than on save.

Four decisions here, each with a reason:

**Describe the situation, not the mechanism.** "Every week on certain days" with an example tells
an organiser which one they are; "Wiederkehrend" asks them to work it out. Recognition over
recall — the whole design for a twice-a-year user.

**Show the consequence before it is committed.** `→ 39 dates` updates live. A weekly rule across a
season silently produces dozens of occurrences, and the only honest moment to show that is before
saving. It is also the cheapest way to catch a wrong end date.

**Duplicate last.** The explicit mode exists because someone types 8 performances at the same time
on consecutive evenings. Re-entering identical times eight times is the kind of drudgery that
makes people give up and enter one date instead — which is how BKa ends up with incomplete agenda
data. One button removes it.

**The two-year cap is explained where it is hit** ([D15](../decisions.md)). Not a validation error
on save, but inline at the point of entry: *"Dates can be set up to 23 October 2028. For a longer
run, add the later dates nearer the time."* A limit the user cannot see is a trap; a limit with a
reason is a constraint.

The date is `lastSchedulableDay(now)` from `@wepublish/event/schedule`, today's Zurich date two
years on (the example assumes today is 23 October 2026). The API counts that whole day
([D40](../decisions.md)), so the copy names no time: an event may end at any time up to 23:59 on it.
An end at midnight belongs to the next day and is refused.

### 5.1 Reuse `ListInput`, and make it keyboard-reorderable

The repeatable row component **already exists**:
`libs/ui/editor/src/lib/atoms/listInput.tsx` (264 lines, `@dnd-kit`, with `arrayMove`, a drag
handle and a delete action). The agenda reuses it three times — explicit dates, prices, images —
rather than introducing a competing component.

It has one real defect. It registers a single sensor:

```ts
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
)
```

**No `KeyboardSensor`, so rows cannot be reordered without a mouse.** The drag handle carries an
`aria-label`, so it announces itself to a screen reader and then does nothing for anyone who
cannot drag. That is worse than an unlabelled control, because it advertises an affordance it does
not provide.

The fix is two lines:

```ts
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
)
```

This is an accessibility fix for the **whole editor**, not just the agenda — `ListInput` is used by
`teaserGridBlock`, `teaserSlotsBlock` and `subscribeBlock` today, all equally mouse-only. Worth
landing as its own change, ahead of and independent of this work.

Beyond the sensor, the component wants the polish the agenda will expose: a row index, denser
layout for many rows, and a duplicate action (§5).

---

## 6. Images

BKa gives each image an ordered position, a main-image star, a caption and alt text. Design 1 §11.1
keeps caption on the join table so `Image.description` can stay alt text.

```
 Images
 ┌──────────────────────────────────────────────────────┐
 │ ⠿ [thumb] ★ Main                                  🗑 │
 │   Caption   [© Joana Magalhaes          ]  58/125    │
 │   Alt text  [                           ]   0/125 ⚠  │
 └──────────────────────────────────────────────────────┘
 + Add images
```

**Alt text is warned about, not enforced.** An empty alt field gets a quiet inline notice
explaining what it is for and who it serves. Blocking save would simply teach people to type `x`,
which is worse than empty because it defeats the screen reader silently rather than visibly.
Caption and alt are visibly separate fields with distinct help text, because BKa users have been
trained by a single "Legende" field and will otherwise put the credit in both.

---

## 7. Ready for review

For a user without `CanPublishEvent` ([D4](../decisions.md)), the top bar's primary action is not
Publish — it is **Ready for review**.

```
 ○ Draft · Last saved 14:02        👁 Preview │ 💾 Save │ ✓ Ready for review
```

After pressing it the control becomes state, not a repeatable action:

```
 ◐ Review requested · 2 days ago   👁 Preview │ 💾 Save │ ⟲ Withdraw request
```

Three things this gets right:

- **It says what will happen.** The confirmation names the recipients — *"Equilibre-Nuithonie will
  be notified that this event is ready to publish."* — so the organiser knows a message is being
  sent on their behalf, to whom, and why. No silent side effects.
- **It is reversible.** *Withdraw request* exists because people press buttons before they are
  ready. Undo is a right, not a feature.
- **It does not lie about progress.** The event stays a draft. Nothing about the state suggests it
  is live or queued for publication.

A user **with** `CanPublishEvent` never sees this control. Showing them a disabled or irrelevant
button to keep one component for both roles would be clutter purchased with confusion.

**Implementation note.** `useAuthorisation` returns `undefined` while roles load, so `!useAuthorisation(X)`
is `true` during that window and the button **will flash** for users who should never see it. Gate
on `=== false`. This is documented in
[`../research/wp-03-permissions-and-roles.md`](../research/wp-03-permissions-and-roles.md) and is
exactly the kind of detail that ships unnoticed.

---

## 8. Organisations and venues

Plain forms following the standard list-and-edit pattern — no block canvas, these are records, not
content.

**Organisations** need one thing the generic pattern does not give: `partner`
([D11](../decisions.md)) controls print eligibility for every event the organisation runs, so it
is labelled by its effect, not its name — *"Partner — events qualify for the print edition"*.

`partner` and `enabled` are shown as editable only to holders of `CanUpdateOtherOrganizations`; the
API refuses a member who changes them (`libs/event/api/src/lib/organization/organization.service.ts:266-280`).
`partner`, `createdByMigration`, the post-office box and the member list are sensitive data
([D37](../decisions.md)): a member sees them for their own organisation, and only holders of
`CanGetOtherOrganizations` or `CanUpdateOtherOrganizations` see them for others. The same goes for the
filters on them.

**Memberless organisations are surfaced** ([D18](../decisions.md)). 315 of 781 — **40%** — have no
members, which means notifications about their venues reach nobody. The list shows a `No members`
marker and offers a filter for it. Both need `CanGetOtherOrganizations` or
`CanUpdateOtherOrganizations`, since membership is sensitive data; the Agenda-Admin has them. BKa redirected that mail to a catch-all address so the problem
stayed invisible for years; making it visible is the substance of D18, not decoration.

**Venues** carry accessibility data from ProInfirmis ([D7](../decisions.md)), which is
**read-only** in the editor with a "Last synced" timestamp and a link to the Ginto entry. It is
synced data, and an editable field that silently loses its value on the next sync is worse than a
read-only one.

**API keys** are not an agenda screen, but the agenda changes them ([D36](../decisions.md)). Built:
the generate panel has an organisation picker (`libs/ui/editor/src/lib/panel/apiTokenGeneratePanel.tsx`,
`organizationSelectPicker.tsx`) listing the creator's own organisations, or all of them for a holder
of `CanUpdateOtherOrganizations`. Once one is picked, the panel stops offering the cross-organisation
permissions and drops any already chosen, as the API would refuse them. The key list shows the key's
organisation, or "Platform key" (`apps/editor/src/app/routes/apiTokens/apiTokenList.tsx`).
It lists only the caller's own keys, or all keys to a holder of `CanGetAllApiTokens`; members do not
see their organisation's keys, and a key disabled by its creator leaving still shows as `Active`
([D41](../decisions.md)).

---

## 9. Expiry warnings

[D15](../decisions.md) caps dates at two years with no auto-extension, so an open-ended weekly
series eventually runs out. Silent expiry would drop an event from the public agenda with no
signal to anyone.

- The event list marks events whose last occurrence falls within 30 days: `Ends in 12 days`.
- The *Past* tab holds what has already lapsed, so it is recoverable rather than lost.
- Extending is one action from the list — it opens the Dates tab with the end date focused.

No email. A notification nobody asked for, about an event that still has a month to run, trains
people to ignore notifications.

---

## 10. States that are not the happy path

The states BKa handles poorly, and what each should say.

| State | What it shows |
| --- | --- |
| No events yet | What the agenda is for, and one `Create your first event` action |
| No search results | The query, and a way to clear it — never a bare "Nothing to show" |
| Empty review queue | *"Nothing waiting for review"* — an achievement, not an error |
| Organisation with no venues | Explains that events need a venue, links to creating one |
| Save failed | What failed, what was kept, and what to do — the draft is never lost to a failed save |
| No permission | Why the action is unavailable and who to ask, not a disabled button with no tooltip |
| Loading a 12,374-occurrence event | Paginated occurrence preview; never render them all |

The current Events list shows `Nothing to show` for a feature with zero rows, which tells a
first-time user nothing at all. That is the baseline to beat.

---

## 11. Accessibility

Non-negotiable for a product that catalogues wheelchair access.

- Every control reachable and operable by keyboard, including row reordering (§5.1).
- The date editor is a fieldset with a legend; the weekday toggles are checkboxes with real labels,
  not unlabelled buttons.
- Live counts (`→ 39 dates`) and the review state announce via `aria-live`.
- Alt text is encouraged with a reason, never auto-filled (§6).
- Status is never colour alone — the `●` / `○` / `◐` marks carry it too, which also survives the
  dark/light theme switch the editor already has.

---

## 12. What has to be built

| | Why |
| --- | --- |
| `KeyboardSensor` on `ListInput` | Two lines; fixes the whole editor, not just the agenda (§5.1) |
| `ListInput` polish | Row index, denser rows, duplicate action |
| The date editor | No equivalent anywhere in the editor — the only genuinely new control |
| Per-entity block allow-list | If it does not already exist (§4.1) |
| Review-state top-bar control | New, but small |
| Dashboard card for the review queue | Extends the existing configurable dashboard |

Everything else is reused unchanged: the list pattern with Filters and Columns, the block canvas,
the Metadata drawer, `ListInput`, the image picker, character counters, status chips and the
publication controls. The agenda should look like a part of this editor that was always there.

---

## 13. Open questions

1. **Is `Agenda` the right nav label?** It matches BKa's public vocabulary but is new to
   We.Publish, and other media adopting this ([D14c](../decisions.md)) may call it something else.
2. **Does per-entity block allow-listing exist?** (§4.1) Changes whether that is a small
   configuration or a framework addition.
3. *(Resolved — [D19](../decisions.md): no. An organiser sees only their own organisation's events;
   seeing others requires the cross-organisation permissions that Agenda-Admin carries.)*
4. *(Resolved — [D40](../decisions.md): whole day. The API counts the whole Zurich calendar day the
   copy names.)*

---

Next: [design 4 — migration and compatibility](04-migration.md).
