import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { KvAtomicStore, MemoryAtomicStore } from './kv-ttl-cache-atomic-store';
import { FakeDragonfly, INTEGRATION_NAMESPACES } from './kv-ttl-cache.testing';

const createReplica = (atomic: KvAtomicStore) =>
  new KvTtlCacheService(createCache(), atomic);

class UnavailableAtomicStore implements KvAtomicStore {
  readonly shared = true;

  isAvailable() {
    return false;
  }

  async ping() {
    return false;
  }

  async setIfAbsent() {
    return true;
  }

  async getRaw() {
    return undefined;
  }

  async getManyRaw(keys: string[]) {
    return keys.map(() => undefined);
  }

  async setRaw() {
    return false;
  }

  async delRaw() {
    return;
  }

  async disconnect() {
    return;
  }
}

const twoReplicas = () => {
  const dragonfly = new FakeDragonfly();

  return {
    dragonfly,
    first: createReplica(dragonfly),
    second: createReplica(dragonfly),
  };
};

describe('KvTtlCacheService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('namespace versions', () => {
    it('keeps the version another replica created first', async () => {
      const atomic = new MemoryAtomicStore();
      const getRaw = atomic.getRaw.bind(atomic);
      let firstRead = true;

      vi.spyOn(atomic, 'getRaw').mockImplementation(async key => {
        if (firstRead) {
          firstRead = false;
          await atomic.setRaw(key, 'other-replica');

          return undefined;
        }

        return getRaw(key);
      });

      await expect(
        createReplica(atomic).getNamespaceVersion('settings')
      ).resolves.toBe('other-replica');
    });

    it('changes the version even when reset in the same millisecond', async () => {
      vi.useFakeTimers();
      const replica = createReplica(new MemoryAtomicStore());
      const before = await replica.getNamespaceVersion('settings');

      await replica.resetNamespace('settings');

      await expect(replica.getNamespaceVersion('settings')).resolves.not.toBe(
        before
      );
    });

    it('applies its own reset immediately', async () => {
      vi.useFakeTimers();
      const replica = createReplica(new MemoryAtomicStore());

      await replica.getOrLoadNs('settings', 'stripe', () => 'old', 60);
      vi.advanceTimersByTime(5);
      await replica.resetNamespace('settings');

      await expect(
        replica.getOrLoadNs('settings', 'stripe', () => 'new', 60)
      ).resolves.toBe('new');
    });

    it('keeps a reset made while Dragonfly was down and shares it once it is back', async () => {
      vi.useFakeTimers();
      const { dragonfly, first, second } = twoReplicas();

      await first.getOrLoadNs('content:articles', 'a', () => 'old', 300);
      await second.getOrLoadNs('content:articles', 'a', () => 'old', 300);
      vi.advanceTimersByTime(5);

      dragonfly.down = true;
      await first.resetNamespace('content:articles');
      dragonfly.down = false;
      vi.advanceTimersByTime(2001);

      await expect(
        first.getOrLoadNs('content:articles', 'a', () => 'new', 300)
      ).resolves.toBe('new');
      await expect(
        second.getOrLoadNs('content:articles', 'a', () => 'new', 300)
      ).resolves.toBe('new');
    });

    it('writes a reset made during an outage once Dragonfly is back, without waiting for a request', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const replica = createReplica(dragonfly);
      const before = await replica.getNamespaceVersion('content:articles');

      dragonfly.down = true;
      await replica.resetNamespace('content:articles');
      dragonfly.down = false;
      await vi.advanceTimersByTimeAsync(5000);

      const shared = await dragonfly.getRaw('nsv:content:articles');
      expect(shared).toBeDefined();
      expect(shared).not.toBe(before);
    });

    it('resets again shortly after a late write, for replicas that read old content in between', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const replica = createReplica(dragonfly);

      dragonfly.down = true;
      await replica.resetNamespace('graphql:content');
      dragonfly.down = false;
      await vi.advanceTimersByTimeAsync(5000);
      const written = await dragonfly.getRaw('nsv:graphql:content');
      await vi.advanceTimersByTimeAsync(3000);

      await expect(dragonfly.getRaw('nsv:graphql:content')).resolves.not.toBe(
        written
      );
    });

    it('sees a reset by another replica within two seconds', async () => {
      vi.useFakeTimers();
      const atomic = new MemoryAtomicStore();
      const editing = createReplica(atomic);
      const reading = createReplica(atomic);

      await reading.getOrLoadNs('settings', 'stripe', () => 'old', 60);
      vi.advanceTimersByTime(5);
      await editing.resetNamespace('settings');

      await expect(
        reading.getOrLoadNs('settings', 'stripe', () => 'new', 60)
      ).resolves.toBe('old');

      vi.advanceTimersByTime(2001);

      await expect(
        reading.getOrLoadNs('settings', 'stripe', () => 'new', 60)
      ).resolves.toBe('new');
    });
  });

  describe('values', () => {
    it('keeps caching in memory while Dragonfly is unavailable', async () => {
      const replica = createReplica(new UnavailableAtomicStore());
      const loader = vi.fn().mockResolvedValue('loaded');

      await replica.getOrLoadNs('settings', 'stripe', loader, 60);
      vi.useFakeTimers();
      vi.advanceTimersByTime(5000);
      await replica.getOrLoadNs('settings', 'stripe', loader, 60);

      expect(loader).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOrLoadManyNs', () => {
    it('loads only the keys no replica has cached yet, in one call', async () => {
      const { first, second } = twoReplicas();
      const loader = vi.fn(async (ids: string[]) => ids.map(id => ({ id })));

      await first.getOrLoadManyNs('content:articles', ['a', 'b'], loader, 60);
      const result = await second.getOrLoadManyNs(
        'content:articles',
        ['b', 'c', 'a'],
        loader,
        60
      );

      expect(result).toEqual([{ id: 'b' }, { id: 'c' }, { id: 'a' }]);
      expect(loader.mock.calls).toEqual([[['a', 'b']], [['c']]]);
    });

    it('returns null for keys the loader did not find and asks again next time', async () => {
      const { first } = twoReplicas();
      const loader = vi.fn(async (ids: string[]) => ids.map(() => null));

      await expect(
        first.getOrLoadManyNs('content:articles', ['missing'], loader, 60)
      ).resolves.toEqual([null]);
      await first.getOrLoadManyNs('content:articles', ['missing'], loader, 60);

      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('keeps keys with different prefixes apart', async () => {
      const { first } = twoReplicas();

      await first.getOrLoadManyNs(
        'content:articles',
        ['a'],
        async ids => ids.map(id => `article ${id}`),
        60,
        'id:'
      );
      const revisions = await first.getOrLoadManyNs(
        'content:articles',
        ['a'],
        async ids => ids.map(id => `revisions of ${id}`),
        60,
        'revisions:'
      );

      expect(revisions).toEqual(['revisions of a']);
    });

    it('reads a batch from Dragonfly in one round trip', async () => {
      const { dragonfly, first, second } = twoReplicas();
      const loader = async (ids: string[]) => ids.map(id => ({ id }));

      await first.getOrLoadManyNs(
        'content:articles',
        ['a', 'b', 'c'],
        loader,
        60
      );
      const many = vi.spyOn(dragonfly, 'getManyRaw');
      const single = vi.spyOn(dragonfly, 'getRaw');
      const result = await second.getOrLoadManyNs(
        'content:articles',
        ['a', 'b', 'c'],
        vi.fn(),
        60
      );

      expect(result).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
      expect(many).toHaveBeenCalledTimes(1);
      expect(
        single.mock.calls.filter(([key]) => key.startsWith('val:'))
      ).toHaveLength(0);
    });

    it('does not call the loader when every key is cached', async () => {
      const { first } = twoReplicas();
      const loader = vi.fn(async (ids: string[]) => ids.map(id => ({ id })));

      await first.getOrLoadManyNs('content:articles', ['a'], loader, 60);
      await first.getOrLoadManyNs('content:articles', ['a'], loader, 60);

      expect(loader).toHaveBeenCalledTimes(1);
    });
  });

  describe('shared values', () => {
    it('lets another replica use a value without loading it again', async () => {
      const { first, second } = twoReplicas();
      const loader = vi.fn();

      await first.getOrLoadNs('navigations', 'main', () => ({ id: 'n1' }), 60);

      await expect(
        second.getOrLoadNs('navigations', 'main', loader, 60)
      ).resolves.toEqual({ id: 'n1' });
      expect(loader).not.toHaveBeenCalled();
    });

    it('keeps dates when another replica reads the value', async () => {
      const { first, second } = twoReplicas();
      const expiresAt = new Date('2030-01-01T00:00:00.000Z');

      await first.getOrLoadNs(
        'auth:sessions',
        'hash',
        () => ({ expiresAt }),
        30
      );
      const session = await second.getOrLoadNs<{ expiresAt: Date }>(
        'auth:sessions',
        'hash',
        vi.fn(),
        30
      );

      expect(session.expiresAt).toEqual(expiresAt);
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it('lets another replica read a value stored with setNs', async () => {
      const { first, second } = twoReplicas();

      await first.setNs('graphql:responses', 'query', { data: { a: 1 } }, 60);

      await expect(second.getNs('graphql:responses', 'query')).resolves.toEqual(
        { data: { a: 1 } }
      );
    });

    it.each(INTEGRATION_NAMESPACES)(
      'never puts %s values into Dragonfly',
      async namespace => {
        const { dragonfly, first } = twoReplicas();

        await first.getOrLoadNs(
          namespace,
          'provider',
          () => ({ id: 'provider', value: 'sk_live_secret' }),
          60
        );
        await first.setNs(namespace, 'other', { value: 'sk_live_secret' }, 60);

        expect(dragonfly.written.length).toBeGreaterThan(0);
        expect(JSON.stringify(dragonfly.written)).not.toContain(
          'sk_live_secret'
        );
      }
    );

    it('keeps a value with a secret field out of Dragonfly but still caches it', async () => {
      const { dragonfly, first } = twoReplicas();
      const loader = vi
        .fn()
        .mockResolvedValue({ mailchimp: { apiKey: 'sk_live_secret' } });

      await first.getOrLoadNs('website-settings', 'all', loader, 60);
      await first.getOrLoadNs('website-settings', 'all', loader, 60);

      expect(JSON.stringify(dragonfly.written)).not.toContain('sk_live_secret');
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('keeps values over 256 KB on the replica', async () => {
      const { dragonfly, first } = twoReplicas();
      const loader = vi.fn().mockResolvedValue('x'.repeat(300 * 1024));

      await first.getOrLoadNs('crowdfunding', 'subscriptions', loader, 60);
      await first.getOrLoadNs('crowdfunding', 'subscriptions', loader, 60);

      expect(dragonfly.written.some(([key]) => key.startsWith('val:'))).toBe(
        false
      );
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('asks Dragonfly for a value at most every two seconds', async () => {
      vi.useFakeTimers();
      const { dragonfly, first, second } = twoReplicas();
      const reads = vi.spyOn(dragonfly, 'getRaw');
      const valueReads = () =>
        reads.mock.calls.filter(([key]) => key.startsWith('val:')).length;

      await first.getOrLoadNs('navigations', 'main', () => 'nav', 60);
      reads.mockClear();
      await second.getOrLoadNs('navigations', 'main', vi.fn(), 60);
      await second.getOrLoadNs('navigations', 'main', vi.fn(), 60);

      expect(valueReads()).toBe(1);

      vi.advanceTimersByTime(2001);
      await second.getOrLoadNs('navigations', 'main', vi.fn(), 60);

      expect(valueReads()).toBe(2);
    });

    it('does not put empty results into Dragonfly', async () => {
      const { dragonfly, first } = twoReplicas();

      await first.getOrLoadNs('auth:sessions', 'unknown', () => null, 30);
      await first.getOrLoadNs('auth:sessions', 'missing', () => undefined, 30);

      expect(dragonfly.written.some(([key]) => key.startsWith('val:'))).toBe(
        false
      );
    });

    it('does not share values between releases, but shares their resets', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      vi.stubEnv('APP_RELEASE_ID', 'release-1');
      const oldPod = createReplica(dragonfly);
      vi.stubEnv('APP_RELEASE_ID', 'release-2');
      const newPod = createReplica(dragonfly);
      vi.unstubAllEnvs();
      const loader = vi.fn().mockResolvedValue('new shape');

      await oldPod.getOrLoadNs('content:articles', 'a', () => 'old shape', 60);

      await expect(
        newPod.getOrLoadNs('content:articles', 'a', loader, 60)
      ).resolves.toBe('new shape');

      vi.advanceTimersByTime(5);
      await oldPod.resetNamespace('content:articles');
      vi.advanceTimersByTime(2001);
      await newPod.getOrLoadNs('content:articles', 'a', loader, 60);

      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('shares nothing when no Dragonfly is configured', async () => {
      const memory = new MemoryAtomicStore();
      const writes = vi.spyOn(memory, 'setRaw');

      await createReplica(memory).getOrLoadNs(
        'navigations',
        'main',
        () => 1,
        60
      );

      expect(writes.mock.calls.some(([key]) => key.startsWith('val:'))).toBe(
        false
      );
    });
  });
});
