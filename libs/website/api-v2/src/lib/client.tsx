import {ApolloClient, HttpLink, InMemoryCache, ApolloProvider, ApolloLink} from '@apollo/client'
import {ComponentType, memo, useMemo} from 'react'

export const getV2ApiClient = (apiUrl: string, links: ApolloLink[]) => {
  const httpLink = new HttpLink({uri: `${apiUrl}/v2`})
  const link = links?.reduce((links, link) => links.concat(link), httpLink)

  return new ApolloClient({
    link,
    cache: new InMemoryCache()
  })
}

export const useV2ApiClient = (apiUrl: string, links: ApolloLink[] = []) =>
  useMemo(() => getV2ApiClient(apiUrl, links), [apiUrl, links])

export const createWithV2ApiClient =
  (apiUrl: string, links: ApolloLink[] = []) =>
  <
    // eslint-disable-next-line @typescript-eslint/ban-types
    P extends object
  >(
    ControlledComponent: ComponentType<P>
  ) =>
    memo<P>(props => {
      const client = useV2ApiClient(apiUrl, links)

      return (
        <ApolloProvider client={client}>
          <ControlledComponent {...props} />
        </ApolloProvider>
      )
    })
