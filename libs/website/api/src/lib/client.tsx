import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  ApolloLink,
  NormalizedCacheObject
} from '@apollo/client'
import {BatchHttpLink} from '@apollo/client/link/batch-http'

import {ComponentType, memo, useMemo} from 'react'

export const getV1ApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cache?: NormalizedCacheObject
) => {
  const httpLink = new BatchHttpLink({uri: `${apiUrl}/v1`, batchMax: 5, batchInterval: 20})
  const link = [...links, httpLink].reduce(
    (links: ApolloLink | undefined, link) => (links ? links.concat(link) : link),
    undefined
  )

  return new ApolloClient({
    link,
    cache: new InMemoryCache().restore(cache ?? {}),
    ssrMode: typeof window === 'undefined'
  })
}

export const useV1ApiClient = (
  apiUrl: string,
  links: ApolloLink[] = [],
  cache?: NormalizedCacheObject
) => useMemo(() => getV1ApiClient(apiUrl, links, cache), [apiUrl, links, cache])

export const createWithV1ApiClient =
  (apiUrl: string, links: ApolloLink[] = [], cache?: NormalizedCacheObject) =>
  <
    // eslint-disable-next-line @typescript-eslint/ban-types
    P extends object
  >(
    ControlledComponent: ComponentType<P>
  ) =>
    memo<P>(props => {
      const client = useV1ApiClient(apiUrl, links, cache)

      return (
        <ApolloProvider client={client}>
          <ControlledComponent {...props} />
        </ApolloProvider>
      )
    })
