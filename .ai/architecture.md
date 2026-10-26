# We.Publish Architecture

## Overview

We.Publish is a headless CMS platform for publishers, built as an Nx monorepo. It consists of a GraphQL API backend, an admin editor UI, a media server, and multiple website frontends for different publishers.

## Directory Structure

```
/
├── apps/               # Deployable applications
│   ├── api-example/    # NestJS GraphQL API server (main backend)
│   ├── editor/         # React CMS admin panel (Vite SPA, React Router)
│   ├── media/          # Express media server (image transform + S3)
│   ├── website-example/# Reference Next.js website frontend
│   └── <publisher>/    # Publisher-specific websites (bajour, tsri, mannschaft, etc.)
├── libs/               # Reusable libraries (~50 modules)
│   ├── api/            # Core API library (Prisma schema, shared models)
│   ├── ui/             # Shared MUI component library
│   ├── nest-modules/   # NestJS utilities (PrismaModule, URLAdapter)
│   └── <domain>/       # Domain modules (article, payment, membership, etc.)
├── deployment/         # Deployment scripts
├── helm/               # Kubernetes Helm charts
└── docker/             # Docker build utilities
```

## Applications

| App | Tech | Port | Purpose |
|-----|------|------|---------|
| `api-example` | NestJS + Apollo Server | 4000 | GraphQL API backend |
| `editor` | Vite + React + React Router (client-rendered; Express host) | 3000 | Admin CMS interface |
| `media` | Express | 4100 | Image upload, transformation, S3 storage |
| `website-example` | Next.js | 4200 | Reference website frontend |

**The editor is client-rendered — there is no SSR.** `nx build editor` produces
two bundles: `browser` (the Vite client bundle) and `server`. The server is a
small Express host ([apps/editor/server.ts](apps/editor/server.ts), whose app is
built in [src/server-app.ts](apps/editor/src/server-app.ts)) that serves the
static browser bundle and, in `src/main.server.ts`, splices a
`<script type="application/json">` settings blob into `index.html` before
`</head>` — that is how runtime env (`API_URL`, `SENTRY_DSN`, `APP_NAME`) reaches
the client. It does not render React. Do not mistake `server.ts` for SSR, and do
not add `renderToString` there expecting the app to hydrate.

## Library Organization

Libraries follow a domain-driven structure. Each domain module typically has sub-packages:

```
libs/<domain>/
├── api/        # Backend: NestJS module, service, resolver, GraphQL models
├── editor/     # Editor-specific components and hooks
└── website/    # Website-specific components and hooks
```

### Core Libraries

| Library | Purpose |
|---------|---------|
| `api` | Prisma schema, shared database types, core models |
| `nest-modules` | PrismaModule, URLAdapter, shared NestJS providers |
| `authentication/api` | JWT auth, `@Public()`, `@CurrentUser()` decorators |
| `permissions/api` | RBAC: `@Permissions(CanCreateArticle)`, permission guards |
| `ui` | Shared MUI component library (buttons, alerts, modals, typography) |
| `utils/api` | Sorting, filtering, pagination helpers, `@PrimeDataLoader()` |
| `block-content` | Rich text blocks and content rendering (Slate-based) |

### Content Domain Libraries

`article`, `page`, `image`, `author`, `tag`, `category`, `navigation`, `comments`, `poll`, `gate` (with the `paywall`, `banner` and `content-gate` facades), `richtext`, `feed`, `newsletter`

**Sitemaps:** every website serves `/api/sitemap` (plus `/api/sitemap/[chunk]`:
`news`, `pages`, `articles-YYYY` per past year, `articles-YYYY-MM` per month
of the current year in `index` mode) through
`createSitemapHandlers` from `@wepublish/feed/website`. Per-media settings
(`mode: 'single' | 'index'`, `pageUrls`, `homepageSlug`, `filterArticle`, url
hooks) live in `apps/<app>/src/sitemap.ts`. Fetch with the lean `Sitemap*`
documents (`libs/website/api/src/lib/schemas/sitemap.graphql`), never
`ArticleList`, and leave peered articles out. `generateSitemap` is deprecated.

**Gates** (`libs/gate/{api,editor}`): paywalls, content gates and banners
are one `Gate` model (table `gates`) with a `mode` (`PAYWALL`,
`CONTENT_GATE`, `BANNER`). `GateService` is the only code that touches
`prisma.gate`: per-mode defaults and validation, one active content gate,
the primary banner (`audienceRanking` / `matchesAudience` in `audience.ts`)
and the `content:gates` cache. The editor manages all three through one CRUD
API (`gates(mode)`, `gate`, `createGate`, `updateGate`, `deleteGate`), each
mode with its own form. The website still reads `Article.paywall`,
`paywall(s)`, `primaryBanner`, `banner(s)` and `Article.contentGate`: the
`paywall`, `banner` and `content-gate` api libs are read-only facades that map
a `Gate` onto those unchanged types (`toPaywall`, `toBanner`,
`toContentGate`). A paywall's subscribe url and a content gate's CTA are the
gate's `PRIMARY` action; `hideContentAfter` is `previewBlocks`.

**Content gates** (`libs/content-gate/{api,editor,website}`): one active
content gate meters every article without a paywall (opt out per article with
`Article.contentGateDisabled`). The **api** decides *who* is gated (audience
`LOGGED_OUT` or `UNSUBSCRIBED`, login, subscription) and, for them, cuts
`ArticleRevision.blocks` down to `previewBlocks` and sets `contentGated`. The
**website** decides *when*: `useContentGate` keeps the read count in
localStorage (`content-gate-meter`), picks free / soft / hard, and only for
free and soft fetches the rest with `blocks(unlockContentGate: true)`.
`ArticleContainer` renders the gate as the first child of `Article`, so tenant
`Article` overrides need no changes.

### Business Domain Libraries

`membership`, `payment`, `user-subscription`, `member-plan`, `crowdfunding`, `mail`, `event`, `consent`

### Infrastructure Libraries

`kv-ttl-cache`, `tracking-pixel`, `media-transform-guard`, `google-analytics`, `health`, `system-info`, `stats`, `session`, `settings`

## Database

- **PostgreSQL 18** via **Prisma 7**
- Schema: `libs/api/prisma/schema.prisma`
- Uses Prisma views for article revision states: `ArticleRevisionPublished`, `ArticleRevisionPending`, `ArticleRevisionDraft`
- Full-text search via Prisma preview feature
- Metadata stored as key-value `Property` relations on articles, pages, subscriptions, users

## GraphQL Architecture

- **Code-first** approach using NestJS `@nestjs/graphql` decorators
- Each domain module defines its own models, resolvers, and services
- **Dataloader pattern** used extensively to prevent N+1 queries (e.g., `ArticleDataloaderService`)
- Generated schema: `schema-v2.graphql`
- Frontend hooks generated via **GraphQL Code Generator** (`codegen.yml`)

## Data Flow

```
Frontend (Apollo Client)
  → GraphQL Request
    → NestJS Resolver (auth/permission guards)
      → Service (business logic)
        → Prisma (database query)
          → PostgreSQL
```

## Authentication & Authorization

- JWT-based authentication
- Decorators: `@Public()` (no auth), `@CurrentUser()` (inject session), `@Permissions(...)` (RBAC check)
- Permission constants: `CanCreateArticle`, `CanDeleteArticle`, `CanPublishArticle`, `CanGetArticle`, etc.
- `@PreviewMode()` for draft content access
- API keys (`libs/api-token`, editor «API Keys»): `Authorization: Bearer wep_…`, stored hashed, scopes are permission IDs, they expire (≤ 3 years) and the API announces the expiry in the `wepublish-api-key-expiration` response header. Never send them with the peering user agent: that path only reads peering tokens and refuses the key.
- External apps (`libs/external-apps`) that read the API bring their own API key with the minimal scopes, kept in the app. `ExternalApps.apiTokenId` records which key, so the Apps dashboard and the app's edit page warn 30 days before it expires and once it is expired or revoked. The key is linkable and its metadata visible only to editors who see it in the API keys list.
- Per-medium feature toggles (`libs/features`, state from We.Publish One): `@Feature('key')` in the API, `useFeature` / `FeatureControl` in the editor — see [conventions.md](conventions.md#feature-toggles-per-medium)

## Import Aliases

All imports use `@wepublish/` path aliases defined in `tsconfig.base.json`:

```typescript
import { ArticleModule } from '@wepublish/article/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { Button } from '@wepublish/ui';
```
