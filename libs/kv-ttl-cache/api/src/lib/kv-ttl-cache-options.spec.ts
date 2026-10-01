import { Keyv } from 'keyv';
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
});
