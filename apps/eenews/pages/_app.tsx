import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
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
  createWithApiClient,
  SessionWithTokenWithoutUser,
  WebsiteSettingsFragment,
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
import { EeNewsSubscribe } from '../src/components/eenews-subscribe';
import { EenewsSubscriptionListItem } from '../src/components/eenews-subscription-list-item';
import { EenewsTagPage } from '../src/components/eenews-tag-page';
import { EenewsTeaser } from '../src/components/teasers/eenews-teaser';
import { AdsProvider } from '../src/context/ads-context';
import eenewsTheme from '../src/theme';
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

export type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache; websiteSettings?: WebsiteSettingsFragment };

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
              Subscribe={EeNewsSubscribe}
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
                    rel="icon"
                    type="image/png"
                    href="/favicon-96x96.png"
                    sizes="96x96"
                  />
                  <link
                    rel="icon"
                    type="image/svg+xml"
                    href="/favicon.svg"
                  />
                  <link
                    rel="shortcut icon"
                    href="/favicon.ico"
                  />
                  <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/apple-touch-icon.png"
                  />
                  <meta
                    name="apple-mobile-web-app-title"
                    content="EE News"
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

                <AdblockOverlay />

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

                {settings?.analytics.googleAnalytics.enabled &&
                  settings?.analytics.googleAnalytics.key && (
                    <GoogleAnalytics
                      gaId={settings.analytics.googleAnalytics.key}
                    />
                  )}

                {settings?.analytics.googleTagManager.enabled &&
                  settings?.analytics.googleTagManager.key && (
                    <GoogleTagManager
                      gtmId={settings.analytics.googleTagManager.key}
                    />
                  )}

                {settings?.analytics.piwik.enabled &&
                  settings?.analytics.piwik.key && (
                    <Script id="piwik-pro">
                      {`(function(window, document, dataLayerName, id) { window[dataLayerName]=window[dataLayerName]||[],window[dataLayerName].push({start:(new Date).getTime(),event:"stg.start"});var scripts=document.getElementsByTagName('script')[0],tags=document.createElement('script'); var qP=[];dataLayerName!=="dataLayer"&&qP.push("data_layer_name="+dataLayerName);var qPString=qP.length>0?("?"+qP.join("&")):""; tags.async=!0,tags.src="https://flimmer.containers.piwik.pro/"+id+".js"+qPString,scripts.parentNode.insertBefore(tags,scripts); !function(a,n,i){a[n]=a[n]||{};for(var c=0;c<i.length;c++)!function(i){a[n][i]=a[n][i]||{},a[n][i].api=a[n][i].api||function(){var a=[].slice.call(arguments,0);"string"==typeof a[0]&&window[dataLayerName].push({event:n+"."+i+":"+a[0],parameters:[].slice.call(arguments,1)})}}(i[c])}(window,"ppms",["tm","cm"]); })(window, document, 'dataLayer', '${settings.analytics.piwik.key}');`}
                    </Script>
                  )}

                {settings?.ads.sparkLoop.enabled &&
                  settings?.ads.sparkLoop.key && (
                    <Script
                      src={`https://script.sparkloop.app/embed.js?publication_id=${settings.ads.sparkLoop.key}.js`}
                      strategy="lazyOnload"
                      data-sparkloop
                    />
                  )}
              </ThemeProvider>
            </WebsiteBuilderProvider>
          </WebsiteProvider>
        </AdsProvider>
      </AppCacheProvider>
    </PlausibleProvider>
  );
}

const withApollo = createWithApiClient(getApiUrl(), [authLink, previewLink]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
