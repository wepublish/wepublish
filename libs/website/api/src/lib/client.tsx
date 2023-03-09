import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloProvider,
  ApolloLink,
  NormalizedCacheObject
} from '@apollo/client'
import {ComponentType, memo, useMemo} from 'react'

export const getV1ApiClient = (
  apiUrl: string,
  links: ApolloLink[],
  cache?: NormalizedCacheObject
) => {
  const httpLink = new HttpLink({uri: `${apiUrl}/v1`})
  const link = links?.reduce((links, link) => links.concat(link), httpLink)

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
