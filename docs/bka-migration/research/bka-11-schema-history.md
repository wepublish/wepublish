# BKA Schema History — Migrations, the MySQL→PostgreSQL Move, and What Is Actually Alive

Scope note. This document reconstructs the schema evolution of the `insitu-admin` Symfony/Doctrine
backend (`/Users/itrulia/Documents/insitu-admin`) as it applies to the **BKA** product
(`SYLIUS_THEME=in-situ-admin/bka`), and cross-checks every structure against the **restored BKA
production database** (`docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin`,
PostgreSQL 18.3, 211 MB, 34 279 events). It covers: all 67 Doctrine migrations in
`/Users/itrulia/Documents/insitu-admin/migrations` and the `doctrine_migration_versions` table; the
MySQL→PostgreSQL transition (which happened **outside** the migration chain, in January 2026) and
why the early migrations are therefore unreplayable; which features arrived when and which were
abandoned; which columns and tables are empty in BKA production and are therefore candidates to not
port; drift between the Doctrine entity model and the physical schema; which migrations seed
business data; the four reference-data SQL files in `/Users/itrulia/Documents/insitu-admin/docs/`
and how badly they diverge from BKA reality; and a closing list of structures that will be awkward
under Prisma. Everything is grounded in a file path or a SQL result actually executed; guesses are
marked **UNVERIFIED**.

---

## 1. Headline facts

| Fact | Evidence |
| --- | --- |
| 67 migration files exist, 67 rows in `doctrine_migration_versions` — the chain is complete, nothing squashed or skipped | `ls migrations/Version*.php \| wc -l` = 67; `SELECT count(*) FROM doctrine_migration_versions` = 67 |
| The **first 21 migrations all executed on this database on 2023‑09‑18 11:31** — the BKA database was bootstrapped from scratch on that day, it is *not* a fork of the In Situ database | `doctrine_migration_versions.executed_at` |
| The first real BKA event row was created **2023‑11‑23 11:19:44** | `SELECT min(created_at) FROM event` |
| Migrations 1–56 (`Version20221124093828` … `Version20251119074019`) are written in **MySQL/MariaDB dialect**; migrations 57–67 (`Version20260608120000` …) are **PostgreSQL dialect** | grep over `migrations/` (§3.1) |
| **No migration performs the MySQL→PostgreSQL conversion.** It was done out of band with an external tool (pgloader fingerprint) around 2026‑01‑23 | §3 |
| Migrations run automatically on container boot: `php bin/console --env=prod doctrine:migrations:migrate --allow-no-migration -n` | `docker/entrypoint.sh:11`, gated by `RUN_MIGRATIONS` |
| Doctrine's mapping is valid but the physical schema has drifted: `doctrine:schema:update --dump-sql` emits **129 statements** | §6 |
| `docs/*.sql` reference seeds match BKA production for **regions and audiences only**; categories and affiliations are completely different in BKA. The *real* BKA seed is hard-coded in `src/DataFixtures/AppFixtures.php` | §8 |

---

## 2. Chronological migration table

`Date` is the timestamp encoded in the class name (when the migration was authored). `Applied` is
`doctrine_migration_versions.executed_at` on the restored **BKA production** database — note the
large authoring→deployment lags (e.g. the March 2024 batch only reached production in May 2024).

| # | Version | Date | Applied (BKA prod) | What changed |
| --- | --- | --- | --- | --- |
| 1 | `Version20221124093828` | 2022‑11‑24 | 2023‑09‑18 | Initial schema: `affiliation`, `affiliation_organization`, `audience`, `category`, `contact`, `event`, `event_category`, `image`, `oauth2_access_token`, `oauth2_authorization_code`, `oauth2_client`, `oauth2_refresh_token`, `organization`, `organization_category`, `place`, `rate`, `region`, `technical_sheet`, `user`, `user_organization`, `messenger_messages` + all FKs. MySQL `AUTO_INCREMENT` / `ENGINE = InnoDB` / `utf8mb4_unicode_ci`. |
| 2 | `Version20221124140711` | 2022‑11‑24 | 2023‑09‑18 | `ALTER TABLE organization DROP affiliate` — the JSON `affiliate` column is dropped 4 h after being created. |
| 3 | `Version20221124142616` | 2022‑11‑24 | 2023‑09‑18 | Creates `organization_affiliation`, **drops `affiliation_organization`** (same join table, columns swapped so Doctrine owns the right side). |
| 4 | `Version20221205085737` | 2022‑12‑05 | 2023‑09‑18 | `contact.phone_number` becomes nullable. |
| 5 | `Version20221212112049` | 2022‑12‑12 | 2023‑09‑18 | New table `event_proposed_by` (firstname/lastname/email/phone); `event.proposed_by_id` FK. **Public event-proposal feature.** |
| 6 | `Version20230112084050` | 2023‑01‑12 | 2023‑09‑18 | `event.user_id` FK → `user` (event ownership). |
| 7 | `Version20230116081244` | 2023‑01‑16 | 2023‑09‑18 | `event.organization_id` FK → `organization`. |
| 8 | `Version20230116104023` | 2023‑01‑16 | 2023‑09‑18 | `event_proposed_by.organization` VARCHAR(255); **seeds** `affiliation` row `{"fr":"Carte culture"}` with `created_at = 2023‑01‑26 13:33:00`. |
| 9 | `Version20230130112308` | 2023‑01‑30 | 2023‑09‑18 | **Data-only**: rewrites `category.tag_color` for ids 1‑13 and 23. |
| 10 | `Version20230302074303` | 2023‑03‑02 | 2023‑09‑18 | `place.pro_infirmis_detail_url` VARCHAR(255) — Pro Infirmis accessibility integration. |
| 11 | `Version20230424072717` | 2023‑04‑24 | 2023‑09‑18 | `user.locale` VARCHAR(2) nullable. |
| 12 | `Version20230522143507` | 2023‑05‑22 | 2023‑09‑18 | **Translation system arrives**: `labels` JSON column added to `event`, `image`, `organization`, `place`; each initialised to `[]`. |
| 13 | `Version20230525141827` | 2023‑05‑25 | 2023‑09‑18 | FK `ON DELETE` rules: `contact`→org CASCADE, `event`→org SET NULL, `image`→org CASCADE, `place`→org SET NULL. |
| 14 | `Version20230530124259` | 2023‑05‑30 | 2023‑09‑18 | `event.description`, `organization.about`, `place.about` become nullable (their content moved into `labels`). |
| 15 | `Version20230602065826` | 2023‑06‑02 | 2023‑09‑18 | `event.ticketing_url` 55 → 2048 chars. |
| 16 | `Version20230602065952` | 2023‑06‑02 | 2023‑09‑18 | `place.website` 155 → 2048 chars. |
| 17 | `Version20230619160129` | 2023‑06‑19 | 2023‑09‑18 | `rate.labels` JSON. |
| 18 | `Version20230620102446` | 2023‑06‑20 | 2023‑09‑18 | `contact.labels` JSON. |
| 19 | `Version20230620104518` | 2023‑06‑20 | 2023‑09‑18 | `technical_sheet.labels` JSON. |
| 20 | `Version20230620115851` | 2023‑06‑20 | 2023‑09‑18 | `rate.designation` and `technical_sheet.title` become nullable (superseded by `labels`). |
| 21 | `Version20230622100800` | 2023‑06‑22 | 2023‑09‑18 | All seven `labels` columns become nullable. |
| 22 | `Version20231012152121` | 2023‑10‑12 | 2023‑10‑24 | MySQL `LONGTEXT` → native MySQL `JSON` for every `label`/`labels`/`roles`/`recurrence_week_days`/`pro_infirmis_pictograms` column; `messenger_messages` timestamps → `datetime_immutable`. Pre-cleans `''` labels to NULL. |
| 23 | `Version20231012152447` | 2023‑10‑12 | 2023‑10‑24 | New table `reset_password_request` (SymfonyCasts reset-password bundle). |
| 24 | `Version20231017145422` | 2023‑10‑17 | 2023‑10‑24 | `category.hidden` + `region.hidden` BOOLEAN — described as *"for easier sharing between in-situ and BKA"*. Written against the DBAL `Schema` API, not raw SQL. |
| 25 | `Version20231031164335` | 2023‑10‑31 | 2023‑10‑31 | `hidden` becomes nullable; **`event.date_from` / `event.date_to` become nullable**. |
| 26 | `Version20231109080212` | 2023‑11‑09 | 2023‑11‑09 | `event.related_dates` JSON. |
| 27 | `Version20231110103658` | 2023‑11‑10 | 2023‑11‑16 | `event.sponsored_start_date`, `event.sponsored_end_date` — description says *"(BKA)"*. **Never used in BKA prod** (§5). |
| 28 | `Version20231122094424` | 2023‑11‑22 | 2023‑11‑23 | `user.member` BOOLEAN NOT NULL — the "member" concept (`ACTIVATE_MEMBERS=true` on BKA). |
| 29 | `Version20231127104100` | 2023‑11‑27 | 2023‑11‑28 | New table `video` (`embed_link`) — `ACTIVATE_EVENT_VIDEOS=true` on BKA. |
| 30 | `Version20231212092040` | 2023‑12‑12 | 2023‑12‑14 | New table `place_proposed` (name/address/zip/city/lat/lon) with `event_id` **and** `event.place_proposed_id` — the relation is stored twice. `ACTIVATE_PROPOSAL_PLACE=true` on BKA. |
| 31 | `Version20240108085957` | 2024‑01‑08 | 2024‑01‑08 | `event.place_id` FK → `ON DELETE SET NULL`. |
| 32 | `Version20240108143304` | 2024‑01‑08 | 2024‑01‑09 | `image`, `rate`, `video` → `event` FKs become `ON DELETE CASCADE`. |
| 33 | `Version20240325081900` | 2024‑03‑25 | 2024‑05‑14 | New table **`event_occurence`** (one *r* — typo). |
| 34 | `Version20240325083605` | 2024‑03‑25 | 2024‑05‑14 | `event.is_multi_day_event` BOOLEAN nullable (materialises what `MainEvent::isMultiDayEvent()` computed). |
| 35 | `Version20240325085357` | 2024‑03‑25 | 2024‑05‑14 | Creates **`event_occurrence`** (correct spelling) and **drops `event_occurence`** — the typo table lived for 1 h 32 min of authoring time and never reached production separately. |
| 36 | `Version20240325175657` | 2024‑03‑25 | 2024‑05‑14 | `event_occurrence.date_from/date_to` → mutable `DATETIME` (drops `datetime_immutable`). |
| 37 | `Version20240326100340` | 2024‑03‑26 | 2024‑05‑14 | Indexes `dateFrom_idx`, `dateTo_idx` on `event_occurrence`. |
| 38 | `Version20240430070034` | 2024‑04‑30 | 2024‑05‑14 | `event.user_id` FK → `ON DELETE SET NULL`. |
| 39 | `Version20240627123339` | 2024‑06‑27 | 2024‑07‑09 | `event.show_in_print` BOOLEAN nullable — print edition (`HAS_PRINT_OPTIONS=true`). |
| 40 | `Version20240628071640` | 2024‑06‑28 | 2024‑07‑09 | `event.print_description` LONGTEXT. |
| 41 | `Version20240702085255` | 2024‑07‑02 | 2024‑07‑09 | Search indexes: `event_name_idx`, `organization_name_idx`, `place_name_idx`, `place_city_idx`, `place_proposed_name_idx`, `place_proposed_city_idx`. |
| 42 | `Version20240704093618` | 2024‑07‑04 | 2024‑07‑09 | **Drops `event.print_description`** — 6 days after it was added; it moved into `labels.printDescription`. |
| 43 | `Version20240730095625` | 2024‑07‑30 | 2024‑08‑23 | `event.og_image_fr`, `event.og_image_de` VARCHAR(255). |
| 44 | `Version20240819074948` | 2024‑08‑19 | 2024‑08‑23 | **Drops both** and adds `event.og_image` JSON NOT NULL instead. |
| 45 | `Version20240823090216` | 2024‑08‑23 | 2024‑08‑23 | Repairs `og_image`: temporarily `TEXT`, `UPDATE … WHERE JSON_VALID(og_image) = 0 OR og_image = ''`, back to nullable `JSON`. (Took 33.5 s — the slowest migration in the chain.) |
| 46 | `Version20241107165934` | 2024‑11‑07 | 2024‑12‑10 | New table `user_token` (personal API tokens: name, expires_at, token, owner). |
| 47 | `Version20241112080228` | 2024‑11‑12 | 2024‑12‑10 | `user_token.uuid` `BINARY(16) (DC2Type:uuid)`. |
| 48 | `Version20241112080821` | 2024‑11‑12 | 2024‑12‑10 | `user_token.token` becomes nullable. |
| 49 | `Version20241112084137` | 2024‑11‑12 | 2024‑12‑10 | Unique index on `user_token.uuid`. |
| 50 | `Version20250909065738` | 2025‑09‑09 | 2025‑09‑11 | `user.config` JSON nullable (holds `{"org_creation": …}`). |
| 51 | `Version20251015142920` | 2025‑10‑15 | 2025‑11‑18 | New table `ticketing` (`event_id`, `labels`) — structured replacement for `event.ticketing_url`. |
| 52 | `Version20251017081234` | 2025‑10‑17 | 2025‑11‑18 | `ticketing.ticketing_designation` VARCHAR(255) NOT NULL (PHP enum `App\Enum\TicketingDesignation`, 13 cases). |
| 53 | `Version20251027150826` | 2025‑10‑27 | 2025‑11‑18 | `event.archived_organization`, `event.archived_place` as **JSON** — snapshot of the org/place name at event creation. |
| 54 | `Version20251119070155` | 2025‑11‑19 | 2025‑12‑16 | `event.old_slug` + backfill from `slug`. (31.5 s.) |
| 55 | `Version20251119072203` | 2025‑11‑19 | 2025‑12‑16 | `place.old_slug` + backfill. |
| 56 | `Version20251119074019` | 2025‑11‑19 | 2025‑12‑16 | `organization.old_slug` + backfill. |
| — | — | — | — | **⇦ MySQL→PostgreSQL conversion happened here, outside the migration chain (≈ 2026‑01‑23)** |
| 57 | `Version20260608120000` | 2026‑06‑08 | 2026‑10‑17 | **First PostgreSQL-only migration.** Wipes `event.archived_organization/archived_place` then `ALTER COLUMN … TYPE VARCHAR(255) USING …::text`, drops the `(DC2Type:json)` comments. |
| 58 | `Version20260612090000` | 2026‑06‑12 | 2026‑10‑17 | **Data-only**: backfills `archived_organization`/`archived_place` from the live `organization.name` / `place.name`. Explicitly irreversible. |
| 59 | `Version20260626113538` | 2026‑06‑26 | 2026‑10‑17 | Indexes `idx_event_pub_status_date (publication_status, publication_date)`, `idx_place_lat_lon`, `idx_place_proposed_lat_lon`. |
| 60 | `Version20260923160000` | 2026‑09‑23 | 2026‑10‑17 | `COMMENT ON COLUMN … IS '(DC2Type:datetimetz_immutable)'` for `reset_password_request.requested_at/expires_at` and `user_token.expires_at`. Guarded with `skipIf(!… instanceof PostgreSQLPlatform)`. **Recorded as applied but the comments are *not* present in the DB** (§6.4). |
| 61 | `Version20260925090000` | 2026‑09‑25 | 2026‑10‑17 | `event.print_category_id` FK → `category` `ON DELETE SET NULL`; **backfills** it with `MIN(event_category.category_id)` for every event where `show_in_print = true`. |
| 62 | `Version20260926100000` | 2026‑09‑26 | 2026‑10‑17 | **Reference data**: renames audiences (`Alle`→`Für alle`/`Tout public`, `Erwachsene`→`Nur für Erwachsene`, `Kinder`→`Für Kinder gedacht`, `Familien`→`Für die ganze Familie`) and conditionally inserts `Für Kinder gedacht`. Uses `label::json->>'de'`. |
| 63 | `Version20260926150000` | 2026‑09‑26 | 2026‑10‑17 | `user.locale`: backfill `'de'`, `SET DEFAULT 'de'`, `SET NOT NULL`. |
| 64 | `Version20260926170000` | 2026‑09‑26 | 2026‑10‑17 | `CREATE EXTENSION IF NOT EXISTS unaccent`. |
| 65 | `Version20260930123256` | 2026‑09‑30 | 2026‑10‑17 | `image.position INT NOT NULL DEFAULT 0`; seeds it per owner with `ROW_NUMBER() OVER (PARTITION BY event_id/organization_id/place_id ORDER BY id)`. |
| 66 | `Version20261008090000` | 2026‑10‑08 | 2026‑10‑17 | `reset_password_request.user_id` FK → `ON DELETE CASCADE` (deleting a user used to fail). |
| 67 | `Version20261016100000` | 2026‑10‑16 | 2026‑10‑17 | **Reference data**: final audience panel — `Für alle` / `Nur für Erwachsene` / `Für Kinder und Jugendliche` / adds `Für Senior:innen`. Keyed by every historical German label so it is idempotent. |

### 2.1 Deployment batches visible in `executed_at`

| Batch | Versions | Applied |
| --- | --- | --- |
| Bootstrap of the BKA database | 1–21 | 2023‑09‑18 11:31 |
| 22–24 | `20231012152121` … `20231017145422` | 2023‑10‑24 17:54 |
| 25 | `20231031164335` | 2023‑10‑31 |
| 26 | `20231109080212` | 2023‑11‑09 |
| 27 | `20231110103658` | 2023‑11‑16 |
| 28 | `20231122094424` | 2023‑11‑23 |
| 29 | `20231127104100` | 2023‑11‑28 |
| 30 | `20231212092040` | 2023‑12‑14 |
| 31–32 | Jan 2024 | 2024‑01‑08 / 09 |
| 33–38 | March/April 2024 | 2024‑05‑14 |
| 39–42 | June/July 2024 | 2024‑07‑09 |
| 43–45 | July/Aug 2024 | 2024‑08‑23 |
| 46–49 | Nov 2024 | 2024‑12‑10 |
| 50 | Sep 2025 | 2025‑09‑11 |
| 51–53 | Oct 2025 | 2025‑11‑18 |
| 54–56 | Nov 2025 | 2025‑12‑16 |
| 57–67 | June–Oct 2026 | 2026‑10‑17 (**this local restore only** — see §3.3) |

---

## 3. The MySQL → PostgreSQL transition

### 3.1 No migration did it

Classifying every migration by dialect-specific syntax:

| Marker | Migrations containing it |
| --- | --- |
| `AUTO_INCREMENT` / `ENGINE = InnoDB` / `utf8mb4 COLLATE` | `20221124093828`, `20221124142616`, `20221212112049`, `20231012152447`, `20231127104100`, `20231212092040`, `20240325081900`, `20240325085357`, `20241107165934`, `20251015142920` |
| `LONGTEXT` | `20221124093828`, `20221124140711`, `20230522143507`, `20230530124259`, `20230619160129`, `20230620102446`, `20230620104518`, `20230622100800`, `20240628071640`, `20240704093618`, `20241107165934`, `20241112080821` |
| `TINYINT(1)` | `20221124093828`, `20231031164335`, `20231122094424`, `20240325083605`, `20240627123339` |
| `DATETIME` | `20221124093828`, `20221212112049`, `20231012152121`, `20231012152447`, `20231031164335`, `20231110103658`, `20231127104100`, `20240325081900`, `20240325085357`, `20240325175657`, `20241107165934` |
| inline `COMMENT '(DC2Type:…)'` | 20 migrations (every one that touches a JSON/uuid/immutable column) |
| `ALTER TABLE … DROP FOREIGN KEY` | 15 migrations |
| `ALTER TABLE … CHANGE col col TYPE` | `20221205085737`, `20230530124259`, `20230602065826`, `20230602065952`, `20230620115851`, `20230622100800`, `20231012152121`, `20231031164335`, `20240325175657`, `20240823090216`, `20241112080821` |
| `MODIFY` + `JSON_VALID()` | `20240823090216` |
| Backtick-quoted identifiers (`` `user` ``, `` `category` ``, `` `affiliation` ``) | 18 migrations |
| Unquoted `ALTER TABLE user` (`user` is reserved in Postgres) | `20230424072717`, `20231012152121`, `20231122094424`, `20250909065738` |
| MySQL double-quoted string literals — `UPDATE event SET labels = "[]"` | `20230522143507` |
| `BINARY(16)` | `20241112080228` |
| PostgreSQL-only (`ALTER COLUMN … TYPE … USING`, `DROP CONSTRAINT`, `CREATE EXTENSION`, `label::json->>`, `ROW_NUMBER() … UPDATE … FROM`) | `20260608120000`, `20260925090000`, `20260926100000`, `20260926150000`, `20260926170000`, `20260930123256`, `20261008090000`, `20261016100000` |
| Platform-aware (`instanceof PostgreSQLPlatform`) | **only** `20260923160000` |

So the chain simply *switches dialect* between `Version20251119074019` and `Version20260608120000`
with nothing in between. **`doctrine:migrations:migrate` on an empty PostgreSQL database fails on
statement 1 of `Version20221124093828`** (`AUTO_INCREMENT`, `ENGINE = InnoDB`,
`DEFAULT CHARACTER SET utf8mb4`, inline `INDEX …(…)` definitions). Even if you got past that you
would then hit `DROP FOREIGN KEY`, `CHANGE`, `MODIFY`, `JSON_VALID()`, backticks, `TINYINT`,
`LONGTEXT`, the bare `user` identifier, and `labels = "[]"`.

> **Practical consequence for anyone rebuilding the DB from scratch:** there is no way to produce the
> current schema by replaying migrations. The only reproducible path is restoring a PostgreSQL dump
> (`/Users/itrulia/Documents/insitu-admin/bka.dump`, 21 MB custom-format) and then letting the
> entrypoint apply whatever 2026+ migrations are pending. This is exactly how the live local
> environment was built.

### 3.2 How it was actually done — pgloader fingerprint

No conversion script exists in the repository (`git grep -i pgloader` over all 163 commits:
no hits). The evidence is entirely physical, in the restored database:

**(a) Index names carry a numeric prefix constant per table.**

```
event            : idx_252807_primary, idx_252807_event_name_idx, idx_252807_idx_3bae0aa7da6a219, …
event_occurrence : idx_252833_primary, idx_252833_datefrom_idx, idx_252833_dateto_idx, …
place            : idx_252952_primary, idx_252952_place_name_idx, idx_252952_place_city_idx, …
user             : idx_253042_primary, idx_253042_uniq_8d93d649e7927c74
```

The prefixes rise monotonically in table order (`affiliation` 252755 < `audience` 252766 <
`category` 252777 < `contact` 252789 < `event` 252807 < … < `video` 253077). This is pgloader's
`idx_<source-table-oid>_<lowercased original index name>` scheme, which exists because MySQL index
names are table-scoped while PostgreSQL index names are schema-global. The prefixes are *not* the
current OIDs (today's `event` OID is 16485) — they are baked-in names inherited from the database
pgloader originally wrote into.

Indexes created by Doctrine migrations **after** the conversion carry no prefix:
`idx_event_pub_status_date`, `idx_place_lat_lon`, `idx_place_proposed_lat_lon` (all
`Version20260626113538`) and `idx_3bae0aa7e2e3a9e3` (`Version20260925090000`).

**(b) Type mapping is pgloader's default MySQL→PostgreSQL cast table.**

| MySQL (per migrations) | PostgreSQL (per `\d+`) |
| --- | --- |
| `INT` / `BIGINT` primary & foreign keys | `bigint` + `nextval('<table>_id_seq')` |
| `DATETIME` | `timestamp with time zone` |
| `TINYINT(1)` | `boolean` |
| `LONGTEXT` and native `JSON` | `text` (with the `(DC2Type:json)` comment preserved) |
| `BINARY(16) (DC2Type:uuid)` | native `uuid` |
| `VARCHAR(n) DEFAULT NULL` | `character varying(n) DEFAULT NULL::character varying` |
| MySQL `AUTO_INCREMENT` | owned sequences `affiliation_id_seq` … `video_id_seq` (20 of them) |

Crucially, **every JSON column is `text`, not `json`/`jsonb`**. All JSON access in the current code
therefore casts explicitly (`label::json->>'de'` in `Version20260926100000`,
`CAST(%s AS JSONB)` in `src/DQL/JsonValuesText.php`).

**(c) The application was adapted to PostgreSQL in Jan–Mar 2026, visible in git.**

| Commit | Date | Effect |
| --- | --- | --- |
| `36d20d2` "Initial commit" | 2026‑01‑21 | Squashed import of the codebase into the We.Publish org. `docker-compose.yaml` uses `mysql://root:secret@mariadb:3306/insitu-admin`. 56 migrations present (the whole MySQL era). |
| `f64cea4` "Added S3 storage support" | 2026‑01‑22 | First appearance of a (commented-out) `pgsql://` DSN. |
| `5c83d24` "Fix" | 2026‑01‑23 | **Flips the active `DATABASE_URL` to `pgsql://postgres:secret@postgres/insitu-admin?schema=insitu-admin`** and comments out the MySQL one. |
| `68d0094` "Upgraded pg" | 2026‑01‑23 | Postgres image bump. |
| `cabd9a6` "Rootless build" | 2026‑01‑26 | DSN simplified to `pgsql://postgres:secret@postgres/insitu-admin`. |
| `b02b0a9` "Fix search in admin ui" | 2026‑02‑24 | Search fixes for case sensitivity. |
| `23e100e` "Make like case sencsitve same as it is on mariadb" | 2026‑02‑24 | Adds `src/DQL/ILike.php`, registers `ILIKE` in `config/packages/doctrine.yaml`, and rewrites 6 repositories / 4 API-Platform extensions. |
| `f5d8fde` "Make search case insesitive" | 2026‑03‑08 | More of the same. |
| `15d9e80` "feat: ignore accents when searching" | — | Adds `src/DQL/Unaccent.php` + `Version20260926170000` (`CREATE EXTENSION unaccent`). |

`docker-compose.yaml` still ships the `mariadb:11.4` service and the commented MySQL DSN
(`docker-compose.yaml:27–28`, `:69–81`). `.env.local:3` still reads
`DATABASE_URL=mysql://root:secret@mariadb/your_db_name`.

**UNVERIFIED:** the exact tool and date of the production conversion. pgloader is the strongest
match for the index-naming and type-cast fingerprint, but no invocation is checked in. What would
settle it: the ops runbook / deployment history for the BKA production cluster, or the original
conversion host's shell history.

### 3.3 Leftover MySQL-isms still live in the PostgreSQL configuration

`config/packages/doctrine.yaml` registers **MariaDB/MySQL** JSON DQL functions alongside the
PostgreSQL ones:

```yaml
dql:
    string_functions:
        JSON_CONTAINS: Scienta\DoctrineJsonFunctions\Query\AST\Functions\Mysql\JsonContains
        JSON_EXTRACT:  Scienta\DoctrineJsonFunctions\Query\AST\Functions\Mysql\JsonExtract
        JSON_VALUE:    Scienta\DoctrineJsonFunctions\Query\AST\Functions\Mariadb\JsonValue
        ILIKE:               App\DQL\ILike
        UNACCENT:            App\DQL\Unaccent
        JSON_VALUES_TEXT:    App\DQL\JsonValuesText
        JSON_KEY_VALUES_TEXT: App\DQL\JsonKeyValuesText
```

Three call sites still emit MySQL `JSON_CONTAINS(JSON_EXTRACT(...))`, which does not exist in
PostgreSQL:

- `src/Repository/EventOccurrenceRepository.php:253`
- `src/Repository/EventRepository.php:249`
- `src/ApiPlatform/OccurrenceExtension.php:412`

All three are the Pro Infirmis accessibility filter over `place.proInfirmisPictograms`. Since that
data is essentially empty in BKA (§5), the broken path is probably never hit, but it is a dead/broken
feature rather than a working one. **UNVERIFIED** whether it errors at runtime — settling it needs an
actual request with the `accessibility` filter against the Postgres database.

`src/DataFixtures/AppFixtures.php` is likewise still pure MySQL (backtick identifiers and `X'…'`
hex literals, see §8.4) and cannot run against PostgreSQL.

---

## 4. Feature timeline — what arrived when, what was abandoned

### 4.1 Added and still alive in BKA production

| Feature | Introduced | Rows / fill in BKA prod |
| --- | --- | --- |
| Core event/place/organization model | `20221124093828` (2022‑11) | 34 279 / 1 276 / 741 |
| Public event proposal (`event_proposed_by`) | `20221212112049` | 4 366 proposers; 4 288 events linked |
| Event ↔ user / organization ownership | `20230112084050`, `20230116081244` | 21 378 / 27 949 events |
| Pro Infirmis accessibility on places | initial + `20230302074303` | effectively empty (§5) |
| JSON translation (`labels`) | `20230522143507` → `20230622100800` | 100 % of events |
| Category / region `hidden` flag | `20231017145422` | 5 of 30 categories, 8 of 13 regions hidden |
| Per-event related dates (`related_dates`) | `20231109080212` | 34 275 / 34 279 non-empty |
| "Member" users | `20231122094424` | 269 of 427 users |
| Videos | `20231127104100` | 2 025 rows |
| Proposed places | `20231212092040` | 1 823 rows |
| Materialised occurrences (`event_occurrence`) | `20240325085357` | 118 021 rows |
| `is_multi_day_event` | `20240325083605` | 17 784 true / 16 495 false |
| Print edition (`show_in_print`) | `20240627123339` | 21 987 true |
| Personal API tokens (`user_token`) | `20241107165934`–`20241112084137` | 5 rows |
| `user.config` (`org_creation` wizard state) | `20250909065738` | 125 of 427 users |
| Archived org/place name snapshot | `20251027150826` → `20260608120000` → `20260612090000` | 27 949 / 31 717 events |
| `old_slug` on event / place / organization | `20251119070155`/`072203`/`074019` | 28 355 / 1 189 / 698 |
| Print **category** | `20260925090000` | 21 981 events |
| Image gallery ordering (`image.position`) | `20260930123256` | 7 743 images with `position > 0`, max 27 |
| Accent-insensitive search (`unaccent`) | `20260926170000` | extension installed (`unaccent 1.1`) |

### 4.2 Added then removed

| Thing | Added | Removed | Replaced by |
| --- | --- | --- | --- |
| `organization.affiliate` JSON | `20221124093828` | `20221124140711` (same day) | `affiliation_organization` join table |
| `affiliation_organization` join table | `20221124093828` | `20221124142616` (same day) | `organization_affiliation` (column order swapped) |
| `event_occurence` table (typo) | `20240325081900` | `20240325085357` | `event_occurrence` |
| `event.print_description` | `20240628071640` | `20240704093618` (6 days) | `labels.printDescription` |
| `event.og_image_fr` / `og_image_de` | `20240730095625` | `20240819074948` (20 days) | `event.og_image` JSON |
| `event.archived_organization/_place` as JSON | `20251027150826` | retyped to VARCHAR by `20260608120000`, **data destroyed**, re-derived by `20260612090000` | plain strings |

### 4.3 Added and effectively abandoned (present in schema, unused in BKA)

| Thing | Added | BKA reality |
| --- | --- | --- |
| Sponsored events (`event.sponsored_start_date`, `sponsored_end_date`) | `20231110103658` (labelled "BKA") | **0 of 34 279 rows set.** `ACTIVATE_SPONSORED_EVENTS=false` in `docker-compose.yaml:53`. |
| `event.og_image` JSON | `20240819074948` | 9 non-NULL rows, and every one of them is the literal `[]`. Zero real values. |
| `ticketing` table | `20251015142920`/`20251017081234` | **0 rows**, but `ticketing_id_seq.last_value = 86`: 86 rows were created and later deleted. Feature is wired up but carries no production data in this snapshot. |
| `technical_sheet` | `20221124093828` | **1 row**, with an empty `title` and a `labels.title` in German only. |
| `messenger_messages` | `20221124093828` | 0 rows (`MESSENGER_TRANSPORT_DSN: doctrine://default?auto_setup=0`, nothing queued). |
| `reset_password_request` | `20231012152447` | 0 rows now; `reset_password_request_id_seq.last_value = 265` → the feature *is* used and self-cleans. |
| Pro Infirmis (`place.pro_infirmis_id_source`, `_detail_url`, `_pictograms`) | initial + `20230302074303` | 7 rows with a non-NULL `pro_infirmis_id_source`, of which **6 are the empty string**; exactly **1 place** has a real id (`265`) and `pro_infirmis_detail_url`, and it is named "Format-z test Ort". 1 275 of 1 276 `pro_infirmis_pictograms` are `[]`. |

---

## 5. Columns and tables empty or near-empty in BKA production

All figures from the restored production database.

### 5.1 Row counts, every table

| Table | Rows |
| --- | --- |
| `event` | 34 279 |
| `event_occurrence` | 118 021 |
| `event_category` | 54 851 |
| `image` | 27 571 |
| `rate` | 12 697 |
| `event_proposed_by` | 4 366 |
| `video` | 2 025 |
| `place_proposed` | 1 823 |
| `place` | 1 276 |
| `organization` | 741 |
| `organization_category` | 857 |
| `user_organization` | 507 |
| `user` | 427 |
| `contact` | 90 |
| `organization_affiliation` | 85 |
| `region` | 13 |
| `category` | 30 |
| `affiliation` | 7 |
| `oauth2_access_token` | 7 |
| `oauth2_refresh_token` | 7 |
| `user_token` | 5 |
| `audience` | 4 |
| `oauth2_client` | 4 |
| `technical_sheet` | 1 |
| `messenger_messages` | 0 |
| `oauth2_authorization_code` | 0 |
| `reset_password_request` | 0 |
| `ticketing` | 0 |

### 5.2 Columns that are 100 % empty — do not port

| Column | Non-NULL rows | Why it is empty |
| --- | --- | --- |
| `event.description` (TEXT) | **0 / 34 279** | Superseded by `labels.description`. Marked `@deprecated` at `src/Entity/Event.php:142`. |
| `event.sponsored_start_date` | **0** | Sponsored events disabled for BKA. |
| `event.sponsored_end_date` | **0** | ″ |
| `image.legend` (VARCHAR 255) | **0 / 27 571** | Superseded by `labels.legend`. `src/Entity/Image.php:30`. |
| `rate.designation` (VARCHAR 55) | **0 / 12 697** | Superseded by `labels.designation`. `src/Entity/Rate.php:28`. |
| `contact.designation_email` | **0 / 90** | Superseded by `labels.designationEmail`. |
| `contact.designation_phone` | **0 / 90** | Superseded by `labels.designationPhone`. |
| `place.capacity` (VARCHAR 55) | **0 / 1 276** | Superseded by `labels.capacity`. `src/Entity/Place.php:102`. |
| `technical_sheet.title` | **0 / 1** | Superseded by `labels.title`. |

### 5.3 Columns that are effectively empty

| Column | Non-NULL / meaningful | Note |
| --- | --- | --- |
| `event.og_image` | 9 non-NULL, **0 meaningful** (all `[]`) | Open-Graph image override, never used. |
| `place.pro_infirmis_id_source` | 7 non-NULL, 1 meaningful | see §4.3 |
| `place.pro_infirmis_detail_url` | 1 | ″ |
| `place.pro_infirmis_pictograms` | 1 276 non-NULL, 1 non-`[]` | ″ |
| `organization.post_office_box` | 8 / 741 | |
| `organization.legal_status` | 70 / 741 (`association` 50, `fondation` 8, `societe_responsabilite_limitee` 6, `societe_anonyme` 4, `collectif` 1, `entreprise_individuelle` 1; 671 empty string) | French legal forms, barely used on a Bern deployment |
| `organization.website` | 133 / 741 | |
| `place.website` | 105 / 1 276 | |
| `place.wheelchair_accessible` = true | 59 / 1 276 | |
| `place.wheelchair_accessible_toilets` = true | 44 / 1 276 | |
| `place.wheelchair_accessible_parking` = true | 25 / 1 276 | |
| `user.locale` | 427 rows, **all `'de'`** | `LOCALES=fr\|de`, `DEFAULT_LOCALE=de`; no BKA admin has ever picked French |

### 5.4 Columns that are deprecated but still carry data (must be migrated, not dropped)

| Column | Non-NULL | Note |
| --- | --- | --- |
| `event.ticketing_url` (VARCHAR 2048) | 1 794 / 34 279 | `@deprecated` in `src/Entity/MainEvent.php:46`, superseded by `labels.ticketingUrl` (28 334 rows) and then by the `ticketing` table (0 rows). Three generations coexist. |
| `organization.about` (TEXT) | 402 / 741 | `labels.about` has 587 |
| `organization.sub_title` | 402 / 741 | `labels.subTitle` has 587 |
| `place.about` (TEXT) | 404 / 1 276 | `labels.about` has 1 018 |

> `event.name`, `organization.name` and `place.name` carry the same
> "`@deprecated` … now translatable" docblock (`src/Entity/Event.php:102`,
> `src/Entity/Organization.php:68`, `src/Entity/Place.php:42`) but **no `labels` row anywhere
> contains a `name` key** — see §7.1. These columns are the only name source and must be ported as
> plain columns.

### 5.5 Where the translated content actually lives

`labels` is a `text` column holding `{"<property>": {"<lang>": "<value>"}}`. Keys actually present
in BKA production:

| Table | `labels` key | rows with `de` | rows with `fr` |
| --- | --- | --- | --- |
| `event` | `description` | 34 279 | 3 212 |
| `event` | `ticketingUrl` | 28 334 | 2 656 |
| `event` | `printDescription` | 25 164 | 3 114 |
| `image` | `legend` | 27 571 | 2 798 |
| `rate` | `designation` | 12 697 | 1 232 |
| `place` | `about` | 1 018 | 48 |
| `place` | `capacity` | 1 018 | 48 |
| `organization` | `about` | 587 | 18 |
| `organization` | `subTitle` | 587 | 18 |
| `contact` | `designationEmail` | 90 | 4 |
| `contact` | `designationPhone` | 90 | 4 |
| `technical_sheet` | `title` | 1 | 0 |
| `ticketing` | — | 0 | 0 |

Only `de` and `fr` ever appear — matching `LOCALES: fr|de`. French coverage is 6–10 % at best.
258 of 1 276 `place.labels` and 154 of 741 `organization.labels` are the literal `[]` (empty array,
not an object) — a PHP `json_encode([])` artefact that any strict JSON-object parser will choke on.

### 5.6 Enum-valued VARCHAR columns and their real distributions

There are **no CHECK constraints anywhere** in the database
(`SELECT … FROM pg_constraint WHERE contype='c'` → 0 rows); every enum is application-level.

| Column | Values in production |
| --- | --- |
| `event.type` (STI discriminator) | `mainevent` 21 116, `subevent` 13 163 |
| `event.event_status` | `confirmed` 33 831, `full` 366, `canceled` 65, `postponed` 17 |
| `event.publication_status` | `publish` 34 076, `to_validate` 109, `draft` 94 |
| `event.special_rate` | `''` 26 176, `free_entry` 5 103, `free_price` 3 000 |
| `event.recurrence` | `none` 20 356, NULL 13 163 (= all subevents), `week` 760 |
| `event.is_multi_day_event` | true 17 784, false 16 495 |
| `event.show_in_print` | true 21 987, false 11 958, NULL 334 |
| `user.roles` (JSON array) | `["ROLE_USER"]` 397, `["ROLE_USER","ROLE_ADMIN"]` 28, `["ROLE_ADMIN","ROLE_USER"]` 2 — note the **unordered duplicate representation** |
| `user.config` (JSON) | NULL 302, `{"org_creation":"needed"}` 103, `{"org_creation":"done"}` 21, `{"org_creation":"ignored"}` 1 |
| `ticketing.ticketing_designation` | PHP enum `App\Enum\TicketingDesignation` — 13 cases (`eventbrite`, `eventfrog`, `fnactickets`, `idticketing`, `infomaniak`, `monbillet`, `petzi`, `smeetz`, `starticket`, `ticketcorner`, `ticketmaster`, `weezevent`, `other`); 0 rows in production |

---

## 6. Drift: entity model vs physical schema

`php bin/console doctrine:schema:validate --skip-sync` → **mapping OK**.
`php bin/console doctrine:schema:update --dump-sql` → **129 statements** (50 × `ALTER INDEX … RENAME`,
49 × `ALTER … TYPE INT`, 19 × `ALTER … DROP DEFAULT`, plus 11 others), broken down below. (Both
run read-only inside `insitu-admin-app-1`.)

### 6.1 Column in the DB with no entity property

| Column | Diff statement | Reality |
| --- | --- | --- |
| `place_proposed.event_id` (+ its unique index and FK) | `ALTER TABLE place_proposed DROP CONSTRAINT fk_ff093ec771f7e88b; DROP INDEX idx_252977_uniq_ff093ec771f7e88b; ALTER TABLE place_proposed DROP event_id;` | Created by `Version20231212092040`, which added **both** `place_proposed.event_id` and `event.place_proposed_id`. `src/Entity/PlaceProposed.php` no longer maps it; `src/Entity/Event.php:214` owns the OneToOne. The column still holds data: 1 158 of 1 823 rows have `event_id` set, 665 are NULL — while **1 823 events have `place_proposed_id` set**. The `event` side is authoritative; the `place_proposed.event_id` side is a stale, partially-populated duplicate. |

No entity property is missing from the DB (the diff contains zero `ADD COLUMN`).

### 6.2 Type drift — `bigint` everywhere, `INT` in the mapping

Every entity declares `#[ORM\Column(type: Types::INTEGER)]` / `#[ORM\GeneratedValue]` for ids; the
pgloader conversion made every id and FK `bigint`. The diff therefore contains 49 `TYPE INT` plus
19 `DROP DEFAULT` statements of the form:

```sql
ALTER TABLE event ALTER id TYPE INT;
ALTER TABLE event ALTER id DROP DEFAULT;
ALTER TABLE event ALTER place_id TYPE INT;
…
```

across all 20 id-bearing tables plus the 4 join tables. Nobody has ever run them (doing so would drop
the sequences). Note the one exception: `event.print_category_id` is `integer`, because it was added
by a post-conversion Doctrine migration (`Version20260925090000`) — so that single FK is
`integer → bigint`.

### 6.3 Index-name drift

50 statements of the form `ALTER INDEX idx_252807_idx_3bae0aa7da6a219 RENAME TO IDX_3BAE0AA7DA6A219`
— Doctrine wants its canonical names back, the DB still has pgloader's. Also
`ALTER INDEX idx_3bae0aa7e2e3a9e3 RENAME TO IDX_3BAE0AA7CBF4DEF0`: `Version20260925090000` hand-wrote
an index name that does not match Doctrine's hash for the `print_category_id` join column.

### 6.4 Comment drift on immutable datetime columns

```
reset_password_request.requested_at  → DB: (DC2Type:datetime_immutable)   mapping wants: datetimetz_immutable
reset_password_request.expires_at    → DB: (DC2Type:datetime_immutable)   mapping wants: datetimetz_immutable
user_token.expires_at                → DB: (DC2Type:datetime_immutable)   mapping wants: datetimetz_immutable
```

`Version20260923160000` exists precisely to fix this and is **recorded as applied**
(`executed_at = 2026‑10‑17 17:54:01`, `execution_time = 1 ms`), yet the comments are unchanged. A
dry run today still produces the three `COMMENT ON COLUMN` statements:

```
$ php bin/console --env=prod doctrine:migrations:execute --up 'DoctrineMigrations\Version20260923160000' --dry-run -n
[notice] Executing (dry-run) DoctrineMigrations\Version20260923160000 up
[notice] finished in 2.6ms, used 28M memory, 1 migrations executed, 5 sql queries
```

so the `skipIf(!… instanceof PostgreSQLPlatform)` guard is **not** firing. **UNVERIFIED** why the
comments are missing; the most likely explanation is that the local database was built from a dump
whose `doctrine_migration_versions` already contained the row while the comments had been lost. This
matters only for Doctrine's own diffing, not for data.

### 6.5 FK rule drift

```sql
ALTER TABLE event DROP CONSTRAINT FK_3BAE0AA7CAB8E6D3;
ALTER TABLE event ADD CONSTRAINT FK_3BAE0AA7CAB8E6D3 FOREIGN KEY (place_proposed_id)
  REFERENCES place_proposed (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
```

`src/Entity/Event.php:215` declares `onDelete: 'CASCADE'` for `placeProposed`; the database still has
`ON UPDATE RESTRICT ON DELETE RESTRICT` (never migrated).

### 6.6 Non-drift: an entity with no table

`doctrine:mapping:info` lists 27 mapped entities, including `Vich\UploaderBundle\Entity\File` and the
five `League\Bundle\OAuth2ServerBundle\Model\*` classes. `Vich…\File` is an embeddable and has no
table; the diff proposes no `CREATE TABLE`, so this is fine.

### 6.7 Actual referential-integrity oddities in the data

| Observation | Count |
| --- | --- |
| Images attached to neither event, organization nor place | 199 of 27 571 |
| Images attached to more than one owner | 0 |
| Videos with no event | 6 of 2 025 |
| `place_proposed` rows with no `event_id` (stale column) | 665 of 1 823 |
| `event_proposed_by` rows not referenced by any event | 78 of 4 366 |
| Events with **both** `place_id` and `place_proposed_id` | 48 |
| Events with **neither** | 787 |
| Events with `slug IS NULL` | 1 |
| Events where `slug <> old_slug` | 22 |
| Duplicate `old_slug` values (no unique index exists) | 0 |
| `audience_id_seq.last_value` = 3 while `max(audience.id)` = 4 | the next insert into `audience` would collide — **UNVERIFIED** cause, likely the same dump/restore artefact as §6.4 |

---

## 7. Structural shapes the port has to reckon with

### 7.1 Single-table inheritance on `event`

```php
#[ORM\InheritanceType('SINGLE_TABLE')]
#[ORM\DiscriminatorColumn(name: 'type', type: 'string')]
#[ORM\DiscriminatorMap(['mainevent' => MainEvent::class, 'subevent' => SubEvent::class])]
```
`src/Entity/Event.php:23–27`

- `MainEvent` adds `recurrence`, `recurrence_week_days` (JSON), `ticketing_url`, and a OneToMany to
  `SubEvent`.
- `SubEvent` adds `mainevent_id` (self-FK on `event`) and **delegates** `getRecurrence()`,
  `getRecurrenceWeekDays()`, `getTicketingUrl()`, `getPublicationDate()`, `getUser()`, `getImages()`,
  `getRates()` to its parent — i.e. sub-events have no images/rates/user of their own.
- Shape in production: exactly two levels. 21 116 mainevents, 13 163 subevents; every subevent has a
  `mainevent_id`; every parent is a `mainevent`; no mainevent has a parent; 3 285 mainevents have at
  least one subevent.

### 7.2 Materialised occurrences, and why they are huge

`event_occurrence` (118 021 rows) is generated from each event's date range + recurrence. The
distribution is extremely skewed:

| occurrences per event | events | total occurrences |
| --- | --- | --- |
| 1–10 | 33 827 | 35 169 |
| 11–100 | 364 | 13 010 |
| 100+ | 84 | **69 842** |

A single "permanent exhibition" pattern dominates: four `Wunderkammer - Die Schausammlung` rows with
`date_to = 2099‑12‑31` produce 7 826 + 5 218 + 2 609 + 2 609 = 18 262 occurrences (15 % of the table).
Date hygiene is poor: `min(event_occurrence.date_from) = 0001‑10‑31`, `max = 2099‑12‑31`;
119 occurrences are before 1990 and 18 460 after 2050. 65 `event` rows have an out-of-range
`date_from`.

### 7.3 Polymorphic image owner

`image` has three nullable FKs (`event_id`, `organization_id`, `place_id`) and no constraint that
exactly one is set — 199 rows have none. Ordering is `position ASC, id ASC`
(`src/Entity/Event.php:162`), with `position` seeded by `Version20260930123256`.

### 7.4 Money as a string of cents

`rate.price` is `character varying(255)` holding an integer number of **cents**:
`src/Mapper/RateEntityToApiMapper.php:31` (`intval(...) / 100`),
`src/Serializer/Normalizer/RateNormalizer.php:21`, `src/Form/ApiForm/ApiRateType.php:48`
(`$data->setPrice($price * 100)`). Most common values: `2000` (1 701), `2500` (1 391), `3000` (1 296),
`1500` (1 025), `1000` (684), `0` (411).

### 7.5 `related_dates` is serialised PHP

`event.related_dates` (34 275 of 34 279 non-empty) holds the raw `json_encode()` of PHP `\DateTime`
objects:

```json
[{"date":"2024-09-07 12:00:00.000000","timezone_type":3,"timezone":"Europe\/Zurich"},
 {"date":"2024-09-05 10:00:00.000000","timezone_type":3,"timezone":"Europe\/Zurich"}]
```

17 084 events have exactly one entry; the array length tails off to double digits.

### 7.6 Timezone handling

All datetime columns are `timestamp with time zone`. `config/packages/doctrine.yaml` overrides the
`datetimetz` and `datetimetz_immutable` DBAL types with `App\Doctrine\Type\LocalDateTimeTzType` /
`…ImmutableType`, which force-convert loaded values to `Europe/Zurich`
(`src/Doctrine/Type/LocalDateTimeTzType.php:22`). `src/Entity/Trait/TimestampableEntity.php` exists
purely to map Gedmo's `createdAt`/`updatedAt` as `datetimetz` instead of `datetime`.

### 7.7 Search

`src/DQL/ILike.php` emits
`(unaccent(CAST(x AS TEXT)) ILIKE unaccent(CAST(y AS TEXT)) ESCAPE '!')`;
`src/DQL/JsonValuesText.php` emits
`jsonb_path_query_array(CAST(labels AS JSONB), '$.** ? (@.type() == "string")')::text`;
`src/DQL/JsonKeyValuesText.php` the same scoped to one top-level key.
**There are no expression indexes and no trigram indexes in the database** — every index is a plain
btree on a bare column (verified against `pg_stat_user_indexes`, 83 indexes, none functional). All
accent-insensitive and JSON searches are sequential scans.

### 7.8 Composite primary keys

`event_category (event_id, category_id)`, `organization_category (organization_id, category_id)`,
`organization_affiliation (organization_id, affiliation_id)`, `user_organization (user_id, organization_id)`
— pure join tables, no surrogate id, no payload columns.

### 7.9 Self-referencing hierarchies

- `category.parent_id → category.id` (adjacency list, exactly 2 levels in production:
  8 roots, 22 children).
- `event.mainevent_id → event.id` (STI parent link, 2 levels).

---

## 8. Reference-data seeds

### 8.1 Migrations that write business/reference data

| Migration | Data written |
| --- | --- |
| `Version20230116104023` | `INSERT INTO affiliation (label) VALUES ('{"fr": "Carte culture"}')`, timestamps `2023‑01‑26 13:33:00` |
| `Version20230130112308` | 14 `UPDATE category SET tag_color = …` for ids 1‑13, 23 |
| `Version20230522143507` | `UPDATE {event,image,organization,place} SET labels = "[]"` |
| `Version20231012152121` | `UPDATE {contact,rate,technical_sheet} SET labels = NULL WHERE labels = ''` |
| `Version20240823090216` | `UPDATE event SET og_image = NULL WHERE JSON_VALID(og_image) = 0 OR og_image = ''` |
| `Version20251119070155/072203/074019` | backfill `old_slug` from `slug` on `event`, `place`, `organization` |
| `Version20260612090000` | backfill `event.archived_organization` / `archived_place` from the live relations |
| `Version20260925090000` | backfill `event.print_category_id = MIN(event_category.category_id)` where `show_in_print = true` |
| `Version20260926100000` | audience renames + conditional insert of `Für Kinder gedacht` |
| `Version20260926150000` | `UPDATE "user" SET locale='de' WHERE locale IS NULL` |
| `Version20260930123256` | seed `image.position` from `ROW_NUMBER()` per owner |
| `Version20261016100000` | final audience renames + conditional insert of `Für Senior:innen` |

### 8.2 `docs/*.sql` — the reference seeds, verbatim

These four files are **MySQL** inserts (backtick identifiers, backslash-escaped JSON). Nothing in
the codebase references them (`grep -rn 'regions.sql\|categories.sql\|audiences.sql\|affiliations.sql'`
over the whole repo excluding `.git`/`vendor`/`node_modules`: no hits) — they are hand-run snippets.
The BKA-specific equivalent lives in `src/DataFixtures/AppFixtures.php`; see §8.4.

#### `docs/regions.sql` — 8 rows

| id | label | created_at |
| --- | --- | --- |
| 1 | `{"fr": "Broye"}` | 2022‑06‑21 12:00:00 |
| 2 | `{"fr": "Gruyère"}` | 2022‑06‑21 12:00:00 |
| 3 | `{"fr": "Glâne"}` | 2022‑06‑21 12:00:00 |
| 4 | `{"fr": "Lac"}` | 2022‑06‑21 12:00:00 |
| 5 | `{"fr": "Sarine"}` | 2022‑06‑21 12:00:00 |
| 7 | `{"fr": "Singine"}` | 2022‑06‑21 12:00:00 |
| 8 | `{"fr": "Veveyse"}` | 2022‑06‑21 12:00:00 |
| 9 | `{"fr": "Broye-Vully (Vaud)","de": "Broye-Vully (Waadt)"}` | 2023‑06‑02 10:00:00 |

(id 6 is deliberately absent in the file.)

#### `docs/audiences.sql` — 3 rows

| id | label |
| --- | --- |
| 1 | `{"fr": "Tout public"}` |
| 2 | `{"fr": "Adultes"}` |
| 3 | `{"fr": "Enfants"}` |

All at `2022‑11‑24 12:00:00`.

#### `docs/affiliations.sql` — 4 rows

| id | label |
| --- | --- |
| 1 | `{"fr": "AG culturel"}` |
| 2 | `{"fr": "Charte Aretha"}` |
| 3 | `{"fr": "Billets suspendus"}` |
| 4 | `{"fr": "Prix AVS"}` |

All at `2022‑11‑24 12:00:00`.

#### `docs/categories.sql` — 23 rows

| id | parent | label | tag_color |
| --- | --- | --- | --- |
| 1 | — | `{"fr": "Musique"}` | `#93B37F` |
| 2 | 1 | `{"fr": "Concert"}` | `#93B37F` |
| 3 | 1 | `{"fr": "DJ"}` | `#93B37F` |
| 4 | 1 | `{"fr": "Diffusion sonore"}` | `#93B37F` |
| 5 | — | `{"fr": "Arts visuels & design"}` | `#FF4C00` |
| 6 | 5 | `{"fr": "Arts visuels"}` | `#FF4C00` |
| 7 | 5 | `{"fr": "Design"}` | `#FF4C00` |
| 8 | — | `{"fr": "Arts de la scène"}` | `#FFAAFF` |
| 9 | 8 | `{"fr": "Théâtre"}` | `#FFAAFF` |
| 10 | 8 | `{"fr": "Danse"}` | `#FFAAFF` |
| 11 | 8 | `{"fr": "Opéra"}` | `#FFAAFF` |
| 12 | 8 | `{"fr": "Performance"}` | `#FFAAFF` |
| 13 | 8 | `{"fr": "Cirque"}` | `#FFAAFF` |
| 14 | — | `{"fr": "Projection"}` | `#01646A` |
| 15 | — | `{"fr": "Littérature"}` | `#FF4C00` |
| 16 | — | `{"fr": "Patrimoine"}` | `#863D15` |
| 17 | — | `{"fr": "Rencontre & médiation"}` | `#FFDF00` |
| 18 | 17 | `{"fr": "Discussion"}` | `#FFDF00` |
| 19 | 17 | `{"fr": "Conférence"}` | `#FFDF00` |
| 20 | 17 | `{"fr": "Atelier"}` | `#FFDF00` |
| 21 | 17 | `{"fr": "Convention"}` | `#FFDF00` |
| 22 | 17 | `{"fr": "Excursion"}` | `#FFDF00` |
| 23 | — | `{"fr": "Transdisciplinaire"}` | `#FF4C00` |

All at `2022‑06‑21 12:00:00`. Note that `Version20230130112308` immediately overwrites 14 of these
`tag_color`s.

### 8.3 What BKA production actually contains — and the verdict per file

#### `region` — **the file matches, plus a Bern extension**

| id | label (`de`) | `hidden` | places | orgs | created_at |
| --- | --- | --- | --- | --- | --- |
| 1 | Broye | **t** | 0 | 0 | 2022‑06‑21 |
| 2 | Greyerz | **t** | 0 | 0 | 2022‑06‑21 |
| 3 | Glane | **t** | 0 | 0 | 2022‑06‑21 |
| 4 | See | **t** | 0 | 0 | 2022‑06‑21 |
| 5 | Saane | **t** | **15** | **15** | 2022‑06‑21 |
| 7 | Sense | **t** | 0 | 0 | 2022‑06‑21 |
| 8 | Vivisbach | **t** | 0 | 0 | 2022‑06‑21 |
| 9 | Broye-Vully (Waadt) | **t** | 0 | 0 | 2023‑06‑02 |
| 10 | Stadt Bern | f | 613 | 383 | 2023‑06‑02 |
| 11 | Region Bern | f | 185 | 58 | 2023‑06‑02 |
| 13 | Thun & Berner Oberland | f | 95 | 23 | 2023‑06‑02 |
| 14 | Biel & Seeland | f | 47 | 13 | 2023‑06‑02 |
| 15 | Restlicher Kanton | f | 321 | 249 | 2023‑06‑02 |

The 8 Fribourg regions from `regions.sql` are present with **exactly the file's `created_at`
values**, all German-translated and all `hidden = true`. The 5 Bern regions were appended with the
copy-pasted `2023‑06‑02 10:00:00` timestamp. ids 6 and 12 are gaps (12 was deleted; the sequence is
at 15). `src/DataFixtures/AppFixtures.php` reproduces all 13 rows exactly as production has them.
**Only region 5 (Saane) still has live data — 15 places and 15 organizations — despite being
hidden.** That is a data-cleanup item for the port.

#### `audience` — **the file matches ids 1‑3, then everything was relabelled**

| id | label | created_at | events |
| --- | --- | --- | --- |
| 1 | `{"fr":"Tout public","de":"Für alle"}` | 2022‑11‑24 12:00:00 | 28 053 |
| 2 | `{"fr":"Adultes seulement","de":"Nur für Erwachsene"}` | 2022‑11‑24 12:00:00 | 4 665 |
| 3 | `{"fr":"Enfants et adolescents","de":"Für Kinder und Jugendliche"}` | 2022‑11‑24 12:00:00 | 1 561 |
| 4 | `{"fr":"Pour les seniors","de":"Für Senior:innen"}` | 2026‑10‑17 | 0 |

`created_at` for ids 1‑3 is byte-identical to `audiences.sql`, so the file **was** applied. Row 4 was
inserted by `Version20261016100000`. The German labels never existed in the seed file — they were
added by `Version20260926100000` and `Version20261016100000`. The mapping file→prod is
1→1, 2→2, 3→3, and `Familien`/`Für die ganze Familie` (which both rename migrations handle) **never
existed in BKA** — only In Situ had it.

#### `affiliation` — **the file was NOT applied; BKA has a different, 7-row list**

| id | label | organizations |
| --- | --- | --- |
| 1 | `{"fr": "AG culturel", "de": "Kultur-GA"}` | 15 |
| 2 | `{"fr": "Kulturlegi", "de": "Kulturlegi"}` | 23 |
| 3 | `{"fr": "AHV/IV", "de": "AHV/IV"}` | 13 |
| 4 | `{"fr": "Etudiant/e", "de": "Student:innen"}` | 24 |
| 5 | `{"fr": "Enfants", "de": "Kinder"}` | 3 |
| 6 | `{"fr": "Membres", "de": "Mitglieder"}` | 2 |
| 7 | `{"fr": "Réduit", "de": "Ermässigt"}` | 5 |

**All seven rows carry `created_at = updated_at = 2023‑01‑26 13:33:00`** — the timestamp hard-coded
in `Version20230116104023` and reused by `src/DataFixtures/AppFixtures.php`, not the
`2022‑11‑24 12:00:00` of `affiliations.sql`. Only `AG culturel` survives from the file's wording, and
the BKA list is semantically different: these are *price reduction schemes* (Kulturlegi, AHV/IV,
student discounts), not the In Situ "Charte Aretha / Billets suspendus / Prix AVS" affiliations.
`AppFixtures` defines only the first four; rows 5–7 (`Kinder`, `Mitglieder`, `Ermässigt`) exist only
in production. 28 distinct organizations carry 85 affiliation links.

#### `category` — **the file was NOT applied; BKA has its own 30-row taxonomy**

| id | parent | label `de` | tag_color | hidden | events |
| --- | --- | --- | --- | --- | --- |
| 1 | — | Musik | `#AFD3AA` | f | 7 098 |
| 2 | 1 | Konzert | `#AB9200` | **t** | 25 |
| 3 | 1 | Clubbing | `#E53429` | f | 1 338 |
| 4 | 1 | Tonübertragung | `#1961AC` | **t** | 0 |
| 5 | — | Kunst | `#AB9200` | f | 4 280 |
| 6 | 5 | Visuelle Künste | `#E53429` | **t** | 0 |
| 7 | 5 | Design | `#1961AC` | **t** | 0 |
| 8 | — | Bühne | `#E53429` | f | 3 281 |
| 9 | 8 | Theater | `#1961AC` | f | 4 719 |
| 10 | 8 | Tanz | `#2BAC6C` | f | 1 220 |
| 11 | 8 | Oper | `#F29EB7` | f | 560 |
| 12 | 8 | Performance | `#2A4033` | f | 1 241 |
| 13 | 8 | Zirkus | `#A9C5E8` | **t** | 0 |
| 14 | — | Film | `#1961AC` | f | 2 066 |
| 15 | — | Literatur | `#2BAC6C` | f | 1 894 |
| 16 | — | Ausstellungen & Kulturerbe | `#F29EB7` | f | 2 794 |
| 17 | — | Begegnungen | `#2A4033` | f | 1 997 |
| 18 | 17 | Im Gespräch | `#A9C5E8` | f | 1 926 |
| 19 | 17 | Konferenz | `#AFD3AA` | f | 119 |
| 20 | 17 | Workshop | `#AB9200` | f | 1 235 |
| 21 | 17 | Konvention | `#E53429` | f | 129 |
| 22 | 17 | Führung | `#1961AC` | f | 2 435 |
| 23 | — | Diverses | `#2BAC6C` | f | 4 508 |
| 24 | 1 | Klassik | `#2BAC6C` | f | 3 948 |
| 25 | 1 | Jazz/Blues | `#F29EB7` | f | 2 558 |
| 26 | 1 | Pop/Rock | `#2A4033` | f | 1 804 |
| 27 | 1 | Experimental | `#A9C5E8` | f | 944 |
| 28 | 8 | Kleintheater | `#AFD3AA` | f | 1 645 |
| 29 | 8 | Spoken Word | `#AB9200` | f | 662 |
| 30 | 8 | Artistik | `#F29EB7` | f | 425 |

Differences from `docs/categories.sql`:

- **Ids 1‑22 keep the file's `created_at` (2022‑06‑21 12:00:00) but ids 23‑30 are
  `2022‑10‑17 12:00:00`** — so BKA's seed is a *different* script. That script is reproduced
  verbatim in `src/DataFixtures/AppFixtures.php` (§8.4), which matches production on all 30 rows
  except id 21's German label.
- Id 23 is `Diverses`/`Divers` in BKA but `Transdisciplinaire` in the file; id 3 is `Clubbing` vs
  `DJ`; id 14 is `Film` vs `Projection`; id 16's German is "Ausstellungen & Kulturerbe"; id 17 is
  `Begegnungen` vs `Rencontre & médiation`; id 18 is `Im Gespräch` vs `Discussion`; id 22 is
  `Führung` vs `Excursion`; id 5 is `Kunst` vs `Arts visuels & design`; id 8 is `Bühne` vs
  `Arts de la scène`.
- Ids 24‑30 (Klassik, Jazz/Blues, Pop/Rock, Experimental, Kleintheater, Spoken Word, Artistik) do not
  exist in the file at all.
- **Every `tag_color` differs** from both the file and `Version20230130112308` — BKA uses a
  7-colour rotation (`#AFD3AA #AB9200 #E53429 #1961AC #2BAC6C #F29EB7 #2A4033 #A9C5E8`).
- 5 categories are hidden (2, 4, 6, 7, 13); 4 of them have 0 events, `Konzert` has 25 legacy ones.
- 54 851 `event_category` links over 34 279 events = 1.6 categories/event average.

**Verdict table**

| File | Applied to BKA? | Evidence |
| --- | --- | --- |
| `docs/regions.sql` | **Yes**, then extended with 5 Bern regions and all 8 originals hidden | identical `created_at` for ids 1‑5,7,8,9 |
| `docs/audiences.sql` | **Yes**, then fully relabelled (DE added) and 1 row appended | identical `created_at` for ids 1‑3 |
| `docs/affiliations.sql` | **No** | all 7 BKA rows carry the `Version20230116104023` timestamp, labels unrelated |
| `docs/categories.sql` | **No** | id 23+ timestamps and labels differ; tag colours differ wholesale |

### 8.4 The *real* BKA reference seed lives in `src/DataFixtures/AppFixtures.php`

`docs/*.sql` is the In Situ seed. The **BKA** seed is hard-coded as raw SQL inside the Doctrine
fixture class `/Users/itrulia/Documents/insitu-admin/src/DataFixtures/AppFixtures.php` (122 lines),
written with MySQL `X'…'` hex literals for the JSON labels and backtick identifiers:

```php
$this->connection->executeStatement("INSERT INTO `category` (`id`, `parent_id`, `label`, `tag_color`, `created_at`, `updated_at`, `hidden`)
VALUES
    (1, NULL, X'7B226672223A20224D757369717565222C226465223A20224D7573696B227D', '#AFD3AA', '2022-06-21 12:00:00', '2022-06-21 12:00:00', 0),
    …
```
(`X'7B226672…'` decodes to `{"fr": "Musique","de": "Musik"}`.)

It seeds:

| Table | Rows in the fixture | Match against BKA production |
| --- | --- | --- |
| `oauth2_client` / `oauth2_access_token` / `oauth2_refresh_token` | 1 each (`test_client_name`, user `tests1@venue-example.org`) | test-only; production has 4 real clients (`heiko_dachstock.ch`, `guidle`, `bka-frontend`, `punktzwei`) |
| `category` | **30**, ids 1–30, with BKA colours (`#AFD3AA #AB9200 #E53429 #1961AC #2BAC6C #F29EB7 #2A4033 #A9C5E8`) and `hidden` flags on 2, 4, 6, 7, 13 | **matches production exactly except id 21**: fixture `{"fr":"Convention","de":"Messe"}` vs production `{"fr": "Convention","de": "Konvention"}` |
| `affiliation` | **4**: `Kultur-GA`, `Kulturlegi`, `AHV/IV`, `Student:innen`, all at `2023‑01‑26 13:33:00` | production has **7** — the fixture is missing `Kinder` (5), `Mitglieder` (6), `Ermässigt` (7) |
| `region` | **13**, ids 1–5, 7–11, 13–15, with `hidden = 1` on the 8 Fribourg ones | **matches production exactly** (ids, labels, timestamps, hidden flags) |
| `audience` | **4**: 1 `Tout public`/`Alle`, 2 `Adultes seulement`/`Nur für Erwachsene`, 3 `Pour toute la famille`/`Für die ganze Familie`, 4 `Destiné aux enfants`/`Für Kinder gedacht` | **out of date**: this is the post-`Version20260926100000` / pre-`Version20261016100000` state. Production is 1 `Für alle`, 2 `Nur für Erwachsene`, 3 `Für Kinder und Jugendliche`, 4 `Für Senior:innen` — and BKA never had `Für die ganze Familie` on any row. |
| `place` | 5 fakes (`Place_0` … `Place_4`) | test-only |
| `user` | 1 (`tests1@venue-example.org`) | test-only |

Two consequences:

- **`AppFixtures` is the closest thing to a canonical BKA reference-data definition** — far more
  accurate than `docs/*.sql`. Use the live tables as the source of truth, but this file explains
  where production's values came from.
- **The fixture is MySQL-only and therefore broken on PostgreSQL**: `X'…'` byte literals and
  backtick identifiers are not valid PostgreSQL. `doctrine:fixtures:load` cannot work against the
  current database. **UNVERIFIED** whether anyone still runs it — settling it needs a test run
  against a scratch database, which I did not do (read-only rule).

---

## 9. The physical schema today (reference)

29 tables, 20 sequences, 83 indexes, 3 extensions (`plpgsql`, `pg_stat_statements`, `unaccent`),
UTF‑8 / `en_US.utf8`, PostgreSQL 18.3, 211 MB total.

| Table | Total size | Heap |
| --- | --- | --- |
| `event` | 165 MB | 139 MB |
| `event_occurrence` | 15 MB | 7 232 kB |
| `image` | 11 MB | 7 896 kB |
| `event_category` | 5 632 kB | 2 416 kB |
| `rate` | 1 840 kB | 1 264 kB |
| everything else | < 1 MB each | |

`event` is 4 KB/row, almost all of it the `labels` text column.

Indexes added after the pgloader conversion and their observed usage **in this local session only**
(`pg_stat_user_indexes` was reset by the restore, so these numbers reflect my browsing, not
production traffic):

| Index | Created by | `idx_scan` here |
| --- | --- | --- |
| `idx_event_pub_status_date` | `Version20260626113538` | 34 |
| `idx_place_lat_lon` | `Version20260626113538` | 0 |
| `idx_place_proposed_lat_lon` | `Version20260626113538` | 0 |
| `idx_3bae0aa7e2e3a9e3` (`event.print_category_id`) | `Version20260925090000` | 4 |

---

## 10. Porting notes (opinion, not fact)

These are suggestions for the We.Publish port, clearly separated from the findings above.

1. **Do not try to replay the migration chain.** Model the target in Prisma from the *current*
   PostgreSQL schema (§9) plus the data audit (§5), and write a one-shot ETL from a `pg_dump` of
   production. The 56 MySQL-era migrations are archaeology.

2. **Drop these columns at the ETL boundary — they are provably empty in BKA:**
   `event.description`, `event.sponsored_start_date`, `event.sponsored_end_date`, `event.og_image`,
   `image.legend`, `rate.designation`, `contact.designation_email`, `contact.designation_phone`,
   `place.capacity`, `technical_sheet.title`. Also consider dropping the whole
   `place.pro_infirmis_*` triplet unless the ProInfirmis integration is being rebuilt from scratch —
   there is exactly one real row and it points at a test place. And `place_proposed.event_id`, which
   the entity model already abandoned.

3. **Three generations of ticketing coexist** (`event.ticketing_url` 1 794 rows →
   `labels.ticketingUrl` 28 334 rows → `ticketing` table 0 rows). Pick one target shape and merge all
   three in the ETL; do not port the legacy columns.

4. **`labels` is a hand-rolled i18n store with only two languages and ~7 % French coverage.** In
   We.Publish terms this is a candidate for either per-locale block content or a small
   `{de, fr}` JSON value object. Watch for the `[]` (empty *array*) values — 258 places, 154
   organizations — which are not objects.

5. **Prisma friction list.**
   - *Integer ids vs `gen_random_uuid()`*: We.Publish uses `String @id @default(dbgenerated("gen_random_uuid()"))`
     throughout (`libs/api/prisma/schema.prisma:11`). BKA's 20 `bigint` sequences will need an
     id-mapping table in the ETL, and any externally published URL built from
     `event.slug`/`old_slug` must be preserved.
   - *Single-table inheritance*: Prisma has no inheritance. `MainEvent`/`SubEvent` must become either
     one model with a `type` enum + nullable self-relation (closest to today) or two models. Note
     that `SubEvent` *reads through* to its parent for images, rates, user, publication date and
     ticketing URL — that delegation has to be reimplemented in the resolver layer.
   - *JSON columns are `text`, not `jsonb`*: Prisma's `Json` scalar maps to `jsonb` on PostgreSQL.
     Converting `labels`, `roles`, `config`, `related_dates`, `recurrence_week_days`,
     `pro_infirmis_pictograms`, `og_image`, `category.label`, `region.label`, `audience.label`,
     `affiliation.label` to `jsonb` is desirable but is a real data conversion (several rows are
     `'[]'` or invalid), and it changes every query that currently does `::json`/`CAST(... AS JSONB)`.
   - *`unaccent` is not declared anywhere in We.Publish.* `libs/api/prisma/schema.prisma` declares
     `previewFeatures = ["views", "relationJoins"]` and no `extensions`. Only `pg_trgm` is created,
     by `libs/api/prisma/migrations/20260703144518_add_trigram_index_to_slugs/migration.sql`. Adding
     `unaccent` means either enabling the `postgresqlExtensions` preview feature or hand-writing a
     `CREATE EXTENSION` migration. Consider replacing the whole `unaccent + ILIKE` approach with
     `pg_trgm` + a generated/normalised search column, since BKA has **no** functional indexes today
     and every accent-insensitive search is a sequential scan over 34 k rows.
   - *Composite keys are fine* — `@@id([a, b])` covers all four join tables.
   - *No CHECK constraints* — all eight enum-ish `varchar` columns (§5.6) can become real Prisma
     enums, but the ETL must handle `''` (26 176 `special_rate` rows) and `NULL`.
   - *`user.roles`* stores an unordered JSON array with two spellings of the same pair; normalise.
   - *`rate.price`* should become an integer of cents (`Int`), not a string.
   - *`related_dates`* should be re-derived rather than ported — it is serialised PHP `\DateTime`
     objects, and the same information exists in `event_occurrence`.
   - *`timestamptz` + forced `Europe/Zurich`*: Prisma's `@db.Timestamptz(3)` matches the column type,
     but the application-level timezone coercion in
     `src/Doctrine/Type/LocalDateTimeTzType.php` has no Prisma equivalent — the port must decide
     where "Zurich wall-clock time" is applied, and the out-of-range dates (year 0001, year 2099)
     must be cleaned first.
   - *No `citext` and no array columns anywhere* — one fewer problem.

6. **`event_occurrence` is a materialised view in all but name.** 84 events generate 59 % of its
   118 021 rows because "permanent" exhibitions run to 2099. If the port keeps a materialised
   occurrence table, cap the horizon; if it computes occurrences on the fly, the
   `USE_OPTIMIZED_EVENT_LOAD=true` query paths disappear with it.

7. **Reference data to carry over verbatim**: the 30 BKA categories (with their parents, colours and
   `hidden` flags), the 13 regions (8 of them hidden, but region 5 still has 15 places/orgs attached —
   decide what happens to them), the 4 audiences, and the 7 affiliations. **Ignore
   `docs/categories.sql` and `docs/affiliations.sql` entirely** — they describe In Situ, not BKA.
   `src/DataFixtures/AppFixtures.php` is the BKA-shaped seed, but it is already stale on audiences
   (missing the Oct‑2026 rename) and affiliations (4 of 7). Export the live tables instead and treat
   both files as documentation only.

8. **Watch the hidden/visible split.** `category.hidden` and `region.hidden` were introduced
   (`Version20231017145422`) specifically so In Situ and BKA could share one taxonomy while showing
   different subsets. In a BKA-only port the hidden rows are dead weight — except for region 5
   (`Saane`, hidden) which still owns 15 places and 15 organizations, and category 2 (`Konzert`,
   hidden) which still tags 25 events.
