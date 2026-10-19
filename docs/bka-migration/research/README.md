# BKa → We.Publish port: research

Reference documents describing the system being ported **from** (the BKa admin backend,
a Symfony 6.4 / API Platform / Doctrine app at `/Users/itrulia/Documents/insitu-admin`)
and the system being ported **to** (this monorepo).

Decisions taken on the basis of this research live in [`../decisions.md`](../decisions.md).

| Document | Scope |
| --- | --- |
| [`bka-01-data-model.md`](bka-01-data-model.md) | Every Doctrine entity, column, relation; the Event single-table inheritance |
| [`bka-02-live-data-profile.md`](bka-02-live-data-profile.md) | What the production data actually contains, column by column |
| [`bka-03-emails.md`](bka-03-emails.md) | Every outbound email, its trigger, recipients and template |
| [`bka-04-api-v2-apiplatform.md`](bka-04-api-v2-apiplatform.md) | The API Platform surface at `/api/v2` |
| [`bka-05-api-v1-legacy.md`](bka-05-api-v1-legacy.md) | The hand-written legacy controllers at `/api/v1` |
| [`bka-06-security-auth-roles.md`](bka-06-security-auth-roles.md) | Firewalls, roles, voters, OAuth2, JWT, user tokens |
| [`bka-07-proinfirmis-ginto.md`](bka-07-proinfirmis-ginto.md) | The accessibility integration and its Ginto successor |
| [`bka-08-event-domain-logic.md`](bka-08-event-domain-logic.md) | Dates, recurrence, occurrence expansion, duplication, search |
| [`bka-09-admin-feature-inventory.md`](bka-09-admin-feature-inventory.md) | Every screen, form field and action in the backoffice |
| [`bka-10-images-infra-misc.md`](bka-10-images-infra-misc.md) | Image pipeline, storage, commands, theming, env vars |
| [`bka-11-schema-history.md`](bka-11-schema-history.md) | Migration history, MySQL→Postgres move, dead columns |
| [`wp-01-current-event-implementation.md`](wp-01-current-event-implementation.md) | The event code being deleted, and its dependents |
| [`wp-02-mail-flow.md`](wp-02-mail-flow.md) | How We.Publish sends mail and how to add an editable template |

Still to be written: `wp-03` permissions and roles, `wp-04` block content, `wp-05` revisions,
`wp-06` Prisma conventions, `wp-07` editor architecture, `wp-08` API module conventions,
`wp-09` tokens and sessions, `wp-10` images and media.

## ⚠ Correction: the figures in these documents are understated

These documents were written against a database restore that **silently failed part-way**.
`pg_restore` reported "193 errors ignored" and loaded roughly 85% of the data; the error was not
caught until much later, when the same dump restored cleanly and produced different counts.

**Every row count, percentage and distribution in the `bka-*` documents is therefore too low.**
The structural findings are unaffected — entity shapes, relationships, the single-table
inheritance, the state machine, the email triggers and the absence of an organisation concept in
We.Publish were all re-verified against the complete data and hold unchanged.

Corrected figures, measured on the full restore:

| | In these documents | Actual |
| --- | --- | --- |
| Events | 34,279 | **39,978** |
| — mainevent / subevent | 21,116 / 13,163 | **24,703 / 15,275** |
| Occurrences | 118,021 | **128,489** |
| Images | 27,571 | **32,079** |
| Organisations | 741 | **781** |
| Users | 427 | **670** |
| Places | 1,276 | **1,369** |
| Rates | 15,206 | **15,206** |
| Provenance rows / distinct people | 4,366 / 1,561 | **5,142 / 1,798** |
| publication_status publish / to_validate / draft | 34,066 / 109 / 94 | **39,692 / 136 / 150** |

[`../decisions.md`](../decisions.md) and [`../design/`](../design/) carry the corrected figures
and are authoritative. These research documents have **not** been rewritten — the cost of
re-running 21 agents outweighs the benefit, since no conclusion changed. Treat their numbers as
indicative and the decision log as definitive.

**Lesson for anyone extending this work:** `pg_restore` exits 0 with "errors ignored". Always
check the row counts against the source after a restore, rather than trusting the exit code.

## Provenance and redaction

These documents were produced by reading the BKa source tree and by querying a **local
restore of the BKa production database**. That database contains real personal data:
organiser and venue email addresses, names, and live API credentials.

**This repository is public.** Production data must not be committed to it.

The documents have therefore been redacted:

- Every real email address is replaced by a stable pseudonym — `personNN@example.org` for
  personal addresses, `<role>N@venue-example.org` for role addresses such as `info@` — so
  the shape and role of the data stay legible while the address does not.
- Token identifiers are replaced with `<redacted-jti>`.
- Personal names, phone numbers and credentials appear only as aggregate statistics
  (row counts, null rates, distinct-value counts), never as values.

Addresses belonging to the project itself (`@wepublish.ch`, `@bka.ch`), to vendors
(`@ginto.guide`, `@guidle.com`, `@proinfirmis.ch`) and to local or documentation hosts are
kept as-is, since they are not personal data.

If you extend this research, keep the same rule: **aggregate over production data, never
transcribe it.** Counts, distributions and null rates answer every question these documents
need to answer, without copying anyone's details into a public repository.
