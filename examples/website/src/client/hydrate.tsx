import React from 'react'
import ReactDOM from 'react-dom'

import {hot} from 'react-hot-loader/root'
import {HelmetProvider} from 'react-helmet-async'
import {rehydrate} from 'fela-dom'

import {StyleProvider, preloadLazyComponents, RouteActionType} from '@karma.run/react'

import {ElementID} from '../shared/elementID'
import {App} from '../shared/app'
import {AppContextProvider} from '../shared/appContext'
import {ApolloProvider, ApolloClient, createHttpLink, InMemoryCache} from '@apollo/client'
import {FacebookProvider} from '../shared/atoms/facebookEmbed'
import {InstagramProvider} from '../shared/atoms/instagramEmbed'
import {TwitterProvider} from '../shared/atoms/twitterEmbed'
import {matchRoute, RouteProvider} from '../shared/route/routeContext'
import {
  createStyleRenderer,
  fetchIntrospectionQueryResultData,
  LocalStorageKey
} from '../shared/utility'
import {AuthProvider} from '../shared/authContext'
import {fetch} from 'cross-fetch'
import {setContext} from '@apollo/client/link/context'
import {TikTokProvider} from '../shared/atoms/tikTokEmbed'

export const HotApp = hot(App)

export async function hydrateApp(): Promise<void> {
  return new Promise(resolve => {
    async function onDOMContentLoaded() {
      const canonicalHost = JSON.parse(
        document.getElementById(ElementID.CanonicalHost)!.textContent!
      )

      const apiURL = JSON.parse(document.getElementById(ElementID.APIURL)!.textContent!)

      const renderedKeys = JSON.parse(
        document.getElementById(ElementID.RenderedPaths)!.textContent!
      )

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

      ReactDOM.hydrate(
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
                              return () => {}
                            }}>
                            <HotApp />
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

        document.getElementById(ElementID.ReactRoot),
        () => resolve()
      )
    }

    if (document.readyState !== 'loading') {
      onDOMContentLoaded()
    } else {
      document.addEventListener('DOMContentLoaded', onDOMContentLoaded)
    }
  })
}
