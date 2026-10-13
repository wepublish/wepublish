# Verification

**Evidence before assertions.** Never say "done", "fixed", "working", or "tests
pass" without having run the command and read its output in this session. If you
did not run it, say so: "I have not run the test suite."

Never report success based on "the change looks right". Never claim a test passes
because you wrote it.

## The gate

Before claiming any code change is complete, run **lint + test for the affected
projects**, then **typecheck what you touched**.

```bash
# 1. Lint + test everything your change touches (fast — Nx caches)
npx nx affected -t lint test --uncommitted

# On a feature branch, compare against the base branch instead:
npx nx affected -t lint test --base=origin/development
```

```bash
# 2a. Libs — typecheck through the build target
npx nx build <project>                    # e.g. membership-api

# 2b. Apps — not covered by lint, test, or any build target
npx tsc -p ./apps/<app> --noEmit          # single app
bash ./tools/typecheck-websites.sh        # all apps, as CI runs it
```

`nx build <project>` runs `tsc` across the whole library rather than only the
files a spec happens to import, so it is what catches a type error in a file no
test reaches — including a **stale generated client**. If `@prisma/client` is
missing fields you just added to `schema.prisma`, run `npx prisma generate`.
When a lib has no `build` target, add one where it makes sense.

If `--uncommitted` returns nothing but you know you changed files, you have
probably already staged or committed them — use `--base=origin/development`.

### Single project (while iterating)

```bash
npx nx test <project>            # e.g. article-api, article-website
npx nx lint <project>
npx nx test <project> --watch    # Vitest projects only
```

Nx project names are `<domain>-<layer>`. List them with `npx nx show projects`.

### Whole workspace (rarely needed)

```bash
npm run lint            # all projects
npm run test            # all projects, serial — many minutes
npm run test-backend    # NestJS/backend projects
npm run test-website    # *website* projects
```

Prefer `nx affected`. The full run is what CI is for; running it locally on every
change wastes minutes and tempts you into skipping verification entirely.

## What CI enforces

Your local gate mirrors these. A change that passes locally but fails here is
still a broken change.

| Workflow | Command | Covers |
| --- | --- | --- |
| `lint.yml` | `npm run lint` | ESLint, all projects |
| `test.yml` | `npm run test-backend -- --configuration=ci` | Vitest backend/NestJS + coverage, with Postgres 17 |
| `website-tests.yml` | `npm run test-website -- --configuration=ci` | Vitest website projects + coverage |
| `website-typecheck.yml` | `bash ./tools/typecheck-websites.sh` | `tsc --noEmit` per app |

Note `website-typecheck.yml` **excludes** `api-example`, `editor`, `bka`, `media`
— those are known not to typecheck cleanly. Do not "fix" that exclusion as a
side quest, but do not let a change you make add a new app to that list either.

Coverage is uploaded to Codecov with `fail_ci_if_error: true`.

## Reporting results

State the actual outcome:

- ✅ `npx nx affected -t lint test --uncommitted` — 4 projects, all passed
- ❌ 2 tests fail in `article-api` — paste the failing assertion
- ⚠️ Did not typecheck; change was library-only

If tests fail, **say so and show the output.** Do not fix a failing test by
loosening the assertion or deleting the case. Diagnose the cause before you
patch: a test you weakened to make it green is a regression you shipped.

## Formatting

Do **not** run Prettier manually. A Husky `pre-commit` hook runs
`pretty-quick --staged` over `{apps,libs}/**/*.{js,ts,tsx,json}`. Formatting-only
diffs from a manual run create noise in the review. It skips what
`.prettierignore` lists, which must include all generated code (see
[graphql-prisma.md](graphql-prisma.md)).
