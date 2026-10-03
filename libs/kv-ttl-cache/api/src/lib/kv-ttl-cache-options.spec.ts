import { Prisma } from '@prisma/client';
import { Keyv } from 'keyv';
import { createCache } from 'cache-manager';
import { createKvTtlCacheOptions } from './kv-ttl-cache-options';
import { LruMap } from './kv-ttl-cache-lru-map';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

describe('createKvTtlCacheOptions', () => {
  it('keeps values in a bounded in-memory store', () => {
    const options = createKvTtlCacheOptions();
    const [store] = options.stores as Keyv[];

    expect(options.ttl).toBe(600000);
    expect(store.store).toBeInstanceOf(LruMap);
    expect((store.store as LruMap<string, unknown>).maxSize).toBe(50000);
    expect((store.store as LruMap<string, unknown>).maxBytes).toBe(
      32 * 1024 * 1024
    );
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

  it('keeps decimals of cached payment provider settings usable', async () => {
    const cache = createCache(createKvTtlCacheOptions());

    await cache.set(
      'payrexx',
      { payrexx_vatrate: new Prisma.Decimal('0.081') },
      60000
    );
    const first = await cache.get<{ payrexx_vatrate: Prisma.Decimal }>(
      'payrexx'
    );
    const second = await cache.get<{ payrexx_vatrate: Prisma.Decimal }>(
      'payrexx'
    );

    expect(first?.payrexx_vatrate.toNumber()).toBe(0.081);
    expect(second?.payrexx_vatrate.toNumber()).toBe(0.081);
  });

  it.each(['content:articles', 'settings:paymentprovider'])(
    'answers a %s value it cannot store and loads it again next time',
    async namespace => {
      const kv = new KvTtlCacheService(
        createCache(createKvTtlCacheOptions()),
        new FakeDragonfly()
      );
      const loader = vi.fn().mockResolvedValue({ views: BigInt(1) });

      await expect(kv.getOrLoadNs(namespace, 'x', loader, 60)).resolves.toEqual(
        { views: BigInt(1) }
      );
      await kv.getOrLoadNs(namespace, 'x', loader, 60);

      expect(loader).toHaveBeenCalledTimes(2);
    }
  );
});
