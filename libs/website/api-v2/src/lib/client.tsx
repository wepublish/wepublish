import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  ApolloLink,
  NormalizedCacheObject
} from '@apollo/client'
import {ComponentType, memo, useMemo} from 'react'
import {BatchHttpLink} from '@apollo/client/link/batch-http'

export const getV2ApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cache?: NormalizedCacheObject
) => {
  const httpLink = new BatchHttpLink({
    uri: `${apiUrl}/v2`,
    batchMax: 5,
    batchInterval: 20
  })
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

export const useV2ApiClient = (
  apiUrl: string,
  links: ApolloLink[] = [],
  cache?: NormalizedCacheObject
) => useMemo(() => getV2ApiClient(apiUrl, links, cache), [apiUrl, links, cache])

export const createWithV2ApiClient =
  (apiUrl: string, links: ApolloLink[] = [], cache?: NormalizedCacheObject) =>
  <
    // eslint-disable-next-line @typescript-eslint/ban-types
    P extends object
  >(
    ControlledComponent: ComponentType<P>
  ) =>
    memo<P>(props => {
      const client = useV2ApiClient(apiUrl, links, cache)

      return (
        <ApolloProvider client={client}>
          <ControlledComponent {...props} />
        </ApolloProvider>
      )
    })
