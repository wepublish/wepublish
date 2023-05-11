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
import {setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import {AppProps} from 'next/app'
import getConfig from 'next/config'
import Head from 'next/head'
import {PartialDeep} from 'type-fest'
import {Header} from '../src/components/header'
import {Link} from '../src/components/link'
import {ReactComponent as Logo} from '../src/logo.svg'
import Script from 'next/script'

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
    }
  `}
`

function CustomApp({Component, pageProps}: AppProps) {
  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider Head={Head} Script={Script} elements={{Link}}>
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
  )
}

const {publicRuntimeConfig} = getConfig()
export default ApiV1.createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [])(CustomApp)
