import { LIVE_REVALIDATE_SECONDS, revalidateFor } from '../lib/revalidate-for';

/**
 * What `next.config.js#headers()` sends for every Next page, byte for byte.
 * Browsers and Cloudflare see exactly this on a TanStack tenant too.
 */
export const CONTENT_CACHE_CONTROL =
  'public, max-age=59, s-maxage=59, stale-if-error=86400';

/**
 * The page cache's own revalidation window, in seconds. Internal: `withPageCache`
 * reads it and strips it before the response leaves the server.
 */
export const PAGE_CACHE_REVALIDATE = 'x-page-cache-revalidate';

/**
 * The headers a content response carries, derived per page the way
 * `getStaticProps` derived `revalidate`.
 *
 * Next kept those two apart: `revalidate` drove ISR, while `next.config.js`
 * sent a flat 59 s `cache-control` to the browser and the CDN regardless. The
 * same split here: `withPageCache` stores against `PAGE_CACHE_REVALIDATE`,
 * and everything outside the server only ever sees `CONTENT_CACHE_CONTROL`.
 * Putting the window into `s-maxage` instead let Cloudflare keep a static
 * article for an hour, where a publish never reaches it.
 *
 * `revalidateFor` sees the content: an hour for a static page, a minute when
 * a live block, an API error or missing content means the page may change
 * under us, and sooner still when a block is scheduled to appear or
 * disappear.
 *
 * It throws on a server error with no content — that is how it failed a Next
 * build rather than caching an error page. Here the loader is already
 * rendering, so the throw is caught and the shortest window used instead; the
 * page is still answered, just barely cached.
 */
export const contentCacheHeaders = (
  content: unknown,
  errors?: unknown
): Record<string, string> => {
  let seconds: number;

  try {
    seconds = revalidateFor(content, errors);
  } catch {
    seconds = LIVE_REVALIDATE_SECONDS;
  }

  return {
    'cache-control': CONTENT_CACHE_CONTROL,
    [PAGE_CACHE_REVALIDATE]: String(seconds),
  };
};
