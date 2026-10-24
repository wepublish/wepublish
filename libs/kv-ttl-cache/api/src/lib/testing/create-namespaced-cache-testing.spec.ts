import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MemoryDragonflyConnection } from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { NamespacedCache } from '../namespaced/namespaced-cache';
import { NamespaceResets } from '../versions/namespace-resets';
import { createNamespacedCacheTesting } from './create-namespaced-cache-testing';
import { NamespacedCacheTestingModule } from './namespaced-cache-testing.module';

@Injectable()
class Consumer {
  constructor(
    readonly cache: NamespacedCache,
    readonly resets: NamespaceResets
  ) {}
}

@Module({ providers: [Consumer] })
class FeatureModule {}

describe('createNamespacedCacheTesting', () => {
  it('runs over a fresh FakeDragonfly and shares nothing by default', async () => {
    const testing = await createNamespacedCacheTesting();
    const loader = vi.fn().mockResolvedValue({ id: 'n1' });

    await testing.cache.getOrLoadNs('navigations', 'main', loader, 60);
    await testing.cache.getOrLoadNs('navigations', 'main', loader, 60);

    expect(testing.connection).toBeInstanceOf(FakeDragonfly);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(
      (testing.connection as FakeDragonfly).commands.filter(
        ([command, key]) =>
          command === 'SET' && !key.startsWith('nsv:') && key !== 'health'
      )
    ).toEqual([]);
    await testing.close();
  });

  it.each([
    ['{"id":"a"}'],
    ['[1,2]'],
    ['42'],
    [':starts-with-a-colon'],
    ['plain text'],
  ])('gives back the string %j unchanged', async value => {
    const testing = await createNamespacedCacheTesting({
      sharedNamespaces: ['navigations'],
    });
    const other = await createNamespacedCacheTesting({
      connection: testing.connection,
      sharedNamespaces: ['navigations'],
    });

    await testing.cache.setNs('navigations', 'raw', value, 60);
    await testing.cache.setNs('auth:sessions', 'raw', value, 60);

    await expect(testing.cache.getNs('navigations', 'raw')).resolves.toBe(
      value
    );
    await expect(testing.cache.getNs('auth:sessions', 'raw')).resolves.toBe(
      value
    );
    await expect(other.cache.getNs('navigations', 'raw')).resolves.toBe(value);
    await Promise.all([testing.close(), other.close()]);
  });

  it('lets replicas share values and resets through one connection', async () => {
    const dragonfly = new FakeDragonfly();
    const first = await createNamespacedCacheTesting({
      connection: dragonfly,
      sharedNamespaces: ['navigations'],
    });
    const second = await createNamespacedCacheTesting({
      connection: dragonfly,
      sharedNamespaces: ['navigations'],
    });

    await first.cache.setNs('navigations', 'main', { id: 'n1' }, 60);
    await expect(second.cache.getNs('navigations', 'main')).resolves.toEqual({
      id: 'n1',
    });

    await first.resets.reset('navigations');
    await expect(second.versions.peekShared('navigations')).resolves.toBe(
      await first.versions.current('navigations')
    );
    await Promise.all([first.close(), second.close()]);
  });

  it('runs without Dragonfly when given a memory connection', async () => {
    const testing = await createNamespacedCacheTesting({
      connection: new MemoryDragonflyConnection(),
      sharedNamespaces: ['navigations'],
    });
    const loader = vi.fn().mockResolvedValue('loaded');

    await testing.cache.getOrLoadNs('navigations', 'main', loader, 60);
    await testing.cache.getOrLoadNs('navigations', 'main', loader, 60);

    expect(loader).toHaveBeenCalledTimes(1);
    await testing.close();
  });

  it('can be imported by a spec that builds its own testing module', async () => {
    const module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({
          sharedNamespaces: ['navigations'],
        }),
        FeatureModule,
      ],
    }).compile();
    const consumer = module.get(Consumer);

    await expect(
      consumer.cache.getOrLoadNs('navigations', 'main', () => 'nav', 60)
    ).resolves.toBe('nav');
    expect(consumer.resets.listenerCount()).toBe(0);
    await module.close();
  });
});
