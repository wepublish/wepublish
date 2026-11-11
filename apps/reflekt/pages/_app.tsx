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
import { MainSpacer, reflektTenant } from '@wepublish/tenant/reflekt';
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
import { useRouter } from 'next/router';
import Script from 'next/script';
import PlausibleProvider, { usePlausible } from 'next-plausible';
import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

setDefaultOptions({
  locale: reflektTenant.dateLocale,
});

initWePublishTranslator(
  reflektTenant.translations.overrides?.[reflektTenant.translations.lng]
);
z.setErrorMap(zodI18nMap);

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
  overflow-x: hidden;
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const CONVERSION_EVENTS: Record<string, string[]> = {
  subscription: ['Payment success', 'Subscription success'],
  upgrade: ['Payment success', 'Subscription success'],
  invoice: ['Payment success'],
};

function PlausibleConversionEvents() {
  const router = useRouter();
  const plausible = usePlausible();
  const handled = useRef(false);

  useEffect(() => {
    if (!router.isReady || handled.current) {
      return;
    }

    const conversion = router.query.wepConversion;

    if (typeof conversion !== 'string') {
      return;
    }

    const events = CONVERSION_EVENTS[conversion];

    if (!events) {
      return;
    }

    handled.current = true;
    events.forEach(event => plausible(event, { props: { type: conversion } }));

    const query = { ...router.query };
    delete query.wepConversion;
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }, [router, plausible]);

  return null;
}

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
  const siteTitle = reflektTenant.builder.meta?.siteTitle;

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
      <PlausibleConversionEvents />

      <AppCacheProvider emotionCache={cache}>
        <TenantProviders
          config={reflektTenant}
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
                categorySlugs={[['main']]}
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
                categorySlugs={[['footer']]}
                iconSlug="icons"
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
