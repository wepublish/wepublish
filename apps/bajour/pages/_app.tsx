import { EmotionCache } from '@emotion/cache';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { withErrorSnackbar } from '@wepublish/errors/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  BajourFooter,
  BajourMainGrid,
  BajourNavbar,
  bajourTenant,
} from '@wepublish/tenant/bajour';
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
  createWithApiClient,
  FullSessionWithTokenWithoutUserFragment,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';
import { setDefaultOptions } from 'date-fns';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import PlausibleProvider from 'next-plausible';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

setDefaultOptions({
  locale: bajourTenant.dateLocale,
});

initWePublishTranslator(
  bajourTenant.translations.overrides?.[bajourTenant.translations.lng]
);
z.setErrorMap(zodI18nMap);

export type CustomAppProps = AppProps<
  {
    sessionToken?: FullSessionWithTokenWithoutUserFragment;
  } & WebsiteShellProps
> & {
  emotionCache?: EmotionCache;
  websiteSettings?: WebsiteSettingsFragment;
  publicEnv?: {
    apiUrl: string;
    mailchimpPopupScriptUrl: string;
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
  const siteTitle = bajourTenant.builder.meta?.siteTitle;
  const router = useRouter();
  const { popup } = router.query;

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
        <Head>
          <title key="title">{siteTitle}</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Head>

        <TenantProviders
          config={bajourTenant}
          extra={{
            Head,
            Script,
            thirdParty: {
              stripe: env?.stripeKey,
            },
          }}
        >
          <BajourMainGrid>
            {shell.showNavigation && (
              <BajourNavbar
                slug="main"
                categorySlugs={[['basel-briefing', 'other'], ['about-us']]}
                headerSlug="header"
                iconSlug="icons"
              />
            )}

            <Component {...pageProps} />

            {shell.showFooter && (
              <BajourFooter
                slug="main"
                categorySlugs={[['basel-briefing', 'other'], ['about-us']]}
              />
            )}
          </BajourMainGrid>

          <RoutedAdminBar />

          <ThirdPartyScripts settings={settings} />

          {popup && (
            <Script
              src={env?.mailchimpPopupScriptUrl}
              strategy="afterInteractive"
            />
          )}
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
