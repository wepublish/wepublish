import { createMiddleware, createStart } from '@tanstack/react-start';

/**
 * ## The ISR replacement
 *
 * TanStack Start has **no incremental static regeneration**. The Next app
 * leaned on it heavily (`getStaticProps` + `revalidate: 60` +
 * `fallback: 'blocking'` on every content route). The faithful equivalent is
 * render-on-demand behind a CDN that honours `stale-while-revalidate`: the
 * first request after the window expires is answered from the edge with the
 * stale copy while the origin re-renders. Same user-visible behaviour, same
 * origin load profile, different machinery.
 *
 * Next applied cache headers *by path* in `next.config.js#headers()`, so a
 * path-based request middleware reproduces that part in one place. If you add
 * a route, add it to `CACHE_RULES` — forgetting to means it silently gets the
 * default below, and for a user-specific route that means one visitor's HTML
 * is served to the next.
 *
 * The per-page `revalidate` is NOT fully reproduced. `revalidateFor()` chose
 * 3600s for a static page, 60s when the page carries a live block (poll,
 * crowdfunding) or the API errored, and 1s when content was missing. A path
 * rule cannot see block types, so this flattens to the *shortest* of those.
 * That is the safe direction — it can only under-cache, never serve a stale
 * poll — but it does mean more origin renders than Next did for static pages.
 * Restoring the split means letting the content loaders set the header.
 */

// Split deliberately. `stale-while-revalidate` belongs to the CDN: on the
// browser-facing `cache-control` it would let a returning visitor's own cache
// serve week-old HTML, which Next never did.
const BROWSER = 'public, max-age=59, stale-if-error=86400';
const CDN = 's-maxage=60, stale-while-revalidate=604800, stale-if-error=86400';
const ISR_60 = `${BROWSER}, ${CDN}`;

const NO_STORE = 'no-store';

const CACHE_RULES: Array<[RegExp, string]> = [
  // `next.config.js` set `no-store` for /profile and /profile/:path*
  [/^\/profile(\/|$)/, NO_STORE],
  // `next.config.js` also set `no-store` for /mitmachen. Its loader reads the
  // auth cookie and dehydrates Me/Invoices into the HTML, so the 60s default
  // would store one visitor's subscription data and serve it to the next.
  [/^\/mitmachen(\/|$)/, NO_STORE],
  // Login / signup write cookies and read `?jwt=`; never cache them.
  [/^\/(login|signup)(\/|$)/, NO_STORE],
  // Search was `getServerSideProps`, i.e. uncached.
  [/^\/search(\/|$)/, NO_STORE],
  // Server function RPC calls are per-user by definition.
  [/^\/_serverFn(\/|$)/, NO_STORE],
  // Hashed build assets.
  [/^\/_build\//, 'public, max-age=31536000, immutable'],
];

const cacheHeaders = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const result = await next();
    const { pathname } = new URL(request.url);

    // Anything that already decided for itself (feeds, sitemap, health) wins.
    if (result.response.headers.has('cache-control')) {
      return result;
    }

    // 404/410/5xx must not be cached for long, mirroring `revalidate: 1`.
    if (result.response.status >= 400) {
      result.response.headers.set('cache-control', NO_STORE);

      return result;
    }

    const rule = CACHE_RULES.find(([pattern]) => pattern.test(pathname));
    result.response.headers.set('cache-control', rule ? rule[1] : ISR_60);

    return result;
  }
);

/** `poweredByHeader: false` had no equivalent to port — Vite sends none. */
export const startInstance = createStart(() => ({
  requestMiddleware: [cacheHeaders],
}));
