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
  FooterPaperWrapper,
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
import getConfig from 'next/config';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import PlausibleProvider from 'next-plausible';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { BajourArticleDateWithShare } from '../src/bajour-article-date-with-share';
import { BajourTitleBlock } from '../src/components/bajour-title-block';
import { MainGrid } from '../src/components/layout/main-grid';
import { BajourBanner } from '../src/components/website-builder-overwrites/banner/bajour-banner';
import { BajourBlockRenderer } from '../src/components/website-builder-overwrites/block-renderer/block-renderer';
import { BajourTeaser } from '../src/components/website-builder-overwrites/blocks/teaser';
import { BajourTeaserSlider } from '../src/components/website-builder-overwrites/blocks/teaser-slider/bajour-teaser-slider';
import { BajourBreakBlock } from '../src/components/website-builder-overwrites/break/bajour-break';
import { BajourContextBox } from '../src/components/website-builder-overwrites/context-box/context-box';
import { BajourQuoteBlock } from '../src/components/website-builder-overwrites/quote/bajour-quote';
import {
  BajourTeaserGrid,
  BajourTeaserList,
} from '../src/components/website-builder-styled/blocks/teaser-grid-styled';
import theme, { navbarTheme } from '../src/styles/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator();
z.setErrorMap(zodI18nMap);

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

export type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache; websiteSettings?: WebsiteSettingsFragment };

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 12;
`;

const Footer = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

const { publicRuntimeConfig } = getConfig();

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
}: CustomAppProps) {
  const siteTitle = 'Bajour';
  const router = useRouter();
  const { popup } = router.query;

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

  return (
    <PlausibleProvider
      enabled={
        settings?.analytics.plausible.enabled &&
        !!settings?.analytics.plausible.key
      }
      src={`https://plausible.io/js/${settings?.analytics.plausible.key}.js`}
    >
      <AppCacheProvider emotionCache={cache}>
        <Head>
          <title key="title">{siteTitle}</title>
        </Head>

        <WebsiteProvider>
          <WebsiteBuilderProvider
            meta={{ siteTitle }}
            Head={Head}
            Script={Script}
            elements={{ Link: NextWepublishLink }}
            date={{ format: dateFormatter }}
            blocks={{
              Renderer: BajourBlockRenderer,
              BaseTeaser: BajourTeaser,
              TeaserGrid: BajourTeaserGrid,
              TeaserList: BajourTeaserList,
              Break: BajourBreakBlock,
              Quote: BajourQuoteBlock,
              Title: BajourTitleBlock,
            }}
            blockStyles={{
              ContextBox: BajourContextBox,
              TeaserSlider: BajourTeaserSlider,
            }}
            thirdParty={{
              stripe: publicRuntimeConfig.env.STRIPE_PUBLIC_KEY,
            }}
            ArticleDate={BajourArticleDateWithShare}
            Banner={BajourBanner}
          >
            <ThemeProvider theme={theme}>
              <CssBaseline />

              <MainGrid>
                <ThemeProvider theme={navbarTheme}>
                  <NavBar
                    slug="main"
                    categorySlugs={[['basel-briefing', 'other'], ['about-us']]}
                    headerSlug="header"
                    iconSlug="icons"
                  />
                </ThemeProvider>

                <Component {...pageProps} />

                <Footer
                  slug="main"
                  categorySlugs={[['basel-briefing', 'other'], ['about-us']]}
                />
              </MainGrid>

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

              {popup && (
                <Script
                  src={publicRuntimeConfig.env.MAILCHIMP_POPUP_SCRIPT_URL!}
                  strategy="afterInteractive"
                />
              )}
            </ThemeProvider>
          </WebsiteBuilderProvider>
        </WebsiteProvider>
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
