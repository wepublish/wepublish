# Gotchas & Load-Bearing Constraints

Things in this repo that look like tidy-up opportunities but are not. Each entry
records **what breaks**, **why the obvious alternative fails**, and **what pins
it**. Read this before "simplifying" config, barrel files, or lint rules.

If you hit a subtle failure that cost you real debugging time, add an entry using
the template at the bottom. A constraint that only lives in one person's head
gets refactored away by the next agent.

---

### ⚠️ Prisma helpers are deliberately absent from the `@wepublish/testing` barrel

[libs/testing/src/index.ts](../../libs/testing/src/index.ts) exports `act-wait`,
`mock-date`, `create-mock` and `graphql-public` — but **not** the Prisma
utilities, with the reason stated inline:

> Prisma utilities (`createPrismaClient`, `clearDatabase`, `clearFullDatabase`)
> are NOT re-exported here to avoid pulling `@prisma/client` into frontend tests.

Import them from the subpath instead:

```ts
import { createPrismaClient, clearDatabase } from '@wepublish/testing/prisma';
```

**Load-bearing.** Adding them to the barrel drags `@prisma/client` into every
website and editor test bundle. Do not "complete" the barrel file.

---

### ⚠️ NestJS stays on Jest — this is not an oversight

Most of the workspace moved to Vitest in `a42088205`, whose message states the
intent plainly: *"swap most from jest to vitest. **nestjs left on jest until new
major release**"*. So `libs/*/api` keep `jest.config.ts` and `jest.fn()`, while
everything else uses `vitest.config.ts` and `vi.fn()`.

`eslint.config.mjs` encodes the same split for spec files — it injects Jest
globals everywhere *and* `vi` as readonly, with the comment *"The backend
(NestJS) projects run on jest, everything else on vitest."*

**Do not migrate a `libs/*/api` project to Vitest** as drive-by cleanup. Check
which config file the project has before writing a test — see
[testing.md](testing.md).

---

### ⚠️ `vitest.config.ts` files are exempt from module boundaries — on purpose

[eslint.config.mjs](../../eslint.config.mjs) turns `@nx/enforce-module-boundaries`
**off** for `**/vitest.config.ts`, because:

> The per-project vitest configs share their setup through the root-level
> `vitest.shared.ts`, which is not part of any project and therefore has to be
> imported by a relative path.

`vitest.shared.ts` in turn re-reads `tsconfig.base.json` and rebuilds the
`@wepublish/*` aliases itself, so *"imports resolve to their source files instead
of built output"*.

**Load-bearing.** Removing the exemption makes every `vitest.config.ts` fail
lint; "fixing" the relative import to an alias breaks resolution, because the
file it points at belongs to no Nx project.

---

### ⚠️ Two ESLint rules are pinned to a pre-upgrade baseline

In [eslint.config.mjs](../../eslint.config.mjs), several rules are deliberately
relaxed with the reason written next to them:

- `@typescript-eslint/no-unused-vars` sets `caughtErrors: 'none'` — typescript-eslint
  v8 changed the default to `'all'`; this pins the previous behaviour.
- `no-constant-binary-expression`, `@typescript-eslint/no-empty-object-type` and
  `@typescript-eslint/no-unsafe-function-type` are `off` — newly enabled by the
  ESLint v9 / typescript-eslint v8 presets, and **not** enforced before the upgrade.
- `@stylistic/no-extra-semi` replaces the removed `@typescript-eslint/no-extra-semi`.

**These are a deliberate baseline, not neglect.** Turning one on is a repo-wide
cleanup task with its own PR — not something to flip while doing unrelated work.

---

### ⚠️ `no-restricted-imports` blocks two imports that otherwise look correct

[eslint.config.mjs](../../eslint.config.mjs) errors on:

- `styled` from `@mui/material` → *"Please import `styled` from `@emotion/styled`
  instead."* Mixing the two produces components that ignore the Emotion theme.
- `SensitiveDataUser` from `@wepublish/user/api` → import it **only** when the
  sensitive fields are genuinely required; otherwise use `User`.

The second is a data-exposure guard, not a style preference. If you need
`SensitiveDataUser`, be able to say which field forced it.

---

### ⚠️ Four apps are excluded from the typecheck CI job

[tools/typecheck-websites.sh](../../tools/typecheck-websites.sh) skips
`api-example`, `editor`, `bka`, and `media` — they do not currently typecheck
cleanly, and `website-typecheck.yml` runs this script as-is.

Two failure modes to avoid:

1. Do not "fix" the exclusion list as a side quest — those apps fail for
   unrelated pre-existing reasons.
2. Do not let your change push a **new** app onto that list. If an app you touched
   stops typechecking, fix the app, not the script.

Note the script uses `set -uo pipefail` (no `-e`) and collects failures, so it
reports every failing app rather than stopping at the first.

---

### ⚠️ `schema-v2.graphql` is generated, and only outside production

`apps/api-example/src/nestapp/app.module.ts` sets `autoSchemaFile` to
`'./apps/api-example/schema-v2.graphql'` **only when `NODE_ENV !== 'production'`**
(in production it is `true`, i.e. in-memory). The file is therefore refreshed by
running the API in dev — never by hand.

If codegen produces stale types, the fix is to **start the API** so the SDL is
rewritten, then run `npm run generate-api`. Editing the `.graphql` file directly
gets silently overwritten on the next dev boot. See
[graphql-prisma.md](graphql-prisma.md).

---

### ⚠️ Vitest forces `TZ=UTC` globally

[vitest.setup-tests.ts](../../vitest.setup-tests.ts) sets `process.env['TZ'] = 'UTC'`
before anything else, and also silences one specific React `act(...)` warning.

A test that passes locally in `Europe/Zurich` but relies on local time will
behave differently under Vitest. Assert on explicit UTC instants, or freeze time
(`vi.setSystemTime` / `jest.setSystemTime`) rather than depending on the ambient
zone. Jest projects do **not** get this setup file — set the zone yourself there.

---

## Adding an entry

Keep the house style: a future agent must be able to tell *why* the obvious
change is wrong without re-running your debugging session.

```markdown
### ⚠️ <one-line claim, in present tense>

<What the code does now, with a link to the file. Quote an existing inline
comment if there is one.>

<What actually failed, with concrete evidence — the error string, the row count,
the measured number. "It broke" is not evidence.>

<Why the obvious alternative cannot work. This is the part that stops the next
refactor.>

**Load-bearing:** <which specific lines must not be removed, and what happens
if they are.>

Pinned by `<path/to/the.spec.ts>`  ← if a test guards it. If nothing guards it,
say so explicitly: "Nothing guards this — a regression here is silent."
```

Rules of thumb:

- **Date a fact you verified against live behaviour** ("verified against a real
  Mailgun response on 2026-08-25"), so a reader knows how stale it may be.
- **Prefer numbers to adjectives.** "Died at ~5 000 rows" beats "died partway".
- **Delete an entry when the constraint is genuinely gone.** A stale gotcha is
  worse than none — it makes readers distrust the whole file.
