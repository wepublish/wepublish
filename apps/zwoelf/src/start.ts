import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from '@sentry/tanstackstart-react';
import {
  createCsrfMiddleware,
  createIsomorphicFn,
  createMiddleware,
  createStart,
} from '@tanstack/react-start';
import { referrerPolicyFor } from '@wepublish/utils/website/tanstack';

import { cacheControlFor, NO_STORE } from './cache-rules';

/**
 * ## The ISR replacement
 *
 * TanStack Start has **no incremental static regeneration**. The Next app
 * leaned on it heavily (`getStaticProps` + `revalidate: 60` +
 * `fallback: 'blocking'` on every content route). The faithful equivalent is
 * `withPageCache` in `src/server.ts`: the first request after the window
 * expires is answered with the stale copy while the origin re-renders. Same
 * user-visible behaviour, same origin load profile, different machinery.
 *
 * Next applied cache headers *by path* in `next.config.js#headers()`, so a
 * path-based request middleware reproduces that part in one place. If you add
 * a route, add it to `CACHE_RULES` in `./cache-rules.ts` — forgetting to means
 * it silently gets the default, and for a user-specific route that means one
 * visitor's HTML is served to the next.
 *
 * The per-page `revalidate` is reproduced, but not here: a path rule cannot
 * see block types, so the content loaders set their own headers from
 * `revalidateFor()` (see `contentCacheHeaders`) and the check below leaves
 * them alone. What is left in the table is everything that has no content to
 * judge — `no-store` routes, assets, and the default for anything new.
 */

/** `serverFns.base` in the Start plugin config, which we leave at its default. */
const SERVER_FUNCTION_BASE = '/_serverFn';

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

    result.response.headers.set('cache-control', cacheControlFor(pathname));

    return result;
  }
);

/**
 * `next.config.js#headers()` sent a `Referrer-Policy` with every response: the
 * addresses that carry a token or a login code, and the account pages, send
 * no referrer at all. See `referrerPolicyFor`.
 */
const referrerPolicy = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const result = await next();

    if (!result.response.headers.has('referrer-policy')) {
      result.response.headers.set(
        'referrer-policy',
        referrerPolicyFor(new URL(request.url).pathname)
      );
    }

    return result;
  }
);

/** `poweredByHeader: false` had no equivalent to port — Vite sends none. */
/**
 * Server functions are same-origin by contract, so a cross-site caller is
 * never legitimate. Most of ours only read public content, but the `?jwt=`
 * magic link reaches `createSessionWithJWT` and writes the auth cookie
 * (`ssr.ts`), which is exactly the shape CSRF protection exists for.
 *
 * This is a **request** middleware, so it sees documents too, and the filter
 * is what makes it safe: a reader arriving from Google or a social post sends
 * `Sec-Fetch-Site: cross-site` on that top-level navigation, and validating
 * it would answer every inbound link with a 403.
 *
 * `allowRequestsWithoutOriginCheck` covers the case the default rejects
 * outright: a request carrying none of `Sec-Fetch-Site`, `Origin` or
 * `Referer`. Every browser sends at least one, so in practice that is the
 * prerender pass and anything reaching the endpoint without a browser — both
 * already on this side of the trust boundary.
 */
const csrf = createCsrfMiddleware({
  filter: ({ request }) =>
    new URL(request.url).pathname.startsWith(SERVER_FUNCTION_BASE),
  allowRequestsWithoutOriginCheck: true,
});

/**
 * Both Sentry middlewares are server-only in every sense: their handlers are
 * `options.server`, and `requestMiddleware` is never consulted in the browser
 * at all.
 *
 * `createIsomorphicFn` is here for the bundle, not the behaviour. This module
 * is part of the client graph, and `@sentry/tanstackstart-react` resolves
 * there to the whole `@sentry/react` surface — replay, feedback, profiling.
 * A plain top-level import puts all of it in the entry chunk: measured at
 * +457 KB raw / +152 KB gzip, which is most of what splitting the SDK out
 * into its own lazily-imported chunk bought (see `sentry/register-client.ts`).
 * The transform drops the server branch *and the import that only it uses*
 * from the client build, so the cost goes back to zero.
 */
const sentryMiddleware = createIsomorphicFn()
  .server(() => ({
    request: [sentryGlobalRequestMiddleware],
    fn: [sentryGlobalFunctionMiddleware],
  }))
  .client(() => ({ request: [], fn: [] }));

/**
 * Sentry goes first in both arrays so its handler is the outermost `next()`
 * and sees anything the middlewares after it throw. The request middleware
 * only reports — the span itself is opened by `wrapFetchWithSentry` in
 * `server.ts` — while the function middleware is what renames that span after
 * the server function it actually ran, instead of leaving the generated id in
 * the trace.
 */
const sentry = sentryMiddleware();

export const startInstance = createStart(() => ({
  requestMiddleware: [...sentry.request, cacheHeaders, referrerPolicy, csrf],
  functionMiddleware: [...sentry.fn],
}));
