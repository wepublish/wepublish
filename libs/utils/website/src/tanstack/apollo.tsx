import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { previewLink } from '@wepublish/website/admin';
import { getApiClient, PublicEnv } from '@wepublish/website/api';
import { mergeDeepRight } from 'ramda';
import { PropsWithChildren } from 'react';

import { getApiUrl } from '../lib/api-url';
import { authLink } from '../lib/auth-link';

/**
 * Apollo <-> TanStack Start wiring.
 *
 * This uses TanStack Router's own `dehydrate`/`hydrate` hooks, the same
 * mechanism the official TanStack Query integration uses, instead of shipping
 * the cache through per-route loader data (which is what the Next app had to
 * do with `pageProps.__APOLLO_STATE_V1__`).
 *
 * Why it is safe:
 *  - On the server, `getRouter()` is invoked **once per request** by
 *    `createStartHandler`, so every request gets its own `ApolloClient` and
 *    two concurrent requests can never see each other's cache.
 *  - `getApiClient` already returns a brand new client whenever `window` is
 *    undefined, and the browser singleton otherwise.
 *  - `dehydrate()` runs after all loaders resolved, so the extract is complete.
 */

/**
 * The API URL the *browser* must use. `window.PUBLIC_ENV` is written by the
 * root shell in `<head>`, which executes before the deferred client bundle, so
 * it is always there by the time the router is constructed. The build-time
 * `process.env.API_URL` is only a fallback.
 */
const getBrowserApiUrl = () =>
  (typeof window !== 'undefined' ? window.PUBLIC_ENV?.apiUrl : undefined) ||
  process.env.API_URL ||
  '';

/**
 * Builds the client for the current environment.
 *
 * Server: anonymous — the SSR response has to stay user agnostic so it can be
 * CDN cached, exactly like `getStaticProps` was. Routes that need an
 * authenticated server query (`/profile*`, `/mitmachen`) do it in a
 * `createServerFn` with its own short-lived client and merge the result in.
 *
 * Browser: `authLink` (reads the auth cookie / sessionStorage) and
 * `previewLink`.
 */
export const createRouterApolloClient = (): ApolloClient => {
  if (typeof window === 'undefined') {
    return getApiClient(getApiUrl(), []);
  }

  return getApiClient(getBrowserApiUrl(), [authLink, previewLink]);
};

export type ApolloRouterContext = { apolloClient: ApolloClient };

/**
 * TanStack type-checks server function and `dehydrate()` return values against
 * a "is this serializable?" conditional type. Both `NormalizedCacheObject`
 * (whose `StoreValue` union contains `Object`) and `Record<string, unknown>`
 * fail it — the *data* is plain JSON, the types are just too loose. This is
 * the narrowest shape that passes.
 */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type SerializedApolloState = Record<string, JsonValue>;

export type ApolloDehydratedState = {
  apollo: SerializedApolloState;
};

/**
 * Spread into `createRouter({...})`. Supplies the client as router context,
 * dehydrates the cache into the SSR payload and restores it on the client
 * before the first render.
 */
export const apolloRouterOptions = (apolloClient: ApolloClient) => ({
  context: { apolloClient } satisfies ApolloRouterContext,
  dehydrate: (): ApolloDehydratedState => ({
    apollo: apolloClient.extract() as SerializedApolloState,
  }),
  hydrate: (dehydrated: ApolloDehydratedState) => {
    apolloClient.cache.restore(dehydrated.apollo as NormalizedCacheObject);
  },
});

/**
 * Merges a cache extracted elsewhere (a `createServerFn` that needed an
 * authenticated client) into the router's client. Call it from the loader, not
 * from a component.
 */
export const mergeApolloCache = (
  client: ApolloClient,
  incoming: SerializedApolloState | undefined
) => {
  if (!incoming) {
    return;
  }

  client.cache.restore(
    mergeDeepRight(
      client.extract() as NormalizedCacheObject,
      incoming as NormalizedCacheObject
    ) as NormalizedCacheObject
  );
};

export const WepublishApolloProvider = ({
  client,
  children,
}: PropsWithChildren<{ client: ApolloClient }>) => {
  // Belt and braces for the `ssrForceFetchDelay` trap described in
  // `libs/website/api/src/lib/client.tsx`: if cache prioritisation is ever off
  // while rendering on the server, every `useQuery` ignores the cache the
  // loaders just filled and the page server-renders empty. Re-assert it here,
  // which runs before any child renders.
  if (typeof window === 'undefined') {
    client.prioritizeCacheValues = true;
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export type { PublicEnv };
