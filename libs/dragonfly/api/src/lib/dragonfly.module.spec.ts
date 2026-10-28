import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DistributedClaims } from './distributed-claims';
import { DistributedCounters } from './distributed-counters';
import { DistributedLocks } from './distributed-locks';
import { DragonflyConnection } from './dragonfly-connection';
import { DragonflyHealth } from './dragonfly-health';
import {
  DRAGONFLY_OPTIONS,
  type DragonflyEnv,
  RELEASE_ID,
} from './dragonfly-options';
import { DragonflyModule } from './dragonfly.module';
import { MemoryDragonflyConnection } from './memory-dragonfly-connection';
import { RedisDragonflyConnection } from './redis-dragonfly-connection';

@Injectable()
class Consumer {
  constructor(
    readonly connection: DragonflyConnection,
    readonly health: DragonflyHealth,
    readonly claims: DistributedClaims,
    readonly locks: DistributedLocks,
    readonly counters: DistributedCounters
  ) {}
}

@Module({ providers: [Consumer] })
class FeatureModule {}

describe('DragonflyModule', () => {
  const originalEnv = { ...process.env };
  let module: TestingModule | undefined;

  const compile = async (env?: DragonflyEnv) => {
    module = await Test.createTestingModule({
      imports: [DragonflyModule.forRoot(env ? { env } : {}), FeatureModule],
    }).compile();

    return module;
  };

  afterEach(async () => {
    await module?.close();
    module = undefined;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('does not see the REDIS_URL that nx loads from .env', () => {
    expect(originalEnv['REDIS_URL']).toBeUndefined();
    expect(originalEnv['REDIS_KEY_PREFIX']).toBeUndefined();
  });

  it('stays in memory when REDIS_URL is not set', async () => {
    delete process.env['REDIS_URL'];
    delete process.env['REDIS_KEY_PREFIX'];

    const compiled = await compile();

    expect(compiled.get(DragonflyConnection)).toBeInstanceOf(
      MemoryDragonflyConnection
    );
  });

  it('reads the environment it is given instead of process.env', async () => {
    process.env['REDIS_URL'] = 'redis://wepublish-test:secret@127.0.0.1:1/0';
    process.env['REDIS_KEY_PREFIX'] = 'wepublish-test';

    const compiled = await compile({ APP_RELEASE_ID: '2026.10.1' });

    expect(compiled.get(DragonflyConnection)).toBeInstanceOf(
      MemoryDragonflyConnection
    );
    expect(compiled.get(RELEASE_ID)).toBe('2026.10.1');
    expect(compiled.get(DRAGONFLY_OPTIONS)).toMatchObject({
      releaseId: '2026.10.1',
      production: false,
    });
  });

  it('gives every module the one connection and what is built on it', async () => {
    const compiled = await compile({});
    const consumer = compiled.get(Consumer);

    expect(consumer.connection).toBe(compiled.get(DragonflyConnection));
    expect(consumer.health).toBeInstanceOf(DragonflyHealth);
    expect(consumer.claims).toBeInstanceOf(DistributedClaims);
    expect(consumer.locks).toBeInstanceOf(DistributedLocks);
    expect(consumer.counters).toBeInstanceOf(DistributedCounters);
  });

  it('refuses a REDIS_URL without a REDIS_KEY_PREFIX at boot', async () => {
    await expect(
      compile({ REDIS_URL: 'redis://wepublish-test:secret@127.0.0.1:1/0' })
    ).rejects.toThrow('REDIS_KEY_PREFIX');
  });

  it('closes the connection to Dragonfly when the application shuts down', async () => {
    const closed = vi.spyOn(RedisDragonflyConnection.prototype, 'close');
    const compiled = await compile({
      REDIS_URL: 'redis://wepublish-test:secret@127.0.0.1:1/0',
      REDIS_KEY_PREFIX: 'wepublish-test',
    });

    expect(compiled.get(DragonflyConnection)).toBeInstanceOf(
      RedisDragonflyConnection
    );

    await compiled.close();
    module = undefined;

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
