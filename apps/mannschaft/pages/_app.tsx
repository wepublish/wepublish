import { EmotionCache } from '@emotion/cache';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { withErrorSnackbar } from '@wepublish/errors/website';
import { FooterContainer } from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  MainSpacer,
  MannschaftButtonLink,
  MannschaftNavbar,
  MannschaftSpacer,
  mannschaftTenant,
} from '@wepublish/tenant/mannschaft';
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
import { useEffect } from 'react';
import { AdConfig } from 'react-ad-manager';
import { FaBluesky, FaInstagram, FaTiktok } from 'react-icons/fa6';
import { MdFacebook, MdSearch } from 'react-icons/md';
import OneSignal from 'react-onesignal';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { PURModel } from '../src/cookie-or-pay/pur-model';

setDefaultOptions({
  locale: mannschaftTenant.dateLocale,
});

initWePublishTranslator(
  mannschaftTenant.translations.overrides?.[mannschaftTenant.translations.lng]
);
z.setErrorMap(zodI18nMap);

export type CustomAppProps = AppProps<
  {
    sessionToken?: FullSessionWithTokenWithoutUserFragment;
  } & WebsiteShellProps
> & {
  emotionCache?: EmotionCache;
  websiteSettings?: WebsiteSettingsFragment;
  publicEnv?: { apiUrl: string };
};

let oneSignalInitialized = false;

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
}: CustomAppProps) {
  const siteTitle = mannschaftTenant.builder.meta?.siteTitle;

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined' && !oneSignalInitialized) {
      OneSignal.init({
        appId: '71c06630-2d7c-487d-b261-e718bb8ef25f',
        notifyButton: { enable: true } as NonNullable<
          Parameters<typeof OneSignal.init>[0]['notifyButton']
        >,
        allowLocalhostAsSecureOrigin: true,
      });
      oneSignalInitialized = true;
    }
  }, []);

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
          config={mannschaftTenant}
          extra={{ Head, Script }}
        >
          <Head>
            <title key="title">{siteTitle}</title>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <AdConfig collapseEmptyDivs={'collapse'} />
          </Head>

          <MannschaftSpacer>
            {shell.showNavigation && (
              <MannschaftNavbar
                categorySlugs={[['categories', 'other'], ['about-us']]}
                slug="main"
                headerSlug="header"
                iconSlug="icons"
              >
                <MannschaftButtonLink href="/search">
                  <MdSearch size="32" />
                </MannschaftButtonLink>

                <MannschaftButtonLink href="https://www.facebook.com/mannschaftmagazin">
                  <MdFacebook size="32" />
                </MannschaftButtonLink>

                <MannschaftButtonLink href="https://www.instagram.com/mannschaftmagazin">
                  <FaInstagram size="32" />
                </MannschaftButtonLink>

                <MannschaftButtonLink href="https://bsky.app/profile/mannschaftmagazin.bsky.social">
                  <FaBluesky size="32" />
                </MannschaftButtonLink>

                <MannschaftButtonLink href="https://www.tiktok.com/@mannschaftmagazin">
                  <FaTiktok size="32" />
                </MannschaftButtonLink>
              </MannschaftNavbar>
            )}

            <main>
              <MainSpacer maxWidth="lg">
                <Component {...pageProps} />
              </MainSpacer>
            </main>

            {shell.showFooter && (
              <FooterContainer
                slug="footer"
                categorySlugs={[['categories', 'about-us']]}
                iconSlug="icons"
              />
            )}
          </MannschaftSpacer>

          <RoutedAdminBar />

          <PURModel />

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

          <Script
            strategy="lazyOnload"
            src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
          />
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
