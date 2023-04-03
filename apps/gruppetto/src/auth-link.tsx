import {ApolloLink} from '@apollo/client'
import {getCookie} from 'cookies-next'
import {AuthTokenStorageKey} from './session.provider'

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
