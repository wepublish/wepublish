# BKA Live Data Profile — quantitative census of the production database

**Scope.** This document profiles the *real BKA production data* restored locally into
`insitu-admin-postgres-1` (database `insitu-admin`), so the We.Publish port can be designed against
what is actually used rather than against what the Symfony entities theoretically allow. It covers
every table and every column (row counts, null/empty rates, distinct-value counts, and full value
distributions for every low-cardinality column), then drills into `event`, `event_occurrence`,
`user`, `organization`, `place`, the lookup tables (dumped in full — they must be seeded in the new
system), and the API-access tables (`user_token`, `oauth2_*`, secrets redacted). It closes with the
list of dead columns, the orphan/referential-inconsistency findings, and a clearly separated
*Porting notes* section. Every number below comes from a `SELECT` actually executed against the
restored production database on 2026-10-17; schema claims are backed by `\d+` / `information_schema`
and, where behaviour is involved, by a file path in `/Users/itrulia/Documents/insitu-admin`.

---

## 1. How this was measured, and what the restore is

All figures were produced with:

```bash
docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c "<SQL>"
```

The per-column profile was **generated from `information_schema`**, not hand-written, so no column is
missed. The generator:

```sql
WITH cols AS (
  SELECT c.table_name, c.column_name, c.ordinal_position
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name
   AND t.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public'
)
SELECT string_agg(
  format('SELECT %L AS tbl, %L AS col, %s AS pos, count(*) AS n, count(%I) AS nonnull,
          count(DISTINCT %I::text) AS ndistinct,
          sum(CASE WHEN %I::text IN ('''',''[]'',''{}'',''null'') THEN 1 ELSE 0 END) AS nempty
          FROM %I',
    table_name, column_name, ordinal_position,
    column_name, column_name, column_name, table_name),
  E'\nUNION ALL\n' ORDER BY table_name, ordinal_position)
FROM cols;
```

"empty-ish" in the tables below means the column's text representation is `''`, `'[]'`, `'{}'` or
`'null'` — the four ways this schema stores "nothing" in a `text`/`varchar` column that is
technically `NOT NULL` or that Doctrine filled with an empty JSON document.

### 1.1 Restore vintage — read this before trusting timestamps

| Fact | Value |
|---|---|
| Latest `event.created_at` | `2026-05-21 04:30:15+00` |
| Latest `event.updated_at` | `2026-05-21 06:00:12+00` |
| Latest `user.created_at` | `2026-05-20 08:26:27+00` |
| Migrations executed on/before 2025-12-16 | 56 |
| Migrations executed **today, 2026-10-17 17:53–17:54** (i.e. during the local restore) | 11 |
| Total migrations recorded | 67 |

The content is a production snapshot taken around **2026-05-21**. The last eleven Doctrine
migrations (`Version20260608120000` … `Version20261016100000`) were applied *locally* at restore
time, which is why a handful of rows carry an `updated_at` of `2026-10-17 15:54` or `17:54` — notably
every row of `audience`, and the brand-new `audience` row 4 (`Für Senior:innen`) created by
`Version20261016100000`. Treat those timestamps as artefacts of the restore, not production edits.
`user.last_login` for `admin@wepublish.ch` (`2026-10-17 16:00`) is likewise a local login.

Migrations executed locally today:

```
Version20260608120000  2026-10-17 17:53:53   3719 ms
Version20260612090000  2026-10-17 17:53:57   3657 ms
Version20260626113538  2026-10-17 17:54:01     47 ms
Version20260923160000  2026-10-17 17:54:01      1 ms
Version20260925090000  2026-10-17 17:54:01   1481 ms
Version20260926100000  2026-10-17 17:54:02      6 ms
Version20260926150000  2026-10-17 17:54:02      4 ms
Version20260926170000  2026-10-17 17:54:02      5 ms
Version20260930123256  2026-10-17 17:54:02    284 ms
Version20261008090000  2026-10-17 17:54:03      4 ms
Version20261016100000  2026-10-17 17:54:03      3 ms
```

### 1.2 Index naming confirms the MySQL→Postgres move

Nearly every index is named `idx_<oid-ish number>_<original mysql index name>`, e.g.
`idx_252807_uniq_3bae0aa7989d9b62` on `event.slug`, `idx_252833_datefrom_idx` on
`event_occurrence.date_from`. That prefix pattern is what a MySQL→Postgres converter emits. Only the
indexes added after the move carry clean names: `idx_3bae0aa7e2e3a9e3` (`event.print_category_id`),
`idx_event_pub_status_date` (`event(publication_status, publication_date)`), `idx_place_lat_lon`
(`place(latitude, longitude)`).

---

## 2. Table inventory — exact row counts and on-disk size

| Table | Rows | Total size | Heap | Indexes |
|---|---:|---:|---:|---:|
| `event` | **34,279** | 165 MB | 139 MB | 15 MB |
| `event_occurrence` | **118,021** | 15 MB | 7,232 kB | 7,696 kB |
| `image` | **27,571** | 11 MB | 7,896 kB | 3,080 kB |
| `event_category` | **54,851** | 5,632 kB | 2,416 kB | 3,184 kB |
| `rate` | **12,697** | 1,840 kB | 1,264 kB | 536 kB |
| `place` | **1,276** | 824 kB | 440 kB | 328 kB |
| `event_proposed_by` | **4,366** | 808 kB | 656 kB | 112 kB |
| `organization` | **741** | 784 kB | 568 kB | 168 kB |
| `place_proposed` | **1,823** | 536 kB | 208 kB | 296 kB |
| `video` | **2,025** | 384 kB | 224 kB | 128 kB |
| `user` | **427** | 264 kB | 144 kB | 88 kB |
| `organization_category` | **857** | 176 kB | 40 kB | 104 kB |
| `user_organization` | **507** | 152 kB | 24 kB | 96 kB |
| `user_token` | **5** | 96 kB | 16 kB | 48 kB |
| `contact` | **90** | 88 kB | 16 kB | 32 kB |
| `organization_affiliation` | **85** | 88 kB | 8 kB | 48 kB |
| `doctrine_migration_versions` | **67** | 56 kB | 16 kB | 16 kB |
| `oauth2_access_token` | **7** | 48 kB | 8 kB | 32 kB |
| `category` | **30** | 48 kB | 8 kB | 32 kB |
| `technical_sheet` | **1** | 48 kB | 8 kB | 32 kB |
| `ticketing` | **0** | 48 kB | 8 kB | 32 kB |
| `oauth2_refresh_token` | **7** | 40 kB | 8 kB | 32 kB |
| `messenger_messages` | **0** | 40 kB | 0 | 32 kB |
| `reset_password_request` | **0** | 40 kB | 8 kB | 32 kB |
| `region` | **13** | 32 kB | 8 kB | 16 kB |
| `oauth2_client` | **4** | 32 kB | 8 kB | 16 kB |
| `affiliation` | **7** | 32 kB | 8 kB | 16 kB |
| `audience` | **4** | 32 kB | 8 kB | 16 kB |
| `oauth2_authorization_code` | **0** | 24 kB | 0 | 16 kB |
| **Database total** | | **211 MB** | | |

`event` is 139 MB of heap for 34,279 rows (~4.2 kB/row). Section 5.7 explains why: each row carries
a denormalised `related_dates` JSON array of *every* date in its event group, plus the full HTML
description in `labels`.

**Four tables are completely empty**: `ticketing`, `messenger_messages`,
`oauth2_authorization_code`, `reset_password_request`. `technical_sheet` has a single row.

---

## 3. Column-by-column profile — every table, every column

`non-null` = `count(col)`. `null %` = share of rows where the column IS NULL. `empty-ish` = rows
whose text form is `''`, `'[]'`, `'{}'` or `'null'`. `distinct` = `count(DISTINCT col::text)`
(NULLs excluded).


#### `affiliation` — 7 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 7 | 0.0% | 0 | 7 |
| 2 | `label` | 7 | 0.0% | 0 | 7 |
| 3 | `created_at` | 7 | 0.0% | 0 | 1 |
| 4 | `updated_at` | 7 | 0.0% | 0 | 1 |

#### `audience` — 4 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 4 | 0.0% | 0 | 4 |
| 2 | `label` | 4 | 0.0% | 0 | 4 |
| 3 | `created_at` | 4 | 0.0% | 0 | 2 |
| 4 | `updated_at` | 4 | 0.0% | 0 | 1 |

#### `category` — 30 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 30 | 0.0% | 0 | 30 |
| 2 | `parent_id` | 22 | 26.7% | 0 | 4 |
| 3 | `label` | 30 | 0.0% | 0 | 30 |
| 4 | `tag_color` | 30 | 0.0% | 0 | 8 |
| 5 | `created_at` | 30 | 0.0% | 0 | 2 |
| 6 | `updated_at` | 30 | 0.0% | 0 | 2 |
| 7 | `hidden` | 30 | 0.0% | 0 | 2 |

#### `contact` — 90 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 90 | 0.0% | 0 | 90 |
| 2 | `organization_id` | 90 | 0.0% | 0 | 77 |
| 3 | `email` | 90 | 0.0% | 0 | 89 |
| 4 | `designation_email` | 0 | 100.0% | 0 | 0 |
| 5 | `phone_number` | 54 | 40.0% | 0 | 54 |
| 6 | `designation_phone` | 0 | 100.0% | 0 | 0 |
| 7 | `created_at` | 90 | 0.0% | 0 | 81 |
| 8 | `updated_at` | 90 | 0.0% | 0 | 82 |
| 9 | `labels` | 90 | 0.0% | 0 | 49 |

#### `doctrine_migration_versions` — 67 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `version` | 67 | 0.0% | 0 | 67 |
| 2 | `executed_at` | 67 | 0.0% | 0 | 37 |
| 3 | `execution_time` | 67 | 0.0% | 0 | 57 |

#### `event` — 34279 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 34279 | 0.0% | 0 | 34279 |
| 2 | `place_id` | 31717 | 7.5% | 0 | 941 |
| 3 | `audience_id` | 34279 | 0.0% | 0 | 3 |
| 4 | `mainevent_id` | 13163 | 61.6% | 0 | 3285 |
| 5 | `slug` | 34278 | 0.0% | 0 | 34278 |
| 6 | `name` | 34279 | 0.0% | 0 | 16499 |
| 7 | `event_status` | 34279 | 0.0% | 0 | 4 |
| 8 | `date_from` | 34279 | 0.0% | 0 | 14605 |
| 9 | `date_to` | 34279 | 0.0% | 0 | 17746 |
| 10 | `opening_time` | 8729 | 74.5% | 0 | 113 |
| 11 | `description` | 0 | 100.0% | 0 | 0 |
| 12 | `special_rate` | 8103 | 76.4% | 0 | 2 |
| 13 | `publication_status` | 34279 | 0.0% | 0 | 3 |
| 14 | `publication_date` | 176 | 99.5% | 0 | 89 |
| 15 | `created_at` | 34279 | 0.0% | 0 | 22163 |
| 16 | `updated_at` | 34279 | 0.0% | 0 | 5363 |
| 17 | `type` | 34279 | 0.0% | 0 | 2 |
| 18 | `recurrence` | 21116 | 38.4% | 0 | 2 |
| 19 | `recurrence_week_days` | 3611 | 89.5% | 2855 | 46 |
| 20 | `ticketing_url` | 1794 | 94.8% | 0 | 1293 |
| 21 | `proposed_by_id` | 4288 | 87.5% | 0 | 4288 |
| 22 | `user_id` | 21378 | 37.6% | 0 | 282 |
| 23 | `organization_id` | 27949 | 18.5% | 0 | 541 |
| 24 | `labels` | 34279 | 0.0% | 0 | 19587 |
| 25 | `related_dates` | 34279 | 0.0% | 4 | 12623 |
| 26 | `sponsored_start_date` | 0 | 100.0% | 0 | 0 |
| 27 | `sponsored_end_date` | 0 | 100.0% | 0 | 0 |
| 28 | `place_proposed_id` | 1823 | 94.7% | 0 | 1823 |
| 29 | `is_multi_day_event` | 34279 | 0.0% | 0 | 2 |
| 30 | `show_in_print` | 33945 | 1.0% | 0 | 2 |
| 31 | `og_image` | 9 | 100.0% | 9 | 1 |
| 32 | `archived_organization` | 27949 | 18.5% | 0 | 539 |
| 33 | `archived_place` | 31717 | 7.5% | 0 | 927 |
| 34 | `old_slug` | 28355 | 17.3% | 0 | 28355 |
| 35 | `print_category_id` | 21981 | 35.9% | 0 | 26 |

#### `event_category` — 54851 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `event_id` | 54851 | 0.0% | 0 | 34272 |
| 2 | `category_id` | 54851 | 0.0% | 0 | 26 |

#### `event_occurrence` — 118021 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 118021 | 0.0% | 0 | 118021 |
| 2 | `event_id` | 118021 | 0.0% | 0 | 34275 |
| 3 | `date_from` | 118021 | 0.0% | 0 | 59129 |
| 4 | `date_to` | 118021 | 0.0% | 0 | 53509 |

#### `event_proposed_by` — 4366 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 4366 | 0.0% | 0 | 4366 |
| 2 | `firstname` | 4366 | 0.0% | 0 | 1045 |
| 3 | `lastname` | 4366 | 0.0% | 0 | 1313 |
| 4 | `email` | 4366 | 0.0% | 0 | 1568 |
| 5 | `phone` | 4366 | 0.0% | 0 | 1488 |
| 6 | `created_at` | 4366 | 0.0% | 0 | 4366 |
| 7 | `updated_at` | 4366 | 0.0% | 0 | 4366 |
| 8 | `organization` | 4366 | 0.0% | 0 | 1668 |

#### `image` — 27571 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 27571 | 0.0% | 0 | 27571 |
| 2 | `organization_id` | 163 | 99.4% | 0 | 82 |
| 3 | `place_id` | 102 | 99.6% | 0 | 42 |
| 4 | `event_id` | 27107 | 1.7% | 0 | 19505 |
| 5 | `legend` | 0 | 100.0% | 0 | 0 |
| 6 | `file_name` | 27571 | 0.0% | 0 | 27571 |
| 7 | `created_at` | 27571 | 0.0% | 0 | 22146 |
| 8 | `updated_at` | 27571 | 0.0% | 0 | 21681 |
| 9 | `labels` | 27571 | 0.0% | 0 | 7037 |
| 10 | `position` | 27571 | 0.0% | 0 | 28 |

#### `messenger_messages` — 0 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 0 | — | 0 | 0 |
| 2 | `body` | 0 | — | 0 | 0 |
| 3 | `headers` | 0 | — | 0 | 0 |
| 4 | `queue_name` | 0 | — | 0 | 0 |
| 5 | `created_at` | 0 | — | 0 | 0 |
| 6 | `available_at` | 0 | — | 0 | 0 |
| 7 | `delivered_at` | 0 | — | 0 | 0 |

#### `oauth2_access_token` — 7 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `identifier` | 7 | 0.0% | 0 | 7 |
| 2 | `client` | 7 | 0.0% | 0 | 4 |
| 3 | `expiry` | 7 | 0.0% | 0 | 7 |
| 4 | `user_identifier` | 7 | 0.0% | 0 | 6 |
| 5 | `scopes` | 7 | 0.0% | 0 | 1 |
| 6 | `revoked` | 7 | 0.0% | 0 | 1 |

#### `oauth2_authorization_code` — 0 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `identifier` | 0 | — | 0 | 0 |
| 2 | `client` | 0 | — | 0 | 0 |
| 3 | `expiry` | 0 | — | 0 | 0 |
| 4 | `user_identifier` | 0 | — | 0 | 0 |
| 5 | `scopes` | 0 | — | 0 | 0 |
| 6 | `revoked` | 0 | — | 0 | 0 |

#### `oauth2_client` — 4 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `identifier` | 4 | 0.0% | 0 | 4 |
| 2 | `name` | 4 | 0.0% | 0 | 4 |
| 3 | `secret` | 4 | 0.0% | 0 | 4 |
| 4 | `redirect_uris` | 0 | 100.0% | 0 | 0 |
| 5 | `grants` | 4 | 0.0% | 0 | 1 |
| 6 | `scopes` | 4 | 0.0% | 0 | 1 |
| 7 | `active` | 4 | 0.0% | 0 | 1 |
| 8 | `allow_plain_text_pkce` | 4 | 0.0% | 0 | 1 |

#### `oauth2_refresh_token` — 7 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `identifier` | 7 | 0.0% | 0 | 7 |
| 2 | `access_token` | 7 | 0.0% | 0 | 7 |
| 3 | `expiry` | 7 | 0.0% | 0 | 7 |
| 4 | `revoked` | 7 | 0.0% | 0 | 1 |

#### `organization` — 741 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 741 | 0.0% | 0 | 741 |
| 2 | `region_id` | 741 | 0.0% | 0 | 6 |
| 3 | `slug` | 741 | 0.0% | 0 | 741 |
| 4 | `name` | 741 | 0.0% | 0 | 731 |
| 5 | `enabled` | 741 | 0.0% | 0 | 2 |
| 6 | `sub_title` | 402 | 45.7% | 402 | 1 |
| 7 | `address` | 741 | 0.0% | 154 | 519 |
| 8 | `post_office_box` | 8 | 98.9% | 0 | 5 |
| 9 | `zip` | 741 | 0.0% | 0 | 209 |
| 10 | `city` | 741 | 0.0% | 0 | 173 |
| 11 | `latitude` | 587 | 20.8% | 0 | 527 |
| 12 | `longitude` | 587 | 20.8% | 0 | 527 |
| 13 | `about` | 402 | 45.7% | 402 | 1 |
| 14 | `website` | 133 | 82.1% | 0 | 129 |
| 15 | `legal_status` | 70 | 90.6% | 0 | 6 |
| 16 | `created_at` | 741 | 0.0% | 0 | 640 |
| 17 | `updated_at` | 741 | 0.0% | 0 | 739 |
| 18 | `labels` | 741 | 0.0% | 154 | 585 |
| 19 | `old_slug` | 698 | 5.8% | 0 | 698 |

#### `organization_affiliation` — 85 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `organization_id` | 85 | 0.0% | 0 | 28 |
| 2 | `affiliation_id` | 85 | 0.0% | 0 | 7 |

#### `organization_category` — 857 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `organization_id` | 857 | 0.0% | 0 | 587 |
| 2 | `category_id` | 857 | 0.0% | 0 | 23 |

#### `place` — 1276 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 1276 | 0.0% | 0 | 1276 |
| 2 | `region_id` | 1276 | 0.0% | 0 | 6 |
| 3 | `organization_id` | 571 | 55.3% | 0 | 436 |
| 4 | `slug` | 1276 | 0.0% | 0 | 1276 |
| 5 | `name` | 1276 | 0.0% | 0 | 1254 |
| 6 | `enabled` | 1276 | 0.0% | 0 | 2 |
| 7 | `private` | 1276 | 0.0% | 0 | 2 |
| 8 | `address` | 1276 | 0.0% | 258 | 846 |
| 9 | `zip` | 1276 | 0.0% | 0 | 225 |
| 10 | `city` | 1276 | 0.0% | 0 | 208 |
| 11 | `about` | 404 | 68.3% | 404 | 1 |
| 12 | `website` | 105 | 91.8% | 0 | 101 |
| 13 | `latitude` | 1181 | 7.4% | 0 | 905 |
| 14 | `longitude` | 1181 | 7.4% | 0 | 909 |
| 15 | `capacity` | 0 | 100.0% | 0 | 0 |
| 16 | `wheelchair_accessible` | 1276 | 0.0% | 0 | 2 |
| 17 | `wheelchair_accessible_toilets` | 1276 | 0.0% | 0 | 2 |
| 18 | `wheelchair_accessible_parking` | 1276 | 0.0% | 0 | 2 |
| 19 | `pro_infirmis_id_source` | 7 | 99.5% | 6 | 2 |
| 20 | `pro_infirmis_pictograms` | 1276 | 0.0% | 1275 | 2 |
| 21 | `created_at` | 1276 | 0.0% | 0 | 1174 |
| 22 | `updated_at` | 1276 | 0.0% | 0 | 1251 |
| 23 | `pro_infirmis_detail_url` | 1 | 99.9% | 0 | 1 |
| 24 | `labels` | 1276 | 0.0% | 258 | 909 |
| 25 | `old_slug` | 1189 | 6.8% | 0 | 1189 |

#### `place_proposed` — 1823 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 1823 | 0.0% | 0 | 1823 |
| 2 | `event_id` | 1158 | 36.5% | 0 | 1158 |
| 3 | `name` | 1823 | 0.0% | 0 | 975 |
| 4 | `address` | 1823 | 0.0% | 0 | 748 |
| 5 | `zip` | 1823 | 0.0% | 0 | 160 |
| 6 | `city` | 1823 | 0.0% | 0 | 143 |
| 7 | `latitude` | 1823 | 0.0% | 0 | 935 |
| 8 | `longitude` | 1823 | 0.0% | 0 | 937 |

#### `rate` — 12697 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 12697 | 0.0% | 0 | 12697 |
| 2 | `event_id` | 12697 | 0.0% | 0 | 6000 |
| 3 | `price` | 12697 | 0.0% | 0 | 230 |
| 4 | `designation` | 0 | 100.0% | 0 | 0 |
| 5 | `labels` | 12697 | 0.0% | 0 | 1915 |

#### `region` — 13 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 13 | 0.0% | 0 | 13 |
| 2 | `label` | 13 | 0.0% | 0 | 13 |
| 3 | `created_at` | 13 | 0.0% | 0 | 2 |
| 4 | `updated_at` | 13 | 0.0% | 0 | 2 |
| 5 | `hidden` | 13 | 0.0% | 0 | 2 |

#### `reset_password_request` — 0 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 0 | — | 0 | 0 |
| 2 | `user_id` | 0 | — | 0 | 0 |
| 3 | `selector` | 0 | — | 0 | 0 |
| 4 | `hashed_token` | 0 | — | 0 | 0 |
| 5 | `requested_at` | 0 | — | 0 | 0 |
| 6 | `expires_at` | 0 | — | 0 | 0 |

#### `technical_sheet` — 1 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 1 | 0.0% | 0 | 1 |
| 2 | `place_id` | 1 | 0.0% | 0 | 1 |
| 3 | `title` | 0 | 100.0% | 0 | 0 |
| 4 | `file_name` | 1 | 0.0% | 0 | 1 |
| 5 | `created_at` | 1 | 0.0% | 0 | 1 |
| 6 | `updated_at` | 1 | 0.0% | 0 | 1 |
| 7 | `labels` | 1 | 0.0% | 0 | 1 |

#### `ticketing` — 0 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 0 | — | 0 | 0 |
| 2 | `event_id` | 0 | — | 0 | 0 |
| 3 | `labels` | 0 | — | 0 | 0 |
| 4 | `ticketing_designation` | 0 | — | 0 | 0 |

#### `user` — 427 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 427 | 0.0% | 0 | 427 |
| 2 | `email` | 427 | 0.0% | 0 | 427 |
| 3 | `roles` | 427 | 0.0% | 0 | 3 |
| 4 | `password` | 427 | 0.0% | 0 | 427 |
| 5 | `enabled` | 427 | 0.0% | 0 | 2 |
| 6 | `last_login` | 321 | 24.8% | 0 | 321 |
| 7 | `created_at` | 427 | 0.0% | 0 | 321 |
| 8 | `updated_at` | 427 | 0.0% | 0 | 425 |
| 9 | `locale` | 427 | 0.0% | 0 | 1 |
| 10 | `member` | 427 | 0.0% | 0 | 2 |
| 11 | `config` | 125 | 70.7% | 0 | 3 |

#### `user_organization` — 507 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `user_id` | 507 | 0.0% | 0 | 412 |
| 2 | `organization_id` | 507 | 0.0% | 0 | 445 |

#### `user_token` — 5 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 5 | 0.0% | 0 | 5 |
| 2 | `owner_id` | 5 | 0.0% | 0 | 3 |
| 3 | `name` | 5 | 0.0% | 0 | 5 |
| 4 | `expires_at` | 5 | 0.0% | 0 | 5 |
| 5 | `token` | 5 | 0.0% | 0 | 5 |
| 6 | `created_at` | 5 | 0.0% | 0 | 5 |
| 7 | `updated_at` | 5 | 0.0% | 0 | 5 |
| 8 | `uuid` | 5 | 0.0% | 0 | 5 |

#### `video` — 2025 rows

| # | column | non-null | null % | empty-ish | distinct |
|---:|---|---:|---:|---:|---:|
| 1 | `id` | 2025 | 0.0% | 0 | 2025 |
| 2 | `event_id` | 2019 | 0.3% | 0 | 1906 |
| 3 | `embed_link` | 2025 | 0.0% | 0 | 1451 |
| 4 | `created_at` | 2025 | 0.0% | 0 | 1914 |
| 5 | `updated_at` | 2025 | 0.0% | 0 | 1914 |
---

## 4. Dead columns and dead tables — what the port can skip

### 4.1 Columns that are 100 % NULL

| Table | Column | Rows | Note |
|---|---|---:|---|
| `contact` | `designation_email` | 90 | superseded by `contact.labels.designationEmail` |
| `contact` | `designation_phone` | 90 | superseded by `contact.labels.designationPhone` |
| `event` | `description` | 34,279 | superseded by `event.labels.description` |
| `event` | `sponsored_start_date` | 34,279 | `ACTIVATE_SPONSORED_EVENTS=false` for BKA |
| `event` | `sponsored_end_date` | 34,279 | same |
| `image` | `legend` | 27,571 | superseded by `image.labels.legend` |
| `oauth2_client` | `redirect_uris` | 4 | all clients use `refresh_token` grant only |
| `place` | `capacity` | 1,276 | superseded by `place.labels.capacity` |
| `rate` | `designation` | 12,697 | superseded by `rate.labels.designation` |
| `technical_sheet` | `title` | 1 | superseded by `technical_sheet.labels.title` |

### 4.2 Columns that are NULL **or** empty string in 100 % of rows

| Table | Column | NULL | `''` | Note |
|---|---|---:|---:|---|
| `organization` | `sub_title` | 339 | 402 | superseded by `organization.labels.subTitle` |
| `organization` | `about` | 339 | 402 | superseded by `organization.labels.about` |
| `place` | `about` | 872 | 404 | superseded by `place.labels.about` |
| `event` | `og_image` | 34,270 | 9 (`[]`) | never populated |

### 4.3 Effectively dead (one real value or fewer)

| Table | Column | Non-null | Real (non-empty) values | Note |
|---|---|---:|---:|---|
| `place` | `pro_infirmis_id_source` | 7 | **1** (`'265'`, place id 1 = `Format-z test Ort`) | 6 are `''` |
| `place` | `pro_infirmis_detail_url` | 1 | **1** (same test place) | |
| `place` | `pro_infirmis_pictograms` | 1,276 | **1** (same test place) | 1,275 are `[]` |

So in this snapshot the **ProInfirmis accessibility integration has exactly one row of real data,
and it is on a test place**. This is consistent with `ACTIVATE_PROINFIRMIS=false` in
`/Users/itrulia/Documents/insitu-admin/docker-compose.yaml`. **UNVERIFIED:** whether the real BKA
production deployment has the flag on. The data cannot settle this — the schema and the single test
row prove the integration was built and exercised once, but not that it runs in production. What
would settle it: the production deployment's env (Kubernetes manifest / `.env.prod` / hosting
config), which is not present in this repo checkout.

### 4.4 Empty tables

| Table | Rows | Meaning |
|---|---:|---|
| `ticketing` | 0 | the structured per-provider ticketing feature (enum `App\Enum\TicketingDesignation` with 13 providers) has **never been used**. All ticketing data lives in `event.labels.ticketingUrl` (16,189 events) and `event.ticketing_url` (1,794 events). |
| `messenger_messages` | 0 | Symfony Messenger transport table, drained |
| `oauth2_authorization_code` | 0 | no authorization-code flow in use (all clients are `refresh_token` only) |
| `reset_password_request` | 0 | transient table, no pending resets |

### 4.5 Sparse but live columns (keep, but expect mostly-empty)

| Table.column | Filled | of | % |
|---|---:|---:|---:|
| `event.publication_date` | 176 | 34,279 | 0.5 % |
| `event.recurrence_week_days` (non-`[]`) | 756 | 34,279 | 2.2 % |
| `event.ticketing_url` | 1,794 | 34,279 | 5.2 % |
| `event.place_proposed_id` | 1,823 | 34,279 | 5.3 % |
| `event.opening_time` | 8,729 | 34,279 | 25.5 % |
| `event.proposed_by_id` | 4,288 | 34,279 | 12.5 % |
| `organization.post_office_box` | 8 | 741 | 1.1 % |
| `organization.legal_status` | 70 | 741 | 9.4 % |
| `organization.website` | 133 | 741 | 17.9 % |
| `place.website` | 105 | 1,276 | 8.2 % |
| `place.organization_id` | 571 | 1,276 | 44.7 % |

---

## 5. `event` — deep dive (34,279 rows)

### 5.1 `event_status` (column `varchar(50) NOT NULL`)

Code: `src/Entity/Event.php:48-51` defines exactly four values; all four occur.

| `event_status` | Rows | % | mainevent | subevent |
|---|---:|---:|---:|---:|
| `confirmed` | 33,831 | 98.69 % | 20,713 | 13,118 |
| `full` | 366 | 1.07 % | 326 | 40 |
| `canceled` | 65 | 0.19 % | 62 | 3 |
| `postponed` | 17 | 0.05 % | 15 | 2 |

### 5.2 `publication_status` (column `varchar(50) NOT NULL`)

Code: `src/Entity/Event.php:34-36`. All three values occur.

| `publication_status` | Rows | % | mainevent | subevent |
|---|---:|---:|---:|---:|
| `publish` | 34,076 | 99.41 % | 20,955 | 13,121 |
| `to_validate` | 109 | 0.32 % | 93 | 16 |
| `draft` | 94 | 0.27 % | 68 | 26 |

The editorial workflow is almost invisible in the data: 99.4 % of everything is published. Only 176
events (0.5 %) ever got a `publication_date`, and 172 of those are already `publish`:

| `publication_status` | with `publication_date` | total |
|---|---:|---:|
| `publish` | 172 | 34,076 |
| `draft` | 3 | 94 |
| `to_validate` | 1 | 109 |

`publication_date` range: `2023-11-29` → `2026-06-02`.

`to_validate` events by month of creation show a steady trickle of ~3–11/month, i.e. this is the
*public event-proposal* inbox, not a bulk editorial queue:

```
2023-11:1  2024-01:11 2024-02:1  2024-03:2  2024-04:2  2024-05:2  2024-06:1
2024-10:2  2024-11:3  2024-12:1  2025-01:5  2025-02:3  2025-03:3  2025-04:1
2025-05:3  2025-06:3  2025-07:8  2025-08:7  2025-09:5  2025-10:4  2025-11:4
2025-12:3  2026-01:11 2026-02:3  2026-03:5  2026-04:4  2026-05:11
```

90 of the 109 `to_validate` events have a `proposed_by_id` (an anonymous public submitter); 106 of
them have **no** organization at all.

### 5.3 `type` — main events vs sub events

`event` is a Doctrine single-table-inheritance hierarchy: discriminator column `type`, classes
`App\Entity\MainEvent` and `App\Entity\SubEvent`.

| `type` | Rows | % |
|---|---:|---:|
| `mainevent` | 21,116 | 61.6 % |
| `subevent` | 13,163 | 38.4 % |

Structural invariants, all verified clean:

| Check | Result |
|---|---:|
| sub-events with `mainevent_id IS NULL` | **0** |
| main events with `mainevent_id IS NOT NULL` | **0** |
| `mainevent_id` pointing at a row whose `type <> 'mainevent'` (no 2-level nesting) | **0** |
| `mainevent_id` pointing at a non-existent event | **0** |

Sub-events per main event:

| Sub-events | Main events | Sub-events covered |
|---|---:|---:|
| 0 | 17,831 | 0 |
| 1 | 1,389 | 1,389 |
| 2–5 | 1,285 | 3,817 |
| 6–10 | 380 | 2,969 |
| 11–25 | 188 | 2,984 |
| 26–50 | 34 | 1,118 |
| 51–100 | 6 | 407 |
| 100+ | 3 | 479 |
| **max** | | **200** |

So 3,285 of 21,116 main events (15.6 %) actually have children; the other 17,831 are standalone.

Sub-events are **not independently editable**: `src/EventListener/OnFlushEventListener.php:88-100`
copies `name`, `eventStatus`, `place`, `organization`, `description`, `specialRate` (and more) from
the main event onto every sub-event on every flush. The data agrees — all 13,163 sub-events have
`recurrence IS NULL` and 13,160 of 13,163 have `is_multi_day_event = true`.

### 5.4 `recurrence` and `recurrence_week_days`

Code: `src/Entity/Event.php:64-65` — only `none` and `week` exist.

| `recurrence` | Rows | mainevent | subevent |
|---|---:|---:|---:|
| `none` | 20,356 | 20,356 | 0 |
| `week` | 760 | 760 | 0 |
| *(NULL)* | 13,163 | 0 | 13,163 |

`recurrence_week_days` is a JSON array of ISO weekday numbers (1 = Monday … 7 = Sunday). 3,611 rows
have a non-NULL value, of which 2,855 are `[]`; **756 rows carry real weekday sets** (46 distinct
sets). Top sets:

| Week-day set | Rows |
|---|---:|
| `[]` | 2,855 |
| `[2,3,4,5,6,7]` | 108 |
| `[6,7]` | 73 |
| `[6]` | 72 |
| `[2,3,4,5,6]` | 56 |
| `[7]` | 55 |
| `[1,2,3,4,5,6,7]` | 51 |
| `[3,4,5,6,7]` | 34 |
| `[3]` | 34 |
| `[2,3,4,5]` | 34 |
| `[3,4,5]` | 30 |
| `[3,4,5,6]` | 27 |
| `[4,5]` | 24 |
| `[2]` | 22 |
| `[1]` | 17 |
| `[4]` | 16 |
| `[2,4,5,6,7]` | 13 |
| `[1,2,3,4,5]` | 12 |
| `[5]` | 11 |
| `[4,5,6]` | 10 |

(46 distinct sets in total; the remainder are singletons/near-singletons.)

### 5.5 `special_rate`

Code: `src/Entity/Event.php:76-77`. Both values occur; the column is NULL for the majority.

| `special_rate` | Rows | % |
|---|---:|---:|
| *(NULL)* | 26,176 | 76.4 % |
| `free_entry` | 5,103 | 14.9 % |
| `free_price` | 3,000 | 8.8 % |

### 5.6 `is_multi_day_event` and `show_in_print`

| `is_multi_day_event` | Rows | mainevent | subevent |
|---|---:|---:|---:|
| `true` | 17,784 | 4,624 | 13,160 |
| `false` | 16,495 | 16,492 | 3 |

`is_multi_day_event` does **not** mean "crosses midnight". Only 2,777 events have
`date_to::date > date_from::date`, while 17,784 are flagged; 15,908 flagged events start and end on
the same calendar day. The flag means *"this event is part of a multi-date group"*. Cross-tab for
main events:

| flagged | has sub-events | recurrence | spans days | Rows |
|---|---|---|---|---:|
| f | f | none | f | 15,545 |
| t | t | none | f | 3,202 |
| f | f | none | t | 924 |
| t | f | week | t | 737 |
| t | f | none | t | 602 |
| t | t | none | t | 83 |
| f | f | week | t | 12 |
| f | f | week | f | 11 |

(936 events span calendar days but are *not* flagged — see §10 inconsistencies.)

`show_in_print` (feature `HAS_PRINT_OPTIONS=true` for BKA):

| `show_in_print` | Rows | mainevent | subevent |
|---|---:|---:|---:|
| `true` | 21,987 | 14,094 | 7,893 |
| `false` | 11,958 | 6,733 | 5,225 |
| *(NULL)* | 334 | 289 | 45 |

`print_category_id` (FK → `category`, `ON DELETE SET NULL`) is filled on **21,981 / 34,279 (64.1 %)**
events, using 26 of the 30 categories. Distribution in §8.1.

### 5.7 Dates

| Metric | Value |
|---|---|
| `min(date_from)` | `0001-10-31 19:00:00+00` |
| `max(date_from)` | `2030-12-30 11:00:00+00` |
| `min(date_to)` | `0002-10-29 20:00:00+00` |
| `max(date_to)` | `2099-12-31 17:00:00+00` |
| `min(created_at)` | `2023-11-23 11:19:44+00` |
| `max(created_at)` | `2026-05-21 04:30:15+00` |
| `min(updated_at)` | `2024-05-14 09:22:41+00` |
| `max(updated_at)` | `2026-05-21 06:00:12+00` |

Events per calendar year of `date_from`:

| Year | Events |
|---|---:|
| 0001 | 1 |
| 0002 | 1 |
| 0004 | 15 |
| 0005 | 1 |
| 0024 | 30 |
| 0025 | 9 |
| 0204 | 6 |
| 0224 | 1 |
| 1954 | 1 |
| 2004 | 1 |
| 2014 | 5 |
| 2015 | 2 |
| 2017 | 2 |
| 2020 | 5 |
| 2021 | 2 |
| 2022 | 233 |
| 2023 | 287 |
| 2024 | **13,101** |
| 2025 | **12,420** |
| 2026 | **8,024** |
| 2027 | 119 |
| 2028 | 6 |
| 2030 | 7 |

Events per year of `created_at`: 2023 → 1,978; 2024 → 14,053; 2025 → 12,890; 2026 (to 21 May) →
5,358. The system went live in late November 2023.

**Date-quality problems** (these are real production rows, not test data):

| Problem | Rows |
|---|---:|
| `date_from < 2000-01-01` | 65 |
| `date_to < 2000-01-01` | 64 |
| `date_from > 2027-12-31` | 13 |
| `date_to > 2030-12-31` | 10 |
| `date_to < date_from` (inverted) | **282** |

These are typo years (`0024` for `2024`, `0204` for `2024`, `0004` for `2024`, …). Examples:

| id | type | name | `date_from` | `date_to` | status |
|---:|---|---|---|---|---|
| 14503 | mainevent | VOCABULAR | `0001-10-31 19:00` | `2024-11-02 20:30` | publish |
| 4385 | mainevent | Gilbert & Oleg: Illusion oder Wirklichkeit? | `0004-02-21 19:00` | `0004-02-21 21:00` | publish |
| 4354 | mainevent | Tina Teubner und Ulrich Michael Heissig | `0024-02-20 19:00` | `0024-02-20 21:00` | publish |
| 4912 | mainevent | aktzeichnen 3.0 | `0204-02-29 18:00` | `0204-02-29 22:00` | publish |
| 12355 | mainevent | Quintett um Fünf | `1954-09-21 16:00` | `1954-09-21 17:30` | publish |
| 27004 | mainevent | Wunderkammer - Die Schausammlung | `2020-12-14 08:00` | **`2099-12-31 17:00`** | publish |
| 3793 | mainevent | Von Höhenfeuern, Smartphones und Cyborgs | `2017-08-19 08:00` | **`2050-08-19 15:00`** | publish |
| 28688 | mainevent | Mensch, Erde! – Das Klima im Wandel | `2025-10-24 07:00` | **`2045-10-24 15:00`** | publish |

The far-future `date_to` values are what blow up `event_occurrence` (§6).

`opening_time` is a free `varchar(5)` "HH:MM" string, filled on 8,729 events, 113 distinct values.
Top: `19:00` (1,409), `18:30` (1,220), `20:00` (1,012), `19:30` (960), `18:00` (546), `17:00` (343),
`19:15` (287), `16:00` (269), `16:30` (230), `14:00` (196), `10:00` (195), `17:30` (179),
`23:00` (163), `18:45` (129), `20:30` (123), `21:00` (102), `15:00` (99), `18:59` (88),
`13:30` (87), `14:30` (77).

### 5.8 `related_dates` — the denormalised date cache that makes `event` 139 MB

`related_dates` is a JSON array of PHP `DateTime` serialisations:

```json
[{"date":"2024-11-22 19:30:00.000000","timezone_type":3,"timezone":"Europe\/Zurich"}]
```

It is recomputed on every flush by `src/EventListener/OnFlushEventListener.php:68-78`:

* `recurrence = 'week'` → `EventDatesCalculator::getRelatedRecurrenceDates()`, i.e. **one entry per
  matching weekday between `date_from` and `date_to`** (`src/Event/EventDatesCalculator.php:76-102`).
* otherwise → `getRelatedSingleDates()`, i.e. **the main event's `date_from` plus every sibling
  sub-event's `date_from`**, stored identically on the main event *and* on every sub-event
  (`src/Event/EventDatesCalculator.php:55-74`).

Array-length distribution:

| Entries | Events |
|---:|---:|
| 0 | 4 |
| 1 | 17,084 |
| 2 | 2,803 |
| 3 | 1,775 |
| 4 | 1,315 |
| 5 | 1,191 |
| 6 | 993 |
| 7 | 588 |
| 8 | 824 |
| 9 | 482 |
| 10 | 1,100 |
| 11 | 459 |
| 12 | 573 |
| 13 | 309 |
| 14 | 225 |
| 15 | 173 |
| 16 | 122 |
| 17 | 115 |
| 18 | 188 |
| 19 | 239 |
| … | … |
| **max** | **12,375** |

| Type | min | max | avg | total entries stored |
|---|---:|---:|---:|---:|
| `mainevent` | 0 | 12,375 | 5.60 | 118,198 |
| `subevent` | 1 | 201 | 18.90 | **248,755** |

366,953 date objects are stored across 34,279 rows — the same dates repeated once per group member.
Only 17,657 of 34,279 events have `len(related_dates) == count(event_occurrence)`; for the other
16,622 the two caches disagree because they are computed differently (per-group dates vs per-event
occurrences).

### 5.9 Translatable JSON (`event.labels`)

`event.labels` is a `text` column with `DC2Type:json`, shaped `{ <field>: { <locale>: <value> } }`.
BKA runs `LOCALES=fr|de`, `DEFAULT_LOCALE=de`.

Top-level keys present:

| Key | Rows carrying the key |
|---|---:|
| `description` | 34,279 (100 %) |
| `ticketingUrl` | 28,334 (82.7 %) |
| `printDescription` | 25,164 (73.4 %) |

Per-locale fill (`n` = rows that have that `<field>.<locale>` key at all; `null/empty` = rows where
its value is JSON `null` or `""`):

| Field | Locale | Rows with key | NULL/empty | **Real values** |
|---|---|---:|---:|---:|
| `description` | `de` | 34,279 | 4 | **34,275** |
| `description` | `fr` | 3,212 | 3,094 | **118** |
| `printDescription` | `de` | 25,164 | 6,876 | **18,288** |
| `printDescription` | `fr` | 3,114 | 3,022 | **92** |
| `ticketingUrl` | `de` | 28,334 | 12,145 | **16,189** |
| `ticketingUrl` | `fr` | 2,656 | 2,555 | **101** |

**BKA is de-only in practice.** French exists structurally on ~3,100–3,200 events but carries a real
value on 92–118 of them (0.3 %).

The same pattern in the other tables:

| Table | Field | `de` rows / real | `fr` rows / real |
|---|---|---|---|
| `rate` | `designation` | 12,697 / **12,694** | 1,232 / **39** |
| `image` | `legend` | 27,571 / **11,821** | 2,798 / **14** |
| `contact` | `designationEmail` | 90 / **43** | 4 / **0** |
| `contact` | `designationPhone` | 90 / **15** | 4 / **0** |
| `organization` | `about` | 587 / **587** | 18 / **0** |
| `organization` | `subTitle` | 587 / **59** | 18 / **0** |
| `place` | `about` | 1,018 / **1,018** | 48 / **0** |
| `place` | `capacity` | 1,018 / **34** | 48 / **0** |
| `technical_sheet` | `title` | 1 / **1** | — |

(`organization.labels` and `place.labels` are the literal array `[]` on 154 and 258 rows
respectively — see §7.1 and §7.2.)

### 5.10 The two parallel ticketing-URL stores

`event.ticketing_url` (the column) and `event.labels.ticketingUrl.de` (the JSON) are **disjoint
stores written by different code paths**:

| Where the URL lives | Events | earliest `created_at` | latest | of which have `user_id` |
|---|---:|---|---|---:|
| JSON only | 16,013 | 2023-11-23 | 2026-05-20 | 12,782 |
| column only | 1,618 | 2023-12-27 | 2026-05-20 | **0** |
| both | 176 | 2023-12-27 | 2026-04-15 | **0** |
| neither | 16,472 | 2023-11-23 | 2026-05-21 | 8,596 |

The admin forms bind to `labels[ticketingUrl]` (`src/Form/EventType.php:535-542`,
`src/Form/ProposeEventStep3Type.php:76-84`); the plain column is written only by API imports — every
single row with the column set has `user_id IS NULL`, i.e. was created by a machine account.

Top ticketing hosts (parsed from `event.ticketing_url`, 1,794 rows, 1,293 distinct URLs):

| Host | Events |
|---|---:|
| eventfrog.ch | 276 |
| ticketcorner.ch | 163 |
| stadttheater-langenthal.ch | 147 |
| kulturticket.ch | 126 |
| schlachthaus.ch | 124 |
| ticketino.com | 80 |
| gstaadmenuhinfestival.ch | 62 |
| petzi.ch | 49 |
| altesspital.ch | 38 |
| shop.e-guma.ch | 38 |
| daszelt.ch | 36 |
| nmbe.ch | 36 |
| buchhaus.ch | 28 |
| solothurn-city.ch | 27 |
| acousticnights.ch | 26 |
| gstaadmenuhinfestival.kulturticket.ch | 26 |
| burgaeschi.ch | 23 |
| shop.menuhin.ch | 23 |
| dominoevent.ch | 20 |
| 442hz.com | 16 |

### 5.11 Rich-text shape of `labels.description.de` — what the block-content port must absorb

| Measure | Events |
|---|---:|
| rows total | 34,279 |
| empty / NULL | 4 |
| contains `<p>` | 28,121 |
| contains HTML entities (`&…;`) | **28,685** |
| contains `<br` | 14,582 |
| contains `<strong>`/`<b>` | 7,207 |
| contains `<a ` | 3,426 |
| contains `<em>`/`<i>` | 135 |
| contains `<ul>`/`<ol>` | 59 |
| contains `<h1>`–`<h4>` | **1** |
| contains `<img` | **0** |
| contains `<table` | **0** |
| contains `<iframe` | **0** |
| contains `<blockquote` | **0** |
| max length | 8,665 chars |
| mean length | 1,021 chars |

The corpus is almost pure `<p>` + `<br>` + `<strong>` + `<a>`, aggressively HTML-entity-encoded
(`f&uuml;r`, `&laquo;`, `&ndash;`, `&nbsp;`). No embedded images, tables, iframes or quotes at all.

### 5.12 Attachments and relations — how many events use each feature

| Feature | Events | % of 34,279 |
|---|---:|---:|
| ≥ 1 `event_occurrence` | 34,275 | 99.99 % |
| ≥ 1 `event_category` | 34,272 | 99.98 % |
| `related_dates` non-empty | 34,275 | 99.99 % |
| `place_id` set | 31,717 | 92.5 % |
| `old_slug` set | 28,355 | 82.7 % |
| `organization_id` set | 27,949 | 81.5 % |
| `print_category_id` set | 21,981 | 64.1 % |
| `user_id` set (a human owner) | 21,378 | 62.4 % |
| ≥ 1 `image` | **19,505** | 56.9 % |
| `opening_time` set | 8,729 | 25.5 % |
| ≥ 1 `rate` | **6,000** | 17.5 % |
| `proposed_by_id` set | 4,288 | 12.5 % |
| ≥ 1 `video` | **1,906** | 5.6 % |
| `place_proposed_id` set | 1,823 | 5.3 % |
| `ticketing_url` column set | 1,794 | 5.2 % |
| `recurrence_week_days` non-`[]` | 756 | 2.2 % |
| `publication_date` set | 176 | 0.5 % |
| **≥ 1 `ticketing` row** | **0** | 0 % |
| **`technical_sheet`** (place-scoped, not event-scoped) | 1 row in the whole DB | — |
| `og_image` real value | **0** | 0 % |
| no place at all (`place_id` and `place_proposed_id` both NULL) | 787 | 2.3 % |

**Sub-events own nothing.** Attachments split perfectly by `type`:

| `type` | with ≥1 image | with ≥1 rate | with ≥1 video | with ≥1 category | total |
|---|---:|---:|---:|---:|---:|
| `mainevent` | **19,505** | **6,000** | **1,906** | 21,109 | 21,116 |
| `subevent` | **0** | **0** | **0** | 13,163 | 13,163 |

Every image, every rate and every video in the database hangs off a main event. Sub-events carry
only `event_category` links (which `OnFlushEventListener` also copies from the parent) and their own
`date_from`/`date_to`.

Ownership cross-tab:

| has org | has user | has proposer | has proposed place | Events |
|---|---|---|---|---:|
| ✓ | ✓ | ✗ | ✗ | 21,365 |
| ✓ | ✗ | ✗ | ✗ | 6,504 |
| ✗ | ✗ | ✓ | ✗ | 2,394 |
| ✗ | ✗ | ✗ | ✗ | 2,109 |
| ✗ | ✗ | ✓ | ✓ | 1,814 |
| ✓ | ✗ | ✓ | ✗ | 71 |
| ✗ | ✓ | ✗ | ✗ | 13 |
| ✓ | ✗ | ✓ | ✓ | 9 |

6,330 events have **no organization at all** (and no `archived_organization` either). 6,504 have an
organization but no user — these are the API/guidle imports.

### 5.13 Events per organization

541 of 741 organizations (73 %) own at least one event.

| Events owned | Organizations | Events covered |
|---|---:|---:|
| *(no organization)* | — | 6,330 |
| 1 | 78 | 78 |
| 2–5 | 113 | 339 |
| 6–10 | 69 | 525 |
| 11–25 | 101 | 1,672 |
| 26–50 | 61 | 2,248 |
| 51–100 | 52 | 3,809 |
| 101–250 | 40 | 6,524 |
| 251–500 | 20 | 7,048 |
| 500+ | 7 | 5,706 |

Top 25 organizations by event count:

| Org id | Name | Events |
|---:|---|---:|
| 156 | Kornhausbibliotheken | 1,143 |
| 90 | Quinnie Cinemas | 989 |
| 300 | Bühnen Bern | 965 |
| 138 | La Cappella | 718 |
| 111 | ONO | 641 |
| 127 | Mühle Hunziken Konzert AG | 640 |
| 399 | HKB Musik | 610 |
| 502 | Bierhübeli | 489 |
| 43 | TOBS! | 486 |
| 213 | Das Theater an der Effingerstrasse | 466 |
| 131 | Verein Mahogany Hall | 458 |
| 439 | Marians Jazzroom | 443 |
| 328 | Zentrum Paul Klee | 407 |
| 28 | Dampfzentrale Bern | 385 |
| 158 | Verein KartellCulturel | 363 |
| 32 | Kunstmuseum Bern | 348 |
| 448 | Internationales Jazzfestival Bern | 342 |
| 294 | Gstaad Menuhin Festival & Academy | 329 |
| 178 | ISC | 316 |
| 77 | Schlachthaus Theater | 303 |
| 150 | Kulturhof - Schloss Köniz | 297 |
| 116 | Naturhistorisches Museum Bern | 294 |
| 47 | Theater Matte | 292 |
| 16 | PROGR – Zentrum für Kulturproduktion | 264 |
| 1 | Format-Z | 259 |

### 5.14 Events per owning user (`event.user_id`)

282 distinct users have created events (of 427 total users). This is the population that
`LIST_OWN_EVENTS_ONLY=true` filters against.

| Events created | Users | Events covered |
|---|---:|---:|
| 1 | 20 | 20 |
| 2–5 | 42 | 119 |
| 6–10 | 38 | 300 |
| 11–25 | 55 | 926 |
| 26–50 | 44 | 1,586 |
| 51–100 | 29 | 2,099 |
| 101–500 | 45 | 9,385 |
| 500+ | 9 | 6,943 |

Top creators:

| Email | Events |
|---|---:|
| sekretariat1@venue-example.org | 1,151 |
| kasse1@venue-example.org | 925 |
| info5@venue-example.org | 898 |
| info3@venue-example.org | 820 |
| info2@venue-example.org | 690 |
| team1@venue-example.org | 640 |
| info4@venue-example.org | 637 |
| musik1@venue-example.org | 610 |
| marketing1@venue-example.org | 572 |
| person13@example.org | 489 |
| pr1@venue-example.org | 486 |
| person01@example.org | 443 |
| konzerte1@venue-example.org | 388 |
| presse1@venue-example.org | 371 |
| person02@example.org | 336 |

### 5.15 Events per place

941 distinct `place_id` values are referenced; 335 of 1,276 places (26 %) are never used by any
event.

| Events at the place | Places | Events covered |
|---|---:|---:|
| 1 | 194 | 194 |
| 2–5 | 253 | 756 |
| 6–10 | 137 | 1,055 |
| 11–25 | 115 | 1,870 |
| 26–50 | 90 | 3,288 |
| 51–100 | 71 | 5,276 |
| 101–500 | 76 | 15,934 |
| 500+ | 5 | 3,344 |

| Place | Events |
|---|---:|
| La Cappella | 717 |
| Marians Jazzroom | 700 |
| ONO Das Kulturlokal | 673 |
| Mühle Hunziken | 640 |
| cineMovie | 614 |
| VIDMARHALLEN | 485 |
| Mahogany Hall | 482 |
| Bierhübeli | 467 |
| Das Theater an der Effingerstrasse | 466 |
| Creaviva im Zentrum Paul Klee | 451 |
| Kornhausbibliothek | 440 |
| Dampfzentrale Bern | 439 |

### 5.16 `archived_organization` / `archived_place`

Both are plain `varchar(255)` snapshots of the related entity's name. In this snapshot they are
**never used for their apparent purpose** (surviving a deleted org/place):

| Check | Rows |
|---|---:|
| `archived_organization` set while `organization_id IS NULL` | **0** |
| `archived_place` set while `place_id IS NULL` | **0** |
| `archived_organization` differs from the live `organization.name` | **0** |
| `archived_place` differs from the live `place.name` | **0** |

`archived_organization` is non-null on exactly the 27,949 events that have an `organization_id`;
`archived_place` on exactly the 31,717 that have a `place_id`. They are pure denormalised sort/search
columns today.

### 5.17 Slugs

| Check | Result |
|---|---|
| `slug` NULL | 1 row (id 18248, name `.`, `to_validate`) |
| `slug` duplicates | 0 (unique index `idx_252807_uniq_3bae0aa7989d9b62`) |
| `old_slug` set | 28,355 |
| `old_slug` duplicates | 0 |
| `slug = old_slug` | 28,333 of 28,355 (99.92 %) |

So `old_slug` is effectively a redirect column that almost never differs — only 22 events actually
changed slug.

### 5.18 Duplicate event names

16,499 distinct names across 34,279 events. The heaviest repeats are recurring programmes:

| Name | Events |
|---|---:|
| Best of Musical | 201 |
| Ein Unikat in Serie – 75 Jahre Edition VFO, Zürich | 141 |
| Weltacker-Schule - Modul auf dem Weltacker Attiswil | 140 |
| 69. Gstaad Menuhin Festival & Academy | 102 |
| 68. Gstaad Menuhin Festival & Academy | 102 |
| videokunst.ch x 13. Norient Festival 2024 | 90 |
| Offenes Atelier «Fremdes verbinden» | 87 |
| Offenes Atelier «Vorhang auf!» | 80 |
| Circus Knie | 77 |
| Offenes Atelier «Kleiner Kosmos» | 70 |

---

## 6. `event_occurrence` — deep dive (118,021 rows)

### 6.1 Shape

```
                                Table "public.event_occurrence"
   Column   |           Type           | Nullable |                 Default
------------+--------------------------+----------+------------------------------------------
 id         | bigint                   | not null | nextval('event_occurrence_id_seq')
 event_id   | bigint                   | not null |
 date_from  | timestamp with time zone | not null |
 date_to    | timestamp with time zone | not null |
Indexes:
 idx_252833_primary              PRIMARY KEY (id)
 idx_252833_datefrom_idx         btree (date_from)
 idx_252833_dateto_idx           btree (date_to)
 idx_252833_idx_e61358dc71f7e88b btree (event_id)
FK: event_id -> event(id) ON DELETE CASCADE
```

Four columns, no status, no place, no name — an occurrence is purely a materialised
`(event, from, to)` triple. It is rebuilt on every flush by
`src/EventListener/OnFlushEventListener.php` (`updateOccurrences`) and can be rebuilt in bulk by
`src/Command/EventsCalculateOccurrencesCommand.php`.

### 6.2 Occurrences per event

34,275 of 34,279 events have at least one occurrence (4 have none — see §10).

| Occurrences | Events | Occurrences covered |
|---|---:|---:|
| 1 | **33,534** | 33,534 |
| 2–5 | 172 | 695 |
| 6–10 | 121 | 940 |
| 11–25 | 161 | 2,849 |
| 26–50 | 119 | 4,028 |
| 51–100 | 85 | 6,233 |
| 101–500 | 63 | 12,263 |
| **500+** | **20** | **57,479** |

| Statistic | Value |
|---|---:|
| min | 1 |
| median | 1 |
| mean | 3.44 |
| p95 | 1 |
| p99 | 20 |
| **max** | **12,374** |

**20 events (0.06 %) account for 57,479 occurrences (48.7 % of the table.)** Exact per-count tail
for 1–40:

```
1:33534  2:20  3:36  4:33  5:83  6:27  7:21  8:42  9:15  10:16
11:10  12:18  13:14  14:10  15:9  16:11  17:13  18:9  19:10  20:8
21:3  22:10  23:6  24:14  25:16  26:23  27:16  28:5  29:1  30:6
31:2  32:7  33:4  34:3  35:7  36:7  37:1  38:7  39:4  40:2
```

The 15 worst offenders — all `recurrence = 'week'` exhibitions with runaway `date_to`:

| event_id | Occurrences | Name | `date_from` | `date_to` |
|---:|---:|---|---|---|
| 27002 | **12,374** | Wunderkammer - Die Schausammlung | 2020-12-14 | **2099-12-31** |
| 3793 | **10,332** | Von Höhenfeuern, Smartphones und Cyborgs | 2017-08-19 | 2050-08-19 |
| 27005 | 8,248 | Wunderkammer - Die Schausammlung | 2020-12-14 | 2099-12-31 |
| 27000 | 4,125 | Wunderkammer - Die Schausammlung | 2020-12-14 | 2099-12-31 |
| 27004 | 4,125 | Wunderkammer - Die Schausammlung | 2020-12-14 | 2099-12-31 |
| 3881 | 3,656 | Wunderkammer - Die Schausammlung | 2020-01-01 | 2030-01-03 |
| 2559 | 2,600 | «C'est le vent qui fait la musique» | 2017-01-17 | 2027-01-03 |
| 21248 | 1,805 | Goldrichtig - Ist Goldrecycling die Zukunft? | 2025-04-04 | 2030-03-13 |
| 28689 | 1,044 | Mensch, Erde! – Das Klima im Wandel | 2025-10-24 | 2045-10-24 |
| 28686 | 1,044 | Mensch, Erde! – Das Klima im Wandel | 2025-10-24 | 2045-10-24 |
| 28685 | 1,044 | Mensch, Erde! – Das Klima im Wandel | 2025-10-24 | 2045-10-24 |
| 28688 | 1,043 | Mensch, Erde! – Das Klima im Wandel | 2025-10-24 | 2045-10-24 |
| 28687 | 1,043 | Mensch, Erde! – Das Klima im Wandel | 2025-10-24 | 2045-10-24 |
| 33351 | 1,015 | Schloss Aarwangen | 2026-02-11 | 2029-12-31 |
| 2306 | 931 | Freiheit! | 2023-06-16 | 2026-01-01 |

Note the duplicated events: "Wunderkammer - Die Schausammlung" exists five times (ids 3881, 27000,
27002, 27004, 27005) and "Mensch, Erde!" five times (28685–28689), each with its own full expansion.

### 6.3 Occurrence shape

| Measure | Rows | % |
|---|---:|---:|
| `date_to` on the same calendar day as `date_from` | 115,820 | 98.1 % |
| `date_to` on a later calendar day | 2,079 | 1.8 % |
| `date_to < date_from` (inverted) | **282** | 0.24 % |

Start-hour distribution (UTC as stored; CH local = +1/+2):

| Hour (UTC) | Occurrences |
|---:|---:|
| 0 | 2 |
| 2 | 2 |
| 4 | 46 |
| 5 | 369 |
| 6 | 274 |
| 7 | 15,372 |
| 8 | **33,937** |
| 9 | 17,905 |
| 10 | 2,356 |
| 11 | 2,761 |
| 12 | 10,387 |
| 13 | 7,271 |
| 14 | 1,539 |
| 15 | 2,289 |
| 16 | 3,399 |
| 17 | 4,510 |
| 18 | 7,924 |
| 19 | 5,413 |
| 20 | 997 |
| 21 | 511 |
| 22 | 645 |
| 23 | 112 |

### 6.4 How far into the future occurrences extend

| Window (relative to 2026-10-17) | Occurrences |
|---|---:|
| in the past | 72,772 (61.7 %) |
| in the future | 45,249 (38.3 %) |
| **more than 1 year in the future** | **40,742 (34.5 %)** |

Occurrences by year of `date_from` — note the flat ~365/year tail running all the way to **2099**:

| Year | Occurrences | | Year | Occurrences |
|---|---:|---|---|---:|
| 0001–0224 (typos) | 117 | | 2046 | 677 |
| 1954 | 1 | | 2047 | 678 |
| 2004 | 1 | | 2048 | 680 |
| 2014 | 5 | | 2049 | 678 |
| 2015 | 2 | | 2050 | 563 |
| 2017 | 366 | | 2051 | 365 |
| 2018 | 572 | | 2052 | 366 |
| 2019 | 573 | | 2053–2059 | 365 each |
| 2020 | 960 | | 2060 | 366 |
| 2021 | 1,357 | | 2061–2063 | 365 each |
| 2022 | 1,741 | | 2064 | 366 |
| 2023 | 2,865 | | 2065–2067 | 365 each |
| **2024** | **24,965** | | 2068 | 366 |
| **2025** | **23,758** | | 2069–2071 | 365 each |
| **2026** | **17,240** | | 2072 | 366 |
| 2027 | 3,263 | | 2073–2075 | 365 each |
| 2028 | 2,071 | | 2076 | 366 |
| 2029 | 1,928 | | 2077–2079 | 365 each |
| 2030 | 1,021 | | 2080 | 366 |
| 2031 | 939 | | 2081–2083 | 365 each |
| 2032 | 942 | | 2084 | 366 |
| 2033–2035 | 938 each | | 2085–2087 | 365 each |
| 2036 | 942 | | 2088 | 366 |
| 2037–2039 | 939 each | | 2089–2091 | 365 each |
| 2040 | 940 | | 2092 | 366 |
| 2041–2043 | 939 each | | 2093–2095 | 365 each |
| 2044 | 941 | | 2096 | 366 |
| 2045 | 890 | | 2097–2099 | 365 each |

Range: `min(date_from) = 0001-10-31 19:00+00`, `max(date_from) = 2099-12-31 08:00+00`,
`max(date_to) = 2099-12-31 16:00+00`.

**Practical read:** of 118,021 occurrence rows, the ones that correspond to real editorial content
are the ~70,000 between 2023 and 2027. Everything from 2030 onward (≈ 42,000 rows) is the weekly
expansion of five mis-dated permanent exhibitions.

---

## 7. `user`, `organization`, `place`

### 7.1 `user` (427 rows)

| `roles` (raw JSON) | Users |
|---|---:|
| `["ROLE_USER"]` | 397 |
| `["ROLE_USER","ROLE_ADMIN"]` | 28 |
| `["ROLE_ADMIN","ROLE_USER"]` | 2 |

Only two roles exist in the data: `ROLE_USER` (427, all of them) and `ROLE_ADMIN` (**30**). The array
order is not normalised, so a port must parse the JSON set, not compare strings.

| Column | Distribution |
|---|---|
| `enabled` | `true` 414 / `false` 13 |
| `member` (feature `ACTIVATE_MEMBERS=true`) | `true` **269** / `false` 158 |
| `locale` | `de` **427** (100 %) — no `fr` user exists |
| `last_login` | set on **321**, NULL on 106 |
| `config` | NULL on 302, `{"org_creation":"needed"}` on 103, `{"org_creation":"done"}` on 21, `{"org_creation":"ignored"}` on 1 |

`created_at` range `2022-11-24 12:21:37` → `2026-05-20 08:26:27`.
`last_login` range `2023-11-24 13:21:20` → `2026-10-17 16:00:00` (the last value is the local admin
login during this research session).

Last-login by year:

| Year | Users |
|---|---:|
| 2023 | 11 |
| 2024 | 54 |
| 2025 | 58 |
| 2026 | 198 |
| *(never)* | 106 |

`user_organization` (507 rows) — users may belong to several organizations:

| Organizations per user | Users |
|---:|---:|
| 1 | 325 |
| 2 | 79 |
| 3 | 8 |
| *(none)* | **15** |

| Users per organization | Organizations |
|---:|---:|
| 1 | 396 |
| 2 | 39 |
| 3 | 7 |
| 4 | 3 |
| *(none)* | **296** |

### 7.2 `organization` (741 rows)

| Column | Distribution |
|---|---|
| `enabled` | `true` 585 / `false` 156 |
| `region_id` | 6 of 13 regions used (see below) |
| `latitude`/`longitude` | set on 587, NULL on 154 |
| `slug` | 741 unique, no duplicates |
| `old_slug` | set on 698, no duplicates |
| `post_office_box` | 8 rows: `21`, `263`, `5053`, `Postfach` ×4, `Postfach 165` |

`legal_status` — the entity defines 10 values (`src/Entity/Organization.php:26-35`); 6 occur:

| `legal_status` | Orgs |
|---|---:|
| *(NULL)* | 671 |
| `association` | 50 |
| `fondation` | 8 |
| `societe_responsabilite_limitee` | 6 |
| `societe_anonyme` | 4 |
| `collectif` | 1 |
| `entreprise_individuelle` | 1 |
| `societe_simple` | 0 |
| `societe_collectif` | 0 |
| `societe_commandite` | 0 |
| `societe_cooperative` | 0 |

Organizations per region:

| Region id | Label (de) | hidden | Orgs |
|---:|---|---|---:|
| 10 | Stadt Bern | f | **383** |
| 15 | Restlicher Kanton | f | 249 |
| 11 | Region Bern | f | 58 |
| 13 | Thun & Berner Oberland | f | 23 |
| 5 | Saane | **t** | 15 |
| 14 | Biel & Seeland | f | 13 |
| 1,2,3,4,7,8,9 | (In Situ / Fribourg regions) | t | 0 |

The 15 orgs still parked in the hidden `Saane` region are leftovers from the In Situ seed.

Top cities: Bern 370, Zürich 24, Solothurn 19, Köniz 16, Thun 15, Biel 14, Basel 12, Burgdorf 9,
Fribourg 8, Luzern 6, Interlaken 6, St. Gallen 5, Dornach 5, Langenthal 5, Muri bei Bern 5.

**154 placeholder organizations.** Exactly 154 organizations have `labels = '[]'` **and**
`address = ''` — the same 154 rows (the cross-tab is perfectly diagonal). They are auto-created
one-per-user stubs:

| id | name | slug | zip | city | enabled | created_at |
|---:|---|---|---|---|---|---|
| 3 | Organisationen von person12@example.org | organisme-de-roger-ziegler-dampfzentrale-ch | 3001 | Bern | f | 2023-11-09 14:39:00 |
| 5 | Organisationen von person10@example.org | organisme-de-myrtha-bo-gmail-com | 3001 | Bern | f | 2023-11-09 14:39:35 |
| 6 | Organisationen von person07@example.org | organisme-de-mar-amrein-gmx-ch | 3001 | Bern | f | 2023-11-09 14:39:50 |
| … | (151 more, same shape) | | | | | |

All are `enabled = false`, zip `3001`, city `Bern`, and the French-flavoured slug prefix
`organisme-de-` betrays the In Situ origin of the importer. They are also exactly the 154
organizations with **no** `organization_category` row.

### 7.3 `place` (1,276 rows)

| Column | Distribution |
|---|---|
| `enabled` | `true` 1,013 / `false` 263 |
| `private` | `false` 1,021 / `true` 255 |
| `latitude`/`longitude` | set on 1,181, NULL on 95 |
| `organization_id` | set on 571 (436 distinct orgs), NULL on 705 |
| `slug` / `old_slug` | 1,276 / 1,189, both duplicate-free |

Wheelchair accessibility (three booleans, `NOT NULL`):

| accessible | toilets | parking | Places |
|---|---|---|---:|
| f | f | f | **1,212** |
| t | t | t | 21 |
| t | f | f | 19 |
| t | t | f | 19 |
| f | t | t | 3 |
| f | t | f | 1 |
| f | f | t | 1 |

Only 64 of 1,276 places (5 %) have any accessibility flag set.

ProInfirmis: see §4.3 — a single real row (place id 1, `Format-z test Ort`,
`pro_infirmis_id_source = '265'`, `pro_infirmis_detail_url = https://zuerst.proinfirmis.ch/pois/detail/16672`,
three pictograms: "Eingeschränkt rollstuhlgängig", "WC eingeschränkt rollstuhlgängig",
"Parkplatz eingeschränkt rollstuhlgängig"). The pictogram JSON shape is:

```json
[{"Id":8,"Name":"Eingeschränkt rollstuhlgängig","NameFr":"…","NameIt":"…","NameEn":"…",
  "LinkToPictogram":"https://zuerst.proinfirmis.ch/Pictograms/08_eingeschraenkt_zugaenglich.jpg",
  "LinkToPictogramSvg":"https://zuerst.proinfirmis.ch/Pictograms/svg/08_eingeschraenkt_zugaenglich.svg",
  "PictogramFileName":"08_eingeschraenkt_zugaenglich.jpg"}, …]
```

Places per region:

| Region id | Label (de) | hidden | Places |
|---:|---|---|---:|
| 10 | Stadt Bern | f | **613** |
| 15 | Restlicher Kanton | f | 321 |
| 11 | Region Bern | f | 185 |
| 13 | Thun & Berner Oberland | f | 95 |
| 14 | Biel & Seeland | f | 47 |
| 5 | Saane | **t** | 15 |
| others | — | t | 0 |

Top cities: Bern 625, Thun 50, Solothurn 44, Biel 38, Köniz 33, Fribourg 26, Burgdorf 14,
Interlaken 12, Olten 11, Spiez 10, Diemtigen 10, Murten 10, Münsingen 10, Langenthal 9, Dornach 8.

**258 placeholder places**, mirroring the organization stubs exactly (same diagonal cross-tab of
`labels = '[]'` and `address = ''`): all `enabled = false`, 241 of them `private = true`, zip 3001,
city Bern, slug prefix `lieu-de-`, each linked to its matching placeholder organization. 127 are
literally named `Ort von <email>`; the rest were renamed by their owner but never completed. Only
**3** of the 258 are referenced by any event.

| id | name | slug | zip | city | enabled | private | org_id |
|---:|---|---|---|---|---|---|---:|
| 3 | Ort von roger-ziegler@dampfzentrale-ch | lieu-de-roger-ziegler-dampfzentrale-ch | 3001 | Bern | f | t | 3 |
| 5 | Ort von person10@example.org | lieu-de-myrtha-bo-gmail-com | 3001 | Bern | f | t | 5 |
| 11 | Orchestra Arte Frizzante | lieu-de-marketing-artefrizzante-ch | 3001 | Bern | f | t | 11 |
| … | (255 more) | | | | | | |

### 7.4 `place_proposed` (1,823 rows)

Free-text places entered by public submitters; no region, no accessibility, no slug.

| Column | Non-null | Distinct |
|---|---:|---:|
| `event_id` | 1,158 | 1,158 |
| `name` | 1,823 | 975 |
| `address` | 1,823 | 748 |
| `zip` | 1,823 | 160 |
| `city` | 1,823 | 143 |
| `latitude` | 1,823 | 935 |
| `longitude` | 1,823 | 937 |

Every row is geocoded (no NULL and no zero coordinates). Top cities: Bern 955, Biel 106, Thun 65,
Ostermundigen 44, Köniz 41, Kehrsatz 25, Langenthal 22, Bolligen 22, Meikirch 22, Rubigen 22,
Münsingen 21, Burgdorf 18, Muri bei Bern 17, Steffisburg 16, Worb 15.

All 1,823 rows are referenced by exactly one event via `event.place_proposed_id`, but the back
reference `place_proposed.event_id` is only filled on 1,158 of them (§10).

### 7.5 `event_proposed_by` (4,366 rows)

The public submitter identity attached to a proposed event. No `user_id` — it is pure contact data.

| Column | Distinct |
|---|---:|
| `firstname` | 1,045 |
| `lastname` | 1,313 |
| `email` | 1,568 |
| `phone` | 1,488 (0 empty strings) |
| `organization` (free text) | 1,668 (0 empty strings) |

Created per year: 2023 → 1; 2024 → 1,975; 2025 → 1,709; 2026 (to May) → 681. A new row is written
per submission, so the same person appears many times.

Top free-text organizations: Creaviva 134, Explora Events 99, Gaskessel Bern 88,
Collegium generale Universität Bern 79, Casino Theater Burgdorf AG 77, Verein Kulturfest Köniz 61,
Volkshochschule Bern 52, Stiftung Schloss Oberhofen 46, Tour de Lorraine 43,
Casino Theater Burgdorf 42, Buskers Bern 37, Kornhausforum 36, www.risha.ch 36, Multimondo 35,
videokunst.ch 28.

Top submitter emails: person14@example.org 157, person08@example.org 92,
info7@venue-example.org 78, person11@example.org 68, info1@venue-example.org 67,
kontakt1@venue-example.org 61, person03@example.org 52, person16@example.org 47, info6@venue-example.org 42,
person04@example.org 41.

78 of 4,366 rows are no longer referenced by any event.

### 7.6 `contact` (90 rows)

Organization contact blocks. 77 of 741 organizations (10.4 %) have one.

| Contacts per org | Orgs |
|---:|---:|
| 1 | 65 |
| 2 | 11 |
| 3 | 1 |

| Column | Non-null | Distinct |
|---|---:|---:|
| `email` | 90 | 89 |
| `phone_number` | 54 | 54 |
| `designation_email` | **0** | — |
| `designation_phone` | **0** | — |
| `labels` | 90 | 49 |

`labels.designationEmail.de` is a free-text label (43 real values, 47 empty): `Büro` ×3, then 40
one-off values (`Orchesterbüro`, `Theaterleitung`, `Kundendienst`, `Co-Präsidium`, …).
`labels.designationPhone.de`: 15 real values (`Büro` ×3, `Sekretariat`, `Kartenverkauf`,
`Reservationen`, `Medienstelle`, …), 75 empty.

### 7.7 `image` (27,571 rows)

| Owner | Images |
|---|---:|
| event (`event_id`) | 27,107 (19,505 distinct events) |
| organization | 163 (82 distinct orgs) |
| place | 102 (42 distinct places) |
| **none of the three** | **199** |

Images per event:

| Images | Events |
|---:|---:|
| 1 | 16,251 |
| 2 | 1,568 |
| 3 | 850 |
| 4 | 369 |
| 5 | 217 |
| 6 | 70 |
| 7 | 41 |
| 8 | 30 |
| 9 | 10 |
| 10 | 14 |
| 11 | 26 |
| 13 | 3 |
| 14 | 14 |
| 15 | 2 |
| 16 | 17 |
| 20 | 2 |
| 25 | 5 |
| 26 | 2 |
| 28 | 14 |

`position` (0-based ordering within its owner) runs 0…27; 19,828 images are at position 0.

File types: `jpg` 23,172, `png` 3,578, `jpeg` 820, `jfif` 1. File names are VichUploader
`uniqid`-style: 22 lowercase hex chars + extension, e.g. `6a0e8a56ab4f2733879795.png`. 27,205 match
`^[0-9a-f]{22}\.[a-z]+$` exactly; the other 366 differ only by an uppercase extension (`.PNG`,
`.JPG`). `legend` the column is 100 % NULL; the real caption lives in `labels.legend.de`
(11,821 real values of 27,571).

### 7.8 `rate` (12,697 rows on 6,000 events)

| Rates per event | Events |
|---:|---:|
| 1 | 2,137 |
| 2 | 2,134 |
| 3 | 1,100 |
| 4 | 350 |
| 5 | 183 |
| 6 | 56 |
| 7 | 11 |
| 8 | 17 |
| 9 | 2 |
| 10 | 7 |
| 13 | 2 |
| 14 | 1 |

`price` is a `varchar(255)` holding **integer cents** (230 distinct values, 12,695 of 12,697 match
`^[0-9]+$`, range 0 … 80,000 i.e. CHF 0 … CHF 800). Two rows hold `-500`.

| `price` | Rates | | `price` | Rates |
|---|---:|---|---|---:|
| 2000 | 1,701 | | 4500 | 268 |
| 2500 | 1,391 | | 2300 | 206 |
| 3000 | 1,296 | | 1800 | 178 |
| 1500 | 1,025 | | 3200 | 169 |
| 1000 | 684 | | 1700 | 147 |
| 3500 | 599 | | 5500 | 144 |
| 4000 | 479 | | 6000 | 132 |
| 0 | 411 | | 1200 | 128 |
| 1600 | 360 | | 3300 | 126 |
| 2800 | 317 | | 3800 | 125 |
| 5000 | 302 | | 900 | 124 |
| 500 | 280 | | 600 | 114 |
| | | | 2700 | 79 |

`labels.designation.de` (1,915 distinct strings, free text — **not** an enum):

| Designation | Rates |
|---|---:|
| Abendkasse | 1,150 |
| Vorverkauf | 876 |
| Erwachsene | 645 |
| Regulär | 289 |
| Vollpreis | 285 |
| reduziert | 284 |
| Normalpreis | 267 |
| Reduziert | 264 |
| Normal | 237 |
| Ermässigt | 219 |
| Kinder | 168 |
| ermässigt | 166 |
| Liebhaber*innenpreis | 160 |
| Eintritt | 156 |
| Kleiner Preis | 149 |
| normal | 148 |
| Kulturlegi | 145 |
| Regulärer Eintritt | 140 |
| kleiner Preis | 131 |
| Normaler Preis | 129 |
| Soli | 118 |
| Solidarisch | 105 |
| U18 | 90 |
| Jugendliche bis 16 Jahre | 79 |
| Vorverkauf, Abendkasse | 72 |

(The casing variants are separate rows — no normalisation anywhere.)

### 7.9 `video` (2,025 rows, feature `ACTIVATE_EVENT_VIDEOS=true`)

| Videos per event | Events |
|---:|---:|
| 1 | 1,813 |
| 2 | 80 |
| 3 | 9 |
| 4 | 3 |
| 7 | 1 |

6 rows have `event_id IS NULL`. 1,451 distinct `embed_link` values.

| Host | Videos |
|---|---:|
| YouTube (`youtu…`) | 1,855 |
| Vimeo | 140 |
| other | 30 |

Links are stored raw, in whatever form the user pasted — `https://youtu.be/<id>`,
`https://www.youtube.com/watch?v=<id>`, and some with full tracking query strings
(`…&embeds_widget_referrer=…&source_ve_path=…`). No normalisation.

### 7.10 `technical_sheet` (1 row)

```
 id | place_id | title |                       file_name                        |       created_at       |  labels
----+----------+-------+--------------------------------------------------------+------------------------+-----------------------------------
  1 |      197 |       | 65ad4ce50d49b_2024 01 21 Anreiseplan Öffnungszeiten…pdf| 2024-01-21 17:57:09+00 | {"title":{"de":"Anreiseplan und Öffnungszeiten"}}
```

Attached to a **place**, not an event. File naming differs from `image`: 13 hex chars + `_` + the
original (space-containing) filename.

---

## 8. Reference / lookup tables — FULL contents (these must be seeded)

All four lookup tables store their display name in a `text` column named `label` carrying
`DC2Type:json` with the shape `{"fr": "...", "de": "..."}`. BKA's `DEFAULT_LOCALE=de`.

### 8.1 `category` — all 30 rows

Two-level taxonomy (`parent_id` → `category.id`), each with a hex `tag_color` and a `hidden` flag.
Used for both `event_category` (many-to-many) and `event.print_category_id` (single FK) and
`organization_category` (many-to-many).

| id | parent | label (de) | label (fr) | tag_color | hidden | events (`event_category`) | print events | orgs |
|---:|---:|---|---|---|---|---:|---:|---:|
| 1 | — | Musik | Musique | `#AFD3AA` | f | 7,098 | 4,803 | 117 |
| 2 | 1 | Konzert | Concert | `#AB9200` | **t** | 25 | 17 | 0 |
| 3 | 1 | Clubbing | Clubbing | `#E53429` | f | 1,338 | 278 | 12 |
| 4 | 1 | Tonübertragung | Diffusion sonore | `#1961AC` | **t** | 0 | 0 | 0 |
| 5 | — | Kunst | Art | `#AB9200` | f | 4,280 | 2,480 | 57 |
| 6 | 5 | Visuelle Künste | Arts visuels | `#E53429` | **t** | 0 | 0 | 0 |
| 7 | 5 | Design | Design | `#1961AC` | **t** | 0 | 0 | 0 |
| 8 | — | Bühne | Scène | `#E53429` | f | 3,281 | 2,249 | 58 |
| 9 | 8 | Theater | Théâtre | `#1961AC` | f | 4,719 | 1,644 | 25 |
| 10 | 8 | Tanz | Danse | `#2BAC6C` | f | 1,220 | 407 | 7 |
| 11 | 8 | Oper | Opéra | `#F29EB7` | f | 560 | 285 | 3 |
| 12 | 8 | Performance | Performance | `#2A4033` | f | 1,241 | 185 | 10 |
| 13 | 8 | Zirkus | Cirque | `#A9C5E8` | **t** | 0 | 0 | 0 |
| 14 | — | Film | Film | `#1961AC` | f | 2,066 | 1,433 | 12 |
| 15 | — | Literatur | Littérature | `#2BAC6C` | f | 1,894 | 1,000 | 28 |
| 16 | — | Ausstellungen & Kulturerbe | Patrimoine | `#F29EB7` | f | 2,794 | 653 | 46 |
| 17 | — | Begegnungen | Réunion & médiation | `#2A4033` | f | 1,997 | 652 | 43 |
| 18 | 17 | Im Gespräch | En conversation | `#A9C5E8` | f | 1,926 | 462 | 4 |
| 19 | 17 | Konferenz | Conférence | `#AFD3AA` | f | 119 | 13 | 2 |
| 20 | 17 | Workshop | Atelier | `#AB9200` | f | 1,235 | 212 | 0 |
| 21 | 17 | Konvention | Convention | `#E53429` | f | 129 | 3 | 1 |
| 22 | 17 | Führung | Visite guidée | `#1961AC` | f | 2,435 | 769 | 12 |
| 23 | — | Diverses | Divers | `#2BAC6C` | f | 4,508 | 918 | 287 |
| 24 | 1 | Klassik | Classique | `#2BAC6C` | f | 3,948 | 1,462 | 93 |
| 25 | 1 | Jazz/Blues | Jazz | `#F29EB7` | f | 2,558 | 1,225 | 13 |
| 26 | 1 | Pop/Rock | Pop/Rock | `#2A4033` | f | 1,804 | 161 | 8 |
| 27 | 1 | Experimental | Expérimental | `#A9C5E8` | f | 944 | 95 | 14 |
| 28 | 8 | Kleintheater | Petit théâtre | `#AFD3AA` | f | 1,645 | 461 | 0 |
| 29 | 8 | Spoken Word | Poésie parlée | `#AB9200` | f | 662 | 76 | 3 |
| 30 | 8 | Artistik | Art du spectacle | `#F29EB7` | f | 425 | 38 | 2 |

Timestamps: ids 1–22 `created_at = updated_at = 2022-06-21 12:00:00+00`; ids 23–30
`2022-10-17 12:00:00+00`.

Five categories are `hidden = true`: 2 (Konzert), 4 (Tonübertragung), 6 (Visuelle Künste),
7 (Design), 13 (Zirkus). Only `Konzert` still has 25 legacy event links; the other four are
completely unused.

Only 8 distinct `tag_color` values exist, cycled across the 30 rows:
`#1961AC` ×5, `#F29EB7` ×4, `#AB9200` ×4, `#E53429` ×4, `#2BAC6C` ×4, `#A9C5E8` ×3, `#AFD3AA` ×3,
`#2A4033` ×3.

Categories per event:

| Categories | Events |
|---:|---:|
| 1 | 18,999 |
| 2 | 10,021 |
| 3 | 5,230 |
| 4 | 6 |
| 6 | 16 |
| 0 | 7 |

Categories per organization:

| Categories | Orgs |
|---:|---:|
| 1 | 404 |
| 2 | 96 |
| 3 | 87 |
| 0 | **154** (exactly the 154 placeholder orgs — the cross-tab is perfectly diagonal) |

### 8.2 `audience` — all 4 rows

| id | label (de) | label (fr) | created_at | updated_at | events |
|---:|---|---|---|---|---:|
| 1 | Für alle | Tout public | 2022-11-24 12:00:00+00 | 2026-10-17 15:54:03+00 | **28,053** |
| 2 | Nur für Erwachsene | Adultes seulement | 2022-11-24 12:00:00+00 | 2026-10-17 15:54:03+00 | 4,665 |
| 3 | Für Kinder und Jugendliche | Enfants et adolescents | 2022-11-24 12:00:00+00 | 2026-10-17 15:54:03+00 | 1,561 |
| 4 | Für Senior:innen | Pour les seniors | **2026-10-17 15:54:03+00** | 2026-10-17 15:54:03+00 | **0** |

Row 4 was inserted by migration `Version20261016100000`, which ran during the local restore — the
production snapshot of 2026-05 only had three audiences. `event.audience_id` is `NOT NULL`, so every
event carries one.

### 8.3 `affiliation` — all 7 rows

Discount-card affiliations held by organizations (not by events). All created
`2023-01-26 13:33:00+00`.

| id | label (de) | label (fr) | organizations |
|---:|---|---|---:|
| 1 | Kultur-GA | AG culturel | 15 |
| 2 | Kulturlegi | Kulturlegi | 23 |
| 3 | AHV/IV | AHV/IV | 13 |
| 4 | Student:innen | Etudiant/e | **24** |
| 5 | Kinder | Enfants | 3 |
| 6 | Mitglieder | Membres | 2 |
| 7 | Ermässigt | Réduit | 5 |

`organization_affiliation` holds 85 rows over **28 organizations**; 713 of 741 organizations have
none.

| Affiliations per org | Orgs |
|---:|---:|
| 1 | 6 |
| 2 | 5 |
| 3 | 6 |
| 4 | 7 |
| 5 | 1 |
| 6 | 3 |

### 8.4 `region` — all 13 rows

Note the `id` gap: there is no id 6 and no id 12.

| id | label (de) | label (fr) | hidden | created_at | orgs | places |
|---:|---|---|---|---|---:|---:|
| 1 | Broye | Broye | **t** | 2022-06-21 12:00:00+00 | 0 | 0 |
| 2 | Greyerz | Gruyère | **t** | 2022-06-21 12:00:00+00 | 0 | 0 |
| 3 | Glane | Glâne | **t** | 2022-06-21 12:00:00+00 | 0 | 0 |
| 4 | See | Lac | **t** | 2022-06-21 12:00:00+00 | 0 | 0 |
| 5 | Saane | Sarine | **t** | 2022-06-21 12:00:00+00 | 15 | 15 |
| 7 | Sense | Singine | **t** | 2022-06-21 12:00:00+00 | 0 | 0 |
| 8 | Vivisbach | Veveyse | **t** | 2022-06-21 12:00:00+00 | 0 | 0 |
| 9 | Broye-Vully (Waadt) | Broye-Vully (Vaud) | **t** | 2023-06-02 10:00:00+00 | 0 | 0 |
| 10 | Stadt Bern | Ville de Berne | f | 2023-06-02 10:00:00+00 | **383** | **613** |
| 11 | Region Bern | Région de Berne | f | 2023-06-02 10:00:00+00 | 58 | 185 |
| 13 | Thun & Berner Oberland | Thoune & Oberland bernois | f | 2023-06-02 10:00:00+00 | 23 | 95 |
| 14 | Biel & Seeland | Bienne & Seeland | f | 2023-06-02 10:00:00+00 | 13 | 47 |
| 15 | Restlicher Kanton | Reste du canton | f | 2023-06-02 10:00:00+00 | 249 | 321 |

Ids 1–9 are the In Situ (canton Fribourg) regions, all hidden; ids 10–15 (created 2023-06-02, when
BKA launched) are the BKA/Bern regions. **Only ids 10, 11, 13, 14, 15 are the live BKA set** —
id 5 (`Saane`) still carries 15 orgs and 15 places as stragglers.

### 8.5 Enum-like values that live in code, not in a table

| Enum | Source | Values | Used in data |
|---|---|---|---|
| `publication_status` | `src/Entity/Event.php:34-36` | `draft`, `publish`, `to_validate` | all 3 |
| `event_status` | `src/Entity/Event.php:48-51` | `confirmed`, `canceled`, `postponed`, `full` | all 4 |
| `recurrence` | `src/Entity/Event.php:64-65` | `none`, `week` | both |
| `special_rate` | `src/Entity/Event.php:76-77` | `free_entry`, `free_price` | both |
| `type` (STI discriminator) | `MainEvent` / `SubEvent` | `mainevent`, `subevent` | both |
| `legal_status` | `src/Entity/Organization.php:26-35` | 10 values | 6 |
| `TicketingDesignation` | `src/Enum/TicketingDesignation.php:13-24` | `eventbrite`, `eventfrog`, `fnactickets`, `idticketing`, `infomaniak`, `monbillet`, `petzi`, `smeetz`, `starticket`, `ticketcorner`, `ticketmaster`, `weezevent`, `other` | **none — `ticketing` is empty** |
| `roles` | Symfony | `ROLE_USER`, `ROLE_ADMIN` | both |

---

## 9. API access provisioning — `user_token` and `oauth2_*`

Two independent mechanisms coexist.

### 9.1 `user_token` — long-lived JWTs minted in the admin UI (5 rows)

Schema: `id`, `owner_id` → `user(id)` `ON DELETE CASCADE`, `name varchar(255)`,
`expires_at timestamptz`, `token text` (the full JWT), `created_at`, `updated_at`,
`uuid uuid UNIQUE`.

Mechanics (`src/Security/JWTGenerator.php`):

```php
$token = $this->JWTTokenManager->createFromPayload($userToken->getOwner(), [
    'exp'  => $userToken->getExpiresAt()->getTimestamp(),
    'uuid' => $userToken->getUuid()->toRfc4122(),
]);
$userToken->setToken($token);
```

The signed JWT (Lexik) carries the owner's identity plus the row's `uuid`, and the **entire token is
stored back into the table in plaintext**. `src/Security/CustomJWTAuthenticator.php:30-53` validates
the signature, then additionally requires that a `user_token` row with that `uuid` still exists and
that its owner is `enabled` — so deleting the row revokes the token.

All 5 rows (tokens redacted; every `token` is a 904–921-byte `eyJ0eXAi…` JWT):

| id | owner | owner email | name | expires_at | token length | created_at | uuid |
|---:|---:|---|---|---|---:|---|---|
| 2 | 19 | roy.schlaefli@bka.ch | `Print Import` | 2030-04-30 10:28:00+00 | 921 | 2026-03-10 11:29:15+00 | `8f6ce3fb-119d-482a-9b4b-182bfc904dff` |
| 4 | 19 | roy.schlaefli@bka.ch | `Printimport V2` | **2050-03-21 18:07:00+00** | 921 | 2026-03-12 18:07:28+00 | `464114d3-7c5b-4254-837f-4f43f432c2b6` |
| 5 | 19 | roy.schlaefli@bka.ch | `Name` | 2026-04-30 07:17:00+00 (expired) | 921 | 2026-04-07 07:17:49+00 | `297cbbd6-cf1c-4c69-add4-2e05964e485b` |
| 6 | 127 | konzerte1@venue-example.org | `Mahogany` | 2036-03-26 10:53:00+00 | 904 | 2026-04-28 09:53:52+00 | `24f78926-2b37-4cca-82c7-9325c065f0bc` |
| 7 | 1 | admin@wepublish.ch | `Karl Merkli Test` | 2027-05-08 21:59:00+00 | 919 | 2026-05-08 10:46:59+00 | `9a7e5d1a-90af-4c2c-9359-ccc7c854f107` |

(`id` 1 and 3 were deleted — the sequence has gaps.) Only 3 distinct owners. Expiry dates are set by
hand in a form (`src/Form/UserTokenType.php`) and run as far out as **2050**. Access control is by
`src/Security/Voters/UserTokenVoter.php`.

### 9.2 `oauth2_client` — all 4 rows (secrets redacted)

| identifier | name | secret | redirect_uris | grants | scopes | active | plain-text PKCE |
|---|---|---|---|---|---|---|---|
| `052adb6fc2432319ac669f05f4f97a7c` | `heiko_dachstock.ch` | `167ddd…` (redacted) | *(NULL)* | `refresh_token` | `api` | t | f |
| `1d5709aa6bfbc4c6e05a25e4c40be19e` | `guidle` | `b75829…` (redacted) | *(NULL)* | `refresh_token` | `api` | t | f |
| `2e7e30c5e37a23dcf6adbeacaa073ba0` | `bka-frontend` | `59be42…` (redacted) | *(NULL)* | `refresh_token` | `api` | t | f |
| `aa2d951a902d8e2bffd295460693f825` | `punktzwei` | `e48b73…` (redacted) | *(NULL)* | `refresh_token` | `api` | t | f |

All four clients: single grant `refresh_token`, single scope `api`, no redirect URIs, active,
PKCE-plain disabled. The `guidle` client is the Swiss event-aggregator feed; `bka-frontend` is the
public BKA website; `punktzwei` and `heiko_dachstock.ch` are partner integrations.

### 9.3 `oauth2_access_token` — all 7 rows (identifiers truncated)

| identifier (prefix) | client | client name | expiry | user_identifier | scopes | revoked |
|---|---|---|---|---|---|---|
| `a6dece47…` | `2e7e30c5…` | bka-frontend | **2043-12-05 15:34:43+00** | technique1@venue-example.org | `api` | f |
| `80ccf308…` | `1d5709aa…` | guidle | **2043-12-07 17:56:00+00** | support@guidle.com | `api` | f |
| `53bbd23e…` | `aa2d951a…` | punktzwei | **2043-12-07 18:03:23+00** | produktion@bka.ch | `api` | f |
| `065de1a6…` | `052adb6f…` | heiko_dachstock.ch | **2044-05-14 08:59:56+00** | person05@example.org | `api` | f |
| `168e47e8…` | `2e7e30c5…` | bka-frontend | **2046-03-10 09:01:21+00** | elias@wepublish.ch | `api` | f |
| `212260bf…` | `2e7e30c5…` | bka-frontend | **2046-03-10 09:05:10+00** | admin@wepublish.ch | `api` | f |
| `09d7aefb…` | `1d5709aa…` | guidle | **2046-03-10 09:17:16+00** | support@guidle.com | `api` | f |

No token is revoked; every expiry is ~18–20 years out.

### 9.4 `oauth2_refresh_token` — all 7 rows

| identifier (prefix) | access_token (prefix) | expiry | revoked |
|---|---|---|---|
| `1986c3e9` | `a6dece47` | 2024-06-05 15:34:43+00 (expired) | f |
| `a9d454ce` | `80ccf308` | 2024-06-07 17:56:00+00 (expired) | f |
| `058d4c45` | `53bbd23e` | 2024-06-07 18:03:23+00 (expired) | f |
| `9649b204` | `065de1a6` | 2024-11-14 08:59:56+00 (expired) | f |
| `8e2b8ceb` | `168e47e8` | 2026-09-10 08:01:21+00 (expired) | f |
| `415f6f7c` | `212260bf` | 2026-09-10 08:05:10+00 (expired) | f |
| `556ca31c` | `09d7aefb` | 2026-09-10 08:17:16+00 (expired) | f |

Every refresh token is already past its expiry — in practice the long-lived **access** tokens are
what the integrations actually use.

### 9.5 The accounts behind API access

| Email | enabled | roles | member | last_login | mechanism |
|---|---|---|---|---|---|
| `admin@wepublish.ch` | t | `["ROLE_ADMIN","ROLE_USER"]` | f | 2026-10-17 16:00 (local) | oauth2 + user_token |
| `elias@wepublish.ch` | **f** | `["ROLE_USER"]` | f | 2026-03-10 09:04 | oauth2 (token still valid but owner disabled) |
| `person05@example.org` | t | `["ROLE_USER"]` | t | 2026-03-10 04:04 | oauth2 |
| `konzerte1@venue-example.org` | t | `["ROLE_USER"]` | t | 2026-04-28 16:45 | user_token |
| `produktion@bka.ch` | t | `["ROLE_USER","ROLE_ADMIN"]` | t | 2026-03-05 15:32 | oauth2 |
| `roy.schlaefli@bka.ch` | t | `["ROLE_USER","ROLE_ADMIN"]` | f | 2026-05-18 09:26 | user_token (×3) |
| `support@guidle.com` | t | `["ROLE_USER","ROLE_ADMIN"]` | t | 2026-05-21 04:49 | oauth2 (×2) |
| `technique1@venue-example.org` | — | — | — | — | oauth2 — **no matching `user` row** |

`technique1@venue-example.org` holds a valid, non-revoked access token expiring 2043 but **has no row in
`user`** — the oauth2 tables key on a free-text `user_identifier` string with no FK.

---

## 10. Orphans and referential inconsistencies

All declared foreign keys are intact — there are **zero** dangling FK values:

| Check | Rows |
|---|---:|
| `event.place_id` → missing `place` | 0 |
| `event.organization_id` → missing `organization` | 0 |
| `event.user_id` → missing `user` | 0 |
| `event.mainevent_id` → missing `event` | 0 |
| `place_proposed` referenced by its event but event missing | 0 |
| `event.archived_organization` ≠ live org name | 0 |
| `event.archived_place` ≠ live place name | 0 |
| duplicate slugs (event / org / place) | 0 |
| duplicate `user.email` | 0 |

The problems are **logical**, not referential:

| # | Finding | Rows | Detail |
|---:|---|---:|---|
| 1 | `event_occurrence.date_to < date_from` | **282** | inverted ranges, mirrored by 282 inverted `event` rows |
| 2 | `event.date_from` before year 2000 | 65 | year typos: `0001`, `0002`, `0004`, `0005`, `0024`, `0025`, `0204`, `0224`, `1954`, `2004` |
| 3 | `event.date_to` after 2030 | 10 | up to `2099-12-31` — these generate ~42,000 of the 118,021 occurrences |
| 4 | Events with **zero** occurrences | 4 | ids 20968 (`Offenes Atelier im Juni: Tapisserie`, publish), 6264 (`ffgdfg`, to_validate), 11288 (`Kunst und Courage…`, publish), 14 (`The old oak TEST`, to_validate) |
| 5 | Events with **zero** categories | 7 | ids 9721, 12954, 12957, 12961, 12962, 12963, 13128 — all `publish`, all created 2024-06/09, all Reitschule-style multi-artist line-ups |
| 6 | `place_proposed.event_id` NULL while the event points at the row | **665** | the back-reference is only written on 1,158 of 1,823 rows; `event.place_proposed_id` is the authoritative direction |
| 7 | `image` with no owner at all (`event_id`, `place_id`, `organization_id` all NULL) | **199** | uploaded then detached; files still on disk |
| 8 | `video.event_id IS NULL` | 6 | |
| 9 | `event_proposed_by` rows referenced by no event | 78 | |
| 10 | `place` never referenced by any event | 335 | of 1,276 (26 %) |
| 11 | `organization` with no event | 200 | of 741 |
| 12 | `organization` with no user | **296** | of 741 |
| 13 | `user` with no organization | 15 | of 427 |
| 14 | `rate.price` negative | 2 | both `-500` |
| 15 | `event.slug IS NULL` | 1 | id 18248, name `.` |
| 16 | `event` spans calendar days but `is_multi_day_event = false` | 936 | flag and dates disagree |
| 17 | `event.is_multi_day_event = true` but starts/ends same day | 15,908 | expected — the flag means "part of a date group", not "crosses midnight" (§5.6) |
| 18 | Placeholder organizations (`labels = '[]'`, `address = ''`, `enabled = false`) | **154** | exactly the orgs with no category; 32 of them nonetheless own events |
| 19 | Placeholder places (`labels = '[]'`, `address = ''`, `enabled = false`) | **258** | 241 also `private = true`; only 3 are referenced by an event |
| 20 | Obvious duplicate event records | ≥ 10 | e.g. `Wunderkammer - Die Schausammlung` exists as events 3881, 27000, 27002, 27004, 27005; `Mensch, Erde!` as 28685–28689 |
| 21 | oauth2 `user_identifier` with no `user` row | 1 | `technique1@venue-example.org` |
| 22 | `related_dates` length ≠ occurrence count | 16,622 | the two caches are computed by different rules (§5.8) |

---

## 11. Quick-reference: the numbers that matter most

| Question | Answer |
|---|---|
| How many events must migrate? | **34,279** (21,116 main + 13,163 sub) |
| How many are published? | 34,076 (99.4 %) |
| How many occurrences? | **118,021**, but 48.7 % come from 20 mis-dated events |
| How many are real (2023–2027)? | ≈ 72,000 |
| How many events have an image? | 19,505 (56.9 %) |
| How many image files to move? | **27,571** (23,172 jpg / 3,578 png / 820 jpeg / 1 jfif) + 1 PDF |
| How many events have prices? | 6,000 events, 12,697 `rate` rows |
| How many have videos? | 1,906 events, 2,025 videos (92 % YouTube) |
| How many have a ticketing link? | 17,807 events (16,189 JSON + 1,618 column-only) |
| How many have a technical sheet? | 0 (the single sheet belongs to a place) |
| How many have structured ticketing? | **0** — the `ticketing` table is empty |
| Languages actually used | **de** everywhere; **fr** on ≤ 118 events (0.3 %) and 0 users |
| Users | 427 (414 enabled, 30 admins, 269 "members") |
| Organizations | 741 (585 enabled, 154 are auto-created stubs) |
| Places | 1,276 (1,013 enabled, 258 are auto-created stubs, 335 unused) |
| Lookup rows to seed | 30 categories + 4 audiences + 7 affiliations + 13 regions = **54** |
| API credentials | 4 oauth2 clients, 7 access tokens, 5 personal JWTs |
| Total data volume | 211 MB, of which `event` alone is 165 MB |

---

## Porting notes

*Everything above is measurement. This section is opinion, clearly separated.*

1. **Drop ten columns outright.** `event.description`, `event.sponsored_start_date`,
   `event.sponsored_end_date`, `event.og_image`, `image.legend`, `rate.designation`,
   `contact.designation_email`, `contact.designation_phone`, `place.capacity`,
   `technical_sheet.title`, plus `organization.sub_title`, `organization.about` and `place.about`.
   Each has a live JSON twin inside the corresponding `labels` column, and the plain column is
   100 % NULL or 100 % empty. Porting both shapes would re-import the bug.

2. **Drop four tables.** `ticketing` (0 rows, and the 13-provider enum behind it is pure dead code),
   `oauth2_authorization_code`, `reset_password_request`, `messenger_messages`. `technical_sheet`
   is one row attached to a place — decide whether a place-level file attachment is worth a table
   or becomes a generic asset.

3. **`labels` collapses to German.** BKA has 34,275 German descriptions and 118 French ones; zero
   French users; `LOCALES=fr|de` with `DEFAULT_LOCALE=de`. If We.Publish's event model is
   single-language, the migration is a straight `labels->'description'->>'de'` extraction and the
   118 French strings can be reviewed by hand. If multi-language is kept, note that `fr` keys exist
   but hold JSON `null` on ~96 % of the rows that have them — a naive importer will create 3,212
   empty French translations.

4. **The description corpus is block-content-friendly.** 28,121 descriptions are `<p>`-wrapped,
   14,582 contain `<br>`, 7,207 bold, 3,426 links, 59 lists, 1 heading, and **zero** images,
   tables, iframes or blockquotes. A single `RichText` block per event covers the whole corpus. The
   catch is HTML-entity encoding: 28,685 of 34,279 strings contain `&uuml;`/`&laquo;`/`&ndash;`/
   `&nbsp;` sequences that must be decoded before they reach a Slate/Lexical AST, or every event
   will render literal entities.

5. **Do not port `related_dates`.** It is 367k redundant date objects, it is the reason `event` is
   139 MB, it disagrees with `event_occurrence` on 16,622 rows, and every value is derivable from
   the occurrences. Recompute on read, or drop it.

6. **`event_occurrence` needs a cap, not a straight copy.** 20 events produce 57,479 of the 118,021
   rows because five permanent exhibitions were saved with `date_to` in 2045/2050/2099 and
   `recurrence = 'week'`. Either (a) clean those `date_to` values before migrating — they are
   obvious typos for a 1–2 year run — or (b) cap expansion at a horizon (e.g. +2 years) and expand
   lazily. Copying them verbatim imports 42,000 rows of 2030–2099 noise.

7. **Clean the dates during migration.** 65 events start before 2000 (`0024-02-20` = `2024-02-20`,
   `0204-04-04` = `2024-04-04`, …) and 282 events plus 282 occurrences have `date_to < date_from`.
   These are visible in the live UI today. A deterministic fix for the year typos is
   `year < 100 → 2000 + year`, `year in (0204, 0224) → 2024`, but each should be eyeballed — 65
   rows is a small manual list.

8. **Main/sub events are not a parent/child tree; they are one event with many dates.** Sub-events
   carry no independent content — `OnFlushEventListener` overwrites their `name`, `eventStatus`,
   `place`, `organization`, `description` and `specialRate` from the parent on every save. 13,163
   of 34,279 rows exist only to hold a second date. In a We.Publish model with first-class
   occurrences/date ranges, **these 13,163 rows collapse into occurrence records on 3,285 parents**,
   taking the event count from 34,279 to ~21,116. That is the single biggest structural
   simplification available, and the data says it is safe: **not one sub-event owns an image, a rate
   or a video** — all 19,505 image-bearing, 6,000 rate-bearing and 1,906 video-bearing events are
   main events. The only sub-event-local data is `date_from`/`date_to` (plus `event_category` links
   that are copied from the parent anyway). The only oddity to handle is the 3 sub-events with
   `is_multi_day_event = false`.

9. **Revision/draft semantics barely exist today.** 99.4 % published, 94 drafts, 109 awaiting
   validation, 176 `publication_date` values ever set. We.Publish's draft/pending/published model is
   a strict superset: every migrated event becomes `published`, with `publication_date` as the
   published-at where present and `created_at` otherwise. The `to_validate` state maps to
   "pending" — but note its real meaning here is *"submitted by an anonymous member of the public
   via the propose-an-event form"* (90 of 109 have a `proposed_by_id`), not *"an editor scheduled
   it"*.

10. **Two ticketing stores must be merged.** `event.labels.ticketingUrl.de` (16,189, written by the
    admin forms) and `event.ticketing_url` (1,794, written only by API imports — every such row has
    `user_id IS NULL`). They overlap on 176 rows. `COALESCE(labels→ticketingUrl→de, ticketing_url)`
    is the right merge; picking only one loses 1,618 or 16,013 links.

11. **Seed all 54 lookup rows, but hide the dead ones.** 5 of 30 categories and 8 of 13 regions are
    `hidden = true` and belong to the In Situ/Fribourg product, not BKA. The live BKA sets are
    **25 visible categories** and **5 regions** (ids 10, 11, 13, 14, 15). 15 organizations and 15
    places are still parked in the hidden `Saane` region and need re-homing. Audience id 4
    (`Für Senior:innen`) exists in the schema but has zero events — it was added after the
    production snapshot.

12. **`category` does triple duty.** The same 30 rows serve `event_category` (M:N, 1–6 per event),
    `event.print_category_id` (1:1, used on 64 % of events, feature `HAS_PRINT_OPTIONS=true`) and
    `organization_category` (M:N). If We.Publish models these as tags, three separate relations
    against one vocabulary are needed, not one.

13. **`rate.price` is integer cents in a varchar.** Range 0–80,000 (CHF 0–800), 230 distinct values,
    two negative rows. Migrate to an integer/decimal money column and reject the `-500`s.
    `rate.labels.designation.de` is free text with 1,915 distinct values and no normalisation
    (`Reduziert` / `reduziert` / `Ermässigt` / `ermässigt` are four separate strings) — a
    normalisation pass is cheap and worthwhile, and the top 25 strings cover ~6,000 of 12,697 rows.

14. **412 placeholder rows should not be migrated as content.** 154 organizations named
    `Organisationen von <email>` and 258 places named `Ort von <email>` are auto-created,
    disabled stubs with empty addresses. Only 32 placeholder orgs and 3 placeholder places are
    actually referenced by events; the rest are pure noise. The `user.config` column
    (`{"org_creation":"needed"}` on 103 users) is the onboarding-nag flag that produced them.

15. **Permissions are coarse.** Two roles only (`ROLE_USER` ×427, `ROLE_ADMIN` ×30), plus the
    `member` boolean (269 true) and the `user_organization` M:N (507 links, max 3 orgs per user).
    `LIST_OWN_EVENTS_ONLY=true` means a non-admin sees only events whose `organization_id` is in
    their `user_organization` set. 296 organizations have no user at all, and 6,330 events have no
    organization — under a strict ownership model those events become admin-only, which is probably
    correct but should be a conscious decision.

16. **API access must be redesigned, not migrated.** Two parallel mechanisms exist: 4 oauth2
    clients with `refresh_token`-only grants and access tokens expiring in 2043–2046, and 5
    personal JWTs stored **in plaintext** in `user_token` with expiries up to 2050. One oauth2
    identity (`technique1@venue-example.org`) has no `user` row at all, and one (`elias@wepublish.ch`) has
    a valid token on a disabled account. The real integrations to preserve are `guidle` (the Swiss
    event aggregator feed) and `bka-frontend` (the public website); `punktzwei` and
    `heiko_dachstock.ch` are partner feeds. None of the secrets or tokens should be carried over.

17. **Budget for 27,571 image files plus 1 PDF.** Names are VichUploader `uniqid` strings
    (`^[0-9a-f]{22}\.(jpg|png|jpeg|jfif)$`, 366 with uppercase extensions). 199 images have no owner
    and can be skipped. `image.position` (0–27) is the ordering within an event's gallery — 19,828
    are at position 0, so most events have exactly one image and ordering only matters for the
    ~3,250 multi-image events.

18. **Geocoding is partially done.** 1,181 of 1,276 places and 587 of 741 organizations have
    lat/lon; all 1,823 `place_proposed` rows are geocoded. The 95 + 154 gaps correlate with the
    placeholder stubs, so after dropping those the coverage is effectively complete.

19. **ProInfirmis is built but unused in this snapshot** — one test place out of 1,276. The schema
    (`pro_infirmis_id_source varchar(24)`, `pro_infirmis_pictograms` JSON array of
    `{Id, Name, NameFr, NameIt, NameEn, LinkToPictogram, LinkToPictogramSvg, PictogramFileName}`,
    `pro_infirmis_detail_url varchar(255)`) and the pictogram CDN (`zuerst.proinfirmis.ch`) are the
    only evidence of how it works. Since the integration is in scope for the port, the behaviour
    must be read from the Symfony code and from production config — **this dataset cannot tell you
    how it is used, because it effectively isn't.** Note also that the three
    `wheelchair_accessible*` booleans are a *separate*, manually-maintained mechanism, set on only
    64 of 1,276 places.

20. **Expect a measurable shrink.** Dropping `related_dates`, collapsing sub-events, capping the
    runaway occurrence expansions and skipping the 412 placeholder rows takes the dataset from
    34,279 events / 118,021 occurrences / 211 MB to roughly 21,000 events / ~70,000 occurrences and
    well under 50 MB of relational data (images excluded).
