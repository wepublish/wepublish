import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  DefaultOptions,
  from,
  HttpLink,
  InMemoryCache,
  InMemoryCacheConfig,
  NormalizedCacheObject,
  split,
} from '@apollo/client';
import { mergeDeepRight } from 'ramda';
import possibleTypes from './graphql';

import { ComponentType, memo, useMemo } from 'react';
import { createUploadLink } from 'apollo-upload-client';
import { absoluteUrlToRelative } from './absolute-url-to-relative';

export const V1_CLIENT_STATE_PROP_NAME = '__APOLLO_STATE_V1__';

let CACHED_CLIENT: ApolloClient<NormalizedCacheObject>;

const isFile = (value: unknown): boolean =>
  Boolean(
    (typeof File !== 'undefined' && value instanceof File) ||
      (typeof Blob !== 'undefined' && value instanceof Blob) ||
      (value && typeof value === 'object' && Object.values(value).some(isFile))
  );

const createV1ApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  // If operation is uploading a file, use the upload link, else use the normal http link
  const httpLink = split(
    ({ variables }) => isFile(variables),
    createUploadLink({
      uri: `${apiUrl}/v1`,
    }),
    new HttpLink({ uri: `${apiUrl}/v1` })
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
      typePolicies:
        (
          process.env.NODE_ENV !== 'production' ||
          process.env.DEPLOY_ENV === 'review'
        ) ?
          absoluteUrlToRelative
        : undefined,
      ...cacheConfig,
    }).restore(cache ?? {}),
    ssrMode: typeof window === 'undefined',
    assumeImmutableResults: true,
    ssrForceFetchDelay: 100,
    defaultOptions,
  });
};

export const getV1ApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  const client =
    !CACHED_CLIENT || typeof window === 'undefined' ?
      (CACHED_CLIENT = createV1ApiClient(apiUrl, links, cacheConfig, cache))
    : CACHED_CLIENT;

  if (cache) {
    const existingCache = client.extract();
    const data = mergeDeepRight(existingCache, cache) as NormalizedCacheObject;

    client.cache.restore(data);
  }

  return client;
};

export const useV1ApiClient = (
  apiUrl: string,
  links: ApolloLink[] = [],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  const client = useMemo(
    () => getV1ApiClient(apiUrl, links, cacheConfig, cache),
    [apiUrl, links, cache, cacheConfig]
  );

  return client;
};

export const createWithV1ApiClient =
  (
    apiUrl: string,
    links: ApolloLink[] = [],
    cacheConfig?: InMemoryCacheConfig
  ) =>
  <
    // eslint-disable-next-line @typescript-eslint/ban-types
    P extends object,
    NextPage extends {
      pageProps?: { [V1_CLIENT_STATE_PROP_NAME]?: NormalizedCacheObject };
    },
  >(
    ControlledComponent: ComponentType<P>
  ) =>
    memo<P | NextPage>(props => {
      const client = useV1ApiClient(
        apiUrl,
        links,
        cacheConfig,
        (props as NextPage).pageProps?.[V1_CLIENT_STATE_PROP_NAME]
      );

      return (
        <ApolloProvider client={client}>
          <ControlledComponent {...(props as P)} />
        </ApolloProvider>
      );
    });

export function addClientCacheToV1Props<P extends object>(
  client: ApolloClient<NormalizedCacheObject>,
  pageProps: P
) {
  return {
    ...pageProps,
    [V1_CLIENT_STATE_PROP_NAME]: client.cache.extract(),
  };
}
