import * as fs from 'fs'

import ReactDOM from 'react-dom/server'
import {FilledContext, HelmetProvider} from 'react-helmet-async'

// Add this import to the top of the file
import {ApolloClient, ApolloProvider, createHttpLink, InMemoryCache} from '@apollo/client'
import {getDataFromTree} from '@apollo/client/react/ssr'
import {LazyCapture, renderStylesToComponents, StyleProvider} from '@karma.run/react'
import {fetch} from 'cross-fetch'

import {FacebookProvider} from './app/atoms/facebookEmbed'
import {InstagramProvider} from './app/atoms/instagramEmbed'
import {TikTokProvider} from './app/atoms/tikTokEmbed'
import {TwitterProvider} from './app/atoms/twitterEmbed'
import {Route, RouteProvider} from './app/route/routeContext'

import {App} from './app/app'
import {AppContextProvider} from './app/appContext'
import {ElementID} from './app/elementID'

import {AuthProvider} from './app/authContext'
import {createStyleRenderer, fetchIntrospectionQueryResultData} from './app/utility'
import * as path from 'path'

export interface RenderOptions {
  apiURL: string
  canonicalHost: string
  initialRoute?: Route | null
  introspectionQueryResultData: any
}

export async function renderApp({
  apiURL,
  canonicalHost,
  initialRoute,
  introspectionQueryResultData
}: RenderOptions) {
  const client = new ApolloClient({
    link: createHttpLink({uri: apiURL, fetch}),
    cache: new InMemoryCache({
      possibleTypes: await fetchIntrospectionQueryResultData(apiURL)
    })
  })

  const styleRenderer = createStyleRenderer()
  const renderedLazyPaths: string[] = []
  const helmetContext = {}

  const ServerApp = (
    <LazyCapture rendered={renderedLazyPaths}>
      <AppContextProvider canonicalHost={canonicalHost}>
        <ApolloProvider client={client}>
          <AuthProvider>
            <HelmetProvider context={helmetContext}>
              <StyleProvider renderer={styleRenderer}>
                <FacebookProvider sdkLanguage={'de_DE'}>
                  <TikTokProvider>
                    <InstagramProvider>
                      <TwitterProvider>
                        <RouteProvider initialRoute={initialRoute}>
                          <App />
                        </RouteProvider>
                      </TwitterProvider>
                    </InstagramProvider>
                  </TikTokProvider>
                </FacebookProvider>
              </StyleProvider>
            </HelmetProvider>
          </AuthProvider>
        </ApolloProvider>
      </AppContextProvider>
    </LazyCapture>
  )

  let error: Error | undefined

  try {
    await getDataFromTree(ServerApp)
  } catch (err) {
    console.error(`ApolloError: ${JSON.stringify(err, undefined, 2)}`)
    error = err as Error
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

const browserDist = path.join(process.cwd(), 'dist/apps/website-example/browser')
const indexPath = path.join(browserDist, 'index.html')
let indexHtml: null | string = null

export async function renderMarkup(opts: RenderOptions) {
  const {apiURL, introspectionQueryResultData, canonicalHost} = opts

  const {
    componentString,
    renderedLazyPaths,
    styleRenderer,
    helmet,
    initialState,
    error
  } = await renderApp(opts)

  if (!indexHtml || process.env.NODE_ENV !== 'production') {
    indexHtml = fs.readFileSync(indexPath).toString()
  }

  const [htmlStart, tmpHtmlEnd] = indexHtml.split(`</head>`)
  const [rootStart, htmlEnd] = tmpHtmlEnd.split(`</div>`)

  const markup = `
    ${htmlStart}
      ${ReactDOM.renderToString(
        <>
          {helmet.title.toComponent()}
          {helmet.meta.toComponent()}
          {helmet.link.toComponent()}
          {helmet.script.toComponent()}
          {helmet.noscript.toComponent()}
        </>
      )}

      <script
        type="application/json"
        id="${ElementID.APIURL}"
      >
        ${JSON.stringify(apiURL)}
      </script>

      <script
        type="application/json"
        id="${ElementID.CanonicalHost}"
      >
        ${JSON.stringify(canonicalHost)}
      </script>

      <script
        type="application/json"
        id="${ElementID.RenderedPaths}"
      >
        ${JSON.stringify(renderedLazyPaths)}
      </script>

      <script
        type="application/json"
        id="${ElementID.IntrospectionResult}"
      >
        ${JSON.stringify(introspectionQueryResultData)}
      </script>

      <script
        type="application/json"
        id="${ElementID.InitialState}"
      >
        ${JSON.stringify(initialState)}
      </script>

      ${ReactDOM.renderToString(<>{renderStylesToComponents(styleRenderer)}</>)}
    </head>
    ${rootStart}
      ${componentString}
    </div>
  ${htmlEnd}`

  return {
    markup,
    error
  }
}
