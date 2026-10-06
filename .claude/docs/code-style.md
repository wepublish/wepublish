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
  OS, overridable in the sidebar; `apps/editor/src/app/colorMode.tsx`). rsuite's
  `CustomProvider theme` swaps every `--rs-*` variable, MUI gets
  `createEditorTheme(mode)`. Use `var(--rs-bg-card)`, `--rs-bg-well`,
  `--rs-bg-overlay`, `--rs-text-primary`/`-secondary`, `--rs-border-primary`,
  `--rs-state-*` in Emotion, palette paths in MUI `sx`. Editor-specific tokens
  (`--wep-shell-*`, `--wep-state-*`, …) live in
  `apps/editor/src/app/editorGlobalStyles.tsx`. `--rs-gray-*` and `--rs-primary-50`
  stay light in dark mode — don't use them for surfaces. Keep the MUI palette as
  real hex (code runs `lighten()`/alpha math on it). Fixed colours are only for
  user data (picked colours, defaults), email content and QR codes.
- **Editor layout is responsive.** Below 900 px the sidebar becomes a drawer;
  at ≤ 640 px rsuite `Col`s stack (global rule in `editorGlobalStyles.tsx`).
  The shared `Table` from `@wepublish/ui/editor` scales `width` columns to the
  available width (`listView/fit-column-widths.ts`) and releases `fixed`
  columns under 600 px — so don't hand-tune column widths to a screen size.

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
  User-facing strings go through react-i18next — never hardcode copy.

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

See [graphql-prisma.md](graphql-prisma.md) for the full schema workflow.
