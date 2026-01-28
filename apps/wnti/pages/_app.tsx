import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { Container, css, CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleTagManager } from '@next/third-parties/google';
import { TitleBlock, TitleBlockTitle } from '@wepublish/block-content/website';
import { withErrorSnackbar } from '@wepublish/errors/website';
import { PaymentAmountPicker } from '@wepublish/membership/website';
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
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Script from 'next/script';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverriden from '../locales/deOverriden.json';
import { TsriArticleMeta } from '../src/components/tsri-article-meta';
import { TsriBreakBlock } from '../src/components/tsri-break-block';
import { TsriContextBox } from '../src/components/tsri-context-box';
import { TsriNavbar } from '../src/components/tsri-navbar';
import { TsriQuoteBlock } from '../src/components/tsri-quote-block';
import { TsriRichText } from '../src/components/tsri-richtext';
import { TsriTeaser } from '../src/components/tsri-teaser';
import theme from '../src/theme';
import { MitmachenInner } from './mitmachen';

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
  position: relative;
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`;

const TsriTitle = styled(TitleBlock)`
  ${TitleBlockTitle} {
    ${({ theme }) => theme.breakpoints.down('sm')} {
      font-size: 2rem;
    }
  }
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'WNTI';

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
          Navbar={TsriNavbar}
          ArticleMeta={TsriArticleMeta}
          PaymentAmount={PaymentAmountPicker}
          elements={{ Link: NextWepublishLink }}
          blocks={{
            BaseTeaser: TsriTeaser,
            Break: TsriBreakBlock,
            Quote: TsriQuoteBlock,
            RichText: TsriRichText,
            Title: TsriTitle,
            Subscribe: MitmachenInner,
          }}
          blockStyles={{
            ContextBox: TsriContextBox,
          }}
          date={{ format: dateFormatter }}
          meta={{ siteTitle }}
          thirdParty={{
            stripe: publicRuntimeConfig.env.STRIPE_PUBLIC_KEY,
          }}
        >
          <ThemeProvider theme={theme}>
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

              {/* Favicon definitions, generated with https://realfavicongenerator.net/ */}
              <link
                rel="icon"
                type="image/png"
                href="/favicon-96x96.png"
                sizes="96x96"
              />
              <link
                rel="icon"
                type="image/svg+xml"
                href="/favicon.svg"
              />
              <link
                rel="shortcut icon"
                href="/favicon.ico"
              />
              <link
                rel="apple-touch-icon"
                sizes="180x180"
                href="/apple-touch-icon.png"
              />
              <meta
                name="apple-mobile-web-app-title"
                content="WNTI"
              />
              <link
                rel="manifest"
                href="/site.webmanifest"
              />
            </Head>

            <Spacer>
              <NavbarContainer
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

            {publicRuntimeConfig.env.GTM_ID && (
              <GoogleTagManager gtmId={publicRuntimeConfig.env.GTM_ID} />
            )}

            {publicRuntimeConfig.env.SPARKLOOP_ID && (
              <Script
                src={`https://script.sparkloop.app/team_${publicRuntimeConfig.env.SPARKLOOP_ID}.js`}
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
