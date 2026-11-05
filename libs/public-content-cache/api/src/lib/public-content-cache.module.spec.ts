import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import type { Cache } from 'cache-manager';
import { GraphqlResponseCachePlugin } from './graphql-response-cache.plugin';
import { PublicContentCacheInvalidator } from './public-content-cache-invalidator';
import { PublicContentCacheModule } from './public-content-cache.module';
import { GRAPHQL_RESPONSES_CACHE } from './public-content-namespaces';
import { PublicContentInvalidatorModule } from './public-content-invalidator.module';

@Module({ imports: [PublicContentInvalidatorModule] })
class FeatureModule {}

@Module({ imports: [PublicContentCacheModule] })
class FirstCachingModule {}

@Module({ imports: [PublicContentCacheModule] })
class SecondCachingModule {}

const layoutChanges = (dragonfly: FakeDragonfly) => () =>
  dragonfly.commands.filter(
    command =>
      command[0] === 'SET' &&
      command[1] === 'nsv:website:layout' &&
      !command.includes('NX')
  ).length;

describe('PublicContentCacheModule', () => {
  it('registers exactly one reset listener', async () => {
    const module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot(),
        PublicContentCacheModule,
        FeatureModule,
      ],
    }).compile();
    await module.init();

    expect(module.get(NamespaceResets).listenerCount()).toBe(1);
    await module.close();
  });

  it('registers exactly one reset listener when several modules import the cache', async () => {
    const dragonfly = new FakeDragonfly();
    const changes = layoutChanges(dragonfly);
    const module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({ connection: dragonfly }),
        PublicContentCacheModule,
        FirstCachingModule,
        SecondCachingModule,
        FeatureModule,
      ],
    }).compile();
    await module.init();
    const resets = module.get(NamespaceResets);

    expect(resets.listenerCount()).toBe(1);

    await resets.reset('navigations');

    expect(changes()).toBe(1);
    await module.close();
  });

  it('provides the plugin, the invalidator and the answer cache', async () => {
    const module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot(),
        PublicContentCacheModule,
      ],
    }).compile();
    await module.init();

    expect(module.get(GraphqlResponseCachePlugin)).toBeInstanceOf(
      GraphqlResponseCachePlugin
    );
    expect(module.get(PublicContentCacheInvalidator)).toBeInstanceOf(
      PublicContentCacheInvalidator
    );
    expect(module.get<Cache>(GRAPHQL_RESPONSES_CACHE).get).toBeTypeOf(
      'function'
    );
    await module.close();
  });

  it('lets a feature module use the invalidator without registering a listener', async () => {
    const module = await Test.createTestingModule({
      imports: [NamespacedCacheTestingModule.forRoot(), FeatureModule],
    }).compile();
    await module.init();

    expect(module.get(PublicContentCacheInvalidator)).toBeInstanceOf(
      PublicContentCacheInvalidator
    );
    expect(module.get(NamespaceResets).listenerCount()).toBe(0);
    await module.close();
  });
});
