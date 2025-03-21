import {EmotionCache} from '@emotion/cache'
import {Container, css, CssBaseline, styled, ThemeProvider} from '@mui/material'
import {AppCacheProvider} from '@mui/material-nextjs/v13-pagesRouter'
import {GoogleAnalytics} from '@next/third-parties/google'
import {TitleBlock, TitleBlockTitle} from '@wepublish/block-content/website'
import {PaymentAmountPicker} from '@wepublish/membership/website'
import {FooterContainer, NavbarContainer} from '@wepublish/navigation/website'
import {authLink, NextWepublishLink, SessionProvider} from '@wepublish/utils/website'
import {WebsiteProvider} from '@wepublish/website'
import {createWithV1ApiClient, UserSession} from '@wepublish/website/api'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import deTranlations from '@wepublish/website/translations/de.json'
import {format, setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'
import {AppProps} from 'next/app'
import getConfig from 'next/config'
import Head from 'next/head'
import Script from 'next/script'
import {initReactI18next} from 'react-i18next'
import {z} from 'zod'
import {zodI18nMap} from 'zod-i18n-map'
import translation from 'zod-i18n-map/locales/de/zod.json'

import {TsriArticleMeta} from '../src/components/tsri-article-meta'
import {TsriBanner} from '../src/components/tsri-banner'
import {TsriBreakBlock} from '../src/components/tsri-break-block'
import {TsriContextBox} from '../src/components/tsri-context-box'
import {TsriNavbar} from '../src/components/tsri-navbar'
import {TsriQuoteBlock} from '../src/components/tsri-quote-block'
import {TsriRichText} from '../src/components/tsri-richtext'
import {TsriTeaser} from '../src/components/tsri-teaser'
import {ReactComponent as Logo} from '../src/logo.svg'
import theme from '../src/theme'
import {MitmachenInner} from './mitmachen'

setDefaultOptions({
  locale: de
})

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend(() => deTranlations))
  .init({
    partialBundledLanguages: true,
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de'],
    resources: {
      de: {zod: translation}
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

const MainSpacer = styled(Container)`
  position: relative;
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

const TsriTitle = styled(TitleBlock)`
  ${TitleBlockTitle} {
    ${({theme}) => theme.breakpoints.down('sm')} {
      font-size: 2rem;
    }
  }
`

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime
    ? `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
    : format(date, 'dd. MMMM yyyy')

type CustomAppProps = AppProps<{
  sessionToken?: UserSession
}> & {emotionCache?: EmotionCache}

function CustomApp({Component, pageProps, emotionCache}: CustomAppProps) {
  const siteTitle = 'Flimmer'

  return (
    <AppCacheProvider emotionCache={emotionCache}>
      <SessionProvider sessionToken={pageProps.sessionToken ?? null}>
        <WebsiteProvider>
          <WebsiteBuilderProvider
            Head={Head}
            Script={Script}
            Navbar={TsriNavbar}
            ArticleMeta={TsriArticleMeta}
            PaymentAmount={PaymentAmountPicker}
            elements={{Link: NextWepublishLink}}
            blocks={{
              Teaser: TsriTeaser,
              Break: TsriBreakBlock,
              Quote: TsriQuoteBlock,
              RichText: TsriRichText,
              Title: TsriTitle,
              Subscribe: MitmachenInner
            }}
            blockStyles={{
              ContextBox: TsriContextBox
            }}
            date={{format: dateFormatter}}
            meta={{siteTitle}}
            thirdParty={{
              stripe: publicRuntimeConfig.env.STRIPE_PUBLIC_KEY
            }}
            Banner={TsriBanner}>
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

              <Spacer>
                <NavbarContainer
                  categorySlugs={[['categories', 'about-us']]}
                  slug="main"
                  headerSlug="header"
                  iconSlug="icons"
                />

                <main>
                  <MainSpacer maxWidth="lg">
                    <Component {...pageProps} />
                  </MainSpacer>
                </main>

                <FooterContainer slug="footer" categorySlugs={[['categories', 'about-us']]}>
                  <LogoLink href="/" aria-label="Startseite">
                    <LogoWrapper />
                  </LogoLink>
                </FooterContainer>
              </Spacer>

              {publicRuntimeConfig.env.GA_ID && (
                <GoogleAnalytics gaId={publicRuntimeConfig.env.GA_ID} />
              )}

              {publicRuntimeConfig.env.SPARKLOOP_ID && (
                <Script
                  src={`https://script.sparkloop.app/team_${publicRuntimeConfig.env.SPARKLOOP_ID}.js`}
                  strategy="lazyOnload"
                  data-sparkloop
                />
              )}
            </ThemeProvider>
          </WebsiteBuilderProvider>
        </WebsiteProvider>
      </SessionProvider>
    </AppCacheProvider>
  )
}

const {publicRuntimeConfig} = getConfig()
const ConnectedApp = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [authLink])(CustomApp)

export {ConnectedApp as default}
