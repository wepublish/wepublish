import React from 'react'
import ReactDOM from 'react-dom'

import {HelmetProvider} from 'react-helmet-async'
import {rehydrate} from 'fela-dom'

import {StyleProvider, preloadLazyComponents, RouteActionType} from '@karma.run/react'

import {ElementID} from './app/elementID'
import {App} from './app/app'
import {AppContextProvider} from './app/appContext'
import {ApolloProvider, ApolloClient, createHttpLink, InMemoryCache} from '@apollo/client'
import {FacebookProvider} from './app/atoms/facebookEmbed'
import {InstagramProvider} from './app/atoms/instagramEmbed'
import {TwitterProvider} from './app/atoms/twitterEmbed'
import {matchRoute, RouteProvider} from './app/route/routeContext'
import {
  createStyleRenderer,
  fetchIntrospectionQueryResultData,
  LocalStorageKey
} from './app/utility'
import {AuthProvider} from './app/authContext'
import {fetch} from 'cross-fetch'
import {setContext} from '@apollo/client/link/context'
import {TikTokProvider} from './app/atoms/tikTokEmbed'

async function onDOMContentLoaded() {
  const canonicalHost = JSON.parse(document.getElementById(ElementID.CanonicalHost)!.textContent!)
  const apiURL = JSON.parse(document.getElementById(ElementID.APIURL)!.textContent!)
  const renderedKeys = JSON.parse(document.getElementById(ElementID.RenderedPaths)!.textContent!)

  const authLink = setContext((_, {headers}) => {
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem(LocalStorageKey.SessionToken)
    // return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : ''
      }
    }
  })

  const client = new ApolloClient({
    link: authLink.concat(createHttpLink({uri: apiURL, fetch})),
    cache: new InMemoryCache({
      possibleTypes: await fetchIntrospectionQueryResultData(apiURL)
    })
  })

  const styleRenderer = createStyleRenderer()

  await preloadLazyComponents(renderedKeys)
  rehydrate(styleRenderer)

  ReactDOM.render(
    <AppContextProvider canonicalHost={canonicalHost}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <HelmetProvider>
            <StyleProvider renderer={styleRenderer}>
              <FacebookProvider sdkLanguage={'de_DE'}>
                <InstagramProvider>
                  <TikTokProvider>
                    <TwitterProvider>
                      <RouteProvider
                        initialRoute={matchRoute(location.href)}
                        handleNextRoute={(route, dispatch) => {
                          dispatch({type: RouteActionType.SetCurrentRoute, route})
                          // eslint-disable-next-line @typescript-eslint/no-empty-function
                          return () => {}
                        }}>
                        <App />
                      </RouteProvider>
                    </TwitterProvider>
                  </TikTokProvider>
                </InstagramProvider>
              </FacebookProvider>
            </StyleProvider>
          </HelmetProvider>
        </AuthProvider>
      </ApolloProvider>
    </AppContextProvider>,
    document.getElementById(ElementID.ReactRoot)
  )
}

if (document.readyState !== 'loading') {
  onDOMContentLoaded()
} else {
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded)
}
