import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import {
  Container,
  createTheme,
  css,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
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
import { minimalTheme } from '@wepublish/ui';
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
import { useMemo } from 'react';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { EeNewsMemberPlanPicker } from '../src/components/eenews-memberplan-picker';
import { EeNewsMemberPlanItem } from '../src/components/eenews-memberplan-picker-item';
import { EeNewsSubscribe } from '../src/components/eenews-subscribe';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator();
z.setErrorMap(zodI18nMap);

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
`;

const MainSpacer = styled(Container)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
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

  const theme = useMemo(
    () => createTheme(minimalTheme, settings?.theme ?? {}),
    [settings]
  );

  return (
    <PlausibleProvider
      enabled={
        settings?.analytics.plausible.enabled &&
        !!settings?.analytics.plausible.key
      }
      src={`https://plausible.io/js/${settings?.analytics.plausible.key}.js`}
    >
      <AppCacheProvider emotionCache={cache}>
        <ThemeProvider theme={theme}>
          <WebsiteProvider>
            <WebsiteBuilderProvider
              Head={Head}
              Script={Script}
              elements={{ Link: NextWepublishLink }}
              MemberPlanPicker={EeNewsMemberPlanPicker}
              MemberPlanItem={EeNewsMemberPlanItem}
              Subscribe={EeNewsSubscribe}
              date={{ format: dateFormatter }}
              meta={{ siteTitle }}
            >
              <CssBaseline />

              <Head>
                <title key="title">{siteTitle}</title>
              </Head>

              <Spacer>
                <NavBar
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

                <FooterContainer
                  slug="footer"
                  categorySlugs={[['categories', 'about-us']]}
                  iconSlug="icons"
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
            </WebsiteBuilderProvider>
          </WebsiteProvider>
        </ThemeProvider>
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
