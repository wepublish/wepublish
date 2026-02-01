import { KvTtlCacheService } from './kv-ttl-cache.service';

export function createKvMock(): KvTtlCacheService {
  const store = new Map<string, unknown>();

  return {
    async setNs(ns: string, key: string, value: any) {
      const k = `${ns}:${key}`;
      store.set(k, typeof value === 'string' ? JSON.parse(value) : value);
    },

    async getOrLoadNs<T>(
      ns: string,
      key: string,
      load: () => Promise<T> | T,
      _ttlSeconds: number
    ): Promise<T> {
      const k = `${ns}:${key}`;
      if (store.has(k)) return store.get(k) as T;

      const loaded = await load();
      store.set(k, loaded as unknown);
      return loaded;
    },
  } as unknown as KvTtlCacheService;
}
