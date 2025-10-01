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
import { GoogleAnalytics } from '@next/third-parties/google';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import { theme } from '@wepublish/ui';
import {
  authLink,
  NextWepublishLink,
  RoutedAdminBar,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { createWithV1ApiClient } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import deTranlations from '@wepublish/website/translations/de.json';
import { setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import resourcesToBackend from 'i18next-resources-to-backend';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Script from 'next/script';
import { mergeDeepRight } from 'ramda';
import { initReactI18next } from 'react-i18next';
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

i18next
  .use(ICU)
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend(() => mergeDeepRight(deTranlations, deOverriden)))
  .init({
    partialBundledLanguages: true,
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de'],
    interpolation: {
      escapeValue: false,
    },
    resources: {
      de: { zod: deTranlations.zod },
    },
  });
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
`;

const { publicRuntimeConfig } = getConfig();

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'Gruppetto - Das neue Schweizer Radsportmagazin';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

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

            {publicRuntimeConfig.env.GA_ID && (
              <GoogleAnalytics gaId={publicRuntimeConfig.env.GA_ID} />
            )}
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </AppCacheProvider>
  );
}

const withApollo = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [
  authLink,
  previewLink,
]);
const ConnectedApp = withApollo(
  withErrorSnackbar(
    withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
  )
);

export { ConnectedApp as default };
