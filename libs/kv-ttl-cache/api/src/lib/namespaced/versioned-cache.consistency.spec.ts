import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '../testing/create-namespaced-cache-testing';

const SHARED = ['content:articles', 'content:polls'];

const nextTurn = () => new Promise(resolve => setTimeout(resolve, 0));

describe('VersionedCache consistency', () => {
  const harnesses: NamespacedCacheTesting[] = [];

  const createReplica = async (dragonfly: FakeDragonfly) => {
    const harness = await createNamespacedCacheTesting({
      connection: dragonfly,
      sharedNamespaces: SHARED,
    });
    harnesses.push(harness);

    return harness;
  };

  afterEach(async () => {
    await Promise.all(harnesses.splice(0).map(harness => harness.close()));
    vi.useRealTimers();
  });

  it('never stores a batch read before a reset under the version after it', async () => {
    const dragonfly = new FakeDragonfly();
    const editor = await createReplica(dragonfly);
    let title = 'old';

    await editor.cache.getOrLoadManyNs(
      'content:articles',
      ['a1'],
      async () => {
        const read = [title];
        title = 'new';
        await new Promise(resolve => setTimeout(resolve, 2));
        await editor.resets.reset('content:articles');

        return read;
      },
      60,
      'id:'
    );

    await expect(
      (await createReplica(dragonfly)).cache.getOrLoadManyNs(
        'content:articles',
        ['a1'],
        async () => [title],
        60,
        'id:'
      )
    ).resolves.toEqual(['new']);
  });

  it('never stores a single value read before a reset under the version after it', async () => {
    const dragonfly = new FakeDragonfly();
    const editor = await createReplica(dragonfly);
    let title = 'old';

    await editor.cache.getOrLoadNs(
      'content:articles',
      'slug:a1',
      async () => {
        const read = title;
        title = 'new';
        await new Promise(resolve => setTimeout(resolve, 2));
        await editor.resets.reset('content:articles');

        return read;
      },
      60
    );

    await expect(
      (await createReplica(dragonfly)).cache.getOrLoadNs(
        'content:articles',
        'slug:a1',
        async () => title,
        60
      )
    ).resolves.toBe('new');
  });

  it('does not store a value whose entry was deleted while it was loading', async () => {
    const { cache } = await createReplica(new FakeDragonfly());
    let votes = 1;
    let finishLoad!: () => void;
    const loading = new Promise<void>(resolve => (finishLoad = resolve));

    const first = cache.getOrLoadNs(
      'content:polls',
      'id:p1',
      async () => {
        const read = votes;
        await loading;

        return read;
      },
      60
    );
    await nextTurn();
    votes = 2;
    await cache.delNs('content:polls', 'id:p1');
    finishLoad();
    await first;

    await expect(
      cache.getOrLoadNs('content:polls', 'id:p1', async () => votes, 60)
    ).resolves.toBe(2);
  });

  it('deletes an entry once more after other replicas caught up', async () => {
    const dragonfly = new FakeDragonfly();
    const voter = await createReplica(dragonfly);
    const reader = await createReplica(dragonfly);
    const later = await createReplica(dragonfly);
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    let votes = 1;

    await voter.versions.current('content:polls');
    await reader.versions.current('content:polls');
    votes = 2;
    await voter.cache.delNs('content:polls', 'id:p1');
    await reader.cache.setNs('content:polls', 'id:p1', 1, 60);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(
      later.cache.getOrLoadNs('content:polls', 'id:p1', async () => votes, 60)
    ).resolves.toBe(2);
  });

  it('deletes the entry stored under a version this replica has not seen yet', async () => {
    const dragonfly = new FakeDragonfly();
    const voter = await createReplica(dragonfly);
    let votes = 1;

    await voter.versions.current('content:polls');
    await (await createReplica(dragonfly)).resets.reset('content:polls');
    await (
      await createReplica(dragonfly)
    ).cache.getOrLoadNs('content:polls', 'id:p1', async () => votes, 60);
    votes = 2;
    await voter.cache.delNs('content:polls', 'id:p1');

    await expect(
      (await createReplica(dragonfly)).cache.getOrLoadNs(
        'content:polls',
        'id:p1',
        async () => votes,
        60
      )
    ).resolves.toBe(2);
  });

  it('deletes once more under the version that is current by then', async () => {
    const dragonfly = new FakeDragonfly();
    const voter = await createReplica(dragonfly);
    const reader = await createReplica(dragonfly);
    const editor = await createReplica(dragonfly);
    const later = await createReplica(dragonfly);
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    let votes = 1;

    await voter.versions.current('content:polls');
    votes = 2;
    await voter.cache.delNs('content:polls', 'id:p1');
    await editor.resets.reset('content:polls');
    await reader.cache.setNs('content:polls', 'id:p1', 1, 60);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(
      later.cache.getOrLoadNs('content:polls', 'id:p1', async () => votes, 60)
    ).resolves.toBe(2);
  });

  it('does not store a batch value whose entry was deleted while it was loading', async () => {
    const dragonfly = new FakeDragonfly();
    const { cache } = await createReplica(dragonfly);
    let votes = 1;
    let finishLoad!: () => void;
    const loading = new Promise<void>(resolve => (finishLoad = resolve));

    const first = cache.getOrLoadManyNs(
      'content:polls',
      ['p1'],
      async () => {
        const read = [votes];
        await loading;

        return read;
      },
      60,
      'id:'
    );
    await nextTurn();
    votes = 2;
    await cache.delNs('content:polls', 'id:p1');
    finishLoad();
    await first;

    await expect(
      (await createReplica(dragonfly)).cache.getOrLoadManyNs(
        'content:polls',
        ['p1'],
        async () => [votes],
        60,
        'id:'
      )
    ).resolves.toEqual([2]);
  });

  it('asks Dragonfly for no version when deleting from a namespace kept on this replica', async () => {
    const dragonfly = new FakeDragonfly();
    const { cache, versions } = await createReplica(dragonfly);
    await versions.current('auth:sessions');
    dragonfly.commands.length = 0;

    await cache.delNs('auth:sessions', 'user:x');

    expect(
      dragonfly.commands.filter(([, key]) => key.startsWith('nsv:'))
    ).toEqual([]);
  });

  it('deletes from a namespace kept on this replica only on this replica', async () => {
    const dragonfly = new FakeDragonfly();
    const first = await createReplica(dragonfly);
    const second = await createReplica(dragonfly);
    const loader = vi.fn().mockResolvedValue({ id: 'session' });

    await first.cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    await second.cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    await first.cache.delNs('auth:sessions', 'user:x');

    await first.cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);
    await second.cache.getOrLoadNs('auth:sessions', 'user:x', loader, 300);

    expect(loader).toHaveBeenCalledTimes(3);
  });

  it('deletes a shared value on every replica that reads Dragonfly', async () => {
    const dragonfly = new FakeDragonfly();
    const first = await createReplica(dragonfly);
    const loader = vi.fn().mockResolvedValue({ votes: 1 });

    await first.cache.getOrLoadNs('content:polls', 'id:p1', loader, 60);
    await first.cache.delNs('content:polls', 'id:p1');

    await (
      await createReplica(dragonfly)
    ).cache.getOrLoadNs('content:polls', 'id:p1', loader, 60);

    expect(loader).toHaveBeenCalledTimes(2);
  });
});
