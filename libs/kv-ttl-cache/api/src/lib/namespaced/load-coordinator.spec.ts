import { LoadCoordinator } from './load-coordinator';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const nextTurn = () => new Promise(resolve => setTimeout(resolve, 0));

const inFlight = (coordinator: LoadCoordinator) =>
  (coordinator as unknown as { flights: Map<string, unknown> }).flights;

describe('LoadCoordinator', () => {
  describe('load', () => {
    it('runs the loader once for concurrent calls and gives every caller its result', async () => {
      const coordinator = new LoadCoordinator();
      const loading = deferred<string>();
      const loader = vi.fn(() => loading.promise);
      const store = vi.fn().mockResolvedValue(undefined);

      const first = coordinator.load('ns:a:v1:k', loader, store);
      const second = coordinator.load('ns:a:v1:k', loader, store);
      loading.resolve('value');

      await expect(first).resolves.toEqual('value');
      await expect(second).resolves.toEqual('value');
      expect(loader).toHaveBeenCalledTimes(1);
      expect(store).toHaveBeenCalledTimes(1);
      expect(store).toHaveBeenCalledWith('value');
    });

    it('stores before any caller gets the value', async () => {
      const coordinator = new LoadCoordinator();
      const calls: string[] = [];

      await coordinator.load(
        'ns:a:v1:k',
        async () => 'value',
        async () => {
          calls.push('stored');
        }
      );
      calls.push('answered');

      expect(calls).toEqual(['stored', 'answered']);
    });

    it('gives a rejection to every caller, stores nothing and loads again next time', async () => {
      const coordinator = new LoadCoordinator();
      const loading = deferred<string>();
      const store = vi.fn().mockResolvedValue(undefined);

      const first = coordinator.load('ns:a:v1:k', () => loading.promise, store);
      const second = coordinator.load(
        'ns:a:v1:k',
        () => Promise.resolve('unused'),
        store
      );
      loading.reject(new Error('database is gone'));

      await expect(first).rejects.toThrow('database is gone');
      await expect(second).rejects.toThrow('database is gone');
      expect(store).not.toHaveBeenCalled();
      await expect(
        coordinator.load('ns:a:v1:k', async () => 'again', store)
      ).resolves.toEqual('again');
    });

    it('does not store a value whose key was superseded while it was loading', async () => {
      const coordinator = new LoadCoordinator();
      const loading = deferred<number>();
      const store = vi.fn().mockResolvedValue(undefined);

      const first = coordinator.load(
        'ns:polls:v1:p1',
        () => loading.promise,
        store
      );
      await nextTurn();
      coordinator.supersede(['ns:polls:v1:p1']);
      loading.resolve(1);

      await expect(first).resolves.toEqual(1);
      expect(store).not.toHaveBeenCalled();
    });

    it('starts a fresh load after a supersede and keeps it when the old one settles', async () => {
      const coordinator = new LoadCoordinator();
      const old = deferred<number>();
      const fresh = deferred<number>();
      const stored: number[] = [];
      const store = async (value: number) => {
        stored.push(value);
      };

      const first = coordinator.load('k', () => old.promise, store);
      coordinator.supersede(['k']);
      const second = coordinator.load('k', () => fresh.promise, store);
      old.resolve(1);
      await first;
      const third = coordinator.load('k', async () => 3, store);
      fresh.resolve(2);

      await expect(second).resolves.toEqual(2);
      await expect(third).resolves.toEqual(2);
      expect(stored).toEqual([2]);
    });

    it('keeps nothing once a load has settled', async () => {
      const coordinator = new LoadCoordinator();

      await coordinator.load(
        'a',
        async () => 1,
        async () => undefined
      );
      await coordinator
        .load(
          'b',
          () => Promise.reject(new Error('x')),
          async () => undefined
        )
        .catch(() => undefined);
      const superseded = coordinator.load(
        'c',
        async () => 1,
        async () => undefined
      );
      coordinator.supersede(['c', 'never-loaded']);
      await superseded;

      expect(inFlight(coordinator).size).toBe(0);
    });
  });

  describe('loadMany', () => {
    it('loads the missing keys in one call and answers in input order', async () => {
      const coordinator = new LoadCoordinator();
      const loader = vi.fn(async (keys: string[]) =>
        keys.map(key => `v${key}`)
      );
      const store = vi.fn().mockResolvedValue(undefined);

      const results = await coordinator.loadMany(
        [
          { fullKey: 'ns:x:v1:id:a', key: 'a' },
          { fullKey: 'ns:x:v1:id:b', key: 'b' },
        ],
        loader,
        store
      );

      expect(results).toEqual(['va', 'vb']);
      expect(loader.mock.calls).toEqual([[['a', 'b']]]);
      expect(store.mock.calls).toEqual([
        ['ns:x:v1:id:a', 'va'],
        ['ns:x:v1:id:b', 'vb'],
      ]);
    });

    it('loads a key that appears twice only once', async () => {
      const coordinator = new LoadCoordinator();
      const loader = vi.fn(async (keys: string[]) =>
        keys.map(key => `v${key}`)
      );
      const store = vi.fn().mockResolvedValue(undefined);

      const results = await coordinator.loadMany(
        [
          { fullKey: 'ns:x:v1:a', key: 'a' },
          { fullKey: 'ns:x:v1:b', key: 'b' },
          { fullKey: 'ns:x:v1:a', key: 'a' },
        ],
        loader,
        store
      );

      expect(results).toEqual(['va', 'vb', 'va']);
      expect(loader.mock.calls).toEqual([[['a', 'b']]]);
      expect(store).toHaveBeenCalledTimes(2);
    });

    it('fills what the loader did not answer with null and stores no null', async () => {
      const coordinator = new LoadCoordinator();
      const store = vi.fn().mockResolvedValue(undefined);

      const results = await coordinator.loadMany(
        [
          { fullKey: 'a', key: 'a' },
          { fullKey: 'b', key: 'b' },
          { fullKey: 'c', key: 'c' },
        ],
        async () => ['va', null],
        store
      );

      expect(results).toEqual(['va', null, null]);
      expect(store.mock.calls).toEqual([['a', 'va']]);
    });

    it('joins a single load already in flight instead of loading the key again', async () => {
      const coordinator = new LoadCoordinator();
      const single = deferred<string>();
      const loader = vi.fn(async (keys: string[]) =>
        keys.map(key => `v${key}`)
      );

      const pending = coordinator.load(
        'ns:x:v1:a',
        () => single.promise,
        async () => undefined
      );
      const batch = coordinator.loadMany(
        [
          { fullKey: 'ns:x:v1:a', key: 'a' },
          { fullKey: 'ns:x:v1:b', key: 'b' },
        ],
        loader,
        async () => undefined
      );
      single.resolve('single a');

      await expect(batch).resolves.toEqual(['single a', 'vb']);
      await pending;
      expect(loader.mock.calls).toEqual([[['b']]]);
    });

    it('lets a single load join a batch in flight', async () => {
      const coordinator = new LoadCoordinator();
      const batch = deferred<Array<string | null>>();
      const single = vi.fn(async () => 'single');

      const loading = coordinator.loadMany(
        [{ fullKey: 'ns:x:v1:a', key: 'a' }],
        () => batch.promise,
        async () => undefined
      );
      const joined = coordinator.load(
        'ns:x:v1:a',
        single,
        async () => undefined
      );
      batch.resolve(['batch a']);

      await expect(joined).resolves.toEqual('batch a');
      await loading;
      expect(single).not.toHaveBeenCalled();
    });

    it('does not store a batch value whose key was superseded while it was loading', async () => {
      const coordinator = new LoadCoordinator();
      const loading = deferred<Array<number | null>>();
      const store = vi.fn().mockResolvedValue(undefined);

      const batch = coordinator.loadMany(
        [
          { fullKey: 'ns:polls:v1:id:p1', key: 'p1' },
          { fullKey: 'ns:polls:v1:id:p2', key: 'p2' },
        ],
        () => loading.promise,
        store
      );
      await nextTurn();
      coordinator.supersede(['ns:polls:v1:id:p1']);
      loading.resolve([1, 2]);

      await expect(batch).resolves.toEqual([1, 2]);
      expect(store.mock.calls).toEqual([['ns:polls:v1:id:p2', 2]]);
    });

    it('gives a batch rejection to every caller and keeps nothing', async () => {
      const coordinator = new LoadCoordinator();
      const loading = deferred<Array<string | null>>();

      const batch = coordinator.loadMany(
        [
          { fullKey: 'a', key: 'a' },
          { fullKey: 'b', key: 'b' },
        ],
        () => loading.promise,
        async () => undefined
      );
      const joined = coordinator.load(
        'b',
        async () => 'unused',
        async () => undefined
      );
      loading.reject(new Error('database is gone'));

      await expect(batch).rejects.toThrow('database is gone');
      await expect(joined).rejects.toThrow('database is gone');
      expect(inFlight(coordinator).size).toBe(0);
    });

    it('keeps nothing once a batch has settled', async () => {
      const coordinator = new LoadCoordinator();

      await coordinator.loadMany(
        [
          { fullKey: 'a', key: 'a' },
          { fullKey: 'b', key: 'b' },
        ],
        async keys => keys,
        async () => undefined
      );

      expect(inFlight(coordinator).size).toBe(0);
    });

    it('asks the loader nothing for an empty batch', async () => {
      const coordinator = new LoadCoordinator();
      const loader = vi.fn(async () => []);

      await expect(
        coordinator.loadMany([], loader, async () => undefined)
      ).resolves.toEqual([]);
      expect(loader).not.toHaveBeenCalled();
    });
  });
});
