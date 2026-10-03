import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const NAMESPACES = ['graphql:content', 'navigations', 'banners', 'settings'];

class HeldDragonfly extends FakeDragonfly {
  private held = new Map<string, Promise<void>>();

  hold(key: string) {
    let release!: () => void;
    this.held.set(key, new Promise<void>(resolve => (release = resolve)));

    return () => {
      this.held.delete(key);
      release();
    };
  }

  override async getRaw(key: string) {
    await this.held.get(`get ${key}`);

    return super.getRaw(key);
  }

  override async setRaw(key: string, value: string, ttlMs?: number) {
    await this.held.get(`set ${key}`);

    return super.setRaw(key, value, ttlMs);
  }
}

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

  it('keeps its own reset when a version read that started before it fails afterwards', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-02T10:00:00.000Z'));
    const dragonfly = new HeldDragonfly();
    const replica = new KvTtlCacheService(createCache(), dragonfly);
    await replica.getNamespaceVersion('navigations');
    vi.setSystemTime(new Date('2026-10-02T10:00:02.100Z'));

    const release = dragonfly.hold('get nsv:navigations');
    const reading = replica.getNamespaceVersion('navigations');
    dragonfly.down = true;
    await replica.resetNamespace('navigations');
    const reset = await replica.getNamespaceVersion('navigations');
    release();
    await reading;

    await expect(replica.getNamespaceVersion('navigations')).resolves.toBe(
      reset
    );
  });

  it('never brings back an older version of its own when it catches up after an outage', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-02T10:00:00.000Z'));
    const dragonfly = new HeldDragonfly();
    const replica = new KvTtlCacheService(createCache(), dragonfly);
    dragonfly.down = true;
    await replica.resetNamespace('navigations');
    await replica.resetNamespace('banners');
    dragonfly.down = false;
    vi.setSystemTime(new Date('2026-10-02T10:00:02.100Z'));

    const release = dragonfly.hold('set nsv:navigations');
    const catchingUp = replica.getNamespaceVersion('navigations');
    await new Promise(resolve => setTimeout(resolve, 0));
    await replica.resetNamespace('banners');
    const banners = await replica.getNamespaceVersion('banners');
    release();
    await catchingUp;

    await expect(dragonfly.getRaw('nsv:banners')).resolves.toBe(banners);
  });
});
