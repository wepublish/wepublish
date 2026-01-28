import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleTagManager } from '@next/third-parties/google';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
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
  createWithV1ApiClient,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import deTranlations from '@wepublish/website/translations/de.json';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import resourcesToBackend from 'i18next-resources-to-backend';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';
import { AdConfig } from 'react-ad-manager';
import { FaBluesky, FaInstagram, FaTiktok } from 'react-icons/fa6';
import { MdFacebook, MdSearch } from 'react-icons/md';
import OneSignal from 'react-onesignal';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { PURModel } from '../src/cookie-or-pay/pur-model';
import { MainSpacer } from '../src/main-spacer';
import { MannschaftArticle } from '../src/mannschaft-article';
import { MannschaftArticleDateWithShare } from '../src/mannschaft-article-date-with-share';
import { MannschaftBlockRenderer } from '../src/mannschaft-block-renderer';
import { MannschaftBlocks } from '../src/mannschaft-blocks';
import { MannschaftBreakBlock } from '../src/mannschaft-break-block';
import { MannschaftFocusTeaser } from '../src/mannschaft-focus-teaser';
import { MannschaftGlobalStyles } from '../src/mannschaft-global-styles';
import { MannschaftPage } from '../src/mannschaft-page';
import { MannschaftRichtextBlock } from '../src/mannschaft-richtext-block';
import { MannschaftTeaser } from '../src/mannschaft-teaser';
import { MannschaftTeaserGrid } from '../src/mannschaft-teaser-grid';
import theme from '../src/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator()
  .use(resourcesToBackend(() => deTranlations))
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

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

const ButtonLink = styled('a')`
  color: ${({ theme }) => theme.palette.primary.contrastText};
`;

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

let oneSignalInitialized = false;

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'Mannschaft';

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined' && !oneSignalInitialized) {
      OneSignal.init({
        appId: '71c06630-2d7c-487d-b261-e718bb8ef25f',
        notifyButton: {
          enable: true,
        },
        allowLocalhostAsSecureOrigin: true,
      });
      oneSignalInitialized = true;
    }
  }, []);

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  return (
    <AppCacheProvider emotionCache={cache}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
          Page={MannschaftPage}
          Article={MannschaftArticle}
          ArticleDate={MannschaftArticleDateWithShare}
          elements={{ Link: NextWepublishLink }}
          blocks={{
            Blocks: MannschaftBlocks,
            Renderer: MannschaftBlockRenderer,
            BaseTeaser: MannschaftTeaser,
            TeaserGrid: MannschaftTeaserGrid,
            Break: MannschaftBreakBlock,
            RichText: MannschaftRichtextBlock,
          }}
          blockStyles={{
            FocusTeaser: MannschaftFocusTeaser,
          }}
          date={{ format: dateFormatter }}
          meta={{ siteTitle }}
        >
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <MannschaftGlobalStyles />

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
                rel="apple-touch-icon"
                sizes="180x180"
                href="/apple-touch-icon.png"
              />
              <link
                rel="icon"
                type="image/png"
                sizes="32x32"
                href="/favicon-32x32.png"
              />
              <link
                rel="icon"
                type="image/png"
                sizes="16x16"
                href="/favicon-16x16.png"
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

              <AdConfig collapseEmptyDivs={'collapse'} />
            </Head>

            <Spacer>
              <NavBar
                categorySlugs={[['categories', 'other'], ['about-us']]}
                slug="main"
                headerSlug="header"
                iconSlug="icons"
              >
                <ButtonLink href="/search">
                  <MdSearch size="32" />
                </ButtonLink>

                <ButtonLink href="https://www.facebook.com/mannschaftmagazin">
                  <MdFacebook size="32" />
                </ButtonLink>

                <ButtonLink href="https://www.instagram.com/mannschaftmagazin">
                  <FaInstagram size="32" />
                </ButtonLink>

                <ButtonLink href="https://bsky.app/profile/mannschaftmagazin.bsky.social">
                  <FaBluesky size="32" />
                </ButtonLink>

                <ButtonLink href="https://www.tiktok.com/@mannschaftmagazin">
                  <FaTiktok size="32" />
                </ButtonLink>
              </NavBar>

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

            {publicRuntimeConfig.env.GTM_ID && (
              <>
                <PURModel />
                <GoogleTagManager gtmId={publicRuntimeConfig.env.GTM_ID} />
              </>
            )}

            <Script
              strategy="lazyOnload"
              src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
            />
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </AppCacheProvider>
  );
}

const { publicRuntimeConfig } = getConfig();
const withApollo = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [
  authLink,
  previewLink,
]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
