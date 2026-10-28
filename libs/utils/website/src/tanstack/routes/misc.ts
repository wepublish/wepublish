import { notFound, redirect } from '@tanstack/react-router';

import { FourOhFourPage, prefetchFourOhFour } from '../pages/404-page';
import { ApolloRouterContext } from './shared';

/**
 * Splat route for paths no file route matches (`/foo/bar/baz`).
 *
 * `$slug` outranks `$` for single-segment paths, so this only sees deeper
 * URLs. The `throw` is required: rendering the 404 page without it returns a
 * 200 status.
 */
export const notFoundSplatRoute = () => ({
  loader: async ({ context }: { context: ApolloRouterContext }) => {
    await prefetchFourOhFour(context.apolloClient);

    throw notFound();
  },
  notFoundComponent: FourOhFourPage,
});

/**
 * `next.config.js#redirects()` has no TanStack equivalent, so config-level
 * redirects become routes. Next's `permanent: true` was a 308, `false` a 307.
 */
export const redirectRoute = (to: string, { permanent = false } = {}) => ({
  beforeLoad: () => {
    throw redirect({ to, statusCode: permanent ? 308 : 307 });
  },
});
