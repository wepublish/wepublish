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
import Head from 'next/head'
import Script from 'next/script'
import {initReactI18next} from 'react-i18next'
import {z} from 'zod'
import {zodI18nMap} from 'zod-i18n-map'
import translation from 'zod-i18n-map/locales/de/zod.json'

import {BabanewsBlockRenderer} from '../src/components/website-builder-overwrites/block-renderer/block-renderer'
import {BabanewsTeaser} from '../src/components/website-builder-overwrites/blocks/teaser'
import {BabanewsTeaserList} from '../src/components/website-builder-styled/blocks/teaser-list-styled'
import theme from '../src/styles/theme'

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

const Footer = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({theme}) => theme.palette.common.white};
  }
`

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime
    ? `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
    : format(date, 'dd. MMMM yyyy')

type CustomAppProps = AppProps<{
  sessionToken?: ApiV1.UserSession
}>

function CustomApp({Component, pageProps}: CustomAppProps) {
  const siteTitle = 'baba news'

  return (
    <SessionProvider sessionToken={pageProps.sessionToken ?? null}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
          elements={{Link: NextWepublishLink}}
          date={{format: dateFormatter}}
          blocks={{
            Renderer: BabanewsBlockRenderer,
            Teaser: BabanewsTeaser,
            TeaserList: BabanewsTeaserList
          }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
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
            <NavBar categorySlugs={[['categories', 'about-us']]} slug="main" />

            <Component {...pageProps} />

            <Footer slug="main" categorySlugs={[['basel-briefing', 'other'], ['about-us']]} />
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