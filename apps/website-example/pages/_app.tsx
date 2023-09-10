import {
  Container,
  createTheme,
  css,
  CssBaseline,
  GlobalStyles,
  styled,
  Theme,
  ThemeOptions,
  ThemeProvider,
  useTheme
} from '@mui/material'
import {theme} from '@wepublish/ui'
import {
  ApiV1,
  FooterContainer,
  NavbarContainer,
  NavbarInnerWrapper,
  WebsiteBuilderProvider,
  WebsiteProvider
} from '@wepublish/website'
import {format, setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {AppProps} from 'next/app'
import getConfig from 'next/config'
import Head from 'next/head'
import Script from 'next/script'
import {useMemo} from 'react'
import {initReactI18next} from 'react-i18next'
import {PartialDeep} from 'type-fest'
import {z} from 'zod'
import {zodI18nMap} from 'zod-i18n-map'
import translation from 'zod-i18n-map/locales/de/zod.json'
import {authLink} from '../src/auth-link'
import {ReactComponent as Logo} from '../src/logo.svg'
import {NextWepublishLink} from '../src/next-wepublish-link'
import {SessionProvider} from '../src/session.provider'
import {tsriArticleStyles} from '../src/styles/tsri-article.styles'
import {TsriButton} from '../src/tsri-button'
import {TsriParagraph} from '../src/tsri-paragraph'
import {NavBarProfile} from '../src/navbar-profile'
import {TsriBreakBlock} from '../src/tsri-break-block'

setDefaultOptions({
  locale: de
})

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de'],
    resources: {
      de: {zod: translation}
    }
  })
z.setErrorMap(zodI18nMap)

const websiteExampleTheme = createTheme(theme, {
  typography: {
    h1: {
      fontWeight: theme.typography.fontWeightMedium
    },
    h2: {
      fontWeight: theme.typography.fontWeightMedium
    }
  },
  breakpoints: {
    values: {
      lg: 1310
    }
  }
} as PartialDeep<Theme> | ThemeOptions)

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({theme}) => theme.spacing(3)};
  min-height: 100vh;
`

const MainSpacer = styled(Container)`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`

const LogoLink = styled(NextWepublishLink)`
  color: unset;
  display: grid;
  align-items: center;
  justify-items: center;
`

const LogoWrapper = styled(Logo)`
  fill: currentColor;
  height: 30px;

  ${({theme}) => theme.breakpoints.up('md')} {
    height: 45px;
  }
`

const NavBar = styled(NavbarContainer)`
  background-color: ${({theme}) => theme.palette.common.white};
  margin-bottom: ${({theme}) => theme.spacing(3)};

  ${NavbarInnerWrapper} {
    width: 100%;
    max-width: ${({theme}) => `${theme.breakpoints.values['lg']}${theme.breakpoints.unit}`};
    align-self: center;
  }
`

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime
    ? `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
    : format(date, 'dd. MMMM yyyy')

function CustomApp({Component, pageProps}: AppProps) {
  const theme = useTheme()
  const globalStyles = useMemo(
    () => css`
      ${tsriArticleStyles(theme)}
    `,
    [theme]
  )

  return (
    <SessionProvider sessionToken={null}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
          elements={{Link: NextWepublishLink, Button: TsriButton, Paragraph: TsriParagraph}}
          date={{format: dateFormatter}}
          blocks={{Break: TsriBreakBlock}}>
          <ThemeProvider theme={websiteExampleTheme}>
            <GlobalStyles styles={globalStyles} />
            <CssBaseline />

            <Head>
              <title>We.Publish</title>

              {/* Feeds */}
              <link rel="alternate" type="application/rss+xml" href="/api/rss-feed" />
              <link rel="alternate" type="application/atom+xml" href="/api/atom-feed" />
              <link rel="alternate" type="application/feed+json" href="/api/json-feed" />

              {/* Favicon definitions, generated with https://realfavicongenerator.net/ */}
              <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
              <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
              <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
              <link rel="manifest" href="/site.webmanifest" />
              <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
              <meta name="msapplication-TileColor" content="#ffffff" />
              <meta name="theme-color" content="#ffffff" />
            </Head>

            <Spacer>
              <NavBar categorySlugs={['categories', 'about-us']} slug="main">
                <LogoLink href="/" aria-label="Startseite">
                  <LogoWrapper />
                </LogoLink>

                <NavBarProfile />
              </NavBar>

              <main>
                <MainSpacer maxWidth="lg">
                  <Component {...pageProps} />
                </MainSpacer>
              </main>

              <FooterContainer slug="footer">
                <LogoLink href="/" aria-label="Startseite">
                  <LogoWrapper />
                </LogoLink>
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

export {ConnectedApp as default}
