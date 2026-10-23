import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const LINKS = 'media:links';

describe('KvTtlCacheService shared namespace config', () => {
  const originalRelease = process.env['APP_RELEASE_ID'];

  afterEach(() => {
    process.env['APP_RELEASE_ID'] = originalRelease;
    vi.useRealTimers();
  });

  const replica = (dragonfly: FakeDragonfly, release = 'release-1') => {
    process.env['APP_RELEASE_ID'] = release;

    return new KvTtlCacheService(createCache(), dragonfly, {
      sharedNamespaces: {
        [LINKS]: { localCopyMs: 60 * 60 * 1000, acrossReleases: true },
      },
    });
  };

  const valueReads = (reads: { mock: { calls: unknown[][] } }) =>
    reads.mock.calls.filter(([key]) => String(key).startsWith('val:'));

  it('shares a namespace that is configured as shared', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly).setNs(LINKS, 'image', { uri: 'a' }, 3600);

    expect(await replica(dragonfly).getNs(LINKS, 'image')).toEqual({
      uri: 'a',
    });
  });

  it('keeps its local copy of a shared value for as long as configured', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const dragonfly = new FakeDragonfly();
    await replica(dragonfly).setNs(LINKS, 'image', { uri: 'a' }, 3600);
    const reader = replica(dragonfly);
    await reader.getNs(LINKS, 'image');
    const reads = vi.spyOn(dragonfly, 'getRaw');

    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(await reader.getNs(LINKS, 'image')).toEqual({ uri: 'a' });
    expect(valueReads(reads)).toHaveLength(0);
  });

  it('asks Dragonfly again once the configured local copy is over', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const dragonfly = new FakeDragonfly();
    await replica(dragonfly).setNs(LINKS, 'image', { uri: 'a' }, 3 * 3600);
    const reader = replica(dragonfly);
    await reader.getNs(LINKS, 'image');
    const reads = vi.spyOn(dragonfly, 'getRaw');

    vi.advanceTimersByTime(60 * 60 * 1000 + 1);
    await reader.getNs(LINKS, 'image');

    expect(valueReads(reads)).toHaveLength(1);
  });

  it('keeps the values of a namespace configured for it across releases', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-1').setNs(
      LINKS,
      'image',
      { uri: 'a' },
      3600
    );

    expect(await replica(dragonfly, 'release-2').getNs(LINKS, 'image')).toEqual(
      { uri: 'a' }
    );
  });

  it('still scopes other shared namespaces to their release', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-1').setNs(
      'banners',
      'home',
      { id: 'b' },
      3600
    );

    expect(
      await replica(dragonfly, 'release-2').getNs('banners', 'home')
    ).toBeUndefined();
  });

  it('refuses to share integration settings through config', () => {
    expect(
      () =>
        new KvTtlCacheService(createCache(), new FakeDragonfly(), {
          sharedNamespaces: { 'settings:paymentprovider': {} },
        })
    ).toThrow('Integration settings must never be stored in Dragonfly');
  });
});
