import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
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
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Script from 'next/script';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { EenewsArticle } from '../src/components/eenews-article';
import { EenewsBlockRenderer } from '../src/components/block-renderer/eenews-block-renderer';
import { EenewsFooter } from '../src/components/eenews-footer';
import { EenewsNavbar } from '../src/components/eenews-navbar';
import { EenewsMemberPlanItem } from '../src/components/eenews-member-plan-item';
import { EenewsMemberPlanPicker } from '../src/components/eenews-member-plan-picker';
import {
  EenewsInvoiceList,
  EenewsInvoiceListItem,
} from '../src/components/eenews-invoice-list-item';
import {
  EenewsSubscriptionList,
  EenewsSubscriptionListItem,
} from '../src/components/eenews-subscription-list-item';
import { EenewsTagPage } from '../src/components/eenews-tag-page';
import theme, { eenewsColors } from '../src/theme';

setDefaultOptions({ locale: de });
initWePublishTranslator();
z.setErrorMap(zodI18nMap);

// Page shell — full-width topbar + main + full-width footer. The main content
// is rendered by individual pages, each of which uses its own Container (capped
// at 1360px in the theme override). No MainSpacer / Container constraint here.
const Spacer = styled('div')`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  min-height: 100vh;
  background: ${eenewsColors.paper};
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'd. MMMM yyyy');

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'ee·news';

  // Emotion cache from _document is not supplied when client-side rendering.
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  return (
    <AppCacheProvider emotionCache={cache}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
          Navbar={EenewsNavbar}
          Footer={EenewsFooter}
          Article={EenewsArticle}
          Tag={EenewsTagPage}
          MemberPlanItem={EenewsMemberPlanItem}
          MemberPlanPicker={EenewsMemberPlanPicker}
          SubscriptionList={EenewsSubscriptionList}
          SubscriptionListItem={EenewsSubscriptionListItem}
          InvoiceList={EenewsInvoiceList}
          InvoiceListItem={EenewsInvoiceListItem}
          blocks={{ Renderer: EenewsBlockRenderer }}
          elements={{ Link: NextWepublishLink }}
          date={{ format: dateFormatter }}
          meta={{ siteTitle }}
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

              {/* Favicons (placeholders — replace with brand assets when available) */}
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
              <meta
                name="theme-color"
                content={eenewsColors.paper}
              />
            </Head>

            <Spacer>
              <NavbarContainer
                slug="main"
                headerSlug="header"
                iconSlug="icons"
                categorySlugs={[]}
              />

              <main>
                <Component {...pageProps} />
              </main>

              <FooterContainer
                slug="footer"
                iconSlug="icons"
                categorySlugs={[]}
              />
            </Spacer>

            <RoutedAdminBar />
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
