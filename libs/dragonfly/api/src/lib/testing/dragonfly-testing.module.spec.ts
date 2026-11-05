import { Test } from '@nestjs/testing';
import { DistributedClaims } from '../distributed-claims';
import { DistributedCounters } from '../distributed-counters';
import { DistributedLocks } from '../distributed-locks';
import { DragonflyConnection } from '../dragonfly-connection';
import { DragonflyHealth } from '../dragonfly-health';
import { DRAGONFLY_OPTIONS, RELEASE_ID } from '../dragonfly-options';
import { MemoryDragonflyConnection } from '../memory-dragonfly-connection';
import { DragonflyTestingModule } from './dragonfly-testing.module';
import { FakeDragonfly } from './fake-dragonfly';

describe('DragonflyTestingModule', () => {
  it('runs over a fresh FakeDragonfly by default', async () => {
    const module = await Test.createTestingModule({
      imports: [DragonflyTestingModule.forRoot()],
    }).compile();

    expect(module.get(DragonflyConnection)).toBeInstanceOf(FakeDragonfly);
    expect(module.get(RELEASE_ID)).toBe('dev');
    expect(module.get(DRAGONFLY_OPTIONS)).toMatchObject({
      production: false,
      releaseId: 'dev',
    });
    expect(module.get(DragonflyHealth)).toBeInstanceOf(DragonflyHealth);
    expect(module.get(DistributedClaims)).toBeInstanceOf(DistributedClaims);
    expect(module.get(DistributedLocks)).toBeInstanceOf(DistributedLocks);
    expect(module.get(DistributedCounters)).toBeInstanceOf(DistributedCounters);
    await module.close();
  });

  it('lets several replicas share the connection and release they are given', async () => {
    const dragonfly = new FakeDragonfly();
    const replica = () =>
      Test.createTestingModule({
        imports: [
          DragonflyTestingModule.forRoot({
            connection: dragonfly,
            releaseId: '2026.10.1',
          }),
        ],
      }).compile();
    const [a, b] = await Promise.all([replica(), replica()]);

    await expect(
      a.get(DistributedClaims).claim('nightly-job', 60_000)
    ).resolves.toBe('claimed');
    await expect(
      b.get(DistributedClaims).claim('nightly-job', 60_000)
    ).resolves.toBe('taken');
    expect(b.get(RELEASE_ID)).toBe('2026.10.1');

    await a.close();
    await expect(
      b.get(DragonflyConnection).get('lock:nightly-job')
    ).resolves.toMatchObject({ ok: true });
    await b.close();
  });

  it('runs without Dragonfly when given a memory connection', async () => {
    const module = await Test.createTestingModule({
      imports: [
        DragonflyTestingModule.forRoot({
          connection: new MemoryDragonflyConnection(),
        }),
      ],
    }).compile();

    await expect(
      module.get(DistributedClaims).claim('nightly-job', 60_000)
    ).resolves.toBe('not-configured');
    await module.close();
  });
});
