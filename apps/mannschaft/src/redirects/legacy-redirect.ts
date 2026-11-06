/**
 * Legacy mannschaft.com URL → new path.
 *
 * `proxy.ts`, a Next middleware, looked each request's pathname up in
 * `redirects.json` — ~2.1 MB of exact-path entries, mostly old numeric
 * article ids. TanStack Start has no such hook, so the lookup runs from the
 * request middleware in `src/start.ts` instead.
 *
 * Exact match only, as before: no prefixes, no patterns.
 */
export type RedirectTable = Record<string, { destination: string }>;

export const resolveLegacyRedirect = (
  pathname: string,
  table: RedirectTable
): string | null => table[pathname]?.destination ?? null;
