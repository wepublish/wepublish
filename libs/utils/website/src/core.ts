/**
 * Framework-neutral subset of `@wepublish/utils/website`.
 *
 * The default barrel (`./index.ts`) pulls in `next/router`, `next/head`,
 * `next/document` and `@mui/material-nextjs`, which cannot be bundled by a
 * non-Next app. Anything exported from here must stay free of `next/*`
 * imports so that Vite-based apps (TanStack Start) can consume it.
 *
 * Keep this list in sync with `./index.ts` — `index.ts` re-exports this file,
 * so there is exactly one definition per symbol.
 */
export * from './lib/api-url';
export * from './lib/auth-link';
export * from './lib/session.provider';
export * from './lib/async-session.provider';
export * from './lib/user-country';
export * from './lib/with-jwt-handler';
export * from './lib/with-session-provider';
export * from './lib/i18n-formatter';
export * from './lib/components/daily-briefing-teaser';
export * from './lib/website-token';
export * from './lib/revalidate-for';
