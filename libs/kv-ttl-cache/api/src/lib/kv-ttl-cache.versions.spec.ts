import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const NAMESPACES = ['graphql:content', 'navigations', 'banners', 'settings'];

describe('KvTtlCacheService namespace versions', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the versions of several namespaces with one round trip', async () => {
    const dragonfly = new FakeDragonfly();
    const writer = new KvTtlCacheService(createCache(), dragonfly);
    for (const namespace of NAMESPACES) {
      await writer.getNamespaceVersion(namespace);
    }
    const reader = new KvTtlCacheService(createCache(), dragonfly);
    const single = vi.spyOn(dragonfly, 'getRaw');
    const batch = vi.spyOn(dragonfly, 'getManyRaw');

    await reader.getNamespaceVersions(NAMESPACES);

    expect(batch).toHaveBeenCalledTimes(1);
    expect(single).not.toHaveBeenCalled();
  });

  it('answers the same versions as reading the namespaces one by one, including resets on other replicas', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-02T10:00:00.000Z'));
    const dragonfly = new FakeDragonfly();
    const other = new KvTtlCacheService(createCache(), dragonfly);
    const replica = new KvTtlCacheService(createCache(), dragonfly);

    const before = await replica.getNamespaceVersions(NAMESPACES);
    await other.resetNamespace('navigations');
    vi.setSystemTime(new Date('2026-10-02T10:00:03.000Z'));
    const after = await replica.getNamespaceVersions(NAMESPACES);
    const oneByOne = await Promise.all(
      NAMESPACES.map(namespace =>
        new KvTtlCacheService(createCache(), dragonfly).getNamespaceVersion(
          namespace
        )
      )
    );

    expect(after).toEqual(oneByOne);
    expect(after.filter((version, index) => version !== before[index])).toEqual(
      [after[1]]
    );
  });

  it('asks Dragonfly nothing while the versions it knows are fresh', async () => {
    const dragonfly = new FakeDragonfly();
    const replica = new KvTtlCacheService(createCache(), dragonfly);
    await replica.getNamespaceVersions(NAMESPACES);
    const batch = vi.spyOn(dragonfly, 'getManyRaw');
    const single = vi.spyOn(dragonfly, 'getRaw');

    await replica.getNamespaceVersions(NAMESPACES);

    expect(batch).not.toHaveBeenCalled();
    expect(single).not.toHaveBeenCalled();
  });
});
