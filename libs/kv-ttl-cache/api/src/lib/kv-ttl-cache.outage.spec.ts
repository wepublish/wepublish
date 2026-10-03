import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { KvAtomicStore } from './kv-ttl-cache-atomic-store';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const createReplica = (atomic: KvAtomicStore) =>
  new KvTtlCacheService(createCache(), atomic);

const START = new Date('2026-10-02T10:00:00.000Z').getTime();

describe('KvTtlCacheService while Dragonfly is unreachable', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a value that could not reach Dragonfly for at most 30 s, so a revoked session does not live on for minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const dragonfly = new FakeDragonfly();
    dragonfly.down = true;
    const replica = createReplica(dragonfly);
    const loader = vi.fn().mockResolvedValue({ id: 'session' });

    await replica.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    vi.setSystemTime(START + 29_000);
    await replica.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    expect(loader).toHaveBeenCalledTimes(1);

    vi.setSystemTime(START + 31_000);
    await replica.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('never puts a session into Dragonfly', async () => {
    const dragonfly = new FakeDragonfly();

    await createReplica(dragonfly).getOrLoadNs(
      'auth:sessions',
      'user:x',
      () => ({ id: 'session', email: 'reader@example.com' }),
      300
    );

    expect(dragonfly.written.some(([key]) => key.startsWith('val:'))).toBe(
      false
    );
  });

  it('drops a session cached before Dragonfly became unreachable within a minute, so a logout on another replica takes effect', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const dragonfly = new FakeDragonfly();
    const replica = createReplica(dragonfly);
    const loader = vi.fn().mockResolvedValue({ id: 'session' });

    await replica.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    dragonfly.down = true;
    await createReplica(dragonfly).resetNamespace('auth:sessions');

    vi.setSystemTime(START + 10_000);
    await replica.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    expect(loader).toHaveBeenCalledTimes(1);

    vi.setSystemTime(START + 65_000);
    await replica.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('keeps sessions for their full ttl while Dragonfly is reachable', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const replica = createReplica(new FakeDragonfly());
    const loader = vi.fn().mockResolvedValue({ id: 'session' });

    await replica.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    vi.setSystemTime(START + 250_000);
    await replica.getOrLoadNs('auth:sessions', 'user:x', loader, 300);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('keeps the full ttl for values kept local on purpose, like oversized ones', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const replica = createReplica(new FakeDragonfly());
    const loader = vi.fn().mockResolvedValue('x'.repeat(300 * 1024));

    await replica.getOrLoadNs('content:articles', 'list:big', loader, 300);
    vi.setSystemTime(START + 60_000);
    await replica.getOrLoadNs('content:articles', 'list:big', loader, 300);

    expect(loader).toHaveBeenCalledTimes(1);
  });
});
