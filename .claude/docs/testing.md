# Testing

- **Backend (NestJS) libs run on Jest**, everything else runs on Vitest (see the
  comment in `jest.preset.js`). Do not give a NestJS lib a `vitest.config.ts`:
  Vitest transpiles with esbuild, which does not emit `design:paramtypes`
  decorator metadata, so Nest constructor injection (e.g.
  `constructor(private prisma: PrismaClient)`) silently resolves to `undefined`
  in `Test.createTestingModule` and code-first GraphQL fields without an explicit
  type function fail. Copy the Jest setup from `libs/consent/api`
  (`jest.config.ts`, `project.json` test target, `tsconfig.spec.json`).
- Service specs: hand-rolled mock Prisma object (`jest.fn()` per delegate method)
  provided via `{ provide: PrismaClient, useValue: mockPrisma }`, plus
  `jest.clearAllMocks()` in `beforeEach` (mocks are not auto-cleared).
- Resolver specs: full GraphQL e2e style — `GraphQLModule.forRoot` with
  `autoSchemaFile: true` + `supertest` against the Nest app (see
  `libs/consent/api/.../consent.resolver.spec.ts`). Guards from `@Permissions` /
  `@Authenticated` are metadata-only without the globally registered guard, so
  operations execute unguarded in these tests; inject a fake session via the
  GraphQL `context` option when a resolver uses `@CurrentUser()`.
- Test commands: `npm run test`, `npm run test-backend`, `npm run test-website`,
  or `nx test <project>`.
