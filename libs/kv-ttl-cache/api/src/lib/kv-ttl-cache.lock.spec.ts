import { createCache } from 'cache-manager';
import { KvLock } from './kv-ttl-cache-lock';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { KvAtomicStore, MemoryAtomicStore } from './kv-ttl-cache-atomic-store';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const TTL_MS = 120_000;

const createReplica = (atomic: KvAtomicStore) =>
  new KvTtlCacheService(createCache(), atomic);

const lockOn = async (dragonfly: KvAtomicStore) =>
  (await createReplica(dragonfly).lock('periodic-job-run', TTL_MS)) as KvLock;

describe('KvTtlCacheService lock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets exactly one replica hold the lock', async () => {
    const dragonfly = new FakeDragonfly();

    const lock = await lockOn(dragonfly);

    expect(lock).toBeInstanceOf(KvLock);
    await expect(
      createReplica(dragonfly).lock('periodic-job-run', TTL_MS)
    ).resolves.toBe(false);
  });

  it('keeps the locks of different jobs apart', async () => {
    const dragonfly = new FakeDragonfly();

    await lockOn(dragonfly);

    await expect(
      createReplica(dragonfly).lock('other-job', TTL_MS)
    ).resolves.toBeInstanceOf(KvLock);
  });

  it('frees the lock on release, so the next run can start right away', async () => {
    const dragonfly = new FakeDragonfly();

    await (await lockOn(dragonfly)).release();

    await expect(lockOn(dragonfly)).resolves.toBeInstanceOf(KvLock);
  });

  it('keeps the lock as long as its holder runs, far beyond its time to live', async () => {
    const dragonfly = new FakeDragonfly();
    const lock = await lockOn(dragonfly);

    await vi.advanceTimersByTimeAsync(10 * TTL_MS);

    expect(lock.lost).toBe(false);
    await expect(
      createReplica(dragonfly).lock('periodic-job-run', TTL_MS)
    ).resolves.toBe(false);
  });

  it('frees the lock shortly after its holder died', async () => {
    const dragonfly = new FakeDragonfly();
    await lockOn(dragonfly);

    vi.clearAllTimers();
    await vi.advanceTimersByTimeAsync(TTL_MS + 1);

    await expect(lockOn(dragonfly)).resolves.toBeInstanceOf(KvLock);
  });

  it('never frees a lock another replica holds by now', async () => {
    const dragonfly = new FakeDragonfly();
    const stale = await lockOn(dragonfly);
    vi.clearAllTimers();
    await vi.advanceTimersByTimeAsync(TTL_MS + 1);
    await lockOn(dragonfly);

    await stale.release();

    await expect(
      createReplica(dragonfly).lock('periodic-job-run', TTL_MS)
    ).resolves.toBe(false);
  });

  it('notices when another replica took over its lock', async () => {
    const dragonfly = new FakeDragonfly();
    const lock = await lockOn(dragonfly);
    await dragonfly.delRaw('lock:periodic-job-run');
    await lockOn(dragonfly);

    await vi.advanceTimersByTimeAsync(TTL_MS / 4);

    expect(lock.lost).toBe(true);
  });

  it('takes its lock back when it ran out while nobody else took it', async () => {
    const dragonfly = new FakeDragonfly();
    const lock = await lockOn(dragonfly);
    await dragonfly.delRaw('lock:periodic-job-run');

    await vi.advanceTimersByTimeAsync(TTL_MS / 4);

    expect(lock.lost).toBe(false);
    await expect(
      createReplica(dragonfly).lock('periodic-job-run', TTL_MS)
    ).resolves.toBe(false);
  });

  it('keeps its lock through a short Dragonfly outage', async () => {
    const dragonfly = new FakeDragonfly();
    const lock = await lockOn(dragonfly);

    dragonfly.down = true;
    await vi.advanceTimersByTimeAsync(TTL_MS / 2);
    dragonfly.down = false;
    await vi.advanceTimersByTimeAsync(TTL_MS / 4);

    expect(lock.lost).toBe(false);
    await expect(
      createReplica(dragonfly).lock('periodic-job-run', TTL_MS)
    ).resolves.toBe(false);
  });

  it('cannot tell without Dragonfly or while it is unreachable', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.down = true;

    await expect(
      createReplica(new MemoryAtomicStore()).lock('periodic-job-run', TTL_MS)
    ).resolves.toBeUndefined();
    await expect(
      createReplica(dragonfly).lock('periodic-job-run', TTL_MS)
    ).resolves.toBeUndefined();
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

  it('cannot tell whether the lock is held without Dragonfly', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.down = true;

    await expect(
      createReplica(new MemoryAtomicStore()).isLocked('periodic-job-run')
    ).resolves.toBeUndefined();
    await expect(
      createReplica(dragonfly).isLocked('periodic-job-run')
    ).resolves.toBeUndefined();
  });
});
