import { Inject, Injectable, Module, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DragonflyTestingModule,
  FakeDragonfly,
} from '@wepublish/dragonfly/api/testing';
import type { Cache } from 'cache-manager';
import { type CacheProfile } from './cache-profile';
import { KvCacheModule } from './kv-cache.module';

const ANSWERS = Symbol('ANSWERS');
const LINKS = Symbol('LINKS');

const ANSWERS_PROFILE: CacheProfile = {
  name: 'answers',
  shared: true,
  keyPrefix: 'answers:',
};
const LINKS_PROFILE: CacheProfile = {
  name: 'links',
  shared: true,
  scope: 'global',
  keyPrefix: 'links:',
};

@Injectable()
class Consumer {
  constructor(
    @Inject(ANSWERS) readonly answers: Cache,
    @Inject(LINKS) readonly links: Cache,
    @Optional() @Inject(CACHE_MANAGER) readonly cacheManager?: Cache
  ) {}
}

@Module({
  imports: [
    KvCacheModule.forFeature(ANSWERS, ANSWERS_PROFILE),
    KvCacheModule.forFeature(LINKS, LINKS_PROFILE),
  ],
  providers: [Consumer],
})
class FeatureModule {}

describe('KvCacheModule', () => {
  const modules: TestingModule[] = [];

  const replica = async (fake: FakeDragonfly) => {
    const module = await Test.createTestingModule({
      imports: [
        DragonflyTestingModule.forRoot({ connection: fake }),
        KvCacheModule.forRoot(),
        FeatureModule,
      ],
    }).compile();

    modules.push(module);

    return module.get(Consumer);
  };

  afterEach(async () => {
    await Promise.all(modules.splice(0).map(module => module.close()));
  });

  it('gives every profile its own cache under its own token', async () => {
    const consumer = await replica(new FakeDragonfly());

    expect(consumer.answers).toBeDefined();
    expect(consumer.links).toBeDefined();
    expect(consumer.answers).not.toBe(consumer.links);
  });

  it('keeps CACHE_MANAGER out of reach of the modules that import a profile', async () => {
    const consumer = await replica(new FakeDragonfly());

    expect(consumer.cacheManager).toBeUndefined();
  });

  it('keeps the values of two profiles with the same key apart', async () => {
    const consumer = await replica(new FakeDragonfly());

    await consumer.answers.set('x', { from: 'answers' }, 60000);
    await consumer.links.set('x', { from: 'links' }, 60000);

    await expect(consumer.answers.get('x')).resolves.toEqual({
      from: 'answers',
    });
    await expect(consumer.links.get('x')).resolves.toEqual({ from: 'links' });
  });

  it('refuses two profiles with the same name', async () => {
    const SECOND = Symbol('SECOND');

    await expect(
      Test.createTestingModule({
        imports: [
          DragonflyTestingModule.forRoot(),
          KvCacheModule.forRoot(),
          KvCacheModule.forFeature(ANSWERS, ANSWERS_PROFILE),
          KvCacheModule.forFeature(SECOND, { ...ANSWERS_PROFILE }),
        ],
      }).compile()
    ).rejects.toThrow('answers');
  });

  it('reads a batch another replica stored with one MGET', async () => {
    const fake = new FakeDragonfly();
    const writer = await replica(fake);
    const reader = await replica(fake);

    await writer.answers.mset([
      { key: 'a', value: { id: 'a' }, ttl: 60000 },
      { key: 'b', value: { id: 'b' }, ttl: 60000 },
    ]);
    fake.commands.length = 0;

    await expect(reader.answers.mget(['a', 'b', 'c'])).resolves.toEqual([
      { id: 'a' },
      { id: 'b' },
      undefined,
    ]);
    expect(fake.commands.map(([command]) => command)).toEqual(['MGET']);
  });

  it('deletes a batch through the cache with one DEL per key', async () => {
    const fake = new FakeDragonfly();
    const writer = await replica(fake);
    const reader = await replica(fake);

    await writer.answers.mset([
      { key: 'a', value: { id: 'a' }, ttl: 60000 },
      { key: 'b', value: { id: 'b' }, ttl: 60000 },
    ]);
    fake.commands.length = 0;

    await expect(writer.answers.mdel(['a', 'b'])).resolves.toBe(true);

    expect(fake.commands).toEqual([
      ['DEL', 'val:dev:answers:a'],
      ['DEL', 'val:dev:answers:b'],
    ]);
    await expect(reader.answers.mget(['a', 'b'])).resolves.toEqual([
      undefined,
      undefined,
    ]);
  });

  it('rejects a clear through the cache and keeps the values', async () => {
    const consumer = await replica(new FakeDragonfly());

    await consumer.answers.set('a', { id: 'a' }, 60000);

    await expect(consumer.answers.clear()).rejects.toThrow('cannot clear');
    await expect(consumer.answers.get('a')).resolves.toEqual({ id: 'a' });
  });
});
