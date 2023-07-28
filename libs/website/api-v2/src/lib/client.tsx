import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  DefaultOptions,
  InMemoryCache,
  InMemoryCacheConfig,
  NormalizedCacheObject
} from '@apollo/client'
import {BatchHttpLink} from '@apollo/client/link/batch-http'
import {mergeDeepLeft} from 'ramda'
import possibleTypes from './graphql'

import {ComponentType, memo, useMemo} from 'react'

export const V2_CLIENT_STATE_PROP_NAME = '__APOLLO_STATE_V2__'

let CACHED_CLIENT: ApolloClient<NormalizedCacheObject>

const createV2ApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  const httpLink = new BatchHttpLink({uri: `${apiUrl}/v2`, batchMax: 5, batchInterval: 20})
  const link = [...links, httpLink].reduce(
    (links: ApolloLink | undefined, link) => (links ? links.concat(link) : link),
    undefined
  )

  let defaultOptions: DefaultOptions = {
    query: {
      errorPolicy: 'all'
    },
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all'
    }
  }

  if (typeof window === 'undefined') {
    defaultOptions = {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      }
    }
  }

  return new ApolloClient({
    link,
    cache: new InMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
      ...cacheConfig
    }).restore(cache ?? {}),
    ssrMode: typeof window === 'undefined',
    ssrForceFetchDelay: 100,
    defaultOptions
  })
}

export const getV2ApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  const client =
    !CACHED_CLIENT || typeof window === 'undefined'
      ? createV2ApiClient(apiUrl, links, cacheConfig, cache)
      : CACHED_CLIENT

  if (cache) {
    const existingCache = client.extract()
    const data = mergeDeepLeft(existingCache, cache) as NormalizedCacheObject

    client.cache.restore(data)
  }

  return client
}

export const useV2ApiClient = (
  apiUrl: string,
  links: ApolloLink[] = [],
  cacheConfig?: InMemoryCacheConfig,
  cache?: NormalizedCacheObject
) => {
  const client = useMemo(
    () => getV2ApiClient(apiUrl, links, cacheConfig, cache),
    [apiUrl, links, cache, cacheConfig]
  )

  return client
}

export const createWithV2ApiClient =
  (apiUrl: string, links: ApolloLink[] = [], cacheConfig?: InMemoryCacheConfig) =>
  <
    // eslint-disable-next-line @typescript-eslint/ban-types
    P extends object,
    NextPage extends {pageProps?: {[V2_CLIENT_STATE_PROP_NAME]?: NormalizedCacheObject}}
  >(
    ControlledComponent: ComponentType<P>
  ) =>
    memo<P | NextPage>(props => {
      const client = useV2ApiClient(
        apiUrl,
        links,
        cacheConfig,
        (props as NextPage).pageProps?.[V2_CLIENT_STATE_PROP_NAME]
      )

      return (
        <ApolloProvider client={client}>
          <ControlledComponent {...(props as P)} />
        </ApolloProvider>
      )
    })

export function addClientCacheToV2Props<P extends object>(
  client: ApolloClient<NormalizedCacheObject>,
  pageProps: P
) {
  return {
    ...pageProps,
    [V2_CLIENT_STATE_PROP_NAME]: client.cache.extract()
  }
}
