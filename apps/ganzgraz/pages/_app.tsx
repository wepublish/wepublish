import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import {
  Container,
  createTheme,
  css,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { withErrorSnackbar } from '@wepublish/errors/website';
import { FooterContainer } from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import { minimalTheme } from '@wepublish/ui';
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
import { mergeDeepRight } from 'ramda';
import { useMemo } from 'react';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverriden from '../locales/deOverriden.json';
import { GanzGrazAuthor } from '../src/components/ganzgraz-author';
import { GanzgrazBreakBlock } from '../src/components/ganzgraz-break-block';
import { GanzGrazContentWrapper } from '../src/components/ganzgraz-content-wrapper';
import { GanzGrazEvent } from '../src/components/ganzgraz-event';
import { GanzGrazEventListItem } from '../src/components/ganzgraz-event-list-item';
import {
  GanzGrazNavbar,
  GanzGrazNavbarActions,
  GanzGrazPaperActions,
} from '../src/components/ganzgraz-navbar';
import { GanzGrazPaymentAmountPicker } from '../src/components/ganzgraz-payment-amount-picker';
import { GanzGrazTransactionFee } from '../src/components/ganzgraz-transaction-fee';
import { GanzGrazTeaserSlots } from '../src/components/teaser-layouts/ganzgraz-base-teaser-slots';
import { GanzGrazBaseTeaser } from '../src/components/teasers/ganzgraz-base-teaser';
import ganzgrazTheme from '../src/theme';

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
  publicEnv?: { apiUrl: string };
};

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
}: CustomAppProps) {
  const siteTitle = 'Der Graz-Newsletter von ganzgraz';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

  const theme = useMemo(
    () =>
      createTheme(
        minimalTheme,
        mergeDeepRight(ganzgrazTheme, settings?.theme ?? {})
      ),
    [settings]
  );

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
              Author={GanzGrazAuthor}
              PaymentAmountPicker={GanzGrazPaymentAmountPicker}
              TransactionFee={GanzGrazTransactionFee}
              EventListItem={GanzGrazEventListItem}
              Event={GanzGrazEvent}
              ContentWrapper={GanzGrazContentWrapper}
              elements={{ Link: NextWepublishLink }}
              blocks={{
                TeaserSlots: GanzGrazTeaserSlots,
                BaseTeaser: GanzGrazBaseTeaser,
                Break: GanzgrazBreakBlock,
              }}
              date={{ format: dateFormatter }}
              meta={{ siteTitle, locale: 'de-AT' }}
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
                  <GanzGrazNavbar
                    categorySlugs={[['categories', 'about-us']]}
                    slug="main"
                    headerSlug="header"
                    iconSlug="icons"
                    paperActions={<GanzGrazPaperActions />}
                    navbarActions={<GanzGrazNavbarActions />}
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
