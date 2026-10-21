# E2E tests (Playwright + playwright-bdd)

Gherkin journeys in `features/`, step definitions in `steps/`, test-data and
fake-service helpers in `support/`. Read-only checks run anywhere; journeys
that write data, read mail or pay are **skipped with a reason** unless the
target provides those capabilities.

## Targets: which app, which deployment

Two applications are tested, each a Playwright project with its own feature
folder (steps are shared):

| Project   | Features             | Tests                                     |
| --------- | -------------------- | ----------------------------------------- |
| `website` | `features/website/`  | a tenant website (`apps/<tenant>`)        |
| `editor`  | `features/editor/`   | the editor (`apps/editor`) of that tenant |

`E2E_APP` picks the tenant, `E2E_ENV` the deployment; the website, editor and
API URLs follow from the deploy workflows' conventions
(`support/targets.ts`, printed as `E2E target: …` at the start of every run):

| `E2E_ENV`         | Website                                        | Editor                                | API                                |
| ----------------- | ---------------------------------------------- | ------------------------------------- | ---------------------------------- |
| `local` (default) | `localhost:<serve port in project.json> + 1000` | `localhost:3010`                      | `localhost:4010`                   |
| `review`          | `review<N>.wepublish.works`                    | `editor-review<N>.wepublish.works`    | `api-review<N>.wepublish.works`    |
| `staging`         | `custom_domain` or `<app>.wepublish.works`     | `editor-<app>.wepublish.works`        | `api-<app>.wepublish.works`        |
| `production`      | `custom_domain` or `<app>.wepublish.cloud`     | — (set `E2E_EDITOR_URL`)              | `api-<app>.wepublish.cloud`        |

`review` needs `E2E_REVIEW_SLOT` (the N of the PR label `review_<N>_<app>`;
a slot hosts one app at a time). `BASE_URL`, `E2E_EDITOR_URL` and
`E2E_API_URL` override any of the three. `E2E_APP` defaults to
`website-example`; only Next.js tenant apps are accepted (not
`wepublish-site`).

```sh
pnpm run e2e tsri                                         # tsri website, local
pnpm run e2e editor                                       # editor only
pnpm run e2e tsri,editor --environment staging            # both apps of tsri
pnpm run e2e tsri,bajour                                  # one run per tenant
pnpm run e2e bajour --environment review --review-slot 3
pnpm run e2e tsri --environment production --grep @smoke
pnpm run e2e -- --grep @app:tsri                          # only tsri-specific scenarios
pnpm run e2e:report                                       # HTML report
```

Leading comma-separated words are targets: `editor` selects the editor
project, a tenant name sets `E2E_APP` and selects the website project; without
them both projects of `E2E_APP` run. `--app`, `--environment` and
`--review-slot` are shorthands for `E2E_APP`, `E2E_ENV` and
`E2E_REVIEW_SLOT` (`run.ts`); every other flag goes to
`playwright test`. It is `--environment`, not `--env`: Nx's run-commands owns
`--env`.

**Tenant-specific scenarios** carry `@app:<name>` (several allowed). They run
only when `E2E_APP` is one of them and skip otherwise; untagged scenarios are
generic and run for every tenant. Keep generic scenarios free of tenant copy.

The `E2E_` prefixes are deliberate: `pnpm run e2e` goes through Nx, which
loads the root `.env`, and that file sets `API_URL` / `EDITOR_URL` for local
development.

## Capabilities

| Env var / condition                                           | Enables                 | Notes                                                       |
| ------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------- |
| an API URL for the target                                     | `@mutating`, `@payment` | GraphQL at `/v1`                                            |
| `E2E_API_TOKEN` _or_ `E2E_ADMIN_EMAIL` + `E2E_ADMIN_PASSWORD` | data factories          | defaults to the seed admin `dev@wepublish.ch` / `123`       |
| `E2E_ALLOW_MUTATION` not `false`                              | `@mutating`             | on by default outside production; `false` opts out          |
| `E2E_ENV` is not `production`                                 | `@mutating`, `@payment` | production is never written to; it has no simulated payment |
| `MAILPIT_URL`                                                 | `@mail`                 | set (and mailpit started) by local runs                     |
| `E2E_MAILCHIMP_API_KEY` + `_LIST_ID` + `_INTEREST_ID`        | `@mailchimp`            | a real test audience (no fake); never production            |

Every scenario carries a domain tag (`@auth`, `@paywall`, …) and the
capability tags it needs. The `capabilities` fixture compares them with the
target and calls `test.skip(…, 'needs MAILPIT_URL')` when one is missing.
The skip happens per test, after the run has migrated, seeded and started the
local stack. A local `--grep` that only matches skipped scenarios still takes
the full cold start (~1 min) and then reports `skipped`, not `passed`. Read the
skip reason in the report (`pnpm run e2e:report`).

## Test data and fakes

- **`data` fixture** (`support/factories.ts`) creates readers, articles,
  paywalls and subscriptions through the GraphQL API and deletes them after
  the scenario, in reverse order, best effort (failures are logged as
  `[e2e] could not clean up`). Names come from faker seeded by the scenario
  title; slugs and emails carry a run id (`e2e-<timestamp>-w<worker>-<n>`,
  `e2e+<runId>@example.test`) so leftovers are easy to find.
- **Named entities:** Gherkin calls things by a quoted alias
  (`a paywalled article "Paid story"`); the step stores the entity under that
  alias and later steps look it up with `data.get('article', alias)`.
- **`inbox`** (`support/mailpit.ts`) polls mailpit for a mail to an address
  and extracts links from it.
- **`checkout`** (`support/simulated-payment.ts`) drives the SIMULATED payment
  provider's checkout page (Pay / Decline / Cancel). It is the only payment
  fake: Stripe and Payrexx are never mocked over HTTP. `@payment` scenarios
  run with `bypassCSP`: the checkout page's CSP (`form-action 'self'`) makes
  Chrome block its redirect back to the website when API and website are
  different origins — a provider bug, see `steps/fixtures.ts`.
- **Mailchimp** has no fake: `@mailchimp` scenarios point the tenant's one
  Mailchimp sync provider at a real test audience (`E2E_MAILCHIMP_*`) and
  restore its list, newsletters and `enabled` afterwards. The API key cannot be
  read back, so the test key stays. Members the scenario adds to the audience
  (often `pending`, with a confirmation mail) stay there; archive them in
  Mailchimp. Scenarios that change the provider share it, so keep them in one
  feature tagged `@mode:serial`.
- **Third parties** (`support/third-party.ts`): analytics, ads, Sentry and
  tracking pixels are blocked in every test; Cloudflare Turnstile is not.
- **Captcha:** the seed configures Turnstile's always-pass test keys
  (`1x00000000000000000000AA`). The API still calls Cloudflare to verify, so
  it needs outbound internet.

What stays behind on purpose:

- the `mitmachen` subscribe page and the `LOGIN_LINK` system-mail template,
  created once when a freshly seeded stack lacks them;
- invoices (and their payment / subscription period) of e2e readers who
  paid: the API cannot delete subscription periods, which block invoice
  deletion. Find them by mail `e2e+`.

## Local stack

```sh
pnpm run start:docker                 # postgres, minio, dragonfly
pnpm run e2e bajour
```

With `--environment local` (the default) the run uses its **own stack**, apart
from your dev servers and dev database (`localStack` in `support/targets.ts`):

| Server        | Port                         | Talks to                                     |
| ------------- | ---------------------------- | -------------------------------------------- |
| `api-example` | 4010                         | database `wepublish_e2e`, Dragonfly db 1     |
| tenant        | its serve port + 1000 (5204) | API :4010                                    |
| editor        | 3010                         | API :4010                                    |

Before the tests, `run.ts` runs `prisma migrate deploy` against
`wepublish_e2e` (creating it on the first run) and seeds it whenever
migrations were applied, and starts mailpit (`docker compose`, SMTP :1025 for
the seeded provider, mails at http://localhost:8025). `E2E_DATABASE_URL` picks another database. The
servers are started unless already running on those ports (then reused), and
stopped after the run. Only the selected targets are served, and nothing is
started (nor migrated) for a URL you override (`BASE_URL`, `E2E_EDITOR_URL`,
`E2E_API_URL`). Other Docker services are not started. Cold starts take a while (API
~1–2 min, Next.js ~20 s).

- A Next.js app can only run one dev server at a time: stop your own
  `nx serve <tenant>` of the same checkout before a run.
- A started Next.js dev server rewrites the app's `next-env.d.ts`, as it does
  when you serve it by hand — don't commit that.
- Reset the e2e data with
  `docker exec wepublish-database-1 psql -U postgres -c "DROP DATABASE wepublish_e2e"`;
  the next run recreates it.

## Review instances

- Create an API token (`wep_…`) in the editor under API tokens
  (`/api-tokens`) and pass it as
  `E2E_API_TOKEN`; in CI it is the `E2E_API_TOKEN` secret.
- `@mail` journeys skip: there is no mailpit to read from.
- `@payment` needs the `simulated` payment method on the plan used (it only
  exists on non-production instances).
- The database is a copy of production — cleanup matters. Search the editor
  for `e2e+` users or `e2e-` slugs if a run was aborted.

In GitHub: Actions → **E2E tests** → `app`, `environment` (+ `review_slot`),
`project` (all / website / editor), optional `grep`, `allow_mutation` (on by default; ignored for production) and
URL overrides.
