import { DistributedLocks } from './distributed-locks';
import { DragonflyConnection } from './dragonfly-connection';
import { type HeldLock } from './held-lock';
import { MemoryDragonflyConnection } from './memory-dragonfly-connection';
import { FakeDragonfly } from './testing/fake-dragonfly';

const TTL_MS = 120_000;

const createReplica = (connection: DragonflyConnection) =>
  new DistributedLocks(connection);

const statusOf = async (connection: DragonflyConnection, name: string) =>
  (await createReplica(connection).acquire(name, TTL_MS)).status;

const lockOn = async (connection: DragonflyConnection): Promise<HeldLock> => {
  const result = await createReplica(connection).acquire(
    'periodic-job-run',
    TTL_MS
  );

  if (result.status !== 'acquired') {
    throw new Error(`Expected to acquire the lock, got ${result.status}`);
  }

  return result.lock;
};

describe('DistributedLocks', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets exactly one replica hold the lock', async () => {
    const dragonfly = new FakeDragonfly();

    const lock = await lockOn(dragonfly);

    expect(lock.lost).toBe(false);
    await expect(statusOf(dragonfly, 'periodic-job-run')).resolves.toBe(
      'taken'
    );
  });

  it('keeps the locks of different jobs apart', async () => {
    const dragonfly = new FakeDragonfly();

    await lockOn(dragonfly);

    await expect(statusOf(dragonfly, 'other-job')).resolves.toBe('acquired');
  });

  it('frees the lock on release, so the next run can start right away', async () => {
    const dragonfly = new FakeDragonfly();

    await (await lockOn(dragonfly)).release();

    await expect(statusOf(dragonfly, 'periodic-job-run')).resolves.toBe(
      'acquired'
    );
  });

  it('keeps the lock as long as its holder runs, far beyond its time to live', async () => {
    const dragonfly = new FakeDragonfly();
    const lock = await lockOn(dragonfly);

    await vi.advanceTimersByTimeAsync(10 * TTL_MS);

    expect(lock.lost).toBe(false);
    await expect(statusOf(dragonfly, 'periodic-job-run')).resolves.toBe(
      'taken'
    );
  });

  it('frees the lock shortly after its holder died', async () => {
    const dragonfly = new FakeDragonfly();
    await lockOn(dragonfly);

    vi.clearAllTimers();
    await vi.advanceTimersByTimeAsync(TTL_MS + 1);

    await expect(statusOf(dragonfly, 'periodic-job-run')).resolves.toBe(
      'acquired'
    );
  });

  it('never frees a lock another replica holds by now', async () => {
    const dragonfly = new FakeDragonfly();
    const stale = await lockOn(dragonfly);
    vi.clearAllTimers();
    await vi.advanceTimersByTimeAsync(TTL_MS + 1);
    await lockOn(dragonfly);

    await stale.release();

    await expect(statusOf(dragonfly, 'periodic-job-run')).resolves.toBe(
      'taken'
    );
  });

  it('notices when another replica took over its lock', async () => {
    const dragonfly = new FakeDragonfly();
    const lock = await lockOn(dragonfly);
    await dragonfly.del(['lock:periodic-job-run']);
    await lockOn(dragonfly);

    await vi.advanceTimersByTimeAsync(TTL_MS / 4);

    expect(lock.lost).toBe(true);
  });

  it('takes its lock back when it ran out while nobody else took it', async () => {
    const dragonfly = new FakeDragonfly();
    const lock = await lockOn(dragonfly);
    await dragonfly.del(['lock:periodic-job-run']);

    await vi.advanceTimersByTimeAsync(TTL_MS / 4);

    expect(lock.lost).toBe(false);
    await expect(statusOf(dragonfly, 'periodic-job-run')).resolves.toBe(
      'taken'
    );
  });

  it('keeps its lock through a short Dragonfly outage', async () => {
    const dragonfly = new FakeDragonfly();
    const lock = await lockOn(dragonfly);

    dragonfly.down();
    await vi.advanceTimersByTimeAsync(TTL_MS / 2);
    dragonfly.up();
    await vi.advanceTimersByTimeAsync(TTL_MS / 4);

    expect(lock.lost).toBe(false);
    await expect(statusOf(dragonfly, 'periodic-job-run')).resolves.toBe(
      'taken'
    );
  });

  it('renews with GET and PEXPIRE only', async () => {
    const dragonfly = new FakeDragonfly();
    await lockOn(dragonfly);
    dragonfly.commands.length = 0;

    await vi.advanceTimersByTimeAsync(TTL_MS / 4);

    expect(dragonfly.commands).toEqual([
      ['GET', 'lock:periodic-job-run'],
      ['PEXPIRE', 'lock:periodic-job-run', String(TTL_MS)],
    ]);
  });

  it('cannot tell without Dragonfly or while it is unreachable', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.down();

    await expect(
      statusOf(new MemoryDragonflyConnection(), 'periodic-job-run')
    ).resolves.toBe('not-configured');
    await expect(statusOf(dragonfly, 'periodic-job-run')).resolves.toBe(
      'unavailable'
    );
  });

  it('tells every replica whether the lock is held', async () => {
    const dragonfly = new FakeDragonfly();
    const replica = createReplica(dragonfly);

    await expect(replica.isLocked('periodic-job-run')).resolves.toBe(false);
    const lock = await lockOn(dragonfly);
    await expect(replica.isLocked('periodic-job-run')).resolves.toBe(true);
    await lock.release();
    await expect(replica.isLocked('periodic-job-run')).resolves.toBe(false);
  });

  it('tells apart having no Dragonfly and not reaching it', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.down();

    await expect(
      createReplica(new MemoryDragonflyConnection()).isLocked(
        'periodic-job-run'
      )
    ).resolves.toBe('not-configured');
    await expect(
      createReplica(dragonfly).isLocked('periodic-job-run')
    ).resolves.toBe('unavailable');
  });
});
