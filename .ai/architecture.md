# We.Publish Architecture

## Overview

We.Publish is a headless CMS platform for publishers, built as an Nx monorepo. It consists of a GraphQL API backend, an admin editor UI, a media server, and multiple website frontends for different publishers.

## Directory Structure

```
/
├── apps/               # Deployable applications
│   ├── api-example/    # NestJS GraphQL API server (main backend)
│   ├── editor/         # React/Next.js CMS admin panel
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
├── docker/             # Docker build utilities
└── docs/               # Project documentation
```

## Applications

| App | Tech | Port | Purpose |
|-----|------|------|---------|
| `api-example` | NestJS + Apollo Server | 4000 | GraphQL API backend |
| `editor` | Next.js + React | 3000 | Admin CMS interface |
| `media` | Express | 4100 | Image upload, transformation, S3 storage |
| `website-example` | Next.js | 4200 | Reference website frontend |

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

`article`, `page`, `image`, `author`, `tag`, `category`, `navigation`, `comments`, `poll`, `banner`, `richtext`, `feed`

### Business Domain Libraries

`membership`, `payment`, `user-subscription`, `member-plan`, `crowdfunding`, `mail`, `event`, `consent`

### Infrastructure Libraries

`kv-ttl-cache`, `tracking-pixel`, `media-transform-guard`, `google-analytics`, `health`, `system-info`, `stats`, `session`, `settings`

## Database

- **PostgreSQL 17** via **Prisma 5**
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

## Import Aliases

All imports use `@wepublish/` path aliases defined in `tsconfig.base.json`:

```typescript
import { ArticleModule } from '@wepublish/article/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { Button } from '@wepublish/ui';
```
