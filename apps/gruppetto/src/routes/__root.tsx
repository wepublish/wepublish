/// <reference types="vite/client" />
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';
import {
  createRootRouteWithContext,
  HeadContent,
  ScriptOnce,
  Scripts,
} from '@tanstack/react-router';
import { gruppettoConfig, gruppettoTheme } from '@wepublish/tenant/gruppetto';
import { initWePublishTranslator } from '@wepublish/utils/website';
import { googleFontsUrl } from '@wepublish/utils/website/google-fonts';
import { getRenderEmotionCache } from '@wepublish/utils/website/tanstack';
import {
  ApolloRouterContext,
  prefetchShared,
  WepublishApolloProvider,
} from '@wepublish/utils/website/tanstack';
import { PublicEnv, WebsiteSettingsFragment } from '@wepublish/website/api';
import { setDefaultOptions } from 'date-fns';
import { ReactNode, useState } from 'react';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { App } from '../app';
import { getPublicEnvFn } from '../integration/public-env';

setDefaultOptions({ locale: gruppettoConfig.dateLocale });
initWePublishTranslator(
  gruppettoConfig.translations.overrides?.[gruppettoConfig.translations.lng]
);
z.setErrorMap(zodI18nMap);

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
   * the navigation/peer-profile prefetch that every `getStaticProps` repeated.
   *
   * Runs against the router's Apollo client, so whatever it loads is
   * dehydrated into the SSR payload automatically — no `pageProps` plumbing.
   * Must stay **user agnostic**: this response is CDN cached.
   *
   * `_document.getInitialProps` ran once per document and never again on a
   * client-side navigation. The two options below say the same thing to the
   * router: this data belongs to the document, not to a route, so a
   * navigation must neither reload nor invalidate it. Without them it falls
   * back to `defaultStaleTime`, and the chrome every page shares would be
   * re-resolved while the reader moves around the site.
   */
  staleTime: Infinity,
  shouldReload: false,
  loader: async ({ context: { apolloClient } }) => {
    const [websiteSettings, publicEnv] = await Promise.all([
      prefetchShared(apolloClient),
      getPublicEnvFn(),
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
  // the browser — see `getRenderEmotionCache`. A shared server cache would
  // consider rules already `inserted` and the second request would ship HTML
  // with no styles at all.
  //
  // Both carry `cache.compat`, which tells emotion something else decides
  // where the rules go: `withEmotionExtraction` puts them in `<head>` on the
  // server, `insertionPoint` does in the browser. Setting it without that
  // extraction is what once shipped HTML with no emotion rules at all.
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
          Must stay the FIRST script on the page and must never be removed.
          Two things depend on it:
            1. `createWithApiClient` and the router's Apollo client read
               `window.PUBLIC_ENV.apiUrl` for the runtime API address.
            2. Vite rewrites every client-side `process.env.X` into
               `globalThis.PUBLIC_ENV.X` (see `vite.config.mts`), so a missing
               object is a ReferenceError in the bundle, not a silent default.
          `Object.assign` rather than a plain assignment so a partially
          rendered shell cannot wipe values a previous script already set.

          `ScriptOnce` rather than a bare `<script>`: it carries the CSP nonce
          from `router.options.ssr.nonce`, and these two are precisely what a
          nonce-based policy would block — with `PUBLIC_ENV` missing, every
          rewritten `process.env.X` in the bundle throws. It also renders on
          the server only and deletes itself once run, so nothing is left in
          the hydrated DOM. Neither changes *when* they execute: still inline,
          still parsed before the deferred module bundle.
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
