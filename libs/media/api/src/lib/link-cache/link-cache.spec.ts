import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCache } from 'cache-manager';
import {
  BoundedMemoryStore,
  createLinkCacheOptions,
  MISSING_LINK_TTL,
} from './link-cache';

describe('BoundedMemoryStore', () => {
  it('drops the least recently written entry beyond its limit', () => {
    const store = new BoundedMemoryStore(2);

    store.set('a', 1);
    store.set('b', 2);
    store.set('a', 1);
    store.set('c', 3);

    expect([...store.keys()]).toEqual(['a', 'c']);
  });
});

describe('createLinkCacheOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a link for longer than an hour', async () => {
    const cache = createCache(createLinkCacheOptions());

    await cache.set('image', { uri: 'images/1', exists: true });
    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(await cache.get('image')).toEqual({ uri: 'images/1', exists: true });
  });

  it('drops a link after three days', async () => {
    const cache = createCache(createLinkCacheOptions());

    await cache.set('image', { uri: 'images/1', exists: true });
    vi.advanceTimersByTime(3 * 24 * 60 * 60 * 1000 + 1);

    expect(await cache.get('image')).toBeUndefined();
  });

  it('drops a missing link after four hours', async () => {
    const cache = createCache(createLinkCacheOptions());

    await cache.set(
      'image',
      { uri: 'images/1', exists: false },
      MISSING_LINK_TTL
    );
    vi.advanceTimersByTime(4 * 60 * 60 * 1000 + 1);

    expect(await cache.get('image')).toBeUndefined();
  });

  it('keeps a missing link for longer than a minute', async () => {
    const cache = createCache(createLinkCacheOptions());

    await cache.set(
      'image',
      { uri: 'images/1', exists: false },
      MISSING_LINK_TTL
    );
    vi.advanceTimersByTime(60 * 1000);

    expect(await cache.get('image')).toEqual({
      uri: 'images/1',
      exists: false,
    });
  });

  it('holds a bounded number of links', async () => {
    const store = new BoundedMemoryStore(3);
    const cache = createCache(createLinkCacheOptions(store));

    for (let i = 0; i < 10; i++) {
      await cache.set(`image-${i}`, { uri: `images/${i}`, exists: true });
    }

    expect(store.size).toBe(3);
  });
});
