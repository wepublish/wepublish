import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { KvAtomicStore, MemoryAtomicStore } from './kv-ttl-cache-atomic-store';
import { FakeDragonfly } from './kv-ttl-cache.testing';

class RefusingDragonfly extends FakeDragonfly {
  override async ping() {
    return true;
  }

  override async setRaw() {
    return false;
  }
}

class PausedDragonfly extends FakeDragonfly {
  override isAvailable() {
    return false;
  }

  override async setRaw() {
    return false;
  }

  override async probe() {
    return true;
  }
}

const createReplica = (atomic: KvAtomicStore) =>
  new KvTtlCacheService(createCache(), atomic);

describe('KvTtlCacheService dragonflyStatus', () => {
  it('reports Dragonfly reachable while it answers', async () => {
    await expect(
      createReplica(new FakeDragonfly()).dragonflyStatus()
    ).resolves.toBe('reachable');
  });

  it('reports Dragonfly unreachable while it does not answer', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.down = true;

    await expect(createReplica(dragonfly).dragonflyStatus()).resolves.toBe(
      'unreachable'
    );
  });

  it('reports Dragonfly reachable when it answers the probe, even while this replica still pauses its other commands after a slow answer', async () => {
    await expect(
      createReplica(new PausedDragonfly()).dragonflyStatus()
    ).resolves.toBe('reachable');
  });

  it('reports Dragonfly unreachable when it answers PING but refuses writes, like a wrong prefix or a full Dragonfly', async () => {
    const dragonfly = new RefusingDragonfly();

    await expect(createReplica(dragonfly).dragonflyStatus()).resolves.toBe(
      'unreachable'
    );
  });

  it('reports a missing REDIS_URL', async () => {
    await expect(
      createReplica(new MemoryAtomicStore()).dragonflyStatus()
    ).resolves.toBe('not-configured');
  });
});
