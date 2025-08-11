import {EmotionCache} from '@emotion/cache'
import {CssBaseline, ThemeProvider} from '@mui/material'
import {AppCacheProvider} from '@mui/material-nextjs/v13-pagesRouter'
import {WebsiteProvider} from '@wepublish/website'
import {previewLink} from '@wepublish/website/admin'
import {createWithV1ApiClient, UserSession} from '@wepublish/website/api'
import {format, setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import deTranlations from '@wepublish/website/translations/de.json'
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
import theme from '../src/theme'
import Mitmachen from './mitmachen'
import {OnlineReportsTeaser} from '../src/onlinereports-teaser'
import {OnlineReportsBlockRenderer} from '../src/onlinereports-block-renderer'
import {OnlineReportsAuthorChip} from '../src/components/author-chip'
import {OnlineReportsArticleAuthors} from '../src/components/online-reports-article-authors'
import {OnlineReportsArticleList} from '../src/components/online-reports-article-list'
import {OnlineReportsTeaserListBlock} from '../src/onlinereports-teaser-list-block'
import {Advertisement} from '../src/components/advertisement'
import {Structure} from '../src/structure'
import {
  OnlineReportsQuoteBlock,
  OnlineReportsQuoteBlockWrapper
} from '../src/components/quote-block'
import {
  ArticleBottomMeta,
  ArticlePreTitle,
  ArticleTopMeta,
  OnlineReportsArticle
} from '../src/components/article'
import {
  BreakBlockWrapper,
  EventBlockWrapper,
  HeadingWithImage,
  HeadingWithoutImage,
  ImageBlockCaption,
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
  RichTextBlockWrapper,
  SliderWrapper,
  TitleBlock,
  TitleBlockLead,
  TitleBlockTitle,
  TitleBlockWrapper
} from '@wepublish/block-content/website'
import {ContentWrapperStyled} from '@wepublish/content/website'
import styled from '@emotion/styled'
import {
  authLink,
  NextWepublishLink,
  RoutedAdminBar,
  withJwtHandler,
  withSessionProvider
} from '@wepublish/utils/website'
import {NavbarContainer} from '@wepublish/navigation/website'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import {OnlineReportsNavbar} from '../src/navigation/onlinereports-navbar'
import {AdblockOverlay} from '../src/components/adblock-detector'
import {OnlineReportsFooter} from '../src/components/footer'
import {OnlineReportsRegistrationForm} from '../src/forms/registration-form'
import {OnlineReportsRenderElement} from '../src/render-element'
import {OnlineReportsGlobalStyles} from '../src/onlinereports-global-styles'
import {GoogleTagManager} from '@next/third-parties/google'
import {OnlineReportsPaymentAmount} from '../src/components/payment-amount'
import {useRouter} from 'next/router'
import {mergeDeepRight} from 'ramda'
import deOverridden from '../locales/deOverridden.json'

setDefaultOptions({
  locale: de
})

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend(() => mergeDeepRight(deTranlations, deOverridden)))
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

const Spacer = styled(Structure)`
  grid-template-rows: min-content 1fr min-content;
  min-height: 100vh;

  main {
    overflow-x: hidden;
  }
`

const MainContainer = styled('div')`
  grid-column: 2/3;
  display: grid;
  row-gap: ${({theme}) => theme.spacing(2.5)};
  margin-bottom: ${({theme}) => theme.spacing(2.5)};

  ${({theme}) => theme.breakpoints.up('md')} {
    row-gap: ${({theme}) => theme.spacing(4)};
    margin-bottom: ${({theme}) => theme.spacing(4)};
  }
`

const MainContent = styled('main')`
  display: flex;
  flex-direction: column;

  row-gap: ${({theme}) => theme.spacing(7.5)};

  ${ContentWrapperStyled} {
    ${({theme}) => theme.breakpoints.down('md')} {
      row-gap: ${({theme}) => theme.spacing(5)};
    }

    ${({theme}) => theme.breakpoints.up('md')} {
      row-gap: ${({theme}) => theme.spacing(4)};

      &
        > :is(
          ${RichTextBlockWrapper},
            ${ArticleTopMeta},
            ${ArticleBottomMeta},
            ${ArticlePreTitle},
            ${TitleBlockWrapper},
            ${OnlineReportsQuoteBlockWrapper}
        ) {
        grid-column: 3/11;
      }

      ${RichTextBlockWrapper} {
      }

      & > :is(${ImageBlockWrapper}, ${SliderWrapper}, ${EventBlockWrapper}, ${BreakBlockWrapper}) {
        grid-column: 2/12;
      }
    }

    ${HeadingWithoutImage}, ${HeadingWithImage} {
      text-transform: none;
      font-family: ${({theme}) => theme.typography.subtitle2.fontFamily};
      font-style: ${({theme}) => theme.typography.subtitle2.fontStyle};
      font-weight: ${({theme}) => theme.typography.subtitle2.fontWeight};
    }

    ${ImageBlockInnerWrapper} {
      gap: ${({theme}) => theme.spacing(1)};
    }

    ${ImageBlockCaption} {
      color: #7c7c7c;
      font-size: 14px;
    }
  }

  ${theme.breakpoints.down('lg')} {
    padding-left: ${({theme}) => theme.spacing(2.5)};
    padding-right: ${({theme}) => theme.spacing(2.5)};
  }
`

const WideboardPlacer = styled('div')`
  margin-bottom: -${({theme}) => theme.spacing(5)};
`

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`

const OnlineReportsTitle = styled(TitleBlock)`
  ${TitleBlockTitle} {
    margin-bottom: -${({theme}) => theme.spacing(2)};
    font-size: ${({theme}) => theme.typography.h1.fontSize};
    font-family: ${({theme}) => theme.typography.h1.fontFamily};
    font-weight: ${({theme}) => theme.typography.h1.fontWeight};

    ${({theme}) => theme.breakpoints.up('md')} {
      font-size: 44px;
    }
  }

  ${TitleBlockLead} {
    font-size: -${({theme}) => theme.typography.body1.fontSize};
  }
`

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime
    ? `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
    : format(date, 'dd. MMMM yyyy')

const AdvertisementPlacer = styled('div')`
  padding-left: ${({theme}) => theme.spacing(2.5)};
  position: sticky;
  top: 112px;
  margin-bottom: ${({theme}) => theme.spacing(2.5)};
  grid-column: 3/4;
  overflow: hidden;

  @media (max-width: 1200px) {
    display: none;
  }
`

type CustomAppProps = AppProps<{
  sessionToken?: UserSession
}> & {emotionCache?: EmotionCache}

function CustomApp({Component, pageProps, emotionCache}: CustomAppProps) {
  const siteTitle = 'OnlineReports'

  const router = useRouter()

  return (
    <AppCacheProvider emotionCache={emotionCache}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
          AuthorChip={OnlineReportsAuthorChip}
          ArticleAuthors={OnlineReportsArticleAuthors}
          ArticleList={OnlineReportsArticleList}
          Navbar={OnlineReportsNavbar}
          Article={OnlineReportsArticle}
          RegistrationForm={OnlineReportsRegistrationForm}
          PaymentAmount={OnlineReportsPaymentAmount}
          richtext={{RenderElement: OnlineReportsRenderElement}}
          elements={{Link: NextWepublishLink}}
          blocks={{
            Teaser: OnlineReportsTeaser,
            Renderer: OnlineReportsBlockRenderer,
            TeaserList: OnlineReportsTeaserListBlock,
            Quote: OnlineReportsQuoteBlock,
            Subscribe: Mitmachen,
            Title: OnlineReportsTitle
          }}
          date={{format: dateFormatter}}
          meta={{siteTitle}}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <OnlineReportsGlobalStyles />

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
              <script src="//servedby.revive-adserver.net/asyncjs.php" async />
            </Head>

            <AdblockOverlay />
            <Spacer>
              <NavBar
                categorySlugs={[['categories', 'about-us']]}
                slug="main"
                headerSlug="header"
                iconSlug="icons"
                loginBtn={{href: '/login'}}
                profileBtn={{href: '/profile'}}
              />
              <MainContainer>
                <MainContent>
                  {router.pathname !== '/mitmachen' && (
                    <WideboardPlacer>
                      <Advertisement type={'whiteboard'} />
                    </WideboardPlacer>
                  )}
                  <Component {...pageProps} />
                </MainContent>
              </MainContainer>
              <AdvertisementPlacer>
                {router.pathname !== '/mitmachen' && <Advertisement type={'half-page'} />}
              </AdvertisementPlacer>
              <OnlineReportsFooter />
            </Spacer>

            <RoutedAdminBar />
            {publicRuntimeConfig.env.GTM_ID && (
              <>
                <GoogleTagManager gtmId={publicRuntimeConfig.env.GTM_ID} />
              </>
            )}
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </AppCacheProvider>
  )
}

const {publicRuntimeConfig} = getConfig()
const ConnectedApp = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [
  authLink,
  previewLink
])(withSessionProvider(withJwtHandler(CustomApp)))

export {ConnectedApp as default}
