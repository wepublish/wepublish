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
  getWebsiteShell,
  initWePublishTranslator,
  NextWepublishLink,
  RoutedAdminBar,
  ThirdPartyScripts,
  WebsiteShellProps,
  withBuilderRouter,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import {
  FullSessionWithTokenWithoutUserFragment,
  WebsiteSettingsFragment,
  createWithApiClient,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import PlausibleProvider from 'next-plausible';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { Advertisement } from '../src/components/advertisement';
import { AdblockOverlay } from '../src/components/adblock-detector';
import { EenewsBlockRenderer } from '../src/components/block-renderer/eenews-block-renderer';
import { EenewsBreakBlock } from '../src/components/blocks/eenews-break-block';
import { EenewsTeaserGrid } from '../src/components/blocks/eenews-teaser-grid';
import { EenewsArticle } from '../src/components/eenews-article';
import { EenewsAuthor } from '../src/components/eenews-author';
import { EenewsAuthorListItem } from '../src/components/eenews-author-list-item';
import { EenewsBuilderPagination } from '../src/components/eenews-builder-pagination';
import { EenewsContentWrapper } from '../src/components/eenews-content-wrapper';
import { EenewsFooter } from '../src/components/eenews-footer';
import { EenewsGlobalStyles } from '../src/components/eenews-global-styles';
import { EenewsInvoiceListItem } from '../src/components/eenews-invoice-list-item';
import { EeNewsMemberPlanPicker } from '../src/components/eenews-memberplan-picker';
import { EeNewsMemberPlanItem } from '../src/components/eenews-memberplan-picker-item';
import { EenewsNavbar } from '../src/components/eenews-navbar';
import { EenewsSubscriptionListItem } from '../src/components/eenews-subscription-list-item';
import { EenewsTagPage } from '../src/components/eenews-tag-page';
import { ReviveScript } from '../src/components/revive-script';
import { EenewsTeaser } from '../src/components/teasers/eenews-teaser';
import { AdsProvider } from '../src/context/ads-context';
import eenewsTheme from '../src/theme';
import deOverridden from '../locales/deOverridden.json';
setDefaultOptions({
  locale: de,
});

initWePublishTranslator(deOverridden);
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

  ${eenewsTheme.breakpoints.up('md')} {
    min-height: max(100vh, 700px);
  }
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
  margin-left: ${eenewsTheme.spacing(4)};
  z-index: 1;

  @media (min-width: 1520px) {
    display: block;
  }
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

export type CustomAppProps = AppProps<
  {
    sessionToken?: FullSessionWithTokenWithoutUserFragment;
  } & WebsiteShellProps
> & {
  emotionCache?: EmotionCache;
  websiteSettings?: WebsiteSettingsFragment;
  publicEnv?: { apiUrl: string };
};

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
}: CustomAppProps) {
  const siteTitle = 'ee-news.ch';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

  const theme = eenewsTheme;

  const shell = getWebsiteShell(pageProps);

  return (
    <PlausibleProvider
      enabled={
        settings?.analytics.plausible.enabled &&
        !!settings?.analytics.plausible.key
      }
      src={`https://plausible.io/js/${settings?.analytics.plausible.key}.js`}
    >
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
              MemberPlanItem={EeNewsMemberPlanItem}
              MemberPlanPicker={EeNewsMemberPlanPicker}
              SubscriptionListItem={EenewsSubscriptionListItem}
              InvoiceListItem={EenewsInvoiceListItem}
              blocks={{
                Renderer: EenewsBlockRenderer,
                Teaser: EenewsTeaser,
                TeaserGrid: EenewsTeaserGrid,
                Break: EenewsBreakBlock,
              }}
              elements={{
                Link: NextWepublishLink,
                Pagination: EenewsBuilderPagination,
              }}
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
                  <link
                    rel="preconnect"
                    href="https://servedby.revive-adserver.net"
                    crossOrigin="anonymous"
                  />
                  <link
                    rel="preconnect"
                    href="https://cdn.revive-adserver.net"
                  />
                </Head>

                <ReviveScript />

                <AdblockOverlay />

                <Spacer>
                  {shell.showNavigation && (
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
                  )}

                  <MainContent>
                    <ContentArea>
                      <Component {...pageProps} />
                    </ContentArea>
                    <SkyscraperPlacer>
                      <Advertisement type="skyscraper" />
                    </SkyscraperPlacer>
                  </MainContent>

                  {shell.showFooter && (
                    <FooterContainer
                      slug="footer-konto"
                      categorySlugs={[['footer-themen', 'footer-magazin']]}
                    />
                  )}
                </Spacer>

                <RoutedAdminBar />

                <ThirdPartyScripts settings={settings} />
              </ThemeProvider>
            </WebsiteBuilderProvider>
          </WebsiteProvider>
        </AdsProvider>
      </AppCacheProvider>
    </PlausibleProvider>
  );
}

const withApollo = createWithApiClient([authLink, previewLink]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
