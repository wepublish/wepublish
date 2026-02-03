import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleTagManager } from '@next/third-parties/google';
import {
  TitleBlock,
  TitleBlockLead,
  TitleBlockPreTitleWrapper,
  TitleBlockTitle,
} from '@wepublish/block-content/website';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  initWePublishTranslator,
  NextWepublishLink,
  RoutedAdminBar,
  withBuilderRouter,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import {
  createWithV1ApiClient,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import deTranlations from '@wepublish/website/translations/de.json';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import resourcesToBackend from 'i18next-resources-to-backend';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Script from 'next/script';
import { mergeDeepRight } from 'ramda';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverridden from '../locales/deOverridden.json';
import { AdblockOverlay } from '../src/components/adblock-detector';
import { Advertisement } from '../src/components/advertisement';
import { OnlineReportsArticle } from '../src/components/article';
import { OnlineReportsAuthorChip } from '../src/components/author-chip';
import { OnlineReportsFooter } from '../src/components/footer';
import { OnlineReportsArticleAuthors } from '../src/components/online-reports-article-authors';
import { OnlineReportsArticleList } from '../src/components/online-reports-article-list';
import { OnlineReportsCommentListItem } from '../src/components/online-reports-comment-list-item';
import { OnlineReportsPage } from '../src/components/page';
import { OnlineReportsPaymentAmount } from '../src/components/payment-amount';
import { OnlineReportsQuoteBlock } from '../src/components/quote-block';
import { AdsProvider } from '../src/context/ads-context';
import { OnlineReportsRegistrationForm } from '../src/forms/registration-form';
import { OnlineReportsNavbar } from '../src/navigation/onlinereports-navbar';
import { OnlineReportsBlockRenderer } from '../src/onlinereports-block-renderer';
import { OnlineReportsGlobalStyles } from '../src/onlinereports-global-styles';
import { OnlineReportsTeaser } from '../src/onlinereports-teaser';
import { OnlineReportsTeaserGridBlock } from '../src/onlinereports-teaser-grid-block';
import { OnlineReportsTeaserGridFlexBlock } from '../src/onlinereports-teaser-grid-flex-blocks';
import { OnlineReportsTeaserListBlock } from '../src/onlinereports-teaser-list-block';
import { OnlineReportsRenderElement } from '../src/render-element';
import { Structure } from '../src/structure';
import theme from '../src/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator()
  .use(resourcesToBackend(() => mergeDeepRight(deTranlations, deOverridden)))
  .init({
    partialBundledLanguages: true,
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de'],
    interpolation: {
      escapeValue: false,
    },
    resources: {
      de: { zod: deTranlations.zod },
    },
  });
z.setErrorMap(zodI18nMap);

// 0-height of last row is needed to make sticky ads work correctly
const Spacer = styled(Structure)`
  grid-template-rows: min-content 1fr 0;
  min-height: 100vh;

  main {
    overflow-x: hidden;
  }
`;

const MainContainer = styled('div')`
  grid-column: 2/3;
  display: grid;
  row-gap: ${({ theme }) => theme.spacing(2.5)};
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: ${({ theme }) => theme.spacing(4)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
  }
`;

const MainContent = styled('main')`
  display: flex;
  flex-direction: column;
  row-gap: ${({ theme }) => theme.spacing(4)};

  ${theme.breakpoints.up('sm')} {
    row-gap: ${({ theme }) => theme.spacing(7.5)};
  }

  ${theme.breakpoints.down('lg')} {
    padding-left: ${({ theme }) => theme.spacing(2.5)};
    padding-right: ${({ theme }) => theme.spacing(2.5)};
  }
`;

const WideboardPlacer = styled('div')``;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const OnlineReportsTitle = styled(TitleBlock)`
  ${TitleBlockTitle} {
    margin-bottom: -${({ theme }) => theme.spacing(2)};
    font-size: ${({ theme }) => theme.typography.h1.fontSize};
    font-family: ${({ theme }) => theme.typography.h1.fontFamily};
    font-weight: ${({ theme }) => theme.typography.h1.fontWeight};
    &:has(+ ${TitleBlockLead}) {
      margin-bottom: -${({ theme }) => theme.spacing(2)};
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 44px;
    }
  }

  ${TitleBlockLead} {
    font-size: ${({ theme }) => theme.typography.body1.fontSize}px;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0;
  }

  ${TitleBlockPreTitleWrapper} {
    display: none;
  }
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

const AdvertisementPlacer = styled('div')`
  padding-left: ${({ theme }) => theme.spacing(2.5)};
  position: sticky;
  top: 112px;
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};
  grid-column: 3/4;
  overflow: hidden;

  @media (max-width: 1200px) {
    display: none;
  }
`;

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'OnlineReports';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  return (
    <AppCacheProvider emotionCache={emotionCache}>
      <AdsProvider>
        <WebsiteProvider>
          <WebsiteBuilderProvider
            Head={Head}
            Script={Script}
            AuthorChip={OnlineReportsAuthorChip}
            ArticleAuthors={OnlineReportsArticleAuthors}
            ArticleList={OnlineReportsArticleList}
            Navbar={OnlineReportsNavbar}
            Footer={OnlineReportsFooter}
            Article={OnlineReportsArticle}
            CommentListItem={OnlineReportsCommentListItem}
            Page={OnlineReportsPage}
            RegistrationForm={OnlineReportsRegistrationForm}
            PaymentAmount={OnlineReportsPaymentAmount}
            richtext={{ RenderElement: OnlineReportsRenderElement }}
            elements={{ Link: NextWepublishLink }}
            blocks={{
              BaseTeaser: OnlineReportsTeaser,
              Renderer: OnlineReportsBlockRenderer,
              TeaserList: OnlineReportsTeaserListBlock,
              TeaserGridFlex: OnlineReportsTeaserGridFlexBlock,
              TeaserGrid: OnlineReportsTeaserGridBlock,
              Quote: OnlineReportsQuoteBlock,
              Title: OnlineReportsTitle,
            }}
            date={{ format: dateFormatter }}
            meta={{ siteTitle }}
          >
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <OnlineReportsGlobalStyles />

              <Head>
                <title key="title">{siteTitle}</title>
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                />

                {/* Feeds */}
                <link
                  rel="alternate"
                  type="application/rss+xml"
                  href="/api/rss-feed"
                />
                <link
                  rel="alternate"
                  type="application/atom+xml"
                  href="/api/atom-feed"
                />
                <link
                  rel="alternate"
                  type="application/feed+json"
                  href="/api/json-feed"
                />

                {/* Sitemap */}
                <link
                  rel="sitemap"
                  type="application/xml"
                  title="Sitemap"
                  href="/api/sitemap"
                />

                {/* Favicon definitions, generated with https://realfavicongenerator.net/ */}
                <link
                  rel="apple-touch-icon"
                  sizes="180x180"
                  href="/apple-touch-icon.png"
                />
                <link
                  rel="icon"
                  type="image/png"
                  sizes="32x32"
                  href="/favicon-32x32.png"
                />
                <link
                  rel="icon"
                  type="image/png"
                  sizes="16x16"
                  href="/favicon-16x16.png"
                />
                <link
                  rel="manifest"
                  href="/site.webmanifest"
                />
                <link
                  rel="mask-icon"
                  href="/safari-pinned-tab.svg"
                  color="#000000"
                />
                <meta
                  name="msapplication-TileColor"
                  content="#ffffff"
                />
                <meta
                  name="theme-color"
                  content="#ffffff"
                />
              </Head>

              <Script
                src="//servedby.revive-adserver.net/asyncjs.php"
                async
              />
              <Script id="catch-errors">
                {`window.onerror = function(message, source, lineno, colno, error) {
                  console.log("an error has occured: " + message, source, lineno, colno, error);
                  return true;
                };`}
              </Script>

              <AdblockOverlay />

              <Spacer>
                <NavBar
                  categorySlugs={[['categories', 'about-us']]}
                  slug="main"
                  headerSlug="header"
                  iconSlug="icons"
                  loginBtn={{ href: '/login' }}
                  profileBtn={{ href: '/profile' }}
                />

                <MainContainer>
                  <MainContent>
                    <WideboardPlacer>
                      <Advertisement type={'whiteboard'} />
                    </WideboardPlacer>
                    <Component {...pageProps} />
                  </MainContent>
                </MainContainer>

                <AdvertisementPlacer>
                  <Advertisement type={'half-page'} />
                </AdvertisementPlacer>

                <FooterContainer
                  slug="footer"
                  categorySlugs={[['about-us']]}
                  iconSlug="icons"
                  wepublishLogo="hidden"
                />
              </Spacer>

              <RoutedAdminBar />
              {publicRuntimeConfig.env.GTM_ID && (
                <GoogleTagManager gtmId={publicRuntimeConfig.env.GTM_ID} />
              )}
            </ThemeProvider>
          </WebsiteBuilderProvider>
        </WebsiteProvider>
      </AdsProvider>
    </AppCacheProvider>
  );
}

const { publicRuntimeConfig } = getConfig();
const withApollo = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [
  authLink,
  previewLink,
]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
