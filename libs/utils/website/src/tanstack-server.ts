/**
 * Server-only half of the TanStack integration. Kept out of
 * `./tanstack.ts` on purpose: everything in here touches
 * `@tanstack/react-start/server` (request headers, cookies, response status)
 * and may only be imported from inside a `createServerFn` handler or a server
 * route handler. Importing it from a component trips TanStack's import
 * protection at build time.
 *
 * The page cache is **not** here — it would reach the client dependency
 * scanner through every server route that imports this barrel. See
 * `./tanstack-page-cache.ts`.
 */
export * from './tanstack/ssr';
