import React from 'react'
import ReactDOM from 'react-dom'

import {hot} from 'react-hot-loader/root'
import {HelmetProvider} from 'react-helmet-async'
import {rehydrate} from 'fela-dom'

import {StyleProvider, preloadLazyComponents, RouteActionType} from '@karma.run/react'

import {ElementID} from '../shared/elementID'
import {App} from '../shared/app'
import {AppContextProvider} from '../shared/appContext'
import ApolloClient from 'apollo-client'
import {HttpLink} from 'apollo-link-http'
import {InMemoryCache, IntrospectionFragmentMatcher} from 'apollo-cache-inmemory'
import {ApolloProvider} from 'react-apollo'
import {FacebookProvider} from '../shared/atoms/facebookEmbed'
import {InstagramProvider} from '../shared/atoms/instagramEmbed'
import {TwitterProvider} from '../shared/atoms/twitterEmbed'
import {matchRoute, RouteProvider} from '../shared/route/routeContext'
import {createStyleRenderer} from '../shared/utility'

export const HotApp = hot(App)

export async function hydrateApp(): Promise<void> {
  return new Promise(resolve => {
    async function onDOMContentLoaded() {
      const initialState = JSON.parse(document.getElementById(ElementID.InitialState)!.textContent!)

      const canonicalHost = JSON.parse(
        document.getElementById(ElementID.CanonicalHost)!.textContent!
      )

      const apiURL = JSON.parse(document.getElementById(ElementID.APIURL)!.textContent!)

      const renderedKeys = JSON.parse(
        document.getElementById(ElementID.RenderedPaths)!.textContent!
      )

      const introspectionQueryResultData = JSON.parse(
        document.getElementById(ElementID.IntrospectionResult)!.textContent!
      )

      const client = new ApolloClient({
        link: new HttpLink({uri: apiURL, fetch}),
        cache: new InMemoryCache({
          fragmentMatcher: new IntrospectionFragmentMatcher({introspectionQueryResultData})
        }).restore(initialState)
      })

      const styleRenderer = createStyleRenderer()

      await preloadLazyComponents(renderedKeys)
      rehydrate(styleRenderer)

      ReactDOM.hydrate(
        <AppContextProvider canonicalHost={canonicalHost}>
          <ApolloProvider client={client}>
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
