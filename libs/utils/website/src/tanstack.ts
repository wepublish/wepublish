/**
 * TanStack Start flavour of `@wepublish/utils/website`.
 *
 * Mirrors `./next.ts`: the Next barrel implements the shared website contract
 * against the pages router, this one implements it against TanStack
 * Router/Start. Both sit on top of the framework-neutral core in `./index.ts`.
 *
 * Like `./next.ts`, this barrel does NOT re-export the core — an import line
 * always says which world a symbol comes from:
 *
 *   import { getApiUrl, getPageShell } from '@wepublish/utils/website';
 *   import { WepublishLink, articleBySlugRoute } from '@wepublish/utils/website/tanstack';
 *
 * Server-only helpers (request cookies, headers, the authenticated SSR Apollo
 * client) live in `@wepublish/utils/website/tanstack/server` and may only be
 * reached from inside a `createServerFn` handler or a literal
 * `server: {handlers}` block.
 */

export * from './tanstack/admin-bar';
export * from './tanstack/analytics';
export * from './tanstack/apollo';
export * from './tanstack/emotion';
export * from './tanstack/auth-guard';
export * from './tanstack/head';
export * from './tanstack/link';
export * from './tanstack/prefetch';
export * from './tanstack/router-hooks';
export * from './tanstack/session-token';
export * from './tanstack/website-shell';
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
