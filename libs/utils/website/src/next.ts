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
export * from './next/auth-guard';
export * from './next/get-session-token-props';
export * from './next/next-wepublish-link';
export * from './next/handle-jwt-login';
export * from './next/routed-admin-bar';
export * from './next/with-builder-router';

export * from './next/pages/404-page';
export * from './next/pages/author-page';
export * from './next/pages/document-page';
export * from './next/pages/search-page';
export * from './next/pages/subscribe-page';
export * from './next/pages/tag-page';
export * from './next/pages/profile/profile-details';
export * from './next/pages/profile/profile-page';
export * from './next/pages/profile/subscription/subscription-page';
export * from './next/pages/profile/subscription/deactivated-subscriptions-page';
