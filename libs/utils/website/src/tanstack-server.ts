/**
 * Server-only half of the TanStack integration. Kept out of
 * `./tanstack.ts` on purpose: everything in here touches
 * `@tanstack/react-start/server` (request headers, cookies, response status)
 * and may only be imported from inside a `createServerFn` handler or a server
 * route handler. Importing it from a component trips TanStack's import
 * protection at build time.
 */
export * from './tanstack/ssr';
