import {EmotionCache} from '@emotion/cache'
import {CssBaseline, ThemeProvider} from '@mui/material'
import {AppCacheProvider} from '@mui/material-nextjs/v13-pagesRouter'
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
import {ReactComponent as Logo} from '../src/logo.svg'
import theme from '../src/theme'
import Mitmachen from './mitmachen'
import {OnlineReportsTeaser} from '../src/onlinereports-teaser'
import {OnlineReportsBlockRenderer} from '../src/onlinereports-block-renderer'
import {OnlineReportsAuthorChip} from '../src/components/author-chip'
import {OnlineReportsArticleAuthors} from '../src/components/online-reports-article-authors'
import {OnlineReportsTeaserListBlock} from '../src/onlinereports-teaser-list-block'
import {Advertisement} from '../src/components/advertisement'
import {Structure} from '../src/structure'
import {
  OnlineReportsQuoteBlock,
  OnlineReportsQuoteBlockWrapper
} from '../src/components/quote-block'
import {ArticleInfoWrapper} from '@wepublish/article/website'
import {
  BreakBlockWrapper,
  EventBlockWrapper,
  ImageBlockWrapper,
  RichTextBlockWrapper,
  SliderWrapper,
  TitleBlock,
  TitleBlockLead,
  TitleBlockTitle,
  TitleBlockWrapper
} from '@wepublish/block-content/website'
import {WebsiteProvider} from '@wepublish/website'
import {ContentWrapperStyled} from '@wepublish/content/website'
import styled from '@emotion/styled'
import {
  authLink,
  NextWepublishLink,
  RoutedAdminBar,
  SessionProvider
} from '@wepublish/utils/website'
import {FooterContainer, FooterPaperWrapper, NavbarContainer} from '@wepublish/navigation/website'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import {OnlineReportsNavbar} from '../src/navigation/onlinereports-navbar'
import {OnlineReportsArticle} from '../src/components/article'

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

  row-gap: ${({theme}) => theme.spacing(10)};
  padding-right: ${({theme}) => theme.spacing(2.5)};

  ${ContentWrapperStyled} {
    ${({theme}) => theme.breakpoints.down('md')} {
      row-gap: ${({theme}) => theme.spacing(7.5)};
    }

    ${({theme}) => theme.breakpoints.up('md')} {
      row-gap: ${({theme}) => theme.spacing(4)};

      &
        > :is(
          ${RichTextBlockWrapper},
            ${ArticleInfoWrapper},
            ${TitleBlockWrapper},
            ${OnlineReportsQuoteBlockWrapper}
        ) {
        grid-column: 3/11;
      }

      & > :is(${ImageBlockWrapper}, ${SliderWrapper}, ${EventBlockWrapper}, ${BreakBlockWrapper}) {
        grid-column: 2/12;
      }
    }
  }

  ${theme.breakpoints.down('lg')} {
    padding-left: ${({theme}) => theme.spacing(2.5)};
    padding-right: ${({theme}) => theme.spacing(2.5)};
  }
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
  grid-column: -1/1;
  z-index: 11;
`
const Footer = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({theme}) => theme.palette.common.white};
    background-color: #323232;
  }
`

const OnlineReportsTitle = styled(TitleBlock)`
  ${TitleBlockTitle} {
    margin-top: ${({theme}) => theme.spacing(4)};
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
  const siteTitle = 'We.Publish'

  return (
    <AppCacheProvider emotionCache={emotionCache}>
      <SessionProvider sessionToken={pageProps.sessionToken ?? null}>
        <WebsiteProvider>
          <WebsiteBuilderProvider
            Head={Head}
            Script={Script}
            AuthorChip={OnlineReportsAuthorChip}
            ArticleAuthors={OnlineReportsArticleAuthors}
            Navbar={OnlineReportsNavbar}
            elements={{Link: NextWepublishLink}}
            Article={OnlineReportsArticle}
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
                  categorySlugs={[['categories', 'about-us']]}
                  slug="main"
                  headerSlug="header"
                  iconSlug="icons"
                />
                <MainContainer>
                  <Advertisement type={'whiteboard'} />
                  <MainContent>
                    <Component {...pageProps} />
                  </MainContent>
                </MainContainer>
                <AdvertisementPlacer>
                  <Advertisement type={'half-page'} />
                </AdvertisementPlacer>
                <Footer slug="footer" categorySlugs={[['footer-about-us']]}>
                  <LogoLink href="/" aria-label="Startseite">
                    <LogoWrapper />
                  </LogoLink>
                </Footer>
              </Spacer>

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
