import { LIVE_REVALIDATE_SECONDS, revalidateFor } from '../lib/revalidate-for';

/**
 * The `cache-control` a content response carries, derived per page the way
 * `getStaticProps` derived `revalidate`.
 *
 * TanStack Start has no ISR, so `withPageCache` plays that role: it reads
 * `s-maxage` off the response and stores the page against it, then serves the
 * stale copy while re-rendering in the background. That makes this header the
 * actual revalidation window, not just a hint to the CDN — which is why a flat
 * value is expensive. `src/start.ts` applies one by path for anything that does
 * not set its own, and a path pattern cannot tell a static article from one
 * carrying a poll, so it has to assume the shortest.
 *
 * `revalidateFor` can tell, because it sees the content: an hour for a static
 * page, a minute when a live block, an API error or missing content means the
 * page may change under us, and sooner still when a block is scheduled to
 * appear or disappear.
 *
 * It throws on a server error with no content — that is how it failed a Next
 * build rather than caching an error page. Here the loader is already
 * rendering, so the throw is caught and the shortest window used instead; the
 * page is still answered, just barely cached.
 *
 * `stale-while-revalidate` stays out of the browser-facing `max-age`: it
 * belongs to the shared caches, and on a reader's own cache it would let a
 * week-old document through, which Next never did.
 */
export const contentCacheControl = (
  content: unknown,
  errors?: unknown
): string => {
  let seconds: number;

  try {
    seconds = revalidateFor(content, errors);
  } catch {
    seconds = LIVE_REVALIDATE_SECONDS;
  }

  return `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=604800, stale-if-error=86400`;
};
