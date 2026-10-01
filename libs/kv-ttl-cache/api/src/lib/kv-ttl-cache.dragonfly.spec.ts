import { randomUUID } from 'node:crypto';
import { createClient } from '@keyv/redis';
import { Test, TestingModule } from '@nestjs/testing';
import { KvTtlCacheModule } from './kv-ttl-cache.module';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { INTEGRATION_NAMESPACES } from './kv-ttl-cache.testing';

const adminUrl = process.env['REDIS_TEST_ADMIN_URL'];

describe.skipIf(!adminUrl)('KvTtlCacheModule on Dragonfly', () => {
  const user = `wepublish-test-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  const originalEnv = { ...process.env };
  const modules: TestingModule[] = [];
  let admin: ReturnType<typeof createClient>;

  const userUrl = () => {
    const url = new URL(adminUrl as string);
    url.username = user;
    url.password = password;
    url.pathname = '/0';

    return url.toString();
  };

  const createApiInstance = async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    await module.init();
    modules.push(module);

    return module.get(KvTtlCacheService);
  };

  beforeAll(async () => {
    admin = createClient({ url: adminUrl });
    await admin.connect();
    await admin.sendCommand([
      'ACL',
      'SETUSER',
      user,
      'on',
      `>${password}`,
      'resetkeys',
      `~${user}:*`,
      `~{${user}}:*`,
      'resetchannels',
      `&${user}:*`,
      '-@all',
      '+@all',
      '-@dangerous',
      '-@admin',
      '+info',
      '-client',
      '-script',
      '-function',
      '-memory',
      '-pubsub',
      '-scan',
      '-randomkey',
      '-dbsize',
      '$0',
    ]);
    process.env['REDIS_URL'] = userUrl();
    process.env['REDIS_KEY_PREFIX'] = user;
  });

  afterAll(async () => {
    await Promise.all(modules.map(module => module.close()));
    for await (const keys of admin.scanIterator({ MATCH: `${user}:*` })) {
      if (keys.length) {
        await admin.del(keys);
      }
    }
    await admin.sendCommand(['ACL', 'DELUSER', user]);
    await admin.close();
    process.env = originalEnv;
  });

  it('invalidates a namespace for every api instance within two seconds', async () => {
    const editing = await createApiInstance();
    const reading = await createApiInstance();

    await expect(
      reading.getOrLoadNs('settings:paymentprovider', 'stripe', () => 'old', 60)
    ).resolves.toBe('old');

    await new Promise(resolve => setTimeout(resolve, 5));
    await editing.resetNamespace('settings:paymentprovider');
    await new Promise(resolve => setTimeout(resolve, 2100));

    await expect(
      reading.getOrLoadNs('settings:paymentprovider', 'stripe', () => 'new', 60)
    ).resolves.toBe('new');
  });

  it('shares page data between api instances through Dragonfly', async () => {
    const loading = await createApiInstance();
    const reading = await createApiInstance();
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const loader = vi.fn();

    await loading.getOrLoadNs('navigations', 'main', () => ({ expiresAt }), 60);

    await expect(
      reading.getOrLoadNs('navigations', 'main', loader, 60)
    ).resolves.toEqual({ expiresAt });
    expect(loader).not.toHaveBeenCalled();
  });

  it('never stores integration settings in Dragonfly', async () => {
    const service = await createApiInstance();

    for (const namespace of INTEGRATION_NAMESPACES) {
      await service.getOrLoadNs(
        namespace,
        'value-probe',
        () => ({ id: 'provider', value: 'sk_live_secret' }),
        60
      );
    }

    const keys = await admin.keys(`${user}:*`);
    const values = await Promise.all(keys.map(key => admin.get(key)));

    expect(keys).toContain(`${user}::nsv:settings:paymentprovider`);
    expect(keys.some(key => key.includes('settings:'))).toBe(true);
    expect(
      keys
        .filter(key => key.includes('settings:'))
        .every(key => key.startsWith(`${user}::nsv:`))
    ).toBe(true);
    expect(values.some(value => value?.includes('sk_live_secret'))).toBe(false);
  });

  it('is refused anything outside its prefix, like on dragonfly01', async () => {
    const client = createClient({ url: userUrl() });
    await client.connect();

    try {
      await expect(client.set('unprefixed', '1')).rejects.toThrow('NOPERM');
      await expect(client.flushAll()).rejects.toThrow('NOPERM');
      await expect(client.set(`${user}::own`, '1')).resolves.toBe('OK');
    } finally {
      await client.close();
    }
  });

  it.each([
    ['CLIENT', 'PAUSE', '1'],
    ['CLIENT', 'KILL', 'ID', '1'],
    ['DFLY', 'THREAD'],
    ['SCRIPT', 'FLUSH'],
    ['SCAN', '0'],
    ['RANDOMKEY'],
    ['DBSIZE'],
  ])(
    'is refused %s, which reaches other media without touching keys',
    async (...command) => {
      const client = createClient({ url: userUrl() });
      await client.connect();

      try {
        await expect(client.sendCommand(command)).rejects.toThrow('NOPERM');
      } finally {
        await client.close();
      }
    }
  );
});
