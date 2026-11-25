// @vitest-environment node
import { captureException } from '@sentry/tanstackstart-react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { feedHandler, healthHandler } from './server-routes';

vi.mock('@sentry/tanstackstart-react', () => ({ captureException: vi.fn() }));

/**
 * Byte-for-byte the policy the Next feed endpoints served, kept here so the
 * TanStack port cannot quietly weaken it. `stale-while-revalidate` is the part
 * that actually keeps feeds cheap under load, and `vercel-cdn-cache-control`
 * is what the CDN in front of production reads.
 */
const SHARED_CACHE =
  's-maxage=599, stale-while-revalidate=599, max-age=599, stale-if-error=86400, public';

const getFeed = async () => ({
  atom1: () => '<feed />',
  json1: () => '{}',
  rss2: () => '<rss />',
});

describe('server routes', () => {
  it.each(['rss2', 'atom1', 'json1'] as const)(
    'lets the CDN keep the %s feed, rather than inheriting the no-store of /api',
    async format => {
      const response = await feedHandler(
        new Request('https://site.test/rss.xml'),
        getFeed,
        () => 'https://site.test',
        format
      );

      expect(response.headers.get('cache-control')).toBe(SHARED_CACHE);
      expect(response.headers.get('cdn-cache-control')).toBe(SHARED_CACHE);
      expect(response.headers.get('vercel-cdn-cache-control')).toBe(
        SHARED_CACHE
      );
    }
  );

  it('answers 502 without caching and reports to Sentry when the API rejects the feed query', async () => {
    const error = new Error(
      'Response not successful: Received status code 400'
    );

    const response = await feedHandler(
      new Request('https://site.test/rss.xml'),
      async () => {
        throw error;
      },
      () => 'https://site.test',
      'rss2'
    );

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(captureException).toHaveBeenCalledWith(error);
  });

  it('never lets the probe endpoint be cached', () => {
    expect(healthHandler().headers.get('cache-control')).toBe('no-store');
  });

  it('is exported by the server barrel only, so a server-only import here cannot reach a client bundle', () => {
    const exportsOf = (file: string) =>
      readFileSync(join(__dirname, file), 'utf8');

    expect(exportsOf('index.ts')).not.toMatch(/['/]server-routes'/);
    expect(exportsOf('../../tanstack-server.ts')).toMatch(
      /export \* from '\.\/tanstack\/routes\/server-routes';/
    );
  });
});
