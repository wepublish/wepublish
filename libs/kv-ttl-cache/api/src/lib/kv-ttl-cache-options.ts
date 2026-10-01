import type { CreateCacheOptions } from 'cache-manager';
import { Keyv } from 'keyv';
import { LruMap } from './kv-ttl-cache-lru-map';

const DEFAULT_TTL_MS = 600000;
const IN_MEMORY_MAX_ENTRIES = 50000;

export function createKvTtlCacheOptions(): CreateCacheOptions {
  return {
    ttl: DEFAULT_TTL_MS,
    stores: [new Keyv({ store: new LruMap(IN_MEMORY_MAX_ENTRIES) })],
  };
}
