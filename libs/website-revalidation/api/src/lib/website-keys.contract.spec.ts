import { createRequire } from 'module';
import { join } from 'path';
import {
  RELEASE_KEY,
  WEBSITE_HEARTBEAT_KEY,
  WEBSITE_LAYOUT_VERSION,
  WEBSITE_PAGES_VERSION,
  websitePagesKey,
  websitePathVersion,
} from './website-keys';

type SharedStore = {
  getVersion(): Promise<string | null | undefined>;
  getVersions(names: string[]): Promise<Array<string | null> | undefined>;
};

type PageCache = {
  get(key: string, ctx: { kind: string }, request?: unknown): Promise<unknown>;
};

const PAGE_CACHE = join(
  __dirname,
  '../../../../utils/website/src/lib/page-cache'
);
const load = createRequire(__filename);
const { createSharedStore } = load(join(PAGE_CACHE, 'shared-store.js')) as {
  createSharedStore(options: {
    env: Record<string, string | undefined>;
    buildId: string;
    createClient: () => unknown;
    logger: Pick<Console, 'error' | 'warn' | 'info'>;
  }): SharedStore;
};
const { createPageCache } = load(join(PAGE_CACHE, 'page-cache.js')) as {
  createPageCache(options: {
    shared: unknown;
    clock: { now(): number; perfNow(): number };
  }): PageCache;
};

const websiteStore = () => {
  const sent: string[][] = [];
  const client = {
    isReady: false,
    isOpen: false,
    on() {
      return client;
    },
    async connect() {
      client.isReady = true;
      client.isOpen = true;
    },
    async sendCommand(args: string[]) {
      sent.push(args);

      return args[0] === 'MGET' ? args.slice(1).map(() => 'v1') : null;
    },
    async close() {
      client.isReady = false;
    },
    destroy() {
      client.isReady = false;
    },
  };
  const store = createSharedStore({
    env: {
      REDIS_URL: 'redis://localhost:6379/0',
      REDIS_KEY_PREFIX: 'wep-x',
    },
    buildId: 'build-1',
    createClient: () => client,
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  });

  return { store, sent };
};

const websitePageCache = () => {
  const names: string[][] = [];
  const reads = { pages: 0 };
  const shared = {
    async getVersion() {
      reads.pages++;

      return 'v1';
    },
    async getVersions(requested: string[]) {
      names.push(requested);

      return requested.map(() => 'v1');
    },
    async getEntry() {
      return null;
    },
    async setEntry() {
      return true;
    },
    async deleteEntry() {
      return;
    },
    async acquireLock() {
      return true;
    },
    async lockedSince() {
      return undefined;
    },
    async releaseLock() {
      return;
    },
  };
  const cache = createPageCache({
    shared,
    clock: { now: () => 1_800_000_000_000, perfNow: () => 1_800_000_000_000 },
  });

  return { cache, names, reads };
};

describe('website keys', () => {
  it('names the keys the websites and older api pods read and write', () => {
    expect(WEBSITE_PAGES_VERSION).toBe('website:pages');
    expect(WEBSITE_LAYOUT_VERSION).toBe('website:layout');
    expect(WEBSITE_HEARTBEAT_KEY).toBe('website:heartbeat');
    expect(RELEASE_KEY).toBe('release:current');
    expect(websitePathVersion('/a/Mein-Artikel')).toBe(
      'website:path:/a/mein-artikel'
    );
    expect(
      (['nsl', 'nsf', 'nsd', 'nsw'] as const).map(websitePagesKey)
    ).toEqual([
      'nsl:website:pages',
      'nsf:website:pages',
      'nsd:website:pages',
      'nsw:website:pages',
    ]);
  });

  it('matches the heartbeat and versions the websites read from Dragonfly', async () => {
    const { store, sent } = websiteStore();

    await store.getVersions([
      WEBSITE_LAYOUT_VERSION,
      websitePathVersion('/a/one'),
    ]);
    await store.getVersion();

    expect(sent).toEqual([
      [
        'MGET',
        `wep-x::${WEBSITE_HEARTBEAT_KEY}`,
        `wep-x::nsv:${WEBSITE_LAYOUT_VERSION}`,
        `wep-x::nsv:${websitePathVersion('/a/one')}`,
      ],
      [
        'MGET',
        `wep-x::${WEBSITE_HEARTBEAT_KEY}`,
        `wep-x::nsv:${WEBSITE_PAGES_VERSION}`,
      ],
    ]);
  });

  it('matches the layout and lowercased path versions the websites check for an article page', async () => {
    const { cache, names } = websitePageCache();

    await cache.get('/a/Mein-Artikel', { kind: 'PAGES' });

    expect(names).toEqual([
      [WEBSITE_LAYOUT_VERSION, websitePathVersion('/a/Mein-Artikel')],
    ]);
  });

  it('matches the pages version the websites check for every other page', async () => {
    const { cache, names, reads } = websitePageCache();

    await cache.get('/', { kind: 'PAGES' });

    expect(names).toEqual([]);
    expect(reads.pages).toBe(1);
  });
});
