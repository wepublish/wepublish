/**
 * `cache-control` by path, for the request middleware in `start.ts`.
 *
 * Next applied cache headers by path in `next.config.js#headers()`. A content
 * route sets its own header from what it loaded (`contentCacheHeaders`); this
 * table is everything that has no content to judge: the `no-store` routes,
 * assets, and the default for anything new.
 *
 * **Add every new route that reads the session.** A route that is missing
 * gets the default, and for a reader's own page that means one visitor's HTML
 * is served to the next.
 */

// Byte for byte what `next.config.js` sends for every path.
export const ISR_60 = 'public, max-age=59, s-maxage=59, stale-if-error=86400';

export const NO_STORE = 'no-store';

const CACHE_RULES: Array<[RegExp, string]> = [
  // `next.config.js` set `no-store` for /profile and /profile/:path*
  [/^\/profile(\/|$)/, NO_STORE],
  // Its loader reads the auth cookie and dehydrates Me/Invoices into the HTML.
  [/^\/mitmachen(\/|$)/, NO_STORE],
  // The login writes cookies and reads `?jwt=` and `?loginCode=`; the email
  // confirmation link carries its token in the address.
  [/^\/(login|confirm-email)(\/|$)/, NO_STORE],
  // The welcome steps load the reader and their session on the server.
  [/^\/welcome(\/|$)/, NO_STORE],
  // The personal login link: the code is in the address and the session it
  // opens is part of the page.
  [/^\/l\//, NO_STORE],
  // Search was `getServerSideProps`, i.e. uncached.
  [/^\/search(\/|$)/, NO_STORE],
  // Server functions default to `no-store`: most carry a session. The content
  // loaders are the exception and say so themselves, by setting their own
  // `cache-control` (see `runContentQueries`), which the middleware honours
  // before this table is consulted.
  [/^\/_serverFn(\/|$)/, NO_STORE],
  // Hashed build assets.
  [/^\/_build\//, 'public, max-age=31536000, immutable'],
];

/** The header for a response that did not decide for itself. */
export const cacheControlFor = (pathname: string) =>
  CACHE_RULES.find(([pattern]) => pattern.test(pathname))?.[1] ?? ISR_60;
