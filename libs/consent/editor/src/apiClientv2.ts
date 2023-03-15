import {ApolloClient, HttpLink, InMemoryCache} from '@apollo/client'

export function getApiClientV2() {
  const apiURL = 'http://localhost:4000'
  const link = new HttpLink({uri: `${apiURL}/v2`})
  return new ApolloClient({
    link,
    cache: new InMemoryCache()
  })
}
