/**
 * Next.js-only half of `@wepublish/utils/website`.
 *
 * Everything here imports `next/*` — pages-router page components, their
 * `getStaticProps`/`getServerSideProps`/`getInitialProps` helpers, and the
 * `next/router`- and `next/document`-bound wrappers.
 *
 * This barrel does NOT re-export the neutral core. A file that needs both
 * carries two import lines, which keeps the boundary visible at the call site:
 *
 *   import { getApiUrl, getPageShell } from '@wepublish/utils/website';
 *   import { NextWepublishLink, FourOhFourPage } from '@wepublish/utils/website/next';
 *
 * The dependency direction is strictly next -> core, never the reverse.
 */
export * from './lib/auth-guard';
export * from './lib/get-session-token-props';
export * from './lib/next-wepublish-link';
export * from './lib/handle-jwt-login';
export * from './lib/routed-admin-bar';
export * from './lib/with-builder-router';

export * from './lib/pages/404-page';
export * from './lib/pages/author-page';
export * from './lib/pages/document-page';
export * from './lib/pages/search-page';
export * from './lib/pages/subscribe-page';
export * from './lib/pages/tag-page';
export * from './lib/pages/profile/profile-page';
export * from './lib/pages/profile/subscription/subscription-page';
export * from './lib/pages/profile/subscription/deactivated-subscriptions-page';
