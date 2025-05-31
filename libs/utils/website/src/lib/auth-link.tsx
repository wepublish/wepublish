import {ApolloLink, DefaultContext} from '@apollo/client'
import {AuthTokenStorageKey} from '@wepublish/authentication/website'
import {getCookie} from 'cookies-next'

export const authLink = new ApolloLink((operation, forward) => {
  const {token: cookieToken} = JSON.parse(getCookie(AuthTokenStorageKey)?.toString() ?? '{}')
  const {token: sessionStorageToken} = JSON.parse(
    sessionStorage.getItem(AuthTokenStorageKey) ?? '{}'
  )
  const token = cookieToken ?? sessionStorageToken

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

export const ssrAuthLink = (
  token: string | undefined | (() => string | undefined | Promise<string | undefined>)
): ApolloLink =>
  new ApolloLink((operation, forward) => {
    operation.setContext(async (context: DefaultContext) => {
      const tok = typeof token === 'function' ? await token() : token

      return {
        ...context,
        headers: {
          ...context.headers,
          authorization: tok ? `Bearer ${tok}` : ''
        },
        credentials: 'include'
      }
    })

    return forward(operation)
  })
