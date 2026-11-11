import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { Container } from '@mui/material';
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
  hauptstadtTenant,
  PrintLogo,
  withTrackFirstRoute,
} from '@wepublish/tenant/hauptstadt';
import {
  AsyncSessionProvider,
  authLink,
  getWebsiteShell,
  initWePublishTranslator,
  withJwtHandler,
  withSessionProvider,
  WebsiteShellProps,
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
  locale: hauptstadtTenant.dateLocale,
});

initWePublishTranslator(
  hauptstadtTenant.translations.overrides?.[hauptstadtTenant.translations.lng]
);

z.setErrorMap(zodI18nMap);

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  min-height: 100vh;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    gap: ${({ theme }) => theme.spacing(3)};
  }
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const Main = styled('main')`
  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-top: 11px;
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
  const siteTitle = hauptstadtTenant.builder.meta?.siteTitle;

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
          config={hauptstadtTenant}
          extra={{ Head, Script }}
        >
          <Head>
            <title key="title">{siteTitle}</title>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
          </Head>

          <Spacer>
            {shell.showNavigation && (
              <NavBar
                categorySlugs={[['pages']]}
                slug="main"
                headerSlug="header"
                iconSlug="icons"
              />
            )}

            <Main>
              <Container maxWidth="lg">
                <PrintLogo />
                <Component {...pageProps} />
              </Container>
            </Main>

            {shell.showFooter && (
              <FooterContainer
                slug="main"
                categorySlugs={[['pages']]}
                iconSlug="icons"
                hideBannerOnIntersecting={false}
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
      withPaywallBypassToken(
        withSessionProvider(
          withJwtHandler(withTrackFirstRoute(CustomApp)),
          AsyncSessionProvider
        )
      )
    )
  )
);

export { ConnectedApp as default };
