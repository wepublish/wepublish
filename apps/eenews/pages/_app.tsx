import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  getApiUrl,
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
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Script from 'next/script';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { Advertisement } from '../src/components/advertisement';
import { EenewsBlockRenderer } from '../src/components/block-renderer/eenews-block-renderer';
import { EenewsTeaser } from '../src/components/blocks/eenews-teaser';
import { EenewsArticle } from '../src/components/eenews-article';
import { EenewsAuthor } from '../src/components/eenews-author';
import { EenewsAuthorListItem } from '../src/components/eenews-author-list-item';
import { EenewsContentWrapper } from '../src/components/eenews-content-wrapper';
import { EenewsFooter } from '../src/components/eenews-footer';
import { EenewsGlobalStyles } from '../src/components/eenews-global-styles';
import { EenewsInvoiceListItem } from '../src/components/eenews-invoice-list-item';
import { EenewsMemberPlanItem } from '../src/components/eenews-member-plan-item';
import { EenewsMemberPlanPicker } from '../src/components/eenews-member-plan-picker';
import { EenewsNavbar } from '../src/components/eenews-navbar';
import { EenewsPaymentMethodPicker } from '../src/components/eenews-payment-method-picker';
import { EenewsPeriodicityPicker } from '../src/components/eenews-periodicity-picker';
import { EenewsSubscriptionListItem } from '../src/components/eenews-subscription-list-item';
import { EenewsTagPage } from '../src/components/eenews-tag-page';
import { AdsProvider } from '../src/context/ads-context';
import theme from '../src/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator();
z.setErrorMap(zodI18nMap);

const Spacer = styled('div')`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  min-height: 100vh;
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const MainContent = styled('main')`
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    min(var(--max-width), 100%)
    minmax(0, 1fr);
  width: 100%;
`;

const ContentArea = styled('div')`
  grid-row: 1;
  grid-column: 1 / -1;
  min-width: 0;
`;

const SkyscraperPlacer = styled('div')`
  display: none;
  grid-row: 1;
  grid-column: 3 / 4;
  justify-self: start;
  margin-left: ${theme.spacing(4)};
  z-index: 1;

  @media (min-width: 1520px) {
    display: block;
  }
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'ee-news.ch';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  return (
    <AppCacheProvider emotionCache={cache}>
      <AdsProvider>
        <WebsiteProvider>
          <WebsiteBuilderProvider
            Head={Head}
            Script={Script}
            Navbar={EenewsNavbar}
            Footer={EenewsFooter}
            Article={EenewsArticle}
            Tag={EenewsTagPage}
            Author={EenewsAuthor}
            AuthorListItem={EenewsAuthorListItem}
            MemberPlanItem={EenewsMemberPlanItem}
            MemberPlanPicker={EenewsMemberPlanPicker}
            PeriodicityPicker={EenewsPeriodicityPicker}
            PaymentMethodPicker={EenewsPaymentMethodPicker}
            SubscriptionListItem={EenewsSubscriptionListItem}
            InvoiceListItem={EenewsInvoiceListItem}
            blocks={{ Renderer: EenewsBlockRenderer, Teaser: EenewsTeaser }}
            elements={{ Link: NextWepublishLink }}
            date={{ format: dateFormatter }}
            meta={{ siteTitle }}
            ContentWrapper={EenewsContentWrapper}
          >
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <EenewsGlobalStyles />

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
                src="https://macbook-pro-brew.tail5ae9ba.ts.net/www/delivery/asyncjs.php"
                async
              />

              <Spacer>
                <NavBar
                  slug="main"
                  headerSlug="header"
                  categorySlugs={[
                    [
                      'mega-themen',
                      'mega-dossiers',
                      'mega-region',
                      'mega-about',
                      'mega-about-secondary',
                    ],
                  ]}
                />

                <MainContent>
                  <ContentArea>
                    <Component {...pageProps} />
                  </ContentArea>
                  <SkyscraperPlacer>
                    <Advertisement type="skyscraper" />
                  </SkyscraperPlacer>
                </MainContent>

                <FooterContainer
                  slug="footer-konto"
                  categorySlugs={[['footer-themen', 'footer-magazin']]}
                />
              </Spacer>

              <RoutedAdminBar />
            </ThemeProvider>
          </WebsiteBuilderProvider>
        </WebsiteProvider>
      </AdsProvider>
    </AppCacheProvider>
  );
}

const { publicRuntimeConfig } = getConfig();
const withApollo = createWithV1ApiClient(getApiUrl(), [authLink, previewLink]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
