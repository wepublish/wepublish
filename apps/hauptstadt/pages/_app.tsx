import {EmotionCache} from '@emotion/cache'
import styled from '@emotion/styled'
import {Container, CssBaseline, ThemeProvider} from '@mui/material'
import {AppCacheProvider, createEmotionCache} from '@mui/material-nextjs/v15-pagesRouter'
import {GoogleAnalytics} from '@next/third-parties/google'
import {withErrorSnackbar} from '@wepublish/errors/website'
import {FooterContainer, NavbarContainer} from '@wepublish/navigation/website'
import {withPaywallBypassToken} from '@wepublish/paywall/website'
import {
  AsyncSessionProvider,
  authLink,
  NextWepublishLink,
  RoutedAdminBar,
  withJwtHandler,
  withSessionProvider
} from '@wepublish/utils/website'
import {WebsiteProvider} from '@wepublish/website'
import {previewLink} from '@wepublish/website/admin'
import {createWithV1ApiClient, SessionWithTokenWithoutUser} from '@wepublish/website/api'
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
import {mergeDeepRight} from 'ramda'
import {initReactI18next} from 'react-i18next'
import {z} from 'zod'
import {zodI18nMap} from 'zod-i18n-map'

import deOverriden from '../locales/deOverriden.json'
import {FontSizeProvider} from '../src/components/font-size-picker'
import {
  HauptstadtArticle,
  HauptstadtArticleAuthors,
  HauptstadtArticleMeta
} from '../src/components/hauptstadt-article'
import {HauptstadtAuthorChip} from '../src/components/hauptstadt-author-chip'
import {HauptstadtBanner} from '../src/components/hauptstadt-banner'
import {HauptstadtBreakBlock} from '../src/components/hauptstadt-break'
import {HauptstadtCommentList} from '../src/components/hauptstadt-comment'
import {HauptstadtContentWrapper} from '../src/components/hauptstadt-content-wrapper'
import {HauptstadtEvent} from '../src/components/hauptstadt-event'
import {
  HauptstadtImageBlock,
  HauptstadtImageGalleryBlock
} from '../src/components/hauptstadt-image-block'
import {
  HauptstadtMemberPlanItem,
  HauptstadtMemberPlanPicker
} from '../src/components/hauptstadt-memberplan-picker'
import {HauptstadtNavbar} from '../src/components/hauptstadt-navbar'
import {HauptstadtFooter} from '../src/components/hauptstadt-navigation'
import {HauptstadtPage} from '../src/components/hauptstadt-page'
import {HauptstadtPaywall} from '../src/components/hauptstadt-paywall'
import {HauptstadtQuoteBlock} from '../src/components/hauptstadt-quote'
import {
  HauptstadtAlternatingTeaser,
  HauptstadtFocusTeaser,
  HauptstadtTeaser,
  HauptstadtTeaserGrid,
  HauptstadtTeaserList,
  HauptstadtTeaserSlider,
  HauptstadtTeaserSlots
} from '../src/components/hauptstadt-teaser'
import {PrintLogo} from '../src/components/print-logo'
import {printStyles} from '../src/print-styles'
import theme from '../src/theme'
import Mitmachen from './mitmachen'

setDefaultOptions({
  locale: de
})

i18next
  .use(ICU)
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend(() => mergeDeepRight(deTranlations, deOverriden)))
  .init({
    partialBundledLanguages: true,
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de'],
    interpolation: {
      escapeValue: false
    },
    resources: {
      de: {zod: deTranlations.zod}
    }
  })

z.setErrorMap(zodI18nMap)

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({theme}) => theme.spacing(3)};
  min-height: 100vh;
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
  sessionToken?: SessionWithTokenWithoutUser
}> & {emotionCache?: EmotionCache}

function CustomApp({Component, pageProps, emotionCache}: CustomAppProps) {
  const siteTitle = 'Hauptstadt'

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache()
  cache.compat = true

  return (
    <AppCacheProvider emotionCache={cache}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
          elements={{Link: NextWepublishLink}}
          Footer={HauptstadtFooter}
          Navbar={HauptstadtNavbar}
          ContentWrapper={HauptstadtContentWrapper}
          AuthorChip={HauptstadtAuthorChip}
          Page={HauptstadtPage}
          Article={HauptstadtArticle}
          ArticleAuthors={HauptstadtArticleAuthors}
          ArticleMeta={HauptstadtArticleMeta}
          Event={HauptstadtEvent}
          Banner={HauptstadtBanner}
          Paywall={HauptstadtPaywall}
          MemberPlanPicker={HauptstadtMemberPlanPicker}
          MemberPlanItem={HauptstadtMemberPlanItem}
          CommentList={HauptstadtCommentList}
          blocks={{
            Subscribe: Mitmachen,
            Quote: HauptstadtQuoteBlock,
            BaseTeaser: HauptstadtTeaser,
            TeaserList: HauptstadtTeaserList,
            TeaserGrid: HauptstadtTeaserGrid,
            TeaserSlots: HauptstadtTeaserSlots,
            Image: HauptstadtImageBlock,
            ImageGallery: HauptstadtImageGalleryBlock,
            Break: HauptstadtBreakBlock
          }}
          blockStyles={{
            FocusTeaser: HauptstadtFocusTeaser,
            AlternatingTeaser: HauptstadtAlternatingTeaser,
            TeaserSlider: HauptstadtTeaserSlider
          }}
          date={{format: dateFormatter}}
          meta={{siteTitle}}>
          <ThemeProvider theme={theme}>
            <FontSizeProvider>
              <CssBaseline />
              {printStyles}

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

              <Spacer>
                <NavBar
                  categorySlugs={[['pages']]}
                  slug="main"
                  headerSlug="header"
                  iconSlug="icons"
                />

                <main>
                  <Container maxWidth="lg">
                    <PrintLogo />
                    <Component {...pageProps} />
                  </Container>
                </main>

                <FooterContainer
                  slug="main"
                  categorySlugs={[['pages']]}
                  iconSlug="icons"
                  hideBannerOnIntersecting={false}
                />
              </Spacer>

              <RoutedAdminBar />

              {publicRuntimeConfig.env.GA_ID && (
                <GoogleAnalytics gaId={publicRuntimeConfig.env.GA_ID} />
              )}
            </FontSizeProvider>
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </AppCacheProvider>
  )
}

const {publicRuntimeConfig} = getConfig()
const withApollo = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [authLink, previewLink])
const ConnectedApp = withApollo(
  withErrorSnackbar(
    withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp), AsyncSessionProvider))
  )
)

export {ConnectedApp as default}
