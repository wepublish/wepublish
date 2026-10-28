import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  getCookie,
  getRequestHeader,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import {
  FullSessionWithTokenWithoutUserFragment,
  getApiClient,
  LoginWithJwtDocument,
} from '@wepublish/website/api';

import { getApiUrl } from '../lib/api-url';
import { ssrAuthLink } from '../lib/auth-link';
import { contentCacheControl } from './content-cache-control';
import { createRouterApolloClient, SerializedApolloState } from './apollo';

/**
 * **Server only.** Everything here reads or writes the current request and may
 * therefore only be called from inside a `createServerFn` handler or a server
 * route handler. The TanStack Start Vite plugin strips those bodies — and the
 * imports only they use — out of the client bundle; importing this module from
 * a component trips import protection at build time, which is intentional.
 *
 * Exposed as `@wepublish/utils/website/tanstack/server`.
 */

/** Port of `getSessionTokenProps` without the `NextPageContext`. */
export const getRequestSessionToken =
  (): FullSessionWithTokenWithoutUserFragment | null => {
    const raw = getCookie(AuthTokenStorageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as FullSessionWithTokenWithoutUserFragment;
    } catch (error) {
      console.error(error);

      return null;
    }
  };

/**
 * Short-lived authenticated client for one server function call.
 *
 * Deliberately **not** the router's client: that one is shared with the
 * SSR render and must stay anonymous so the HTML can be CDN cached.
 * `getApiClient` builds a fresh instance whenever `window` is undefined, so
 * concurrent requests never share a cache.
 *
 * `getApiUrl()` prefers `API_URL_INTERNAL`, the in-cluster address — never
 * leak that to the browser, that is what `getPublicEnv()` is for.
 */
export const createAuthenticatedSsrClient = () => {
  // Mutable on purpose: `handleJwtLogin` may mint a session *during* this
  // request. `setCookie` only writes a response header, so re-reading the
  // request cookie afterwards would still yield the old (or no) token.
  let token = getRequestSessionToken()?.token;

  const client = getApiClient(getApiUrl(), [ssrAuthLink(() => token)]);

  return {
    client,
    setToken: (next: string | undefined) => {
      token = next;
    },
  };
};

/** Anonymous server client, for server routes (feeds, sitemap). */
export const createSsrClient = (): ApolloClient =>
  getApiClient(getApiUrl(), []);

/**
 * Everything the browser needs from the environment, read at **runtime**.
 *
 * The root shell serialises this into `window.PUBLIC_ENV`, and the app's Vite
 * config rewrites every client-side `process.env.X` into a lookup on that
 * object. Net effect: one build artefact works in dev, review, staging and
 * production — Next inlined these at build time and needed an image per
 * environment.
 *
 * Keys are the raw env var names so the `define` rewrite lines up; `apiUrl` is
 * the extra camelCase alias that `createWithApiClient` and the router's Apollo
 * client already expect.
 *
 * `API_URL_INTERNAL` is **not** here on purpose: it is the in-cluster address
 * and must never reach the browser.
 */
export type RuntimePublicEnv = {
  apiUrl: string;
  API_URL: string;
  APP_ENVIRONMENT: string;
  APP_NAME: string;
  APP_RELEASE_ID: string;
  SSR_FETCH_TIMEOUT_MS: string;
  SENTRY_DSN: string;
  WEBSITE_URL: string;
};

export const getPublicEnv = (): RuntimePublicEnv => {
  const apiUrl = process.env.API_URL ?? '';

  return {
    apiUrl,
    API_URL: apiUrl,
    APP_ENVIRONMENT: process.env.APP_ENVIRONMENT ?? '',
    APP_NAME: process.env.APP_NAME ?? '',
    APP_RELEASE_ID: process.env.APP_RELEASE_ID ?? '',
    SSR_FETCH_TIMEOUT_MS: process.env.SSR_FETCH_TIMEOUT_MS ?? '',
    SENTRY_DSN: process.env.SENTRY_DSN ?? '',
    // The browser needs this to tell a link to this very site from a link to
    // another one; see `toInternalHref`. Falling back to the request host
    // keeps it correct without every deployment having to set the variable.
    WEBSITE_URL: getSiteUrl(),
  };
};

/** Shape returned by the authenticated loaders, merged into the router client. */
export type AuthenticatedLoaderResult = {
  sessionToken: FullSessionWithTokenWithoutUserFragment | null;
  apollo: SerializedApolloState;
};

export const extractCache = (client: ApolloClient): SerializedApolloState =>
  client.extract() as NormalizedCacheObject as SerializedApolloState;

/**
 * Port of `handleJwtLogin`. Returns the minted session, or `null`.
 * TOTP-protected accounts fall through to the client-side `withJwtHandler`,
 * same as before.
 */
export const handleJwtLogin = async (
  client: ApolloClient,
  jwt: string | undefined,
  httpOnlyCookie?: boolean
): Promise<FullSessionWithTokenWithoutUserFragment | null> => {
  if (!jwt) {
    return null;
  }

  const { data, error } = await client.mutate({
    mutation: LoginWithJwtDocument,
    variables: { jwt },
    errorPolicy: 'all',
  });

  if (error || !data?.createSessionWithJWT) {
    return null;
  }

  const session = {
    __typename: 'SessionWithTokenWithoutUser',
    token: data.createSessionWithJWT.token,
    expiresAt: data.createSessionWithJWT.expiresAt,
    createdAt: data.createSessionWithJWT.createdAt,
  } satisfies FullSessionWithTokenWithoutUserFragment;

  setCookie(AuthTokenStorageKey, JSON.stringify(session), {
    expires: new Date(data.createSessionWithJWT.expiresAt),
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: !!httpOnlyCookie,
    path: '/',
  });

  return session;
};

/** Absolute site URL for the feed and sitemap server routes. */
export const getSiteUrl = () => {
  if (process.env.WEBSITE_URL) {
    return process.env.WEBSITE_URL;
  }

  const host = getRequestHeader('host');

  return host ? `https://${host}` : '';
};

/**
 * What a content loader hands back so the window can be derived from it.
 *
 * An Apollo `QueryResult` is the common case and is understood directly; a
 * loader that fetches several things returns the one that decides the window.
 * Returning nothing still works and falls back to the shortest window, which
 * is what every loader did before this existed.
 */
export type ContentResult =
  { data?: unknown; error?: unknown } | unknown | void;

const toContent = (result: ContentResult) => {
  const asQuery = result as { data?: unknown; error?: unknown } | undefined;

  return asQuery && typeof asQuery === 'object' && 'data' in asQuery ?
      { content: asQuery.data, errors: asQuery.error }
    : { content: result, errors: undefined };
};

/**
 * Runs content queries on the server and hands the cache back to the caller.
 *
 * Route loaders are isomorphic: on a client-side navigation they execute in
 * the browser, so querying the router's Apollo client there sends GraphQL
 * straight from the visitor to the API — one round trip per query, per
 * navigation, per visitor, with nothing in front of it. Next never did that;
 * it fetched one `getStaticProps` payload from its own origin and served it
 * from the shared page cache.
 *
 * Wrapping a prefetch in a server function restores that shape: the browser
 * makes a single request to this origin, the queries run here, and the
 * extracted cache travels back as JSON for `mergeApolloCache`.
 *
 * The client is anonymous by construction — it never reads the request's auth
 * cookie — which is what makes the response safe to share. Opting into the
 * cache header explicitly, here, keeps the policy deny-by-default: every
 * `/_serverFn` request is `no-store` under `src/start.ts` unless a response
 * overrides it. An authenticated loader that forgets simply is not cached.
 */
export const runContentQueries = async (
  run: (client: ApolloClient) => Promise<ContentResult>
) => {
  const client = createRouterApolloClient();

  const result = await run(client);
  const { content, errors } = toContent(result);

  setResponseHeader('cache-control', contentCacheControl(content, errors));

  return extractCache(client);
};
