import { createRouter } from '@tanstack/react-router';
import {
  apolloRouterOptions,
  createRouterApolloClient,
  FourOhFourPage,
} from '@wepublish/utils/website/tanstack';

import { routeTree } from './routeTree.gen';

/**
 * `createStartHandler` calls this **once per request** on the server and once
 * at startup in the browser, which is exactly the lifetime the Apollo client
 * needs: isolated per request on the server, a warm singleton on the client.
 */
export function getRouter() {
  const apolloClient = createRouterApolloClient();

  return createRouter({
    routeTree,
    // `next/link` prefetched when a link entered the viewport. 'intent'
    // (hover/focus) is the closest TanStack equivalent and is what
    // `LinkContext.prefetch` maps onto.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    // Reached only for URLs no file route matches. Anything the API answers
    // with a 404 is handled by the route itself so the response can carry both
    // a 404 status and the CMS 404 content.
    defaultNotFoundComponent: FourOhFourPage,
    ...apolloRouterOptions(apolloClient),
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
