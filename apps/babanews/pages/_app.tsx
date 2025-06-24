import {EmotionCache} from '@emotion/cache'
import styled from '@emotion/styled'
import {CssBaseline, ThemeProvider} from '@mui/material'
import {AppCacheProvider} from '@mui/material-nextjs/v13-pagesRouter'
import {FooterContainer, FooterPaperWrapper, NavbarContainer} from '@wepublish/navigation/website'
import {
  authLink,
  NextWepublishLink,
  RoutedAdminBar,
  SessionProvider
} from '@wepublish/utils/website'
import {WebsiteProvider} from '@wepublish/website'
import {previewLink} from '@wepublish/website/admin'
import {createWithV1ApiClient, UserSession} from '@wepublish/website/api'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import deTranlations from '@wepublish/website/translations/de.json'
import {format, setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ICU from 'i18next-icu'
import resourcesToBackend from 'i18next-resources-to-backend'
import {AppProps} from 'next/app'
import getConfig from 'next/config'
import Head from 'next/head'
import Script from 'next/script'
import {initReactI18next} from 'react-i18next'
import {z} from 'zod'
import {zodI18nMap} from 'zod-i18n-map'
import translation from 'zod-i18n-map/locales/de/zod.json'

import {BabanewsBlockRenderer} from '../src/components/website-builder-overwrites/block-renderer/block-renderer'
import {BabanewsBanner} from '../src/components/website-builder-overwrites/blocks/banner'
import {BabanewsTeaserGrid} from '../src/components/website-builder-styled/blocks/teaser-grid-styled'
import theme from '../src/styles/theme'

setDefaultOptions({
  locale: de
})

i18next
  .use(ICU)
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend(() => deTranlations))
  .init({
    partialBundledLanguages: true,
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de'],
    interpolation: {
      escapeValue: false
    },
    resources: {
      de: {zod: translation}
    }
  })
z.setErrorMap(zodI18nMap)

const ContentSpacer = styled('div')`
  min-height: 100vh;
`

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
  sessionToken?: UserSession
}> & {emotionCache?: EmotionCache}

function CustomApp({Component, pageProps, emotionCache}: CustomAppProps) {
  const siteTitle = 'baba news'

  return (
    <AppCacheProvider emotionCache={emotionCache}>
      <SessionProvider sessionToken={pageProps.sessionToken ?? null}>
        <WebsiteProvider>
          <WebsiteBuilderProvider
            Head={Head}
            Script={Script}
            elements={{Link: NextWepublishLink}}
            date={{format: dateFormatter}}
            blocks={{
              Renderer: BabanewsBlockRenderer,
              TeaserGrid: BabanewsTeaserGrid
            }}
            blockStyles={{
              Banner: BabanewsBanner
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

              <NavBar
                categorySlugs={[['categories', 'about-us']]}
                slug="main"
                headerSlug="header"
                iconSlug="icons"
              />

              <ContentSpacer>
                <Component {...pageProps} />
              </ContentSpacer>

              <Footer slug="main" categorySlugs={[['sonstiges', 'other'], ['about-us']]} />

              <RoutedAdminBar />
            </ThemeProvider>
          </WebsiteBuilderProvider>
        </WebsiteProvider>
      </SessionProvider>
    </AppCacheProvider>
  )
}

const {publicRuntimeConfig} = getConfig()
const ConnectedApp = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [
  authLink,
  previewLink
])(CustomApp)

export {ConnectedApp as default}
