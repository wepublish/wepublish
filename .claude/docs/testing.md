# Testing

**This is a monorepo with two test runners.** Which one you use is decided by the
project you are touching, never by preference. Get this wrong and the test file
will not run at all.

| Project pattern | Runner | Globals | Config file |
| --- | --- | --- | --- |
| `libs/*/api` (NestJS), `libs/nest-modules`, `libs/permissions`, `libs/user`, `libs/testing` | **Jest 30** | `jest.fn()`, `jest.mock()` | `jest.config.ts` |
| `libs/*/website`, `libs/*/editor`, `libs/ui`, `libs/utils`, `libs/richtext`, `libs/errors`, `apps/<tenant>` | **Vitest** | `vi.fn()`, `vi.mock()` | `vitest.config.ts` |

Exceptions that look like backend but are Vitest: `libs/document/api`,
`libs/richtext/api`, `libs/media-transform-guard/api`.

**Always check for `jest.config.ts` vs `vitest.config.ts` in the project root
before writing a test.** NestJS stays on Jest until its next major release —
do not "helpfully" migrate a Jest project to Vitest.

## Test-driven development is mandatory

For any new feature or bugfix, in this order:

1. **Write the test first.** It describes the behaviour you are about to build.
2. **Run it and confirm it FAILS** — and fails for the *right reason* (assertion
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

### NestJS API libs (Jest)

Use `Test.createTestingModule` and inject hand-rolled Prisma mocks typed against
the real client. Freeze time with fake timers when the code under test stamps
dates.

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

describe('ArticleService', () => {
  let service: ArticleService;
  let prismaMock: {
    article: { [m in keyof PrismaClient['article']]?: jest.Mock };
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
  });
  afterAll(() => jest.useRealTimers());

  beforeEach(async () => {
    prismaMock = { article: { findMany: jest.fn(), create: jest.fn() } };

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

Cover resolvers, services, guards and permission checks. Permission and paywall
logic is security-relevant — test the **deny** path, not just the allow path.

### Website libs (Vitest + Storybook)

Website components are driven by Storybook stories. The standard spec composes
every story and renders it, so adding a story automatically adds coverage:

```tsx
import { render } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from './tag.stories';

const storiesCmp = composeStories(stories);

describe('Tag', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
```

**Add a story for each new state** (loading, error, empty, paywalled) — that is
how you get real coverage here, rather than by writing more `it` blocks. For
behaviour that is not a render state (event handlers, hooks, data mapping),
write a normal Testing Library test asserting on user-visible output.

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

35 snapshot directories exist, mostly for website components. Update them with:

```bash
npx nx test <project> --configuration=update    # single project
npm run test-u                                  # entire workspace
```

**Read the snapshot diff before accepting it.** An updated snapshot that you did
not intend to change is a regression you just approved.

## Environment

Backend tests need these (CI sets them; mirror them locally if a test hits the DB):

```
DATABASE_URL=postgresql://postgres:test@localhost:5432/wepublish_test?schema=public
JWT_PRIVATE_KEY / JWT_PUBLIC_KEY   # ed25519 pair, see .github/workflows/test.yml
```

`npm run start:docker` brings up the local Postgres. Vitest sets `TZ=UTC`
globally via `vitest.setup-tests.ts` — do not write tests that depend on local time.

## Running tests

See [verification.md](verification.md) for the full gate you must pass before
claiming a change is complete.
