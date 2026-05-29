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
import Head from 'next/head';
import Script from 'next/script';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { BabanewsBlockRenderer } from '../src/components/website-builder-overwrites/block-renderer/block-renderer';
import { BabanewsBanner } from '../src/components/website-builder-overwrites/blocks/banner';
import { BabanewsTeaserGrid } from '../src/components/website-builder-styled/blocks/teaser-grid-styled';
import theme from '../src/styles/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator();
z.setErrorMap(zodI18nMap);

const ContentSpacer = styled('div')`
  min-height: 100vh;
`;

const Footer = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({ theme }) => theme.palette.common.white};
  }
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
  const siteTitle = 'baba news';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

  return (
    <AppCacheProvider emotionCache={cache}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
          elements={{ Link: NextWepublishLink }}
          date={{ format: dateFormatter }}
          blocks={{
            Renderer: BabanewsBlockRenderer,
            TeaserGrid: BabanewsTeaserGrid,
          }}
          blockStyles={{
            Banner: BabanewsBanner,
          }}
        >
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Head>
              <title key="title">{siteTitle}</title>
            </Head>

            <NavBar
              categorySlugs={[['categories', 'about-us']]}
              slug="main"
              headerSlug="header"
              iconSlug="icons"
            />

            <ContentSpacer>
              <Component {...pageProps} />
            </ContentSpacer>

            <Footer
              slug="main"
              categorySlugs={[['sonstiges', 'other'], ['about-us']]}
            />

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

            {settings?.ads.sparkLoop.enabled && settings?.ads.sparkLoop.key && (
              <Script
                src={`https://script.sparkloop.app/embed.js?publication_id=${settings.ads.sparkLoop.key}.js`}
                strategy="lazyOnload"
                data-sparkloop
              />
            )}
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </AppCacheProvider>
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
