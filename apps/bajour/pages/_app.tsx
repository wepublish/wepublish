import {CssBaseline, styled, ThemeProvider} from '@mui/material'
import {authLink, NextWepublishLink, SessionProvider} from '@wepublish/utils/website'
import {
  ApiV1,
  FooterContainer,
  FooterPaperWrapper,
  NavbarContainer,
  WebsiteBuilderProvider,
  WebsiteProvider
} from '@wepublish/website'
import {format, setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {AppProps} from 'next/app'
import getConfig from 'next/config'
import {Roboto} from 'next/font/google'
import Head from 'next/head'
import Script from 'next/script'
import {initReactI18next} from 'react-i18next'
import {FaTwitter} from 'react-icons/fa6'
import {MdFacebook, MdMail} from 'react-icons/md'
import {z} from 'zod'
import {zodI18nMap} from 'zod-i18n-map'
import translation from 'zod-i18n-map/locales/de/zod.json'

import {MainGrid} from '../src/components/layout/main-grid'
import {BajourBlockRenderer} from '../src/components/website-builder-overwrites/block-renderer/block-renderer'
import {BajourTeaser} from '../src/components/website-builder-overwrites/blocks/teaser'
import {BajourTeaserGrid} from '../src/components/website-builder-styled/blocks/teaser-grid-styled'
import theme, {navbarTheme} from '../src/styles/theme'

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

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime
    ? `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
    : format(date, 'dd. MMMM yyyy')

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

type CustomAppProps = AppProps<{
  sessionToken?: ApiV1.UserSession
}>

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`

const Footer = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({theme}) => theme.palette.common.white};
  }
`

const ButtonLink = styled('a')`
  color: ${({theme}) => theme.palette.primary.contrastText};
`

function CustomApp({Component, pageProps}: CustomAppProps) {
  const siteTitle = 'Bajour'

  return (
    <>
      <Head>
        <title key="title">{siteTitle}</title>

        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Feeds */}
        <link rel="alternate" type="application/rss+xml" href="/api/rss-feed" />
        <link rel="alternate" type="application/atom+xml" href="/api/atom-feed" />
        <link rel="alternate" type="application/feed+json" href="/api/json-feed" />

        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/api/sitemap" />

        {/* Favicon definitions, generated with https://realfavicongenerator.net/ */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <SessionProvider sessionToken={pageProps.sessionToken ?? null}>
        <WebsiteProvider>
          <WebsiteBuilderProvider
            meta={{siteTitle}}
            Head={Head}
            Script={Script}
            elements={{Link: NextWepublishLink}}
            date={{format: dateFormatter}}
            blocks={{
              Renderer: BajourBlockRenderer,
              Teaser: BajourTeaser,
              TeaserGrid: BajourTeaserGrid
            }}>
            <ThemeProvider theme={theme}>
              <CssBaseline />

              <MainGrid className={roboto.className}>
                <ThemeProvider theme={navbarTheme}>
                  <NavBar
                    slug="main"
                    categorySlugs={[['basel-briefing', 'other'], ['about-us']]}
                    headerSlug="header">
                    <>
                      <ButtonLink href="https://www.facebook.com/bajourbasel">
                        <MdFacebook size="32" />
                      </ButtonLink>

                      <ButtonLink href="https://twitter.com/bajourbasel">
                        <FaTwitter size="32" />
                      </ButtonLink>

                      <ButtonLink href="mailto:info@bajour.ch">
                        <MdMail size="32" />
                      </ButtonLink>
                    </>
                  </NavBar>
                </ThemeProvider>

                <Component {...pageProps} />

                <Footer slug="main" categorySlugs={[['basel-briefing', 'other'], ['about-us']]} />
              </MainGrid>
            </ThemeProvider>
          </WebsiteBuilderProvider>
        </WebsiteProvider>
      </SessionProvider>
    </>
  )
}

const {publicRuntimeConfig} = getConfig()
const ConnectedApp = ApiV1.createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [authLink])(
  CustomApp
)

export {ConnectedApp as default}
