import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { Container, css } from '@mui/material';
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
import { tsriTenant } from '@wepublish/tenant/tsri';
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
  locale: tsriTenant.dateLocale,
});

initWePublishTranslator(
  tsriTenant.translations.overrides?.[tsriTenant.translations.lng]
);
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
  container: main / inline-size;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`;

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
  const siteTitle = tsriTenant.builder.meta?.siteTitle;

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
        <TenantProviders
          config={tsriTenant}
          extra={{
            Head,
            Script,
            thirdParty: {
              stripe: env?.stripeKey,
            },
          }}
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
              <NavbarContainer
                categorySlugs={[['about-us', 'categories', 'main']]}
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
                categorySlugs={[['about-us', 'categories', 'main']]}
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
