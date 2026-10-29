# Testing

**Every project runs on Vitest** — backend and frontend alike. Jest is gone from
the workspace: there are no `jest.config.ts` files left, and `jest.fn()` /
`jest.mock()` do not exist. Use `vi.fn()` and `vi.mock()` everywhere.

The one exception is browser E2E in `e2e/`: Gherkin features run by Playwright
via playwright-bdd against a live tenant website and editor (`E2E_APP` +
`E2E_ENV`, see `e2e/README.md`). It is an `e2e` target, not
`test`, so `nx affected -t test` and CI never run it — run `pnpm run e2e` by
hand or the manual `on-demand-e2e.yml` workflow. Which journeys a change
needs: the `gherkin-from-changes` skill; how to write steps: the
`gherkin-to-playwright` skill.

Each project has a `vitest.config.ts` that delegates to the root
`vitest.shared.ts`:

| Project pattern                                                                | `createVitestConfig` options                        |
| ------------------------------------------------------------------------------ | --------------------------------------------------- |
| `libs/*/api`, `libs/nest-modules`, `libs/permissions`, `libs/testing` (NestJS) | `environment: 'node'`, `react: false`, `nest: true` |
| `libs/*/editor`, `libs/utils`, `apps/<tenant>` | `environment: 'happy-dom'` (default), `react: true` |
| `libs/*/website`, `libs/ui`, `libs/website`, `libs/tenants/*` | the same, plus `website: true` |

NestJS projects **must** pass `nest: true`. It switches the transform to swc
(es2021 + `decoratorMetadata`) and loads `vitest.setup-nest.ts`. Without it,
esbuild drops `design:paramtypes`, so Nest constructor injection (e.g.
`constructor(private prisma: PrismaClient)`) silently resolves to `undefined` in
`Test.createTestingModule`, and code-first GraphQL fields without an explicit
type function fail. When setting up a new NestJS lib, copy the setup from
`libs/consent/api` (`vitest.config.ts`, the `project.json` test target and
`tsconfig.spec.json`).

`libs/block-content/api`, `libs/image/api` and `libs/mocks/website` are in
`.nxignore` (load-bearing: circular imports), so `nx test` and `nx affected`
skip their specs — run `pnpm vitest run --config libs/<lib>/vitest.config.ts`
yourself. CI runs them through that same command (`.github/workflows/test.yml`),
so their specs belong next to the code, not in another lib.

## Test-driven development is mandatory

For any new feature or bugfix, in this order:

1. **Write the test first.** It describes the behaviour you are about to build.
2. **Run it and confirm it FAILS** — and fails for the _right reason_ (assertion
   mismatch, not a typo or an import error). A test that passes before the
   implementation exists is testing nothing.
3. **Implement the minimum** that makes it pass.
4. **Run it again and confirm it passes.**
5. Refactor if needed, re-running the test each time.

Never write implementation code before a failing test exists. If you catch
yourself having written the implementation first, delete it, write the test,
watch it fail, then restore the implementation.

For a bugfix, the failing test **must reproduce the reported bug**. If you cannot
write a test that fails against the current code, you have not yet understood
the bug — go back to diagnosis rather than guessing at a fix.

### When a test is genuinely not the right tool

Skipping is allowed only for: generated code (`__generated__`, `graphql.ts`),
Prisma migrations, pure config (`next.config.js`, `project.json`, Helm values),
and one-line styling/copy changes. **Say explicitly that you skipped tests and
why.** Never skip silently.

If the code is hard to test, that is information about the design, not a licence
to skip. Prefer extracting the logic into a testable function over asserting
nothing.

## File conventions

- Specs are named `*.spec.ts` / `*.spec.tsx` — **never** `*.test.ts`. There are
  zero `.test.` files in this repo; a `.test.ts` file will be silently ignored.
- Specs are **colocated** next to the source file:
  `libs/article/api/src/lib/article.service.ts` →
  `libs/article/api/src/lib/article.service.spec.ts`.
- Nx project names are `<domain>-<layer>`: `article-api`, `article-website`,
  `consent-editor`. This is the name you pass to `nx test`.

## Shared helpers — `@wepublish/testing`

Prefer these over hand-rolling equivalents:

```ts
import { createMock, actWait, mockDate } from '@wepublish/testing';
// Prisma helpers are NOT re-exported from the root, to keep @prisma/client
// out of frontend test bundles. Import them from the subpath:
import { createPrismaClient, clearDatabase } from '@wepublish/testing/prisma';
```

`createMock(SomeService)` returns a mock whose every method throws
`Method x not implemented` until you stub it — so an unstubbed call fails loudly
instead of silently returning `undefined`.

## Per-technology patterns

### NestJS API libs (Vitest, `nest: true`)

Use `Test.createTestingModule` and inject hand-rolled Prisma mocks typed against
the real client. Freeze time with fake timers when the code under test stamps
dates.

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { Mock } from 'vitest';

describe('ArticleService', () => {
  let service: ArticleService;
  let prismaMock: {
    article: { [m in keyof PrismaClient['article']]?: Mock };
  };

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
  });
  afterAll(() => vi.useRealTimers());

  beforeEach(async () => {
    prismaMock = { article: { findMany: vi.fn(), create: vi.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(ArticleService);
  });
});
```

Mocks are **not** auto-cleared between tests — add `vi.clearAllMocks()` to
`beforeEach` whenever a mock outlives a single test.

Cover resolvers, services, guards and permission checks. Permission and paywall
logic is security-relevant — test the **deny** path, not just the allow path.

Resolver specs go one level up, as a full GraphQL e2e: `GraphQLModule.forRoot`
with `autoSchemaFile: true` driven by `supertest` against the Nest app (see
`libs/consent/api/.../consent.resolver.spec.ts`). Start the app with
`await app.listen(0, '127.0.0.1')`, not `app.init()`, and close it in the
matching `after*` hook: supertest's own `listen(0)` can land on another
process's port on macOS and hang a random test
([gotchas](gotchas.md#️-a-spec-must-listen-on-127001-before-supertest-touches-the-server)).
Note that `@Permissions` and
`@Authenticated` are metadata-only without the globally registered guard, so
operations run **unguarded** in these tests — asserting a deny path here proves
nothing. When a resolver uses `@CurrentUser()`, inject a fake session through
the GraphQL `context` option.

### Website libs (Vitest + Testing Library)

Website components are tested with a `<component>.spec.tsx` next to the
component, in happy-dom. `createVitestConfig({ website: true })` loads
jest-dom, German i18next, the zod error map, date-fns `de` and stand-ins for
`next/router`, Turnstile and hCaptcha. Every `libs/*/website`, `libs/ui`,
`libs/website` and `libs/tenants/*` project has it on.

Render with `renderWithProviders` from `@wepublish/mocks/website`. It gives
the component the theme, the website builder, a fresh Apollo cache, a session
(`user`, logged out by default), `next/router` (`router`), the locale (`'de'`
or `'fr'`), the block contexts and a `tenant`. Fake API data comes from the
factories in the same library, and Apollo responses from
`mockOperation(Document, { variables, data })` with the exact variables.
Background queries (settings, challenge, primary banner) take the
`mock*Query()` helpers. Examples for each option:
[libs/mocks/website/README.md](../../libs/mocks/website/README.md).

A GraphQL operation without a matching mock fails the test, and the message
names it. Queries use `errorPolicy: 'all'` and mutations reject on errors, as
in production. An "Unhandled Rejection" in the output means the component
awaits a mutation without catching it. That is a bug in the component, so fix
the component.

Query by role, by label, or by text through `t('key')` from `i18next`. Never
query by hard-coded German or CSS classes; text a component hard-codes without
a key is the only exception. Cover each render state (loading, error, empty,
paywalled) and each interaction, asserting the exact callback arguments or
mutation variables. happy-dom computes no layout and skips complex selectors
such as `:not(:is(...))`, so `getBoundingClientRect`, fonts and CSS ordering
can't be tested; leave those cases out.

No `act()` around `render`, `userEvent`, `findBy*` or `waitFor`, because they
already wait. Use `act()` only around imperative calls outside React (a ref's
`reset()`), `hydrateRoot`, direct hook state updates and fake timer advances.

Tenants: pass `{ tenant: bajourTenant }`. Translation overrides load
asynchronously, so call `await applyTenantTranslations(tenant)` in `beforeAll`
and `await resetTranslations()` in `afterAll`. Each tenant library has a
config spec, an `index.spec.ts` that catches circular imports, and a
`<tenant>.spec.tsx` that renders a page as that tenant; see
[libs/tenants/README.md](../../libs/tenants/README.md).

### Editor libs (Vitest + Apollo mocks)

The editor is a React Router SPA talking to Apollo. Wrap in `BrowserRouter` and
`MockedProvider`, and stub `getApiClientV2` when the component uses the v2 client:

```tsx
import { MockedProvider, MockLink } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import * as v2Client from '@wepublish/editor/api';

vi.spyOn(v2Client, 'getApiClientV2').mockReturnValue(
  new ApolloClient({ cache: new InMemoryCache(), link: new MockLink([], true) })
);
```

### Next.js tenant apps (Vitest)

`apps/*` are per-tenant Next.js sites that mostly compose website libs. Business
logic belongs in a lib and is tested there. What the app itself needs is a
**typecheck** — see [verification.md](verification.md).

## Snapshots

36 snapshot directories exist, mostly for website components. Update them with:

```bash
pnpm nx test <project> --configuration=update    # single project
pnpm run test-u                                  # entire workspace
```

**Read the snapshot diff before accepting it.** An updated snapshot that you did
not intend to change is a regression you just approved.

## Environment

Backend tests need these (CI sets them; mirror them locally if a test hits the DB):

```
DATABASE_URL=postgresql://postgres:test@localhost:5432/wepublish_test?schema=public
JWT_PRIVATE_KEY / JWT_PUBLIC_KEY   # ed25519 pair, see .github/workflows/test.yml
```

Both setup files delete `REDIS_URL`/`REDIS_KEY_PREFIX`, so tests use the
in-memory cache even though nx loads them from `.env` — see [gotchas.md](gotchas.md).

`pnpm run start:docker` brings up the local Postgres. Vitest sets `TZ=UTC`
globally via `vitest.setup-tests.ts` — do not write tests that depend on local time.

## Running tests

See [verification.md](verification.md) for the full gate you must pass before
claiming a change is complete.
