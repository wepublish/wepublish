# We.Publish — the current Event feature, in full

**Scope.** This document inventories *everything* in the We.Publish monorepo
(`/Users/itrulia/Documents/wepublish`, branch `master`, commit `360b36ccb`) that implements the
existing Event feature — the one that is to be deleted and replaced by a port of the BKa admin
(`/Users/itrulia/Documents/insitu-admin`). It covers the Prisma model and every relation pointing at
it, the four `libs/event/**` projects file by file with their public exports, every importer of those
projects anywhere in `apps/` and `libs/`, the whole GraphQL surface (SDL, hand-written `.graphql`
documents, generated artifacts), the editor routes/nav/screens/blocks/panels/i18n, the website
builder contract and the 21 tenant Next.js apps that render events, all seeds/fixtures/tests, and the
Nx/tsconfig wiring. It ends with a deletion checklist ordered so the repo keeps compiling, a list of
things that must **not** be deleted, and an impact table per tenant. Everything is grounded in a file
path (and line number where it matters). The We.Publish Postgres database was stopped during this
research, so no row counts or real-usage measurements were taken — claims that would need the
database are marked **UNVERIFIED**.

---

## 1. Executive inventory

| Layer | Artifact | Path |
| --- | --- | --- |
| Database | `enum EventStatus` | `libs/api/prisma/schema.prisma:1382-1387` |
| Database | `model Event` → table `events` | `libs/api/prisma/schema.prisma:1389-1413` |
| Database | `model TaggedEvents` → table `events.tagged-events` | `libs/api/prisma/schema.prisma:1415-1425` |
| Database | back-relation `Image.events Event[]` | `libs/api/prisma/schema.prisma:284` |
| Database | back-relation `Tag.events TaggedEvents[]` | `libs/api/prisma/schema.prisma:1282` |
| Database | `TagType.Event @map("event")` | `libs/api/prisma/schema.prisma:1260` |
| Database | `BlockType.Event @map("event")` | `libs/api/prisma/schema.prisma:1600` |
| Nx project `event-api` | 13 source files + 3 snapshots | `libs/event/api/` |
| Nx project `event-website` | 24 source files (6 components × tsx/spec/stories/mdx) | `libs/event/website/` |
| Nx project `events-import-api` | 17 files | `libs/event/import/api/` |
| Nx project `event-import-editor` | 9 files | `libs/event/import/editor/` |
| API wiring | `EventModule`, `EventsImportModule.registerAsync(...)` | `apps/api-example/src/nestapp/app.module.ts:25,28-30,262,294-301` |
| Block | `EventBlock` API model + resolver | `libs/block-content/api/src/lib/event/` |
| Block | `EventBlock` website component | `libs/block-content/website/src/lib/event/` |
| Block | `EventBlock` editor block + select panel | `libs/ui/editor/src/lib/blocks/eventBlock.tsx`, `libs/ui/editor/src/lib/panel/selectEventsPanel.tsx` |
| Teaser | `EventTeaser` (API/editor/website) | `libs/block-content/api/src/lib/teaser/teaser.model.ts:85-103` et al. |
| Action feed | `EventCreatedAction` | `libs/action/api/src/lib/action.model.ts:105-112` |
| Permissions | 5 permissions | `libs/permissions/src/lib/permissions.ts:685-712` |
| Editor | 5 route screens | `apps/editor/src/app/routes/events/` |
| Editor | routes + nav | `apps/editor/src/app/app.tsx:541-601`, `apps/editor/src/app/base.tsx:808-867` |
| Website | 21 tenant apps with `pages/event/` | see §10.3 |
| Aliases | 4 tsconfig paths | `tsconfig.base.json:58-63` |

**There is no command palette in this repo.** `grep` for `cmdk`, `Cmd+K`, `metaKey && 'k'`,
`routeRegistry`, `commandPalette` over `apps/editor/src` and `libs/ui/editor/src` returns nothing, so
there is no palette registry entry to remove. (A note in the agent memory claims one exists; it does
not exist on `master` at this commit.)

---

## 2. Prisma: the Event model and everything pointing at it

### 2.1 `enum EventStatus` — `libs/api/prisma/schema.prisma:1382-1387`

```prisma
enum EventStatus {
  Cancelled   @map("cancelled")
  Rescheduled @map("rescheduled")
  Postponed   @map("postponed")
  Scheduled   @map("scheduled")
}
```

Postgres type name: `"EventStatus"`, values lower-cased (`cancelled`, `rescheduled`, `postponed`,
`scheduled`) — see `libs/api/prisma/migrations/20221122102944_create_events/migration.sql:2`.

### 2.2 `model Event` — `libs/api/prisma/schema.prisma:1389-1413`

```prisma
model Event {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  name             String
  lead             String?
  description      Json?
  slateDescription Json?
  status           EventStatus @default(Scheduled)

  imageId String?
  image   Image?  @relation(fields: [imageId], references: [id])

  location String?
  startsAt DateTime  @db.Timestamptz(3)
  endsAt   DateTime? @db.Timestamptz(3)

  externalSourceName String?
  externalSourceId   String?

  tags TaggedEvents[]

  @@map("events")
}
```

Observations that matter for the port:

- **Flat model. No revisions.** There is no draft/pending/published triple as `Article`
  (`schema.prisma:10-141`) and `Page` (`832-893`) have. An event has no `publishedAt`, no
  `ArticleRevision`-style child table, no `latest`/`draft`/`pending`/`published` resolvers. It is
  always live the moment it is created.
- **No block content.** The body is a single `description Json?` ProseMirror document (plus a legacy
  `slateDescription Json?` still being migrated, see §2.6), not a `BlockContent[]`.
- **No occurrences.** One row = one date range (`startsAt` / optional `endsAt`). There is no
  equivalent of the BKa `event_occurrences` table.
- **No organizer/organization, no location entity, no videos, no price, no proposer, no
  owner/creator, no locale.** `location` is a free-text `String?`. There is no FK to a user, an
  organization, or a place.
- **No `@@index`.** Unlike `Image` (`schema.prisma:291-294`) the `events` table declares no secondary
  indexes at all, although `EventService` orders by `startsAt`/`endsAt`/`createdAt`/`modifiedAt` and
  filters with `contains … mode: insensitive` on `name` and `location`
  (`libs/event/api/src/lib/event.service.ts:179-335`).
- **`image` FK is `onDelete: Restrict`** (Prisma default for an optional required-side relation — the
  generated SQL at `20221122102944_create_events/migration.sql:30-31` says
  `ON DELETE RESTRICT ON UPDATE CASCADE`), so an image used by an event cannot be deleted.
- **`id` is `String` with a DB-side `gen_random_uuid()` default.** It was a `UUID` column until
  migration `20250904071505_make_all_guids_in_the_database_strings`, which converted it (and
  `TaggedEvents.eventId`) to `TEXT`.

### 2.3 `model TaggedEvents` — `libs/api/prisma/schema.prisma:1415-1425`

```prisma
model TaggedEvents {
  event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId    String
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId      String
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  @@id([eventId, tagId])
  @@map("events.tagged-events")
}
```

Composite PK `(eventId, tagId)`; both FKs `ON DELETE CASCADE`. The Prisma compound-unique input used
by `EventService.updateEvent` is `eventId_tagId`
(`libs/event/api/src/lib/event.service.ts:109-114`).

### 2.4 Every relation / enum member pointing at Event

| Pointing from | Line | Declaration | Direction |
| --- | --- | --- | --- |
| `Image` | `schema.prisma:284` | `events Event[]` | back-relation of `Event.image` |
| `Tag` | `schema.prisma:1282` | `events TaggedEvents[]` | back-relation of `TaggedEvents.tag` |
| `TagType` | `schema.prisma:1260` | `Event @map("event")` | enum member — tags can be of type "event" |
| `BlockType` | `schema.prisma:1600` | `Event @map("event")` | enum member — used by `BlockStyle.blocks BlockType[]` (`1605-1614`) and surfaced in GraphQL as `EditorBlockType.Event` |

Nothing else in `schema.prisma` references `Event`, `TaggedEvents` or `EventStatus`. In particular:
no `Article`, `Page`, `Comment`, `User`, `Subscription`, `AuditLog`, `NotificationRead` or
`ChangelogEntry` relation touches events. `UserEvent` (`1457-1463`) and `SubscriptionEvent`
(`1478-1487`) are unrelated membership/mail enums — see §14.

### 2.5 Raw code that touches the tables directly

| File | Line | Operation |
| --- | --- | --- |
| `libs/event/api/src/lib/event.service.ts` | 43, 47, 77, 92, 102, 143, 175 | `count`, `findMany`, `findUnique` ×2, `update`, `create`, `delete` |
| `libs/event/api/src/lib/event-dataloader.service.ts` | 14 | `findMany({ where: { id: { in } } })` |
| `libs/event/api/src/lib/event-schedule.watcher.ts` | 48 | `findMany` on the next-70s window |
| `libs/event/import/api/src/lib/import/agenda-basel.service.ts` | 85 | `create` from an imported XML event |
| `libs/event/import/api/src/lib/import/kultur-zueri.service.ts` | 85 | `create` from an imported XML event |
| `libs/event/import/api/src/lib/import/events-import.service.ts` | 143 | `findMany({ externalSourceId: { not: null } })` |
| `libs/block-content/api/src/lib/event/event-block.resolver.ts` | 14 | `findMany` by tag-or-id filter |
| `libs/action/api/src/lib/action.service.ts` | 122 | `findMany` for the dashboard activity feed |
| `libs/richtext/api/src/lib/slate-to-pm-migrator.ts` | 387, 403 | `findMany` + `update` — Slate→ProseMirror backfill |
| `libs/tag/api/src/lib/event-tag.dataloader.ts` | 17 | `prisma.taggedEvents.findMany` |
| `apps/api-example/prisma/seed.ts` | 465 | `prisma.event.create` (demo seed) |

### 2.6 Migration history for `events`

| Migration | What it did |
| --- | --- |
| `20221122102944_create_events` | `CREATE TYPE "EventStatus"`, `ALTER TYPE "TagType" ADD VALUE 'event'`, `CREATE TABLE "events"` (with `description JSONB[]` — a Slate array), `CREATE TABLE "events.tagged-events"`, three FKs |
| `20230201123630_generate_pending_migrations` | touches `events` indirectly (bulk pending migration) |
| `20230427142939_event_import` | `ALTER TABLE "events" ADD COLUMN "externalSourceId" TEXT, ADD COLUMN "externalSourceName" TEXT` |
| `20240623111902_add_lead_to_event` | `ALTER TABLE "events" ADD COLUMN "lead" TEXT` |
| `20250904071505_make_all_guids_in_the_database_strings` | `events.id` and `events.tagged-events.eventId` UUID → TEXT; PKs and FKs rebuilt (lines 10-11, 37, 96-103, 149) |
| `20260420120001_migrate_slate_to_prosemirror` | lines 10-13: `ADD COLUMN "slateDescription" JSONB`, copy, `DROP COLUMN "description"`, re-`ADD COLUMN "description" JSONB` |
| `20260817121431_add_timezones_to_dates` | lines 115, 121: `events` and `events.tagged-events` timestamps → `TIMESTAMPTZ(3)` |

Unlike the BKa side, these are Postgres-native from the first migration. There are 179 migration
directories under `libs/api/prisma/migrations/`.

---

## 3. `libs/event/api` — Nx project `event-api`

`tsconfig.base.json:58` → `"@wepublish/event/api": ["libs/event/api/src/index.ts"]`.

### 3.1 Files

| File | Lines | Role |
| --- | --- | --- |
| `src/index.ts` | 7 | barrel |
| `src/lib/event.module.ts` | 36 | `EventModule` |
| `src/lib/event.model.ts` | 153 | GraphQL object/input/args types + 2 registered enums |
| `src/lib/event.service.ts` | 335 | CRUD + filter/sort builders |
| `src/lib/event-dataloader.service.ts` | 46 | request-scoped DataLoader |
| `src/lib/event.resolver.ts` | 98 | queries, mutations, field resolvers |
| `src/lib/event-schedule.watcher.ts` | 74 | 60 s interval cache-invalidation scheduler |
| `src/lib/has-event/has-event.model.ts` | 39 | 4 GraphQL interfaces |
| `src/lib/has-event/has-event.resolver.ts` | 41 | 4 interface field resolvers |
| `src/lib/event.service.spec.ts` | 209 | unit |
| `src/lib/event.service.cache.spec.ts` | 70 | unit |
| `src/lib/event.resolver.spec.ts` | 402 | supertest against an in-process Apollo |
| `src/lib/event-dataloader.service.spec.ts` | 95 | unit |
| `src/lib/event-schedule.watcher.spec.ts` | 149 | unit |
| `src/lib/__snapshots__/*.snap` | 3 files | vitest snapshots |
| `project.json`, `tsconfig*.json`, `vitest.config.ts`, `eslint.config.mjs`, `README.md` | — | build config |

### 3.2 Public exports (`src/index.ts`)

```ts
export * from './lib/event.module';          // EventModule
export * from './lib/event.model';           // EventSort, Event, PaginatedEvents, EventFilter,
                                             // EventListArgs, CreateEventInput, UpdateEventInput
export * from './lib/event.service';         // EventService, createEventOrder
export * from './lib/event-dataloader.service'; // EventDataloaderService

export * from './lib/has-event/has-event.model';    // HasOptionalEvent, HasEvent, HasEventLc, HasOptionalEventLc
export * from './lib/has-event/has-event.resolver'; // HasEventResolver, HasEventLcResolver,
                                                    // HasOptionalEventResolver, HasOptionalEventLcResolver
```

`EventScheduleWatcher` and `EventResolver` are **not** exported; they are only wired inside
`EventModule`.

### 3.3 `EventModule` (`src/lib/event.module.ts`)

```ts
@Module({
  imports: [GraphqlResponseCacheModule, PrismaModule, ImageModule, TagModule],
  providers: [
    EventScheduleWatcher, EventDataloaderService, EventService, EventResolver,
    HasEventResolver, HasEventLcResolver, HasOptionalEventResolver, HasOptionalEventLcResolver,
  ],
  exports: [EventDataloaderService, EventService],
})
export class EventModule {}
```

Dependencies: `@wepublish/kv-ttl-cache/api`, `@wepublish/nest-modules` (Prisma + `URLAdapter`),
`@wepublish/image/api`, `@wepublish/tag/api`, `@wepublish/permissions`,
`@wepublish/authentication/api`, `@wepublish/richtext` + `@wepublish/richtext/api`,
`@wepublish/utils/api`.

### 3.4 `event.model.ts` — the GraphQL shape

- `enum EventSort { CreatedAt, ModifiedAt, StartsAt, EndsAt }` — registered as `EventSort`.
- `registerEnumType(SortOrder, {name: 'SortOrder'})` — **this is where the shared `SortOrder` enum is
  registered for the whole schema** (`event.model.ts:25-27`). See §16, it is not safe to delete
  blindly.
- `registerEnumType(EventStatus, {name: 'EventStatus'})` (Prisma enum).
- `@ObjectType() class Event` — fields `id, createdAt, modifiedAt, startsAt, endsAt?, name, lead?,
  location?, description? (GraphQLRichText), status, imageId?, image?, externalSourceId?,
  externalSourceName?, url`. Note `tags` is **not** declared on the model — it is added by the
  resolver's `@ResolveField(() => [Tag])`.
- `@ObjectType() class PaginatedEvents extends PaginatedType(Event)`.
- `@InputType() class EventFilter { upcomingOnly?, from?, to?, tags?: string[], name?, location? }`.
- `@ArgsType() class EventListArgs { filter?, sort = StartsAt, order = Ascending, take = 10, skip = 0, cursorId? }`.
- `@ArgsType() class CreateEventInput extends PickType(Event, ['name','lead','description','location','imageId','startsAt','endsAt'])` plus `tagIds?: string[]` and `status = Scheduled`.
- `@ArgsType() class UpdateEventInput extends PartialType(CreateEventInput)` plus required `id`.

### 3.5 `event.service.ts`

Constructor: `(private prisma: PrismaClient, private publicContentCache: PublicContentCacheInvalidator)`.

| Method | Behaviour |
| --- | --- |
| `getEvents(EventListArgs)` | `@PrimeDataLoader(EventDataloaderService)`. Runs `count` + `findMany` in parallel, `take = getMaxTake(take) + 1`, cursor via `cursorId`, returns `{nodes, totalCount, pageInfo{hasPreviousPage, hasNextPage, startCursor, endCursor}}`. `hasPreviousPage = Boolean(skip)`. |
| `getEventById(id)` | `findUnique`, throws `NotFoundException` if missing. |
| `updateEvent({id, tagIds, description, ...input})` | Re-reads old event, `validateEvent({...old, ...input})`, `update` with `tags: {connectOrCreate(…eventId_tagId…), deleteMany: {eventId, tagId: {notIn: tagIds}}}`, then `publicContentCache.invalidate()` and `scheduleRefresh`. |
| `createEvent({tagIds, description, ...input})` | `validateEvent(input)`, `create` with `tags.createMany`, then invalidate + schedule. |
| `deleteEvent(id)` | `delete`, then invalidate. **Does not** call `scheduleRefresh`. |
| `scheduleRefresh({startsAt, endsAt})` (private) | `publicContentCache.invalidateAt(startsAt)` and `(endsAt)` |

Module-level helpers:

- `validateEvent` — throws `BadRequestException('endsAt can not be earlier than startsAt')`.
- `createEventOrder(field, sortOrder)` — **exported**; maps `EventSort` → Prisma `orderBy`, default `startsAt`.
- Private filter builders composed by `createEventFilter` into `{AND: [...]}`:
  `createUpcomingOnlyFilter` (`OR: startsAt>=now, endsAt>=now`), `createFromFilter`,
  `createToFilter`, `createTagFilter` (`tags.some.tagId.in`), `createNameFilter`
  (`contains`, `mode: 'insensitive'`), `createLocationFilter` (same).

### 3.6 `event.resolver.ts`

```ts
@Resolver(() => Event)
export class EventResolver {
  constructor(eventService, eventDataloader, urlAdapter, tagDataLoader: EventTagDataloader, imageDataloaderService) {}

  @Public() @Query(() => PaginatedEvents) events(@Args() filter: EventListArgs)
  @Public() @Query(() => Event)           event(@Args('id') id: string)   // NotFoundException if missing
  @Permissions(CanCreateEvent) @Mutation(() => Event) createEvent(@Args() event: CreateEventInput)
  @Permissions(CanUpdateEvent) @Mutation(() => Event) updateEvent(@Args() event: UpdateEventInput)
  @Permissions(CanDeleteEvent) @Mutation(() => Event) deleteEvent(@Args('id') id: string)

  @ResolveField(() => Image, {nullable: true}) image(@Parent() event)
  @ResolveField(() => [Tag],  {nullable: true}) tags(@Parent() parent)   // EventTagDataloader
  @ResolveField(() => String, {nullable: true}) url(@Parent() parent)    // URLAdapter.getEventURL
}
```

`CanGetEvent` is **not** enforced on the read queries — both `events` and `event` are `@Public()`.
`CanGetEvent` is used only by the editor's permission wrappers and by `ActionResolver`
(`libs/action/api/src/lib/action.resolver.ts:12,28`).

### 3.7 `event-dataloader.service.ts`

`@Injectable({scope: Scope.REQUEST})`, implements `Primeable<Event>`, wraps a
`DataLoader<string, Event | null>` named `'EventDataLoader'` backed by
`prisma.event.findMany({where:{id:{in}}})` + `createOptionalsArray(..., 'id')`. Exposes `prime`,
`load`, `loadMany`.

### 3.8 `event-schedule.watcher.ts`

`@Injectable()` implementing `OnApplicationBootstrap` + `OnModuleDestroy`, with
`@Interval(60_000) scheduleUpcoming()` and `LOOKAHEAD_MS = 70_000`. Finds events whose `startsAt` or
`endsAt` falls in `(from, until]`, schedules `PublicationTimers` to call
`publicContentCache.invalidate()` at each boundary, tracks `coveredUntil` so a late run catches up,
and logs (does not throw) on DB errors. Requires `ScheduleModule.forRoot()`, which
`apps/api-example/src/nestapp/app.module.ts:303` provides.

### 3.9 `has-event/`

Four `@InterfaceType()` abstract classes:

| Interface | Fields | Implemented by |
| --- | --- | --- |
| `HasOptionalEvent` | `eventID?: string`, `event?: Event` | `EventTeaser` (`libs/block-content/api/src/lib/teaser/teaser.model.ts:85-93`) |
| `HasEvent` | `eventID!: string`, `event!: Event` | **nothing** — absent from the SDL (`grep '^interface Has' apps/api-example/schema-v2.graphql` lists no `HasEvent`) |
| `HasEventLc` | `eventId!: string`, `event!: Event` | `EventCreatedAction` (`libs/action/api/src/lib/action.model.ts:105-112`) |
| `HasOptionalEventLc` | `eventId?: string`, `event?: Event` | **nothing** — absent from the SDL |

`HasEventResolver` resolves `event` by reading `eventId` *or* `eventID` off the parent and calling the
dataloader; the other three resolvers are empty subclasses registered against their interface.

---

## 4. `libs/event/website` — Nx project `event-website`

`tsconfig.base.json:63` → `"@wepublish/event/website": ["libs/event/website/src/index.ts"]`.

### 4.1 Public exports (`src/index.ts`)

```ts
export * from './lib/event/event';                     // EventWrapper, EventMeta, Event
export * from './lib/event/event-seo';                 // getEventSEO, EventSEO
export * from './lib/event/event-container';           // EventContainerProps, EventContainer
export * from './lib/event-list/event-list';           // EventListWrapper, EventList
export * from './lib/event-list/event-list-container'; // EventListContainerProps, EventListContainer
export * from './lib/event-list/event-list-item';      // eventListItemStyles, EventListItemWrapper,
                                                       // EventListItemContent, EventListItemMeta, EventListItem
```

### 4.2 Components

| Component | File | What it does |
| --- | --- | --- |
| `EventContainer` | `src/lib/event/event-container.tsx` | `useQuery(EventDocument, {variables:{id}})` → renders `useWebsiteBuilder().Event` |
| `Event` | `src/lib/event/event.tsx` | hero image, start/end `<time>` with `MdDateRange`, location with `MdLocationCity` (fallback literal `'Veranstaltungsort noch nicht bekannt'`), `Title`, `RichText`. Exports styled `EventWrapper` (extends `ContentWrapper`) and `EventMeta` |
| `EventSEO` | `src/lib/event/event-seo.tsx` | `getEventSEO()` builds `schema.org/Event` JSON-LD (`startDate`, `endDate`, ISO `duration`, `keywords` from tags, `eventStatus` from `status`, `location`, image block) plus og:/twitter: meta and canonical |
| `EventListContainer` | `src/lib/event-list/event-list-container.tsx` | `useQuery(EventListDocument, {variables})` → `useWebsiteBuilder().EventList` |
| `EventList` | `src/lib/event-list/event-list.tsx` | maps `data.events.nodes` to `EventListItem`, truncating `description` to `descriptionMaxLength` (default `MAX_LENGTH = 225`) via `truncateFirstParagraph` |
| `EventListItem` | `src/lib/event-list/event-list-item.tsx` | `<Link href={url}>` card: image, date range, `H4` name, `lead` or truncated rich text |

Each has a `.spec.tsx` (storyshot-style `composeStories` render test), a `.stories.tsx` and an `.mdx`
docs page. `event-seo.spec.ts` is the one behaviour test (`strips query params from the url used for
canonical and og:url`).

### 4.3 Builder contract — `libs/website/builder/src/lib/event.interface.ts`

```ts
export type BuilderEventProps        = Pick<useQuery.Result<EventQuery, …>, 'data'|'loading'|'error'> & {className?: string};
export type BuilderEventSEOProps     = {event: FullEventFragment};
export type BuilderEventListProps    = Pick<useQuery.Result<EventListQuery, …>, 'data'|'loading'|'error'> & {
  className?: string; variables?: Partial<EventListQueryVariables>;
  descriptionMaxLength?: number; onVariablesChange?: (v: Partial<EventListQueryVariables>) => void;
};
export type BuilderEventListItemProps = FullEventFragment & {className?: string};
```

Exported from the builder barrel at `libs/website/builder/src/index.ts:7`. Registered on the builder
context at `libs/website/builder/src/lib/website-builder.context.tsx:168-171` (component slots
`Event`, `EventSEO`, `EventList`, `EventListItem`), defaulted to `NoComponent` at `327-330`, with
`blocks.Event: ComponentType<BuilderEventBlockProps>` at `255` defaulted at `400`.
`BuilderEventBlockProps = WithBlockProps<FullEventBlockFragment>` lives at
`libs/website/builder/src/lib/blocks.interface.ts:76`.

### 4.4 Default wiring — `libs/website/src/lib/website.provider.tsx`

- line 31 — imports `EventBlock` from `@wepublish/block-content/website`
- lines 80-84 — imports `Event, EventList, EventListItem, EventSEO` from `@wepublish/event/website`
- lines 226-229 — passes them as `Event=`, `EventSEO=`, `EventList=`, `EventListItem=`
- line 299 — `blocks={{ …, Event: EventBlock, … }}`

---

## 5. `libs/event/import/api` — Nx project `events-import-api`

`tsconfig.base.json:59` → `"@wepublish/event/import/api": ["libs/event/import/api/src/index.ts"]`.

> Naming wart: the Nx project is `events-import-api` (`project.json:2`) but the Vitest project name
> is `event-import-api` (`vitest.config.ts:4`) and `README.md` tells you to run
> `nx test event-import-api`, which does not exist.

### 5.1 Public exports (`src/index.ts`)

```ts
export * from './lib/events-import.module';        // EventsImportModule, EventsImportOptionsFactory, EventsImportAsyncOptions
export * from './lib/import/agenda-basel.service'; // AgendaBaselService
export * from './lib/import/kultur-zueri.service'; // KulturZueriService
export * from './lib/import/events-import.service';// EVENT_IMPORT_PROVIDER, EventsImportService, EventsProvider,
                                                   // ImportedEvents/Event/Create*Params interfaces
export * from './lib/import/kulturagenda-parser';  // KulturagendaParser
```

`EventsImportResolver` and the models (`EventFromSource`, `ImportedEventFilter`, …) are **not**
re-exported.

### 5.2 Files

| File | Lines | Role |
| --- | --- | --- |
| `src/lib/events-import.module.ts` | 115 | `EventsImportModule` with `.register(providers)` and `.registerAsync({useFactory\|useClass\|useExisting})` |
| `src/lib/import/events-import.model.ts` | 77 | `ImportedEventSort`, re-`registerEnumType(EventStatus)`, `EventFromSource extends OmitType(Event, ['imageId','image','url'])` + `imageUrl?`, `PaginatedEventsFromSources`, `ImportedEventFilter`, `SingleEventFilter`, `ImportEventArgs` |
| `src/lib/import/events-import.resolver.ts` | 77 | 4 queries + 1 mutation |
| `src/lib/import/events-import.service.ts` | 159 | fan-out across providers, in-memory sort/filter/paginate, `importedEventsIds`, `getProviders` |
| `src/lib/import/agenda-basel.service.ts` | 100 | provider `AgendaBasel`, url `https://www.agendabasel.ch/xmlexport/kzexport-basel.xml`, 8 h cache |
| `src/lib/import/kultur-zueri.service.ts` | 100 | provider `KulturZueri`, url `https://www.kulturzueri.ch/xmlexport/kzexport.xml`, 8 h cache |
| `src/lib/import/kulturagenda-parser.ts` | 138 | `xml2js` parse of the `kdz:exportActivities` format → `EventFromSource[]`, with `generateJSON` (tiptap) for the description |
| `src/lib/import/xmlTypes.ts` | 55 | `XMLEventType` and friends |
| 5 spec files | 603 | unit |
| `__tests__/prisma/seed.ts` | 52 | integration seed (users only; delegates to `libs/api/prisma/seed`) |
| `package.json` | 6 | points `prisma.schema` at `../../../api/prisma/schema.prisma`, `prisma.seed` at `npx tsx __tests__/prisma/seed.ts` |

### 5.3 GraphQL surface it adds

| Operation | Permission | Returns |
| --- | --- | --- |
| `importedEvents(filter, order, skip, take, sort)` | `CanGetImportedEvents` | `PaginatedEventsFromSources!` |
| `importedEvent(filter: SingleEventFilter!)` | `CanGetImportedEvents` | `EventFromSource!` |
| `importedEventsIds` | `CanGetImportedEvents` | `[String!]!` |
| `eventProviders` | `CanGetImportedEvents` | `[String!]!` |
| `importEvent(id, source)` | `CanCreateEvent` | `String!` (the new event id) |

### 5.4 `createEvent` in the providers

Both `AgendaBaselService` and `KulturZueriService` have the identical body
(`agenda-basel.service.ts:63-97`, `kultur-zueri.service.ts:63-97`): find the parsed event, if it has
an `imageUrl` then `imageFetcher.fetch(url)` → `mediaAdapter.uploadImageFromArrayBuffer` →
`prisma.image.create`, then `prisma.event.create({name, description, location, startsAt, imageId,
endsAt, externalSourceName, externalSourceId})` and return the id. Note: `lead`, `status` and tags
are never set on import.

---

## 6. `libs/event/import/editor` — Nx project `event-import-editor`

`tsconfig.base.json:60-62` → `"@wepublish/event/import/editor": ["libs/event/import/editor/src/index.ts"]`.

Single component, `src/lib/importable-event-list.tsx` (203 lines), exporting
`EventStartsAtView`, `EventEndsAtView`, a default-exported raw `ImportableEventListView`, and the
named `ImportableEventListView` wrapped in
`createWithV2ApiClient(createCheckedPermissionComponent([CanGetEvent.id, CanCreateEvent.id,
CanUpdateEvent.id, CanDeleteEvent.id])(…))`. The barrel `src/index.ts` re-exports that module.

It renders a `DataTable` over `ImportedEventListDocument` with
`IMPORTABLE_EVENT_FILTER_FIELDS = ['dates','providers','name','location']`, greys out rows whose id
is in `ImportedEventsIdsDocument`, and on import fires `ImportEventDocument` then navigates to
`/events/edit/${data.importEvent}`.

Accompanied by `importable-event-list.spec.tsx` (2 tests) and a snapshot.

---

## 7. Every importer of the four entry points

### 7.1 `@wepublish/event/api` (10 importers)

| File | Line | Uses |
| --- | --- | --- |
| `apps/api-example/src/nestapp/app.module.ts` | 25, 262 | `EventModule` |
| `libs/block-content/api/src/lib/block-content.module.ts` | 9, 34 | `EventModule` |
| `libs/block-content/api/src/lib/event/event-block.model.ts` | 4 | `Event` (field type of `EventBlock.events`) |
| `libs/block-content/api/src/lib/event/event-block.resolver.ts` | 4 | `Event`, `EventDataloaderService` |
| `libs/block-content/api/src/lib/teaser/teaser.model.ts` | 13 | `Event`, `HasOptionalEvent` |
| `libs/block-content/api/src/lib/teaser/teaser-list.resolver.ts` | 24, 31, 114-136 | `EventService`, `EventSort` |
| `libs/block-content/api/src/lib/teaser/slot-teasers-loader.ts` | 10, 100, 335-357, 380-381 | `EventService`, `EventSort` |
| `libs/action/api/src/lib/action.model.ts` | 15, 105-112 | `Event`, `HasEventLc` |
| `libs/action/api/src/lib/action.resolver.spec.ts` | 10 | `Event` (test) |
| `libs/article/api/src/lib/slot-teasers-loader.spec.ts` | 20, 252, 311 | `EventService` (mocked provider; the spec exists to reproduce the module-cycle boot error, see `.claude/docs/gotchas.md:505-520`) |
| `libs/event/import/api/src/lib/import/events-import.model.ts` | 10 | `Event` (base of `EventFromSource`) |

### 7.2 `@wepublish/event/website` (45 importers)

Grouped:

| Kind | Files | Imports |
| --- | --- | --- |
| Default provider | `libs/website/src/lib/website.provider.tsx:80-84` | `Event, EventList, EventListItem, EventSEO` |
| Detail page (21 apps) | `apps/{babanews,bajour,cultur,demo,factuel,fazetten,flimmer,ganzgraz,gruppetto,hauptstadt,kunstbulletin,mannschaft,mediamakerscamp,munotgloeggli,neuewege,onlinereports,tsri,website-example,wepublish-site,wnti,zwoelf}/pages/event/[id].tsx:2` | `EventContainer` |
| List page (21 apps) | same 21 apps, `pages/event/index.tsx` | `EventListContainer` |
| Tenant overrides | `apps/ganzgraz/src/components/ganzgraz-event.tsx:8` | `EventSEO` |
| | `apps/hauptstadt/src/components/hauptstadt-event.tsx:1` | `Event` |
| | `apps/tsri/src/components/tsri-event.tsx:3` | `EventSEO`, `EventWrapper` |
| | `apps/tsri/src/components/tsri-event-list-item.tsx:2` | `EventList` |

### 7.3 `@wepublish/event/import/api` (1 importer)

`apps/api-example/src/nestapp/app.module.ts:28-30, 294-301`:

```ts
EventsImportModule.registerAsync({
  useFactory: (agendaBasel: AgendaBaselService, kulturZueri: KulturZueriService) => [agendaBasel, kulturZueri],
  inject: [AgendaBaselService, KulturZueriService],
}),
```

### 7.4 `@wepublish/event/import/editor` (1 importer)

`apps/editor/src/app/app.tsx:27` → `ImportableEventListView`, used at line 598 on route
`events/import`.

---

## 8. GraphQL surface

### 8.1 Generated SDL — `apps/api-example/schema-v2.graphql`

| Line | Definition |
| --- | --- |
| 1090-1107 | `type Event` — `createdAt, description: RichText, endsAt, externalSourceId, externalSourceName, id: String!, image: Image, imageId, lead, location, modifiedAt, name: String!, startsAt: DateTime!, status: EventStatus!, tags: [Tag!], url: String!` |
| 1109-1116 | `type EventBlock implements BaseBlock { blockStyle, blockStyleName, disabled, events: [Event!]!, filter: EventBlockFilter!, type }` |
| 1118-1121 | `type EventBlockFilter { events: [String!], tags: [String!] }` |
| 1123-1126 | `input EventBlockFilterInput { events: [String!] = [], tags: [String!] = [] }` |
| 1128-1133 | `input EventBlockInput { blockStyle, blockStyleName, disabled, filter: EventBlockFilterInput! }` |
| 1135-1140 | `type EventCreatedAction implements BaseAction & HasEventLc { actionType, date, event: Event!, eventId: String! }` |
| 1142-1149 | `input EventFilter { from, location, name, tags: [String!], to, upcomingOnly }` |
| 1151-1165 | `type EventFromSource` — the `Event` shape minus `imageId/image/url`, plus `imageUrl: String` |
| 1167-1172 | `enum EventSort { CreatedAt, EndsAt, ModifiedAt, StartsAt }` |
| 1174-1179 | `enum EventStatus { Cancelled, Postponed, Rescheduled, Scheduled }` |
| 1181-1190 | `type EventTeaser implements BaseTeaser & HasImage & HasOptionalEvent { event, eventID, image, imageID, lead, preTitle, title, type }` |
| 1192-1198 | `input EventTeaserInput { eventID, imageID, lead, preTitle, title }` |
| 1410-1413 | `interface HasEventLc { event: Event!, eventId: String! }` |
| 1449-1452 | `interface HasOptionalEvent { event: Event, eventID: String }` |
| 1680-1686 | `input ImportedEventFilter { from, location, name, providers: [String], to }` |
| 1688-1693 | `enum ImportedEventSort { CREATED_AT, ENDS_AT, MODIFIED_AT, STARTS_AT }` |
| 3619-3623 | `type PaginatedEvents { nodes: [Event!]!, pageInfo, totalCount }` |
| 3625-3629 | `type PaginatedEventsFromSources { nodes: [EventFromSource!]!, pageInfo, totalCount }` |
| 5179-5182 | `input SingleEventFilter { id: String!, source: String! }` |
| 9 | `union Action = … \| EventCreatedAction \| …` |
| 46 | `enum ActionType { …, EventCreated, … }` |
| 421 | `union BlockContent = … \| EventBlock \| …` |
| 429 | `input BlockContentInput { …, event: EventBlockInput, … }` |
| 506 | `enum BlockType { …, Event, … }` |
| 1070 | `enum EditorBlockType { …, Event, … }` |
| 5479 | `enum TeaserListBlockSort`/`TeaserType` region — `Event` |
| 5483 | `union Teaser = ArticleTeaser \| CustomTeaser \| EventTeaser \| PageTeaser` |
| 5524 | `input TeaserInput { …, event: EventTeaserInput, … }` |
| 5626 | `enum TeaserType { …, Event, … }` |

Queries (`Query` type):

```graphql
"""Returns an event by id."""
event(id: String!): Event!                                                                    # :4453
eventProviders: [String!]!                                                                     # :4456
"""Returns a paginated list of events based on the filters given."""
events(cursorId: String, filter: EventFilter, order: SortOrder = Ascending,
       skip: Int = 0, sort: EventSort = StartsAt, take: Int = 10): PaginatedEvents!            # :4459
importedEvent(filter: SingleEventFilter!): EventFromSource!                                    # :4515
importedEvents(filter: ImportedEventFilter, order: Int, skip: Int,
               sort: ImportedEventSort, take: Int): PaginatedEventsFromSources!                # :4518
importedEventsIds: [String!]!                                                                  # :4521
```

Mutations:

```graphql
createEvent(description: RichText, endsAt: DateTime, imageId: String, lead: String,
            location: String, name: String!, startsAt: DateTime!,
            status: EventStatus! = Scheduled, tagIds: [String!]): Event!                       # :2749
deleteEvent(id: String!): Event!                                                               # :2925
importEvent(id: String!, source: String!): String!                                             # :3051
updateEvent(description: RichText, endsAt: DateTime, id: String!, imageId: String,
            lead: String, location: String, name: String, startsAt: DateTime,
            status: EventStatus = Scheduled, tagIds: [String!]): Event!                        # :3254
```

### 8.2 Hand-written documents — editor

`libs/editor/api/src/lib/schemas/events.graphql` (108 lines):

- `fragment FullEvent on Event` — `id, name, lead, description, status, location, image{...FullImage},
  tags{...FullTag}, startsAt, endsAt, createdAt, modifiedAt, url, externalSourceName, externalSourceId`
- `query EventList($filter, $cursorId, $take, $skip, $order, $sort)`
- `query Event($id: String!)`
- `mutation CreateEvent($name!, $lead, $description, $location, $startsAt!, $endsAt, $imageId, $tagIds)`
  — note: **no `status`** on create
- `mutation UpdateEvent($id!, $name, $lead, $description, $status, $location, $startsAt, $endsAt, $imageId, $tagIds)`
- `mutation DeleteEvent($id: String!)`

`libs/editor/api/src/lib/schemas/imported-events.graphql` (49 lines):

- `fragment ImportableEventRef on EventFromSource`
- `query ImportedEventList`, `query ImportedEvent`, `query ImportedEventsIds`, `query EventProviders`
- `mutation ImportEvent($id: String!, $source: String!)`

Event fragments embedded in other editor documents:

| File | Lines | Fragment |
| --- | --- | --- |
| `libs/editor/api/src/lib/schemas/block.graphql` | 67-81 | `... on EventBlock { disabled, blockStyle, blockStyleName, type, filter{tags, events}, events{...FullEvent} }` |
| `libs/editor/api/src/lib/schemas/block.graphql` | 399-412 | `... on EventTeaser { image{...FullImage}, type, preTitle, title, lead, event{...} }` |
| `libs/editor/api/src/lib/schemas/action.graphql` | 102-109 | `... on EventCreatedAction { date, event{id,name,location} }` |

### 8.3 Hand-written documents — website

`libs/website/api/src/lib/schemas/event.graphql` (52 lines):

- `fragment FullEvent on Event` — `id, name, lead, description, status, location, image{...FullImage},
  tags{...FullTag}, startsAt, endsAt, url` (no `createdAt/modifiedAt/externalSource*`)
- `query EventList($filter, $cursor, $take, $skip, $order, $sort)` — note the variable is `$cursor`
  here, mapped to `cursorId:`
- `query Event($id: String!)`

| File | Lines | Fragment |
| --- | --- | --- |
| `libs/website/api/src/lib/schemas/block-content.graphql` | 45-58 | `fragment FullEventTeaser on EventTeaser` |
| `libs/website/api/src/lib/schemas/block-content.graphql` | 199-205 | `fragment FullEventBlock on EventBlock { disabled, blockStyle, events{...FullEvent} }` |
| `libs/website/api/src/lib/schemas/block-content.graphql` | 373-375, 491-493 | the two spread sites in the block/teaser unions |
| `libs/website/api/src/lib/schemas/sitemap.graphql` | 105-110 | `... on EventTeaser { event { id modifiedAt } }` |

### 8.4 Generated artifacts that would break

The repo uses graphql-codegen's **client preset** — there are no `use*Query`/`use*Mutation` hooks.
"Generated hooks" means the `TypedDocumentNode` consts.

`libs/editor/api/src/lib/gql/graphql.ts`:

| Export | Line |
| --- | --- |
| `FullEventFragmentDoc` | 6894 |
| `ImportableEventRefFragmentDoc` | 6929 |
| `EventListDocument` | 7059 |
| `EventDocument` | 7060 |
| `CreateEventDocument` | 7061 |
| `UpdateEventDocument` | 7062 |
| `DeleteEventDocument` | 7063 |
| `ImportedEventListDocument` | 7080 |
| `ImportedEventDocument` | 7081 |
| `ImportedEventsIdsDocument` | 7082 |
| `EventProvidersDocument` | 7083 |
| `ImportEventDocument` | 7084 |

plus the types `FullEventFragment` (4340), `EventListQuery(Variables)` (4348/4358),
`EventQuery(Variables)` (4363/4368), `CreateEventMutation(Variables)` (4373/4385),
`UpdateEventMutation(Variables)` (4390/4404), `DeleteEventMutation(Variables)` (4409/4414),
`ImportableEventRefFragment` (4629), `ImportedEventListQuery(Variables)` (4631/4640),
`ImportedEventQuery(Variables)` (4645/4650), `ImportedEventsIdsQuery(Variables)` (4655/4658),
`EventProvidersQuery(Variables)` (4660/4663), `ImportEventMutation(Variables)` (4665/4671).

`libs/website/api/src/lib/gql/graphql.ts`: `FullEventFragmentDoc` (3992),
`FullEventBlockFragmentDoc` (3993), `FullEventTeaserFragmentDoc` (4027), `EventListDocument` (4085),
`EventDocument` (4086); types `EventFilter` (171), `FullEventTeaserFragment` (745),
`FullEventBlockFragment` (788), `FullEventFragment` (1752), `EventListQuery(Variables)` (1760/1770),
`EventQuery(Variables)` (1775/1780).

Other generated files carrying `Event` schema types (all regenerated by `graphql-codegen`, all listed
in `codegen.yml`):

- `libs/editor/api/src/lib/schema-types.ts` and `libs/website/api/src/lib/schema-types.ts`
  (`Event`, `EventBlock*`, `EventCreatedAction`, `EventFilter`, `EventFromSource`, `EventSort`,
  `EventStatus`, `EventTeaser*`, `HasEventLc`, `HasOptionalEvent`, `ImportedEvent*`,
  `PaginatedEvents*`, `SingleEventFilter`)
- `libs/editor/api/src/index.ts` / `libs/website/api/src/index.ts` — **generated** by
  `tools/generateApiIndex.js` (codegen `afterAllFileWrite` hook); the event names are at
  `libs/editor/api/src/index.ts:71-76, 92, 100, 214, 261, 298, 347, 405-406, 484-485, 496-497` and
  `libs/website/api/src/index.ts:94-102, 125, 133, 166, 270, 317, 354, 403, 466-467, 554-555,
  566-567, 671, 770`
- `libs/editor/api/src/lib/possible-types.ts` / `libs/website/api/src/lib/possible-types.ts`
  (`EventCreatedAction`, `EventBlock`, `EventTeaser` under the unions/interfaces)
- `libs/peering/api/src/lib/remote/schema.ts` (27 event lines) — generated, nothing peering-side
  queries events
- `libs/testing/src/graphql/schema-public.ts` (23 event lines) — generated; no event `.graphql`
  document exists under `libs/testing/src/graphql/public/`
- `libs/api/__tests__/api/public/index.ts` and `.../private/index.ts` — stale generated files, not
  listed in `codegen.yml` and not imported anywhere (`grep -rn "__tests__/api"` over `libs/`,
  `apps/`, `tools/` and the yml files finds nothing)

---

## 9. Editor

### 9.1 Routes — `apps/editor/src/app/app.tsx:541-601`

| Path | Element | Imported at |
| --- | --- | --- |
| `events` | `<EventListView />` | line 73 (`./routes/events/eventListView`) |
| `events/create` | `<EventCreateView />` | line 71 |
| `events/edit/:id` | `<EventEditView />` | line 72 |
| `events/tags` | `<TagList type={TagType.Event} />` | shared tag screen |
| `events/tags/create` | `<TagCreateView type={TagType.Event} />` | shared |
| `events/tags/edit/:id` | `<TagEditView />` | shared (untyped) |
| `events/import` | `<ImportableEventListView />` | line 27 (`@wepublish/event/import/editor`) |

### 9.2 Navigation — `apps/editor/src/app/base.tsx:808-867`

A `SidebarNavMenu` titled `t('navbar.events')` with icon `MdEvent`, gated by
`[CanGetEvent.id, CanGetCommentRatingSystem.id]` (the second permission looks like a copy/paste bug),
containing:

- `/events` → `t('navbar.events')`, icon `MdEvent`, gated `[CanGetEvent, CanUpdateEvent, CanDeleteEvent]`
- `/events/import` → `t('navbar.importableEvents')`, icon `MdEventAvailable` — **commented out**
  (`base.tsx:836-848`), so the import screen is reachable only by typing the URL
- `/events/tags` → `t('navbar.eventTags')`, icon `MdSell`, gated on the tag permissions

Permission imports at `base.tsx:42` (`CanDeleteEvent`), `:72` (`CanGetEvent`), `:117`
(`CanUpdateEvent`); icon imports at `:155` (`MdEvent`).

### 9.3 Screens — `apps/editor/src/app/routes/events/`

| File | Lines | What it is |
| --- | --- | --- |
| `eventListView.tsx` | 230 | `DataTable` over `EventListDocument`. `EVENT_FILTER_FIELDS = ['dates','name','location']`, `tagType={TagType.Event}`, `storageKey="events"`. Columns: name (link to edit), startsAt, endsAt, source (`externalSourceName`, with an `InfoTooltip`), delete action. Wrapped in `createCheckedPermissionComponent([CanGetEvent, CanCreateEvent, CanUpdateEvent, CanDeleteEvent])`. Also exports `EventStartsAtView` / `EventEndsAtView`. |
| `eventCreateView.tsx` | 67 | `react-hook-form` + `zodResolver(eventSchema)`, `defaultValues {name:'', startsAt:''}`, `CreateEventDocument`, navigates to `/events/edit/:id` or back to `/events` |
| `eventEditView.tsx` | 112 | async `defaultValues` via `client.query(EventDocument)` → `mapApiDataToInput`, `UpdateEventDocument`, `form.reset` on success, sends `endsAt: event.endsAt \|\| null` |
| `eventForm.tsx` | 330 | the shared form. `eventSchema` (zod) with a `.refine` that `endsAt >= startsAt`. Two cards: left = name, (read-only) external source, location, startsAt/endsAt `DateTimePicker`s, lead (3-row multiline), description (`RichTextBlock`); right = status select (hidden when `create`), tags (`SelectTags tagType={TagType.Event}`), image (`ChooseEditImage` + `ImageSelectPanel`/`ImageEditPanel` drawers) |
| `deleteEventModal.tsx` | 91 | MUI `Dialog` firing `DeleteEventDocument` |

### 9.4 Editor block & panels — `libs/ui/editor`

| File | Lines | Event content |
| --- | --- | --- |
| `src/lib/blocks/eventBlock.tsx` | 191 | `EventBlock` block component (`PlaceholderInput` → `SelectEventPanel` drawer, shows up to 4 `EventPreview` cards + a count). Also exports `EventStartsAtView`, `EventEndsAtView` |
| `src/lib/blocks/index.ts` | 12 | `export * from './eventBlock'` |
| `src/lib/blocks/blockMap.tsx` | 15, 41, 370-376 | registers `[EditorBlockType.Event]` with `defaultValue {filter:{}, events:[], blockStyle: undefined}`, label `blocks.event.label`, icon `MdEvent` |
| `src/lib/blocks/types.ts` | 9, 48-60, 195-201, 357-390, 526-528, 559, 599-610, 1037-1045, 1419, 1487, 1566-1577, 1629-1640 | `EventBlockValue`, `EventBlockListValue`, `EventTeaserLink`/`EventTeaser`, both directions of the block/teaser ↔ GraphQL mapping |
| `src/lib/panel/selectEventsPanel.tsx` | ~230 | `SelectEventPanel` — paginated `EventListDocument` table with a tag filter (`SelectTags tagType={TagType.Event}`) and a "cherry pick" switch; links each row to `/events/edit/:id` |
| `src/lib/panel/index.ts` | 28 | `export * from './selectEventsPanel'` |
| `src/lib/panel/teaserSelectPanel.tsx` | 27-28, 41, 106, 158, 171-187, 229-240, 286-305, 443-480 | the Events tab of the teaser picker, including an `upcomingOnly` toggle and `fetchMore` cursor paging |
| `src/lib/panel/teaserEditPanel.tsx` | 344, 368-372 | maps an `EventTeaser` to preview image/title/lead |
| `src/lib/panel/teaserListConfigPanel.tsx` | 44, 57-58, 136 | `TeaserType.Event` in the teaser-list config enum, `TagType.Event` lookup |
| `src/lib/blocks/teaserSlots/teaser-slots-autofill-config.tsx` | 70-80, 102 | `TeaserType.Event → TagType.Event` and the `MenuItem` |
| `src/lib/listView/list-view-filters.tsx` | 12-15, 108-120, 140-143, 340-358, 380-400 | `EventFilter`/`ImportedEventFilter`/`EventProvidersDocument`; the `'name'`, `'location'` and `'providers'` filter fields exist **only** for events/imported events |
| `src/lib/atoms/dashboard/activityFeed.tsx` | 66, 314-321 | `ActionType.EventCreated` tile → link `/events/edit/:id`, title `event.name`, excerpt `event.location` |
| `src/lib/atoms/teaserOverview/TeaserCard.tsx` | 23, 386-389 | `EventTeaser` preview |
| `src/lib/atoms/teaserOverview/extractTeasers.ts` | 100-101 | dedupe key `event:${teaser.event?.id}` |
| `src/lib/atoms/teaserOverview/TeaserOverviewPanel.tsx` | 251 | `TeaserType.Event` in the type list |

### 9.5 i18n keys (editor, `de.json` / `en.json` / `fr.json`)

Pure-event keys (49 in `de`):

```
blocks.event.{cherryPick, cherryPickInfo, chooseEvents, edit, events_one, events_other,
              eventsFilterByTagInformation, filterByTag, label, title}
dashboard.activityTypes.EventCreated
dashboard.newEvent
event.create.title
event.delete.{body, delete, title}
event.edit.title
event.form.{cancelled, description, endsAt, externalSource, image, lead, location, name,
            postponed, rescheduled, scheduled, startsAt, status, statusInfo, tags}
event.list.{create, edit, endsAt, endsAtHeader, endsAtNone, name, source, sourceInfo,
            startsAt, startsAtHeader, title, upcomingOnly}
importableEvent.{import, imported, title}
navbar.{events, eventTags, importableEvents}
resources.teaserType.event
teaserOverview.teaserTypes.Event
```

Shared keys that outlive events: `filterableList.filter.{name, location, providers, dates}`
(`providers`, `name` and `location` become dead; `dates` is also used by `PollVoteList`).

**Not** event keys: everything under `subscriptionFlow.*` and `systemMails.events.*` (§14).

---

## 10. Website

### 10.1 Block-content integration

| Layer | File | Content |
| --- | --- | --- |
| API model | `libs/block-content/api/src/lib/event/event-block.model.ts` | `EventBlockFilter {tags, events}`, `EventBlockFilterInput`, `EventBlock extends BaseBlock<BlockType.Event>`, `EventBlockInput` |
| API resolver | `libs/block-content/api/src/lib/event/event-block.resolver.ts` | `@ResolveField events` → `prisma.event.findMany({OR:[{tags.some.tagId.in}, {id.in}]})`, primed into `EventDataloaderService` |
| API union/input | `libs/block-content/api/src/lib/block-content.model.ts:17, 122, 169-170, 245-246` | `EventBlock` in the `BlockContent` union and `event` in `BlockContentInput` |
| API enum | `libs/block-content/api/src/lib/block-type.model.ts:31` | `Event = 'event'` |
| API module | `libs/block-content/api/src/lib/block-content.module.ts:4, 9, 34, 43` | imports `EventModule`, provides `EventBlockResolver` |
| Website component | `libs/block-content/website/src/lib/event/event-block.tsx` | `isEventBlock`, `EventBlockWrapper` (styled `aside`, auto-fit grid, `minmax(350px,1fr)`), `EventBlock` which maps each event through `truncateFirstParagraph(255)` into `EventListItem` |
| Website barrel | `libs/block-content/website/src/index.ts:39` | `export * from './lib/event/event-block'` |
| Website renderer | `libs/block-content/website/src/lib/blocks.tsx:7, 45, 428-432` | `[isEventBlock, block => <blocks.Event {...block} />]` |

### 10.2 Teaser integration

| Layer | File:lines |
| --- | --- |
| API | `libs/block-content/api/src/lib/teaser/teaser.model.ts:13, 19, 85-103, 131, 138-139, 155-156` |
| API list resolver | `libs/block-content/api/src/lib/teaser/teaser-list.resolver.ts:114-136` |
| API slot loader | `libs/block-content/api/src/lib/teaser/slot-teasers-loader.ts:335-357, 377-385` |
| Website base teaser | `libs/block-content/website/src/lib/teaser/base-teaser.tsx:29-30, 49, 65-70, 88-89, 116-117, 145-146, 203, 231-232` — title, pre-title, lead (`lead \|\| firstParagraph(description)`), href (`event.url`), image (`teaser.image ?? event.image`), date (`event.startsAt`), main tags |
| Website grid | `libs/block-content/website/src/lib/teaser/teaser-grid-block.tsx:54` |
| Website sitemap lastmod | `libs/feed/website/src/lib/sitemap/homepage-lastmod.ts:8, 21` — `teaser?.event?.modifiedAt` |

### 10.3 Tenant Next.js apps

21 of the 27 apps carry `pages/event/[id].tsx` + `pages/event/index.tsx`. `apps/api-example`,
`apps/editor`, `apps/media` are not websites; `apps/eenews` and `apps/reflekt` are websites **without**
event pages; `apps/bka` is an empty stub (only `.env.local`, a stale `.next/`, a
`deployment.config.json` with every deployment `false`, and a `tsconfig.tsbuildinfo` — no
`project.json`, no `pages/`).

| App | `event/[id].tsx` | `event/index.tsx` | Custom components | prod deploy |
| --- | --- | --- | --- | --- |
| babanews | 52 | 199 | — | disabled (`deployment.config.json_disable`) |
| bajour | 69 | 201 | — | true |
| cultur | 52 | 200 | — | true |
| demo | 52 | 199 | — | false |
| factuel | 52 | 199 | — | true |
| fazetten | 52 | 186 | — | true |
| flimmer | 52 | 178 | — | true |
| ganzgraz | 52 | 319 | `ganzgraz-event.tsx` (277), `ganzgraz-event-list-item.tsx` (191) | true |
| gruppetto | 50 | 199 | — | true |
| hauptstadt | 50 | 199 | `hauptstadt-event.tsx` (6, `createWithTheme(Event, contentTheme)`) | true |
| kunstbulletin | 52 | 199 | — | true |
| mannschaft | 51 | 199 | — | true |
| mediamakerscamp | 52 | 199 | — | true |
| munotgloeggli | 52 | 199 | — | true |
| neuewege | 52 | 199 | — | true |
| onlinereports | 52 | 199 | — | true |
| tsri | 52 | 312 | `tsri-event.tsx` (159), `tsri-event-list-item.tsx` (416), `event-list-filter.ts` (80) + spec | true |
| website-example | 52 | 199 | — | `.json.example` only |
| wepublish-site | 51 | 200 | — | true |
| wnti | 52 | 178 | — | true |
| zwoelf | 52 | 199 | — | true |

Builder overrides registered in `_app.tsx`:

| App | Line | Override |
| --- | --- | --- |
| ganzgraz | `pages/_app.tsx:153-154` | `EventListItem={GanzGrazEventListItem}`, `Event={GanzGrazEvent}` |
| hauptstadt | `pages/_app.tsx:180` | `Event={HauptstadtEvent}` |
| tsri | `pages/_app.tsx:180-182` | `Event={TsriEvent}`, `EventList={TsriEventListView}`, `EventListItem={TsriEventListItem}` |

Every other app uses the defaults from `libs/website/src/lib/website.provider.tsx`.

The list page in the 18 "plain" apps is the same ~199-line file: a `pageSchema` zod parse of
`{page, upcomingOnly (default true), from, to}`, `take = 25`, two `DateTimePicker`s plus an
"Nur bevorstehende" checkbox, `<EventListContainer variables={variables} />`, a `Pagination`, and a
`getStaticProps` that pre-warms `EventListDocument` + `NavigationListDocument` +
`PeerProfileDocument` with `revalidate: 60`. The detail page is a 50-52 line
`EventContainer id={router.query.id}` with `getStaticPaths {paths: [], fallback: 'blocking'}` and a
404 branch on `CombinedGraphQLErrors` + `extensions.status === 404`.

tsri and ganzgraz replace the two date pickers with a `ToggleButtonGroup` of
today/tomorrow/next7/next30/upcoming and their own empty-state copy, driven by the i18n keys
`event.filter.*` / `event.empty.*` in `apps/{tsri,ganzgraz}/locales/deOverriden.json` (13 keys each,
identical text).

### 10.4 Sitemaps

`'/event'` is a hard-coded static path in 21 `apps/*/src/sitemap.ts` files (e.g.
`apps/bajour/src/sitemap.ts:7`, `apps/hauptstadt/src/sitemap.ts:13`,
`apps/wepublish-site/src/sitemap.ts:6`, `apps/zwoelf/src/sitemap.ts:5`). Note `apps/eenews/src/sitemap.ts:6`
also lists `/event` even though eenews has no event pages.

### 10.5 URL shape

`libs/nest-modules/src/lib/urls/url-adapter.ts:48-50`:

```ts
async getEventURL(event: Event) {
  return `${this.baseURL}/event/${event.id}`;
}
```

No tenant overrides this (`grep getEventURL` finds only the definition and the single call site in
`event.resolver.ts:97`).

---

## 11. Permissions — `libs/permissions/src/lib/permissions.ts`

| Constant | `id` | Lines |
| --- | --- | --- |
| `CanGetEvent` | `CAN_GET_EVENT` | 685-689 |
| `CanCreateEvent` | `CAN_CREATE_EVENT` | 691-695 |
| `CanUpdateEvent` | `CAN_UPDATE_EVENT` | 697-701 |
| `CanDeleteEvent` | `CAN_DELETE_EVENT` | 703-707 |
| `CanGetImportedEvents` | `CAN_GET_IMPORTED_EVENTS` | 709-713 |

Membership in the role arrays:

- `AllPermissions` (starts line 1193): `CanGetEvent, CanUpdateEvent, CanDeleteEvent,
  CanGetImportedEvents` at 1303-1306 and `CanCreateEvent` at 1310.
- `EditorPermissions` (starts line 1376): `CanGetEvent, CanUpdateEvent, CanDeleteEvent,
  CanCreateEvent` at 1426-1429 and a **duplicate** `CanCreateEvent` at 1433. `CanGetImportedEvents`
  is *not* in `EditorPermissions`.
- `PeerPermissions` (starts line 1447): none.

Consumers: `libs/event/api/src/lib/event.resolver.ts:11-13`,
`libs/event/import/api/src/lib/import/events-import.resolver.ts:11`,
`libs/action/api/src/lib/action.resolver.ts:12,28`,
`libs/event/import/editor/src/lib/importable-event-list.tsx:29-33`,
`apps/editor/src/app/routes/events/eventListView.tsx:11-14`,
`apps/editor/src/app/base.tsx:42,72,117`,
`libs/ui/editor/src/lib/panel/selectEventsPanel.tsx:16` (`CanUpdateEvent` for the edit link).

---

## 12. Seeds, fixtures, mocks, tests

### 12.1 Seeds

| File | Lines | Content |
| --- | --- | --- |
| `apps/api-example/prisma/seed.ts` | 460-476 | `seedEvents(prisma, imageIds)` — 10-20 faker events with `name`, `slateDescription`, `startsAt`, `endsAt`, random `imageId` |
| `apps/api-example/prisma/seed.ts` | 2018-2027 | calls `seedEvents` then passes the ids into `seedArticles` |
| `apps/api-example/prisma/seed.ts` | 38, 679, 755-770 | builds an `EventBlock` inside a seeded article with 1-6 random event ids |
| `apps/api-example/prisma/seed.ts` | 355 | a seeded navigation link to `/event` |
| `apps/api-example/prisma/seed-notifications.ts` | 127-129 | changelog/notification entry `event_recurrence` — "Recurring events … create them once, publish every occurrence." (copy only; no code behind it) |
| `libs/event/import/api/__tests__/prisma/seed.ts` | 52 | delegates to the root seed and upserts `dev@wepublish.ch` / `editor@wepublish.ch` |
| `libs/api/prisma/seed.ts` | — | **no event rows** |

### 12.2 Storybook mocks

| Export | File:line |
| --- | --- |
| `mockEvent` | `libs/storybook/mocks/src/lib/event.ts:7` (exported from `src/index.ts:5`) |
| `mockEventBlock` | `libs/storybook/mocks/src/lib/block-content.ts:154-174` |
| `mockEventTeaser` | `libs/storybook/mocks/src/lib/block-content.ts:455-470` |

Consumers: the 5 event-website story files, `libs/block-content/website/src/lib/event/event-block.stories.tsx`,
`base-teaser.event.stories.tsx`, `teaser-list-block.stories.tsx:28`,
`block-styles/focus-teaser/focus-teaser.stories.tsx:49-53`,
`block-styles/teaser-slider/teaser-slider.teaser-list.stories.tsx:45-49`, and
`libs/storybook/mocks/src/lib/block-content.ts:974, 991` (the "all blocks" fixture).

`libs/website/.storybook/main.ts:11` pins `components: { event: null }` in the storybook sort order.

### 12.3 Tests

| File | Tests | Notes |
| --- | --- | --- |
| `libs/event/api/src/lib/event.service.spec.ts` | 9 | query by id, filter, cursor paging, pagination, create, update, delete, start>end rejection, not-found |
| `libs/event/api/src/lib/event.service.cache.spec.ts` | 2 parametrised (5 cases) | cache invalidation and `invalidateAt` |
| `libs/event/api/src/lib/event.resolver.spec.ts` | 5 | supertest against a real `GraphQLModule` |
| `libs/event/api/src/lib/event-dataloader.service.spec.ts` | 3 | |
| `libs/event/api/src/lib/event-schedule.watcher.spec.ts` | 4 | 70 s window, late-run catch-up, DB outage |
| `libs/event/import/api/src/lib/import/agenda-basel.service.spec.ts` | 4 | |
| `libs/event/import/api/src/lib/import/kultur-zueri.service.spec.ts` | 4 | |
| `libs/event/import/api/src/lib/import/events-import.service.spec.ts` | 4 | |
| `libs/event/import/api/src/lib/import/events-import.service.cache.spec.ts` | 1 | |
| `libs/event/import/api/src/lib/import/events-import.resolver.spec.ts` | 4 | |
| `libs/event/import/api/src/lib/import/kulturagenda-parser.spec.ts` | ≥1 | past-start-date filtering |
| `libs/event/import/editor/src/lib/importable-event-list.spec.tsx` | 2 | + snapshot |
| `libs/event/website/src/lib/**/*.spec.{ts,tsx}` | 6 files | 5 storyshot renders + `getEventSEO` canonical test |
| `libs/article/api/src/lib/slot-teasers-loader.spec.ts` | — | mocks `EventService` to reproduce the DI cycle |
| `libs/action/api/src/lib/action.resolver.spec.ts` | — | imports `Event` from `@wepublish/event/api` |
| `libs/feed/website/src/lib/sitemap/homepage-lastmod.spec.ts` | — | synthesises an `EventTeaser` literal (no event import) |
| `apps/tsri/src/components/event-list-filter.spec.ts` | — | tsri date-range filter unit tests |
| `libs/block-content/api/src/lib/block-styles/{block-styles.resolver,block-styles.service}.spec.ts` | — | use the literal `'Event'` as a `BlockType` value |

---

## 13. Nx / tsconfig wiring

### 13.1 `tsconfig.base.json:58-63`

```json
"@wepublish/event/api": ["libs/event/api/src/index.ts"],
"@wepublish/event/import/api": ["libs/event/import/api/src/index.ts"],
"@wepublish/event/import/editor": [
  "libs/event/import/editor/src/index.ts"
],
"@wepublish/event/website": ["libs/event/website/src/index.ts"],
```

### 13.2 `project.json` files

| Project name | Path | Targets |
| --- | --- | --- |
| `event-api` | `libs/event/api/project.json` | `build` (`@nx/js:tsc` → `dist/libs/event/api`), `test` |
| `event-website` | `libs/event/website/project.json` | `build` (`@nx/js:tsc` → `dist/libs/event/website`), `test` |
| `events-import-api` | `libs/event/import/api/project.json` | `test` only |
| `event-import-editor` | `libs/event/import/editor/project.json` | `test` only |

### 13.3 `nx.json`

The `@nx/eslint/plugin` `include` list names all four roots at lines 221-224:

```json
"libs/event/api/**/*",
"libs/event/import/api/**/*",
"libs/event/import/editor/**/*",
"libs/event/website/**/*",
```

### 13.4 Vitest

`vitest.config.ts` in each project calls `createVitestConfig` with names `event-api`,
`event-website`, `event-import-api`, `event-import-editor`. `libs/event/api` and
`libs/event/import/api` pass `{environment: 'node', react: false, nest: true}`.
`libs/event/website` passes `setupFiles: ['./setup-tests.tsx']`.

### 13.5 `.nxignore`

Does **not** list any event project (it lists `libs/testing`, `libs/storybook`,
`apps/api-example/schema-v2.graphql`, `libs/**/*/seed.ts`, `libs/block-content/api`,
`libs/image/api`).

---

## 14. Named "event" but **not** part of this feature

Do not touch these when deleting:

| Thing | Where | What it really is |
| --- | --- | --- |
| `enum UserEvent` | `schema.prisma:1457-1463`, `model UserFlowMail:1465-1476` | transactional-mail triggers (`ACCOUNT_CREATION`, `LOGIN_LINK`, …) |
| `enum SubscriptionEvent` | `schema.prisma:1478-1487`, `SubscriptionInterval:1508-1521` | subscription-flow mail triggers |
| `libs/membership/api/src/lib/subscription-event-dictionary/` | 3 files | subscription flow logic |
| `libs/membership/editor/src/lib/subscription-flow/events/` | `events-list.tsx`, `events-body/head` | subscription-flow UI |
| `translation.subscriptionFlow.*`, `translation.systemMails.events.*` | editor locales | mail-flow copy |
| `TsriTeaserType.Events = 'SB_Events'` | `apps/tsri/src/components/teasers/tsri-base-teaser.tsx:62` | a **block style name**, not the event entity |
| `TsriLayoutType.Events = 'SB_Events'` | `apps/tsri/src/components/teaser-layouts/tsri-layout.tsx:27` | ditto |
| `apps/tsri/src/components/teasers/teaser-sidebar-events.tsx`, `teaser-layouts/layout-sidebar-events.tsx` | | block-style-driven teaser layouts; no event import |
| `deriveAction('importEvents')` | `libs/audit-log/api/src/lib/derive-audit-entry.spec.ts:13` | a generic `import*` → `AuditLogAction.create` prefix test |
| `apps/cultur/public/images/Kunstevent.jpeg` | | an image asset |
| DOM `addEventListener`/`KeyboardEvent`/`DragEndEvent`/`FormEvent` | everywhere | browser APIs |

---

## 15. Deletion checklist, ordered so the repo keeps compiling

The dependency order is: **leaves first (apps) → shared UI/website libs → API consumers → the event
libs themselves → GraphQL documents → codegen → Prisma**. The two moments where the build is
necessarily red are between steps 7 and 9 (schema regeneration) and between 9 and 10 (Prisma client
regeneration), so run those back to back.

### Step 1 — tenant Next.js pages (21 apps, independent of each other)

1. Delete `apps/<app>/pages/event/` for: `babanews, bajour, cultur, demo, factuel, fazetten, flimmer,
   ganzgraz, gruppetto, hauptstadt, kunstbulletin, mannschaft, mediamakerscamp, munotgloeggli,
   neuewege, onlinereports, tsri, website-example, wepublish-site, wnti, zwoelf`.
2. Remove `'/event'` from `pageUrls`/`staticPaths` in 22 `apps/*/src/sitemap.ts`
   (the 21 above plus `apps/eenews/src/sitemap.ts:6`, which lists it despite having no page).

### Step 2 — tenant event components and their `_app.tsx` wiring

3. `apps/ganzgraz`: delete `src/components/ganzgraz-event.tsx` and
   `src/components/ganzgraz-event-list-item.tsx`; remove imports + props at `pages/_app.tsx:53-54,
   153-154`; drop the `event.filter.*` / `event.empty.*` keys from `locales/deOverriden.json`.
4. `apps/hauptstadt`: delete `src/components/hauptstadt-event.tsx`; remove `pages/_app.tsx:58, 180`.
5. `apps/tsri`: delete `src/components/tsri-event.tsx`, `src/components/tsri-event-list-item.tsx`,
   `src/components/event-list-filter.ts`, `src/components/event-list-filter.spec.ts`; remove
   `pages/_app.tsx:71, 73-75, 180-182`; remove the event branch in
   `src/hooks/page-type-based-content.tsx:4, 6, 22, 64-65, 101-104, 151-153, 176-177` (and whatever
   `PageType.Event` / `PageType.EventList` members that leaves dangling); drop the `event.*` keys
   from `locales/deOverriden.json`.
   **Careful:** `tsri-event.tsx` also exports `EVENT_LOCATION_FALLBACK` and `TsriEventTag`, which
   `tsri-event-list-item.tsx` imports — both go together.

### Step 3 — the website provider and builder contract

6. `libs/website/src/lib/website.provider.tsx`: remove line 31 (`EventBlock`), lines 80-84, the four
   props at 226-229, and `Event: EventBlock` at 299.
7. `libs/website/builder/src/lib/website-builder.context.tsx`: remove the type imports (39, 77-81),
   the four component slots (168-171), the four `NoComponent` defaults (327-330), `blocks.Event`
   (255) and its default (400).
8. `libs/website/builder/src/index.ts:7`: remove `export * from './lib/event.interface'`.
9. Delete `libs/website/builder/src/lib/event.interface.ts`.
10. `libs/website/builder/src/lib/blocks.interface.ts`: remove `FullEventBlockFragment` (9) and
    `BuilderEventBlockProps` (76).

### Step 4 — block-content website

11. **Before** deleting `EventBlockWrapper`, fix its five CSS consumers (see §16, item 1):
    `libs/content/website/src/lib/content-wrapper/content-wrapper.tsx:11, 71`,
    `apps/hauptstadt/src/components/hauptstadt-content-wrapper.tsx:9, 59, 84, 105`,
    `apps/onlinereports/src/components/content-wrapper.tsx:7, 57`,
    `apps/reflekt/src/components/reflekt-article.tsx:10, 130`,
    `apps/wepublish-site/src/components/wep-article.tsx:11, 87`.
12. Delete `libs/block-content/website/src/lib/event/` (3 files).
13. `libs/block-content/website/src/index.ts:39`: remove the export.
14. `libs/block-content/website/src/lib/blocks.tsx`: remove lines 7, 45 and the
    `[isEventBlock, …]` pair at 428-432.
15. `libs/block-content/website/src/lib/teaser/base-teaser.tsx`: remove the 8 `case 'EventTeaser':`
    arms (29-30, 49, 65-70, 88-89, 116-117, 145-146, 203, 231-232).
16. `libs/block-content/website/src/lib/teaser/teaser-grid-block.tsx:54`: remove the arm.
17. Delete `libs/block-content/website/src/lib/teaser/base-teaser.event.stories.tsx`; strip
    `mockEventTeaser` from `teaser-list-block.stories.tsx:4, 28`,
    `block-styles/focus-teaser/focus-teaser.stories.tsx:5, 49-53`,
    `block-styles/teaser-slider/teaser-slider.teaser-list.stories.tsx:5, 45-49`.
18. `libs/feed/website/src/lib/sitemap/homepage-lastmod.ts:8, 21` and its spec at 14-16, 37.

### Step 5 — the editor

19. Delete `apps/editor/src/app/routes/events/` (5 files).
20. `apps/editor/src/app/app.tsx`: remove imports at 27 and 71-73, and the whole `{/* Events Routes */}`
    block at 541-601 (7 routes).
21. `apps/editor/src/app/base.tsx`: remove the Events `SidebarNavMenu` at 808-867 and the now-unused
    `CanDeleteEvent` (42), `CanGetEvent` (72), `CanUpdateEvent` (117), `MdEvent` (155) imports.
    `MdEventAvailable` is already only in the commented-out block.
22. Delete `libs/ui/editor/src/lib/blocks/eventBlock.tsx` and
    `libs/ui/editor/src/lib/panel/selectEventsPanel.tsx`; remove `blocks/index.ts:12` and
    `panel/index.ts:28`.
23. `libs/ui/editor/src/lib/blocks/blockMap.tsx`: remove lines 15, 41 and the
    `[EditorBlockType.Event]` entry at 370-376.
24. `libs/ui/editor/src/lib/blocks/types.ts`: remove `FullEventFragment` (9), the
    `FullTeaser_EventTeaser_Fragment` alias and union member (48-60), `EventBlockValue` (195-201),
    `EventTeaserLink`/`EventTeaser` and the union members (357-390), `EventBlockListValue`
    (526-528, 559), the `EditorBlockType.Event` serialiser arm (599-610), the `TeaserType.Event`
    serialiser arm (1037-1045), the `'EventTeaser'` discriminators (1419, 1487), the
    `case 'EventBlock'` deserialiser (1566-1577) and the `case 'EventTeaser'` deserialiser
    (1629-1640).
25. `libs/ui/editor/src/lib/panel/teaserSelectPanel.tsx`: remove the Events tab — imports (27-28, 41),
    `EventFilterContainer` (106), `eventFilter` state (158), the query block (171-187), the error
    aggregation (229-240), `loadMoreEvents` (286-305) and the `case TeaserType.Event` (443-480).
26. `libs/ui/editor/src/lib/panel/teaserEditPanel.tsx:344, 368-372`;
    `teaserListConfigPanel.tsx:44, 57-58, 136`;
    `blocks/teaserSlots/teaser-slots-autofill-config.tsx:70-80, 102`;
    `atoms/teaserOverview/TeaserCard.tsx:23, 386-389`;
    `atoms/teaserOverview/extractTeasers.ts:100-101`;
    `atoms/teaserOverview/TeaserOverviewPanel.tsx:251`.
27. `libs/ui/editor/src/lib/atoms/dashboard/activityFeed.tsx:66, 314-321`.
28. `libs/ui/editor/src/lib/listView/list-view-filters.tsx`: remove `EventFilter`,
    `EventProvidersDocument`, `ImportedEventFilter` (12-15), `ImportableEventFilter` (108-120) and
    its union member, the `providersFetch` lazy query (140-143), and the `'name'` / `'location'` /
    `'providers'` field branches (340-358, 380-400) plus those members of the `Field` union (97-99,
    105-106). **Keep `'dates'`** — `PollVoteList` uses it.
29. Remove the 49 event i18n keys from `apps/editor/src/app/locales/{de,en,fr}.json` (§9.5), plus
    `filterableList.filter.{name,location,providers}`.

### Step 6 — API consumers of `@wepublish/event/api`

30. Delete `libs/block-content/api/src/lib/event/` (2 files).
31. `libs/block-content/api/src/lib/block-content.module.ts`: remove lines 4, 9, 34, 43.
32. `libs/block-content/api/src/lib/block-content.model.ts`: remove 17, 122, 169-170, 245-246.
33. `libs/block-content/api/src/lib/block-type.model.ts:31`: remove `Event = 'event'`
    (**only after** the Prisma enum member goes, step 12 — or keep both and drop together).
34. `libs/block-content/api/src/index.ts:20`: remove the model export.
35. `libs/block-content/api/src/lib/teaser/teaser.model.ts`: remove 13, 19, the `EventTeaser` and
    `EventTeaserInput` classes (85-103), and the three registry lines (131, 138-139, 155-156).
36. `libs/block-content/api/src/lib/teaser/teaser-list.resolver.ts`: remove 9, 24, the ctor param (31)
    and the `TeaserType.Event` branch (114-136).
37. `libs/block-content/api/src/lib/teaser/slot-teasers-loader.ts`: remove 2, 10, the ctor param (100),
    the `TeaserType.Event` branch (335-357) and the `getLoadedTeasers` arm (380-381).
38. `libs/action/api/src/lib/action.model.ts`: remove 15, `ActionType.EventCreated` (28),
    `EventCreatedAction` (105-112), the union member (125) and the resolver arm (143-144).
39. `libs/action/api/src/lib/action.service.ts`: remove 11, the `events()` source (121-133) and the
    `[ActionType.EventCreated]: events` map entry (142).
40. `libs/action/api/src/lib/action.resolver.ts`: remove `CanGetEvent` (12, 28).
41. `libs/article/api/src/lib/slot-teasers-loader.spec.ts`: remove 20, `mockEventService` (252) and
    the provider (311).
42. `libs/tag/api/src/lib/event-tag.dataloader.ts` — delete; remove `libs/tag/api/src/index.ts:10`
    and `libs/tag/api/src/lib/tag.module.ts:10, 22, 30`.
43. `libs/richtext/api/src/lib/slate-to-pm-migrator.ts`: remove `'events'` from `MigratedTable` (233),
    the `case 'events'` in `forgetMigrated` (268), the whole `migrateEvents()` cron (378-415) and the
    `{table: 'events', …}` entry at 1185.
44. `libs/nest-modules/src/lib/urls/url-adapter.ts`: remove `getEventURL` (48-50) and the `Event`
    import (line 6).

### Step 7 — the four event projects

45. Delete `libs/event/` entirely (api, website, import/api, import/editor).
46. `apps/api-example/src/nestapp/app.module.ts`: remove lines 25, 28-30, 262 and the
    `EventsImportModule.registerAsync({...})` block at 294-301.
47. `tsconfig.base.json:58-63`: remove the four aliases.
48. `nx.json:221-224`: remove the four eslint `include` globs.

### Step 8 — permissions, mocks, seeds

49. `libs/permissions/src/lib/permissions.ts`: delete 685-713 (the five constants) and remove them
    from `AllPermissions` (1303-1306, 1310) and `EditorPermissions` (1426-1429, 1433).
50. Delete `libs/storybook/mocks/src/lib/event.ts`; remove `src/index.ts:5`; remove `mockEventBlock`
    (154-174) and `mockEventTeaser` (455-470) from `src/lib/block-content.ts`, plus their uses at
    529, 974 and 991.
51. `libs/website/.storybook/main.ts:11`: remove the `event: null` sort entry.
52. `apps/api-example/prisma/seed.ts`: delete `seedEvents` (460-476), its call and the
    `events.map(...)` argument (2018-2027), the `EventBlock` import (38) and the event block in
    `seedArticles` (679, 755-770); optionally the `/event` navigation link (355).
53. Delete `libs/event/import/api/__tests__/prisma/seed.ts` together with the project in step 45;
    confirm nothing else referenced its `package.json` `prisma.seed` entry.

### Step 9 — GraphQL documents + regenerate

54. Delete `libs/editor/api/src/lib/schemas/events.graphql` and
    `libs/editor/api/src/lib/schemas/imported-events.graphql`.
55. Delete `libs/website/api/src/lib/schemas/event.graphql`.
56. Strip the event fragments from `libs/editor/api/src/lib/schemas/block.graphql` (67-81, 399-412),
    `libs/editor/api/src/lib/schemas/action.graphql` (102-109),
    `libs/website/api/src/lib/schemas/block-content.graphql` (45-58, 199-205, 373-375, 491-493),
    `libs/website/api/src/lib/schemas/sitemap.graphql` (105-110).
57. Boot the API once to regenerate `apps/api-example/schema-v2.graphql`, then run
    `graphql-codegen` to regenerate `libs/{editor,website}/api/src/lib/gql/*`, `schema-types.ts`,
    `possible-types.ts`, `libs/{editor,website}/api/src/index.ts` (via
    `tools/generateApiIndex.js`), `libs/testing/src/graphql/schema-public.ts` and
    `libs/peering/api/src/lib/remote/schema.ts`. **Never hand-edit those files.**
58. Optional cleanup: `libs/api/__tests__/api/{public,private}/index.ts` are orphan generated files
    (not in `codegen.yml`, imported by nothing) and can go with this change.

### Step 10 — Prisma, last

59. `libs/api/prisma/schema.prisma`: delete `enum EventStatus` (1382-1387), `model Event`
    (1389-1413), `model TaggedEvents` (1415-1425), `Image.events` (284), `Tag.events` (1282),
    `TagType.Event` (1260) and `BlockType.Event` (1600).
60. Generate the drop migration (`DROP TABLE "events.tagged-events"; DROP TABLE "events";
    DROP TYPE "EventStatus";` plus the two enum-value removals — Postgres cannot drop an enum value,
    so `TagType` and `BlockType` have to be recreated or the members left in place; decide this
    deliberately).
61. Re-run `prisma generate`, then `npx nx affected -t lint test --uncommitted`.

> **Alternative that avoids steps 59-61 in the same change:** keep `TagType.Event` and
> `BlockType.Event` and have the new BKa event feature reuse them. That keeps `tags` of type `event`
> and the `BlockStyle` rows that name `Event` working, and avoids a Postgres enum rewrite.

---

## 16. NOT safe to delete / needs a decision first

1. **`EventBlockWrapper` is a layout selector used by non-event code.**
   `libs/content/website/src/lib/content-wrapper/content-wrapper.tsx:11, 71` puts it in the
   `:is(ImageBlockWrapper, SliderWrapper, LightboxWrapper, EventBlockWrapper, BreakBlockWrapper)`
   rule that widens a block to `grid-column: 2/12`. Four tenant files do the same:
   `apps/hauptstadt/src/components/hauptstadt-content-wrapper.tsx` (3 rules),
   `apps/onlinereports/src/components/content-wrapper.tsx`,
   `apps/reflekt/src/components/reflekt-article.tsx`,
   `apps/wepublish-site/src/components/wep-article.tsx`. Removing the export breaks four production
   tenants at compile time. Edit those selectors first.

2. **`SortOrder` is registered for the whole schema inside `event.model.ts`.**
   `libs/event/api/src/lib/event.model.ts:25-27` runs
   `registerEnumType(SortOrder, {name: 'SortOrder'})`. `SortOrder` itself lives in
   `@wepublish/utils/api` and is used across articles, pages, comments, polls, subscriptions. If
   `libs/event/api` disappears, that `registerEnumType` call must be re-homed (the usual place would
   be `libs/utils/api`) or the whole schema loses the `SortOrder` enum at boot.

3. **`EventStatus` is registered twice.** Once in `event.model.ts:32` and once in
   `libs/event/import/api/src/lib/import/events-import.model.ts:23-25`. Both go, but if you delete
   `libs/event/api` first and leave `import/api` around, the second registration will still try to
   register a Prisma enum that no longer exists.

4. **`EventTagDataloader` (`libs/tag/api`) is only used by the event resolver**, but it lives in a
   shared lib and is exported from `libs/tag/api/src/index.ts:10` and provided+exported by
   `TagModule`. Removing it is safe once `event.resolver.ts` is gone — but it is a shared lib, so it
   must be done as part of the same change, not left dangling.

5. **`libs/block-content/api/src/lib/block-type.model.ts:31`** (`Event = 'event'`) mirrors the Prisma
   `BlockType` enum. Removing one without the other produces a schema that disagrees with the
   database. `BlockStyle.blocks` is `BlockType[]` in Postgres, so existing `block-content.styles`
   rows that contain `'event'` would become unreadable.

6. **`TagType.Event`.** Existing `tags` rows with `type = 'event'` will be orphaned, and
   `@@unique([type, tag])` means a tag name can legitimately exist once per type. Deleting the enum
   member requires migrating or deleting those rows. Count: **UNVERIFIED** (We.Publish DB stopped).

7. **`EditorBlockType` / `TeaserType` enum members** (`Event`) are part of the public GraphQL schema
   and are persisted inside `articles.revisions.blocks` / `pages.revisions.blocks` JSON. Existing
   revisions containing `{"type":"event", …}` blocks and `{"type":"event","eventID":…}` teasers will
   deserialise to `UnknownBlock` (`BlockContent` union has `UnknownBlock`) once the arms are gone —
   confirm that the editor's `blockForQueryBlock` default branch handles it rather than throwing.
   Number of affected revisions: **UNVERIFIED**.

8. **`URLAdapter.getEventURL`** is in `libs/nest-modules`, a lib every API consumer imports. It takes
   a Prisma `Event`, so it must be removed in the same change as the Prisma model — otherwise the
   import of `Event` from `@prisma/client` breaks.

9. **`libs/richtext/api/src/lib/slate-to-pm-migrator.ts`** is actively migrating
   `events.slateDescription` → `events.description` on a 10-second cron. If any production event rows
   still have a non-null `slateDescription` and a null `description`, that content is only reachable
   through this migrator. Check before dropping the table. **UNVERIFIED**.

10. **The 21 `pages/event/*` routes are indexed.** Every tenant's `sitemap.ts` advertises `/event`,
    and `getEventSEO` emits a canonical URL per event. Deleting the routes without redirects produces
    404s on previously indexed URLs. `apps/eenews/src/redirects/article-redirects.generated.json`
    shows the repo has a redirect mechanism for this kind of thing.

---

## 17. Which tenants visibly lose functionality

Every app in §10.3 loses `/event` and `/event/<id>`. Beyond that:

| Tenant | What is lost beyond the two routes | Severity |
| --- | --- | --- |
| **tsri** | A bespoke event section: custom detail layout (`tsri-event.tsx`, 159 lines), custom list item with image hover (`tsri-event-list-item.tsx`, 416 lines), a today/tomorrow/7d/30d filter bar with its own zod schema and 13 translated strings, a 312-line list page, and `PageType.Event` / `PageType.EventList` analytics page typing | highest — clearly a maintained, invested-in feature |
| **ganzgraz** | Custom detail + list-item components (277 + 191 lines), a 319-line filtered list page, 13 translated strings | high |
| **hauptstadt** | A themed `Event` (`createWithTheme`) and a 199-line list page | medium |
| **bajour** | The only app with a non-standard `event/[id].tsx` (69 lines vs 50-52 elsewhere) and a 201-line list page | medium |
| **cultur, kunstbulletin, mannschaft, munotgloeggli, neuewege, onlinereports, mediamakerscamp, gruppetto, factuel, fazetten, flimmer, wnti, zwoelf, wepublish-site** | The stock list + detail pages only | low each, but 14 live sites |
| **demo, website-example, babanews** | Same, but not deployed to production (`deployment.config.json` false / `.json.example` / `.json_disable`) | none |
| **All tenants** | The `EventBlock` (an "events" block editors can drop into any article or page) and the `EventTeaser` type in teaser grids, teaser lists and teaser slots — including autofill-by-tag | medium, cross-cutting |
| **Editor (all tenants)** | The whole `Events` sidebar menu, the event CRUD screens, the event tag screens, the importable-events screen, the `EventCreated` tile in the dashboard activity feed | high |
| **API (all tenants)** | Public `events` / `event` queries, which any external consumer may be calling | **UNVERIFIED** — no access logs available |

Whether any of these tenants actually *has* event rows, and how many, cannot be answered here: the
We.Publish Postgres instance is stopped (it shares port 5432 with the restored BKa production
database). The characterisation of the feature as "barely used" is therefore **UNVERIFIED** from this
repo; it would be settled by
`SELECT count(*) FROM events;` and
`SELECT "externalSourceName", count(*) FROM events GROUP BY 1;` per tenant database.

---

## 18. Porting notes

*(Opinion, clearly separated from the facts above.)*

- **Almost nothing of the current data model survives.** BKa events have occurrences, organizations,
  places, videos, proposers, locales and print options; We.Publish's `Event` has `name`, `lead`, one
  rich-text `description`, one `location` string, one date range, one image and N tags. The port is a
  new model, not an extension. The only genuinely reusable pieces are the `Image` FK pattern, the
  `TaggedEvents` join-table shape, and `EventStatus` — and even `EventStatus`
  (cancelled/rescheduled/postponed/scheduled) is a schema.org vocabulary, not a BKa one.

- **`SortOrder` registration is a landmine.** Deleting `libs/event/api` without re-homing
  `registerEnumType(SortOrder, {name:'SortOrder'})` (`event.model.ts:25-27`) will take down the whole
  GraphQL schema at boot. Move it to `libs/utils/api` as the very first commit of the deletion, in
  isolation, so the failure mode is obvious if it regresses.

- **The revision system is the big new requirement.** The current implementation writes straight
  through to the row and invalidates the public cache. The patterns to copy are
  `libs/article/api/src/lib/article.service.ts` + `article-revision.resolver.ts` +
  `article-publication.watcher.ts` (`EventScheduleWatcher` is already a stripped-down sibling of
  `ArticlePublicationWatcher` — same `PublicationTimers`, same `PublicContentCacheInvalidator`, same
  60 s interval, so that one file ports almost directly to "publish pending revisions").

- **Block content means a `blocks Json` column plus the `BlockContent` union.** `Article` and `Page`
  already carry `blocks` on their revision rows; an event revision should do the same. That makes
  `EventBlock`-inside-an-event a real possibility — guard against it the way
  `slot-teasers-loader.ts:213` guards circular block templates.

- **`EventBlock` and `EventTeaser` are worth keeping conceptually.** They are the only way editors
  surface events on article and page bodies today, and tenants style them
  (`EventBlockWrapper` appears in five content-wrapper grids). A new events feature that does not
  provide a block and a teaser type is a functional regression for every tenant.

- **Importers are throwaway.** `AgendaBasel` and `KulturZueri` both scrape the same Swiss
  "Kulturagenda" XML format and both write events without tags, lead or status. They are not relevant
  to BKa and should simply be deleted rather than ported — unless BKa's own import path (the
  ProInfirmis integration) wants the `EventsProvider` interface + `EVENT_IMPORT_PROVIDER` token shape,
  which is a reasonable plugin pattern to reuse.

- **The `events` table has no indexes.** If the new model keeps the current query shape
  (order by `startsAt`, `ILIKE` on `name`/`location`, tag joins) at BKa's volume
  (~34k events, ~118k occurrences in the restored production DB), it needs indexes from day one —
  this is a concrete thing the current implementation gets wrong.

- **`LIST_OWN_EVENTS_ONLY=true` has no analogue here.** We.Publish's `Event` has no owner column at
  all and its list query is `@Public()`. Ownership scoping is new surface: a `User`/`Organization` FK
  on the event, plus a permission check that is *not* currently exercised anywhere
  (`CanGetEvent` is declared and never enforced on a read path).
