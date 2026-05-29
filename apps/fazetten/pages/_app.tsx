import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { Container, css, CssBaseline, ThemeProvider } from '@mui/material';
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
import {
  WebsiteBuilderProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { PartialDeep } from 'type-fest';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverriden from '../locales/deOverriden.json';
import { FazettenArticle } from '../src/components/fazetten-article';
import { FazettenTitleBlock } from '../src/components/fazetten-title-block';
import { FazettenBaseTeaserSlots } from '../src/components/teaser-layouts/fazetten-base-teaser-slots';
import { FazettenAlternatingTeaser } from '../src/components/teasers/fazetten-alternating-teaser';
import { FazettenBaseTeaser } from '../src/components/teasers/fazetten-base-teaser';
import theme, { globalStyles } from '../src/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator(deOverriden);
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

const siteTitle = 'Fazetten';
const providerProps: PartialDeep<WebsiteBuilderProps> = {
  Head,
  Script,
  elements: { Link: NextWepublishLink },
  blocks: {
    Title: FazettenTitleBlock,
    TeaserSlots: FazettenBaseTeaserSlots,
    BaseTeaser: FazettenBaseTeaser,
  },
  blockStyles: { AlternatingTeaser: FazettenAlternatingTeaser },
  date: { format: dateFormatter },
  Article: FazettenArticle,
  meta: { siteTitle },
};

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
}: CustomAppProps) {
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
        <WebsiteBuilderProvider {...providerProps}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {globalStyles}

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
