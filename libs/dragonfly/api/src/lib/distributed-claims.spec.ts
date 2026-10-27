import { DistributedClaims } from './distributed-claims';
import { DragonflyConnection } from './dragonfly-connection';
import { type DragonflyReply } from './dragonfly-reply';
import { MemoryDragonflyConnection } from './memory-dragonfly-connection';
import { FakeDragonfly } from './testing/fake-dragonfly';

const createReplica = (connection: DragonflyConnection) =>
  new DistributedClaims(connection);

class FailingDragonfly extends FakeDragonfly {
  override async set(): Promise<DragonflyReply<boolean>> {
    this.down();

    return { ok: false, reason: 'unavailable' };
  }
}

class LostReplyDragonfly extends FakeDragonfly {
  lostOnce = false;

  override async set(
    key: string,
    value: string,
    options?: { px?: number; nx?: boolean }
  ): Promise<DragonflyReply<boolean>> {
    const claimed = await super.set(key, value, options);

    if (!this.lostOnce) {
      this.lostOnce = true;
      this.down();

      return { ok: false, reason: 'unavailable' };
    }

    return claimed;
  }
}

describe('DistributedClaims', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('lets exactly one replica claim a job', async () => {
    const dragonfly = new FakeDragonfly();
    const first = createReplica(dragonfly);
    const second = createReplica(dragonfly);

    await expect(first.claim('nightly-job', 60_000)).resolves.toBe('claimed');
    await expect(second.claim('nightly-job', 60_000)).resolves.toBe('taken');
    await expect(first.claim('nightly-job', 60_000)).resolves.toBe('taken');
  });

  it('claims under lock:<name> with a token of this host and process', async () => {
    const dragonfly = new FakeDragonfly();

    await createReplica(dragonfly).claim('nightly-job', 60_000);

    expect(dragonfly.commands[0]).toEqual([
      'SET',
      'lock:nightly-job',
      expect.stringMatching(new RegExp(`^.+:${process.pid}:[0-9a-f]{16}$`)),
      'NX',
      'PX',
      '60000',
    ]);
  });

  it('keeps the claims of different jobs apart', async () => {
    const dragonfly = new FakeDragonfly();

    await createReplica(dragonfly).claim('nightly-job', 60_000);

    await expect(
      createReplica(dragonfly).claim('other-job', 60_000)
    ).resolves.toBe('claimed');
  });

  it('lets the job be claimed again once the claim ran out', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T03:00:00.000Z'));
    const dragonfly = new FakeDragonfly();

    await createReplica(dragonfly).claim('nightly-job', 60_000);
    vi.setSystemTime(new Date('2026-10-02T03:01:00.001Z'));

    await expect(
      createReplica(dragonfly).claim('nightly-job', 60_000)
    ).resolves.toBe('claimed');
  });

  it('cannot tell while Dragonfly is unreachable', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.down();

    await expect(
      createReplica(dragonfly).claim('nightly-job', 60_000)
    ).resolves.toBe('unavailable');
  });

  it('cannot tell when Dragonfly fails during the claim', async () => {
    await expect(
      createReplica(new FailingDragonfly()).claim('nightly-job', 60_000)
    ).resolves.toBe('unavailable');
  });

  it('cannot tell without Dragonfly, where every replica only sees itself', async () => {
    await expect(
      createReplica(new MemoryDragonflyConnection()).claim(
        'nightly-job',
        60_000
      )
    ).resolves.toBe('not-configured');
  });

  it('keeps trying while Dragonfly is briefly unreachable and claims once it is back', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const dragonfly = new FakeDragonfly();
    dragonfly.down();

    const claiming = createReplica(dragonfly).claim('nightly-job', 60_000, {
      retryForMs: 60_000,
    });
    await vi.advanceTimersByTimeAsync(5_000);
    dragonfly.up();
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(claiming).resolves.toBe('claimed');
  });

  it('still claims the job when the answer to its claim got lost, and no other replica gets it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const dragonfly = new LostReplyDragonfly();

    const claiming = createReplica(dragonfly).claim('nightly-job', 60_000, {
      retryForMs: 60_000,
    });
    await vi.advanceTimersByTimeAsync(1_000);
    dragonfly.up();
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(claiming).resolves.toBe('claimed');
    await expect(
      createReplica(dragonfly).claim('nightly-job', 60_000)
    ).resolves.toBe('taken');
  });

  it('never takes over a claim of the same name made elsewhere on this host', async () => {
    const dragonfly = new FakeDragonfly();
    const replica = createReplica(dragonfly);

    await expect(replica.claim('totp-used:1:5', 60_000)).resolves.toBe(
      'claimed'
    );
    await expect(replica.claim('totp-used:1:5', 60_000)).resolves.toBe('taken');
  });

  it('gives up when Dragonfly stays unreachable for the whole retry window', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const dragonfly = new FakeDragonfly();
    dragonfly.down();

    const claiming = createReplica(dragonfly).claim('nightly-job', 60_000, {
      retryForMs: 60_000,
    });
    await vi.advanceTimersByTimeAsync(65_000);

    await expect(claiming).resolves.toBe('unavailable');
  });

  it('does not wait without Dragonfly, where trying again cannot help', async () => {
    await expect(
      createReplica(new MemoryDragonflyConnection()).claim(
        'nightly-job',
        60_000,
        { retryForMs: 60_000 }
      )
    ).resolves.toBe('not-configured');
  });

  it('does not keep the process alive while it waits to try again', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const timeouts = vi.spyOn(globalThis, 'setTimeout');
    const dragonfly = new FakeDragonfly();
    dragonfly.down();

    void createReplica(dragonfly).claim('nightly-job', 60_000, {
      retryForMs: 60_000,
    });
    await vi.advanceTimersByTimeAsync(0);

    expect(timeouts).toHaveBeenCalledWith(expect.any(Function), 5_000);
    expect((timeouts.mock.results[0].value as NodeJS.Timeout).hasRef()).toBe(
      false
    );
  });

  it('stops waiting to try again when the application shuts down', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const dragonfly = new FakeDragonfly();
    dragonfly.down();
    const claims = createReplica(dragonfly);

    const claiming = claims.claim('nightly-job', 60_000, {
      retryForMs: 60_000,
    });
    await vi.advanceTimersByTimeAsync(0);
    claims.onModuleDestroy();
    dragonfly.up();

    await expect(claiming).resolves.toBe('unavailable');
    expect(vi.getTimerCount()).toBe(0);
    expect(dragonfly.commands).toEqual([]);
  });
});
