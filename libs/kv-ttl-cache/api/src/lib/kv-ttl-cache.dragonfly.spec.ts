import { randomUUID } from 'node:crypto';
import { createClient } from '@keyv/redis';
import { Test, TestingModule } from '@nestjs/testing';
import { KvTtlCacheModule } from './kv-ttl-cache.module';
import { KvTtlCacheService } from './kv-ttl-cache.service';

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

  it('shares cached values between api instances and keeps dates', async () => {
    const first = await createApiInstance();
    const second = await createApiInstance();
    const value = {
      id: 'stripe',
      modifiedAt: new Date('2026-01-02T03:04:05.000Z'),
    };
    const loader = vi.fn();

    await first.getOrLoad('shared:stripe', () => value, 60);
    const cached = await second.getOrLoad<typeof value>(
      'shared:stripe',
      loader,
      60
    );

    expect(loader).not.toHaveBeenCalled();
    expect(cached).toEqual(value);
    expect(cached.modifiedAt).toBeInstanceOf(Date);
  });

  it('invalidates a namespace for every api instance', async () => {
    const first = await createApiInstance();
    const second = await createApiInstance();

    await first.getOrLoadNs(
      'settings:paymentprovider',
      'stripe',
      () => 'old',
      60
    );
    await expect(
      second.getOrLoadNs(
        'settings:paymentprovider',
        'stripe',
        () => 'unused',
        60
      )
    ).resolves.toBe('old');

    await new Promise(resolve => setTimeout(resolve, 5));
    await first.resetNamespace('settings:paymentprovider');

    await expect(
      second.getOrLoadNs('settings:paymentprovider', 'stripe', () => 'new', 60)
    ).resolves.toBe('new');
  });

  it('stores every key under the prefix', async () => {
    const service = await createApiInstance();

    await service.set('prefix-probe', 1, 60);

    await expect(admin.keys('*prefix-probe*')).resolves.toEqual([
      `${user}::prefix-probe`,
    ]);
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
