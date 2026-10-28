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
    // Next's client router kept the `getStaticProps` JSON it had already
    // fetched. At 0 the hover preload is thrown away on click, so the loader
    // runs twice per navigation and again on every back-navigation. These
    // match the 60s ISR window the cache headers in `start.ts` use.
    defaultPreloadStaleTime: 60_000,
    defaultStaleTime: 60_000,
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
