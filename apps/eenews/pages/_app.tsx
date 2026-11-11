import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
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
  AdblockOverlay,
  Advertisement,
  eenewsTenant,
  eenewsTheme,
  ReviveScript,
} from '@wepublish/tenant/eenews';
import {
  authLink,
  getWebsiteShell,
  initWePublishTranslator,
  WebsiteShellProps,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import {
  RoutedAdminBar,
  ThirdPartyScripts,
  withBuilderRouter,
} from '@wepublish/utils/website/next';
import { TenantProviders } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import {
  FullSessionWithTokenWithoutUserFragment,
  WebsiteSettingsFragment,
  createWithApiClient,
} from '@wepublish/website/api';
import { setDefaultOptions } from 'date-fns';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import PlausibleProvider from 'next-plausible';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

setDefaultOptions({
  locale: eenewsTenant.dateLocale,
});

initWePublishTranslator(
  eenewsTenant.translations.overrides?.[eenewsTenant.translations.lng]
);
z.setErrorMap(zodI18nMap);

const Spacer = styled('div')`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  min-height: 100vh;
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const MainContent = styled('main')`
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    min(var(--max-width), 100%)
    minmax(0, 1fr);
  width: 100%;

  ${eenewsTheme.breakpoints.up('md')} {
    min-height: max(100vh, 700px);
  }
`;

const ContentArea = styled('div')`
  grid-row: 1;
  grid-column: 1 / -1;
  min-width: 0;
`;

const SkyscraperPlacer = styled('div')`
  display: none;
  grid-row: 1;
  grid-column: 3 / 4;
  justify-self: start;
  margin-left: ${eenewsTheme.spacing(4)};
  z-index: 1;

  @media (min-width: 1520px) {
    display: block;
  }
`;

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
  const siteTitle = eenewsTenant.builder.meta?.siteTitle;

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

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
        <TenantProviders
          config={eenewsTenant}
          extra={{ Head, Script }}
        >
          <Head>
            <title key="title">{siteTitle}</title>

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <link
              rel="preconnect"
              href="https://servedby.revive-adserver.net"
              crossOrigin="anonymous"
            />
            <link
              rel="preconnect"
              href="https://cdn.revive-adserver.net"
            />
          </Head>

          <ReviveScript />

          <AdblockOverlay />

          <Spacer>
            {shell.showNavigation && (
              <NavBar
                slug="main"
                headerSlug="header"
                categorySlugs={[
                  [
                    'mega-themen',
                    'mega-dossiers',
                    'mega-region',
                    'mega-about',
                    'mega-about-secondary',
                  ],
                ]}
              />
            )}

            <MainContent>
              <ContentArea>
                <Component {...pageProps} />
              </ContentArea>
              <SkyscraperPlacer>
                <Advertisement type="skyscraper" />
              </SkyscraperPlacer>
            </MainContent>

            {shell.showFooter && (
              <FooterContainer
                slug="footer-konto"
                categorySlugs={[['footer-themen', 'footer-magazin']]}
              />
            )}
          </Spacer>

          <RoutedAdminBar />

          <ThirdPartyScripts settings={settings} />
        </TenantProviders>
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
