import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { KvAtomicStore, MemoryAtomicStore } from './kv-ttl-cache-atomic-store';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const createReplica = (atomic: KvAtomicStore) =>
  new KvTtlCacheService(createCache(), atomic);

class FailingDragonfly extends FakeDragonfly {
  override async setIfAbsent() {
    this.down = true;

    return true;
  }
}

class LostReplyDragonfly extends FakeDragonfly {
  override async setIfAbsent(key: string, value: string, ttlMs?: number) {
    const claimed = await super.setIfAbsent(key, value, ttlMs);

    if (!this.lostOnce) {
      this.lostOnce = true;
      this.down = true;
    }

    return claimed;
  }

  lostOnce = false;
}

describe('KvTtlCacheService claim', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets exactly one replica claim a job', async () => {
    const dragonfly = new FakeDragonfly();
    const first = createReplica(dragonfly);
    const second = createReplica(dragonfly);

    await expect(first.claim('nightly-job', 60_000)).resolves.toBe(true);
    await expect(second.claim('nightly-job', 60_000)).resolves.toBe(false);
    await expect(first.claim('nightly-job', 60_000)).resolves.toBe(false);
  });

  it('keeps the claims of different jobs apart', async () => {
    const dragonfly = new FakeDragonfly();

    await createReplica(dragonfly).claim('nightly-job', 60_000);

    await expect(
      createReplica(dragonfly).claim('other-job', 60_000)
    ).resolves.toBe(true);
  });

  it('lets the job be claimed again once the claim ran out', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T03:00:00.000Z'));
    const dragonfly = new FakeDragonfly();

    await createReplica(dragonfly).claim('nightly-job', 60_000);
    vi.setSystemTime(new Date('2026-10-02T03:01:00.001Z'));

    await expect(
      createReplica(dragonfly).claim('nightly-job', 60_000)
    ).resolves.toBe(true);
  });

  it('cannot tell while Dragonfly is unreachable', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.down = true;

    await expect(
      createReplica(dragonfly).claim('nightly-job', 60_000)
    ).resolves.toBeUndefined();
  });

  it('cannot tell when Dragonfly fails during the claim', async () => {
    await expect(
      createReplica(new FailingDragonfly()).claim('nightly-job', 60_000)
    ).resolves.toBeUndefined();
  });

  it('cannot tell without Dragonfly, where every replica only sees itself', async () => {
    await expect(
      createReplica(new MemoryAtomicStore()).claim('nightly-job', 60_000)
    ).resolves.toBeUndefined();
  });

  it('keeps trying while Dragonfly is briefly unreachable and claims once it is back', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const dragonfly = new FakeDragonfly();
    dragonfly.down = true;

    const claiming = createReplica(dragonfly).claim('nightly-job', 60_000, {
      retryForMs: 60_000,
    });
    await vi.advanceTimersByTimeAsync(5_000);
    dragonfly.down = false;
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(claiming).resolves.toBe(true);
  });

  it('still claims the job when the answer to its claim got lost, and no other replica gets it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const dragonfly = new LostReplyDragonfly();

    const claiming = createReplica(dragonfly).claim('nightly-job', 60_000, {
      retryForMs: 60_000,
    });
    await vi.advanceTimersByTimeAsync(1_000);
    dragonfly.down = false;
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(claiming).resolves.toBe(true);
    await expect(
      createReplica(dragonfly).claim('nightly-job', 60_000)
    ).resolves.toBe(false);
  });

  it('never takes over a claim of the same name made elsewhere on this host', async () => {
    const dragonfly = new FakeDragonfly();
    const replica = createReplica(dragonfly);

    await expect(replica.claim('totp-used:1:5', 60_000)).resolves.toBe(true);
    await expect(replica.claim('totp-used:1:5', 60_000)).resolves.toBe(false);
  });

  it('gives up when Dragonfly stays unreachable for the whole retry window', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const dragonfly = new FakeDragonfly();
    dragonfly.down = true;

    const claiming = createReplica(dragonfly).claim('nightly-job', 60_000, {
      retryForMs: 60_000,
    });
    await vi.advanceTimersByTimeAsync(65_000);

    await expect(claiming).resolves.toBeUndefined();
  });

  it('does not wait without Dragonfly, where trying again cannot help', async () => {
    await expect(
      createReplica(new MemoryAtomicStore()).claim('nightly-job', 60_000, {
        retryForMs: 60_000,
      })
    ).resolves.toBeUndefined();
  });
});
