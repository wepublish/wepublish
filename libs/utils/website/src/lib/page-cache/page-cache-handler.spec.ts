// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { IncrementalCache } from 'next/dist/server/lib/incremental-cache';
import { SharedCacheControls } from 'next/dist/server/lib/incremental-cache/shared-cache-controls.external';
import PageCacheHandler from './page-cache-handler';

const manifest = {
  version: 4,
  routes: {},
  dynamicRoutes: {},
  notFoundRoutes: [],
  preview: {
    previewModeId: 'preview',
    previewModeSigningKey: '',
    previewModeEncryptionKey: '',
  },
};

const buildOutput = () => {
  const distDir = mkdtempSync(join(tmpdir(), 'page-cache-build-'));
  const serverDistDir = join(distDir, 'server');
  mkdirSync(serverDistDir);
  writeFileSync(join(distDir, 'BUILD_ID'), 'build-test\n');

  return serverDistDir;
};

const incrementalCache = (
  serverDistDir: string,
  requestHeaders: Record<string, string> = {}
) =>
  new IncrementalCache({
    dev: false,
    flushToDisk: false,
    minimalMode: false,
    serverDistDir,
    requestHeaders,
    maxMemoryCacheSize: 0,
    getPrerenderManifest: () => manifest as never,
    fetchCacheKeyPrefix: '',
    CurCacheHandler: PageCacheHandler as never,
    allowedRevalidateHeaderKeys: [],
  } as never);

const page = (html: string) => ({
  kind: 'PAGES',
  html,
  pageData: { pageProps: {} },
  headers: {},
  status: 200,
});

const PAGES = { kind: 'PAGES', isFallback: false, isRoutePPREnabled: false };
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('PageCacheHandler', () => {
  beforeEach(() => {
    vi.stubEnv('REDIS_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    new SharedCacheControls(manifest as never).clear();
  });

  it('keeps a page fresh past one second on a pod that did not render it', async () => {
    const serverDistDir = buildOutput();

    await incrementalCache(serverDistDir).set(
      '/a/one',
      page('one') as never,
      {
        cacheControl: { revalidate: 2, expire: undefined },
        isRoutePPREnabled: false,
        isFallback: false,
      } as never
    );
    new SharedCacheControls(manifest as never).clear();
    await sleep(1200);

    const entry = await incrementalCache(serverDistDir).get(
      '/a/one',
      PAGES as never
    );

    expect(entry?.value).toEqual(page('one'));
    expect(entry?.isStale).toBeFalsy();
  });

  it('lets Next regenerate a page once its own revalidate time is over', async () => {
    const serverDistDir = buildOutput();

    await incrementalCache(serverDistDir).set(
      '/a/one',
      page('one') as never,
      {
        cacheControl: { revalidate: 1, expire: undefined },
        isRoutePPREnabled: false,
        isFallback: false,
      } as never
    );
    await sleep(1100);

    const entry = await incrementalCache(serverDistDir).get(
      '/a/one',
      PAGES as never
    );

    expect(entry?.value).toEqual(page('one'));
    expect(entry?.isStale).toBe(true);
  });

  it('does not hold back the next render after a prefetch, for which Next never renders', async () => {
    const serverDistDir = buildOutput();

    await incrementalCache(serverDistDir).set(
      '/a/one',
      page('one') as never,
      {
        cacheControl: { revalidate: 1, expire: undefined },
        isRoutePPREnabled: false,
        isFallback: false,
      } as never
    );
    await sleep(1100);

    const prefetched = await incrementalCache(serverDistDir, {
      purpose: 'prefetch',
    }).get('/a/one', PAGES as never);
    const visited = await incrementalCache(serverDistDir).get(
      '/a/one',
      PAGES as never
    );
    const visitedAgain = await incrementalCache(serverDistDir).get(
      '/a/one',
      PAGES as never
    );

    expect(prefetched?.isStale).toBe(true);
    expect(visited?.isStale).toBe(true);
    expect(visitedAgain?.isStale).toBeFalsy();
  });

  it('shares one cache between the handlers Next creates per request', async () => {
    const serverDistDir = buildOutput();
    const ctx = { serverDistDir };

    await new PageCacheHandler(ctx).set('/a/one', page('one'), {
      cacheControl: { revalidate: 60 },
    });

    await expect(
      new PageCacheHandler(ctx).get('/a/one', PAGES)
    ).resolves.toMatchObject({ value: page('one') });
  });

  it('shares one cache when Next names the same build output in two ways', async () => {
    const serverDistDir = buildOutput();
    const sameDirOtherSpelling = `${serverDistDir}/../server`;

    await new PageCacheHandler({ serverDistDir }).set('/a/one', page('one'), {
      cacheControl: { revalidate: 60 },
    });

    await expect(
      new PageCacheHandler({ serverDistDir: sameDirOtherSpelling }).get(
        '/a/one',
        PAGES
      )
    ).resolves.toMatchObject({ value: page('one') });
  });

  it('does not mix the caches of different build outputs', async () => {
    await new PageCacheHandler({ serverDistDir: buildOutput() }).set(
      '/a/one',
      page('one'),
      { cacheControl: { revalidate: 60 } }
    );

    await expect(
      new PageCacheHandler({ serverDistDir: buildOutput() }).get(
        '/a/one',
        PAGES
      )
    ).resolves.toBeNull();
  });

  it('never keeps a page that was not found', async () => {
    const serverDistDir = buildOutput();

    await incrementalCache(serverDistDir).set('/a/missing', null, {
      cacheControl: { revalidate: 1, expire: undefined },
      isRoutePPREnabled: false,
      isFallback: false,
    } as never);

    await expect(
      incrementalCache(serverDistDir).get('/a/missing', PAGES as never)
    ).resolves.toBeNull();
  });
});
