// @vitest-environment node
import { createPageCache } from './page-cache';

const LOCK_MS = 10_000;

class FakeClock {
  time = 1_800_000_000_000;

  now = () => this.time;
  perfNow = () => this.time + 0.25;

  advance(ms: number) {
    this.time += ms;
  }
}

class FakeShared {
  entries = new Map<string, string>();
  locks = new Map<string, number>();
  version: string | null = 'v1';
  available = true;

  constructor(private clock: FakeClock) {}

  async getVersion() {
    return this.available ? this.version : undefined;
  }

  versions = new Map<string, string>();
  versionReads = 0;

  async getVersions(names: string[]) {
    this.versionReads++;

    return this.available ?
        names.map(name => this.versions.get(name) ?? null)
      : undefined;
  }

  async getEntry(key: string) {
    if (!this.available) {
      return undefined;
    }

    const text = this.entries.get(key);

    return text === undefined ? null : JSON.parse(text);
  }

  async setEntry(key: string, entry: unknown) {
    if (this.available) {
      this.entries.set(key, JSON.stringify(entry));
    }
  }

  async deleteEntry(key: string) {
    if (this.available) {
      this.entries.delete(key);
    }
  }

  async acquireLock(key: string) {
    if (!this.available) {
      return true;
    }

    const until = this.locks.get(key);

    if (until !== undefined && until > this.clock.now()) {
      return false;
    }

    this.locks.set(key, this.clock.now() + LOCK_MS);

    return true;
  }

  async releaseLock(key: string) {
    if (this.available) {
      this.locks.delete(key);
    }
  }
}

const page = (html: string) => ({
  kind: 'PAGES',
  html,
  pageData: { pageProps: { html } },
  headers: {},
  status: 200,
});

const PAGES = { kind: 'PAGES', isFallback: false };
const revalidate = (seconds: number | false) => ({
  cacheControl: { revalidate: seconds, expire: undefined },
});

const setup = (options: { maxLocalBytes?: number } = {}) => {
  const clock = new FakeClock();
  const shared = new FakeShared(clock);
  const pod = () => createPageCache({ shared, clock, ...options });

  return { clock, shared, pod };
};

describe('page cache', () => {
  it('has nothing for a page no pod rendered yet', async () => {
    const { pod } = setup();

    await expect(pod().get('/new', PAGES)).resolves.toBeNull();
  });

  it('serves a rendered page as fresh', async () => {
    const { clock, pod } = setup();
    const cache = pod();

    await cache.get('/one', PAGES);
    await cache.set('/one', page('one'), revalidate(900));

    await expect(cache.get('/one', PAGES)).resolves.toEqual({
      value: page('one'),
      lastModified: clock.perfNow(),
    });
  });

  it('serves a page another pod rendered without rendering it again', async () => {
    const { clock, pod } = setup();
    const first = pod();
    const second = pod();

    await first.set('/one', page('one'), revalidate(900));

    await expect(second.get('/one', PAGES)).resolves.toEqual({
      value: page('one'),
      lastModified: clock.perfNow(),
    });
  });

  it('keeps a page fresh for its own revalidate time, not the 1 s Next assumes for unknown routes', async () => {
    const { clock, pod } = setup();
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(900));
    clock.advance(899_000);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });
  });

  it('marks a page stale once its revalidate time is over and still serves it', async () => {
    const { clock, pod } = setup();
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(900));
    clock.advance(900_001);

    await expect(cache.get('/one', PAGES)).resolves.toEqual({
      value: page('one'),
      lastModified: 1,
    });
  });

  it('never marks a page stale by time when it should never revalidate', async () => {
    const { clock, pod } = setup();
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(false));
    clock.advance(365 * 24 * 60 * 60 * 1000);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });
  });

  it('marks pages stale when the website pages version changes', async () => {
    const { clock, shared, pod } = setup();
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(900));
    shared.version = 'v2';
    clock.advance(2001);

    await expect(cache.get('/one', PAGES)).resolves.toEqual({
      value: page('one'),
      lastModified: 1,
    });
  });

  it('notices a new version within two seconds', async () => {
    const { clock, shared, pod } = setup();
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(900));
    await cache.get('/one', PAGES);
    shared.version = 'v2';
    clock.advance(1000);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });

    clock.advance(1001);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('remembers the version from before rendering, so content read before a publish is not taken as current', async () => {
    const { clock, shared, pod } = setup();
    const cache = pod();

    await expect(cache.get('/one', PAGES)).resolves.toBeNull();
    shared.version = 'v2';
    clock.advance(2001);
    await cache.set('/one', page('read before the publish'), revalidate(900));

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('lets only one pod regenerate a page after a change', async () => {
    const { clock, shared, pod } = setup();
    const first = pod();
    const second = pod();

    await first.set('/one', page('old'), revalidate(900));
    await second.get('/one', PAGES);
    shared.version = 'v2';
    clock.advance(2001);

    await expect(first.get('/one', PAGES)).resolves.toMatchObject({
      value: page('old'),
      lastModified: 1,
    });
    await expect(second.get('/one', PAGES)).resolves.toEqual({
      value: page('old'),
      lastModified: clock.perfNow(),
    });

    await first.set('/one', page('new'), revalidate(900));

    await expect(second.get('/one', PAGES)).resolves.toEqual({
      value: page('new'),
      lastModified: clock.perfNow(),
    });
  });

  it('lets another pod regenerate when the first one never finishes', async () => {
    const { clock, shared, pod } = setup();
    const first = pod();
    const second = pod();

    await first.set('/one', page('old'), revalidate(900));
    shared.version = 'v2';
    clock.advance(2001);
    await first.get('/one', PAGES);
    clock.advance(LOCK_MS + 1);

    await expect(second.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('frees the page for the next change once it is stored', async () => {
    const { clock, shared, pod } = setup();
    const first = pod();
    const second = pod();

    await first.set('/one', page('old'), revalidate(900));
    shared.version = 'v2';
    clock.advance(2001);
    await first.get('/one', PAGES);
    await first.set('/one', page('v2'), revalidate(900));
    shared.version = 'v3';
    clock.advance(2001);

    await expect(second.get('/one', PAGES)).resolves.toMatchObject({
      value: page('v2'),
      lastModified: 1,
    });
  });

  it('uses a newer copy from another pod instead of regenerating', async () => {
    const { clock, pod } = setup();
    const first = pod();
    const second = pod();

    await first.set('/one', page('first copy'), revalidate(60));
    await second.get('/one', PAGES);
    clock.advance(30_000);
    await first.set('/one', page('second copy'), revalidate(60));
    clock.advance(30_001);

    await expect(second.get('/one', PAGES)).resolves.toEqual({
      value: page('second copy'),
      lastModified: clock.perfNow(),
    });
  });

  it('does not store a page that was not found', async () => {
    const { shared, pod } = setup();
    const cache = pod();

    await cache.get('/missing', PAGES);
    await cache.set('/missing', null, revalidate(1));

    await expect(cache.get('/missing', PAGES)).resolves.toBeNull();
    expect(shared.entries.size).toBe(0);
  });

  it('does not store a page that answered with status 404', async () => {
    const { shared, pod } = setup();
    const cache = pod();

    await cache.set(
      '/missing',
      { ...page('not found'), status: 404 },
      revalidate(1)
    );

    await expect(cache.get('/missing', PAGES)).resolves.toBeNull();
    expect(shared.entries.size).toBe(0);
  });

  it('forgets a page on every pod once it is not found anymore', async () => {
    const { clock, shared, pod } = setup();
    const first = pod();
    const second = pod();

    await first.set('/gone', page('published'), revalidate(900));
    await second.get('/gone', PAGES);
    shared.version = 'v2';
    clock.advance(2001);
    await first.get('/gone', PAGES);
    await first.set('/gone', null, revalidate(1));

    await expect(first.get('/gone', PAGES)).resolves.toBeNull();
    await expect(second.get('/gone', PAGES)).resolves.toBeNull();
  });

  it('frees the page when it turned out not to be found', async () => {
    const { clock, shared, pod } = setup();
    const first = pod();
    const second = pod();

    await first.set('/gone', page('published'), revalidate(900));
    shared.version = 'v2';
    clock.advance(2001);
    await first.get('/gone', PAGES);
    await first.set('/gone', null, revalidate(1));
    await second.set('/gone', page('published again'), revalidate(900));
    shared.version = 'v3';
    clock.advance(2001);

    await expect(second.get('/gone', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('keeps redirects like pages', async () => {
    const { clock, pod } = setup();
    const redirect = {
      kind: 'REDIRECT',
      props: { __N_REDIRECT: '/new', __N_REDIRECT_STATUS: 307 },
    };

    await pod().set('/old', redirect, revalidate(60));

    await expect(pod().get('/old', PAGES)).resolves.toEqual({
      value: redirect,
      lastModified: clock.perfNow(),
    });
  });

  it('keeps serving pages from memory while Dragonfly is unavailable', async () => {
    const { clock, shared, pod } = setup();
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(900));
    shared.available = false;
    clock.advance(2001);

    await expect(cache.get('/one', PAGES)).resolves.toEqual({
      value: page('one'),
      lastModified: clock.perfNow(),
    });
  });

  it('still regenerates by time while Dragonfly is unavailable', async () => {
    const { clock, shared, pod } = setup();
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(60));
    shared.available = false;
    clock.advance(60_001);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('treats pages as current when no version was ever readable', async () => {
    const { clock, shared, pod } = setup();
    shared.available = false;
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(900));

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });
  });

  it('treats a missing version like any other version', async () => {
    const { clock, shared, pod } = setup();
    shared.version = null;
    const cache = pod();

    await cache.set('/one', page('one'), revalidate(900));
    shared.version = 'v1';
    clock.advance(2001);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('works without any Dragonfly', async () => {
    const clock = new FakeClock();
    const cache = createPageCache({ shared: undefined, clock });

    await cache.set('/one', page('one'), revalidate(60));

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      value: page('one'),
      lastModified: clock.perfNow(),
    });

    clock.advance(60_001);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('regenerates a page after a minute without Dragonfly, as nothing tells it about publications', async () => {
    const clock = new FakeClock();
    const cache = createPageCache({ shared: undefined, clock });

    await cache.set('/one', page('one'), revalidate(3600));
    clock.advance(59_000);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });

    clock.advance(1001);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it.each(['/one', '/a/one'])(
    'regenerates %s after a minute while Dragonfly cannot tell the version',
    async path => {
      const { clock, shared, pod } = setup();
      const cache = pod();

      await cache.get(path, PAGES);
      await cache.set(path, page(path), revalidate(3600));
      shared.available = false;
      clock.advance(60_001);

      await expect(cache.get(path, PAGES)).resolves.toMatchObject({
        lastModified: 1,
      });
    }
  );

  it('keeps a page for its own revalidate time again once Dragonfly answers', async () => {
    const { clock, shared, pod } = setup();
    const cache = pod();

    await cache.get('/one', PAGES);
    await cache.set('/one', page('one'), revalidate(3600));
    shared.available = false;
    clock.advance(30_000);
    await cache.get('/one', PAGES);
    shared.available = true;
    clock.advance(31_000);

    await expect(cache.get('/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });
  });

  it('drops the least recently used pages beyond its memory budget', async () => {
    const { shared, pod } = setup({ maxLocalBytes: 5000 });
    shared.available = false;
    const cache = pod();

    await cache.set('/one', page('x'.repeat(1000)), revalidate(60));
    await cache.set('/two', page('y'.repeat(1000)), revalidate(60));
    await cache.get('/one', PAGES);
    await cache.set('/three', page('z'.repeat(1000)), revalidate(60));

    await expect(cache.get('/one', PAGES)).resolves.not.toBeNull();
    await expect(cache.get('/two', PAGES)).resolves.toBeNull();
    await expect(cache.get('/three', PAGES)).resolves.not.toBeNull();
  });

  it('keeps other cache kinds in memory only', async () => {
    const { clock, shared, pod } = setup();
    const cache = pod();
    const fetched = { kind: 'FETCH', data: { body: '{}' }, revalidate: 60 };

    await cache.set('fetch-key', fetched, { fetchCache: true, revalidate: 60 });

    await expect(
      cache.get('fetch-key', { kind: 'FETCH', revalidate: 60 })
    ).resolves.toEqual({ value: fetched, lastModified: clock.now() });
    expect(shared.entries.size).toBe(0);
  });
});

describe('article pages', () => {
  const rendered = async (path: string) => {
    const { clock, shared, pod } = setup();
    const cache = pod();

    await cache.get(path, PAGES);
    await cache.set(path, page(path), revalidate(3600));

    return { clock, shared, cache };
  };

  it.each(['/a/one', '/a/id/123'])(
    'keeps %s fresh when something else is published',
    async path => {
      const { clock, shared, cache } = await rendered(path);
      shared.version = 'v2';
      clock.advance(2001);

      await expect(cache.get(path, PAGES)).resolves.toMatchObject({
        lastModified: clock.perfNow(),
      });
    }
  );

  it.each(['/a/one', '/a/id/123'])(
    'marks %s stale when that article changes',
    async path => {
      const { clock, shared, cache } = await rendered(path);
      shared.versions.set(`website:path:${path}`, 'p1');
      clock.advance(2001);

      await expect(cache.get(path, PAGES)).resolves.toEqual({
        value: page(path),
        lastModified: 1,
      });
    }
  );

  it.each(['/a/One', '/a/ONE', '/a/id/ABC'])(
    'marks %s stale when that article changes under its lower-case path',
    async path => {
      const { clock, shared, cache } = await rendered(path);
      shared.versions.set(`website:path:${path.toLowerCase()}`, 'p1');
      clock.advance(2001);

      await expect(cache.get(path, PAGES)).resolves.toMatchObject({
        lastModified: 1,
      });
    }
  );

  it('keeps an article page fresh when another article changes', async () => {
    const { clock, shared, cache } = await rendered('/a/one');
    shared.versions.set('website:path:/a/two', 'p1');
    clock.advance(2001);

    await expect(cache.get('/a/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });
  });

  it('marks article pages stale when the layout changes', async () => {
    const { clock, shared, cache } = await rendered('/a/one');
    shared.versions.set('website:layout', 'l1');
    clock.advance(2001);

    await expect(cache.get('/a/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('still marks an article page stale after its revalidate time', async () => {
    const { clock, cache } = await rendered('/a/one');
    clock.advance(3_600_001);

    await expect(cache.get('/a/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('notices an article change within two seconds', async () => {
    const { clock, shared, cache } = await rendered('/a/one');
    await cache.get('/a/one', PAGES);
    shared.versions.set('website:path:/a/one', 'p1');
    clock.advance(1000);

    await expect(cache.get('/a/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });

    clock.advance(1001);

    await expect(cache.get('/a/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('asks Dragonfly for the article versions at most every two seconds', async () => {
    const { clock, shared, cache } = await rendered('/a/one');
    const reads = shared.versionReads;

    await cache.get('/a/one', PAGES);
    await cache.get('/a/one', PAGES);
    clock.advance(1999);
    await cache.get('/a/one', PAGES);

    expect(shared.versionReads).toBe(reads);
  });

  it('remembers the article version from before rendering', async () => {
    const { clock, shared, pod } = setup();
    const cache = pod();

    await expect(cache.get('/a/one', PAGES)).resolves.toBeNull();
    shared.versions.set('website:path:/a/one', 'p1');
    clock.advance(2001);
    await cache.set('/a/one', page('read before the change'), revalidate(3600));

    await expect(cache.get('/a/one', PAGES)).resolves.toMatchObject({
      lastModified: 1,
    });
  });

  it('serves the article page while Dragonfly cannot answer for its versions', async () => {
    const { clock, shared, cache } = await rendered('/a/one');
    shared.available = false;
    clock.advance(2001);

    await expect(cache.get('/a/one', PAGES)).resolves.toMatchObject({
      lastModified: clock.perfNow(),
    });
  });

  it.each(['/a', '/a/index', '/a/tag', '/a/tag/politik', '/de/a/one', '/one'])(
    'marks %s stale when anything is published',
    async path => {
      const { clock, shared, cache } = await rendered(path);
      shared.version = 'v2';
      clock.advance(2001);

      await expect(cache.get(path, PAGES)).resolves.toMatchObject({
        lastModified: 1,
      });
    }
  );
});
