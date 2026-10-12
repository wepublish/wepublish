import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { KvAtomicStore } from './kv-ttl-cache-atomic-store';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const createReplica = (atomic: KvAtomicStore) =>
  new KvTtlCacheService(createCache(), atomic);

const nextTurn = () => new Promise(resolve => setTimeout(resolve, 0));

describe('KvTtlCacheService consistency', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('never stores a batch read before a reset under the version after it', async () => {
    const dragonfly = new FakeDragonfly();
    const editor = createReplica(dragonfly);
    let title = 'old';

    await editor.getOrLoadManyNs(
      'content:articles',
      ['a1'],
      async () => {
        const read = [title];
        title = 'new';
        await new Promise(resolve => setTimeout(resolve, 2));
        await editor.resetNamespace('content:articles');

        return read;
      },
      60,
      'id:'
    );

    await expect(
      createReplica(dragonfly).getOrLoadManyNs(
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
    const editor = createReplica(dragonfly);
    let title = 'old';

    await editor.getOrLoadNs(
      'content:articles',
      'slug:a1',
      async () => {
        const read = title;
        title = 'new';
        await new Promise(resolve => setTimeout(resolve, 2));
        await editor.resetNamespace('content:articles');

        return read;
      },
      60
    );

    await expect(
      createReplica(dragonfly).getOrLoadNs(
        'content:articles',
        'slug:a1',
        async () => title,
        60
      )
    ).resolves.toBe('new');
  });

  it('does not store a value whose entry was deleted while it was loading', async () => {
    const kv = createReplica(new FakeDragonfly());
    let votes = 1;
    let finishLoad!: () => void;
    const loading = new Promise<void>(resolve => (finishLoad = resolve));

    const first = kv.getOrLoadNs(
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
    await kv.delNs('content:polls', 'id:p1');
    finishLoad();
    await first;

    await expect(
      kv.getOrLoadNs('content:polls', 'id:p1', async () => votes, 60)
    ).resolves.toBe(2);
  });

  it('deletes an entry once more after other replicas caught up', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const dragonfly = new FakeDragonfly();
    const voter = createReplica(dragonfly);
    const reader = createReplica(dragonfly);
    let votes = 1;

    await voter.getNamespaceVersion('content:polls');
    await reader.getNamespaceVersion('content:polls');
    votes = 2;
    await voter.delNs('content:polls', 'id:p1');
    await reader.setNs('content:polls', 'id:p1', 1, 60);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(
      createReplica(dragonfly).getOrLoadNs(
        'content:polls',
        'id:p1',
        async () => votes,
        60
      )
    ).resolves.toBe(2);
  });

  it('deletes the entry stored under a version this replica has not seen yet', async () => {
    const dragonfly = new FakeDragonfly();
    const voter = createReplica(dragonfly);
    let votes = 1;

    await voter.getNamespaceVersion('content:polls');
    await createReplica(dragonfly).resetNamespace('content:polls');
    await createReplica(dragonfly).getOrLoadNs(
      'content:polls',
      'id:p1',
      async () => votes,
      60
    );
    votes = 2;
    await voter.delNs('content:polls', 'id:p1');

    await expect(
      createReplica(dragonfly).getOrLoadNs(
        'content:polls',
        'id:p1',
        async () => votes,
        60
      )
    ).resolves.toBe(2);
  });

  it('deletes once more under the version that is current by then', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    const dragonfly = new FakeDragonfly();
    const voter = createReplica(dragonfly);
    const reader = createReplica(dragonfly);
    let votes = 1;

    await voter.getNamespaceVersion('content:polls');
    votes = 2;
    await voter.delNs('content:polls', 'id:p1');
    await createReplica(dragonfly).resetNamespace('content:polls');
    await reader.setNs('content:polls', 'id:p1', 1, 60);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(
      createReplica(dragonfly).getOrLoadNs(
        'content:polls',
        'id:p1',
        async () => votes,
        60
      )
    ).resolves.toBe(2);
  });

  it('does not store a batch value whose entry was deleted while it was loading', async () => {
    const dragonfly = new FakeDragonfly();
    const kv = createReplica(dragonfly);
    let votes = 1;
    let finishLoad!: () => void;
    const loading = new Promise<void>(resolve => (finishLoad = resolve));

    const first = kv.getOrLoadManyNs(
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
    await kv.delNs('content:polls', 'id:p1');
    finishLoad();
    await first;

    await expect(
      createReplica(dragonfly).getOrLoadManyNs(
        'content:polls',
        ['p1'],
        async () => [votes],
        60,
        'id:'
      )
    ).resolves.toEqual([2]);
  });
});
