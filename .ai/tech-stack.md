# We.Publish

Nx monorepo: NestJS/GraphQL API, a React admin editor, and ~20 Next.js tenant
websites, sharing code through `libs/`. **Different parts of this repo use
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
4. **Never edit generated code** — `graphql.ts`, `schema-v2.graphql`,
   `__generated__/`, Prisma client. Fix the source and regenerate:
   [graphql-prisma.md](.claude/docs/graphql-prisma.md).
5. **Never run Prettier.** A Husky pre-commit hook handles it.
6. **Check [gotchas.md](.claude/docs/gotchas.md) before "simplifying"** config,
   barrel files, or lint rules. Several things here look like cleanup
   opportunities and are load-bearing.
7. **Keep these docs current.** After landing a change, update the relevant file
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
| `libs/api/prisma` | — | `npx prisma migrate dev --name ...` |

Check for `jest.config.ts` vs `vitest.config.ts` in the project root before
writing a test — `jest.fn()` and `vi.fn()` are not interchangeable.

## Detailed guidance

Architecture, conventions and local dev live in `.ai/`; rules and workflow in
`.claude/docs/`.

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
