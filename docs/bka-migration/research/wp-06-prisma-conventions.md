# wp-06 — Prisma conventions, the schema split, and the `events.` table prefix

Scope: everything a new domain author needs to know about Prisma in We.Publish, plus a tested
answer to three questions the BKa port raises. It covers
`/Users/itrulia/Documents/wepublish/libs/api/prisma/schema.prisma` (structure, ordering, naming,
`@@map`, `@@index`, enums, id strategy, timestamps, views),
`/Users/itrulia/Documents/wepublish/prisma.config.ts`, the migrations directory, the installed
Prisma version and its preview features, how the client is generated and exported, and
`/Users/itrulia/Documents/wepublish/.claude/docs/graphql-prisma.md`. It then answers, **by running
the installed Prisma CLI against copies of the real schema in a temp directory outside the repo**
(`$TMPDIR/prisma-probe`), whether this Prisma version supports a multi-file schema, what the real
options for an `events.` table prefix are, and which one to pick. Nothing in either repository was
modified; every probe wrote only into `$TMPDIR`, and `git status` on the We.Publish repo is
unchanged apart from this `docs/bka-migration/` tree.

---

## 1. What is installed

### 1.1 Versions

| Package | Version | Where declared |
| --- | --- | --- |
| `prisma` (CLI) | **7.5.0** (exact pin, no range) | `package.json:179` (devDependencies) |
| `@prisma/client` | **7.5.0** (exact pin) | `package.json:262` (dependencies) |
| `@prisma/adapter-pg` | **7.5.0** (exact pin) | `package.json:261` (dependencies) |
| Schema engine | `schema-engine-cli 280c870be64f457428992c43c1f6d557fab6e29e` | `node_modules/@prisma/engines/` |
| PSL (schema wasm) | `@prisma/prisma-schema-wasm 7.5.0-15.280c870…` | reported by `prisma --version` |
| Query engine | **Query Compiler: enabled** (no Rust query engine binary) | reported by `prisma --version` |
| Node | `^22.20.0` required (`package.json:5`) | ran the probes on v22.23.3 |
| PostgreSQL | 17 in CI (`.github/workflows/test.yml:14`) | `postgres:17` service image |

Verified:

```
$ node_modules/.bin/prisma --version
prisma               : 7.5.0
@prisma/client       : Not found     # (run from $TMPDIR, no local client)
Query Compiler       : enabled
PSL                  : @prisma/prisma-schema-wasm 7.5.0-15.280c870be64f457428992c43c1f6d557fab6e29e
Schema Engine        : schema-engine-cli 280c870be64f457428992c43c1f6d557fab6e29e
```

Dependabot is configured to keep `prisma` and `@prisma/*` grouped and pinned
(`.github/dependabot.yml:18-19,36-37,54-55`), i.e. the three packages move together. Keep it that
way: the CLI, the client and the adapter must match.

> **Doc drift.** `.ai/architecture.md:93` says *“PostgreSQL 17 via **Prisma 5**”*, and line 96 says
> *“Full-text search via Prisma preview feature”*. Both are wrong today: it is Prisma 7.5.0, and
> full-text search is hand-written raw SQL (`libs/article/api/src/lib/article.service.ts:788-813`,
> `libs/page/api/src/lib/page.service.ts:607-625`) with a GIN trigram index declared in the schema
> (`schema.prisma:137`, `:890`). `.claude/docs/graphql-prisma.md` says the schema is *“configured
> via the `prisma` block in the root `package.json`”* — see §1.3, that is no longer true either.

### 1.2 The generator and datasource blocks

`libs/api/prisma/schema.prisma:1-8` — the entire configuration surface of the schema file:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["views", "relationJoins"]
}

datasource db {
  provider = "postgresql"
}
```

Note what is **absent**:

- No `url` on the datasource. In Prisma 7 the URL comes from `prisma.config.ts`
  (`datasource.url`). A bare `datasource db { provider = "postgresql" }` validates fine (probe
  `t1-baseline`).
- No `output` on the generator, so `prisma-client-js` writes to the default
  `node_modules/.prisma/client`, re-exported by `node_modules/@prisma/client/default.js`
  (`module.exports = {...require('.prisma/client/default')}`). Application code therefore always
  imports from `@prisma/client`, never from a generated folder in the repo.
- No `binaryTargets`, no `engineType`, no `relationMode`. Referential integrity is enforced by real
  Postgres foreign keys.
- No `schemas = [...]` — single-schema (`public`) today.

Preview-feature status in 7.5.0, established by feeding the CLI a block with six flags
(probe `t15`):

```
Prisma schema warnings:
- Preview feature "prismaSchemaFolder" is deprecated. The functionality can be used without specifying it as a preview feature.
- On `provider = "postgresql"`, preview feature "fullTextSearch" has been renamed to "fullTextSearchPostgres". Learn more at https://pris.ly/d/fts-postgres.
- Preview feature "multiSchema" is deprecated. The functionality can be used without specifying it as a preview feature.
- Preview feature "driverAdapters" is deprecated. The functionality can be used without specifying it as a preview feature.
```

| Flag | Status in 7.5.0 | In use here? |
| --- | --- | --- |
| `views` | **still a real preview feature** (no deprecation warning; removing it fails validation) | **yes, load-bearing** |
| `relationJoins` | **still a real preview feature** (no deprecation warning) | **yes, load-bearing** |
| `prismaSchemaFolder` | **GA** — flag deprecated, functionality always on | not needed |
| `multiSchema` | **GA** — flag deprecated, functionality always on | not used |
| `driverAdapters` | **GA** — flag deprecated, functionality always on | the adapter is used |
| `fullTextSearch` | renamed to `fullTextSearchPostgres` | not used |

Removing `views` is fatal (probe `t13`):

```
error: Error validating: View definitions are only available with the `views` preview feature.
  -->  t13/a.prisma:52
52 | view ArticleRevisionPublished {
```

`relationJoins` is used in three places —
`libs/article/api/src/lib/article-revision-dataloader.service.ts:44`,
`libs/author/api/src/lib/article-author.dataloader.ts:46`,
`libs/author/api/src/lib/article-social-media-author.dataloader.ts:38` — all
`relationLoadStrategy: 'join'`.

### 1.3 `prisma.config.ts` — the real configuration

`/Users/itrulia/Documents/wepublish/prisma.config.ts` in full (31 lines):

```ts
 1  import path from 'node:path';
 2  import fs from 'node:fs';
 3  import { defineConfig } from 'prisma/config';
 4  import { config } from 'dotenv';
 6  config({ path: ['.env'], quiet: true });
11  // Schema path: repo uses libs/api/prisma/, Docker containers use prisma/
12  const repoSchemaPath = path.join(__dirname, 'libs/api/prisma/schema.prisma');
13  const dockerSchemaPath = path.join(__dirname, 'prisma/schema.prisma');
14  const schemaPath =
15    fs.existsSync(repoSchemaPath) ? repoSchemaPath : dockerSchemaPath;
17  // DIRECT_DATABASE_URL bypasses PgBouncer (port 5433 instead of 5432).
20  const migrateUrl =
21    process.env['DIRECT_DATABASE_URL'] || process.env['DATABASE_URL']!;
23  export default defineConfig({
24    schema: schemaPath,
25    migrations: { seed: 'nx seed api-example --prod' },
28    datasource: { url: migrateUrl },
31  });
```

Four things follow from this that matter for the port:

1. **The `prisma` block in `package.json:210-213` is dead code.** Prisma 7.5.0 does not read
   `package.json`'s `prisma.schema` any more. Probe `t8-pkgjson` put a schema at `weird/schema.prisma`
   and pointed `package.json` at it; the CLI refused:

   ```
   Error: Could not find Prisma Schema that is required for this command.
   …
   Checked following paths:

   schema.prisma: file not found
   prisma/schema.prisma: file not found
   ```

   It never looked at `weird/schema.prisma`, even though the error text still *mentions*
   `prisma.schema` in package.json as an option. The same applies to `libs/api/package.json:24-27`,
   which declares `"schema": "prisma/schema.prisma"` and a seed of
   `npx tsx __tests__/seed.ts` — both inert.
2. **`migrations.path` is not set**, so the migrations directory defaults to
   `path.join(schemaRootDir, "migrations")`. The exact expression in the CLI build is
   `migrationsDirPath: r?.migrations?.path ?? path.join(o, "migrations")` where `o` is
   `schemaContext.schemaRootDir`. For a **file** schema, `schemaRootDir = dirname(schemaPath)`; for a
   **directory** schema, `schemaRootDir = <the directory itself>`
   (both read out of `node_modules/prisma/build/index.js`). Today that resolves to
   `libs/api/prisma/migrations` in the repo and `prisma/migrations` in the Docker images. **This is
   the single trap in a multi-file split** — see §5.3.
3. **`datasource.url` is mandatory for the schema engine.** Without a `prisma.config.ts` carrying a
   URL, `prisma migrate diff` fails with a bare
   `Error: Error in Schema engine:` and, under `DEBUG=prisma:*`,
   `prisma:schemaEngine:stderr error: The following required arguments were not provided:`. The
   engine binary's own help confirms `--datasource <JSON>` is required:
   `USAGE: schema-engine-darwin-arm64 [OPTIONS] --datasource <JSON> [SUBCOMMAND]`. Any tooling you
   write around `migrate diff` must therefore run with the config loaded.
4. **No `datasource.shadowDatabaseUrl`.** `prisma migrate dev` consequently asks Postgres to create a
   temporary shadow database itself, which needs `CREATEDB`. And any
   `prisma migrate diff --from-migrations …` fails outright:

   ```
   Error: You must pass the `--shadow-database-url` flag or set `datasource.shadowDatabaseUrl`
   in your `prisma.config.ts` if you want to diff a migrations directory.
   ```

### 1.4 How the client is generated, wired and exported

```
npx prisma generate            # also runs on `npm install` via "prepare" (package.json:34)
```

- Output: `node_modules/.prisma/client`, surfaced as `@prisma/client`.
- **Nest wiring**: `libs/nest-modules/src/lib/database/prisma.service.ts` —
  `PrismaService extends PrismaClient` and constructs a `PrismaPg` adapter from `DATABASE_URL`,
  with `options: '-c timezone=UTC'`, `max: DATABASE_POOL_SIZE ?? 20`,
  `connectionTimeoutMillis: 5_000`, `idleTimeoutMillis: 300_000`; `$connect()` on
  `onModuleInit`, `$disconnect()` on `onModuleDestroy`.
- `libs/nest-modules/src/lib/database/prisma.module.ts` provides **both** tokens — `PrismaClient`
  (`useExisting: PrismaService`) and `PrismaService` — and exports both, plus
  `PrismaModule.forTest(prismaClient)` for integration tests. Services inject
  `private prisma: PrismaClient` (see `.ai/conventions.md:27-38`).
- **Test client**: `libs/testing/src/lib/prisma-utils.ts` has `createPrismaClient()` (same adapter
  settings, `idleTimeoutMillis: 10_000`), `clearDatabase(prisma, tables)` and
  `clearFullDatabase(prisma)`. These are deliberately **not** in the `@wepublish/testing` barrel —
  import them from `@wepublish/testing/prisma` (`.claude/docs/gotchas.md:13-28`).
- `clearFullDatabase` enumerates tables with
  `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  — **hard-coded to the `public` schema** (`prisma-utils.ts:41-43`). Remember this in §6.1.
- **Seeds**: `prisma db seed` runs `nx seed api-example --prod` (from `prisma.config.ts:26`), which
  builds and runs `apps/api-example/prisma/seed-runner.ts` → `runExampleSeed` in
  `apps/api-example/prisma/seed.ts` (which already seeds events at `:460` / `:2018-2026`). The
  *core* seed, `libs/api/prisma/seed.ts` (settings, roles, provider registry) is run from
  `libs/api/prisma/run-seed.ts`, exposed as the TS path alias `@wepublish/api/seed`
  (`tsconfig.base.json:27`). `libs/api/prisma/seed.spec.ts` unit-tests `seedProviders` with a
  hand-rolled fake Prisma object — no DB.

### 1.5 Where the schema path is referenced

| File | Line | Reference |
| --- | --- | --- |
| `prisma.config.ts` | 12, 13 | `libs/api/prisma/schema.prisma` / `prisma/schema.prisma` |
| `Dockerfile` | 14 | `COPY ./libs/api/prisma/schema.prisma ./libs/api/prisma/schema.prisma` (base image) |
| `Dockerfile` | 15 | `COPY ./prisma.config.ts ./prisma.config.ts` |
| `Dockerfile` | 213 | `COPY libs/api/prisma/schema.prisma prisma/schema.prisma` (build-migration) |
| `Dockerfile` | 229 | `COPY libs/api/prisma/migrations prisma/migrations` (migration-setup) |
| `Dockerfile` | 231 | `COPY libs/api/prisma/schema.prisma prisma/schema.prisma` (migration-setup) |
| `Dockerfile` | 233 | `COPY prisma.config.ts prisma.config.ts` |
| `Dockerfile` | 56, 104, 170, 218, 240 | `npx prisma generate` in five build stages |
| `package.json` | 211 | dead `prisma.schema` key |
| `libs/api/package.json` | 25 | dead `prisma.schema` key for the published lib |
| `libs/api/project.json` | 19 | build assets include `libs/api/prisma/**/*` |
| `.claude/docs/repo-map.md` | 70 | “New DB field / table → `libs/api/prisma/schema.prisma`” |
| `.ai/development.md` | 54 | “The Prisma schema is at `libs/api/prisma/schema.prisma`” |

There are **no** Prisma references in `docker-compose.yml`, `nx.json`, `.gitignore`, `chart/`,
`deployment/` or `tools/` (other than `Prisma.prisma` as a recommended VS Code extension in
`.devcontainer/devcontainer.json:40`).

---

## 2. `schema.prisma` anatomy

**Size**: 2 352 lines, 68 442 bytes, **90 `model` blocks, 6 `view` blocks, 40 `enum` blocks**, plus
two *implicit* many-to-many join tables that exist only in the database (§2.12).

### 2.1 File shape and ordering

There is no alphabetical or strict grouping rule. The file is **chronological by domain**: the
article/author/image cluster from the 2022 `init` migration sits at the top, and every later domain
was appended at the bottom (`AuditLog`, the last model, is at line 2 328 and was added by the
2026-09 migration). Related blocks stay adjacent: an enum is declared immediately before the first
model that uses it (`EventStatus` at 1 382 → `Event` at 1 389; `TagType` at 1 258 → `Tag` at 1 266;
`BlockType` at 1 580 → `BlockStyle` at 1 605).

Within a model the ordering is consistent across the file:

```prisma
model NotificationRead {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))   // 1. identity
  createdAt  DateTime @default(now()) @db.Timestamptz(3)               // 2. timestamps
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  source NotificationSource                                            // 3. scalar payload
  itemId String
  userId String                                                        // 4. FK + relation, paired
  user   User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, source, itemId])                                   // 5. block attributes
  @@map("notifications.reads")                                         // 6. @@map always last
}
```

- Blank lines separate the identity block, the payload block and each relation pair.
- A foreign-key scalar and its relation field are written **together**, either `id` then relation
  (`userId` / `user`) or relation then `id` (`image` / `imageId` in `ArticleRevision:33-37`). Both
  orders occur; adjacency is the rule, not the order.
- Block attributes come last and **`@@map` is always the final line** of the block. In the 96 models
  and views that carry one, there is no exception.
- Columns are whitespace-aligned in the `prisma format` style. Nothing enforces this: Husky's
  pre-commit hook is `pretty-quick --staged --pattern "{apps,libs}/**/*.{js,ts,tsx,json}"`
  (`package.json:216`), which excludes `.prisma`; there is no `prettier-plugin-prisma` and no
  `prisma format` wired into any script or CI job. Keeping the alignment is a manual courtesy —
  `npx prisma format` does it, and is safe because it only rewrites the schema file.

### 2.2 Comments

The repo-wide “no code comments” rule (`.claude/docs/code-style.md`, memory `no-code-comments`) is
**not** applied to the schema. There are 4 `///` doc comments and about 20 `//` line comments, all
of them explaining a column whose meaning is not obvious from its name:

- `schema.prisma:656-658` — a `///` doc block on `MailSendJobRecipient` explaining why rows are
  materialised up front.
- `schema.prisma:2305` — `/// Feature toggles of this medium, as last received from We.Publish One.`
- `schema.prisma:511-513, 516-517, 563, 566-568, 571-572, 575, 614-615, 621-623, 630-631, 634` —
  `//` comments on `Invoice` and `MailSendJob` columns.
- `schema.prisma:1528, 1530` — comments inside the `MailTemplateContext` enum.

A `///` comment on a model or field is also carried into the generated client as JSDoc, so prefer
`///` for anything a consumer should see.

### 2.3 Model names vs table names: the `@@map` convention

Model names are **PascalCase singular-or-plural as the domain reads** (`Article`, `TaggedArticles`,
`CommentsRevisions`, `SettingMailProvider`). Table names are chosen separately with `@@map`.

96 of the 96 mapped blocks break down as:

| Table-name style | Count | Examples |
| --- | --- | --- |
| **Dotted domain prefix** | **57** | `articles.revisions`, `comments.rating-system-answers`, `settings.paymentprovider`, `events.tagged-events`, `block-content.styles` |
| Plain lowercase word | 25 | `articles`, `images`, `users`, `tags`, `events`, `banners`, `goodies`, `consents` |
| `snake_case` | 13 | `audit_logs`, `impersonation_grants`, `mail_templates`, `block_templates`, `crowdfunding_goals`, `paywall_bypasses`, `medium_features`, `one_channel_state` |
| `kebab-case`, no dot | 1 | `user-consents` |

The 20 distinct dotted prefixes in use, with the number of tables under each:

| Prefix | Tables | Prefix | Tables |
| --- | --- | --- | --- |
| `settings.` | 8 | `notifications.` | 2 |
| `articles.` | 8 | `changelog.` | 2 |
| `comments.` | 6 | `authors.` | 2 |
| `pages.` | 5 | `tracking.` | 1 |
| `polls.` | 4 | `paywalls.` | 1 |
| `users.` | 3 | `payment.` | 1 |
| `subscriptions.` | 3 | `navigations.` | 1 |
| `member.` | 3 | `invoices.` | 1 |
| `mail.` | 3 | **`events.`** | **1** |
| | | `block-content.` | 1 |
| | | `apps.` | 1 |

**The rule, as the repo actually practises it:** a *family* of tables belonging to one domain gets a
dotted prefix; a *standalone* table gets a plain or snake_case name. Reading the table names created
by every migration since 2025 makes the rule visible:

| Migration | Tables created | Style |
| --- | --- | --- |
| `20250203145243_prolitteris_integration` | `articles.tracking-pixels`, `tracking.pixels.methods` | dotted (family) |
| `20250416141315_add_crowdfunding` | `crowdfundings`, `crowdfunding_goals`, `_CrowdfundingToMemberPlan` | plain + snake + implicit |
| `20250512173421_add_paywall` | `paywalls`, `paywalls.memberPlans` | plain + dotted child |
| `20250609163006_create_model_bypasses` | `paywall_bypasses` | snake (standalone) |
| `20260131155952_add_tables_for_api_settings` | `settings.mailprovider`, `settings.trackingpixel`, `settings.paymentprovider`, `settings.challengeprovider`, `settings.aiprovider` | dotted (family of 5) |
| `20260216125301_add_external_app` | `apps.external` | dotted |
| `20260219220823_add_analytics_settings` | `settings.analyticsProvider` | dotted |
| `20260318120000_add_mailchimp_sync_settings` | `settings.syncprovider` | dotted |
| `20260321140000_add_mailchimp_sync_errors` | `mailchimp_sync_errors` | snake (standalone) |
| `20260401120000_add_document_model` | `documents` | plain |
| `20260519220140_add_website_settings` | `settings.website` | dotted |
| `20260526154307_add_vouchers` | `vouchers` (later renamed `discountCodes`) | plain |
| `20260709120000_add_manual_mail_sending` | `mail.send_jobs` | dotted |
| `20260714120000_add_goodies` | `goodies`, `_GoodieToMemberPlan` | plain + implicit |
| `20260805120000_add_resumable_mail_send_jobs` | `mail.send_job_recipients` | dotted |
| `20260818120000_member_plan_periodicity_pricing_table` | `member.plans.periodicity-prices` | dotted, 3 levels |
| `20260903180913_add_user_changelog_and_notifications` | `notifications.reads`, `notifications.confirmations`, `changelog.entries`, `changelog.entries.translations` | dotted (two families) |
| `20260908074237_create_block_template` | `block_templates` | snake (standalone) |
| `20260916120000_add_one_channel_state` | `one_channel_state` | snake (standalone) |
| `20260917090000_add_impersonation` | `impersonation_grants` | snake (standalone) |
| `20260924100000_add_audit_log` | `audit_logs` | snake (standalone) |
| `20261014120000_add_medium_features` | `medium_features` | snake (standalone) |

Within a dotted family, the segment after the dot uses whatever reads best: `kebab-case`
(`comments.rating-system-answers`), `snake_case` (`mail.send_job_recipients`), `camelCase`
(`settings.analyticsProvider`, `paywalls.memberPlans`) or one plain word
(`settings.website`). Three levels are allowed (`member.plans.periodicity-prices`,
`tracking.pixels.methods`, `articles.revisions.published`, `changelog.entries.translations`).

**`@@map` does not change anything in TypeScript.** Probe `t7` generated a client for models mapped
to `events.organizations`, `events.venues`, `events.revisions`, `events.occurrences`; the client
accessors came out as `prisma.eventOrganization`, `prisma.eventVenue`, `prisma.eventRevision`,
`prisma.eventOccurrence` — derived from the *model* name only.

### 2.4 Field naming and `@map`

Field names are `camelCase` and there is **no single field-level `@map`** in the whole schema —
column names are the Prisma field names verbatim, which is why so much raw SQL in the repo has to
quote them (`"publishedAt"`, `"articleId"`).

Foreign keys are `<relation>Id`, but the casing is historically inconsistent:

| Style | Count of distinct fields | Examples |
| --- | --- | --- |
| `…Id` (modern) | ~40 | `userId` ×11, `articleId` ×6, `tagId` ×5, `pageId` ×5, `memberPlanId` ×5, `imageId` ×3 |
| `…ID` (legacy) | ~25 | `imageID` ×5, `userID` ×3, `subscriptionID` ×2, `invoiceID`, `parentID`, `itemID`, `logoID` |

Everything added since roughly 2024 uses `…Id`. **Use `…Id` for the events domain.** Note that
`schema.prisma:1821` contains an actual typo, `tackingPixelMethodID` — do not treat the legacy
spellings as a style to imitate.

### 2.5 Id strategy

81 of the 90 models declare a scalar `@id`. The dominant form, used by 72 of them:

```prisma
id String @id @default(dbgenerated("gen_random_uuid()"))
```

which produces `"id" TEXT NOT NULL DEFAULT gen_random_uuid()` — a **`text` column holding a UUID
string**, not a `uuid` column. This was a deliberate, repo-wide decision: migration
`20250904071505_make_all_guids_in_the_database_strings` (176 lines, 18 `AlterTable` blocks) converted
every `UUID` primary key and its referencing columns to `TEXT`, including events:

```sql
-- AlterTable
ALTER TABLE "events" DROP CONSTRAINT "events_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");
```

and `20260717103244_cuid_to_guid` (113 lines) switched the remaining `cuid()` defaults to
`gen_random_uuid()`.

Three exceptions and one anti-pattern:

| Variant | Models | Note |
| --- | --- | --- |
| `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` | `Paywall` (1 723), `PaywallBypass` (1 768), `ExternalApps` (2 065) | real `uuid` columns; **skipped** by the 2025-09 TEXT conversion. A leftover, not a convention. |
| `String @id` with **no default** | `Image` (249), `Document` (300), `SettingMailProvider` (1 790), `SettingTrackingPixel` (1 815), `SettingPaymentProvider` (1 980), `SettingChallengeProvider` (2 027), `SettingAIProvider` (2 046), `SettingAnalyticsProvider` (2 083), `SettingSyncProvider` (2 102), `ChangelogEntryTranslation` (2 297), `OneChannelState` (2 297) | the id is supplied by the application — a stable slug for providers (`'mailgun'`, `'turnstile'`), a storage key for images |
| composite `@@id([a, b])` | `ArticleRevisionAuthor`, `ArticleRevisionSocialMediaAuthor`, `TaggedArticles`, `TaggedAuthors`, `TaggedComments`, `CommentRatingOverride`, `TaggedPages`, `TaggedEvents`, `PaywallMemberplan` (9 models) | pure join tables carry no surrogate id |

**For the events port: use `String @id @default(dbgenerated("gen_random_uuid()"))`** and composite
`@@id` on join tables. Do not add `@db.Uuid`.

### 2.6 Timestamps

**221 of 225 `DateTime` fields carry `@db.Timestamptz(3)`.** The canonical pair, present on most
entity models:

```prisma
createdAt  DateTime @default(now()) @db.Timestamptz(3)
modifiedAt DateTime @updatedAt      @db.Timestamptz(3)
```

The four exceptions:

| Line | Field | Why |
| --- | --- | --- |
| 719, 720 | `MemberPlanPeriodicityPrice.createdAt` / `.modifiedAt` | plain `timestamp` — an oversight from `20260818120000`, not a pattern |
| 1 191 | `User.birthday` | `@db.Date` — a calendar date, no time |
| 1 570 | `PeriodicJob.date` | `@db.Date` — a day key, `@unique` |

Migration `20260817121431_add_timezones_to_dates` converted the whole database to `timestamptz`
(`ALTER TABLE "events" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC'`,
at line 115 of that file) and in the same migration recreated the revision views. The adapter pins
the session to UTC (`options: '-c timezone=UTC'`) and Vitest sets `TZ=UTC`
(`.claude/docs/testing.md:208-209`).

**Every new `DateTime` in the events domain must carry `@db.Timestamptz(3)`** unless it is a bare
calendar date, in which case `@db.Date`.

### 2.7 Enums

40 enums. Two styles coexist:

1. **PascalCase or UPPER_SNAKE member with an explicit `@map` to the stored string** — the majority
   and the modern style:

   ```prisma
   enum EventStatus {
     Cancelled   @map("cancelled")
     Rescheduled @map("rescheduled")
     Postponed   @map("postponed")
     Scheduled   @map("scheduled")
   }

   enum PaymentProviderType {
     STRIPE_CHECKOUT      @map("stripe-checkout")
     PAYREXX_SUBSCRIPTION @map("payrexx-subscription")
     NO_CHARGE            @map("no-charge")
     …
   }
   ```

   Even where the mapped value is identical to the member (`Currency.CHF @map("CHF")`,
   `MailLogState.submitted @map("submitted")`) the `@map` is written out.

2. **Bare members, no `@map`** — `UserEvent`, `SubscriptionEvent`, `MailTemplateContext`,
   `PayrexxPSP`, `PayrexxPM`, `StripePaymentMethod`, `MolliePaymentMethod`, `Locale`,
   `AuditLogActorType`(partly), `NotificationSource`.

Enum **types** in Postgres are named after the Prisma enum, unmapped and unprefixed:
`CREATE TYPE "EventStatus" AS ENUM ('cancelled', …)` (`20221122102944_create_events/migration.sql:2`).
There is no `@@map` for enums and no way to prefix an enum type name without `multiSchema`. A new
`EventPublicationStatus` enum would therefore land as a bare `"EventPublicationStatus"` type in
`public`, regardless of which table-prefix option is chosen.

**Style to follow for the port:** PascalCase members with explicit `@map` to the lowercase wire
value, matching `EventStatus`.

### 2.8 Indexes and constraints

| Attribute | Count | Notes |
| --- | --- | --- |
| `@@index` | 72 | plain btree unless annotated |
| `@@unique` | 17 | e.g. `@@unique([type, tag])` on `Tag:1287` |
| `@@id` (composite) | 9 | join tables |
| `@@map` | 96 | §2.3 |

Notable forms actually used:

```prisma
@@index([articleId, createdAt(sort: Desc), id(sort: Desc)])                       // :47  sort order
@@index([slug(ops: raw("gin_trgm_ops"))], type: Gin, map: "articles_slug_trgm_idx") // :137 GIN + explicit name
@@index([hidden, publishedAt(sort: Desc)])                                        // :138 composite
@@unique([jobId, position])                                                       // :688
```

`map:` is only used where Prisma's generated name would be wrong or too long — the two trigram
indexes (`articles_slug_trgm_idx`, `pages_slug_trgm_idx`). Everything else takes the default
`<table>_<cols>_idx` / `_key` / `_pkey` names, which inherit the dotted table prefix:
`"events.tagged-events_pkey"`, `"articles.revisions_publishedAt_idx"`.

Partial and covering indexes that Prisma cannot express are written by hand in the migration —
`20250820145935_…` creates six of them, e.g.

```sql
CREATE INDEX article_revisions_published_by_article_created_id_desc
    ON "articles.revisions" ("articleId", "createdAt" DESC, "id" DESC)
    INCLUDE ("publishedAt")
    WHERE "publishedAt" IS NOT NULL;
```

Note these hand-written index names **do not** carry the dotted prefix, so they drift from the
Prisma-generated ones. That is accepted practice here.

### 2.9 Relations and referential actions

`onDelete` distribution across the 73 relations that declare one:

| Action | Count |
| --- | --- |
| `Cascade` | 55 |
| `SetNull` | 14 |
| `Restrict` | 4 |

`onUpdate` is **never** written explicitly (0 occurrences) — every FK gets Prisma's default
`ON UPDATE CASCADE`. Named relations are used only where two FKs point at the same table:

```prisma
image   Image?  @relation("articleRevisionImage",            fields: [imageID],            references: [id])
socialMediaImage Image? @relation("articleRevisionSocialMediaImage", fields: [socialMediaImageID], references: [id])
```

Rules of thumb visible in the data: child rows of an aggregate cascade
(`ArticleRevision → Article`, `CrowdfundingGoal → Crowdfunding`, every `Tagged*` join); optional
references to shared assets or actors are `SetNull` (`Image`, `User`); and a reference that must
block the delete is `Restrict` (`Article.peer`).

### 2.10 Views

Six `view` blocks, all of them the revision-state views:

| View | Table | Lines |
| --- | --- | --- |
| `ArticleRevisionPublished` | `articles.revisions.published` | 51-59 |
| `ArticleRevisionPending` | `articles.revisions.pending` | 61-69 |
| `ArticleRevisionDraft` | `articles.revisions.draft` | 71-79 |
| `PagesRevisionPublished` | `pages.revisions.published` | 906-914 |
| `PagesRevisionPending` | `pages.revisions.pending` | 916-924 |
| `PagesRevisionDraft` | `pages.revisions.draft` | 926-934 |

Each is a two-column projection declared with `@unique` on both columns and two relations:

```prisma
view ArticleRevisionPublished {
  id              String          @unique
  articleRevision ArticleRevision @relation(fields: [id], references: [id])

  articleId String  @unique
  article   Article @relation(fields: [articleId], references: [id])

  @@map("articles.revisions.published")
}
```

and the parent models carry the back-references
(`Article:130-132: ArticleRevisionPublished ArticleRevisionPublished?` etc.). Omitting the
back-reference is a validation error — probe `t7` reproduced it exactly:

```
error: Error validating field `event` in view `EventRevisionPublished`: The relation field `event`
on view `EventRevisionPublished` is missing an opposite relation field on the model `EventEntity`.
Either run `prisma format` or add it manually.
```

**Prisma Migrate does not create or drop views.** Probe `t7` produced a `migrate diff` containing
only `CREATE TABLE` / `CREATE INDEX` / `ADD CONSTRAINT`; the three `view` blocks emitted nothing.
The DDL lives in a hand-written migration,
`20250820145935_add_article_and_page_revisions_published_draft_pending_view/migration.sql`:

```sql
CREATE VIEW "articles.revisions.published" AS
    SELECT DISTINCT ON ("articleId")
        id, "articleId"
    FROM "articles.revisions"
    WHERE "publishedAt" IS NOT NULL AND "publishedAt" <= CURRENT_TIMESTAMP
    ORDER BY "articleId", "createdAt" DESC, id DESC;
```

(…pending = `publishedAt > CURRENT_TIMESTAMP`; draft = `archivedAt IS NULL AND publishedAt IS NULL`),
each paired with a matching partial index. `20260817121431_add_timezones_to_dates` had to drop and
recreate all six when the underlying column types changed — **a view pins the column types of its
source table, so any future `ALTER COLUMN` on an events revision table must drop and recreate the
events views in the same migration.**

### 2.11 Column types in use

| Prisma type | Occurrences | Notes |
| --- | --- | --- |
| `String` / `String?` | 225 / 203 | `text` |
| `DateTime` / `DateTime?` | 190 / 35 | 221 of them `@db.Timestamptz(3)` |
| `Boolean` / `Boolean?` / `Boolean[]` | 47 / 5 / 1 | |
| `Int` / `Int?` | 24 / 15 | one `@db.SmallInt` (`SubscriptionInterval.daysAwayFromEnding:1513`) |
| `Json` / `Json?` | 13 / 30 | `jsonb` |
| `String[]` | 6 | Postgres arrays, e.g. `User.roleIDs`, `Image.tags` |
| `Float` | 4 | |
| `Decimal?` | 1 | `SettingPaymentProvider.payrexx_vatrate @db.Decimal(5, 4)` |
| `Bytes`, `BigInt` | 0 | not used |

`graphql-prisma.md` states the rule: *“Prefer real columns and relations over JSON blobs. A JSON
column is acceptable only for a genuinely opaque payload with no per-element querying.”* The
accepted `Json` uses are rich text (`Event.description`, `Event.slateDescription`), **block content**
(`ArticleRevision.blocks`, `PageRevision.blocks`, `BlockTemplate.blocks`), and frozen audit
snapshots (`MailSendJob` filter criteria, `schema.prisma:614-615`).

### 2.12 Things in the schema that are *not* conventions

- **Implicit many-to-many.** `Crowdfunding.memberPlans MemberPlan[]` and
  `Goodie.memberPlans MemberPlan[]` with no explicit join model make Prisma create
  `_CrowdfundingToMemberPlan` and `_GoodieToMemberPlan`:

  ```sql
  CREATE TABLE "_CrowdfundingToMemberPlan" ("A" UUID NOT NULL, "B" TEXT NOT NULL);
  CREATE UNIQUE INDEX "_CrowdfundingToMemberPlan_AB_unique" ON "_CrowdfundingToMemberPlan"("A", "B");
  CREATE INDEX "_CrowdfundingToMemberPlan_B_index" ON "_CrowdfundingToMemberPlan"("B");
  ```

  These escape *every* naming convention and cannot be `@@map`'d. **The events domain has four
  many-to-many relations to port** (`event_category` 54 851 rows, `organization_category`,
  `organization_affiliation`, `user_organization` — `bka-01-data-model.md:1398-1406`). Model them as
  **explicit join models** with `@@id([a, b])` and a dotted `@@map`, the way `TaggedEvents`,
  `TaggedArticles` and `PaywallMemberplan` already are. An implicit relation would produce
  `_EventToEventCategory` sitting outside the `events.` namespace.
- **`@db.Uuid` ids** (§2.5) — three leftovers, not a pattern.
- **`…ID` field casing** (§2.4) — legacy.
- **The `tackingPixelMethodID` typo** at line 1 821.
- **Plain `DateTime` without `Timestamptz`** at lines 719-720.

---

## 3. Migrations

### 3.1 Directory conventions

`libs/api/prisma/migrations/` holds **178 migration directories** plus `migration_lock.toml`.

```
libs/api/prisma/migrations/
  20220812113731_init/migration.sql
  …
  20261014120000_add_medium_features/migration.sql
  migration_lock.toml
```

- Naming: `<14-digit timestamp>_<snake_case_description>`, exactly Prisma's own format.
- **Every directory contains exactly one file, `migration.sql`.** There are no `.ts` data-migration
  scripts, no `down` files, no README files — `find … -type f ! -name "migration.sql"` returns only
  `migration_lock.toml`.
- `migration_lock.toml` is three lines: a “do not edit” comment and `provider = "postgresql"`.
- **33 of the 178** have a timestamp ending in `0000` (hand-written directory, created by hand rather
  than by `migrate dev`); the other 145 carry a real wall-clock timestamp from `prisma migrate dev`.
- Dates run from `20220812113731` to `20261014120000`.

### 3.2 Generated vs hand-written SQL

Machine-generated migrations keep Prisma's comment markers and are left untouched:

```sql
-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('create', 'update', 'delete', 'other');

-- CreateTable
CREATE TABLE "audit_logs" ( … );

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
```

Hand-written migrations in the same directory structure do three further kinds of work:

| Kind | Example |
| --- | --- |
| **View + partial index DDL** | `20250820145935_add_article_and_page_revisions_published_draft_pending_view` |
| **Data backfill** | `20260925120000_lowercase_article_and_page_slugs` (dedupes then `UPDATE "articles" SET slug = LOWER(slug)`), `20240513152239_migrate_revision_tags` (`INSERT … SELECT DISTINCT ON (tag) … FROM "articles.revisions"`) |
| **PL/pgSQL functions** | `20230511111111_create_default_flows` defines `insert_default_subscription_flow()` and calls it |

Raw SQL in a migration **always double-quotes** identifiers, which is mandatory given the dotted
table names and the camelCase column names.

### 3.3 Commands and the deploy path

```bash
npm run start:docker                             # docker-compose up database storage dragonfly
npx prisma migrate dev --name add_foo_to_bar     # create + apply (dev; needs CREATEDB for the shadow DB)
npx prisma migrate dev --create-only --name …    # create an empty/unapplied migration to hand-edit
npx prisma generate                              # regenerate the client (also runs on npm install)
npm run migrate                                  # prisma migrate deploy && prisma db seed && npm run changelog:sync
```

(`package.json:9`, `.ai/development.md:48-51`, `.claude/docs/graphql-prisma.md`.)

In production the **`migration` container** does it (`Dockerfile:195-254`, `docker/migrate_start.js`):

```js
if (process.env.DATABASE_URL && !process.env.DIRECT_DATABASE_URL) {
  process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL.replace(':5432/', ':5433/');
}
execFileSync('node', ['node_modules/.bin/prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
execFileSync('node', ['dist/api/prisma/run-seed.js'],                   { stdio: 'inherit' });
execFileSync('node', ['dist/changelog/run-sync-changelogs.js'],         { stdio: 'inherit' });
```

i.e. port 5432 is PgBouncer, 5433 is direct Postgres, and migrations must go direct. The container
has only `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@node-rs/argon2` installed
(`Dockerfile:239`) plus `prisma/schema.prisma`, `prisma/migrations`, `prisma.config.ts` and a
`tsc`-compiled `dist/` of the two seed entry points, built with `docker/tsconfig.yaml_seed`.

### 3.4 CI

`.github/workflows/test.yml` spins up `postgres:17` as a service, runs `npm ci` (which triggers
`prepare: prisma generate`) and `npm run test-backend -- --configuration=ci` with
`DATABASE_URL=postgresql://postgres:test@localhost:5432/wepublish_test?schema=public`. **CI never
runs `prisma migrate deploy`** — integration tests that need tables rely on whatever the test sets
up, and `clearFullDatabase` truncates everything in `public`. `.github/workflows/lint.yml` runs
`npm ci` + `npm run lint` only. There is **no drift check** (`prisma migrate diff --exit-code`) in
CI and no `prisma validate` step.

### 3.5 The written rules

`.claude/docs/graphql-prisma.md`, verbatim:

- **Never hand-edit a migration that has already been merged.** Write a new one.
- **Never edit generated Prisma client output.**
- Follow the existing naming style in `migrations/` — snake_case, descriptive.
- Prefer real columns and relations over JSON blobs.
- Adding an index or a nullable column is cheap; renaming or dropping a column on a live table needs
  a staged migration. **Flag destructive migrations to the user** rather than generating them
  silently.

And the end-to-end checklist for a field that reaches the website:

1. `schema.prisma` → `npx prisma migrate dev --name …`
2. failing test in `libs/<domain>/api`
3. model + resolver/service → test passes
4. start the API so `apps/api-example/schema-v2.graphql` regenerates
5. add the field to the `.graphql` document, `npm run generate-api`
6. story + failing test in `libs/<domain>/website`, then the component
7. `npx nx affected -t lint test --uncommitted`

---

## 4. How Prisma models surface as GraphQL types

**They do not. There is no Prisma→GraphQL generator.** The only generator in the schema is
`prisma-client-js`; there is no `prisma-nestjs-graphql`, no `typegraphql-prisma`, no SDL emitted
from the datamodel. The GraphQL schema is **code-first from NestJS decorators** and
`apps/api-example/schema-v2.graphql` is its *output* (`autoSchemaFile`, and only when
`NODE_ENV !== 'production'` — `.claude/docs/gotchas.md:121-131`).

The hand-written bridge has four recurring moves, all visible in
`libs/event/api/src/lib/event.model.ts`:

1. **A separate `@ObjectType()` class per GraphQL type**, with `@Field()` per exposed column:

   ```ts
   @ObjectType()
   export class Event {
     @Field() id!: string;
     @Field() createdAt!: Date;
     @Field({ nullable: true }) lead?: string;
     @Field(type => GraphQLRichText, { nullable: true }) description?: RichtextJSONDocument;
     @Field(type => EventStatus) status!: EventStatus;
     @Field(type => Image, { nullable: true }) image?: Image;
   }
   ```

2. **Prisma enums are imported and re-registered**, not redeclared:

   ```ts
   import { EventStatus } from '@prisma/client';
   registerEnumType(EventStatus, { name: 'EventStatus' });
   ```

   The same pattern appears for `PaymentState`, `PaymentPeriodicity`, `TagType`,
   `TrackingPixelProviderType`, `MailProviderType`, `AuditLogAction` and others — 281 files under
   `libs/` import from `@prisma/client`.

3. **The Prisma row type is imported under a `P` alias** where it would collide with the GraphQL
   class: `import { Article as PArticle } from '@prisma/client'`,
   `Event as PEvent`, `User as PUser`, `Page as PPage`, `Image as PImage`, `Tag as PTag`,
   `WebsiteSettings as PWebsiteSettings`, … It is used for `@Parent()` parameters and service return
   types, so the resolver signature says which side of the boundary it is on.

4. **Relations are resolved with `@ResolveField` + a dataloader**, never with a Prisma call inside a
   list query; services are decorated with `@PrimeDataLoader(XDataloaderService)` to warm the cache
   (`.ai/conventions.md:21-42`). `libs/event/api/src/lib/event-dataloader.service.ts` is the local
   example.

Consequences for the port: **every new events table needs a hand-written model file**, and the
schema shape is free to differ from the table shape (merge, rename, hide). Nothing in `schema.prisma`
leaks into GraphQL by itself.

---

## 5. Question 1 — can this Prisma version use a multi-file schema?

### 5.1 Answer: yes, and no flag is needed

`prismaSchemaFolder` is **GA in 7.5.0**; passing it as a preview feature produces
`Preview feature "prismaSchemaFolder" is deprecated. The functionality can be used without
specifying it as a preview feature.` (probe `t15`).

Evidence that it works on *this* schema, not a toy:

| Probe | What was done | Result |
| --- | --- | --- |
| `t2-folder` | real schema split into `schema/config.prisma` (generator + datasource) + `schema/main.prisma` (everything else), `prisma validate --schema <dir>` | `The schemas at t2-folder/schema are valid 🚀` |
| `t3-gen` | same folder, `prisma generate` with an explicit `output` | `✔ Generated Prisma Client (v7.5.0) to ./t3-gen/generated-client in 475ms` |
| `t9-folderconfig` | folder referenced from a `prisma.config.ts` (`schema: path.join(__dirname, 'libs/api/prisma/schema')`) | `Prisma schema loaded from libs/api/prisma/schema.` + valid |
| `t9` (2nd step) | `EventStatus`, `Event` and `TaggedEvents` moved into their own `events.prisma`, with their relations (`Image`, `Tag`) left in `core.prisma` | valid — **cross-file relations work** |
| `t9` (3rd step) | `prisma migrate diff --from-schema <single-file baseline> --to-schema <folder>` | `-- This is an empty migration.` — **the split produces zero SQL churn** |

Rules the probes confirmed:

- Only one `generator` and one `datasource` are meaningful. Two `datasource` blocks in different
  files **validate without error** and the *first* one wins (probe `t14`:
  `Datasource "db": PostgreSQL database "probe"…` while `db2` was silently ignored). Keep the
  generator and datasource in a single `config.prisma` so this can never bite.
- Errors are reported with the correct per-file path and line
  (`-->  t14/schema/b.prisma:5`).
- A missing folder fails loudly:
  `Error: Could not load '--schema' from provided path 't14/does-not-exist': file or directory not found`.

### 5.2 What actually breaks

Everything that hard-codes the single file path, and one thing that is easy to miss:

| # | Thing | Today | After a folder split |
| --- | --- | --- | --- |
| 1 | `prisma.config.ts:12-15` | `fs.existsSync('libs/api/prisma/schema.prisma') ? … : 'prisma/schema.prisma'` | must point at the two **directories** |
| 2 | **Migrations directory default** | `schemaRootDir = libs/api/prisma` → `libs/api/prisma/migrations` ✔ | `schemaRootDir = libs/api/prisma/schema` → Prisma would look in **`libs/api/prisma/schema/migrations`** ✗ |
| 3 | `Dockerfile:14` | `COPY ./libs/api/prisma/schema.prisma ./libs/api/prisma/schema.prisma` | must copy the directory |
| 4 | `Dockerfile:213` and `:231` | `COPY libs/api/prisma/schema.prisma prisma/schema.prisma` | `COPY libs/api/prisma/schema prisma/schema` (and the Docker branch of the config must agree) |
| 5 | `Dockerfile:229` | `COPY libs/api/prisma/migrations prisma/migrations` | unchanged **only if** `migrations.path` is set explicitly; otherwise the destination must move to `prisma/schema/migrations` |
| 6 | `package.json:210-213` | dead already | can simply be deleted in the same change |
| 7 | `libs/api/package.json:24-27` | dead already | same |
| 8 | `libs/api/project.json:19` | `assets: ["libs/api/*.md", "libs/api/prisma/**/*"]` | **already a glob — unaffected** |
| 9 | Codegen (`codegen.yml`, `npm run generate-api`) | reads `apps/api-example/schema-v2.graphql` and `.graphql` documents | **unaffected — it never touches Prisma** |
| 10 | Seeds (`libs/api/prisma/seed.ts`, `run-seed.ts`, `apps/api-example/prisma/seed*.ts`) | import `@prisma/client` only | **unaffected** |
| 11 | `tsconfig.base.json:27` `@wepublish/api/seed` | `libs/api/prisma/seed.ts` | **unaffected** (seed file does not move) |
| 12 | CI (`test.yml`, `lint.yml`) | `npm ci` → `prisma generate` via `prepare` | **unaffected** — `prisma generate` reads the config |
| 13 | `.claude/docs/graphql-prisma.md`, `.ai/development.md:54`, `.claude/docs/repo-map.md:70`, `.ai/architecture.md:94` | name the single file | must be updated (non-negotiable #8 in `CLAUDE.md`) |
| 14 | Editor tooling / `Prisma.prisma` VS Code extension | fine with folders | **unaffected** |
| 15 | Anyone's open branch | one file → merge conflicts resolve in one place | a split is a **massive rename**; every in-flight schema change conflicts |

Item 2 is the only one that is silently wrong rather than loudly broken: `prisma migrate deploy`
would report *“No migration found”* and happily do nothing against an empty database.

### 5.3 Precise migration steps, if the split is wanted

1. `git mv libs/api/prisma/schema.prisma libs/api/prisma/schema/core.prisma`, then split `core.prisma`
   into one file per domain. Keep **`generator` + `datasource` alone in `libs/api/prisma/schema/config.prisma`**.
   Suggested boundaries that follow the existing clusters:
   `config.prisma`, `content.prisma` (article/page/revision/view/tag/block), `media.prisma`
   (image/document), `community.prisma` (user/session/token/consent/comment/poll),
   `membership.prisma` (member plan/subscription/invoice/payment/paywall/crowdfunding/goodie),
   `mail.prisma`, `settings.prisma`, `platform.prisma` (audit log, medium features, changelog,
   notifications, periodic jobs), **`events.prisma`**.
2. Rewrite `prisma.config.ts`:

   ```ts
   const repoSchemaDir   = path.join(__dirname, 'libs/api/prisma/schema');
   const dockerSchemaDir = path.join(__dirname, 'prisma/schema');
   const schemaPath = fs.existsSync(repoSchemaDir) ? repoSchemaDir : dockerSchemaDir;

   const repoMigrations   = path.join(__dirname, 'libs/api/prisma/migrations');
   const dockerMigrations = path.join(__dirname, 'prisma/migrations');

   export default defineConfig({
     schema: schemaPath,
     migrations: {
       path: fs.existsSync(repoMigrations) ? repoMigrations : dockerMigrations,  // ← REQUIRED
       seed: 'nx seed api-example --prod',
     },
     datasource: { url: migrateUrl },
   });
   ```

   Setting `migrations.path` explicitly is what keeps `libs/api/prisma/migrations` and
   `prisma/migrations` working; without it Prisma looks inside the schema folder.
3. Dockerfile: change line 14 to `COPY ./libs/api/prisma/schema ./libs/api/prisma/schema`, and lines
   213 and 231 to `COPY libs/api/prisma/schema prisma/schema`. Line 229 (`COPY libs/api/prisma/migrations
   prisma/migrations`) stays, given step 2.
4. Delete the dead `prisma` blocks in `package.json:210-213` and `libs/api/package.json:24-27` so
   nobody later “fixes” them to point at a file that no longer exists.
5. Verify, in this order:
   - `npx prisma validate` → `The schemas at libs/api/prisma/schema are valid 🚀`
   - `npx prisma generate` → client regenerates
   - `npx prisma migrate diff --from-schema <a copy of the pre-split single file> --to-schema libs/api/prisma/schema --script`
     → must print `-- This is an empty migration.` (this is the guarantee that the split changed no
     DDL; probe `t9` did exactly this against the real schema and got an empty diff)
   - `npm run migrate` against a scratch database
   - build the `migration` Docker target and run it against a scratch database
6. Update `.claude/docs/graphql-prisma.md`, `.ai/development.md:54`, `.ai/architecture.md:93-95`
   (which also needs the Prisma 5 → 7 correction) and `.claude/docs/repo-map.md:70`.

### 5.4 Recommendation on the split

**Technically free, organisationally expensive — and independent of the events work.** The split
produces an empty SQL diff, the client is byte-identical in shape, and the only config change beyond
paths is `migrations.path`. But: it is a whole-file rename that conflicts with every open branch, it
touches the Dockerfile in three places, and `migrations.path` is a silent-failure trap if forgotten.

Do it **as its own commit, before the events work starts**, or not at all during this port. A
2 352-line schema is large but not unmanageable, and the events domain adds perhaps 400-600 lines
in one contiguous, easy-to-find block at the bottom. If the split does happen, the single strongest
argument for it is that `events.prisma` becomes a self-contained file the port can own.

---

## 6. Question 2 — the `events.` table prefix

Three candidate mechanisms. All three were built and run through
`prisma validate` and `prisma migrate diff --script` in `$TMPDIR/prisma-probe`.

### 6.1 Option A — PostgreSQL `multiSchema` (a real `events` schema)

**Supported?** Yes, and **GA** — no preview feature needed in 7.5.0. Adding it produces
`Preview feature "multiSchema" is deprecated. The functionality can be used without specifying it as
a preview feature.` (probes `t4`, `t15`).

**Enabled?** No. The datasource has no `schemas = [...]` (`schema.prisma:6-8`).

**It works.** Probe `t4-multischema`:

```prisma
datasource db {
  provider = "postgresql"
  schemas  = ["public", "events"]
}

model EventOrganization {
  …
  @@map("organizations")
  @@schema("events")
}
```

→ `The schema at t4-multischema/schema.prisma is valid 🚀`, and
`prisma migrate diff --from-empty --to-schema …`:

```sql
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "events";

CREATE TABLE "events"."organizations" ( … );

ALTER TABLE "events"."organizations"
  ADD CONSTRAINT "organizations_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") …;
```

Cross-schema foreign keys are emitted correctly.

**But enabling it is not local to the events domain.** The moment `schemas = [...]` appears,
**every model, view and enum in the file must carry `@@schema`**. Probe `t5-ms-repo` added
`schemas` plus a single `@@schema("events")` on `Event` and got 49 reported errors of the form:

```
Error code: P1012
error: Error validating model "ArticleRevision": This model is missing an `@@schema` attribute.
  -->  t5-ms-repo/schema.prisma:12
error: Error validating model "ArticleRevisionAuthor": This model is missing an `@@schema` attribute.
…
```

Probe `t6-ms-full` annotated the whole file programmatically and reports the true cost:
**90 models + 6 views + 40 enums = 136 `@@schema` lines** before it validates. (It then does:
`The schema at t6-ms-full/schema.prisma is valid 🚀`.)

Worse, **moving the existing `events` tables into a schema is destructive**. Probe `t6`'s diff
against the current schema:

```sql
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "events";

-- CreateEnum
CREATE TYPE "events"."EventStatus" AS ENUM ('cancelled', 'rescheduled', 'postponed', 'scheduled');

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_imageId_fkey";
-- DropTable
DROP TABLE "events";
-- DropTable
DROP TABLE "events.tagged-events";
-- DropEnum
DROP TYPE "EventStatus";

-- CreateTable
CREATE TABLE "events"."events" ( … );
CREATE TABLE "events"."events.tagged-events" ( … );
```

Prisma emits `DROP TABLE` + `CREATE TABLE`, **not** `ALTER TABLE … SET SCHEMA`. For this port that
particular data loss is irrelevant (wp-01 says the current implementation is being deleted), but it
tells you what happens the next time anything moves across the schema boundary.

Four further costs, each grounded:

| Cost | Evidence |
| --- | --- |
| **Integration-test cleanup silently skips the new schema.** `clearFullDatabase` queries `information_schema.tables WHERE table_schema = 'public'`. Events tables would never be truncated between tests. | `libs/testing/src/lib/prisma-utils.ts:41-43` |
| **Production dumps may exclude it.** The restore tool's own comment records that older dumps were taken with `--schema=public`: *“Older dumps miss extensions entirely (excluded by `--schema=public`)”.* Whether today's dumps are still public-only is **UNVERIFIED** — it is settled by looking at the ops dump pipeline, which is outside this repo. If they are, an `events` schema would simply not be in the backup. | `tools/setup-local-production-database.sh:86` |
| **`search_path` assumptions.** Every `DATABASE_URL` in the repo carries `?schema=public` (`docker-compose.yml:13,26`, `.env:2-3`, both CI workflows). `PrismaService` does **not** pass the adapter's `schema` option (`PrismaPgOptions.schema` exists in `@prisma/adapter-pg/dist/index.d.ts:59` but is unused), so the session `search_path` is the Postgres default. Prisma's own queries fully qualify table names under `multiSchema`, but every hand-written `$queryRaw` and the `_prisma_migrations` table rely on the path. | `libs/nest-modules/src/lib/database/prisma.service.ts:11-21` |
| **136 lines of unrelated churn** in a file eight other people have branches against. | probe `t6` |

One genuine upside: enum type names can be prefixed too (`"events"."EventStatus"`), which no other
option offers.

### 6.2 Option B — a dotted table name via `@@map` (the house style)

**This is what the repository already does, 57 times, including for events.** `TaggedEvents` is
mapped to `events.tagged-events` (`schema.prisma:1424`) and has been since
`20221122102944_create_events/migration.sql:27`:

```sql
CREATE TABLE "events.tagged-events" (
    "eventId" UUID NOT NULL,
    "tagId"   TEXT NOT NULL,
    …
    CONSTRAINT "events.tagged-events_pkey" PRIMARY KEY ("eventId","tagId")
);
```

The dot is **part of the identifier**, not a schema separator. Everything lives in `public`.

Probe `t7-dotmap` built a realistic eight-block events domain — `events.organizations`,
`events.venues`, `events` (the aggregate), `events.revisions`, `events.occurrences`, plus the three
revision views `events.revisions.published|pending|draft` — and it validates and diffs cleanly:

```sql
CREATE TABLE "events.organizations" (
    "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name"       TEXT NOT NULL,
    "imageId"    TEXT,
    CONSTRAINT "events.organizations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "events.venues"       ( … );
CREATE TABLE "events"              ( … );
CREATE TABLE "events.revisions"    ( … );
CREATE TABLE "events.occurrences"  ( … );

CREATE INDEX "events.organizations_name_idx"               ON "events.organizations"("name");
CREATE INDEX "events.revisions_eventId_createdAt_id_idx"   ON "events.revisions"("eventId", "createdAt" DESC, "id" DESC);

ALTER TABLE "events.venues"
  ADD CONSTRAINT "events.venues_organizationId_fkey" FOREIGN KEY ("organizationId")
  REFERENCES "events.organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

A table named `events` and a table named `events.organizations` coexist with no conflict — exactly
as `events` and `events.tagged-events` already do in production.

The three real costs:

1. **Raw SQL must quote, and ideally schema-qualify.** An unquoted `events.organizations` in SQL
   means *schema `events`, table `organizations`*. The repo's own raw queries show both safe forms:

   ```sql
   -- libs/article/api/src/lib/article.service.ts:795 — belt and braces
   JOIN public."articles.revisions" ar ON a."id" = ar."articleId"

   -- libs/richtext/api/src/lib/slate-to-pm-migrator.ts:822 — quoting alone is enough
   SELECT id from "articles.revisions" WHERE blocks::text LIKE …
   ```

   Only three service files in the whole repo use raw SQL, so the blast radius is small — but the
   events domain will want a full-text/occurrence search query, and that query must quote.
2. **Index-name truncation can collide.** Postgres identifiers cap at 63 bytes and Prisma truncates
   to fit. With a long dotted prefix this becomes a validation error. Probe `t12`, on a table mapped
   to `events.occurrences.accessibility-features` (40 chars) with two single-column indexes on
   `occurrenceIdentifierA` / `occurrenceIdentifierB`:

   ```
   error: Error parsing attribute "@@index": The given constraint name
   `events.occurrences.accessibility-features_occurrenceIdentif_idx` has to be unique in the
   following namespace: global for primary key, indexes and unique constraints.
   Please provide a different name using the `map` argument.
   ```

   Probe `t11` shows the truncation in action at exactly 63 characters:

   ```
   46  events.occurrences.accessibility-features_pkey
   63  events.occurrences.accessibility-features_featureId_occurre_idx
   63  events.occurrences.accessibility-features_occurrenceId_feat_key
   ```

   **Mitigation:** keep names to two levels (`events.occurrences`, not
   `events.occurrences.accessibility-features`) and add `map: "…"` on any long index, exactly as the
   repo already does for `articles_slug_trgm_idx`. Prisma catches collisions at `validate` time, so
   this fails loudly, never silently.
3. **Ergonomics.** `psql` tab-completion and `\d events.organizations` need quoting
   (`\d "events.organizations"`). Everyone working on this codebase already lives with it for
   `articles.revisions`.

### 6.3 Option C — an underscore prefix (`events_organizations`)

Works trivially; 13 tables already use `snake_case` (§2.3). Nothing to test — it is an ordinary
identifier.

What it buys: no quoting subtleties in raw SQL.

What it costs: it **contradicts the convention for table families**. Every other multi-table domain
in this repo — articles, pages, comments, polls, subscriptions, settings, mail, notifications,
changelog, member plans — uses the dot. `snake_case` here is reserved for standalone tables. Picking
`events_organizations` makes events the only family that reads differently, and it does not even
save characters: `events.` and `events_` are both 7 bytes, so the 63-byte index budget is identical
(probe `t12`'s collision would happen at exactly the same point).

### 6.4 Comparison

| | A — `multiSchema` | B — dotted `@@map` | C — `events_` prefix |
| --- | --- | --- | --- |
| Supported by Prisma 7.5.0 | **yes, GA** | yes (plain feature) | yes |
| Already used in this repo | no | **yes, 57 tables / 20 prefixes** | yes, for *standalone* tables |
| Lines of unrelated schema churn | **136 `@@schema` lines** | 0 | 0 |
| Migration to move the current `events` tables | `DROP TABLE` + `CREATE TABLE` | n/a (tables already named this way) | rename |
| Enum type gets the prefix | **yes** (`"events"."EventStatus"`) | no | no |
| `clearFullDatabase` keeps working | **no** (`table_schema='public'` filter) | yes | yes |
| Covered by a `--schema=public` dump | **no** | yes | yes |
| Raw SQL needs care | qualification | **quoting** | no |
| 63-byte index-name budget | best (prefix is in the schema name) | 7 bytes consumed | 7 bytes consumed |
| `psql` ergonomics | best | needs quotes | fine |
| Fits the house style | no | **yes** | partially |

### 6.5 Recommendation

**Option B — dotted `@@map`, i.e. `@@map("events.organizations")`.**

Three reasons, in order of weight:

1. **It is already the convention for exactly this situation.** 57 tables across 20 domain families
   use it, and one of those families is literally `events.` (`events.tagged-events`). The request
   for an “`events.` prefix” is a request to do what the repo does, not to introduce something new.
2. **It costs nothing outside the events domain.** Option A requires editing 136 unrelated blocks,
   breaks `clearFullDatabase`, and puts the domain outside whatever `--schema=public` tooling exists.
   Option B touches only the new models.
3. **Its two sharp edges are known and already handled elsewhere in the repo** — quote identifiers in
   raw SQL (three files do this today), and `map:` long index names (two indexes do this today). Both
   fail loudly, at `prisma validate` time or at the first query, never silently.

Concrete naming proposal, keeping every name at two levels so the index budget stays comfortable:

| Model | `@@map` | Notes |
| --- | --- | --- |
| `Event` | `events` | the aggregate; replaces today's table |
| `EventRevision` | `events.revisions` | mirrors `articles.revisions`; carries `blocks Json` |
| `EventRevisionPublished` / `Pending` / `Draft` (views) | `events.revisions.published` / `.pending` / `.draft` | three levels, but short; mirrors `articles.revisions.published` |
| `EventOccurrence` | `events.occurrences` | 118 021 rows to import |
| `EventOrganization` | `events.organizations` | 741 rows |
| `EventVenue` (BKa `place`) | `events.venues` | 1 276 rows |
| `EventCategory` | `events.categories` | 30 rows |
| `EventAudience` | `events.audiences` | 4 rows |
| `EventRegion` | `events.regions` | 13 rows |
| `EventAffiliation` | `events.affiliations` | 7 rows |
| `TaggedEvents` (existing) | `events.tagged-events` | keep |
| `EventCategories` (join) | `events.event-categories` | **explicit** join model, `@@id([eventId, categoryId])` — 54 851 rows |
| `EventOrganizationCategories` (join) | `events.organization-categories` | explicit |
| `EventOrganizationAffiliations` (join) | `events.organization-affiliations` | explicit |
| `EventOrganizationUsers` (join) | `events.organization-users` | explicit — 507 rows, BKa `user_organization` |
| `EventRate` | `events.rates` | 12 697 rows |
| `EventVideo` | `events.videos` | 2 025 rows |
| `EventContact` | `events.contacts` | 90 rows |

(Row counts from `bka-01-data-model.md:1431-1463`.) Whether occurrences hang off the event or off the
revision is the open question recorded in `decisions.md`; the naming above is orthogonal to it.

Enum types will land unprefixed in `public` — `"EventStatus"` already does, and a new
`"EventPublicationStatus"` would too. That is unavoidable without Option A and is consistent with
every other domain.

---

## 7. The migration workflow, and introducing a large new domain

### 7.1 The loop for one change

```bash
npm run start:docker                                  # Postgres on :5432
# edit libs/api/prisma/schema.prisma
npx prisma migrate dev --name create_event_domain     # writes migrations/<ts>_create_event_domain/migration.sql,
                                                      # applies it, regenerates the client
npx nx affected -t lint test --uncommitted
```

`migrate dev` needs a shadow database. `prisma.config.ts` sets no `datasource.shadowDatabaseUrl`, so
Prisma creates and drops a temporary one on the same server — the local `postgres` superuser can;
a restricted role cannot. If that ever becomes a problem, add `shadowDatabaseUrl` to
`prisma.config.ts`'s `datasource` block (the key exists:
`@prisma/config/dist/index.d.ts:26-29`).

### 7.2 How a large new domain should land here

Pattern distilled from the four biggest recent additions (`add_crowdfunding`, `add_paywall`,
`add_tables_for_api_settings`, `add_user_changelog_and_notifications`) and the repo's own rules:

1. **One migration per coherent step, not one per table.** `add_tables_for_api_settings` created five
   tables in one file; `add_user_changelog_and_notifications` created four across two families.
   A single `create_event_domain` migration for the structural tables is in keeping.
2. **Separate the destructive step.** Removing the current `Event`/`TaggedEvents` implementation is a
   `DROP TABLE`. `graphql-prisma.md` says to *flag destructive migrations to the user rather than
   generating them silently*. Make it its own, obviously-named migration
   (`<ts>_drop_legacy_event_tables`) placed **after** the new domain exists, so the ordering reads
   as: create new → import data → drop old.
3. **Views and partial indexes go in a hand-written migration.** Create
   `<ts>_add_event_revision_views` modelled line-for-line on
   `20250820145935_…`: three `CREATE VIEW` plus three partial indexes. Use `--create-only` to get an
   empty directory with a correct timestamp, then write the SQL:

   ```bash
   npx prisma migrate dev --create-only --name add_event_revision_views
   ```

4. **Data import is SQL, in a migration, if it is a one-shot** (precedent:
   `20240513152239_migrate_revision_tags`, `20260925120000_lowercase_article_and_page_slugs`). The BKa
   import is cross-database and far too large for that — `bka-11-schema-history.md:933` already
   proposes a one-shot ETL from a `pg_dump`. Keep it **out** of `migrations/`; a migration that needs
   a second database cannot run in the `migration` container.
5. **Then the Nest lib**: `libs/event/api` gains models, service, resolver, module and
   `*-dataloader.service.ts`, registered in `apps/api-example/src/nestapp/app.module.ts`
   (`.ai/development.md:112-119`). Test first (`CLAUDE.md` non-negotiable #1).
6. **Then the schema and codegen**: start the API so `apps/api-example/schema-v2.graphql`
   regenerates, add `.graphql` documents, `npm run generate-api`, and add any **new** codegen output
   path to `.prettierignore`.
7. **Seed data**: events are already seeded in `apps/api-example/prisma/seed.ts:460,2018-2026` — that
   function has to be rewritten alongside the model, or `nx seed api-example --prod` breaks and with
   it `npm run migrate`.
8. **Docs**: update `.claude/docs/graphql-prisma.md`'s migration count, `.ai/architecture.md`'s
   database section, and `wp-01`'s “code being deleted” list.

### 7.3 A pre-flight check worth adding

Nothing in CI verifies that `schema.prisma` and `migrations/` agree. A drift check is one command:

```bash
npx prisma migrate diff \
  --from-migrations libs/api/prisma/migrations \
  --to-schema       libs/api/prisma/schema.prisma \
  --exit-code
```

It needs `datasource.shadowDatabaseUrl` in `prisma.config.ts` (verified: without it the command
refuses — see §1.3 item 4) and exits `2` when the two disagree. Worth proposing separately; the
events port is exactly the kind of change that can leave the two out of step.

---

## 8. Reproducing the probes

Everything above that is labelled *probe* was produced like this, entirely under `$TMPDIR`:

```bash
mkdir -p "$TMPDIR/prisma-probe" && cd "$TMPDIR/prisma-probe"
ln -s /Users/itrulia/Documents/wepublish/node_modules ./node_modules   # for `prisma/config` + @prisma/client
cat > prisma.config.ts <<'EOF'
import { defineConfig } from 'prisma/config';
export default defineConfig({
  schema: 't1-baseline/schema.prisma',
  datasource: { url: 'postgresql://postgres:postgres@localhost:5432/probe' },
});
EOF

PRISMA=/Users/itrulia/Documents/wepublish/node_modules/.bin/prisma
$PRISMA validate     --schema <variant>
$PRISMA generate     --schema <variant>          # with an explicit `output` so nothing writes to the repo
$PRISMA migrate diff --from-empty  --to-schema <variant> --script
$PRISMA migrate diff --from-schema t1-baseline/schema.prisma --to-schema <variant> --script
```

| Probe | Variant |
| --- | --- |
| `t1-baseline` | verbatim copy of `libs/api/prisma/schema.prisma` |
| `t2-folder` | the same schema split into `schema/config.prisma` + `schema/main.prisma` |
| `t3-gen` | `t2` with `output = "../generated-client"`, used to prove `generate` |
| `t4-multischema` | minimal `multiSchema` sample with a cross-schema FK |
| `t5-ms-repo` | real schema + `schemas = ["public","events"]` + one `@@schema` → 49 errors |
| `t6-ms-full` | real schema + all 136 `@@schema` annotations → valid; diffed against `t1` |
| `t7-dotmap` | eight-block events domain using dotted `@@map`, incl. three views |
| `t8-pkgjson` | `package.json` `prisma.schema` key, no config file → ignored |
| `t9-folderconfig` | folder schema driven from `prisma.config.ts`; events split into `events.prisma`; empty diff vs `t1` |
| `t10` | `t9` + `migrations.path` + a real migrations dir |
| `t11` | long dotted name, index-name truncation at 63 chars |
| `t12` | long dotted name, index-name **collision** → P1012 |
| `t13` | real schema minus `views` / minus `relationJoins` / minus both |
| `t14` | two `datasource` blocks in one folder → first wins silently |
| `t15` | six preview flags → which are deprecated in 7.5.0 |

Repo state afterwards: `git status --porcelain` in
`/Users/itrulia/Documents/wepublish` returns only `?? docs/bka-migration/`, and
`node_modules/.prisma/client/index.js` still carries its pre-probe mtime (Oct 16) — no generate ever
wrote into the repo.

---

## 9. Porting notes

*Implications, clearly separated from the findings above.*

- **Take the `events.` prefix as settled and cheap.** Option B is the repo's own convention, costs
  nothing outside the new models, and needs no schema-wide edit. The request and the house style
  coincide. Budget zero days for it.
- **Treat the multi-file split as a separate, optional change.** It is technically free (empty SQL
  diff, probe `t9`) but it is a whole-file rename plus three Dockerfile edits plus one
  easy-to-forget `migrations.path`. If it happens, land it as its own PR *before* the events work so
  `events.prisma` exists from day one; otherwise skip it and append to the single file as every other
  domain has.
- **Two existing-code landmines to clear early.** `apps/api-example/prisma/seed.ts` seeds events
  (`:460`, `:2018-2026`) and is on the `npm run migrate` path; `libs/testing`'s `clearFullDatabase`
  assumes `public`. Both are fine under Option B, but the seed must be rewritten in the same change
  that replaces the model, or local bring-up breaks.
- **Model the four BKa many-to-many relations explicitly.** An implicit `Event.categories
  EventCategory[]` would create `_EventToEventCategory`, outside the `events.` namespace and
  un-`@@map`-able. Explicit join models with `@@id([a, b])` keep the namespace intact and let the
  import carry the BKa `createdAt`.
- **Keep every new table name to two dotted levels where possible.** Three levels are legal and used
  (`articles.revisions.published`), but each extra level eats into the 63-byte index-name budget and
  probe `t12` shows what that failure looks like. Where a three-level name is right — the revision
  views — it is short enough.
- **The revision views are hand-written SQL, in a migration, every time.** Prisma Migrate will never
  emit them, and any later `ALTER COLUMN` on `events.revisions` must drop and recreate them in the
  same migration (precedent: `20260817121431`).
- **`reviewRequestedAt` (D5) is a plain nullable `@db.Timestamptz(3)` column plus a
  `reviewRequestedById String?` FK with `onDelete: SetNull`** — both inside the repo's conventions,
  and `@@index([reviewRequestedAt])` makes the Agenda-Admin queue in D5 an index scan. Whether it
  belongs on the event or the revision is wp-05's call; the Prisma side is identical either way.
- **No GraphQL comes for free.** Every events table needs a hand-written `@ObjectType`, a dataloader
  if it is ever resolved as a field, and `registerEnumType` for each new Prisma enum. Size the API
  work by the number of *exposed types*, not by the number of tables.
- **Add the drift check.** A domain this size, imported from another database, is where
  `schema.prisma` and `migrations/` drift apart. `prisma migrate diff --from-migrations … --exit-code`
  in CI would catch it, and needs only `datasource.shadowDatabaseUrl` in `prisma.config.ts`.
- **Fix the stale docs while you are in there.** `.ai/architecture.md:93` (“Prisma 5”),
  `.ai/architecture.md:96` (“Full-text search via Prisma preview feature”) and
  `.claude/docs/graphql-prisma.md` (“configured via the `prisma` block in the root `package.json`”,
  “158 and counting”) are all wrong today, and `CLAUDE.md` non-negotiable #8 makes correcting them
  part of the change.

---

## Appendix A — every model, view and enum, with its table

`model`/`view` rows show the `@@map` target and the number of block-level attributes. Line numbers
are in `libs/api/prisma/schema.prisma`.

| Line | Kind | Prisma name | Table (`@@map`) | `@@index` | `@@unique` | `@@id` |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | model | `ArticleRevision` | `articles.revisions` | 2 | – | – |
| 51 | view | `ArticleRevisionPublished` | `articles.revisions.published` | – | – | – |
| 61 | view | `ArticleRevisionPending` | `articles.revisions.pending` | – | – | – |
| 71 | view | `ArticleRevisionDraft` | `articles.revisions.draft` | – | – | – |
| 81 | model | `ArticleRevisionAuthor` | `articles.revisions.author` | – | – | 1 |
| 95 | model | `ArticleRevisionSocialMediaAuthor` | `articles.revisions.social-media-author` | – | – | 1 |
| 106 | model | `Article` | `articles` | 6 | – | – |
| 142 | enum | `TrackingPixelProviderType` | — | | | |
| 146 | model | `ArticleTrackingPixels` | `articles.tracking-pixels` | 1 | – | – |
| 163 | model | `TrackingPixelMethod` | `tracking.pixels.methods` | – | – | – |
| 175 | model | `TaggedArticles` | `articles.tagged-articles` | 2 | – | 1 |
| 189 | model | `AuthorsLinks` | `authors.links` | 1 | – | – |
| 204 | model | `Author` | `authors` | 3 | 1 | – |
| 236 | model | `TaggedAuthors` | `authors.tagged-authors` | – | – | 1 |
| 248 | model | `Image` | `images` | 4 | – | – |
| 299 | model | `Document` | `documents` | 3 | – | – |
| 316 | enum | `CommentItemType` | — | | | |
| 321 | enum | `CommentRejectionReason` | — | | | |
| 326 | model | `CommentsRevisions` | `comments.revisions` | 2 | – | – |
| 342 | enum | `CommentState` | — | | | |
| 349 | enum | `CommentAuthorType` | — | | | |
| 356 | model | `Comment` | `comments` | 4 | – | – |
| 388 | model | `TaggedComments` | `comments.tagged-comments` | – | – | 1 |
| 400 | model | `CommentRatingSystem` | `comments.rating-systems` | – | – | – |
| 412 | enum | `RatingSystemType` | — | | | |
| 416 | model | `CommentRatingSystemAnswer` | `comments.rating-system-answers` | – | 1 | – |
| 434 | model | `CommentRating` | `comments.ratings` | 1 | 1 | – |
| 457 | model | `CommentRatingOverride` | `comments.rating-override` | 1 | – | 1 |
| 474 | model | `InvoiceItem` | `invoices.items` | 1 | – | – |
| 497 | model | `Invoice` | `invoices` | 3 | – | – |
| 531 | enum | `MailLogState` | — | | | |
| 540 | enum | `MailLogType` | — | | | |
| 547 | model | `MailLog` | `mail.log` | 4 | – | – |
| 586 | enum | `MailSendJobState` | — | | | |
| 594 | enum | `MailSendAudience` | — | | | |
| 600 | model | `MailSendJob` | `mail.send_jobs` | 1 | – | – |
| 649 | enum | `MailSendJobRecipientState` | — | | | |
| 659 | model | `MailSendJobRecipient` | `mail.send_job_recipients` | 1 | 1 | – |
| 693 | enum | `PaymentPeriodicity` | — | | | |
| 702 | model | `AvailablePaymentMethod` | `member.plans.payment-methods` | – | – | – |
| 717 | model | `MemberPlanPeriodicityPrice` | `member.plans.periodicity-prices` | – | 1 | – |
| 735 | enum | `Currency` | — | | | |
| 740 | enum | `ProductType` | — | | | |
| 745 | model | `MemberPlan` | `member.plans` | 1 | – | – |
| 793 | model | `NavigationLink` | `navigations.links` | 3 | – | – |
| 817 | model | `Navigation` | `navigations` | 3 | – | – |
| 832 | model | `PageRevision` | `pages.revisions` | 2 | – | – |
| 867 | model | `Page` | `pages` | 4 | – | – |
| 894 | model | `TaggedPages` | `pages.tagged-pages` | – | – | 1 |
| 906 | view | `PagesRevisionPublished` | `pages.revisions.published` | – | – | – |
| 916 | view | `PagesRevisionPending` | `pages.revisions.pending` | – | – | – |
| 926 | view | `PagesRevisionDraft` | `pages.revisions.draft` | – | – | – |
| 936 | model | `PaymentMethod` | `payment.methods` | – | – | – |
| 958 | enum | `PaymentState` | — | | | |
| 969 | model | `Payment` | `payments` | 1 | – | – |
| 987 | model | `PeerProfile` | `peerProfiles` | – | – | – |
| 1007 | model | `Peer` | `peers` | – | – | – |
| 1028 | model | `Token` | `tokens` | – | – | – |
| 1040 | model | `Session` | `sessions` | 4 | – | – |
| 1060 | model | `ImpersonationGrant` | `impersonation_grants` | 1 | – | – |
| 1072 | model | `SubscriptionPeriod` | `subscriptions.periods` | 2 | – | – |
| 1093 | enum | `SubscriptionDeactivationReason` | — | | | |
| 1101 | model | `SubscriptionDeactivation` | `subscriptions.deactivation-reasons` | – | – | – |
| 1115 | model | `Subscription` | `subscriptions` | 2 | – | – |
| 1153 | model | `UserAddress` | `users.addresses` | – | – | – |
| 1172 | model | `PaymentProviderCustomer` | `users.payment-providers` | 1 | – | – |
| 1187 | model | `User` | `users` | 1 | – | – |
| 1234 | model | `UserRole` | `users.roles` | – | – | – |
| 1247 | model | `Setting` | `settings` | – | – | – |
| 1258 | enum | `TagType` | — | | | |
| 1266 | model | `Tag` | `tags` | – | 1 | – |
| 1291 | model | `Poll` | `polls` | – | – | – |
| 1310 | model | `PollAnswer` | `polls.answers` | 1 | – | – |
| 1327 | model | `PollVote` | `polls.votes` | 1 | 1 | – |
| 1351 | model | `PollExternalVoteSource` | `polls.external-vote-sources` | – | – | – |
| 1365 | model | `PollExternalVote` | `polls.external-votes` | – | 1 | – |
| 1382 | enum | `EventStatus` | — | | | |
| **1389** | **model** | **`Event`** | **`events`** | – | – | – |
| **1415** | **model** | **`TaggedEvents`** | **`events.tagged-events`** | – | – | 1 |
| 1427 | model | `Consent` | `consents` | – | – | – |
| 1440 | model | `UserConsent` | `user-consents` | – | 1 | – |
| 1457 | enum | `UserEvent` | — | | | |
| 1465 | model | `UserFlowMail` | `user_communication_flows` | – | – | – |
| 1478 | enum | `SubscriptionEvent` | — | | | |
| 1489 | model | `SubscriptionFlow` | `subscription_communication_flows` | – | – | – |
| 1508 | model | `SubscriptionInterval` | `subscriptions.intervals` | – | – | – |
| 1523 | enum | `MailTemplateContext` | — | | | |
| 1535 | model | `MailTemplate` | `mail_templates` | – | – | – |
| 1565 | model | `PeriodicJob` | `periodic_jobs` | – | – | – |
| 1580 | enum | `BlockType` | — | | | |
| 1605 | model | `BlockStyle` | `block-content.styles` | – | – | – |
| 1616 | model | `BlockTemplate` | `block_templates` | – | – | – |
| 1627 | model | `Banner` | `banners` | – | – | – |
| 1656 | enum | `LoginStatus` | — | | | |
| 1665 | model | `BannerAction` | `banner_actions` | – | – | – |
| 1682 | enum | `BannerActionRole` | — | | | |
| 1688 | enum | `CrowdfundingGoalType` | — | | | |
| 1693 | model | `Crowdfunding` | `crowdfundings` | – | – | – |
| 1708 | model | `CrowdfundingGoal` | `crowdfunding_goals` | – | – | – |
| 1722 | model | `Paywall` | `paywalls` | – | – | – |
| 1753 | model | `PaywallMemberplan` | `paywalls.memberPlans` | – | – | 1 |
| 1767 | model | `PaywallBypass` | `paywall_bypasses` | – | 1 | – |
| 1781 | enum | `MailProviderType` | — | | | |
| 1789 | model | `SettingMailProvider` | `settings.mailprovider` | – | – | – |
| 1814 | model | `SettingTrackingPixel` | `settings.trackingpixel` | – | – | – |
| 1832 | enum | `PaymentProviderType` | — | | | |
| 1843 | enum | `PayrexxPSP` | — | | | |
| 1886 | enum | `PayrexxPM` | — | | | |
| 1922 | enum | `StripePaymentMethod` | — | | | |
| 1947 | enum | `MolliePaymentMethod` | — | | | |
| 1979 | model | `SettingPaymentProvider` | `settings.paymentprovider` | – | – | – |
| 2021 | enum | `ChallengeProviderType` | — | | | |
| 2026 | model | `SettingChallengeProvider` | `settings.challengeprovider` | – | – | – |
| 2041 | enum | `AIProviderType` | — | | | |
| 2045 | model | `SettingAIProvider` | `settings.aiprovider` | – | – | – |
| 2059 | enum | `ExternalAppsTarget` | — | | | |
| 2064 | model | `ExternalApps` | `apps.external` | – | – | – |
| 2078 | enum | `AnalyticsProviderType` | — | | | |
| 2082 | model | `SettingAnalyticsProvider` | `settings.analyticsProvider` | – | – | – |
| 2097 | enum | `SyncProviderType` | — | | | |
| 2101 | model | `SettingSyncProvider` | `settings.syncprovider` | – | – | – |
| 2128 | model | `MailchimpSyncError` | `mailchimp_sync_errors` | – | 1 | – |
| 2146 | model | `WebsiteSettings` | `settings.website` | – | – | – |
| 2179 | model | `DiscountCode` | `discountCodes` | – | 1 | – |
| 2199 | model | `Goodie` | `goodies` | – | – | – |
| 2218 | enum | `NotificationSource` | — | | | |
| 2224 | model | `NotificationRead` | `notifications.reads` | – | 1 | – |
| 2238 | model | `NotificationConfirmation` | `notifications.confirmations` | – | 1 | – |
| 2252 | model | `ChangelogEntry` | `changelog.entries` | – | – | – |
| 2273 | enum | `Locale` | — | | | |
| 2279 | model | `ChangelogEntryTranslation` | `changelog.entries.translations` | – | 1 | – |
| 2296 | model | `OneChannelState` | `one_channel_state` | – | – | – |
| 2306 | model | `MediumFeature` | `medium_features` | – | – | – |
| 2316 | enum | `AuditLogAction` | — | | | |
| 2323 | enum | `AuditLogActorType` | — | | | |
| 2328 | model | `AuditLog` | `audit_logs` | 4 | – | – |

Plus two tables that exist only in the database, created by implicit many-to-many relations and
carrying no Prisma model: **`_CrowdfundingToMemberPlan`** and **`_GoodieToMemberPlan`**
(`20250416141315_add_crowdfunding/migration.sql:31`, `20260714120000_add_goodies/migration.sql`).

## Appendix B — every `@@index` in the schema

| Line | Model | Index |
| --- | --- | --- |
| 46-47 | `ArticleRevision` | `[publishedAt]`; `[articleId, createdAt(Desc), id(Desc)]` |
| 133-138 | `Article` | `[createdAt]`; `[modifiedAt]`; `[publishedAt]`; `[slug]`; `[slug(ops: raw("gin_trgm_ops"))] type: Gin, map: "articles_slug_trgm_idx"`; `[hidden, publishedAt(Desc)]` |
| 159 | `ArticleTrackingPixels` | `[articleId]` |
| 183-185 | `TaggedArticles` | `[tagId]`; `[tagId, articleId]` |
| 200 | `AuthorsLinks` | `[authorId]` |
| 230-232 | `Author` | `[createdAt]`; `[modifiedAt]`; `[name]` |
| 292-295 | `Image` | `[createdAt]`; `[modifiedAt]`; `[title]`; `[tags]` |
| 310-312 | `Document` | `[createdAt]`; `[modifiedAt]`; `[title]` |
| 337-338 | `CommentsRevisions` | `[createdAt]`; `[commentId]` |
| 381-384 | `Comment` | `[itemID, itemType]`; `[parentID]`; `[createdAt]`; `[modifiedAt]` |
| 453 | `CommentRating` | `[commentId]` |
| 470 | `CommentRatingOverride` | `[commentId]` |
| 493 | `InvoiceItem` | `[invoiceId]` |
| 525-527 | `Invoice` | `[mail]`; `[subscriptionID]`; `[dueAt]` |
| 579-582 | `MailLog` | `[mailIdentifier]`; `[recipientID, sentDate(Desc)]`; `[mailSendJobId]`; `[mailProviderMessageID]` |
| 645 | `MailSendJob` | `[status]` |
| 689 | `MailSendJobRecipient` | `[jobId, state]` |
| 789 | `MemberPlan` | `[name]` |
| 811-813 | `NavigationLink` | `[navigationId]`; `[articleID]`; `[pageID]` |
| 826-828 | `Navigation` | `[createdAt]`; `[modifiedAt]`; `[name]` |
| 862-863 | `PageRevision` | `[publishedAt]`; `[pageId, createdAt(Desc), id(Desc)]` |
| 887-890 | `Page` | `[createdAt]`; `[modifiedAt]`; `[publishedAt]`; `[slug(ops: raw("gin_trgm_ops"))] type: Gin, map: "pages_slug_trgm_idx"` |
| 983 | `Payment` | `[intentID]` |
| 1053-1056 | `Session` | `[userID]`; `[token]`; `[expiresAt]`; `[impersonatedBy]` |
| 1068 | `ImpersonationGrant` | `[expiresAt]` |
| 1088-1089 | `SubscriptionPeriod` | `[subscriptionId]`; `[invoiceID]` |
| 1148-1149 | `Subscription` | `[userID]`; `[memberPlanID, createdAt, id]` |
| 1183 | `PaymentProviderCustomer` | `[userId]` |
| 1230 | `User` | `[createdAt]` |
| 1323 | `PollAnswer` | `[pollId]` |
| 1347 | `PollVote` | `[answerId]` |
| 2347-2350 | `AuditLog` | `[createdAt]`; `[userId, createdAt]`; `[sessionId]`; `[entity, recordId]` |

**The `Event` model carries no `@@index` at all today** (`schema.prisma:1389-1413`) — not even on
`startsAt`. Any ported events domain will need them.
