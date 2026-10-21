# Tech Stack

Align all code suggestions, architecture recommendations, and technical solutions with this stack unless explicitly requested otherwise.

## Frontend

- **Next.js 16** with TypeScript (Pages Router, not App Router)
- **React 19**
- **Material UI (MUI)** as UI component library — styling via `styled()` with tagged template literals (`@emotion/styled`)
- **Apollo Client** for GraphQL communication (with generated hooks via GraphQL Code Generator)
- **React Hook Form** for forms
- **Zod** for schema validation
- **React Icons** for icons
- **react-i18next** for internationalization
- **Storybook 10** for component development and documentation
- **React Router v6** for client-side routing in the editor app

## Backend

- **NestJS 11** as the server framework
- **PostgreSQL 18** as the database
- **Prisma 7** as ORM — schema at `libs/api/prisma/schema.prisma`
- **Apollo Server** for GraphQL API (code-first approach with NestJS decorators)
- **Nest `ConsoleLogger`** for logging (JSON lines in production via
  `createNestLogger()` in `libs/utils/api/src/lib/otel/logger.ts`, bridged to
  OTLP when OTel logs are on; see `docker/observability/README.md`)
- **Sentry** for error tracking

## Monorepo & Build

- **Nx 23** as the monorepo build system
- **Webpack** for bundling
- **Babel / SWC** for transpilation
- **Node.js 22** runtime

## API Communication

- **GraphQL** is the standard for all API communication
- Schema is generated code-first from NestJS decorators (`@Resolver`, `@Query`, `@Mutation`, `@ResolveField`)
- GraphQL Code Generator produces TypeScript types and React hooks for the frontend
- REST APIs are only used for external CMS connections

## Testing

- **Vitest 4** as the test runner for every project (backend included); NestJS
  projects transform with swc via `createVitestConfig({nest: true})`
- **@nestjs/testing** for backend service/resolver unit tests
- **Testing Library** for frontend component tests
- Test commands: `pnpm run test`, `pnpm run test-backend`, `pnpm run test-website`
