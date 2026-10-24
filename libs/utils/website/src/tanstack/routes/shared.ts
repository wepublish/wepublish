import { notFound } from '@tanstack/react-router';
import { useParams } from '@tanstack/react-router';
import { z } from 'zod';

import type { ApolloRouterContext } from '../apollo';
import { prefetchFourOhFour } from '../pages/404-page';

/**
 * Reusable route options, so a tenant's route file is a path plus a spread:
 *
 * ```ts
 * // apps/<tenant>/src/routes/a/$slug.tsx
 * export const Route = createFileRoute('/a/$slug')(articleBySlugRoute());
 * ```
 *
 * Conventions these encode:
 *
 * - **404s.** When the API answers 404 we prefetch the CMS page with slug
 *   `404` and then `throw notFound()`. The throw is what gives the SSR
 *   response a real 404 status — rendering a "not found" component on its own
 *   still returns 200. The matching `notFoundComponent` renders that page.
 * - **No `getStaticPaths` equivalent.** Next used `fallback: 'blocking'` with
 *   an empty `paths` array, i.e. render on first request — TanStack's default.
 * - **Cache headers** are not set here. They are applied centrally, by path,
 *   in the app's `src/start.ts` request middleware.
 */

/** `?page=` for every paginated index. */
export const pageSearchSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
});

/** `?jwt=` — any page reachable from a magic link must accept it. */
export const jwtSearchSchema = z.object({ jwt: z.string().optional() });

/** Prefetch the CMS 404 page, then bail out with a real 404 status. */
export const bailOutNotFound = async (context: ApolloRouterContext) => {
  await prefetchFourOhFour(context.apolloClient);

  throw notFound();
};

/**
 * Route params for components mounted by more than one route (the shared
 * page/article/event components are), where `Route.useParams()` from one
 * specific route file is not available.
 */
export const useRouteParams = <T extends Record<string, string>>(): T =>
  // `strict: false` means "whatever route is actually mounted", which the
  // generated types cannot narrow — hence the cast.
  useParams({ strict: false } as never) as T;

export type { ApolloRouterContext };
