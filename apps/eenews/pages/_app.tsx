import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
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
  AdblockOverlay,
  Advertisement,
  eenewsTenant,
  eenewsTheme,
  ReviveScript,
} from '@wepublish/tenant/eenews';
import {
  authLink,
  getWebsiteShell,
  initWePublishTranslator,
  RoutedAdminBar,
  WebsiteShellProps,
  withBuilderRouter,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { TenantProviders } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import {
  FullSessionWithTokenWithoutUserFragment,
  WebsiteSettingsFragment,
  createWithApiClient,
} from '@wepublish/website/api';
import { setDefaultOptions } from 'date-fns';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import PlausibleProvider from 'next-plausible';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

setDefaultOptions({
  locale: eenewsTenant.dateLocale,
});

initWePublishTranslator(
  eenewsTenant.translations.overrides?.[eenewsTenant.translations.lng]
);
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
  const siteTitle = eenewsTenant.builder.meta?.siteTitle;

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

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
        <TenantProviders
          config={eenewsTenant}
          extra={{ Head, Script }}
        >
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

          {settings?.analytics.googleAnalytics.enabled &&
            settings?.analytics.googleAnalytics.key && (
              <GoogleAnalytics gaId={settings.analytics.googleAnalytics.key} />
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

          {settings?.ads.sparkLoop.enabled && settings?.ads.sparkLoop.key && (
            <Script
              src={`https://script.sparkloop.app/embed.js?publication_id=${settings.ads.sparkLoop.key}.js`}
              strategy="lazyOnload"
              data-sparkloop
            />
          )}
        </TenantProviders>
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
