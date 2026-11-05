/// <reference types="vite/client" />
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';
import {
  createRootRouteWithContext,
  HeadContent,
  ScriptOnce,
  Scripts,
} from '@tanstack/react-router';
import {
  reflektFontFiles,
  reflektTenant,
  reflektTheme,
} from '@wepublish/tenant/reflekt';
import { initWePublishTranslator } from '@wepublish/utils/website';
import { googleFontsUrl } from '@wepublish/utils/website/google-fonts';
import {
  ApolloRouterContext,
  getRenderEmotionCache,
  prefetchShared,
  WepublishApolloProvider,
} from '@wepublish/utils/website/tanstack';
import {
  PageDocument,
  PublicEnv,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';
import { setDefaultOptions } from 'date-fns';
import { ReactNode, useState } from 'react';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { App } from '../app';
import { getPublicEnvFn } from '../integration/public-env';

setDefaultOptions({ locale: reflektTenant.dateLocale });
initWePublishTranslator(
  reflektTenant.translations.overrides?.[reflektTenant.translations.lng]
);
z.setErrorMap(zodI18nMap);

const ICON_VERSION = '20260529';

const fontPreloadLinks = reflektFontFiles.map(href => ({
  rel: 'preload',
  as: 'font',
  type: 'font/woff2',
  href,
  crossOrigin: 'anonymous' as const,
}));

const googleFontLinks = (settings: WebsiteSettingsFragment | undefined) => {
  const href = googleFontsUrl(settings?.fonts);

  return href ?
      [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossOrigin: 'anonymous' as const,
        },
        { rel: 'stylesheet', href },
      ]
    : [];
};

export const Route = createRootRouteWithContext<ApolloRouterContext>()({
  /**
   * Replaces `_document.getInitialProps` (website settings + public env) plus
   * the navigation/peer-profile/footer prefetch that every `getStaticProps`
   * repeated. The footer is a CMS page here, so it is loaded with the rest of
   * the shared chrome.
   *
   * Runs against the router's Apollo client, so whatever it loads is
   * dehydrated into the SSR payload automatically. Must stay **user
   * agnostic**: this response is CDN cached.
   */
  staleTime: Infinity,
  shouldReload: false,
  loader: async ({ context: { apolloClient } }) => {
    const [websiteSettings, publicEnv] = await Promise.all([
      prefetchShared(apolloClient),
      getPublicEnvFn(),
      apolloClient.query({
        query: PageDocument,
        variables: { slug: 'footer' },
      }),
    ]);

    return { websiteSettings, publicEnv };
  },
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'apple-mobile-web-app-title', content: 'REFLEKT' },
      { name: 'theme-color', content: '#ffffff' },
    ],
    links: [
      ...fontPreloadLinks,
      {
        rel: 'icon',
        type: 'image/png',
        href: `/favicon-96x96.png?v=${ICON_VERSION}`,
        sizes: '96x96',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: `/favicon.svg?v=${ICON_VERSION}`,
      },
      { rel: 'shortcut icon', href: `/favicon.ico?v=${ICON_VERSION}` },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: `/apple-touch-icon.png?v=${ICON_VERSION}`,
      },
      { rel: 'manifest', href: `/site.webmanifest?v=${ICON_VERSION}` },
      {
        rel: 'mask-icon',
        href: `/safari-pinned-tab.svg?v=${ICON_VERSION}`,
        color: '#000000',
      },
      { rel: 'alternate', type: 'application/rss+xml', href: '/rss.xml' },
      { rel: 'alternate', type: 'application/atom+xml', href: '/atom.xml' },
      { rel: 'alternate', type: 'application/feed+json', href: '/feed.json' },
      {
        rel: 'sitemap',
        type: 'application/xml',
        title: 'Sitemap',
        href: '/sitemap.xml',
      },
      ...googleFontLinks(loaderData?.websiteSettings),
    ],
  }),
  shellComponent: RootDocument,
});

/** `JSON.stringify` alone is unsafe in a `<script>`: `</script>` closes it. */
const toInlineJson = (value: unknown) =>
  JSON.stringify(value ?? null).replace(/</g, '\\u003c');

function RootDocument({ children }: { children: ReactNode }) {
  const { apolloClient } = Route.useRouteContext();
  const { publicEnv, websiteSettings } = Route.useLoaderData() as {
    publicEnv: PublicEnv;
    websiteSettings: WebsiteSettingsFragment | undefined;
  };

  // One cache per request on the server, one for the life of the document in
  // the browser — see `getRenderEmotionCache`.
  const [emotionCache] = useState(getRenderEmotionCache);

  return (
    <html lang="de">
      <head>
        <meta
          name="emotion-insertion-point"
          content=""
        />

        <HeadContent />

        {/*
          Must stay the FIRST script on the page and must never be removed:
          `createWithApiClient` and the router's Apollo client read
          `window.PUBLIC_ENV.apiUrl`, and Vite rewrites every client-side
          `process.env.X` into `globalThis.PUBLIC_ENV.X` (see `vite.config.mts`).
        */}
        <ScriptOnce
          children={`window.PUBLIC_ENV = Object.assign({}, window.PUBLIC_ENV, ${toInlineJson(publicEnv)})`}
        />
        <ScriptOnce
          children={`window.WEBSITE_SETTINGS = ${toInlineJson(websiteSettings)}`}
        />
      </head>

      <body>
        <CacheProvider value={emotionCache}>
          <ThemeProvider theme={reflektTheme}>
            <WepublishApolloProvider client={apolloClient}>
              <App websiteSettings={websiteSettings}>{children}</App>
            </WepublishApolloProvider>
          </ThemeProvider>
        </CacheProvider>

        <Scripts />
      </body>
    </html>
  );
}
