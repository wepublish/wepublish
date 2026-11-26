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
  onlinereportsTenant,
  onlinereportsTheme as theme,
  ReviveScript,
  Structure,
} from '@wepublish/tenant/onlinereports';
import {
  authLink,
  useLiveWebsiteShell,
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
  createWithApiClient,
  FullSessionWithTokenWithoutUserFragment,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';
import { setDefaultOptions } from 'date-fns';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import PlausibleProvider from 'next-plausible';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

setDefaultOptions({
  locale: onlinereportsTenant.dateLocale,
});

initWePublishTranslator(
  onlinereportsTenant.translations.overrides?.[
    onlinereportsTenant.translations.lng
  ]
);
z.setErrorMap(zodI18nMap);

// 0-height of last row is needed to make sticky ads work correctly
const Spacer = styled(Structure)`
  grid-template-rows: min-content 1fr 0;
  min-height: 100vh;

  main {
    overflow-x: hidden;
  }
`;

const MainContainer = styled('div')`
  grid-column: 2/3;
  display: grid;
  row-gap: ${({ theme }) => theme.spacing(2.5)};
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: ${({ theme }) => theme.spacing(4)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
  }
`;

const MainContent = styled('main')`
  display: flex;
  flex-direction: column;
  row-gap: ${({ theme }) => theme.spacing(4)};

  ${theme.breakpoints.up('sm')} {
    row-gap: ${({ theme }) => theme.spacing(7.5)};
  }

  ${theme.breakpoints.down('lg')} {
    padding-left: ${({ theme }) => theme.spacing(2.5)};
    padding-right: ${({ theme }) => theme.spacing(2.5)};
  }
`;

const WideboardPlacer = styled('div')``;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const AdvertisementPlacer = styled('div')`
  padding-left: ${({ theme }) => theme.spacing(2.5)};
  position: sticky;
  top: 112px;
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};
  grid-column: 3/4;
  overflow: hidden;

  @media (max-width: 1200px) {
    display: none;
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
  const siteTitle = onlinereportsTenant.builder.meta?.siteTitle;

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

  const shell = useLiveWebsiteShell(pageProps);

  return (
    <PlausibleProvider
      enabled={
        settings?.analytics.plausible.enabled &&
        !!settings?.analytics.plausible.key
      }
      src={`https://plausible.io/js/${settings?.analytics.plausible.key}.js`}
    >
      <AppCacheProvider emotionCache={emotionCache}>
        <TenantProviders
          config={onlinereportsTenant}
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
                categorySlugs={[['categories', 'about-us']]}
                slug="main"
                headerSlug="header"
                iconSlug="icons"
                loginBtn={{ href: '/login' }}
                profileBtn={{ href: '/profile' }}
              />
            )}

            <MainContainer>
              <MainContent>
                <WideboardPlacer>
                  <Advertisement type={'whiteboard'} />
                </WideboardPlacer>
                <Component {...pageProps} />
              </MainContent>
            </MainContainer>

            <AdvertisementPlacer>
              <Advertisement type={'half-page'} />
            </AdvertisementPlacer>

            {shell.showFooter && (
              <FooterContainer
                slug="footer"
                categorySlugs={[['about-us']]}
                iconSlug="icons"
                wepublishLogo="hidden"
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
