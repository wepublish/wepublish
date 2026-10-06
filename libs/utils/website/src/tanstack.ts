/**
 * TanStack Start flavour of `@wepublish/utils/website`.
 *
 * `./index.ts` is Next-only (it imports `next/router`, `next/head`,
 * `next/document`). This barrel is the same contract implemented against
 * TanStack Router / TanStack Start, so a Vite app can do
 *
 *   import { WepublishLink, ProfilePage } from '@wepublish/utils/website/tanstack'
 *
 * Framework-neutral helpers (api-url, auth links, session providers, i18n)
 * stay in `@wepublish/utils/website/core` and are re-exported here for
 * convenience, so a TanStack app only ever needs these two entry points.
 */
export * from './core';

export * from './tanstack/admin-bar';
export * from './tanstack/analytics';
export * from './tanstack/apollo';
export * from './tanstack/auth-guard';
export * from './tanstack/fonts';
export * from './tanstack/head';
export * from './tanstack/link';
export * from './tanstack/prefetch';
export * from './tanstack/router-hooks';
export * from './tanstack/routes';

export * from './tanstack/pages/404-page';
export * from './tanstack/pages/article-list-page';
export * from './tanstack/pages/article-page';
export * from './tanstack/pages/author-list-page';
export * from './tanstack/pages/event-list-page';
export * from './tanstack/pages/author-page';
export * from './tanstack/pages/deactivated-subscriptions-page';
export * from './tanstack/pages/login-page';
export * from './tanstack/pages/profile-page';
export * from './tanstack/pages/search-page';
export * from './tanstack/pages/subscribe-page';
export * from './tanstack/pages/subscription-page';
export * from './tanstack/pages/tag-page';
