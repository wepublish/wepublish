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
pnpm nx affected -t lint test --uncommitted

# On a feature branch, compare against the base branch instead:
pnpm nx affected -t lint test --base=origin/master
```

```bash
# 2a. Libs — typecheck through the build target
pnpm nx build <project>                    # e.g. membership-api

# 2b. Apps — not covered by lint, test, or any build target
pnpm tsc -p ./apps/<app> --noEmit          # single app
bash ./tools/typecheck-websites.sh        # all apps, as CI runs it
```

`nx build <project>` runs `tsc` across the whole library rather than only the
files a spec happens to import, so it is what catches a type error in a file no
test reaches — including a **stale generated client**. If `@prisma/client` is
missing fields you just added to `schema.prisma`, run `pnpm prisma generate`.
When a lib has no `build` target, add one where it makes sense.

If `--uncommitted` returns nothing but you know you changed files, you have
probably already staged or committed them — use `--base=origin/master`.

### Single project (while iterating)

```bash
pnpm nx test <project>            # e.g. article-api, article-website
pnpm nx lint <project>
pnpm nx test <project> --watch    # Vitest projects only
```

Nx project names are `<domain>-<layer>`. List them with `pnpm nx show projects`.

### Whole workspace (rarely needed)

```bash
pnpm run lint            # all projects
pnpm run test            # all projects, serial — many minutes
pnpm run test-backend    # NestJS/backend projects
pnpm run test-website    # *website* projects
```

Prefer `nx affected`. The full run is what CI is for; running it locally on every
change wastes minutes and tempts you into skipping verification entirely.

## What CI enforces

Your local gate mirrors these. A change that passes locally but fails here is
still a broken change.

| Workflow | Command | Covers |
| --- | --- | --- |
| `lint.yml` | `nx-scoped.sh -t lint` | ESLint |
| `test.yml` | `nx-scoped.sh -t test --exclude='*website*'`, then `--projects='*website*'` | All Vitest projects + coverage, with Postgres 17. Split over 4 shard jobs; each suite's Nx projects are balanced by spec-file count. Each shard runs backend (`--parallel=10`) then website (`--parallel=3`). The `Test` job only reports whether all shards passed |
| `website-typecheck.yml` | `typecheck-websites.sh $(nx-scoped.sh --list --type app)` | `tsc --noEmit` per app |

All three go through [tools/ci/nx-scoped.sh](../../tools/ci/nx-scoped.sh).
Pushes to `master` always run the full set. On PRs the
`NX_AFFECTED_SCOPE` repository variable picks the mode: `shadow` (the default
when unset) still runs everything, logs what `nx affected` would have picked,
and warns if a failing project was outside that set; `affected` runs only what
`nx affected` picks against the merge base from `nrwl/nx-set-shas`. Even in
`affected` mode the script runs the full set when the base doesn't resolve, or
when the diff touches non-Markdown files but affects no project besides the
root `wepublish` project. The three workflow files are `sharedGlobals` in
`nx.json`, so editing one marks every project affected.

A PR that only touches docs and AI tooling (`docs/`, `agent/`, `.agents/`,
`.ai/`, `.claude/`, any `*.md`, the editor rule files) skips lint, tests,
typecheck, CodeQL and the review image builds. The reusable
[changes.yml](../../.github/workflows/changes.yml) workflow runs
[tools/ci/changes.sh](../../tools/ci/changes.sh) to decide. The gate is a
job-level `if:`, never an `on: paths` filter: a workflow skipped by a path
filter leaves its required checks Pending forever, while a job skipped by `if:`
reports Success. Backend image builds are skipped by passing empty tags, so the
required `Docker backend images / …` checks still report. Both secret scans
always run. If the file list can't be read, everything runs.

Note `website-typecheck.yml` **excludes** `api-example`, `editor`, `bka`, `media`
— those are known not to typecheck cleanly. Do not "fix" that exclusion as a
side quest, but do not let a change you make add a new app to that list either.

Coverage is uploaded by [tools/ci/codecov-upload.sh](../../tools/ci/codecov-upload.sh):
one upload per Nx project, flagged with the project name, and a failed upload
fails the job. `.codecov.yml` turns on carryforward for every flag, so a project
that a run skipped keeps its last coverage instead of dropping to 0%. lcov paths
are repo-relative (`projectRoot: workspaceRoot` in `vitest.shared.ts`); without
that, every project's `src/index.ts` collides at Codecov.

## Reporting results

State the actual outcome:

- ✅ `pnpm nx affected -t lint test --uncommitted` — 4 projects, all passed
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
