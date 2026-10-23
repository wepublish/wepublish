import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCache } from 'cache-manager';
import {
  KvTtlCacheService,
  MemoryAtomicStore,
} from '@wepublish/kv-ttl-cache/api/core';
import {
  LINK_CACHE_CONFIG,
  LinkCache,
  MISSING_LINK_TTL,
  REJECTED_VARIANT_TTL,
} from './link-cache';

class SharedStore extends MemoryAtomicStore {
  override readonly shared = true;
}

const replica = (store: SharedStore) =>
  new LinkCache(new KvTtlCacheService(createCache(), store, LINK_CACHE_CONFIG));

const link = { uri: 'images/1', exists: true };
const missing = { uri: 'images/fallback/{}', exists: false };

describe('LinkCache', () => {
  const originalRelease = process.env['APP_RELEASE_ID'];

  afterEach(() => {
    process.env['APP_RELEASE_ID'] = originalRelease;
    vi.useRealTimers();
  });

  it('serves a link that another replica stored', async () => {
    const store = new SharedStore();

    await replica(store).set('image', link);

    expect(await replica(store).get('image')).toEqual(link);
  });

  it('keeps links when a new release starts', async () => {
    const store = new SharedStore();
    process.env['APP_RELEASE_ID'] = 'release-1';
    await replica(store).set('image', link);

    process.env['APP_RELEASE_ID'] = 'release-2';

    expect(await replica(store).get('image')).toEqual(link);
  });

  it('keeps missing links on the replica that saw them', async () => {
    const store = new SharedStore();
    const cache = replica(store);

    await cache.set('image', missing, MISSING_LINK_TTL);

    expect(await cache.get('image')).toEqual(missing);
    expect(await replica(store).get('image')).toBeUndefined();
  });

  it('drops a missing link after four hours', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const cache = replica(new SharedStore());

    await cache.set('image', missing, MISSING_LINK_TTL);
    vi.advanceTimersByTime(MISSING_LINK_TTL + 1);

    expect(await cache.get('image')).toBeUndefined();
  });

  it('serves a link once the object it was missing for exists', async () => {
    const cache = replica(new SharedStore());

    await cache.set('image', missing, MISSING_LINK_TTL);
    await cache.set('image', link);

    expect(await cache.get('image')).toEqual(link);
  });

  it('stores any link under a key of fixed length', async () => {
    const store = new SharedStore();
    const writes = vi.spyOn(store, 'setRaw');
    const cache = replica(store);

    await cache.set('a', link);
    await cache.set('b'.repeat(10_000), link);

    const [short, long] = writes.mock.calls
      .map(([key]) => key)
      .filter(key => key.startsWith('val:'));
    expect(short.length).toBeLessThan(200);
    expect(long).toHaveLength(short.length);
  });

  it('shares a rejected variant between replicas', async () => {
    const store = new SharedStore();

    await replica(store).reject('image', 'Transformation exceeds pixel limit!');

    expect(await replica(store).rejection('image')).toBe(
      'Transformation exceeds pixel limit!'
    );
  });

  it('checks a rejected variant again when a new release starts', async () => {
    const store = new SharedStore();
    process.env['APP_RELEASE_ID'] = 'release-1';
    await replica(store).reject('image', 'Transformation exceeds pixel limit!');

    process.env['APP_RELEASE_ID'] = 'release-2';

    expect(await replica(store).rejection('image')).toBeUndefined();
  });

  it('forgets a rejected variant after an hour', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const cache = replica(new SharedStore());

    await cache.reject('image', 'Transformation exceeds pixel limit!');
    vi.advanceTimersByTime(REJECTED_VARIANT_TTL + 1);

    expect(await cache.rejection('image')).toBeUndefined();
  });
});
