import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { createKvTtlCacheOptions } from './kv-ttl-cache-options';
import {
  deserializeCacheValue,
  serializeCacheValue,
} from './kv-ttl-cache-serializer';

describe('createKvTtlCacheOptions', () => {
  it('keeps the in-memory cache when REDIS_URL is not set', () => {
    expect(createKvTtlCacheOptions({})).toEqual({ ttl: 600000 });
  });

  it('refuses a REDIS_URL without a REDIS_KEY_PREFIX', () => {
    expect(() =>
      createKvTtlCacheOptions({ REDIS_URL: 'redis://localhost:6379/0' })
    ).toThrow('REDIS_KEY_PREFIX');
  });

  describe('with REDIS_URL and REDIS_KEY_PREFIX', () => {
    let store: Keyv;

    beforeEach(() => {
      const options = createKvTtlCacheOptions({
        REDIS_URL: 'redis://wepublish-demo-staging:secret@localhost:6379/0',
        REDIS_KEY_PREFIX: 'wepublish-demo-staging',
      });

      expect(options.stores).toHaveLength(1);
      store = (options.stores as Keyv[])[0];
    });

    afterEach(async () => {
      await store.disconnect();
    });

    it('uses a Dragonfly store', () => {
      expect(store).toBeInstanceOf(Keyv);
      expect(store.store).toBeInstanceOf(KeyvRedis);
    });

    it('puts every key under the prefix', () => {
      const adapter = store.store as KeyvRedis<unknown>;

      expect(
        adapter.createKeyPrefix('ns:settings:v1:id', adapter.namespace)
      ).toBe('wepublish-demo-staging::ns:settings:v1:id');
    });

    it('keeps dates when values go through Dragonfly', () => {
      expect(store.serialize).toBe(serializeCacheValue);
      expect(store.deserialize).toBe(deserializeCacheValue);
    });

    it('does not throw or queue commands while Dragonfly is unreachable', () => {
      const adapter = store.store as KeyvRedis<unknown>;

      expect(store.throwOnErrors).toBe(false);
      expect(adapter.throwOnConnectError).toBe(false);
      expect(adapter.client.options?.disableOfflineQueue).toBe(true);
    });
  });
});
