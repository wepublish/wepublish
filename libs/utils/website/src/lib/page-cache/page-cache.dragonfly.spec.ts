// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { createClient } from '@keyv/redis';
import { createSharedStore } from './shared-store';

const adminUrl = process.env['REDIS_TEST_ADMIN_URL'];

describe.skipIf(!adminUrl)('page cache on Dragonfly', () => {
  const user = `wepublish-test-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  const errors: string[] = [];
  let admin: ReturnType<typeof createClient>;

  const userUrl = () => {
    const url = new URL(adminUrl as string);
    url.username = user;
    url.password = password;
    url.pathname = '/0';

    return url.toString();
  };

  const websitePod = (buildId = 'build-1') =>
    createSharedStore({
      env: { REDIS_URL: userUrl(), REDIS_KEY_PREFIX: user },
      buildId,
      logger: { error: (message: string) => errors.push(message) },
    });

  const entry = (html: string) => ({
    value: { kind: 'PAGES', html, pageData: {}, headers: {}, status: 200 },
    lastModified: Date.now(),
    revalidate: 900,
    version: 'v1',
  });

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
  });

  afterAll(async () => {
    const keys = (await admin.sendCommand(['KEYS', `${user}:*`])) as string[];

    if (keys.length) {
      await admin.sendCommand(['DEL', ...keys]);
    }

    await admin.sendCommand(['ACL', 'DELUSER', user]);
    await admin.quit();
  });

  beforeEach(() => {
    errors.length = 0;
  });

  it('stores, reads and deletes pages with the rights of a medium', async () => {
    const first = websitePod();
    const second = websitePod();

    await first?.setEntry('/a/one', entry('one'));

    await expect(second?.getEntry('/a/one')).resolves.toMatchObject({
      value: { html: 'one' },
    });

    await second?.deleteEntry('/a/one');

    await expect(first?.getEntry('/a/one')).resolves.toBeNull();
    expect(errors).toEqual([]);
  });

  it('keeps the pages of another build apart', async () => {
    await websitePod('build-1')?.setEntry('/a/two', entry('two'));

    await expect(websitePod('build-2')?.getEntry('/a/two')).resolves.toBeNull();
  });

  it('lets one pod at a time regenerate a page', async () => {
    const first = websitePod();
    const second = websitePod();

    await expect(first?.acquireLock('/a/three')).resolves.toBe(true);
    await expect(second?.acquireLock('/a/three')).resolves.toBe(false);

    await first?.releaseLock('/a/three');

    await expect(second?.acquireLock('/a/three')).resolves.toBe(true);
    expect(errors).toEqual([]);
  });

  it('reads the version the api writes under <prefix>::nsv:website:pages', async () => {
    const pod = websitePod();

    await expect(pod?.getVersion()).resolves.toBeNull();

    await admin.set(`${user}::nsv:website:pages`, 'published-1');

    await expect(pod?.getVersion()).resolves.toBe('published-1');
    expect(errors).toEqual([]);
  });

  it('reads the layout and article versions the api writes', async () => {
    const pod = websitePod();

    await admin.set(`${user}::nsv:website:layout`, 'layout-1');
    await admin.set(`${user}::nsv:website:path:/a/one`, 'article-1');

    await expect(
      pod?.getVersions([
        'website:layout',
        'website:path:/a/one',
        'website:path:/a/two',
      ])
    ).resolves.toEqual(['layout-1', 'article-1', null]);
    expect(errors).toEqual([]);
  });
});
