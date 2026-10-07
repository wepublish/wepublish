// @vitest-environment node
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createSharedStore } from './shared-store';

type Stored = { value: string; expiresAt?: number };

class FakeDragonfly {
  data = new Map<string, Stored>();
  clients: FakeClient[] = [];
  failing = false;
  connectDelayMs = 0;
  hangOnConnect = false;
  hangOnCommand = false;
}

class FakeClient {
  isReady = false;
  connects = 0;
  destroyed = false;

  constructor(
    private dragonfly: FakeDragonfly,
    readonly options: Record<string, unknown>
  ) {}

  on() {
    return this;
  }

  async connect() {
    this.connects++;

    if (this.dragonfly.hangOnConnect) {
      return new Promise(() => undefined);
    }

    if (this.dragonfly.connectDelayMs) {
      await new Promise(resolve =>
        setTimeout(resolve, this.dragonfly.connectDelayMs)
      );
    }

    if (this.dragonfly.failing) {
      throw new Error('connect ECONNREFUSED');
    }

    this.isReady = true;

    return this;
  }

  destroy() {
    this.destroyed = true;
    this.isReady = false;
  }

  async sendCommand(args: string[]) {
    if (!this.isReady) {
      throw new Error('The client is offline');
    }

    if (this.dragonfly.failing) {
      throw new Error('Socket closed unexpectedly');
    }

    if (this.dragonfly.hangOnCommand) {
      return new Promise(() => undefined);
    }

    const [command, key, value, ...rest] = args;
    const data = this.dragonfly.data;
    const live = (name: string) => {
      const stored = data.get(name);

      if (stored?.expiresAt !== undefined && stored.expiresAt <= Date.now()) {
        data.delete(name);

        return undefined;
      }

      return stored;
    };

    if (command === 'GET') {
      return live(key)?.value ?? null;
    }

    if (command === 'MGET') {
      return args.slice(1).map(name => live(name)?.value ?? null);
    }

    if (command === 'DEL') {
      return data.delete(key) ? 1 : 0;
    }

    if (command === 'SET') {
      if (rest.includes('NX') && live(key)) {
        return null;
      }

      const px = rest.indexOf('PX');
      data.set(key, {
        value,
        expiresAt: px >= 0 ? Date.now() + Number(rest[px + 1]) : undefined,
      });

      return 'OK';
    }

    throw new Error(`unexpected command ${command}`);
  }
}

const setup = (env: Record<string, string | undefined> = {}) => {
  const dragonfly = new FakeDragonfly();
  const errors: string[] = [];
  const createClient = (options: Record<string, unknown>) => {
    const client = new FakeClient(dragonfly, options);
    dragonfly.clients.push(client);

    return client;
  };
  const store = (buildId = 'build-1') =>
    createSharedStore({
      env: {
        REDIS_URL: 'redis://wep-x:secret@localhost:6379/0',
        REDIS_KEY_PREFIX: 'wep-x',
        ...env,
      },
      buildId,
      createClient,
      logger: { error: (message: string) => errors.push(message) },
    });

  return { dragonfly, errors, store };
};

const entry = (html: string) => ({
  value: { kind: 'PAGES', html, pageData: {}, headers: {}, status: 200 },
  lastModified: 1,
  revalidate: 900,
  version: 'v1',
});

describe('shared page store', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('configuration', () => {
    it('is off without REDIS_URL', () => {
      const { dragonfly, store } = setup({ REDIS_URL: undefined });

      expect(store()).toBeUndefined();
      expect(dragonfly.clients).toHaveLength(0);
    });

    it('is off while next build runs', () => {
      const { dragonfly, store } = setup({
        NEXT_PHASE: 'phase-production-build',
      });

      expect(store()).toBeUndefined();
      expect(dragonfly.clients).toHaveLength(0);
    });

    it('refuses to share without REDIS_KEY_PREFIX', () => {
      const { errors, store } = setup({ REDIS_KEY_PREFIX: undefined });

      expect(store()).toBeUndefined();
      expect(errors.join()).toContain('REDIS_KEY_PREFIX');
    });

    it('refuses an unencrypted connection in production', () => {
      const { errors, store } = setup({ NODE_ENV: 'production' });

      expect(store()).toBeUndefined();
      expect(errors.join()).toContain('rediss://');
    });

    it('refuses to connect in production without the internal CA', () => {
      const { errors, store } = setup({
        NODE_ENV: 'production',
        REDIS_URL: 'rediss://wep-x:secret@dragonfly01.wepublish.cloud:6379/0',
      });

      expect(store()).toBeUndefined();
      expect(errors.join()).toContain('NODE_EXTRA_CA_CERTS');
    });

    it('refuses to connect in production when the CA file cannot be read', () => {
      const { errors, store } = setup({
        NODE_ENV: 'production',
        REDIS_URL: 'rediss://wep-x:secret@dragonfly01.wepublish.cloud:6379/0',
        NODE_EXTRA_CA_CERTS: '/does/not/exist/ca.crt',
      });

      expect(store()).toBeUndefined();
      expect(errors.join()).toContain('/does/not/exist/ca.crt');
    });

    it('verifies Dragonfly against the internal CA in production', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'page-cache-'));
      const caFile = join(dir, 'ca.crt');
      writeFileSync(caFile, 'internal ca');
      const { dragonfly, store } = setup({
        NODE_ENV: 'production',
        REDIS_URL: 'rediss://wep-x:secret@dragonfly01.wepublish.cloud:6379/0',
        NODE_EXTRA_CA_CERTS: caFile,
      });

      await store()?.getVersion();

      expect(dragonfly.clients[0].options['socket']).toMatchObject({
        tls: true,
        rejectUnauthorized: true,
        ca: 'internal ca',
      });
      expect(dragonfly.clients[0].options['socket']).not.toHaveProperty(
        'checkServerIdentity'
      );
    });
  });

  it('sends only commands the production ACL allows, every key under the prefix of its medium', async () => {
    const { store } = setup();
    const sent = vi.spyOn(FakeClient.prototype, 'sendCommand');
    const pod = store();

    await pod?.setEntry('/a/one', entry('one'));
    await pod?.getEntry('/a/one');
    await pod?.deleteEntry('/a/one');
    await pod?.acquireLock('/a/one');
    await pod?.releaseLock('/a/one');
    await pod?.getVersion();
    await pod?.getVersions(['website:layout', 'website:path:/a/one']);

    const commands = sent.mock.calls.map(([command]) => command);
    const keys = commands.flatMap(([name, ...args]) =>
      name === 'MGET' ? args : [args[0]]
    );

    expect(
      commands.every(([name]) => ['GET', 'MGET', 'SET', 'DEL'].includes(name))
    ).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every(key => key.startsWith('wep-x::'))).toBe(true);
    sent.mockRestore();
  });

  describe('pages', () => {
    it('stores pages under the key prefix and the build id for three hours', async () => {
      vi.useFakeTimers();
      const { dragonfly, store } = setup();

      await store()?.setEntry('/a/one', entry('one'));

      const stored = dragonfly.data.get('wep-x::page:build-1:/a/one');
      expect(JSON.parse(stored?.value ?? 'null')).toEqual(entry('one'));
      expect(stored?.expiresAt).toBe(Date.now() + 3 * 60 * 60 * 1000);
    });

    it('reads a page another pod stored', async () => {
      const { store } = setup();

      await store()?.setEntry('/a/one', entry('one'));

      await expect(store()?.getEntry('/a/one')).resolves.toEqual(entry('one'));
    });

    it('answers null for a page nobody stored', async () => {
      const { store } = setup();

      await expect(store()?.getEntry('/a/none')).resolves.toBeNull();
    });

    it('keeps pages of different builds apart', async () => {
      const { store } = setup();

      await store('build-1')?.setEntry('/a/one', entry('one'));

      await expect(store('build-2')?.getEntry('/a/one')).resolves.toBeNull();
    });

    it('does not share pages over 2 MB and drops an older shared copy', async () => {
      const { store } = setup();
      const shared = store();

      await shared?.setEntry('/a/one', entry('small'));
      await shared?.setEntry('/a/one', entry('x'.repeat(2 * 1024 * 1024)));

      await expect(shared?.getEntry('/a/one')).resolves.toBeNull();
    });

    it('tells whether a page fits into Dragonfly, so a page over 2 MB stays on its pod', async () => {
      const { store } = setup();
      const shared = store();

      await expect(shared?.setEntry('/a/one', entry('small'))).resolves.toBe(
        true
      );
      await expect(
        shared?.setEntry('/a/one', entry('x'.repeat(2 * 1024 * 1024)))
      ).resolves.toBe(false);
    });

    it('tells that a page did not reach Dragonfly when storing it failed, so it stays on its pod', async () => {
      const { dragonfly, store } = setup();
      const shared = store();
      await shared?.getEntry('/a/one');
      dragonfly.failing = true;

      await expect(shared?.setEntry('/a/one', entry('one'))).resolves.toBe(
        false
      );
      await expect(shared?.setEntry('/a/two', entry('two'))).resolves.toBe(
        false
      );
    });

    it('deletes a page', async () => {
      const { store } = setup();
      const shared = store();

      await shared?.setEntry('/a/one', entry('one'));
      await shared?.deleteEntry('/a/one');

      await expect(shared?.getEntry('/a/one')).resolves.toBeNull();
    });
  });

  describe('versions', () => {
    it('reads the website pages version the api writes', async () => {
      const { dragonfly, store } = setup();
      dragonfly.data.set('wep-x::website:heartbeat', { value: '1' });
      dragonfly.data.set('wep-x::nsv:website:pages', { value: 'v7' });

      await expect(store()?.getVersion()).resolves.toBe('v7');
    });

    it('answers null while the api has not written a version yet', async () => {
      const { dragonfly, store } = setup();
      dragonfly.data.set('wep-x::website:heartbeat', { value: '1' });

      await expect(store()?.getVersion()).resolves.toBeNull();
    });

    it('answers undefined while no api signals versions, so pages fall back to the short refresh', async () => {
      const { dragonfly, store } = setup();
      dragonfly.data.set('wep-x::nsv:website:pages', { value: 'v7' });
      dragonfly.data.set('wep-x::nsv:website:layout', { value: 'l3' });
      const shared = store();

      await expect(shared?.getVersion()).resolves.toBeUndefined();
      await expect(
        shared?.getVersions(['website:layout', 'website:path:/a/one'])
      ).resolves.toBeUndefined();
    });

    it('reads the layout and article versions the api writes in one round trip', async () => {
      const { dragonfly, store } = setup();
      const shared = store();
      await shared?.getVersion();
      dragonfly.data.set('wep-x::website:heartbeat', { value: '1' });
      dragonfly.data.set('wep-x::nsv:website:layout', { value: 'l3' });
      dragonfly.data.set('wep-x::nsv:website:path:/a/one', { value: 'p2' });
      const sent = vi.spyOn(dragonfly.clients[0], 'sendCommand');

      await expect(
        shared?.getVersions([
          'website:layout',
          'website:path:/a/one',
          'website:path:/a/two',
        ])
      ).resolves.toEqual(['l3', 'p2', null]);
      expect(sent).toHaveBeenCalledTimes(1);
    });

    it('answers undefined for the versions while Dragonfly fails', async () => {
      const { dragonfly, store } = setup();
      const shared = store();
      await shared?.getVersion();
      dragonfly.failing = true;

      await expect(
        shared?.getVersions(['website:layout', 'website:path:/a/one'])
      ).resolves.toBeUndefined();
    });
  });

  describe('regeneration lock', () => {
    it('is held by one caller until it is released', async () => {
      const { store } = setup();
      const first = store();
      const second = store();

      await expect(first?.acquireLock('/a/one')).resolves.toBe(true);
      await expect(second?.acquireLock('/a/one')).resolves.toBe(false);

      await first?.releaseLock('/a/one');

      await expect(second?.acquireLock('/a/one')).resolves.toBe(true);
    });

    it('expires after ten seconds', async () => {
      vi.useFakeTimers();
      const { store } = setup();
      const shared = store();

      await shared?.acquireLock('/a/one');
      vi.advanceTimersByTime(10_001);

      await expect(shared?.acquireLock('/a/one')).resolves.toBe(true);
    });

    it('is granted when Dragonfly cannot be asked', async () => {
      const { dragonfly, store } = setup();
      dragonfly.failing = true;

      await expect(store()?.acquireLock('/a/one')).resolves.toBe(true);
    });

    it('tells other pods since when a page is being regenerated', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(1_800_000_000_000);
      const { store } = setup();
      const first = store();
      const second = store();

      await first?.acquireLock('/a/one');

      await expect(second?.lockedSince('/a/one')).resolves.toBe(
        1_800_000_000_000
      );
      await expect(second?.lockedSince('/a/two')).resolves.toBeUndefined();
    });
  });

  describe('connection', () => {
    it('answers undefined when the client cannot even be constructed', async () => {
      const dragonfly = new FakeDragonfly();
      const errors: string[] = [];
      const shared = createSharedStore({
        env: {
          REDIS_URL: 'redis://wep-x:secret@localhost:6379/0',
          REDIS_KEY_PREFIX: 'wep-x',
        },
        buildId: 'build-1',
        createClient: () => {
          throw new TypeError('createClient is not a function');
        },
        logger: { error: (message: string) => errors.push(message) },
      });

      await expect(shared?.getVersion()).resolves.toBeUndefined();
      await expect(shared?.getEntry('/a/one')).resolves.toBeUndefined();
      // The lock is granted while Dragonfly is unreachable: with no way to
      // coordinate, every pod has to stay free to regenerate on its own.
      await expect(shared?.acquireLock('/a/one')).resolves.toBe(true);
      expect(errors[0]).toContain('createClient is not a function');
      expect(dragonfly.clients).toHaveLength(0);
    });

    it('waits for the connection before its first commands', async () => {
      const { dragonfly, errors, store } = setup();
      dragonfly.connectDelayMs = 5;
      dragonfly.data.set('wep-x::website:heartbeat', { value: '1' });
      dragonfly.data.set('wep-x::nsv:website:pages', { value: 'v1' });
      const shared = store();

      const versions = await Promise.all(
        Array.from({ length: 8 }, () => shared?.getVersion())
      );

      expect(versions).toEqual(Array(8).fill('v1'));
      expect(dragonfly.clients).toHaveLength(1);
      expect(errors).toEqual([]);
    });

    it('answers undefined and pauses for five seconds after a failure', async () => {
      vi.useFakeTimers();
      const { dragonfly, errors, store } = setup();
      dragonfly.data.set('wep-x::website:heartbeat', { value: '1' });
      const shared = store();
      await shared?.getVersion();
      dragonfly.failing = true;

      await expect(shared?.getEntry('/a/one')).resolves.toBeUndefined();
      await expect(shared?.getVersion()).resolves.toBeUndefined();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('5 s');

      dragonfly.failing = false;
      vi.advanceTimersByTime(4999);

      await expect(shared?.getVersion()).resolves.toBeUndefined();

      vi.advanceTimersByTime(2);

      await expect(shared?.getVersion()).resolves.toBeNull();
      expect(dragonfly.clients.length).toBeGreaterThan(1);
      expect(dragonfly.clients[0].destroyed).toBe(true);
    });

    it('gives up connecting after a second', async () => {
      vi.useFakeTimers();
      const { dragonfly, errors, store } = setup();
      dragonfly.hangOnConnect = true;
      const shared = store();

      const version = shared?.getVersion();
      await vi.advanceTimersByTimeAsync(1001);

      await expect(version).resolves.toBeUndefined();
      expect(errors).toHaveLength(1);
    });

    it('gives up on a command that gets no answer within a second', async () => {
      vi.useFakeTimers();
      const { dragonfly, errors, store } = setup();
      const shared = store();
      await shared?.getVersion();
      dragonfly.hangOnCommand = true;

      const entry = shared?.getEntry('/a/one');
      await vi.advanceTimersByTimeAsync(1001);

      await expect(entry).resolves.toBeUndefined();
      expect(errors).toHaveLength(1);
      await expect(shared?.getVersion()).resolves.toBeUndefined();
    });

    it('does not put the password into its log', async () => {
      const { dragonfly, errors, store } = setup();
      dragonfly.failing = true;

      await store()?.getVersion();

      expect(errors.join()).not.toContain('secret');
    });
  });
});
