/**
 * The shared page cache, wired into a TanStack Start server entry.
 *
 * ## Why this file exists
 *
 * Next has `next.config.js#cacheHandler`: a class with `get`/`set` that Next
 * calls around its own ISR machinery. TanStack Start has no such hook — see
 * `docs/tanstack-start-migration.md` §5. What it does have is `src/server.ts`,
 * a plain fetch handler, which is strictly more control: the cache check runs
 * *before* the router boots, so a hit never instantiates it at all.
 *
 * So only the adapter is new. The two-tier LRU, the namespace-version checks,
 * the render lock and the Dragonfly client are the exact same modules the 19
 * Next tenants use (`../lib/page-cache/`), and the invalidation protocol the
 * API writes (`nsv:website:pages`, `nsv:website:path:<path>`,
 * `website:heartbeat` — see `libs/kv-ttl-cache/api`) is untouched. A publish
 * invalidates a TanStack tenant and a Next tenant through the same key.
 *
 * ## The one thing Next did for us
 *
 * Next's contract is that `get()` returns `lastModified: 1` ("stale"), Next
 * serves that HTML, and then *Next* schedules the re-render that calls
 * `set()`. Nobody does that here, so this adapter fires the background render
 * itself. Everything else in `page-cache.js` — the `startRender` backoff, the
 * shared lock, the grace window — already assumes exactly one re-render per
 * stale hit, so supplying that trigger is the whole port.
 *
 * ## What is cacheable
 *
 * Deliberately not a second path list. The request side only rules out what
 * can never be a cacheable document (non-GET, RPC, assets, non-HTML); the
 * *response* decides whether it may be stored, by its own `cache-control`.
 * That makes `CACHE_RULES` in `src/start.ts` the single source of truth —
 * mark a route `no-store` there and it stops being stored here too.
 *
 * ⚠ The corollary: a user-specific route that is missing from `CACHE_RULES`
 * gets the 60s default and its HTML is then shared between visitors. That was
 * already true of the CDN policy, but the blast radius is now also Dragonfly.
 */
import { createPageCache } from '../lib/page-cache/page-cache';
import type {
  PageCacheClock,
  PageCacheValue,
} from '../lib/page-cache/page-cache';
import { createSharedStore } from '../lib/page-cache/shared-store';

/** `page-cache.js` marks a stale entry by dating it to the epoch plus 1ms. */
const STALE = 1;

const PAGES = { kind: 'PAGES' } as const;

/**
 * Paths that are never a cacheable document. `/api` and `/_serverFn` are
 * per-user by definition, `/_build` is hashed and immutable.
 */
const NEVER_A_DOCUMENT = /^\/(_serverFn|_build|api)(\/|$)/;

/** `no-store` and `private` both mean "do not keep this anywhere shared". */
const NEVER_STORE = /(^|[\s,])(no-store|private)(\s*[,;]|\s*$)/;

const S_MAXAGE = /s-maxage=(\d+)/;

/**
 * Recomputed by `Response` from the replayed body, and wrong if carried over:
 * the stored HTML is decoded, the original `content-length` was not.
 */
const TRANSFER_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'set-cookie',
  'date',
]);

const defaultClock: PageCacheClock = {
  now: () => Date.now(),
  perfNow: () => performance.timeOrigin + performance.now(),
};

/**
 * Matches the handler shape of `@tanstack/react-start/server-entry` without
 * importing it — this adapter has no TanStack dependency of its own. The
 * options type is generic so wrapping a handler neither widens nor narrows
 * whatever request context the app declared.
 */
export type StartFetch<TOptions = never> = (
  request: Request,
  opts?: TOptions
) => Response | Promise<Response>;

export type StartPageCacheOptions = {
  env?: Record<string, string | undefined>;
  /**
   * Scopes every key, so a new deploy never serves the previous build's HTML
   * against new asset URLs. Defaults to `APP_RELEASE_ID`; without one the
   * cache stays pod-local, exactly as it does without `REDIS_URL`.
   */
  buildId?: string;
  clock?: PageCacheClock;
  logger?: Pick<Console, 'error'>;
  /**
   * Where background revalidation is handed off to. The default just detaches
   * the promise, which is right for a long-lived node server; a serverless
   * host would pass its own `waitUntil` so the render is not killed with the
   * response.
   */
  waitUntil?: (promise: Promise<unknown>) => void;
};

/** Wraps a server entry's fetch handler with the shared page cache. */
export type PageCacheWrapper = <TOptions>(
  fetch: StartFetch<TOptions>
) => StartFetch<TOptions>;

const isDocumentRequest = (request: Request) => {
  if (request.method !== 'GET') {
    return false;
  }

  const { pathname } = new URL(request.url);

  // A dot means a file: `/favicon.ico`, `/rss.xml`, `/sitemap.xml`. None of
  // them are documents and all of them set their own cache headers.
  if (NEVER_A_DOCUMENT.test(pathname) || pathname.includes('.')) {
    return false;
  }

  return !!request.headers.get('accept')?.includes('text/html');
};

/**
 * A prefetch is not followed by a render, so it must not claim the render
 * lock — otherwise the visit that follows is held back behind a lock nobody
 * is going to release. Next signalled this with `purpose`; browsers use
 * `sec-purpose`.
 */
const isPrefetch = (request: Request) =>
  request.headers.get('purpose') === 'prefetch' ||
  !!request.headers.get('sec-purpose')?.includes('prefetch');

/** How long the response says a shared cache may keep it, if at all. */
const revalidateSeconds = (response: Response) => {
  const cacheControl = response.headers.get('cache-control') ?? '';

  if (NEVER_STORE.test(cacheControl)) {
    return undefined;
  }

  const sMaxAge = S_MAXAGE.exec(cacheControl);

  return sMaxAge ? Number(sMaxAge[1]) : undefined;
};

const storedHeaders = (response: Response) =>
  [...response.headers].filter(([name]) => !TRANSFER_HEADERS.has(name));

const toResponse = (value: PageCacheValue, stale: boolean) =>
  new Response(value.html ?? '', {
    status: value.status ?? 200,
    headers: [
      ...(value.headers ?? []),
      ['x-page-cache', stale ? 'STALE' : 'HIT'],
    ],
  });

export const createStartPageCache = (
  options: StartPageCacheOptions = {}
): PageCacheWrapper => {
  const env = options.env ?? process.env;
  const logger = options.logger ?? console;
  const buildId = options.buildId ?? env['APP_RELEASE_ID'];

  // Prerendering runs this server in-process during `vite build`. Those
  // renders are build artefacts, not traffic, and must not reach Dragonfly.
  const shared =
    buildId && env['PRERENDER'] !== '1' ?
      createSharedStore({ env, buildId, logger })
    : undefined;

  const cache = createPageCache({
    shared,
    clock: options.clock ?? defaultClock,
  });

  const detach =
    options.waitUntil ??
    ((promise: Promise<unknown>) => {
      void promise;
    });

  const store = async (key: string, response: Response) => {
    // A 404 is stored as a deletion: `page-cache.js` drops the entry and
    // releases the lock, so an unpublished article stops being served the
    // moment the API says it is gone.
    if (response.status === 404) {
      await cache.set(key, { kind: 'PAGES', status: 404 });

      return;
    }

    const revalidate = revalidateSeconds(response);

    if (
      revalidate === undefined ||
      response.status !== 200 ||
      response.headers.has('set-cookie')
    ) {
      return;
    }

    await cache.set(
      key,
      {
        kind: 'PAGES',
        // Rejects if the stream dies mid-flight, which keeps a truncated
        // document out of the cache.
        html: await response.text(),
        status: response.status,
        headers: storedHeaders(response),
      },
      { cacheControl: { revalidate } }
    );
  };

  /** Renders, hands the stream to the caller, and stores a buffered copy. */
  const renderAndServe = async <TOptions>(
    fetch: StartFetch<TOptions>,
    request: Request,
    opts: TOptions | undefined,
    key: string
  ) => {
    const response = await fetch(request, opts);
    const copy = response.clone();

    detach(
      store(key, copy).catch((error: unknown) => {
        logger.error('[page-cache] not storing a failed render', error);
      })
    );

    return response;
  };

  /** Renders only to refresh the entry; the response itself is discarded. */
  const renderInBackground = <TOptions>(
    fetch: StartFetch<TOptions>,
    request: Request,
    opts: TOptions | undefined,
    key: string
  ) =>
    detach(
      (async () => {
        try {
          await store(key, await fetch(new Request(request), opts));
        } catch (error) {
          logger.error('[page-cache] background revalidation failed', error);
        }
      })()
    );

  return fetch => async (request, opts) => {
    if (!isDocumentRequest(request)) {
      return fetch(request, opts);
    }

    const url = new URL(request.url);
    // The query belongs in the key — `/a?page=2` is a different document. It
    // also keeps paginated paths out of the per-article version lookup in
    // `page-cache.js`, which falls back to the global `website:pages` version
    // for them. Less precise, never wrong.
    const key = url.pathname + url.search;
    const entry = await cache.get(key, PAGES, {
      prefetch: isPrefetch(request),
    });

    if (!entry?.value) {
      return renderAndServe(fetch, request, opts, key);
    }

    const stale = entry.lastModified === STALE;

    if (stale) {
      renderInBackground(fetch, request, opts, key);
    }

    return toResponse(entry.value, stale);
  };
};

let instance: PageCacheWrapper | undefined;

/**
 * The cache the app actually runs on. One per process, created on first use
 * so `process.env` is read at runtime rather than at import time.
 */
export const withPageCache = <TOptions>(fetch: StartFetch<TOptions>) =>
  (instance ??= createStartPageCache())(fetch);
