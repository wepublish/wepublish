import {EmotionCache} from '@emotion/cache'
import {Container, CssBaseline, styled, ThemeProvider} from '@mui/material'
import {AppCacheProvider} from '@mui/material-nextjs/v13-pagesRouter'
import {authLink, NextWepublishLink, SessionProvider} from '@wepublish/utils/website'
import {
  ApiV1,
  ContentWrapperStyled,
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

import {ReactComponent as Logo} from '../src/logo.svg'
import {OnlineReportsNavAppBar} from '../src/components/onlinereports-nav-app-bar'
import {OnlineReportsNavPaper} from '../src/components/onlinereports-nav-paper'
import theme from '../src/theme'

import {OnlineReportsTeaser} from '../src/onlinereports-teaser'
import {OnlineReportsBlockRenderer} from '../src/onlinereports-block-renderer'
import {OnlineReportsAuthorChip} from '../src/components/author-chip'
import {OnlineReportsArticleAuthors} from '../src/components/online-reports-article-authors'
import {OnlineReportsTeaserListBlock} from '../src/onlinereports-teaser-list-block'
import {Advertisement} from '../src/components/advertisement'

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

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({theme}) => theme.spacing(0.5)};
  min-height: 100vh;

  main {
    overflow-x: hidden;
  }
`

const MainSpacer = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2.5)};

  ${theme.breakpoints.up('md')} {
    gap: ${theme.spacing(2.5)};
  }

  ${ContentWrapperStyled} {
    ${theme.breakpoints.down('md')} {
      row-gap: ${({theme}) => theme.spacing(7.5)};
    }

    ${theme.breakpoints.up('md')} {
      row-gap: ${({theme}) => theme.spacing(4)};
    }
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
  }
`

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime
    ? `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
    : format(date, 'dd. MMMM yyyy')

const DesktopSidebarAd = styled(Container)`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: ${({theme}) => theme.spacing(2.5)} !important;

  margin-bottom: 40px;

  @media (min-width: 1250px) {
    grid-template-columns: 994px 300px;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    padding-left: 0;
    padding-right: 0;
  }
`

const AdvertisementPlacer = styled('div')`
  position: relative;
  > * {
    top: 0;
    position: sticky;
  }
  @media (max-width: 1250px) {
    display: none;
  }
`

type CustomAppProps = AppProps<{
  sessionToken?: ApiV1.UserSession
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
            NavPaper={OnlineReportsNavPaper}
            NavAppBar={OnlineReportsNavAppBar}
            elements={{Link: NextWepublishLink}}
            blocks={{
              Teaser: OnlineReportsTeaser,
              Renderer: OnlineReportsBlockRenderer,
              TeaserList: OnlineReportsTeaserListBlock
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

                <main>
                  <DesktopSidebarAd maxWidth="lg">
                    <MainSpacer>
                      <Advertisement type={'whiteboard'} />
                      <Component {...pageProps} />
                    </MainSpacer>
                    <AdvertisementPlacer>
                      <Advertisement type={'half-page'} />
                    </AdvertisementPlacer>
                  </DesktopSidebarAd>
                </main>

                <Footer slug="footer" categorySlugs={[['categories', 'about-us']]}>
                  <LogoLink href="/" aria-label="Startseite">
                    <LogoWrapper />
                  </LogoLink>
                </Footer>
              </Spacer>
            </ThemeProvider>
          </WebsiteBuilderProvider>
        </WebsiteProvider>
      </SessionProvider>
    </AppCacheProvider>
  )
}

const {publicRuntimeConfig} = getConfig()
const ConnectedApp = ApiV1.createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [authLink])(
  CustomApp
)

export {ConnectedApp as default}
