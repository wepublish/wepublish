import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import {
  FullSessionWithTokenWithoutUserFragment,
  getApiClient,
  LoginWithJwtDocument,
} from '@wepublish/website/api';

import { getApiUrl } from '../lib/api-url';
import { ssrAuthLink } from '../lib/auth-link';
import { SerializedApolloState } from './apollo';

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
