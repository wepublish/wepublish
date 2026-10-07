import { Logger } from '@nestjs/common';
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

describe('DragonflyAtomicStore', () => {
  const createStore = (sendCommand: ReturnType<typeof vi.fn>) => {
    const client = {
      isOpen: true,
      isReady: true,
      sendCommand,
      connect: async () => {
        client.isOpen = true;
        client.isReady = true;
      },
      destroy: () => {
        client.isOpen = false;
        client.isReady = false;
      },
    };

    return new DragonflyAtomicStore({
      namespace: 'wepublish-demo',
      createKeyPrefix: (key: string, namespace: string) =>
        `${namespace}::${key}`,
      client,
      getClient: async () => client,
      disconnect: async (force?: boolean) => {
        if (force) {
          client.destroy();
        }
      },
    } as unknown as ConstructorParameters<typeof DragonflyAtomicStore>[0]);
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createClosingStore = (sendCommand: ReturnType<typeof vi.fn>) => {
    const client = {
      isOpen: true,
      isReady: true,
      sendCommand,
      connect: vi.fn(async () => {
        client.isOpen = true;
        client.isReady = true;
      }),
      destroy: vi.fn(() => {
        client.isOpen = false;
        client.isReady = false;
      }),
    };
    const store = new DragonflyAtomicStore({
      namespace: 'wepublish-demo',
      createKeyPrefix: (key: string, namespace: string) =>
        `${namespace}::${key}`,
      client,
      getClient: async () => client,
      disconnect: (force?: boolean) => {
        if (force) {
          client.destroy();

          return Promise.resolve();
        }

        client.isOpen = false;

        return new Promise<void>(() => undefined);
      },
    } as unknown as ConstructorParameters<typeof DragonflyAtomicStore>[0]);

    return { client, store };
  };

  it('finishes shutting down when Dragonfly never answers while closing', async () => {
    const { client, store } = createClosingStore(vi.fn());
    let closed = false;

    void store.disconnect().then(() => (closed = true));
    await vi.advanceTimersByTimeAsync(1000);

    expect(closed).toBe(true);
    expect(client.destroy).toHaveBeenCalled();
  });

  it('sends nothing after shutting down, so a delayed reset cannot open a new connection', async () => {
    const sendCommand = vi.fn().mockResolvedValue('OK');
    const { client, store } = createClosingStore(sendCommand);

    void store.disconnect();
    await vi.advanceTimersByTimeAsync(1000);
    await store.delRaw('val:x');
    await store.setRaw('nsv:settings', 'v2');

    expect(sendCommand).not.toHaveBeenCalled();
    expect(client.connect).not.toHaveBeenCalled();
  });

  it('creates a counter with its expiry before counting, so it still expires when renewing the expiry fails', async () => {
    const sendCommand = vi.fn(async (command: string[]) => {
      if (command[0] === 'INCR') {
        return 1;
      }

      if (command[0] === 'PEXPIRE') {
        throw new Error('ECONNRESET');
      }

      return 'OK';
    });
    const store = createStore(sendCommand);

    await expect(
      store.incrementRaw('count:totp-failures:1', 900_000)
    ).resolves.toBe(1);

    expect(sendCommand.mock.calls.map(([command]) => command)).toEqual([
      [
        'SET',
        'wepublish-demo::count:totp-failures:1',
        '0',
        'NX',
        'PX',
        '900000',
      ],
      ['INCR', 'wepublish-demo::count:totp-failures:1'],
      ['PEXPIRE', 'wepublish-demo::count:totp-failures:1', '900000'],
    ]);
  });

  it('sends only commands the production ACL allows, every key under the prefix of its medium', async () => {
    const sendCommand = vi.fn(async (command: string[]) =>
      command[0] === 'INCR' ? 1 : 'OK'
    );
    const store = createStore(sendCommand);

    await store.ping();
    await store.setIfAbsent('lock:nightly-job', 'token', 60_000);
    await store.getRaw('nsv:settings');
    await store.getManyRaw(['nsv:navigations', 'nsv:banners']);
    await store.setRaw('val:dev:ns:navigations:v1:main', '{}', 60_000);
    await store.incrementRaw('count:totp-failures:1', 900_000);
    await store.delRaw('val:dev:ns:navigations:v1:main');

    const commands = sendCommand.mock.calls.map(([command]) => command);
    const keys = commands.flatMap(([name, ...args]) =>
      name === 'PING' ? []
      : name === 'MGET' ? args
      : [args[0]]
    );

    expect(
      commands.every(([name]) =>
        ['PING', 'GET', 'MGET', 'SET', 'INCR', 'PEXPIRE', 'DEL'].includes(name)
      )
    ).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every(key => key.startsWith('wepublish-demo::'))).toBe(true);
  });

  it('is shared between replicas, unlike memory', () => {
    expect(createStore(vi.fn()).shared).toBe(true);
    expect(new MemoryAtomicStore().shared).toBe(false);
  });

  it('stops asking Dragonfly for five seconds after a failure', async () => {
    const sendCommand = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const store = createStore(sendCommand);

    await expect(store.getRaw('nsv:settings')).resolves.toBeUndefined();
    vi.advanceTimersByTime(4999);
    await store.getRaw('nsv:settings');
    await store.setRaw('nsv:settings', 'v2');

    expect(sendCommand).toHaveBeenCalledTimes(1);
    expect(store.isAvailable()).toBe(false);
  });

  it('gives up on a command Dragonfly does not answer within 500 ms', async () => {
    const sendCommand = vi.fn(() => new Promise(() => undefined));
    const store = createStore(sendCommand);

    const reply = store.getRaw('nsv:settings');
    await vi.advanceTimersByTimeAsync(500);

    await expect(reply).resolves.toBeUndefined();
    expect(store.isAvailable()).toBe(false);
  });

  it('logs an outage once, not once per command that was in flight', async () => {
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const store = createStore(
      vi.fn().mockRejectedValue(new Error('The client is offline'))
    );

    await Promise.all([
      store.getRaw('nsv:a'),
      store.getRaw('nsv:b'),
      store.getManyRaw(['val:a', 'val:b']),
    ]);

    expect(logged).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });

  describe('connection', () => {
    const fakeAdapter = (sendCommand: ReturnType<typeof vi.fn>) => {
      const client = {
        isOpen: true,
        isReady: true,
        sendCommand,
        connect: vi.fn(async () => {
          client.isOpen = true;
          client.isReady = true;
        }),
        destroy: vi.fn(() => {
          client.isOpen = false;
          client.isReady = false;
        }),
      };
      const adapter = {
        namespace: 'wepublish-demo',
        createKeyPrefix: (key: string, namespace: string) =>
          `${namespace}::${key}`,
        client,
        getClient: vi.fn(async () => client),
        disconnect: vi.fn(async (force?: boolean) => {
          if (client.isOpen && force) {
            client.destroy();
          }
        }),
      };
      const store = new DragonflyAtomicStore(
        adapter as unknown as ConstructorParameters<
          typeof DragonflyAtomicStore
        >[0]
      );

      return { adapter, client, store };
    };

    it('drops a connection that stopped answering, so the next command connects anew instead of waiting on a dead socket', async () => {
      const { client, store } = fakeAdapter(
        vi
          .fn()
          .mockImplementationOnce(() => new Promise(() => undefined))
          .mockResolvedValue('v1')
      );

      const reply = store.getRaw('nsv:settings');
      await vi.advanceTimersByTimeAsync(500);
      await expect(reply).resolves.toBeUndefined();
      expect(client.destroy).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);

      await expect(store.getRaw('nsv:settings')).resolves.toBe('v1');
      expect(client.connect).toHaveBeenCalledTimes(1);
    });

    it('reconnects without adding the client listeners again each time', async () => {
      const { adapter, client, store } = fakeAdapter(
        vi.fn().mockResolvedValue('v1')
      );

      for (let attempt = 0; attempt < 15; attempt++) {
        await store.getRaw('nsv:settings');
        client.isOpen = false;
        client.isReady = false;
      }

      expect(adapter.getClient).toHaveBeenCalledTimes(1);
      expect(client.connect).toHaveBeenCalledTimes(14);
    });

    it('lets commands sent at the same time on a fresh replica wait for the one connection being set up', async () => {
      let ready!: () => void;
      const client = {
        isOpen: false,
        isReady: false,
        sendCommand: vi.fn(async () => {
          if (!client.isReady) {
            throw new Error('The client is offline');
          }

          return 'v1';
        }),
        connect: vi.fn(async () => {
          client.isOpen = true;
          await new Promise<void>(resolve => (ready = resolve));
          client.isReady = true;
        }),
      };
      const store = new DragonflyAtomicStore({
        namespace: 'wepublish-demo',
        createKeyPrefix: (key: string, namespace: string) =>
          `${namespace}::${key}`,
        client,
        getClient: vi.fn(async () => {
          await client.connect();

          return client;
        }),
        disconnect: vi.fn(async () => undefined),
      } as unknown as ConstructorParameters<typeof DragonflyAtomicStore>[0]);

      const replies = ['a', 'b', 'c', 'd'].map(key => store.getRaw(key));
      await vi.advanceTimersByTimeAsync(10);
      ready();

      await expect(Promise.all(replies)).resolves.toEqual([
        'v1',
        'v1',
        'v1',
        'v1',
      ]);
      expect(store.isAvailable()).toBe(true);
      expect(client.connect).toHaveBeenCalledTimes(1);
    });

    it('works again once Dragonfly is back, even when it came back while a connection was being set up', async () => {
      let handshake!: () => void;
      const client = {
        isOpen: false,
        isReady: false,
        sendCommand: vi.fn(async () => {
          if (!client.isOpen) {
            throw new Error('The client is closed');
          }

          if (!client.isReady) {
            throw new Error('The client is offline');
          }

          return 'v1';
        }),
        connect: vi.fn(async () => {
          client.isOpen = true;
          await new Promise<void>(resolve => (handshake = resolve));
          client.isReady = true;
        }),
        destroy: vi.fn(() => {
          client.isOpen = false;
          client.isReady = false;
        }),
      };
      const store = new DragonflyAtomicStore({
        namespace: 'wepublish-demo',
        createKeyPrefix: (key: string, namespace: string) =>
          `${namespace}::${key}`,
        client,
        getClient: vi.fn(async () => {
          await client.connect();

          return client;
        }),
        disconnect: vi.fn(async (force?: boolean) => {
          if (client.isOpen && force) {
            client.destroy();
          }
        }),
      } as unknown as ConstructorParameters<typeof DragonflyAtomicStore>[0]);

      const whilePaused = store.getRaw('nsv:settings');
      await vi.advanceTimersByTimeAsync(500);
      await expect(whilePaused).resolves.toBeUndefined();

      handshake();
      await vi.advanceTimersByTimeAsync(5000);
      const afterwards = store.getRaw('nsv:settings');
      await vi.advanceTimersByTimeAsync(10);
      handshake?.();

      await expect(afterwards).resolves.toBe('v1');
    });

    it('gives up on a reconnect whose handshake Dragonfly never answers, so it can connect again later', async () => {
      let answering = true;
      const client = {
        isOpen: true,
        isReady: true,
        sendCommand: vi.fn(async () => {
          if (!client.isOpen) {
            throw new Error('The client is closed');
          }

          if (!client.isReady) {
            throw new Error('The client is offline');
          }

          return 'v1';
        }),
        connect: vi.fn(() => {
          client.isOpen = true;

          return answering ?
              Promise.resolve().then(() => {
                client.isReady = true;
              })
            : new Promise<void>(() => undefined);
        }),
        destroy: vi.fn(() => {
          client.isOpen = false;
          client.isReady = false;
        }),
      };
      const store = new DragonflyAtomicStore({
        namespace: 'wepublish-demo',
        createKeyPrefix: (key: string, namespace: string) =>
          `${namespace}::${key}`,
        client,
        getClient: vi.fn(async () => client),
        disconnect: vi.fn(async () => undefined),
      } as unknown as ConstructorParameters<typeof DragonflyAtomicStore>[0]);

      await expect(store.getRaw('nsv:settings')).resolves.toBe('v1');
      client.isOpen = false;
      client.isReady = false;
      answering = false;

      const silent = store.getRaw('nsv:settings');
      await vi.advanceTimersByTimeAsync(500);
      await expect(silent).resolves.toBeUndefined();

      answering = true;
      await vi.advanceTimersByTimeAsync(5000);
      const afterwards = store.getRaw('nsv:settings');
      await vi.advanceTimersByTimeAsync(600);

      await expect(afterwards).resolves.toBe('v1');
      expect(client.destroy).toHaveBeenCalled();
    });

    it('keeps a connection that answered, even with an error', async () => {
      const { client, store } = fakeAdapter(
        vi
          .fn()
          .mockRejectedValue(new Error('NOPERM this user has no permissions'))
      );

      await store.getRaw('other::key');

      expect(client.destroy).not.toHaveBeenCalled();
    });
  });

  it('asks Dragonfly again once the five seconds are over', async () => {
    const sendCommand = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue('v1');
    const store = createStore(sendCommand);

    await store.getRaw('nsv:settings');
    vi.advanceTimersByTime(5000);

    await expect(store.getRaw('nsv:settings')).resolves.toBe('v1');
    expect(store.isAvailable()).toBe(true);
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
