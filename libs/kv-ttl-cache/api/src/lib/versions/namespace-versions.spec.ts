import { type DragonflySetOptions } from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '../testing/create-namespaced-cache-testing';
import { CatchUpScheduler } from './catch-up-scheduler';
import { NamespaceVersions, VERSION_REFRESH_MS } from './namespace-versions';

const NAMESPACES = ['graphql:content', 'navigations', 'banners', 'settings'];
const START = new Date('2026-10-02T10:00:00.000Z').getTime();

class HeldDragonfly extends FakeDragonfly {
  private held = new Map<string, Promise<void>>();

  hold(command: string) {
    let release!: () => void;
    this.held.set(command, new Promise<void>(resolve => (release = resolve)));

    return () => {
      this.held.delete(command);
      release();
    };
  }

  override async get(key: string) {
    await this.held.get(`get ${key}`);

    return super.get(key);
  }

  override async set(
    key: string,
    value: string,
    options?: DragonflySetOptions
  ) {
    await this.held.get(`set ${key}`);

    return super.set(key, value, options);
  }
}

const sent = (dragonfly: FakeDragonfly, command: string, key?: string) =>
  dragonfly.commands.filter(
    ([name, first]) => name === command && (key === undefined || first === key)
  );

const shared = async (dragonfly: FakeDragonfly, key: string) => {
  const reply = await dragonfly.get(key);

  return reply.ok ? reply.value : undefined;
};

describe('NamespaceVersions', () => {
  const schedulers: CatchUpScheduler[] = [];
  const replicas: NamespaceVersions[] = [];
  const harnesses: NamespacedCacheTesting[] = [];

  const createVersions = (dragonfly: FakeDragonfly) => {
    const scheduler = new CatchUpScheduler();
    const versions = new NamespaceVersions(dragonfly, scheduler);
    schedulers.push(scheduler);
    replicas.push(versions);

    return versions;
  };

  const createReplica = async (
    dragonfly: FakeDragonfly,
    sharedNamespaces: string[] = []
  ) => {
    const harness = await createNamespacedCacheTesting({
      connection: dragonfly,
      sharedNamespaces,
    });
    harnesses.push(harness);

    return harness;
  };

  afterEach(async () => {
    replicas.splice(0).forEach(versions => versions.onModuleDestroy());
    schedulers.splice(0).forEach(scheduler => scheduler.onModuleDestroy());
    await Promise.all(harnesses.splice(0).map(harness => harness.close()));
    vi.useRealTimers();
  });

  it('trusts a version it knows for two seconds', () => {
    expect(VERSION_REFRESH_MS).toBe(2000);
  });

  describe('reading', () => {
    it('keeps the version another replica created first', async () => {
      const dragonfly = new FakeDragonfly();
      const get = dragonfly.get.bind(dragonfly);
      let firstRead = true;

      vi.spyOn(dragonfly, 'get').mockImplementation(async key => {
        if (firstRead) {
          firstRead = false;
          await dragonfly.set(key, 'other-replica');

          return { ok: true, value: null };
        }

        return get(key);
      });

      await expect(createVersions(dragonfly).current('settings')).resolves.toBe(
        'other-replica'
      );
    });

    it('creates a missing version with SET NX and no expiry under nsv:', async () => {
      const dragonfly = new FakeDragonfly();

      const version = await createVersions(dragonfly).current('settings');

      expect(version).toMatch(/^[0-9a-z]+[0-9a-f]{8}$/);
      expect(sent(dragonfly, 'SET', 'nsv:settings')).toEqual([
        ['SET', 'nsv:settings', version, 'NX'],
      ]);
    });

    it('reads a version once for concurrent callers', async () => {
      const dragonfly = new FakeDragonfly();
      await createVersions(dragonfly).current('settings');
      dragonfly.commands.length = 0;
      const versions = createVersions(dragonfly);

      const read = await Promise.all([
        versions.current('settings'),
        versions.current('settings'),
        versions.current('settings'),
      ]);

      expect(new Set(read).size).toBe(1);
      expect(sent(dragonfly, 'GET', 'nsv:settings')).toHaveLength(1);
    });

    it('reads the versions of several namespaces with one round trip', async () => {
      const dragonfly = new FakeDragonfly();
      const writer = createVersions(dragonfly);
      for (const namespace of NAMESPACES) {
        await writer.current(namespace);
      }
      const reader = createVersions(dragonfly);
      dragonfly.commands.length = 0;

      await reader.currentMany(NAMESPACES);

      expect(sent(dragonfly, 'MGET')).toHaveLength(1);
      expect(sent(dragonfly, 'GET')).toHaveLength(0);
    });

    it('answers the same versions as reading the namespaces one by one, including resets on other replicas', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const dragonfly = new FakeDragonfly();
      const other = createVersions(dragonfly);
      const replica = createVersions(dragonfly);

      const before = await replica.currentMany(NAMESPACES);
      await other.bump('navigations');
      vi.setSystemTime(START + 3000);
      const after = await replica.currentMany(NAMESPACES);
      const oneByOne = await Promise.all(
        NAMESPACES.map(namespace =>
          createVersions(dragonfly).current(namespace)
        )
      );

      expect(after).toEqual(oneByOne);
      expect(
        after.filter((version, index) => version !== before[index])
      ).toEqual([after[1]]);
    });

    it('asks Dragonfly nothing while the versions it knows are fresh', async () => {
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);
      await replica.currentMany(NAMESPACES);
      dragonfly.commands.length = 0;

      await replica.currentMany(NAMESPACES);

      expect(dragonfly.commands).toEqual([]);
    });

    it('peeks at the version Dragonfly holds without remembering it', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);
      const known = await replica.current('content:polls');
      await createVersions(dragonfly).bump('content:polls');

      const peeked = await replica.peekShared('content:polls');

      expect(peeked).toBe(await shared(dragonfly, 'nsv:content:polls'));
      expect(peeked).not.toBe(known);
      await expect(replica.current('content:polls')).resolves.toBe(known);
    });

    it('peeks at nothing while Dragonfly is down', async () => {
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);
      await replica.current('content:polls');
      dragonfly.down();

      await expect(replica.peekShared('content:polls')).resolves.toBe(
        undefined
      );
    });

    it('makes up a version during an outage and keeps it', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const dragonfly = new FakeDragonfly();
      dragonfly.down();
      const replica = createVersions(dragonfly);

      const first = await replica.current('auth:sessions');
      vi.setSystemTime(START + 2 * VERSION_REFRESH_MS + 1);
      const later = await replica.current('auth:sessions');

      expect(first).toMatch(/^[0-9a-z]+[0-9a-f]{8}$/);
      expect(later).toBe(first);
    });

    it('starts no timer for reading versions', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);

      await replica.current('settings');
      await replica.currentMany(NAMESPACES);
      await replica.peekShared('settings');

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('bumping', () => {
    it('changes the version even when bumped in the same millisecond', async () => {
      vi.useFakeTimers();
      const replica = createVersions(new FakeDragonfly());
      const before = await replica.current('settings');

      await replica.bump('settings');

      await expect(replica.current('settings')).resolves.not.toBe(before);
    });

    it('writes the bumped version to Dragonfly without expiry', async () => {
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);

      await replica.bump('settings');
      const version = await replica.current('settings');

      expect(sent(dragonfly, 'SET', 'nsv:settings')).toEqual([
        ['SET', 'nsv:settings', version],
      ]);
    });

    it('applies its own reset immediately', async () => {
      vi.useFakeTimers();
      const { cache, resets } = await createReplica(new FakeDragonfly());

      await cache.getOrLoadNs('settings', 'stripe', () => 'old', 60);
      vi.advanceTimersByTime(5);
      await resets.reset('settings');

      await expect(
        cache.getOrLoadNs('settings', 'stripe', () => 'new', 60)
      ).resolves.toBe('new');
    });

    it('sees a reset by another replica within two seconds', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const editing = await createReplica(dragonfly);
      const reading = await createReplica(dragonfly);

      await reading.cache.getOrLoadNs('settings', 'stripe', () => 'old', 60);
      vi.advanceTimersByTime(5);
      await editing.resets.reset('settings');

      await expect(
        reading.cache.getOrLoadNs('settings', 'stripe', () => 'new', 60)
      ).resolves.toBe('old');

      vi.advanceTimersByTime(2001);

      await expect(
        reading.cache.getOrLoadNs('settings', 'stripe', () => 'new', 60)
      ).resolves.toBe('new');
    });

    it('does not remember a version written with a ttl, so it is read from Dragonfly', async () => {
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);

      await replica.bump('website:path:/a/one', { ttlMs: 60_000 });
      dragonfly.commands.length = 0;
      const version = await replica.current('website:path:/a/one');

      expect(sent(dragonfly, 'GET', 'nsv:website:path:/a/one')).toHaveLength(1);
      expect(version).toBe(await shared(dragonfly, 'nsv:website:path:/a/one'));
    });

    it('forgets versions written with a ttl after it', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();

      await createVersions(dragonfly).bump('website:path:/a/one', {
        ttlMs: 4 * 60 * 60 * 1000,
      });
      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);

      await expect(
        shared(dragonfly, 'nsv:website:path:/a/one')
      ).resolves.toBeNull();
    });

    it('keeps nothing per version it bumps with a ttl', async () => {
      const replica = createVersions(new FakeDragonfly());

      for (let article = 0; article < 100; article++) {
        await replica.bump(`website:path:/a/${article}`, { ttlMs: 60_000 });
      }

      const kept = Object.values(replica)
        .filter((field): field is Map<unknown, unknown> => field instanceof Map)
        .map(field => field.size);

      expect(kept.length).toBeGreaterThan(0);
      expect(kept.every(size => size === 0)).toBe(true);
    });
  });

  describe('outages', () => {
    it('keeps its own reset when a version read that started before it fails afterwards', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const dragonfly = new HeldDragonfly();
      const replica = createVersions(dragonfly);
      await replica.current('navigations');
      vi.setSystemTime(START + 2100);

      const release = dragonfly.hold('get nsv:navigations');
      const reading = replica.current('navigations');
      dragonfly.down();
      await replica.bump('navigations');
      const reset = await replica.current('navigations');
      release();
      await reading;

      await expect(replica.current('navigations')).resolves.toBe(reset);
    });

    it('never brings back an older version of its own when it catches up after an outage', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const dragonfly = new HeldDragonfly();
      const replica = createVersions(dragonfly);
      dragonfly.down();
      await replica.bump('navigations');
      await replica.bump('banners');
      dragonfly.up();
      vi.setSystemTime(START + 2100);

      const release = dragonfly.hold('set nsv:navigations');
      const catchingUp = replica.current('navigations');
      await new Promise(resolve => setTimeout(resolve, 0));
      await replica.bump('banners');
      const banners = await replica.current('banners');
      release();
      await catchingUp;

      await expect(shared(dragonfly, 'nsv:banners')).resolves.toBe(banners);
    });

    it('keeps a reset made while Dragonfly was down and shares it once it is back', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const first = await createReplica(dragonfly, ['content:articles']);
      const second = await createReplica(dragonfly, ['content:articles']);

      await first.cache.getOrLoadNs('content:articles', 'a', () => 'old', 300);
      await second.cache.getOrLoadNs('content:articles', 'a', () => 'old', 300);
      vi.advanceTimersByTime(5);

      dragonfly.down();
      await first.resets.reset('content:articles');
      dragonfly.up();
      vi.advanceTimersByTime(2001);

      await expect(
        first.cache.getOrLoadNs('content:articles', 'a', () => 'new', 300)
      ).resolves.toBe('new');
      await expect(
        second.cache.getOrLoadNs('content:articles', 'a', () => 'new', 300)
      ).resolves.toBe('new');
    });

    it('writes a reset made during an outage once Dragonfly is back, without waiting for a request', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);
      const before = await replica.current('content:articles');

      dragonfly.down();
      await replica.bump('content:articles');
      dragonfly.up();
      await vi.advanceTimersByTimeAsync(5000);

      const written = await shared(dragonfly, 'nsv:content:articles');
      expect(written).toBeTruthy();
      expect(written).not.toBe(before);
    });

    it('resets again shortly after a late write, for replicas that read old content in between', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);

      dragonfly.down();
      await replica.bump('graphql:content');
      dragonfly.up();
      await vi.advanceTimersByTimeAsync(5000);
      const written = await shared(dragonfly, 'nsv:graphql:content');
      await vi.advanceTimersByTimeAsync(3000);

      await expect(shared(dragonfly, 'nsv:graphql:content')).resolves.not.toBe(
        written
      );
    });

    it('writes a late version only once when a request and the timer catch up together', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);

      dragonfly.down();
      await replica.bump('navigations');
      await replica.bump('banners');
      dragonfly.up();
      vi.advanceTimersByTime(VERSION_REFRESH_MS + 1);
      dragonfly.commands.length = 0;

      await Promise.all([
        replica.current('navigations'),
        replica.current('banners'),
      ]);
      await vi.advanceTimersByTimeAsync(2998);

      expect(sent(dragonfly, 'SET', 'nsv:navigations')).toHaveLength(1);
      expect(sent(dragonfly, 'SET', 'nsv:banners')).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(3000);

      expect(sent(dragonfly, 'SET', 'nsv:navigations')).toHaveLength(2);
      expect(sent(dragonfly, 'SET', 'nsv:banners')).toHaveLength(2);
    });

    it('keeps the ttl of a version written after an outage, and forgets it after four hours too', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);

      dragonfly.down();
      await replica.bump('website:path:/a/one', {
        ttlMs: 4 * 60 * 60 * 1000,
      });
      await vi.advanceTimersByTimeAsync(30_000);
      dragonfly.up();
      await vi.advanceTimersByTimeAsync(10_000);

      await expect(
        shared(dragonfly, 'nsv:website:path:/a/one')
      ).resolves.toBeTruthy();

      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);

      await expect(
        shared(dragonfly, 'nsv:website:path:/a/one')
      ).resolves.toBeNull();
    });

    it('stops retrying once destroyed', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const replica = createVersions(dragonfly);

      dragonfly.down();
      await replica.bump('navigations');

      expect(vi.getTimerCount()).toBe(1);

      replica.onModuleDestroy();

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
