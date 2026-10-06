/// <reference types="vite/client" />
import createEmotionCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import {
  ApolloRouterContext,
  initWePublishTranslator,
  prefetchShared,
  prefetchWebsiteSettings,
  websiteSettingsFontLinks,
  WepublishApolloProvider,
} from '@wepublish/utils/website/tanstack';
import { PublicEnv, WebsiteSettingsFragment } from '@wepublish/website/api';
import { setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { ReactNode, useState } from 'react';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverriden from '../../locales/deOverriden.json';
import { App } from '../app';
import { getPublicEnvFn } from '../integration/public-env';
import { gruppettoTheme } from '../theme';

setDefaultOptions({ locale: de });
initWePublishTranslator(deOverriden);
z.setErrorMap(zodI18nMap);

export const Route = createRootRouteWithContext<ApolloRouterContext>()({
  /**
   * Replaces `_document.getInitialProps` (website settings + public env) plus
   * the navigation/peer-profile prefetch that every `getStaticProps` repeated.
   *
   * Runs against the router's Apollo client, so whatever it loads is
   * dehydrated into the SSR payload automatically — no `pageProps` plumbing.
   * Must stay **user agnostic**: this response is CDN cached.
   */
  loader: async ({ context: { apolloClient } }) => {
    const [websiteSettings, publicEnv] = await Promise.all([
      prefetchWebsiteSettings(apolloClient),
      getPublicEnvFn(),
      prefetchShared(apolloClient),
    ]);

    return { websiteSettings, publicEnv };
  },
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      // These lived in `pages/_document.tsx`.
      { rel: 'alternate', type: 'application/rss+xml', href: '/rss.xml' },
      { rel: 'alternate', type: 'application/atom+xml', href: '/atom.xml' },
      { rel: 'alternate', type: 'application/feed+json', href: '/feed.json' },
      {
        rel: 'sitemap',
        type: 'application/xml',
        title: 'Sitemap',
        href: '/sitemap.xml',
      },
      ...websiteSettingsFontLinks(loaderData?.websiteSettings),
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

  // New per render on the server — one cache per request. A shared server
  // cache would consider rules already `inserted` and the second request
  // would ship HTML with no styles at all. In the browser this runs once and
  // `createCache` adopts the SSR `<style data-emotion>` tags, so hydration
  // does not duplicate them.
  const [emotionCache] = useState(() =>
    createEmotionCache({ key: 'css', prepend: true })
  );

  return (
    <html lang="de">
      <head>
        <HeadContent />

        {/*
          Must stay the FIRST script on the page and must never be removed.
          Two things depend on it:
            1. `createWithApiClient` and the router's Apollo client read
               `window.PUBLIC_ENV.apiUrl` for the runtime API address.
            2. Vite rewrites every client-side `process.env.X` into
               `globalThis.PUBLIC_ENV.X` (see `vite.config.mts`), so a missing
               object is a ReferenceError in the bundle, not a silent default.
          `Object.assign` rather than a plain assignment so a partially
          rendered shell cannot wipe values a previous script already set.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.PUBLIC_ENV = Object.assign({}, window.PUBLIC_ENV, ${toInlineJson(publicEnv)})`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.WEBSITE_SETTINGS = ${toInlineJson(websiteSettings)}`,
          }}
        />
      </head>

      <body>
        <CacheProvider value={emotionCache}>
          <ThemeProvider theme={gruppettoTheme}>
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
