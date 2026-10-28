/**
 * The server entry — and the ISR replacement.
 *
 * TanStack Start has no `next.config.js#cacheHandler`, but it hands over the
 * whole fetch pipeline here, which is enough to run the exact same page cache
 * the Next tenants use: a pod-local LRU in front of Dragonfly, invalidated by
 * the namespace versions the API writes. See `withPageCache` in
 * `@wepublish/utils/website/tanstack/page-cache` and §5 of
 * `docs/tanstack-start-migration.md`.
 *
 * It is a no-op without `REDIS_URL` + `REDIS_KEY_PREFIX` + `APP_RELEASE_ID`,
 * so `vite dev` behaves exactly as it did before.
 */
import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import { withEmotionExtraction } from '@wepublish/utils/website/tanstack/server';
import { withPageCache } from '@wepublish/utils/website/tanstack/page-cache';
import {
  captureServerError,
  wrapFetchWithSentry,
} from '@wepublish/utils/website/tanstack/sentry';

// `Sentry.init` deliberately does NOT happen here. It runs in
// `src/instrument.server.ts`, which `node --import` loads before this module,
// because an init that happens after the bundle is evaluated cannot attach
// auto-instrumentation to anything it already imported.

// Extraction runs inside the cache, so a stored page already has the
// styles in its `<head>` and a hit never re-extracts.
const cached = withPageCache(withEmotionExtraction(handler.fetch));

// `wrapFetchWithSentry` is the outermost wrapper on purpose. It opens the
// request span and writes the `sentry-trace` / `baggage` meta tags into the
// document, and both have to be per-request: applied *inside* `withPageCache`
// the trace of whichever request happened to render the page would be stored
// with it and replayed to every later visitor.
//
// It does not see exceptions thrown while React renders — Start catches those
// itself — which is why `captureServerError` stays.
export default createServerEntry(
  wrapFetchWithSentry({
    fetch: async (...args: Parameters<typeof cached>) => {
      try {
        return await cached(...args);
      } catch (error) {
        captureServerError(error);
        throw error;
      }
    },
  })
);
