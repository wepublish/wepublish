import 'core-js/stable'
import 'regenerator-runtime/runtime'

import React from 'react'
import ReactDOM from 'react-dom'
import {render as renderStyles} from 'fela-dom'
import {ApolloClient} from 'apollo-client'
import {ApolloLink} from 'apollo-link'
import {InMemoryCache, IntrospectionFragmentMatcher} from 'apollo-cache-inmemory'
import {createUploadLink} from 'apollo-upload-client'
import {ApolloProvider} from '@apollo/react-hooks'

import {createStyleRenderer, UIProvider} from '@karma.run/ui'

import {ElementID} from '../shared/elementID'
import {ClientSettings} from '../shared/types'
import {RouteProvider} from './route'
import {AuthProvider} from './authContext'
import {LocalStorageKey} from './utility'
import {TwitterProvider} from './blocks/embeds/twitter'
import {InstagramProvider} from './blocks/embeds/instagram'
import {FacebookProvider} from './blocks/embeds/facebook'
import {HotApp} from './app'

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

const onDOMContentLoaded = async () => {
  const {apiURL}: ClientSettings = JSON.parse(
    document.getElementById(ElementID.Settings)!.textContent!
  )

  const adminAPIURL = `${apiURL}/admin`

  const introspectionQueryResultData = await fetchIntrospectionQueryResultData(adminAPIURL)
  const authLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem(LocalStorageKey.SessionToken)
    const context = operation.getContext()

    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : '',
        ...context.headers
      },
      ...context
    })

    return forward(operation)
  })

  const client = new ApolloClient({
    link: authLink.concat(createUploadLink({uri: adminAPIURL})),
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
            <FacebookProvider sdkLanguage={'en_US'}>
              <InstagramProvider>
                <TwitterProvider>
                  <HotApp />
                </TwitterProvider>
              </InstagramProvider>
            </FacebookProvider>
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
