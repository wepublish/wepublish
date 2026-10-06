import { ApolloClient, InMemoryCache } from '@apollo/client';

import { createWepublishLink } from './wepublish/link';

// The components run the live site's Drupal documents (lib/queries.js); the
// link answers them from we.publish (lib/wepublish/).
let browserClient;

function createClient(initialState) {
  const cache = new InMemoryCache();

  if (initialState) {
    cache.restore(initialState);
  }

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: createWepublishLink(),
    cache,
  });
}

// a fresh client per server request, one shared client in the browser
export function getApolloClient(initialState) {
  if (typeof window === 'undefined') {
    return createClient(initialState);
  }

  if (!browserClient) {
    browserClient = createClient(initialState);
  }

  return browserClient;
}
