import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const START = new Date('2026-10-02T10:00:00.000Z').getTime();

describe('KvTtlCacheService counters', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const replicas = () => {
    const dragonfly = new FakeDragonfly();

    return {
      dragonfly,
      a: new KvTtlCacheService(createCache(), dragonfly),
      b: new KvTtlCacheService(createCache(), dragonfly),
    };
  };

  it('counts across replicas', async () => {
    const { a, b } = replicas();

    await a.increment('totp-failures:user-1', 60_000);
    await b.increment('totp-failures:user-1', 60_000);

    expect(await a.count('totp-failures:user-1')).toBe(2);
    expect(await b.count('totp-failures:user-1')).toBe(2);
  });

  it('returns the new count', async () => {
    const { a } = replicas();

    await a.increment('totp-failures:user-1', 60_000);

    expect(await a.increment('totp-failures:user-1', 60_000)).toBe(2);
  });

  it('starts over once the last increment is older than the window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const { a } = replicas();

    await a.increment('totp-failures:user-1', 60_000);
    vi.setSystemTime(START + 50_000);
    await a.increment('totp-failures:user-1', 60_000);
    vi.setSystemTime(START + 100_000);

    expect(await a.count('totp-failures:user-1')).toBe(2);

    vi.setSystemTime(START + 111_000);

    expect(await a.count('totp-failures:user-1')).toBe(0);
  });

  it('forgets a count on every replica', async () => {
    const { a, b } = replicas();

    await a.increment('totp-failures:user-1', 60_000);
    await b.forgetCount('totp-failures:user-1');

    expect(await a.count('totp-failures:user-1')).toBe(0);
  });

  it('keeps counts apart', async () => {
    const { a } = replicas();

    await a.increment('totp-failures:user-1', 60_000);

    expect(await a.count('totp-failures:user-2')).toBe(0);
  });

  it('cannot count while Dragonfly is unavailable or not configured', async () => {
    const { dragonfly, a } = replicas();
    dragonfly.down = true;
    const local = new KvTtlCacheService(createCache());

    expect(await a.increment('totp-failures:user-1', 60_000)).toBeUndefined();
    expect(await a.count('totp-failures:user-1')).toBeUndefined();
    expect(
      await local.increment('totp-failures:user-1', 60_000)
    ).toBeUndefined();
  });
});
