import {
  createTheme,
  css,
  CssBaseline,
  styled,
  Theme,
  ThemeOptions,
  ThemeProvider
} from '@mui/material'
import {theme} from '@wepublish/ui'
import {ApiV1, FooterContainer, WebsiteBuilderProvider, WebsiteProvider} from '@wepublish/website'
import {deleteCookie, getCookie} from 'cookies-next'
import {setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import App, {AppContext, AppProps} from 'next/app'
import getConfig from 'next/config'
import Head from 'next/head'
import {PartialDeep} from 'type-fest'
import {authLink} from '../src/auth-link'
import {Header} from '../src/components/header'
import {Link} from '../src/components/link'
import {ReactComponent as Logo} from '../src/logo.svg'
import {AuthTokenStorageKey, SessionProvider} from '../src/session.provider'

setDefaultOptions({
  locale: de
})

const gruppettoTheme = createTheme(theme, {
  palette: {
    primary: {
      main: '#FEDDD2'
    },
    secondary: {
      main: '#770A6A',
      light: '#A977A3'
    },
    background: {
      default: '#fff'
    }
  },
  shape: {
    borderRadius: 3
  }
} as PartialDeep<Theme> | ThemeOptions)

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  min-height: 100vh;
`

const MainSpacer = styled('div')`
  display: grid;
  max-width: 100%;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      /* gap: ${theme.spacing(10)}; */
    }
  `}
`

type CustomAppProps = AppProps & {
  sessionToken: ApiV1.UserSession | null
}

function CustomApp({Component, pageProps, sessionToken}: CustomAppProps) {
  return (
    <SessionProvider sessionToken={sessionToken}>
      <WebsiteProvider>
        <WebsiteBuilderProvider Head={Head} elements={{Link}}>
          <ThemeProvider theme={gruppettoTheme}>
            <CssBaseline />

            <Head>
              <title>Bajour Events</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link
                rel="apple-touch-icon"
                sizes="180x180"
                href="https://bajour.ch/static/apple-touch-icon.png"
              />
              <link
                rel="icon"
                type="image/png"
                sizes="32x32"
                href="https://bajour.ch/static/favicon-32x32.png"
              />
              <link
                rel="icon"
                type="image/png"
                sizes="16x16"
                href="https://bajour.ch/static/favicon-16x16.png"
              />
              <link
                rel="mask-icon"
                href="https://bajour.ch/static/safari-pinned-tab.svg"
                color="#202020"
              />
              <meta name="msapplication-TileColor" content="#a977a3" />
              <meta name="theme-color" content="#ffffff" />
            </Head>

            <Spacer>
              <Header />

              <MainSpacer>
                <Component {...pageProps} />
              </MainSpacer>

              <FooterContainer slug="footer">
                <Logo width={100} />
              </FooterContainer>
            </Spacer>
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </SessionProvider>
  )
}

const {publicRuntimeConfig} = getConfig()
const ConnectedApp = ApiV1.createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [authLink])(
  CustomApp
)

;(ConnectedApp as any).getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext)

  const token =
    typeof window === 'undefined'
      ? getCookie(AuthTokenStorageKey, {req: appContext.ctx.req})
      : getCookie(AuthTokenStorageKey)

  let sessionToken = token ? (JSON.parse(token.toString()) as ApiV1.UserSession) : null

  if (sessionToken) {
    if (Date.now() > +new Date(sessionToken.expiresAt)) {
      sessionToken = null

      deleteCookie(AuthTokenStorageKey, {
        req: appContext?.ctx?.req,
        res: appContext?.ctx?.res
      })
    }
  }

  return {
    ...appProps,
    sessionToken
  }
}

export {ConnectedApp as default}
