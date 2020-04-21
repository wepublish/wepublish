import React from 'react'
import ReactDOM from 'react-dom/server'
import {HelmetProvider, FilledContext} from 'react-helmet-async'

import {ApolloClient} from 'apollo-client'
import {getDataFromTree, ApolloProvider} from 'react-apollo'
import {InMemoryCache, IntrospectionFragmentMatcher} from 'apollo-cache-inmemory'
import {HttpLink} from 'apollo-link-http'

import {fetch} from 'cross-fetch'

import {LazyCapture, StyleProvider, renderStylesToComponents} from '@karma.run/react'

import {RouteProvider, Route} from '../shared/route/routeContext'
import {FacebookProvider} from '../shared/atoms/facebookEmbed'
import {InstagramProvider} from '../shared/atoms/instagramEmbed'
import {TwitterProvider} from '../shared/atoms/twitterEmbed'

import {ElementID} from '../shared/elementID'
import {App} from '../shared/app'
import {AppContextProvider} from '../shared/appContext'

import {createStyleRenderer} from '../shared/utility'

export interface RenderOptions {
  apiURL: string
  canonicalHost: string
  moduleMap: Record<string, string[]>
  initialRoute?: Route | null
  introspectionQueryResultData: any
  clientEntryFile: string
  staticHost: string
}

export async function renderApp({
  apiURL,
  canonicalHost,
  initialRoute,
  introspectionQueryResultData
}: RenderOptions) {
  const client = new ApolloClient({
    link: new HttpLink({uri: apiURL, fetch}),
    cache: new InMemoryCache({
      fragmentMatcher: new IntrospectionFragmentMatcher({introspectionQueryResultData})
    }),
    ssrMode: true
  })

  const styleRenderer = createStyleRenderer()
  const renderedLazyPaths: string[] = []
  const helmetContext = {}

  const ServerApp = (
    <LazyCapture rendered={renderedLazyPaths}>
      <AppContextProvider canonicalHost={canonicalHost}>
        <ApolloProvider client={client}>
          <HelmetProvider context={helmetContext}>
            <StyleProvider renderer={styleRenderer}>
              <FacebookProvider sdkLanguage={'de_DE'}>
                <InstagramProvider>
                  <TwitterProvider>
                    <RouteProvider initialRoute={initialRoute}>
                      <App />
                    </RouteProvider>
                  </TwitterProvider>
                </InstagramProvider>
              </FacebookProvider>
            </StyleProvider>
          </HelmetProvider>
        </ApolloProvider>
      </AppContextProvider>
    </LazyCapture>
  )

  let error: Error | undefined

  try {
    await getDataFromTree(ServerApp)
  } catch (err) {
    console.error(`ApolloError: ${JSON.stringify(err, undefined, 2)}`)
    error = err
  }

  const initialState = client.extract()
  const componentString = ReactDOM.renderToString(ServerApp)
  const {helmet} = helmetContext as FilledContext

  return {
    componentString,
    renderedLazyPaths,
    styleRenderer,
    initialState,
    helmet,
    error
  }
}

export async function renderMarkup(opts: RenderOptions) {
  const {
    apiURL,
    moduleMap,
    clientEntryFile,
    staticHost,
    introspectionQueryResultData,
    canonicalHost
  } = opts

  const {
    componentString,
    renderedLazyPaths,
    styleRenderer,
    helmet,
    initialState,
    error
  } = await renderApp(opts)

  const bundles: string[][] = renderedLazyPaths.map(path => moduleMap[path])
  const bundleSet = Array.from(
    new Set(bundles.reduce((acc, file) => [...acc, ...file], []))
  ).filter(url => url !== clientEntryFile)

  const scriptElements = bundleSet.map(url => <script async src={`${staticHost}/${url}`}></script>)

  const isProduction =
    process.env.NODE_ENV == 'production' && !staticHost.startsWith('https://staging')

  let googleTagManager = ''
  let googleTagManagerNoScript = ''
  if (isProduction) {
    googleTagManager = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '&gtm_auth=EMoJF9p7Wu77j7k1OChhPQ&gtm_preview=env-1&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-MQDHF8V');`

    googleTagManagerNoScript =
      'https://www.googletagmanager.com/ns.html?id=GTM-MQDHF8V&gtm_auth=EMoJF9p7Wu77j7k1OChhPQ&gtm_preview=env-1&gtm_cookies_win=x'
  } else {
    googleTagManager = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '&gtm_auth=pLdTy-FIFx8dMZvcjy9U3A&gtm_preview=env-25&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-MQDHF8V');`

    googleTagManagerNoScript =
      'https://www.googletagmanager.com/ns.html?id=GTM-MQDHF8V&gtm_auth=pLdTy-FIFx8dMZvcjy9U3A&gtm_preview=env-25&gtm_cookies_win=x'
  }

  return {
    markup:
      '<!doctype html>' +
      ReactDOM.renderToStaticMarkup(
        <html>
          <head>
            <script dangerouslySetInnerHTML={{__html: googleTagManager}} />

            <script
              data-ad-client="ca-pub-4936875882594717"
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>

            {helmet.title.toComponent()}
            {helmet.meta.toComponent()}
            {helmet.link.toComponent()}
            {helmet.script.toComponent()}
            {helmet.noscript.toComponent()}

            <meta name="viewport" content="width=device-width, initial-scale=1" />

            <link rel="manifest" href="/static/manifest.json" />
            <link rel="icon" type="image/png" sizes="128x128" href="/static/favicon-128.png" />
            <link rel="icon" type="image/png" sizes="64x64" href="/static/favicon-64.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16.png" />
            <link rel="shortcut icon" type="image/x-icon" href="/static/favicon-16.ico" />

            {scriptElements}

            <script async src={`${staticHost}/${clientEntryFile}`} />

            <script
              type="application/json"
              id={ElementID.APIURL}
              dangerouslySetInnerHTML={{__html: JSON.stringify(apiURL)}}
            />

            <script
              type="application/json"
              id={ElementID.CanonicalHost}
              dangerouslySetInnerHTML={{__html: JSON.stringify(canonicalHost)}}
            />

            <script
              type="application/json"
              id={ElementID.RenderedPaths}
              dangerouslySetInnerHTML={{__html: JSON.stringify(renderedLazyPaths)}}
            />

            <script
              type="application/json"
              id={ElementID.IntrospectionResult}
              dangerouslySetInnerHTML={{__html: JSON.stringify(introspectionQueryResultData)}}
            />

            <script
              type="application/json"
              id={ElementID.InitialState}
              dangerouslySetInnerHTML={{__html: JSON.stringify(initialState)}}
            />

            {renderStylesToComponents(styleRenderer)}
          </head>
          <body>
            <noscript>
              <iframe
                src={googleTagManagerNoScript}
                style={{display: 'none', visibility: 'hidden', width: 0, height: 0}}></iframe>
            </noscript>

            <div id={ElementID.ReactRoot} dangerouslySetInnerHTML={{__html: componentString}}></div>
          </body>
        </html>
      ),
    error
  }
}
