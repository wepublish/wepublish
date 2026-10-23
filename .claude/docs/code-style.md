# Code Style

Source code formatting and linting should follow the existing conventions in the
codebase.

- Always use curly braces around conditional blocks, even for single statements.
- Never add comments **unless** they are needed for the linter or to bypass the
  Typescript compiler.
- Never run prettier as it's run by a commit hook.

Prettier config (`.prettierrc`): 80 cols, semicolons, single quotes, `es5`
trailing commas, `arrowParens: avoid`, one JSX attribute per line.

## Typescript

- Prefer `unknown` over `any`
- Always use `@ts-expect-error` over `@ts-ignore`
- Import across projects via `@wepublish/*` aliases, never deep relative paths —
  `@nx/enforce-module-boundaries` is an ESLint **error**.
- Unused imports are an error (`unused-imports/no-unused-imports`). Unused
  *arguments* and caught errors are allowed.

## Emotion

Styling is Emotion — `styled()` with tagged template literals — used together
with MUI components.

- **Import `styled` from `@emotion/styled`, never from `@mui/material`.** This is
  enforced by `no-restricted-imports` and will fail lint.
- Import `css` and `SerializedStyles` from `@emotion/react` for composable style
  fragments and conditional blocks.
- Reach for theme tokens rather than hardcoded values:
  `gap: ${({ theme }) => theme.spacing(4)};`
- **Export your styled components.** Tenant apps and sibling libs target them as
  selectors (`> :not(:is(${ArticleInfoWrapper}))`); a non-exported wrapper cannot
  be overridden downstream.
- Type the props on styled components that branch on them, and prefer a `css`
  fragment inside an interpolation over a second styled component:

```tsx
import styled from '@emotion/styled';
import { css, SerializedStyles } from '@emotion/react';

export const Wrapper = styled(ContentWrapper)<{ fadeout?: boolean }>`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};

  ${({ fadeout }) =>
    fadeout &&
    css`
      mask-image: linear-gradient(to bottom, rgb(0 0 0 / 1) 30%, rgb(0 0 0 / 0) 100%);
    `}
`;
```

- Comments inside a template literal are one of the few legitimate uses of
  comments in this codebase — a `nth-child` selector rule usually needs one.
- **Editor UI: no hard-coded colours.** The editor has a dark mode (follows the
  OS, overridable in the sidebar; `apps/editor/src/app/colorMode.tsx`) and
  `createEditorTheme()` is the single source of colour. It builds **both**
  schemes into one theme with `cssVariables`, so switching mode sets
  `data-mui-color-scheme` on the root rather than handing React a new theme.
  That has one consequence everywhere:
  - In Emotion read `${({ theme }) => theme.vars.palette.text.secondary}` —
    **`theme.vars.palette`, never `theme.palette`**, which holds the light
    scheme's literals and would never change.
  - In `sx` use palette paths (`color: 'text.secondary'`); in a map of state to
    colour store the *path* and resolve it with `paletteColor(theme, path)`.
  - There is no `theme.palette.mode` to branch on. Write the light rule and
    override it under `[data-mui-color-scheme='dark'] &`, or `theme.applyStyles
    ('dark', {…})` where an object is wanted (see `MuiAlert` in `theme.ts`).
  - `theme.palette` is still the place to read a real hex when code runs
    `lighten()`/alpha math; prefer the `…Channel` vars
    (`rgba(${theme.vars.palette.success.mainChannel} / 0.5)`) when the result
    has to follow the scheme.
  Editor-specific tokens (`--wep-shell-*`, `--wep-state-*`, …) live in
  `apps/editor/src/app/editorGlobalStyles.tsx`, keyed off the same attribute.
  Fixed colours are only for user data (picked colours, defaults), email
  content and QR codes.
  Two traps: `theme.shape.borderRadius` is a number typed `number | string`, so
  raw CSS needs `${…}px` and fractional radii need `calc()`; and a palette path
  is **not** resolved inside `styleOverrides`, which take the callback form.
- **Editor layout is responsive.** Below 900 px the sidebar becomes a drawer.
  The shared `DataTable` from `@wepublish/ui/editor` scales `width` columns to
  the available width (`listView/fit-column-widths.ts`) and releases `fixed`
  columns under 600 px — so don't hand-tune column widths to a screen size.
  List pages use that table, not a hand-rolled one, or columns don't fill the
  width. Data lists (users, comments, invoices, audit log… — not config or
  content lists like tags, blocks or navigations) pass `exportRows` (CSV/Excel
  download, via `useTableExportQuery` for paginated queries, plus
  `exportTotalCount` so the user is asked page-or-all and warned above 1000);
  columns that render JSX need an `exportValue`, a JSX `label` needs a
  `columnLabel`, and secrets get `exportValue: false`.
- **Drawers scroll only `DrawerBody`.** `DrawerHeader`/`DrawerBody` are the
  shared styled elements from `@wepublish/ui/editor`; the body is the flex
  child that scrolls. Don't give it a fixed height — a hard-coded
  `calc(100% - header)` breaks the moment the header wraps.
- **Icon-only actions are `<IconButton size="small" …>`** — delete adds
  `color="error"`. Add `data-on-media` when the button sits on an image so it
  keeps a solid background.
- **Help and labels:** icon-only buttons get `IconButtonTooltip` + `aria-label`;
  non-obvious fields get `<InfoTooltip text={t('…')} />` after the label (never
  filled `MdInfo`). List action columns use `t('action')`, centred, `fixed="right"`.
  Switches carry their label on the right via `<FormControlLabel control={<Switch
  …/>} label={…} />` — no separate «on/off» text. Radii come from the theme:
  `theme.shape.borderRadius` (8px) for cards and panels, `calc(… * 0.75)` for
  controls and inner boxes; in `sx` that is `borderRadius: 1` and `0.75`.
- **Document editors use `EditorHeader`** (`@wepublish/ui/editor`) inside
  `EditorTemplate`: status chip + last-saved on the left, `EditorHeaderButton`s
  on the right (secondary subtle, Save/Publish primary). Labels collapse to
  icons by container width (`collapse="md" | "sm" | false`). The bar bleeds to
  the content card's edges through `--wep-page-padding-*` set in `base.tsx`.
- **An edit panel's form *is* the record.** `useForm` fetches what it edits
  through `defaultValues` as an async callback (`useApolloClient().query`),
  rather than a `useQuery` whose result is copied into a parallel set of
  `useState`s. One place holds the answer, so nothing has to be kept in step,
  `formState.isLoading` covers the fetch, and the save handler receives values
  the schema has already accepted. Fields are `Controller`s; a derived field
  (a slug following a name) is written with `setValue`. The worked example is
  `paymentMethodEditPanel.tsx`, pinned by its spec. Two traps: the Save button
  is `type="submit"` *only* — an `onClick` that calls the save as well bypasses
  validation entirely; and a panel with `useAuthorisation` needs an
  `AuthContext` in its tests or every control renders disabled. Read fields
  with `useWatch({control, name})`, never a bare `watch('x')` — the compiler
  memoises that call and the value never changes again (gotchas.md). Render
  nothing until `formState.isLoading` clears: before that every field is
  `undefined`, which the list-valued ones throw on. Errors belong next to the
  field as `helperText`, not in a toast, and a schema that carries messages is
  a factory taking `t` (`createBannerSchema(t)`) so they are translated. A
  single column of fields gets no cards: `FormFields` + `FormSectionTitle`
  from `@wepublish/ui/editor` are the layout, and a card is for a genuinely
  multi-column view. `FormSectionTitle` heads a *group*; a heading over one
  control is that control's `FormLabel`. Never wrap `RichTextBlock` in a card or a bordered box —
  the editor draws its own outlined surface, so a wrapper is a second border.
- **A dialog's confirming action goes last**, so it lands bottom-right with
  the dismissive one to its left — Material's order, and what the rest of the
  editor's 57 dialogs now do. It is `variant="contained"` (a destructive one
  also `color="error"`); the dismissive action is `variant="text"`.
- **Editor errors shown to users go through `humanizeError(error)`** from
  `@wepublish/ui/editor`, never raw `error.message` — it turns Prisma, network
  and permission failures into `errors.*` translations. Error toasts use
  `duration={8000}`. Don't rewrite messages in an Apollo link instead: consent
  views and the user list branch on raw texts like `'Unique constraint'`.
  i18next runs with `escapeValue: false` because React already escapes;
  re-enabling it double-escapes (`&#x2F;`).

## React

- Avoid using `useEffect` when it can be solved otherwise. Reference
  [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
  if unsure.
- Website components are built through the **Website Builder** — get shared
  components from `useWebsiteBuilder()` rather than importing them directly, so
  tenants can override them.
- Every new website component needs a Storybook story; stories are how these
  components are tested. See [testing.md](testing.md).
- Forms use React Hook Form with Zod resolvers. Icons come from React Icons.
  User-facing strings go through react-i18next — never hardcode copy; see
  [Translations](#translations).

## Translations

Editor copy lives in `apps/editor/src/app/locales/{en,de,fr}.json`; add every
key to all three. `locales.spec.ts` fails when a literal `t('…')` key is
missing or the three catalogs drift apart. Zod messages live at module level,
so use `lazyMessage('key')` from `apps/editor/src/app/utility.ts` instead of
`t()`.

- **German:** Swiss Standard German (no `ß`), lowercase `du`. `E-Mail`, never
  `Mail` — compounds too (`E-Mail-Vorlage`, `Test-E-Mail`, `E-Mail-Server`).
  Brand names (Mailchimp, Mailgun, Mailpit) stay as they are. Quote with
  guillemets `«…»` (no inner spaces), never `„…“` or `"…"`.
- **French:** `vous`. The typographic apostrophe `’`, never `'`. Quote with
  `« … »` (spaces inside), never `"…"`.

## Nest

### GraphQL Models

- Prefer model re-use via interfaces and extending models than writing from
  scratch

### Services & resolvers

- Keep resolvers thin: argument handling and delegation. Business logic goes in
  the service, which is where it gets unit-tested.
- Use dataloaders (`*-dataloader.service.ts`) for relations to avoid N+1 queries.
- Throw the standard Nest exceptions (`NotFoundException`,
  `BadRequestException`) rather than returning null-ish sentinels.
- Log with Pino; report to Sentry. Never log tokens, passwords, or payment
  payloads.
- **API errors say where they come from.** Every payment, mail, challenge and
  tracking-pixel provider the `ProviderRegistryService` builds is wrapped by
  `withProviderErrorContext`, so its errors read `Payment provider "<name>"
  (<class>, id <id>) failed in <method>: …`; the error keeps its class
  (`instanceof MailProviderRecipientError` still works). Turn unknown errors
  into text with `describeError` and prefix context with `addErrorContext`
  (`@wepublish/utils/api`), never `e instanceof Error ? e.message : String(e)`
  or `JSON.stringify(e)`: SDKs like `bexio` reject with plain objects, which
  print as `[object Object]` / `{}`. The periodic job adds the subscription or
  invoice it was working on; that text is what the editor job log and ONE
  (`mediumStats.operations.periodicJobError`) show.

See [graphql-prisma.md](graphql-prisma.md) for the full schema workflow.
