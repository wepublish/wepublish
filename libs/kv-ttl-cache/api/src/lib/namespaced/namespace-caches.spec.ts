import {
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { createCache } from 'cache-manager';
import { NamespaceCaches } from './namespace-caches';

const createCaches = (
  connection: DragonflyConnection = new FakeDragonfly(),
  names: string[] = ['navigations', 'content:articles']
) => {
  const shared = createCache();
  const local = createCache();

  return {
    shared,
    local,
    caches: new NamespaceCaches(shared, local, new Set(names), connection),
  };
};

describe('NamespaceCaches', () => {
  it('shares a listed namespace through the shared cache', () => {
    const { shared, caches } = createCaches();

    expect(caches.isShared('navigations')).toBe(true);
    expect(caches.cacheFor('navigations')).toBe(shared);
  });

  it.each([
    'some-new-integration',
    'auth:sessions',
    'settings:paymentprovider',
  ])('keeps %s, which nobody listed, on this replica', namespace => {
    const { local, caches } = createCaches();

    expect(caches.isShared(namespace)).toBe(false);
    expect(caches.cacheFor(namespace)).toBe(local);
  });

  it('shares nothing without Dragonfly', () => {
    const { local, caches } = createCaches(new MemoryDragonflyConnection());

    expect(caches.isShared('navigations')).toBe(false);
    expect(caches.cacheFor('navigations')).toBe(local);
  });
});
