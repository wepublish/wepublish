# Repo Map

Nx monorepo. **Business logic lives in `libs/`; `apps/` are thin deployables.**
If you are about to write logic inside `apps/`, stop and find the right lib.

This file answers *"where does my change go?"*. For the deeper architecture
(module layout, ports, service responsibilities) see `.ai/architecture.md`;
for concrete Nest/React code patterns see `.ai/conventions.md`; for local dev
commands and env vars see `.ai/development.md`.

## `libs/<domain>/<layer>`

The dominant shape. A domain (`article`, `comments`, `payment`, `membership`,
`event`, `page`, `user`, `banner`, `poll`, `paywall`, …) is split by layer:

| Layer | Stack | Contains |
| --- | --- | --- |
| `api` | NestJS + Prisma + Apollo Server | Resolvers, services, dataloaders, guards, GraphQL models |
| `website` | React + Emotion + MUI | Public-facing components, driven by Storybook stories |
| `editor` | React + React Router + Apollo | Admin/CMS UI for that domain |

Not every domain has all three. `libs/article` has `api` + `website`;
`libs/consent` has `api` + `editor`.

**A change usually belongs in one layer.** A new GraphQL field is `api`. Rendering
it is `website` or `editor`. If a change spans layers, do the `api` side first —
the schema and generated types flow downstream from it.

## Cross-cutting libs

| Lib | Role |
| --- | --- |
| `libs/api` | Prisma schema, migrations, seed. The data model root. |
| `libs/website` | The **Website Builder** — `builder/` provides `useWebsiteBuilder()`, the provider that lets each tenant override any component. Also `api/` (generated website GraphQL) and `admin/`. |
| `libs/editor` | Editor shell + `editor/api` (generated editor GraphQL) |
| `libs/ui` | Shared presentational primitives |
| `libs/utils` | Shared helpers, split `utils/api` and `utils/website` |
| `libs/testing` | Test helpers — see [testing.md](testing.md) |
| `libs/richtext` | Slate-based richtext, with `api`/`editor`/`website` variants |
| `libs/nest-modules`, `libs/permissions`, `libs/session`, `libs/authentication` | Backend plumbing, auth, permission guards |
| `libs/storybook` | Storybook config and shared mocks |

## `apps/`

| App | What it is |
| --- | --- |
| `api-example` | The GraphQL API deployable. **`apps/api-example/schema-v2.graphql` is the generated schema** that codegen reads. |
| `editor` | The admin SPA (React Router v6) |
| `media` | Media/image server |
| `website-example` | Reference tenant site |
| ~20 tenant sites | `bajour`, `tsri`, `hauptstadt`, `onlinereports`, `mannschaft`, `flimmer`, `cultur`, `zwoelf`, … — Next.js 16 (Pages Router) sites that theme and compose the website libs |

**Adding a feature for one tenant?** Build it in the relevant `libs/<domain>/website`
and let the tenant override it through the Website Builder. Copying components
into a tenant app forks them permanently.

## Imports & module boundaries

Everything is imported via the `@wepublish/*` aliases from `tsconfig.base.json`
(`@wepublish/article/api`, `@wepublish/website/builder`, …). Never use deep
relative paths across project boundaries — `@nx/enforce-module-boundaries` is
set to `error` and will fail lint.

Do not import from another project's internals; import from its entry point.

## Where to start for a given task

| Task | Start here |
| --- | --- |
| New DB field / table | `libs/api/prisma/schema.prisma` → migration → `libs/<domain>/api` |
| New GraphQL query/mutation | `libs/<domain>/api` resolver + model |
| Change public site rendering | `libs/<domain>/website` (+ a Storybook story) |
| Change admin UI | `libs/<domain>/editor` |
| Tenant-specific look | `apps/<tenant>` theme / Builder override |
| Payment/email/analytics integration | `libs/payment`, `libs/mail`, `libs/google-analytics` — see [external-services.md](external-services.md) |
