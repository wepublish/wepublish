/**
 * Shared handlers for the `pages/api/*` endpoints every tenant duplicated.
 *
 * ## Why these are handlers and not route-option factories
 *
 * Page routes can be built from a factory (`createFileRoute(p)(articleRoute())`)
 * because their options are plain data. Server routes **cannot**: the TanStack
 * Vite plugin strips the client bundle by deleting the literal
 * `server: { handlers: { ... } }` property from the `createFileRoute` call. If
 * the options come back from a function call the plugin cannot see that
 * property, nothing is stripped, and the server-only imports behind it get
 * pulled into the browser build — which fails with
 * `"Readable" is not exported by "__vite-browser-external"`.
 *
 * So a route file must always spell the block out:
 *
 * ```ts
 * export const Route = createFileRoute('/sitemap.xml')({
 *   server: {
 *     handlers: { GET: () => sitemapHandler(getSitemap, getSiteUrl) },
 *   },
 * });
 * ```
 *
 * Everything referenced *inside* the handler is then tree-shaken out of the
 * client bundle along with it.
 */

/** Feeds and sitemaps are CDN cached for ten minutes, as in the Next apps. */
export const FEED_CACHE_CONTROL =
  'public, max-age=599, s-maxage=599, stale-if-error=86400';

export const SITEMAP_CACHE_CONTROL =
  's-maxage=599, stale-while-revalidate=604800, max-age=599, ' +
  'stale-if-error=86400, public';

/**
 * `pages/api/health.ts`.
 *
 * Keep this on `/api/health`: it is the liveness/readiness/startup probe path
 * in `helm/charts/wepublish-website/templates/website.yaml`, shared by every
 * website deployment.
 */
export const healthHandler = () =>
  Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } });

/**
 * A permanent redirect, for the legacy `/api/rss-feed`-style paths.
 *
 * Those URLs are baked into existing feed-reader subscriptions and
 * already-crawled `<link rel="alternate">` tags, so they must keep resolving
 * rather than 404.
 */
export const legacyRedirectHandler = (to: string) =>
  new Response(null, {
    status: 301,
    headers: {
      location: to,
      'cache-control': 'public, max-age=86400, s-maxage=86400',
    },
  });

/**
 * `pages/api/revalidate.ts`.
 *
 * TanStack Start has no ISR, so there is no server-side page cache to purge —
 * `res.revalidate(path)` has no equivalent. Pages render per request and are
 * cached by the CDN, so an editorial "publish now" has to purge the CDN.
 *
 * Kept so the API's publish webhook still gets a 200 instead of erroring, and
 * so the gap is discoverable at runtime rather than silently absent.
 */
export const revalidateStubHandler = ({ request }: { request: Request }) => {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('secret') !== process.env.REVALIDATE_TOKEN) {
    return Response.json({ message: 'Invalid token' }, { status: 401 });
  }

  return Response.json(
    {
      revalidated: false,
      reason: 'TanStack Start has no ISR. Purge the CDN for this path instead.',
      path: searchParams.get('path'),
    },
    { headers: { 'cache-control': 'no-store' } }
  );
};

/**
 * `pages/api/sitemap.ts`, now served from `/sitemap.xml`.
 *
 * `getSitemap` stays in the app: the title and the list of extra static URLs
 * are tenant specific.
 */
export const sitemapHandler = async (
  getSitemap: (siteUrl: string) => Promise<string>,
  getSiteUrl: () => string
) =>
  new Response(await getSitemap(getSiteUrl()), {
    headers: {
      'content-type': 'application/xml',
      'cache-control': SITEMAP_CACHE_CONTROL,
      'cdn-cache-control': SITEMAP_CACHE_CONTROL,
      'vercel-cdn-cache-control': SITEMAP_CACHE_CONTROL,
    },
  });

export type FeedFormat = 'rss2' | 'atom1' | 'json1';

const FEED_CONTENT_TYPE: Record<FeedFormat, string> = {
  rss2: 'application/xml',
  atom1: 'application/xml',
  json1: 'application/feed+json',
};

/** `pages/api/{rss,atom,json}-feed.ts`, now `/rss.xml`, `/atom.xml`, `/feed.json`. */
export const feedHandler = async (
  request: Request,
  getFeed: (
    requestUrl: string,
    siteUrl: string
  ) => Promise<Record<FeedFormat, () => string>>,
  getSiteUrl: () => string,
  format: FeedFormat
) => {
  const feed = await getFeed(request.url, getSiteUrl());

  return new Response(feed[format](), {
    headers: {
      'content-type': FEED_CONTENT_TYPE[format],
      'cache-control': FEED_CACHE_CONTROL,
    },
  });
};
