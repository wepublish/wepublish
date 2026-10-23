import { Agent, fetch } from 'undici';

/**
 * The media server talks to Cloudflare R2 through `@nestjs/storage`'s `S3Disk`,
 * which sends every request through `fetch`. Node's global `fetch` dispatcher
 * opens a socket for every concurrent request, without limit. During a storage
 * or egress blip the connects to R2 hung while new sockets kept opening.
 * Enough of those wedged the pod — it stopped answering `/health`, readiness
 * dropped it (a 502 from the route) and liveness killed it (exit 137).
 *
 * See `gotchas.md` "⚠️ The R2 client must bound its sockets".
 */

/**
 * Bounds how many sockets (and so hung connects) pile up per origin, so a
 * storage blip makes further requests queue instead of starving the process.
 * undici's defaults cover the rest: connects time out after 10 s and idle
 * keep-alive sockets close after 4 s.
 */
export const DEFAULT_MAX_CONNECTIONS = 50;

export const DEFAULT_RESPONSE_TIMEOUT = 30_000;

export type StorageFetchOptions = {
  responseTimeout?: number;
};

/**
 * Builds the `fetch` the `S3Disk`s use for R2/S3. It is undici's own `fetch`,
 * not the global one: Node bundles a different undici major, and a dispatcher
 * from one major is not guaranteed to work with the other's `fetch`.
 */
export function createStorageFetch({
  responseTimeout = DEFAULT_RESPONSE_TIMEOUT,
}: StorageFetchOptions = {}): typeof globalThis.fetch {
  const dispatcher = new Agent({
    connections: DEFAULT_MAX_CONNECTIONS,
    headersTimeout: responseTimeout,
    bodyTimeout: responseTimeout,
  }).compose(
    dispatch => (options, handler) =>
      dispatch(
        options.method === 'HEAD' ? { ...options, reset: false } : options,
        handler
      )
  );
  const storageFetch: typeof fetch = (input, init) =>
    fetch(input, { ...init, dispatcher });

  // Same API at runtime, but undici ships its own type declarations, which do
  // not line up with the ones `@types/node` gives the global `fetch`.
  return storageFetch as unknown as typeof globalThis.fetch;
}
