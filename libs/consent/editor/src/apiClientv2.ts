import {ApolloClient, ApolloLink, createHttpLink, InMemoryCache} from '@apollo/client'
import {LocalStorageKey} from 'libs/ui/editor/src/lib/utility'

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem(LocalStorageKey.SessionToken)
  const context = operation.getContext()

  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : '',
      ...context.headers
    },
    credentials: 'include',
    ...context
  })

  return forward(operation)
})

export function getApiClientV2() {
  const apiURL = 'http://localhost:4000'
  return new ApolloClient({
    link: authLink.concat(createHttpLink({uri: `${apiURL}/v2`, fetch})),
    cache: new InMemoryCache()
  })
}
