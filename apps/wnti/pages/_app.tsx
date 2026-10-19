import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { Container, css, CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { TitleBlock, TitleBlockTitle } from '@wepublish/block-content/website';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  getWebsiteShell,
  initWePublishTranslator,
  NextWepublishLink,
  RoutedAdminBar,
  ThirdPartyScripts,
  WebsiteShellProps,
  withBuilderRouter,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import {
  FullSessionWithTokenWithoutUserFragment,
  WebsiteSettingsFragment,
  createWithApiClient,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import PlausibleProvider from 'next-plausible';
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
import { WntiPaymentAmountPicker } from '../src/components/wnti-payment-amount-picker';
import theme from '../src/theme';

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

export type CustomAppProps = AppProps<
  {
    sessionToken?: FullSessionWithTokenWithoutUserFragment;
  } & WebsiteShellProps
> & {
  emotionCache?: EmotionCache;
  websiteSettings?: WebsiteSettingsFragment;
  publicEnv?: {
    apiUrl: string;
    stripeKey: string;
  };
};

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
  publicEnv,
}: CustomAppProps) {
  const siteTitle = 'WNTI';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

  const env =
    publicEnv ??
    (typeof window !== 'undefined' ?
      (window.PUBLIC_ENV as typeof publicEnv)
    : undefined);

  const shell = getWebsiteShell(pageProps);

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
              Navbar={TsriNavbar}
              ArticleMeta={TsriArticleMeta}
              PaymentAmountPicker={WntiPaymentAmountPicker}
              elements={{ Link: NextWepublishLink }}
              blocks={{
                BaseTeaser: TsriTeaser,
                Break: TsriBreakBlock,
                Quote: TsriQuoteBlock,
                RichText: TsriRichText,
                Title: TsriTitle,
              }}
              blockStyles={{
                ContextBox: TsriContextBox,
              }}
              date={{ format: dateFormatter }}
              meta={{ siteTitle }}
              thirdParty={{
                stripe: env?.stripeKey,
              }}
            >
              <CssBaseline />

              <Head>
                <title key="title">{siteTitle}</title>
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                />
              </Head>

              <Spacer>
                {shell.showNavigation && (
                  <NavbarContainer
                    categorySlugs={[['categories', 'about-us']]}
                    slug="main"
                    headerSlug="header"
                    iconSlug="icons"
                  />
                )}

                <main>
                  <MainSpacer maxWidth="lg">
                    <Component {...pageProps} />
                  </MainSpacer>
                </main>

                {shell.showFooter && (
                  <FooterContainer
                    slug="footer"
                    categorySlugs={[['categories', 'about-us']]}
                    iconSlug="icons"
                  />
                )}
              </Spacer>

              <RoutedAdminBar />

              <ThirdPartyScripts settings={settings} />
            </WebsiteBuilderProvider>
          </WebsiteProvider>
        </ThemeProvider>
      </AppCacheProvider>
    </PlausibleProvider>
  );
}

const withApollo = createWithApiClient([authLink, previewLink]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
