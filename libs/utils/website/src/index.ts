/**
 * Framework-neutral core of `@wepublish/utils/website`.
 *
 * Nothing reachable from this barrel may import `next/*`. That is the whole
 * contract: it is what lets a non-Next app (TanStack Start) consume the shared
 * website utilities without pulling Next into its bundle.
 *
 * Next-only code — the pages-router page components, their data-fetching
 * helpers, and anything typed against `NextPageContext` — lives in
 * `@wepublish/utils/website/next`. That barrel deliberately does NOT re-export
 * this one, so an import line always says which world a symbol comes from.
 *
 * Adding a file here? If it imports `next/*`, it belongs in `./next.ts`.
 * `pnpm nx lint utils-website` will not catch this for you — see
 * `.claude/docs/tanstack-start-migration.md`.
 */

// Side-effect only: the `Window.WEBSITE_SETTINGS` / `Window.PUBLIC_ENV`
// augmentation. Exports nothing, so it must be imported, not re-exported.
import './lib/website-globals';

export * from './lib/api-url';
export * from './lib/auth-link';
export * from './lib/session.provider';
export * from './lib/async-session.provider';
export * from './lib/user-country';
export * from './lib/with-jwt-handler';
export * from './lib/with-session-provider';
export * from './lib/website-shell';
export * from './lib/i18n-formatter';
export * from './lib/components/daily-briefing-teaser';
export * from './lib/website-token';
export * from './lib/revalidate-for';
