import {
  prefetchSearch,
  SearchPage,
  searchPageSearchSchema,
} from '../pages/search-page';
import { ApolloRouterContext } from './shared';

/**
 * `pages/search.tsx`. Was `getServerSideProps`, i.e. never cached — keep the
 * `no-store` rule for `/search` in the app's `src/start.ts`.
 */
export const searchRoute = () => ({
  validateSearch: searchPageSearchSchema,
  loaderDeps: ({ search }: { search: unknown }) => search as object,
  loader: ({
    context: { apolloClient },
    deps,
  }: {
    context: ApolloRouterContext;
    deps: unknown;
  }) => prefetchSearch(apolloClient, deps),
  component: SearchPage,
});
