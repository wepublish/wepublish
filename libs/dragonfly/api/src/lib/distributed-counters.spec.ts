import { DistributedCounters } from './distributed-counters';
import { MemoryDragonflyConnection } from './memory-dragonfly-connection';
import { FakeDragonfly } from './testing/fake-dragonfly';

const START = new Date('2026-10-02T10:00:00.000Z').getTime();

const counted = (count: number) => ({ status: 'counted', count });

describe('DistributedCounters', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const replicas = () => {
    const dragonfly = new FakeDragonfly();

    return {
      dragonfly,
      a: new DistributedCounters(dragonfly),
      b: new DistributedCounters(dragonfly),
    };
  };

  it('counts across replicas', async () => {
    const { a, b } = replicas();

    await expect(a.increment('totp-failures:user-1', 60_000)).resolves.toEqual(
      counted(1)
    );
    await expect(b.increment('totp-failures:user-1', 60_000)).resolves.toEqual(
      counted(2)
    );
  });

  it('starts over once the last increment is older than the window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const { a } = replicas();

    await a.increment('totp-failures:user-1', 60_000);
    vi.setSystemTime(START + 50_000);
    await a.increment('totp-failures:user-1', 60_000);
    vi.setSystemTime(START + 109_000);

    await expect(a.increment('totp-failures:user-1', 60_000)).resolves.toEqual(
      counted(3)
    );

    vi.setSystemTime(START + 170_000);

    await expect(a.increment('totp-failures:user-1', 60_000)).resolves.toEqual(
      counted(1)
    );
  });

  it('creates a counter with its expiry before counting, so it still expires when renewing the expiry fails', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const { dragonfly, a } = replicas();
    dragonfly.rejectNext('PEXPIRE');

    await expect(a.increment('totp-failures:1', 900_000)).resolves.toEqual(
      counted(1)
    );
    expect(dragonfly.commands).toEqual([
      ['SET', 'count:totp-failures:1', '0', 'NX', 'PX', '900000'],
      ['INCR', 'count:totp-failures:1'],
      ['PEXPIRE', 'count:totp-failures:1', '900000'],
    ]);

    vi.setSystemTime(START + 899_999);
    await expect(dragonfly.get('count:totp-failures:1')).resolves.toEqual({
      ok: true,
      value: '1',
    });

    vi.setSystemTime(START + 900_000);
    await expect(dragonfly.get('count:totp-failures:1')).resolves.toEqual({
      ok: true,
      value: null,
    });
  });

  it('cannot count when Dragonfly becomes unreachable while renewing the expiry, and the counter still expires', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const { dragonfly, a } = replicas();
    const incr = dragonfly.incr.bind(dragonfly);
    vi.spyOn(dragonfly, 'incr').mockImplementationOnce(async key => {
      const reply = await incr(key);
      dragonfly.down();

      return reply;
    });

    await expect(a.increment('totp-failures:1', 900_000)).resolves.toEqual({
      status: 'unavailable',
    });

    dragonfly.up();
    vi.setSystemTime(START + 899_999);
    await expect(dragonfly.get('count:totp-failures:1')).resolves.toEqual({
      ok: true,
      value: '1',
    });

    vi.setSystemTime(START + 900_000);
    await expect(dragonfly.get('count:totp-failures:1')).resolves.toEqual({
      ok: true,
      value: null,
    });
  });

  it('forgets a count on every replica', async () => {
    const { a, b } = replicas();

    await a.increment('totp-failures:user-1', 60_000);
    await b.forget('totp-failures:user-1');

    await expect(a.increment('totp-failures:user-1', 60_000)).resolves.toEqual(
      counted(1)
    );
  });

  it('keeps counts apart', async () => {
    const { a } = replicas();

    await a.increment('totp-failures:user-1', 60_000);

    await expect(a.increment('totp-failures:user-2', 60_000)).resolves.toEqual(
      counted(1)
    );
  });

  it('cannot count while Dragonfly is unavailable or not configured', async () => {
    const { dragonfly, a } = replicas();
    dragonfly.down();
    const local = new DistributedCounters(new MemoryDragonflyConnection());

    await expect(a.increment('totp-failures:user-1', 60_000)).resolves.toEqual({
      status: 'unavailable',
    });
    await expect(
      local.increment('totp-failures:user-1', 60_000)
    ).resolves.toEqual({ status: 'not-configured' });
  });

  it('cannot count when Dragonfly refuses to count', async () => {
    const { dragonfly, a } = replicas();
    dragonfly.rejectNext('INCR');

    await expect(a.increment('totp-failures:user-1', 60_000)).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('forgets nothing without Dragonfly and never fails', async () => {
    const { dragonfly, a } = replicas();
    dragonfly.down();

    await expect(a.forget('totp-failures:user-1')).resolves.toBeUndefined();
    await expect(
      new DistributedCounters(new MemoryDragonflyConnection()).forget('x')
    ).resolves.toBeUndefined();
  });
});
