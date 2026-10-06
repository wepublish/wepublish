# We.Publish

Nx monorepo: NestJS/GraphQL API, a React admin editor, and ~20 tenant
websites, sharing code through `libs/`. All tenant sites are Next.js 16 (Pages
Router) except `apps/gruppetto`, which runs on TanStack Start — read
[tanstack-start-migration.md](docs/tanstack-start-migration.md) before working
on it. **Different parts of this repo use
different test runners and different verification commands** — read
[repo-map.md](.claude/docs/repo-map.md) to work out which stack you are in
before you start.

## Non-negotiables

1. **Test-driven development.** Write the test first, run it, watch it fail for
   the right reason, then implement. Never write implementation before a failing
   test exists. Details and per-stack patterns:
   [testing.md](.claude/docs/testing.md).
2. **Verify before claiming done.** Run `npx nx affected -t lint test --uncommitted`
   (plus `tsc --noEmit` if you touched `apps/`) and read the output. Never say
   "done", "fixed", or "tests pass" without having run the command in this
   session: [verification.md](.claude/docs/verification.md).
3. **Never commit.** The user commits. See
   [commit-rules.md](.claude/docs/commit-rules.md).
4. **Never write plan files.** Plans, brainstorms, checklists and progress notes
   belong in the conversation, not the repo — including anything an agent skill
   would write to `docs/plans/`, `.plans/`, `specs/` or `thoughts/`. Do the
   thinking and put it in the reply. Scratch files go in a temp directory, never
   in the working tree.
5. **Never edit generated code** — `graphql.ts`, `schema-v2.graphql`,
   `__generated__/`, Prisma client. Fix the source and regenerate:
   [graphql-prisma.md](.claude/docs/graphql-prisma.md).
6. **Never run Prettier.** A Husky pre-commit hook handles it.
7. **Check [gotchas.md](.claude/docs/gotchas.md) before "simplifying"** config,
   barrel files, or lint rules. Several things here look like cleanup
   opportunities and are load-bearing.
8. **Keep these docs current.** After landing a change, update the relevant file
   when the change adds or removes an endpoint, collection, command, env var,
   integration, or convention — or makes something written here wrong (paths
   renamed, a framework swapped). Skip the update for routine bug fixes,
   refactors that don't change shape, dependency bumps, and copy/UI tweaks. The
   test: *would the next agent be misled by the current text?* If yes, fix it in
   the same change. If you burned real time on a subtle failure, add a
   [gotchas.md](.claude/docs/gotchas.md) entry so nobody repeats it.

## Right runner, right command

| You are editing | Runner | Verify with |
| --- | --- | --- |
| `libs/*/api` (NestJS) | Jest | `npx nx test <domain>-api` |
| `libs/*/website`, `libs/*/editor`, `libs/ui`, `libs/utils` | Vitest | `npx nx test <domain>-website` |
| `apps/<tenant>` (Next.js) | Vitest + tsc | `npx tsc -p ./apps/<app> --noEmit` |
| `apps/gruppetto` (TanStack Start) | Vitest | `npx nx run gruppetto:typecheck` |
| `libs/api/prisma` | — | `npx prisma migrate dev --name ...` |

Check for `jest.config.ts` vs `vitest.config.ts` in the project root before
writing a test — `jest.fn()` and `vi.fn()` are not interchangeable.

## Detailed guidance

Every file below is loaded into **every** session. `.ai/` holds stable
reference — architecture, repo-specific patterns, commands, env vars.
`.claude/docs/` holds agent behaviour — what to do, what never to do, and what
to run before claiming something is done.

**Keep the whole set under ~60 KB** (it is ~60 KB today). This is context every
task pays for, so a new doc earns its place by changing what an agent *does*.
Prose restating what a competent reader already knows about Nest, React or
Prisma does not. Prefer editing an existing file over adding one, and when a
fact would land in two files, put it in one and link to it — duplicated facts
drift, and two documents disagreeing is worse than neither existing.

@.ai/architecture.md
@.ai/conventions.md
@.ai/development.md
@.claude/docs/repo-map.md
@.claude/docs/tech-stack.md
@.claude/docs/testing.md
@.claude/docs/verification.md
@.claude/docs/gotchas.md
@.claude/docs/dev-environment.md
@.claude/docs/graphql-prisma.md
@.claude/docs/code-style.md
@.claude/docs/infrastructure.md
@.claude/docs/external-services.md
@.claude/docs/commit-rules.md

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
