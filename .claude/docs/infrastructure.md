# Infrastructure

## Cloud & Hosting

- **OpenShift** (self-hosted Kubernetes)
- **Helm** charts for deployment configuration
- **Argo CD / Flux** for GitOps-based deployments

## CI/CD

- **GitHub Actions** for all build, test, and deployment pipelines
- Review environments deployed per PR
- Docker images pushed to GitHub Container Registry (GHCR)

## Containerization

- **Docker** for local development (`docker-compose.yml`)
- Multi-stage Dockerfile for all production builds (API, editor, website, media, migration, storybook)
- **MinIO** as S3-compatible object storage for media in local dev

## Migration flow

The migration container (and `npm run migrate` locally) runs three steps in order:

1. `prisma migrate deploy` — applies `libs/api/prisma/migrations/`
2. seed (`run-seed.js` / `prisma db seed`)
3. **user-facing changelog sync** (`npm run changelog:sync`) — copies every entry
   from `libs/api/changelogs/` into the instance's `changelog.entries` table (see
   `libs/api/changelogs/README.md`; sync code lives in
   `libs/changelog/api/src/lib/sync/`). Every PR that changes something an editor
   user can notice should add a changelog entry folder there — scaffold it with
   `npm run changelog:create -- "Title" [--action-required]`, or let Claude Code
   draft it (en/de/fr) from the branch diff with `npm run changelog:generate`
   (uses the developer's local Claude Code login, no API key). Entries support
   translations via `changelog.<locale>.md` files (de/en/fr).
   The sync source files are compiled standalone in the Dockerfile seed stage
   (`docker/tsconfig.yaml_seed`), so they must stay dependency-free (node builtins
   plus `@prisma/client` only).

## Infrastructure as Code

- **Terraform** for infrastructure management
