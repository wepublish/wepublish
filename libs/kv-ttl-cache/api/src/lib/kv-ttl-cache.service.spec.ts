import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { KvAtomicStore, MemoryAtomicStore } from './kv-ttl-cache-atomic-store';

const createReplica = (atomic: KvAtomicStore) =>
  new KvTtlCacheService(createCache(), atomic);

class UnavailableAtomicStore implements KvAtomicStore {
  async setIfAbsent() {
    return true;
  }

  async getRaw() {
    return undefined;
  }

  async setRaw() {
    return;
  }

  async delRaw() {
    return;
  }

  async disconnect() {
    return;
  }
}

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

    it('never puts cached values into the shared store', async () => {
      const atomic = new MemoryAtomicStore();
      const writes = [
        vi.spyOn(atomic, 'setIfAbsent'),
        vi.spyOn(atomic, 'setRaw'),
      ];

      await createReplica(atomic).getOrLoadNs(
        'settings:paymentprovider',
        'stripe',
        () => ({ apiKey: 'sk_live_secret' }),
        60
      );

      const written = writes.flatMap(spy =>
        spy.mock.calls.map(call => JSON.stringify(call))
      );

      expect(written.length).toBeGreaterThan(0);
      expect(written.some(call => call.includes('sk_live_secret'))).toBe(false);
    });
  });
});
