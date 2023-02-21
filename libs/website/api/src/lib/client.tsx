import {ApolloClient, HttpLink, InMemoryCache, ApolloProvider, ApolloLink} from '@apollo/client'
import {ComponentType, memo, useMemo} from 'react'

export const getV1ApiClient = (apiUrl: string, links: ApolloLink[]) => {
  const httpLink = new HttpLink({uri: `${apiUrl}/v1`})
  const link = links?.reduce((links, link) => links.concat(link), httpLink)

  return new ApolloClient({
    link,
    cache: new InMemoryCache()
  })
}

export const useV1ApiClient = (apiUrl: string, links: ApolloLink[] = []) =>
  useMemo(() => getV1ApiClient(apiUrl, links), [apiUrl, links])

export const createWithV1ApiClient =
  (apiUrl: string, links: ApolloLink[] = []) =>
  <
    // eslint-disable-next-line @typescript-eslint/ban-types
    P extends object
  >(
    ControlledComponent: ComponentType<P>
  ) =>
    memo<P>(props => {
      const client = useV1ApiClient(apiUrl, links)

      return (
        <ApolloProvider client={client}>
          <ControlledComponent {...props} />
        </ApolloProvider>
      )
    })
