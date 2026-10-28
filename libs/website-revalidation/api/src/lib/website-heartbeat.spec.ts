import { Test, type TestingModule } from '@nestjs/testing';
import {
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { WebsiteRevalidationModule } from './website-revalidation.module';

const START = new Date('2026-10-02T10:00:00.000Z').getTime();

const read = async (connection: DragonflyConnection, key: string) => {
  const reply = await connection.get(key);

  return reply.ok ? reply.value : undefined;
};

describe('WebsiteHeartbeat', () => {
  let module: TestingModule | undefined;

  const start = async (connection: DragonflyConnection) => {
    module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({ connection }),
        WebsiteRevalidationModule,
      ],
    }).compile();
    await module.init();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(async () => {
    await module?.close();
    module = undefined;
    vi.useRealTimers();
  });

  it('keeps telling the websites that an api writes their page versions', async () => {
    const dragonfly = new FakeDragonfly();
    await start(dragonfly);

    await vi.advanceTimersByTimeAsync(5_000);
    await expect(read(dragonfly, 'website:heartbeat')).resolves.toEqual(
      expect.any(String)
    );

    await vi.advanceTimersByTimeAsync(180_000);
    await expect(read(dragonfly, 'website:heartbeat')).resolves.toEqual(
      expect.any(String)
    );
  });

  it('lets the heartbeat run out once no api writes page versions, so websites refresh pages on their own', async () => {
    const dragonfly = new FakeDragonfly();
    await start(dragonfly);

    await vi.advanceTimersByTimeAsync(5_000);
    await module?.close();
    await vi.advanceTimersByTimeAsync(61_000);

    await expect(read(dragonfly, 'website:heartbeat')).resolves.toBeNull();
  });

  it('beats at boot, before anything reads a version', async () => {
    const dragonfly = new FakeDragonfly();
    await start(dragonfly);

    await expect(read(dragonfly, 'website:heartbeat')).resolves.toBe(
      String(START)
    );
    expect(dragonfly.commands).toContainEqual([
      'SET',
      'website:heartbeat',
      String(START),
      'PX',
      '60000',
    ]);
  });

  it('beats every twenty seconds', async () => {
    const dragonfly = new FakeDragonfly();
    await start(dragonfly);
    const beats = () =>
      dragonfly.commands.filter(command => command[1] === 'website:heartbeat')
        .length;

    await vi.advanceTimersByTimeAsync(19_999);

    expect(beats()).toBe(1);

    await vi.advanceTimersByTimeAsync(1);

    expect(beats()).toBe(2);
  });

  it('tries again five seconds after a beat that did not reach Dragonfly', async () => {
    const dragonfly = new FakeDragonfly();
    await start(dragonfly);
    const beats = () =>
      dragonfly.commands.filter(command => command[1] === 'website:heartbeat')
        .length;

    dragonfly.rejectNext('SET');
    await vi.advanceTimersByTimeAsync(20_000);

    expect(beats()).toBe(2);

    await vi.advanceTimersByTimeAsync(4_999);

    expect(beats()).toBe(2);

    await vi.advanceTimersByTimeAsync(1);

    expect(beats()).toBe(3);

    await vi.advanceTimersByTimeAsync(19_999);

    expect(beats()).toBe(3);

    await vi.advanceTimersByTimeAsync(1);

    expect(beats()).toBe(4);
  });

  it('writes no heartbeat without Dragonfly', async () => {
    const memory = new MemoryDragonflyConnection();
    await start(memory);

    await vi.advanceTimersByTimeAsync(60_000);

    await expect(read(memory, 'website:heartbeat')).resolves.toBeNull();
  });

  it('does not schedule heartbeats without Dragonfly', async () => {
    await start(new MemoryDragonflyConnection());

    expect(vi.getTimerCount()).toBe(0);
  });
});
