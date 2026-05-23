import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import {
  Container,
  createTheme,
  css,
  CssBaseline,
  Theme,
  ThemeOptions,
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
  NavbarLink,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import { theme } from '@wepublish/ui';
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
  SessionWithTokenWithoutUser,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';
import { createWithApiClient } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { PartialDeep } from 'type-fest';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverriden from '../locales/deOverriden.json';
import background from '../src/background.svg';
import { GruppettoBreakBlock } from '../src/break-block';
import { Footer } from '../src/footer';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator(deOverriden);
z.setErrorMap(zodI18nMap);

const gruppettoTheme = createTheme(theme, {
  palette: {
    primary: {
      main: '#F084AD',
      dark: '#BC4D77',
    },
    background: {
      default: '#FFFAFC',
    },
  },
  shape: {
    borderRadius: 3,
  },
} as PartialDeep<Theme> | ThemeOptions);

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
  background: url(${background.src});
  background-repeat: repeat-y;
  background-size: cover;
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

  ${NavbarLink}:nth-child(n+3) {
    display: none;
  }
`;

export type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache; websiteSettings?: WebsiteSettingsFragment };

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
}: CustomAppProps) {
  const siteTitle = 'Gruppetto - Das neue Schweizer Radsportmagazin';

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
          meta={{ siteTitle }}
          Head={Head}
          Script={Script}
          Footer={Footer}
          elements={{ Link: NextWepublishLink }}
          blocks={{ Break: GruppettoBreakBlock }}
        >
          <ThemeProvider theme={gruppettoTheme}>
            <CssBaseline />

            <Head>
              <title key="title">{siteTitle}</title>
            </Head>

            <Spacer>
              <NavBar
                categorySlugs={[['account', 'issues', 'about-us']]}
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
                categorySlugs={[[]]}
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
