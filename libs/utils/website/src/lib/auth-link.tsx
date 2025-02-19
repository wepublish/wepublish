import {ApolloLink, DefaultContext} from '@apollo/client'
import {AuthTokenStorageKey} from '@wepublish/authentication/website'
import {getCookie} from 'cookies-next'

export const authLink = new ApolloLink((operation, forward) => {
  const {token} = JSON.parse(getCookie(AuthTokenStorageKey)?.toString() ?? '{}')

  operation.setContext((context: DefaultContext) => ({
    ...context,
    headers: {
      ...context.headers,
      authorization: token ? `Bearer ${token}` : ''
    },
    credentials: 'include'
  }))

  return forward(operation)
})

export const ssrAuthLink = (token: string | undefined | (() => string | undefined)): ApolloLink =>
  new ApolloLink((operation, forward) => {
    operation.setContext((context: DefaultContext) => ({
      ...context,
      headers: {
        ...context.headers,
        authorization: token ? `Bearer ${typeof token === 'function' ? token() : token}` : ''
      },
      credentials: 'include'
    }))

    return forward(operation)
  })
