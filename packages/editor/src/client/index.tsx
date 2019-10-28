import 'core-js/stable'
import 'regenerator-runtime/runtime'

import React from 'react'
import ReactDOM from 'react-dom'
import {ApolloClient} from 'apollo-client'
import {HttpLink} from 'apollo-link-http'
import {ApolloLink} from 'apollo-link'
import {InMemoryCache} from 'apollo-cache-inmemory'
import {ApolloProvider} from '@apollo/react-hooks'

import {createStyleRenderer, renderStyles} from '@karma.run/react'
import {CMSKitProvider} from '@karma.run/ui'

import {hot} from 'react-hot-loader/root'
import {App} from './app'
import {ElementID} from '../shared/elementID'
import {RouteProvider} from './route'
import {AuthProvider} from './authContext'

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('refreshToken')

  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : ''
    }
  })

  return forward(operation)
})

const client = new ApolloClient({
  link: authLink.concat(new HttpLink({uri: 'http://localhost:3000'})),
  cache: new InMemoryCache()
})

const HotApp = hot(App)

const onDOMContentLoaded = async () => {
  const styleRenderer = createStyleRenderer()
  renderStyles(styleRenderer)

  ReactDOM.render(
    <CMSKitProvider styleRenderer={styleRenderer} rootElementID={ElementID.ReactRoot}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <RouteProvider>
            <HotApp />
          </RouteProvider>
        </AuthProvider>
      </ApolloProvider>
    </CMSKitProvider>,
    document.getElementById(ElementID.ReactRoot)
  )
}

if (document.readyState !== 'loading') {
  onDOMContentLoaded()
} else {
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded)
}
