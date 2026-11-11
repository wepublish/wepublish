/**
 * Types for `page-cache.js`.
 *
 * The implementation stays plain CommonJS because Next loads
 * `page-cache-handler.js` through `require()` at runtime, from the source
 * path in `next.config.js#cacheHandler` — outside any bundler, so it cannot
 * be TypeScript. `allowJs` is off in this project, which means the TanStack
 * adapter (`src/tanstack/page-cache.ts`) can only import it through this
 * declaration file.
 *
 * Keep it in sync by hand. It is the only thing standing between a rename in
 * the `.js` and a silent `undefined` at runtime.
 */
import type { SharedStore } from './shared-store';

export type PageCacheClock = {
  now(): number;
  /** A monotonic, sub-millisecond timestamp. Only ordering matters. */
  perfNow(): number;
};

/**
 * What one cache entry holds. `kind` mirrors Next's incremental cache so the
 * same core serves both frameworks; only `PAGES` and `REDIRECT` are shared
 * between pods.
 */
export type PageCacheValue = {
  kind: 'PAGES' | 'REDIRECT';
  html?: string;
  status?: number;
  headers?: [string, string][];
};

export type PageCacheEntry = {
  value: PageCacheValue;
  /**
   * `1` is the sentinel for "stale, re-render this". Anything else is a real
   * timestamp and means the entry is fresh.
   */
  lastModified: number;
};

export type PageCacheStoredEntry = PageCacheEntry & {
  revalidate?: number;
  version?: string;
  /** Set when the entry was too big for the shared store. */
  localOnly?: boolean;
};

export type PageCacheContext = {
  kind?: string;
  cacheControl?: { revalidate?: number };
};

/** A prefetch is not followed by a render, so it must not claim the lock. */
export type PageCacheRequest = { prefetch?: boolean };

export type PageCache = {
  get(
    key: string,
    ctx?: PageCacheContext,
    request?: PageCacheRequest
  ): Promise<PageCacheEntry | null>;
  /** A `null` value deletes the entry, locally and in the shared store. */
  set(
    key: string,
    value: PageCacheValue | null,
    ctx?: PageCacheContext
  ): Promise<void>;
};

export declare const createPageCache: (options: {
  shared?: SharedStore;
  clock: PageCacheClock;
  maxLocalBytes?: number;
}) => PageCache;
