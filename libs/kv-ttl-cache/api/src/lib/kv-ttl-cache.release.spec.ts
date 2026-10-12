import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

describe('KvTtlCacheService release announcement', () => {
  const originalRelease = process.env['APP_RELEASE_ID'];

  afterEach(() => {
    process.env['APP_RELEASE_ID'] = originalRelease;
  });

  const replica = (dragonfly: FakeDragonfly, release: string) => {
    process.env['APP_RELEASE_ID'] = release;

    return new KvTtlCacheService(createCache(), dragonfly);
  };

  const websiteWrites = (dragonfly: FakeDragonfly) =>
    dragonfly.written.filter(
      ([key]) => key === 'nsv:website:layout' || key === 'nsl:website:pages'
    ).length;

  it('has the websites rebuild their pages once when a new release starts, since its answers may differ', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-2').announceRelease();
    const afterFirst = websiteWrites(dragonfly);
    await replica(dragonfly, 'release-2').announceRelease();

    expect(afterFirst).toBe(2);
    expect(websiteWrites(dragonfly)).toBe(2);
  });

  it('announces every new release', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-2').announceRelease();
    await replica(dragonfly, 'release-3').announceRelease();

    expect(websiteWrites(dragonfly)).toBe(4);
  });

  it('announces a rollback to a release that ran before', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-2').announceRelease();
    await replica(dragonfly, 'release-3').announceRelease();
    await replica(dragonfly, 'release-2').announceRelease();

    expect(websiteWrites(dragonfly)).toBe(6);
  });

  it('announces a release once when several replicas start it at the same time', async () => {
    const dragonfly = new FakeDragonfly();

    await Promise.all([
      replica(dragonfly, 'release-2').announceRelease(),
      replica(dragonfly, 'release-2').announceRelease(),
      replica(dragonfly, 'release-2').announceRelease(),
    ]);

    expect(websiteWrites(dragonfly)).toBe(2);
  });

  it('announces nothing for local development builds', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, '').announceRelease();

    expect(websiteWrites(dragonfly)).toBe(0);
  });
});
