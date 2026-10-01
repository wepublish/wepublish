# We.Publish Development Guide

## Prerequisites

- Node.js 22
- Docker & Docker Compose
- npm (comes with Node.js)

## Local Setup

```bash
npm i                        # Install dependencies
npm run start:docker         # Start PostgreSQL + MinIO (S3) + Dragonfly
npm run migrate              # Run Prisma migrations + seed
npm run watch                # Start all services (API, editor, media, website)
```

## Local Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:4000 | GraphQL API (NestJS) — the `api-example` app |
| Editor | http://localhost:3000 | Admin CMS UI — Vite dev server, client-rendered |
| Website | http://localhost:4200 | Example website frontend |
| Media | http://localhost:4100 | Media/image server |
| PGAdmin | http://localhost:8000 | Database admin UI |
| MinIO | http://localhost:9001 | S3 storage console |
| Dragonfly | redis://localhost:6379 | Redis-compatible cache behind `KvTtlCacheModule`; admin `default`/`dragonfly` |

`docker-compose.yml` also defines `mailpit` for catching outbound mail locally,
and a `migration` service used by the full-stack `npm run try` path.

This table is the canonical one. For *when* to start these services and in what
order, see [dev-environment.md](../.claude/docs/dev-environment.md).

## Watch Individual Services

```bash
npm run watch:api-example    # Only the API
npm run watch:editor         # Only the editor
npm run watch:website-example # Only the website
npm run watch:media          # Only the media server
```

## Database

```bash
npm run migrate                               # Apply migrations + seed
npx prisma migrate dev --name <name>          # Create a new migration
npx prisma generate                           # Regenerate Prisma client
npx prisma studio                             # Open Prisma Studio (DB browser)
```

The Prisma schema is at `libs/api/prisma/schema.prisma`.

## GraphQL Code Generation

```bash
npm run generate-api         # Regenerate TypeScript types + hooks from GraphQL schema
```

Configuration: `codegen.yml`

## Testing

```bash
npm run test                 # All tests
npm run test-backend         # Backend tests (parallel, excludes website)
npm run test-website         # Website tests (parallel=3)
npm run test-u               # All tests with snapshot update
nx test <project-name>       # Test a specific library/app
```

Two runners are in play and they are **not** interchangeable — read
[testing.md](../.claude/docs/testing.md) before writing a test. For which of
these to run before claiming a change is done, see
[verification.md](../.claude/docs/verification.md).

## Linting & Formatting

```bash
npm run lint                 # ESLint across all projects
```

**Do not run Prettier manually.** A Husky `pre-commit` hook runs
`pretty-quick --staged`. The `npm run prettier` script exists for tooling, but
invoking it by hand reformats the whole repo and buries your change in an
unrelated diff.

## Building

```bash
npm run build                # Build all projects
nx build <project-name>      # Build a specific project
```

## Docker (Full Stack)

```bash
npm run try                  # Start full stack via docker-compose (database, api, editor, media, storage)
```

## Nx Commands

```bash
nx graph                     # Visualize dependency graph
nx affected --target=test    # Run tests only for affected projects
nx run <project>:<target>    # Run a specific target
```

## Creating a New Library

```bash
nx g @nx/nest:library <name> --directory=libs/<domain>/api
nx g @nx/react:library <name> --directory=libs/<domain>/website
```

Follow existing module patterns: create module, service, resolver, and model files. Register in the app module at `apps/api-example/src/nestapp/app.module.ts`.

## Environment Variables

Key variables for local development (set via `.env` or docker-compose):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://postgres@localhost:5432/wepublish?schema=public` | PostgreSQL connection |
| `JWT_SECRET_KEY` | `ThisIsSuperSecret` | JWT signing key |
| `API_URL` | `http://localhost:4000` | Backend API URL |
| `MEDIA_SERVER_URL` | `http://localhost:4100` | Public media URL |
| `MEDIA_SERVER_TOKEN` | `secret` | Media server auth token |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | from `.env` | MinIO credentials |
| `REDIS_URL` | `redis://wepublish-local:…@localhost:6379/0` | Dragonfly for `KvTtlCacheModule`; unset = in-memory cache |
| `REDIS_KEY_PREFIX` | `wepublish-local` | Required with `REDIS_URL`; every key must start with it |
