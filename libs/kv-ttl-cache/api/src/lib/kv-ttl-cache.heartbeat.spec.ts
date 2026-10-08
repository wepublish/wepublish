import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const START = new Date('2026-10-02T10:00:00.000Z').getTime();

describe('KvTtlCacheService website heartbeat', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps telling the websites that an api writes their page versions', async () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'Date',
      ],
    });
    vi.setSystemTime(START);
    const dragonfly = new FakeDragonfly();
    const api = new KvTtlCacheService(createCache(), dragonfly);

    await api.getNamespaceVersion('content:articles');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await dragonfly.getRaw('website:heartbeat')).toBeDefined();

    await vi.advanceTimersByTimeAsync(180_000);
    expect(await dragonfly.getRaw('website:heartbeat')).toBeDefined();

    api.onModuleDestroy();
  });

  it('lets the heartbeat run out once no api writes page versions, so websites refresh pages on their own', async () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'Date',
      ],
    });
    vi.setSystemTime(START);
    const dragonfly = new FakeDragonfly();
    const api = new KvTtlCacheService(createCache(), dragonfly);

    await api.getNamespaceVersion('content:articles');
    await vi.advanceTimersByTimeAsync(5_000);
    api.onModuleDestroy();
    await vi.advanceTimersByTimeAsync(61_000);

    expect(await dragonfly.getRaw('website:heartbeat')).toBeUndefined();
  });
});
