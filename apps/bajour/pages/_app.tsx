import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleAnalytics } from '@next/third-parties/google';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  FooterPaperWrapper,
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
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
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

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

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

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'Bajour';
  const router = useRouter();
  const { popup } = router.query;

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  return (
    <AppCacheProvider emotionCache={cache}>
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

            {publicRuntimeConfig.env.GA_ID && (
              <GoogleAnalytics gaId={publicRuntimeConfig.env.GA_ID} />
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
  );
}

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
