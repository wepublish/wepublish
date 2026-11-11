/**
 * Types for `shared-store.js` — the Dragonfly/Redis half of the page cache.
 *
 * See `page-cache.d.ts` for why these declarations are hand-written.
 *
 * Every read returns `undefined` when the store is unreachable, which the
 * caller must treat as "no answer" rather than "no entry": the cache then
 * falls back to its own pod-local copy instead of discarding it.
 */
import type { PageCacheStoredEntry } from './page-cache';

export type SharedStore = {
  /** The `website:pages` namespace version, or `undefined` if unreachable. */
  getVersion(): Promise<string | null | undefined>;
  getVersions(names: string[]): Promise<(string | null)[] | undefined>;
  getEntry(path: string): Promise<PageCacheStoredEntry | null | undefined>;
  /** `false` when the entry was too large to share. */
  setEntry(path: string, entry: PageCacheStoredEntry): Promise<boolean>;
  deleteEntry(path: string): Promise<void>;
  acquireLock(path: string): Promise<boolean>;
  lockedSince(path: string): Promise<number | undefined>;
  releaseLock(path: string): Promise<void>;
};

/**
 * Returns `undefined` — meaning "cache on this pod only" — when `REDIS_URL`
 * is unset, when `REDIS_KEY_PREFIX` is missing, or when the TLS configuration
 * is not safe to use. It never throws.
 */
export declare const createSharedStore: (options: {
  env: Record<string, string | undefined>;
  buildId: string;
  createClient?: (options: unknown) => unknown;
  logger?: Pick<Console, 'error'>;
}) => SharedStore | undefined;
