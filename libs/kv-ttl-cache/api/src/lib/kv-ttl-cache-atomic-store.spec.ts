import type { RedisClientType } from '@keyv/redis';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  DragonflyAtomicStore,
  KvAtomicStore,
  MemoryAtomicStore,
  createKvAtomicStore,
} from './kv-ttl-cache-atomic-store';

describe('MemoryAtomicStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only sets a key that is not there yet', async () => {
    const store = new MemoryAtomicStore();

    await expect(store.setIfAbsent('key', 'first')).resolves.toBe(true);
    await expect(store.setIfAbsent('key', 'second')).resolves.toBe(false);
    await expect(store.getRaw('key')).resolves.toBe('first');
  });

  it('forgets a key after its time to live', async () => {
    const store = new MemoryAtomicStore();

    await store.setIfAbsent('lock', '1', 1000);
    vi.advanceTimersByTime(1001);

    await expect(store.getRaw('lock')).resolves.toBeUndefined();
    await expect(store.setIfAbsent('lock', '1', 1000)).resolves.toBe(true);
  });

  it('overwrites and deletes keys', async () => {
    const store = new MemoryAtomicStore();

    await store.setRaw('key', 'a');
    await store.setRaw('key', 'b');
    await expect(store.getRaw('key')).resolves.toBe('b');

    await store.delRaw('key');
    await expect(store.getRaw('key')).resolves.toBeUndefined();
  });
});

describe('createKvAtomicStore', () => {
  const stores: KvAtomicStore[] = [];

  const create = (env: Parameters<typeof createKvAtomicStore>[0]) => {
    const store = createKvAtomicStore(env);
    stores.push(store);

    return store;
  };

  afterEach(async () => {
    await Promise.all(stores.splice(0).map(store => store.disconnect()));
  });

  it('uses memory when REDIS_URL is not set', () => {
    expect(create({})).toBeInstanceOf(MemoryAtomicStore);
  });

  it('refuses a REDIS_URL without a REDIS_KEY_PREFIX', () => {
    expect(() => create({ REDIS_URL: 'redis://localhost:6379/0' })).toThrow(
      'REDIS_KEY_PREFIX'
    );
  });

  describe('with REDIS_URL and REDIS_KEY_PREFIX', () => {
    const env = {
      REDIS_URL: 'redis://wepublish-demo-staging:secret@localhost:6379/0',
      REDIS_KEY_PREFIX: 'wepublish-demo-staging',
    };

    it('uses Dragonfly', () => {
      expect(create(env)).toBeInstanceOf(DragonflyAtomicStore);
    });

    it('puts every key under the prefix', () => {
      const { adapter } = create(env) as DragonflyAtomicStore;

      expect(adapter.createKeyPrefix('nsv:settings', adapter.namespace)).toBe(
        'wepublish-demo-staging::nsv:settings'
      );
    });

    it('does not throw or queue commands while Dragonfly is unreachable', () => {
      const { adapter } = create(env) as DragonflyAtomicStore;

      expect(adapter.throwOnConnectError).toBe(false);
      expect(
        (adapter.client as RedisClientType).options?.disableOfflineQueue
      ).toBe(true);
    });
  });

  describe('in production', () => {
    const databaseCaFile = resolve(__dirname, '../../../../api/prisma/ca.crt');
    const production = {
      NODE_ENV: 'production',
      REDIS_URL:
        'rediss://wepublish-demo-production:secret@dragonfly01.wepublish.cloud:6379/0',
      REDIS_KEY_PREFIX: 'wepublish-demo-production',
      NODE_EXTRA_CA_CERTS: databaseCaFile,
    };

    it('refuses an unencrypted connection', () => {
      expect(() =>
        create({
          ...production,
          REDIS_URL:
            'redis://wepublish-demo-production:secret@dragonfly01.wepublish.cloud:6379/0',
        })
      ).toThrow('rediss://');
    });

    it('refuses to start without the internal CA', () => {
      expect(() =>
        create({ ...production, NODE_EXTRA_CA_CERTS: undefined })
      ).toThrow('NODE_EXTRA_CA_CERTS');
    });

    it('refuses to start when the CA file is missing', () => {
      expect(() =>
        create({ ...production, NODE_EXTRA_CA_CERTS: '/does/not/exist/ca.crt' })
      ).toThrow('/does/not/exist/ca.crt');
    });

    it('verifies Dragonfly against the CA of the database', () => {
      const { adapter } = create(production) as DragonflyAtomicStore;
      const socket = (adapter.client as RedisClientType).options
        ?.socket as Record<string, unknown>;

      expect(socket['tls']).toBe(true);
      expect(socket['rejectUnauthorized']).toBe(true);
      expect(socket['ca']).toBe(readFileSync(databaseCaFile, 'utf8'));
      expect(socket['checkServerIdentity']).toBeUndefined();
    });
  });
});
