import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  DefaultOptions,
  from,
  InMemoryCache,
  InMemoryCacheConfig,
  NormalizedCacheObject,
  split,
  TypePolicies,
} from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { mergeDeepRight } from 'ramda';
import possibleTypes from './graphql';

import { ComponentType, createElement, memo, useMemo } from 'react';
import { createUploadLink } from 'apollo-upload-client';
import { absoluteUrlToRelative } from './absolute-url-to-relative';
import { omitDisabledBlocks } from './omit-disabled-blocks';
import { omitSensitiveData } from './omit-sensitive-data';

export const V1_CLIENT_STATE_PROP_NAME = '__APOLLO_STATE_V1__';

let CACHED_CLIENT: ApolloClient<NormalizedCacheObject>;

const isFile = (value: unknown): boolean =>
  Boolean(
    (typeof File !== 'undefined' && value instanceof File) ||
      (typeof Blob !== 'undefined' && value instanceof Blob) ||
      (value && typeof value === 'object' && Object.values(value).some(isFile))
  );

const SSR_FETCH_TIMEOUT_MS = Number(process.env.SSR_FETCH_TIMEOUT_MS) || 10_000;

const createSsrTimeoutFetch =
  (timeoutMs: number): typeof fetch =>
  (input, init) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`SSR fetch timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(timeoutId)
    );
  };

const createApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  const ssrFetchOptions =
    typeof window === 'undefined' ?
      { fetch: createSsrTimeoutFetch(SSR_FETCH_TIMEOUT_MS) }
    : {};

  // If operation is uploading a file, use the upload link, else use the batch http
  const httpLink = split(
    ({ variables }) => isFile(variables),
    createUploadLink({
      uri: `${apiUrl}/v1`,
      ...ssrFetchOptions,
    }),
    new BatchHttpLink({
      uri: `${apiUrl}/v1`,
      batchMax: 5,
      batchInterval: 20,
      ...ssrFetchOptions,
    })
  );

  const link = from([...links, httpLink]);

  let defaultOptions: DefaultOptions = {
    query: {
      errorPolicy: 'all',
    },
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
  };

  if (typeof window === 'undefined') {
    defaultOptions = {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    };
  }

  return new ApolloClient({
    link,
    cache: new InMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
      ...cacheConfig,
      typePolicies: mergeDeepRight(
        (
          process.env.NODE_ENV !== 'production' ||
            process.env.APP_ENVIRONMENT === 'review'
        ) ?
          absoluteUrlToRelative
        : ({} as TypePolicies),
        mergeDeepRight(
          mergeDeepRight(omitDisabledBlocks, omitSensitiveData),
          cacheConfig?.typePolicies ?? ({} as TypePolicies)
        )
      ) as TypePolicies,
    }).restore(cache ?? {}),
    ssrMode: typeof window === 'undefined',
    assumeImmutableResults: true,
    ssrForceFetchDelay: 100,
    defaultOptions,
  });
};

export const getApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  const client =
    !CACHED_CLIENT || typeof window === 'undefined' ?
      (CACHED_CLIENT = createApiClient(apiUrl, links, cacheConfig, cache))
    : CACHED_CLIENT;

  if (cache) {
    const existingCache = client.extract();
    const data = mergeDeepRight(existingCache, cache) as NormalizedCacheObject;

    client.cache.restore(data);
  }

  return client;
};

export const useApiClient = (
  apiUrl: string,
  links: ApolloLink[] = [],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  const client = useMemo(
    () => getApiClient(apiUrl, links, cacheConfig, cache),
    [apiUrl, links, cache, cacheConfig]
  );

  return client;
};

export const createWithApiClient =
  (links: ApolloLink[] = [], cacheConfig?: InMemoryCacheConfig) =>
  <
    P extends object,
    NextPage extends {
      API_URL: string;
      pageProps?: { [V1_CLIENT_STATE_PROP_NAME]?: NormalizedCacheObject };
    },
  >(
    ControlledComponent: ComponentType<P>
  ) =>
    memo<P | NextPage>(props => {
      const client = useApiClient(
        props.API_URL,
        links,
        cacheConfig,
        (props as NextPage).pageProps?.[V1_CLIENT_STATE_PROP_NAME]
      );

      return (
        <ApolloProvider client={client}>
          {createElement(ControlledComponent, props as P)}
        </ApolloProvider>
      );
    });

export function addClientCacheToProps<P extends object>(
  client: ApolloClient<NormalizedCacheObject>,
  pageProps: P
) {
  return {
    ...pageProps,
    [V1_CLIENT_STATE_PROP_NAME]: client.cache.extract(),
  };
}
