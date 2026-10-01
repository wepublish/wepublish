import type { CreateCacheOptions } from 'cache-manager';
import { Keyv } from 'keyv';
import { LruMap } from './kv-ttl-cache-lru-map';
import {
  deserializeCacheValue,
  serializeCacheValue,
} from './kv-ttl-cache-serializer';

const DEFAULT_TTL_MS = 600000;
const IN_MEMORY_MAX_ENTRIES = 50000;

export function createKvTtlCacheOptions(): CreateCacheOptions {
  const store = new Keyv({ store: new LruMap(IN_MEMORY_MAX_ENTRIES) });
  store.serialize = serializeCacheValue;
  store.deserialize = deserializeCacheValue;

  return { ttl: DEFAULT_TTL_MS, stores: [store] };
}
