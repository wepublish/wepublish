import { Injectable, Logger, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { DragonflyModule, type DragonflyEnv } from '@wepublish/dragonfly/api';
import {
  DragonflyTestingModule,
  FakeDragonfly,
} from '@wepublish/dragonfly/api/testing';
import { prismaDecimalCodec } from '../../prisma';
import { KvCacheModule } from '../store/kv-cache.module';
import { CatchUpScheduler } from '../versions/catch-up-scheduler';
import { NamespaceResets } from '../versions/namespace-resets';
import { NamespaceVersions } from '../versions/namespace-versions';
import { NamespacedCache } from './namespaced-cache';
import {
  assertShareableNamespaces,
  NamespacedCacheModule,
} from './namespaced-cache.module';

@Injectable()
class Consumer {
  constructor(
    readonly cache: NamespacedCache,
    readonly resets: NamespaceResets,
    readonly versions: NamespaceVersions,
    readonly catchUp: CatchUpScheduler
  ) {}
}

@Module({ providers: [Consumer] })
class FeatureModule {}

const valueWrites = (dragonfly: FakeDragonfly) =>
  dragonfly.commands.filter(
    ([command, key]) =>
      command === 'SET' && !key.startsWith('nsv:') && key !== 'health'
  );

describe('NamespacedCacheModule', () => {
  const modules: TestingModule[] = [];

  const compileOver = async (
    dragonfly: FakeDragonfly,
    sharedNamespaces?: string[]
  ) => {
    const module = await Test.createTestingModule({
      imports: [
        DragonflyTestingModule.forRoot({ connection: dragonfly }),
        KvCacheModule.forRoot({ codec: prismaDecimalCodec }),
        NamespacedCacheModule.forRoot({ sharedNamespaces }),
        FeatureModule,
      ],
    }).compile();
    modules.push(module);

    return module.get(Consumer);
  };

  const compileFromEnv = async (env: DragonflyEnv) => {
    const module = await Test.createTestingModule({
      imports: [
        DragonflyModule.forRoot({ env }),
        KvCacheModule.forRoot({ codec: prismaDecimalCodec }),
        NamespacedCacheModule.forRoot(),
        FeatureModule,
      ],
    }).compile();
    modules.push(module);
    await module.init();

    return module.get(Consumer);
  };

  afterEach(async () => {
    await Promise.all(modules.splice(0).map(module => module.close()));
    vi.restoreAllMocks();
  });

  describe('assertShareableNamespaces', () => {
    it('accepts a list without integration settings', () => {
      expect(() =>
        assertShareableNamespaces([
          'settings',
          'navigations',
          'graphql:comments',
        ])
      ).not.toThrow();
    });

    it('refuses to share any integration settings namespace', () => {
      expect(() =>
        assertShareableNamespaces(['navigations', 'settings:newprovider'])
      ).toThrow('settings:newprovider');
    });

    it('refuses a namespace listed twice', () => {
      expect(() =>
        assertShareableNamespaces(['navigations', 'banners', 'navigations'])
      ).toThrow('navigations');
    });
  });

  it('refuses to share integration settings through its options', () => {
    expect(() =>
      NamespacedCacheModule.forRoot({
        sharedNamespaces: ['settings:paymentprovider'],
      })
    ).toThrow('Integration settings must never be stored in Dragonfly');
  });

  it('gives every module the cache, its resets, versions and catch-up scheduler', async () => {
    const consumer = await compileOver(new FakeDragonfly());

    expect(consumer.cache).toBeInstanceOf(NamespacedCache);
    expect(consumer.resets).toBeInstanceOf(NamespaceResets);
    expect(consumer.versions).toBeInstanceOf(NamespaceVersions);
    expect(consumer.catchUp).toBeInstanceOf(CatchUpScheduler);
  });

  it('shares a listed namespace and keeps a namespace nobody listed on the replica', async () => {
    const dragonfly = new FakeDragonfly();
    const first = await compileOver(dragonfly, ['navigations']);
    const second = await compileOver(dragonfly, ['navigations']);
    const loader = vi.fn().mockResolvedValue({ id: 'x' });

    await first.cache.getOrLoadNs('navigations', 'main', loader, 60);
    await first.cache.getOrLoadNs('some-new-integration', 'a', loader, 60);
    await second.cache.getOrLoadNs('navigations', 'main', loader, 60);
    await second.cache.getOrLoadNs('some-new-integration', 'a', loader, 60);

    expect(loader).toHaveBeenCalledTimes(3);
    expect(valueWrites(dragonfly)).toHaveLength(1);
    expect(valueWrites(dragonfly)[0][1]).toContain('ns:navigations:');
  });

  it('keeps decimals of cached values usable across replicas', async () => {
    const dragonfly = new FakeDragonfly();
    const first = await compileOver(dragonfly, ['settings']);
    const second = await compileOver(dragonfly, ['settings']);

    await first.cache.setNs(
      'settings',
      'payrexx',
      { vat: new Prisma.Decimal('0.081') },
      60
    );
    const cached = await second.cache.getNs<{ vat: Prisma.Decimal }>(
      'settings',
      'payrexx'
    );

    expect(Prisma.Decimal.isDecimal(cached?.vat)).toBe(true);
    expect(cached?.vat.toString()).toBe('0.081');
  });

  it('caches in memory when REDIS_URL is not set', async () => {
    const consumer = await compileFromEnv({});
    const loader = vi.fn().mockResolvedValue('loaded');

    await consumer.cache.getOrLoadNs('settings', 'stripe', loader, 60);
    const second = await consumer.cache.getOrLoadNs(
      'settings',
      'stripe',
      loader,
      60
    );

    expect(second).toBe('loaded');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('keeps serving cached values while Dragonfly is unreachable and logs it', async () => {
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const consumer = await compileFromEnv({
      REDIS_URL: 'redis://wepublish-test:secret@127.0.0.1:1/0',
      REDIS_KEY_PREFIX: 'wepublish-test',
    });
    const loader = vi.fn().mockResolvedValue('loaded');
    const startedAt = Date.now();

    await expect(
      consumer.cache.getOrLoadNs('settings', 'stripe', loader, 60)
    ).resolves.toBe('loaded');
    await expect(
      consumer.cache.getOrLoadNs('settings', 'stripe', loader, 60)
    ).resolves.toBe('loaded');

    expect(loader).toHaveBeenCalledTimes(1);
    expect(Date.now() - startedAt).toBeLessThan(500);
    expect(logged).toHaveBeenCalled();
  });
});
