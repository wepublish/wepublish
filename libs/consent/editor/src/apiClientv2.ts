import {ApolloClient, ApolloLink, createHttpLink, InMemoryCache} from '@apollo/client'

export enum ElementID {
  Settings = 'settings',
  ReactRoot = 'react-root'
}

export interface ClientSettings {
  readonly apiURL: string
  readonly peerByDefault: boolean
  readonly imgMinSizeToCompress: number
}

export enum LocalStorageKey {
  SessionToken = 'sessionToken'
}

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

export function getSettings(): ClientSettings {
  const defaultSettings = {
    apiURL: 'http://localhost:4000',
    peerByDefault: false,
    imgMinSizeToCompress: 10
  }

  const settingsJson = document.getElementById(ElementID.Settings)

  return settingsJson
    ? JSON.parse(document.getElementById(ElementID.Settings)!.textContent!)
    : defaultSettings
}

export function getApiClientV2() {
  const {apiURL} = getSettings()
  return new ApolloClient({
    link: authLink.concat(createHttpLink({uri: `${apiURL}/v2`, fetch})),
    cache: new InMemoryCache()
  })
}
