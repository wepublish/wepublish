# Website mocks

`@wepublish/mocks/website` is everything a website spec needs besides the
component under test:

- small functions that build fake API data: `mockArticle()`, `mockComment()`,
  `mockSubscription()`, `mockNavigation()`, `mockBlockContent()` and so on. Use
  them instead of writing objects by hand, so every spec gets data that looks
  like a real API response;
- Apollo mocks (`mockOperation` and the background query helpers);
- `renderWithProviders`, which renders a component in Vitest (happy-dom) with
  everything a page around it would provide.

## What a factory returns

Each factory returns exactly the GraphQL fragment it is named after, taken from
`libs/website/api/src/lib/schemas/*.graphql`. `mockArticle()` returns a
`FullArticleFragment`, `mockSensitiveDataUser()` a
`FullSensitiveDataUserFragment`, and so on. That means:

- every field the fragment selects is there, including nullable ones (they are
  `null`, never missing);
- every nested object has the right `__typename`;
- there are no extra fields the fragment doesn't select.

Specs feed these objects to Apollo, which is picky about them. If a field is
missing, Apollo writes an incomplete object to the cache. If `__typename` is
missing, Apollo can't match fragments on that object, so it doesn't write the
fragment's fields at all. Either way the component renders wrong data or refetches,
and nothing shows up in the console.

The return types are annotated with the generated fragment types and there are
no `as` casts, so when a `.graphql` file changes and a factory falls behind,
the type check fails. The one exception is rich text: the `RichtextJSONDocument`
type is stricter than what TipTap actually stores (for example `null` attribute
values), so `mockRichText()` goes through a single `toRichtext` helper.

## Overrides

Every factory takes an optional object with any fields of its fragment. What
you pass wins:

```ts
mockArticle({ publishedAt: null, slug: 'my-article' });
mockEvent({ location: null, endsAt: null });
mockSubscription({ deactivation: mockSubscriptionDeactivation() });
```

- `null` means null. `mockArticle({ publishedAt: null })` returns an article
  with `publishedAt: null`.
- `undefined` means "use the default". This keeps `undefined` out of the data,
  since Apollo treats it like a missing field.

Some defaults depend on other fields, and those links survive overrides:
`mockPoll()` gives its answers the poll's `id`, `mockInvoice({ subscription })`
sets `subscriptionID` and takes its `total` from the subscription's
`monthlyAmount`, and `mockComment()` points its user and overridden ratings at
the same answer as its first calculated rating.

`mockImage` and `mockPeerImage` also accept a string:
`mockImage('1')` adds `?key=1` to every URL so several images in one spec show
different pictures.

## Determinism

Mock data has to be the same on every run, or text assertions become flaky. So:

- `faker` is seeded and its reference date is fixed (2023-01-01) in
  `src/lib/faker.ts`, which every factory imports. Seeding happens once, when
  the mocks are first imported.
- Ids come from `faker.string.nanoid()`, never from the `nanoid` package, which
  can't be seeded.
- Dates are fixed strings (`MOCK_REFERENCE_DATE`, `MOCK_FAR_FUTURE_DATE`),
  never `new Date()`.

The values only depend on the order of factory calls since the seed. A spec
file that builds its fixtures the same way gets the same data every time. If a
test needs to start from a clean sequence, call `seedMocks()` first.

## Helpers for lists

`mockPaginated('PaginatedArticles', nodes)` builds a paginated result with
`totalCount` set to `nodes.length` and a `PageInfo` whose cursors point at the
first and last node. `mockPageInfo()` builds just the `PageInfo`.

## Adding a factory

1. Find the fragment in `libs/website/api/src/lib/schemas/` and its generated
   type in `@wepublish/website/api`. If there is no named fragment, take the
   type from the query, as `mockChallenge` does with
   `ChallengeQuery['challenge']`.
2. Write the factory in the shape the others use:

   ```ts
   export const mockThing = ({
     image = mockImage(),
     ...overrides
   }: Partial<FullThingFragment> = {}): FullThingFragment => ({
     __typename: 'Thing',
     id: faker.string.nanoid(),
     name: 'Thing',
     image,
     ...definedOnly(overrides),
   });
   ```

   Put nested factories (`mockImage()`, `mockRichText()`, other `mock*`
   calls) in the destructured defaults, so they only run when the caller
   doesn't pass that field. That keeps big trees cheap and avoids infinite
   recursion between articles, teasers and blocks.
3. Import `faker` from `./faker`, not from `@faker-js/faker`.
4. Export the file from `src/index.ts`.
5. Add the factory to the `__typename` check in `src/lib/mocks.spec.ts` if it
   builds nested objects.

## Apollo mocks

`mockOperation(Document, { variables, data })` (or `errors`) builds one
`MockLink` response for a typed document. `variables` is either the exact
variables or a matcher function. A response answers once unless you pass
`maxUsageCount`. The helpers below answer every request, whatever the
variables, for queries that providers fire in the background:
`mockSettingListQuery(settings)`, `mockChallengeQuery(challenge)`,
`mockPrimaryBannerQuery(banner)`, `mockPeerProfileQuery(peerProfile)`,
`mockCheckLoginOtpQuery(required)`. Use exact variables for the operation the
test is about. `mockMutationResult()` builds a `useMutation` result for
components that take one as a prop.

To answer a refetch, add a second mock; giving it different data proves the
refetch happened (see `registration-form-container.spec.tsx`).
`errors: [{ message }]` makes the operation fail. For a query, the component
gets `error`; for a mutation the promise rejects. A component that awaits a
mutation without catching produces an "Unhandled Rejection" that fails the
run; that is a real bug in the component.

## Turning it on

```ts
export default createVitestConfig({
  name: 'article-website',
  dir: __dirname,
  website: true,
});
```

`website: true` adds `src/setup.ts` (jest-dom, i18next in German with the zod
error map, date-fns `de`, cleanup, locale reset after each test) and aliases
`next/router`, `@marsidev/react-turnstile` and `@hcaptcha/react-hcaptcha` to
the stand-ins in `src/lib/render`. Every `libs/*/website`, `libs/ui`,
`libs/website` and `libs/tenants/*` project has it on.

## Rendering

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockOperation,
  mockSession,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { LoginWithCredentialsDocument } from '@wepublish/website/api';
import { t } from 'i18next';

it('logs in with credentials and stores the session', async () => {
  const user = userEvent.setup();
  const session = mockSession();
  const { setToken } = renderWithProviders(<LoginFormContainer />, {
    mocks: [
      mockOperation(LoginWithCredentialsDocument, {
        variables: { email: 'foo@bar.ch', password: '12345678' },
        data: { __typename: 'Mutation', createSession: session },
      }),
    ],
  });

  await user.click(
    screen.getByRole('button', { name: t('login.loginWithPassword') })
  );
  await user.type(screen.getByLabelText(t('login.email')), 'foo@bar.ch');
  await user.type(screen.getByLabelText(t('login.password')), '12345678');
  await user.click(screen.getByRole('button', { name: t('login.submit') }));

  await waitFor(() =>
    expect(setToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: session.token })
    )
  );
});
```

`renderWithProviders(ui, options)` returns Testing Library's render result plus
`router` (the `next/router` mock), `setToken` (a `vi.fn` the session calls) and
`client` (the Apollo client). `rerender` keeps the providers.

| Option | Default | What it does |
| --- | --- | --- |
| `mocks` | `[]` | `MockLink` responses. Every operation the tree sends needs one, with the exact variables; an unmatched operation fails the test after it finishes and lists the operation and its variables. Fresh `InMemoryCache` with `possibleTypes` per render, no delay. |
| `apolloDefaultOptions` | like the website in the browser | Queries deliver errors alongside data (`errorPolicy: 'all'`); mutations reject on errors, as in production. |
| `user` | `null` (logged out) | A `FullSensitiveDataUserFragment` renders logged in. `setToken(session)` logs in (as `user`, or `mockSensitiveDataUser()`), `setToken(null)` logs out. |
| `tenant` | the default We.Publish theme | A `WebsiteTenantConfig` (`@wepublish/tenant/<t>`): its theme, builder components, `Wrapper` and `GlobalStyles`, stacked like `TenantProviders`. |
| `builder` | — | Overrides for the website builder, for example `{ Navbar: FakeNavbar }`. `Head` renders its children in place (so `document.querySelector('title')` works) and `Script` renders a hidden `data-testid="test-script"` element with `data-src` instead of loading anything. |
| `router` | `{ pathname: '/' }` | `{ pathname, query, asPath, locale }` for `useRouter()` and the builder's `BuilderRouterContext`. `router.push` etc. are `vi.fn`s. |
| `locale` | `'de'` | `'fr'` switches i18next, date-fns and `<html lang>`; reset after each test. |
| `poll`, `commentRating`, `subscribeBlock` | not provided | Values for `PollBlockContext`, `CommentRatingContext`, `SubscribeBlockContext`. |

## Containers

Render the container, mock its query with exact variables, `await
screen.findBy...` the content, then interact and assert on the next mock's
effect. Containers that include `PollBlockProvider` / `SubscribeBlockProvider`
(articles, pages) also need `mockSettingListQuery()` and, when logged out,
`mockChallengeQuery()`; `BannerContainer` needs `mockPrimaryBannerQuery()`.
The failure message tells you which operation is missing.

## Block contexts

Presentational blocks read their callbacks from a context instead of Apollo.
Build a value with spies and pass it in:

```tsx
const poll = createPollBlockContext({
  voteResult: { data: { __typename: 'Mutation', voteOnPoll: vote } },
  canVoteAnonymously: true,
});

renderWithProviders(<PollBlock {...block} />, { poll });
await user.click(screen.getByRole('button', { name: answer.answer }));
expect(poll.vote).toHaveBeenCalledWith(
  { variables: { answerId: answer.id } },
  block.poll.id
);
```

`createCommentRatingContext({ rateResult, anonymousRate, canRateAnonymously })`
and `createSubscribeBlockContext({ subscribeResult, upgradeInfoResult, ... })`
work the same way. Every function on them is a `vi.fn`.

## Captcha

Turnstile and hCaptcha render a `role="group"` named `TEST_CAPTCHA_LABEL`
with `data-sitekey`, and solve themselves with `mockChallengeToken` right
after mounting (and again after `reset()`). Wait for the token, not for the
widget: `await waitFor(() => expect(onChange).toHaveBeenCalledWith(mockChallengeToken))`.

## Tenants

```tsx
import { bajourTenant } from '@wepublish/tenant/bajour';

renderWithProviders(<Article data={data} />, { tenant: bajourTenant });
```

Translation overrides are async: `await applyTenantTranslations(tenant)` in a
`beforeAll` and `await resetTranslations()` in `afterAll`.

happy-dom computes emotion styles, so tenant styling is testable through
`getComputedStyle` (colours come back as written in the theme, e.g. `#E94090`;
compare against `tenant.createTheme().palette`). Media queries follow
`setTestViewportWidth(400)`; every test starts at
`DEFAULT_TEST_VIEWPORT_WIDTH` (1024, desktop). Fonts from `next/font/local`
resolve to the family `local` and `next/font/google` to the plain family name
(see `__mocks__/next-font-*.ts`), so only Google font families can be
asserted.

## Pitfalls

- MUI date pickers label several elements; use `getAllByLabelText`.
- `type="email"` inputs block submit natively when the value is not an email;
  assert `toBeInvalid()` instead of `aria-invalid`.
- happy-dom does not evaluate complex selectors such as `:not(:is(...))` or
  layout. Tests that depend on them (paywall cut-off, title above authors) are
  out of scope.
- Use `t('key')` from `i18next` for text. Strings that are hard-coded in the
  component (no key) are the exception.
- Embeds never touch the network: `setup.ts` makes happy-dom load every iframe
  as an empty page (it fetches the real `src` otherwise) and skip external
  script and CSS files. Assert the iframe `src` or the embed markup. Inline
  `<script>`s do not run (happy-dom 20 has JavaScript evaluation off), so the
  HTML block cannot be tested for executing its scripts. `fetch` from the test
  window is untouched; stub it with `vi.stubGlobal('fetch', vi.fn())`.
- `react-player` and `react-tweet` are aliased to the root `__mocks__`
  stand-ins, which print the `src` / props they receive.

## Hidden from Nx

`renderWithProviders` imports `@wepublish/website`, which imports every website
library. If this were an Nx project, `article-website`'s spec importing it
would make `article-website → mocks-website → website → article-website` a
circular project dependency, and `@nx/enforce-module-boundaries` would fail
lint. So `libs/mocks/website` is in `.nxignore`, and there is no `nx test` or
`nx lint` for it. `project.json` only names the Codecov flag. Check it with

```sh
pnpm exec vitest run --config libs/mocks/website/vitest.config.ts
pnpm exec eslint libs/mocks/website
```

CI runs the first in the "Tests of libs hidden from Nx" step of `test.yml` and
the second in `lint.yml`. Changing a file here reruns every project's tests,
because `nx.json` lists the folder as a test input.
