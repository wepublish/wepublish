# We.Publish Tech Stack

Align all code suggestions, architecture recommendations, and technical solutions with this stack unless explicitly requested otherwise.

## Frontend

- **Next.js 15** with TypeScript (Pages Router, not App Router)
- **React 18**
- **Material UI (MUI)** as UI component library — styling via `styled()` with tagged template literals (`@emotion/styled`)
- **Apollo Client** for GraphQL communication (with generated hooks via GraphQL Code Generator)
- **React Hook Form** for forms
- **Zod** for schema validation
- **React Icons** for icons
- **react-i18next** for internationalization
- **Storybook** for component development and documentation
- **React Router v6** for client-side routing in the editor app

## Backend

- **NestJS 11** as the server framework
- **PostgreSQL 17** as the database
- **Prisma 5** as ORM — schema at `libs/api/prisma/schema.prisma`
- **Apollo Server** for GraphQL API (code-first approach with NestJS decorators)
- **Pino** for structured logging
- **Sentry** for error tracking

## Monorepo & Build

- **Nx 20** as the monorepo build system
- **Webpack** for bundling
- **Babel / SWC** for transpilation
- **Node.js 22** runtime

## API Communication

- **GraphQL** is the standard for all API communication
- Schema is generated code-first from NestJS decorators (`@Resolver`, `@Query`, `@Mutation`, `@ResolveField`)
- GraphQL Code Generator produces TypeScript types and React hooks for the frontend
- REST APIs are only used for external CMS connections

## Testing

- **Jest 29** as the test runner
- **@nestjs/testing** for backend service/resolver unit tests
- **Testing Library** for frontend component tests
- Test commands: `npm run test`, `npm run test-backend`, `npm run test-website`

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

## Infrastructure as Code

- **Terraform** for infrastructure management

## Payments & External Services

- Payment providers: **Stripe**, **Mollie**, **Payrexx**, **Bexio**
- Email: **Mailgun**, **Mailchimp**, custom providers
- Media: S3-compatible storage with image transformation server
