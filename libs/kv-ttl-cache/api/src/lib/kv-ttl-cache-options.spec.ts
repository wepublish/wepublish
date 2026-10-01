import { Keyv } from 'keyv';
import { createCache } from 'cache-manager';
import { createKvTtlCacheOptions } from './kv-ttl-cache-options';
import { LruMap } from './kv-ttl-cache-lru-map';

describe('createKvTtlCacheOptions', () => {
  it('keeps values in a bounded in-memory store', () => {
    const options = createKvTtlCacheOptions();
    const [store] = options.stores as Keyv[];

    expect(options.ttl).toBe(600000);
    expect(store.store).toBeInstanceOf(LruMap);
    expect((store.store as LruMap<string, unknown>).maxSize).toBe(50000);
  });

  it('keeps dates and hands out copies of cached values', async () => {
    const cache = createCache(createKvTtlCacheOptions());
    const value = { expiresAt: new Date('2030-01-01T00:00:00.000Z') };

    await cache.set('session', value, 60000);
    const first = await cache.get<typeof value>('session');
    const second = await cache.get<typeof value>('session');

    expect(first?.expiresAt).toBeInstanceOf(Date);
    expect(first).toEqual(value);
    expect(first).not.toBe(second);
  });
});
