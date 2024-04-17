import {ApolloLink} from '@apollo/client'
import {AuthTokenStorageKey} from '@wepublish/website'
import {getCookie} from 'cookies-next'

export const authLink = new ApolloLink((operation, forward) => {
  const {token} = JSON.parse(getCookie(AuthTokenStorageKey)?.toString() ?? '{}')
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

export const ssrAuthLink = (token: string | undefined | (() => string | undefined)): ApolloLink =>
  new ApolloLink((operation, forward) => {
    const context = operation.getContext()

    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${typeof token === 'function' ? token() : token}` : '',
        ...context.headers
      },
      credentials: 'include',
      ...context
    })

    return forward(operation)
  })
