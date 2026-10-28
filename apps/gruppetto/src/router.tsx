import { createRouter } from '@tanstack/react-router';
import {
  apolloRouterOptions,
  createRouterApolloClient,
  FourOhFourPage,
} from '@wepublish/utils/website/tanstack';

import { registerSentryClient } from '@wepublish/utils/website/tanstack/sentry/client';

import { routeTree } from './routeTree.gen';

/**
 * `createStartHandler` calls this **once per request** on the server and once
 * at startup in the browser, which is exactly the lifetime the Apollo client
 * needs: isolated per request on the server, a warm singleton on the client.
 */
export function getRouter() {
  const apolloClient = createRouterApolloClient();

  const router = createRouter({
    routeTree,
    // `next/link` prefetched when a link entered the viewport, which is what
    // kept its navigations instant. 'intent' (hover/focus) misses touch and
    // keyboard entirely, and Start forces `autoCodeSplitting`, so a route
    // whose chunk has not been fetched yet mounts a fresh Suspense boundary —
    // and React always renders a fallback for one of those, which is the
    // blank. Preloading on render is what stops the boundary suspending at
    // all, so the previous page stays up until the new one can render whole.
    defaultPreload: 'render',
    // Next's client router kept the `getStaticProps` JSON for the life of the
    // document, and these match that rather than the 60s ISR window the
    // `start.ts` headers use — the two answer different questions. The header
    // decides how long a *new* document may be served from cache; this decides
    // whether a tab that is already open refetches on its way to a page it has
    // visited before.
    //
    // A finite window here reopens the flash. Past it the loader re-runs, and
    // `libs/article/website/.../article.tsx` renders an empty wrapper for the
    // one state `loading && !article` — no skeleton, no previous content — so
    // the article body is blank for the length of the round trip.
    //
    // The cost is that a tab left open for hours keeps showing what it loaded;
    // a reload, or any entry that is not a client-side navigation, gets the
    // current copy.
    defaultPreloadStaleTime: Infinity,
    defaultStaleTime: Infinity,
    scrollRestoration: true,
    // Reached only for URLs no file route matches. Anything the API answers
    // with a 404 is handled by the route itself so the response can carry both
    // a 404 status and the CMS 404 content.
    defaultNotFoundComponent: FourOhFourPage,
    ...apolloRouterOptions(apolloClient),
  });

  if (typeof window !== 'undefined') {
    void registerSentryClient(router);
  }

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
