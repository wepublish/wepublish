import { Logger } from '@nestjs/common';
import {
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '../testing/create-namespaced-cache-testing';

const SHARED = [
  'content:articles',
  'content:images',
  'content:polls',
  'navigations',
  'website-settings',
  'crowdfunding',
];

const INTEGRATION_NAMESPACES = [
  'settings:paymentprovider',
  'settings:mailprovider',
  'settings:challenge',
  'settings:tracking-pixel',
  'settings:ai',
  'settings:analyticsprovider',
  'settings:syncprovider',
];

const START = new Date('2026-10-02T10:00:00.000Z').getTime();

const valueWrites = (dragonfly: FakeDragonfly) =>
  dragonfly.commands.filter(
    ([command, key]) =>
      command === 'SET' && !key.startsWith('nsv:') && key !== 'health'
  );

const valueReads = (dragonfly: FakeDragonfly) =>
  dragonfly.commands.filter(
    ([command, key]) =>
      (command === 'GET' && !key.startsWith('nsv:')) || command === 'MGET'
  );

describe('VersionedCache', () => {
  const harnesses: NamespacedCacheTesting[] = [];

  const createReplica = async (
    connection: DragonflyConnection,
    {
      sharedNamespaces = SHARED,
      releaseId,
    }: { sharedNamespaces?: string[]; releaseId?: string } = {}
  ) => {
    const harness = await createNamespacedCacheTesting({
      connection,
      sharedNamespaces,
      releaseId,
    });
    harnesses.push(harness);

    return harness;
  };

  const twoReplicas = async () => {
    const dragonfly = new FakeDragonfly();

    return {
      dragonfly,
      first: (await createReplica(dragonfly)).cache,
      second: (await createReplica(dragonfly)).cache,
    };
  };

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await Promise.all(harnesses.splice(0).map(harness => harness.close()));
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getOrLoadNs', () => {
    it('lets another replica use a value without loading it again', async () => {
      const { first, second } = await twoReplicas();
      const loader = vi.fn();

      await first.getOrLoadNs('navigations', 'main', () => ({ id: 'n1' }), 60);

      await expect(
        second.getOrLoadNs('navigations', 'main', loader, 60)
      ).resolves.toEqual({ id: 'n1' });
      expect(loader).not.toHaveBeenCalled();
    });

    it('keeps dates when another replica reads the value', async () => {
      const { first, second } = await twoReplicas();
      const expiresAt = new Date('2030-01-01T00:00:00.000Z');

      await first.getOrLoadNs(
        'content:articles',
        'hash',
        () => ({ expiresAt }),
        30
      );
      const session = await second.getOrLoadNs<{ expiresAt: Date }>(
        'content:articles',
        'hash',
        vi.fn(),
        30
      );

      expect(session.expiresAt).toEqual(expiresAt);
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it('asks Dragonfly for a value at most every two seconds', async () => {
      vi.useFakeTimers();
      const { dragonfly, first, second } = await twoReplicas();

      await first.getOrLoadNs('navigations', 'main', () => 'nav', 60);
      dragonfly.commands.length = 0;
      await second.getOrLoadNs('navigations', 'main', vi.fn(), 60);
      await second.getOrLoadNs('navigations', 'main', vi.fn(), 60);

      expect(valueReads(dragonfly)).toHaveLength(1);

      vi.advanceTimersByTime(2001);
      await second.getOrLoadNs('navigations', 'main', vi.fn(), 60);

      expect(valueReads(dragonfly)).toHaveLength(2);
    });

    it('runs the loader once for concurrent lookups on one replica', async () => {
      const { first } = await twoReplicas();
      let finishLoad!: () => void;
      const loading = new Promise<void>(resolve => (finishLoad = resolve));
      const loader = vi.fn(async () => {
        await loading;

        return { id: '1' };
      });

      const lookups = Promise.all([
        first.getOrLoadNs('content:articles', 'id:1', loader, 60),
        first.getOrLoadNs('content:articles', 'id:1', loader, 60),
      ]);
      await new Promise(resolve => setTimeout(resolve, 0));
      finishLoad();

      await expect(lookups).resolves.toEqual([{ id: '1' }, { id: '1' }]);
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['a shared namespace', 'content:articles'],
      ['a namespace kept in memory', 'auth:sessions'],
    ])('does not count null as cached in %s', async (_, namespace) => {
      const { dragonfly, first } = await twoReplicas();
      const loader = vi.fn().mockResolvedValue(null);

      await expect(
        first.getOrLoadNs(namespace, 'unknown', loader, 30)
      ).resolves.toBeNull();
      await first.getOrLoadNs(namespace, 'unknown', loader, 30);

      expect(loader).toHaveBeenCalledTimes(2);
      expect(valueWrites(dragonfly)).toHaveLength(0);
    });

    it.each([[0], [''], [false]])(
      'counts the falsy value %j as cached',
      async value => {
        const { first, second } = await twoReplicas();
        const loader = vi.fn().mockResolvedValue(value);

        await first.getOrLoadNs('content:articles', 'flag', loader, 30);
        await first.getOrLoadNs('content:articles', 'flag', loader, 30);
        await expect(
          second.getOrLoadNs('content:articles', 'flag', loader, 30)
        ).resolves.toBe(value);

        expect(loader).toHaveBeenCalledTimes(1);
      }
    );

    it('does not put empty results into Dragonfly', async () => {
      const { dragonfly, first } = await twoReplicas();

      await first.getOrLoadNs('content:articles', 'unknown', () => null, 30);
      await first.getOrLoadNs(
        'content:articles',
        'missing',
        () => undefined,
        30
      );

      expect(valueWrites(dragonfly)).toHaveLength(0);
    });

    it.each(INTEGRATION_NAMESPACES)(
      'never puts %s values into Dragonfly',
      async namespace => {
        const { dragonfly, first } = await twoReplicas();

        await first.getOrLoadNs(
          namespace,
          'provider',
          () => ({ id: 'provider', value: 'sk_live_secret' }),
          60
        );
        await first.setNs(namespace, 'other', { value: 'sk_live_secret' }, 60);

        expect(dragonfly.commands.length).toBeGreaterThan(0);
        expect(JSON.stringify(dragonfly.commands)).not.toContain(
          'sk_live_secret'
        );
      }
    );

    it('keeps a value with a secret field out of Dragonfly but still caches it', async () => {
      const { dragonfly, first } = await twoReplicas();
      const loader = vi
        .fn()
        .mockResolvedValue({ mailchimp: { apiKey: 'sk_live_secret' } });

      await first.getOrLoadNs('website-settings', 'all', loader, 60);
      await first.getOrLoadNs('website-settings', 'all', loader, 60);

      expect(JSON.stringify(dragonfly.commands)).not.toContain(
        'sk_live_secret'
      );
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('keeps values over 256 KB on the replica', async () => {
      const { dragonfly, first } = await twoReplicas();
      const loader = vi.fn().mockResolvedValue('x'.repeat(300 * 1024));

      await first.getOrLoadNs('crowdfunding', 'subscriptions', loader, 60);
      await first.getOrLoadNs('crowdfunding', 'subscriptions', loader, 60);

      expect(valueWrites(dragonfly)).toHaveLength(0);
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('does not share values between releases, but shares their resets', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const oldPod = await createReplica(dragonfly, { releaseId: 'release-1' });
      const newPod = await createReplica(dragonfly, { releaseId: 'release-2' });
      const loader = vi.fn().mockResolvedValue('new shape');

      await oldPod.cache.getOrLoadNs(
        'content:articles',
        'a',
        () => 'old shape',
        60
      );

      await expect(
        newPod.cache.getOrLoadNs('content:articles', 'a', loader, 60)
      ).resolves.toBe('new shape');

      vi.advanceTimersByTime(5);
      await oldPod.resets.reset('content:articles');
      vi.advanceTimersByTime(2001);
      await newPod.cache.getOrLoadNs('content:articles', 'a', loader, 60);

      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('shares nothing when no Dragonfly is configured', async () => {
      const memory = new MemoryDragonflyConnection();
      const writes = vi.spyOn(memory, 'set');
      const { cache } = await createReplica(memory);
      const loader = vi.fn().mockResolvedValue(1);

      await cache.getOrLoadNs('navigations', 'main', loader, 60);
      await cache.getOrLoadNs('navigations', 'main', loader, 60);

      expect(
        writes.mock.calls.filter(([key]) => !key.startsWith('nsv:'))
      ).toHaveLength(0);
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('keeps caching in memory while Dragonfly is unavailable', async () => {
      const dragonfly = new FakeDragonfly();
      dragonfly.down();
      const { cache } = await createReplica(dragonfly);
      const loader = vi.fn().mockResolvedValue('loaded');

      await cache.getOrLoadNs('navigations', 'main', loader, 60);
      vi.useFakeTimers();
      vi.advanceTimersByTime(5000);
      await cache.getOrLoadNs('navigations', 'main', loader, 60);

      expect(loader).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOrLoadManyNs', () => {
    it('loads only the keys no replica has cached yet, in one call', async () => {
      const { first, second } = await twoReplicas();
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
      const { dragonfly, first } = await twoReplicas();
      const loader = vi.fn(async (ids: string[]) => ids.map(() => null));

      await expect(
        first.getOrLoadManyNs('content:articles', ['missing'], loader, 60)
      ).resolves.toEqual([null]);
      await first.getOrLoadManyNs('content:articles', ['missing'], loader, 60);

      expect(loader).toHaveBeenCalledTimes(2);
      expect(valueWrites(dragonfly)).toHaveLength(0);
    });

    it('answers null for the keys a short loader answer leaves out', async () => {
      const { first } = await twoReplicas();
      const loader = vi.fn(async () => [{ id: 'a' }]);

      await expect(
        first.getOrLoadManyNs('content:articles', ['a', 'b', 'c'], loader, 60)
      ).resolves.toEqual([{ id: 'a' }, null, null]);
      await first.getOrLoadManyNs('content:articles', ['a', 'b'], loader, 60);

      expect(loader.mock.calls).toEqual([[['a', 'b', 'c']], [['b']]]);
    });

    it('keeps keys with different prefixes apart', async () => {
      const { first } = await twoReplicas();

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

    it('shares a batch value with a single lookup under the same prefixed key', async () => {
      const { first, second } = await twoReplicas();
      const loader = vi.fn();

      await first.getOrLoadManyNs(
        'content:articles',
        ['a'],
        async ids => ids.map(id => ({ id })),
        60,
        'id:'
      );

      await expect(
        second.getOrLoadNs('content:articles', 'id:a', loader, 60)
      ).resolves.toEqual({ id: 'a' });
      expect(loader).not.toHaveBeenCalled();
    });

    it('reads a batch from Dragonfly in one round trip', async () => {
      const { dragonfly, first, second } = await twoReplicas();
      const loader = async (ids: string[]) => ids.map(id => ({ id }));

      await first.getOrLoadManyNs(
        'content:articles',
        ['a', 'b', 'c'],
        loader,
        60
      );
      dragonfly.commands.length = 0;
      const result = await second.getOrLoadManyNs(
        'content:articles',
        ['a', 'b', 'c'],
        vi.fn(),
        60
      );

      expect(result).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
      expect(valueReads(dragonfly).map(([command]) => command)).toEqual([
        'MGET',
      ]);
    });

    it('does not call the loader when every key is cached', async () => {
      const { first } = await twoReplicas();
      const loader = vi.fn(async (ids: string[]) => ids.map(id => ({ id })));

      await first.getOrLoadManyNs('content:articles', ['a'], loader, 60);
      await first.getOrLoadManyNs('content:articles', ['a'], loader, 60);

      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('loads a key that appears twice in a batch once', async () => {
      const { first } = await twoReplicas();
      const loader = vi.fn(async (ids: string[]) => ids.map(id => ({ id })));

      await expect(
        first.getOrLoadManyNs('content:articles', ['a', 'b', 'a'], loader, 60)
      ).resolves.toEqual([{ id: 'a' }, { id: 'b' }, { id: 'a' }]);
      expect(loader.mock.calls).toEqual([[['a', 'b']]]);
    });

    it('joins a lookup of the same key that is already loading', async () => {
      const { first } = await twoReplicas();
      let finishLoad!: () => void;
      const loading = new Promise<void>(resolve => (finishLoad = resolve));
      const single = vi.fn(async () => {
        await loading;

        return { id: 'a', from: 'single' };
      });
      const batch = vi.fn(async (ids: string[]) => ids.map(id => ({ id })));

      const pending = first.getOrLoadNs('content:articles', 'a', single, 60);
      await new Promise(resolve => setTimeout(resolve, 0));
      const many = first.getOrLoadManyNs(
        'content:articles',
        ['a', 'b'],
        batch,
        60
      );
      await new Promise(resolve => setTimeout(resolve, 0));
      finishLoad();

      await expect(many).resolves.toEqual([
        { id: 'a', from: 'single' },
        { id: 'b' },
      ]);
      await pending;
      expect(batch.mock.calls).toEqual([[['b']]]);
    });
  });

  describe('getNs, setNs', () => {
    it('lets another replica read a value stored with setNs', async () => {
      const { first, second } = await twoReplicas();

      await first.setNs('navigations', 'query', { data: { a: 1 } }, 60);

      await expect(second.getNs('navigations', 'query')).resolves.toEqual({
        data: { a: 1 },
      });
    });

    it('answers undefined for a value nobody stored', async () => {
      const { first } = await twoReplicas();

      await expect(first.getNs('navigations', 'missing')).resolves.toBe(
        undefined
      );
    });

    it('stores no null or undefined with setNs', async () => {
      const { dragonfly, first } = await twoReplicas();

      await first.setNs('navigations', 'a', null, 60);
      await first.setNs('navigations', 'b', undefined, 60);

      expect(valueWrites(dragonfly)).toHaveLength(0);
      await expect(first.getNs('navigations', 'a')).resolves.toBe(undefined);
    });

    it('keeps a value stored with setNs for its ttl', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const { first } = await twoReplicas();

      await first.setNs('auth:sessions', 'user:x', { id: 'session' }, 60);
      vi.setSystemTime(START + 59_000);
      await expect(first.getNs('auth:sessions', 'user:x')).resolves.toEqual({
        id: 'session',
      });

      vi.setSystemTime(START + 61_000);
      await expect(first.getNs('auth:sessions', 'user:x')).resolves.toBe(
        undefined
      );
    });
  });

  describe('ttlSeconds', () => {
    it.each([[0], [-1], [Number.NaN], [Number.POSITIVE_INFINITY]])(
      'refuses %s seconds',
      async ttlSeconds => {
        const { dragonfly, first } = await twoReplicas();
        const loader = vi.fn();
        dragonfly.commands.length = 0;

        await expect(
          first.getOrLoadNs('content:articles', 'a', loader, ttlSeconds)
        ).rejects.toThrow(RangeError);
        await expect(
          first.getOrLoadManyNs('content:articles', ['a'], loader, ttlSeconds)
        ).rejects.toThrow(RangeError);
        await expect(
          first.setNs('content:articles', 'a', 1, ttlSeconds)
        ).rejects.toThrow(RangeError);

        expect(loader).not.toHaveBeenCalled();
        expect(dragonfly.commands).toEqual([]);
      }
    );
  });

  describe('while Dragonfly is unreachable', () => {
    it('keeps a value that could not reach Dragonfly for at most 30 s, so a revoked session does not live on for minutes', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const dragonfly = new FakeDragonfly();
      dragonfly.down();
      const { cache } = await createReplica(dragonfly);
      const loader = vi.fn().mockResolvedValue({ id: 'session' });

      await cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
      vi.setSystemTime(START + 29_000);
      await cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
      expect(loader).toHaveBeenCalledTimes(1);

      vi.setSystemTime(START + 31_000);
      await cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('keeps a shared value that could not reach Dragonfly for at most 30 s', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const dragonfly = new FakeDragonfly();
      const { cache } = await createReplica(dragonfly);
      await cache.getNs('content:articles', 'warm-up');
      dragonfly.down();
      const loader = vi.fn().mockResolvedValue({ id: 'a' });

      await cache.getOrLoadNs('content:articles', 'a', loader, 300);
      vi.setSystemTime(START + 29_000);
      await cache.getOrLoadNs('content:articles', 'a', loader, 300);
      expect(loader).toHaveBeenCalledTimes(1);

      vi.setSystemTime(START + 31_000);
      await cache.getOrLoadNs('content:articles', 'a', loader, 300);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('never puts a session into Dragonfly', async () => {
      const dragonfly = new FakeDragonfly();
      const { cache } = await createReplica(dragonfly);

      await cache.getOrLoadNs(
        'auth:sessions',
        'user:x',
        () => ({ id: 'session', email: 'reader@example.com' }),
        300
      );

      expect(valueWrites(dragonfly)).toHaveLength(0);
      expect(JSON.stringify(dragonfly.commands)).not.toContain(
        'reader@example.com'
      );
    });

    it('drops a session cached before Dragonfly became unreachable within a minute, so a logout on another replica takes effect', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const dragonfly = new FakeDragonfly();
      const { cache } = await createReplica(dragonfly);
      const loader = vi.fn().mockResolvedValue({ id: 'session' });

      await cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
      dragonfly.down();
      await (await createReplica(dragonfly)).resets.reset('auth:sessions');

      vi.setSystemTime(START + 10_000);
      await cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
      expect(loader).toHaveBeenCalledTimes(1);

      vi.setSystemTime(START + 65_000);
      await cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('keeps sessions for their full ttl while Dragonfly is reachable', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const { cache } = await createReplica(new FakeDragonfly());
      const loader = vi.fn().mockResolvedValue({ id: 'session' });

      await cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
      vi.setSystemTime(START + 250_000);
      await cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);

      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('keeps the full ttl for values kept local on purpose, like oversized ones', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
      const { cache } = await createReplica(new FakeDragonfly());
      const loader = vi.fn().mockResolvedValue('x'.repeat(300 * 1024));

      await cache.getOrLoadNs('content:articles', 'list:big', loader, 300);
      vi.setSystemTime(START + 60_000);
      await cache.getOrLoadNs('content:articles', 'list:big', loader, 300);

      expect(loader).toHaveBeenCalledTimes(1);
    });
  });
});
