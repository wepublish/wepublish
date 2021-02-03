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
import {createStyleRenderer, fetchIntrospectionQueryResultData} from '../shared/utility'
import {AuthProvider} from '../shared/authContext'
import {fetch} from 'cross-fetch'

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

      const client = new ApolloClient({
        link: createHttpLink({uri: apiURL, fetch}),
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
