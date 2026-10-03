import { existsSync } from 'fs';
import { join } from 'path';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import nextConfig from './next.config';

type HeaderRule = {
  source: string;
  headers: Array<{ key: string; value: string }>;
};

const cacheControlFor = async (path: string) => {
  const rules: HeaderRule[] = await nextConfig.headers();

  return rules
    .filter(rule => getPathMatch(rule.source)(path) !== false)
    .flatMap(rule => rule.headers)
    .filter(header => header.key.toLowerCase() === 'cache-control')
    .at(-1)?.value;
};

describe('cache headers in production', () => {
  const nodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env.NODE_ENV = nodeEnv;
  });

  it.each([
    '/login',
    '/mitmachen',
    '/profile',
    '/profile/subscription/1234',
    '/profile/rechnungen',
    '/api/cookie',
  ])('never lets a shared cache keep %s', async path => {
    await expect(cacheControlFor(path)).resolves.toBe('no-store');
  });

  it.each(['/', '/a/some-article', '/signup', '/search'])(
    'lets shared caches keep %s for a minute',
    async path => {
      await expect(cacheControlFor(path)).resolves.toContain('s-maxage=59');
    }
  );
});

describe('page cache', () => {
  it('lets every website share rendered pages through Dragonfly', () => {
    expect(nextConfig.cacheHandler).toBe(
      join(__dirname, 'page-cache', 'page-cache-handler.js')
    );
    expect(existsSync(nextConfig.cacheHandler)).toBe(true);
  });
});
