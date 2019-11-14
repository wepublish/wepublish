import 'core-js/stable'
import 'regenerator-runtime/runtime'

import React from 'react'
import ReactDOM from 'react-dom'
import {ApolloClient} from 'apollo-client'
import {ApolloLink} from 'apollo-link'
import {InMemoryCache, IntrospectionFragmentMatcher} from 'apollo-cache-inmemory'
import {createUploadLink} from 'apollo-upload-client'
import {ApolloProvider} from '@apollo/react-hooks'

import {createStyleRenderer, renderStyles} from '@karma.run/react'
import {UIProvider} from '@karma.run/ui'

import {hot} from 'react-hot-loader/root'
import {App} from './app'
import {ElementID} from '../shared/elementID'
import {ClientSettings} from '../shared/types'
import {RouteProvider} from './route'
import {AuthProvider} from './authContext'
import {LocalStorageKey} from './utility'

// See: https://www.apollographql.com/docs/react/data/fragments/#fragments-on-unions-and-interfaces
export async function fetchIntrospectionQueryResultData(url: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      variables: {},
      query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `
    })
  })

  const result = await response.json()

  const filteredData = result.data.__schema.types.filter((type: any) => type.possibleTypes !== null)
  result.data.__schema.types = filteredData

  return result.data
}

const HotApp = hot(App)

const onDOMContentLoaded = async () => {
  const {apiURL}: ClientSettings = JSON.parse(
    document.getElementById(ElementID.Settings)!.textContent!
  )

  const introspectionQueryResultData = await fetchIntrospectionQueryResultData(apiURL)
  const authLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem(LocalStorageKey.SessionToken)

    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : ''
      }
    })

    return forward(operation)
  })

  const client = new ApolloClient({
    link: authLink.concat(createUploadLink({uri: apiURL})),
    cache: new InMemoryCache({
      fragmentMatcher: new IntrospectionFragmentMatcher({introspectionQueryResultData})
    })
  })

  const styleRenderer = createStyleRenderer()
  renderStyles(styleRenderer)

  window.addEventListener('dragover', e => e.preventDefault())
  window.addEventListener('drop', e => e.preventDefault())

  ReactDOM.render(
    <UIProvider styleRenderer={styleRenderer} rootElementID={ElementID.ReactRoot}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <RouteProvider>
            <HotApp />
          </RouteProvider>
        </AuthProvider>
      </ApolloProvider>
    </UIProvider>,
    document.getElementById(ElementID.ReactRoot)
  )
}

if (document.readyState !== 'loading') {
  onDOMContentLoaded()
} else {
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded)
}
