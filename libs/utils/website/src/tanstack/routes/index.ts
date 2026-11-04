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

export * from './account';
export * from './articles';
export * from './authors';
export * from './content';
export * from './events';
export * from './misc';
export * from './search';
export * from './server-routes';
export * from './shared';
