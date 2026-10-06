// @vitest-environment node
import { tracePageCacheGet } from './page-cache-tracing';

const recordingStartSpan = () => {
  const spans: Array<{
    options: Record<string, unknown>;
    attributes: Record<string, unknown>;
  }> = [];
  const startSpan = (
    options: Record<string, unknown> & { attributes?: Record<string, unknown> },
    callback: (span: unknown) => unknown
  ) => {
    const attributes = { ...options.attributes };
    spans.push({ options, attributes });

    return callback({
      setAttribute: (key: string, value: unknown) => {
        attributes[key] = value;
      },
    });
  };

  return { spans, startSpan };
};

describe('tracePageCacheGet', () => {
  it('marks a page the website has to render as a miss', async () => {
    const { spans, startSpan } = recordingStartSpan();

    await tracePageCacheGet(
      startSpan,
      '/a/one',
      { kind: 'PAGES' },
      async () => null
    );

    expect(spans).toEqual([
      {
        options: expect.objectContaining({
          name: 'website:pages',
          op: 'cache.get',
          onlyIfParent: true,
        }),
        attributes: { 'cache.key': ['/a/one'], 'cache.hit': false },
      },
    ]);
  });

  it('marks a page served from the cache as a hit and returns it', async () => {
    const { spans, startSpan } = recordingStartSpan();
    const entry = { value: { kind: 'PAGES' }, lastModified: 1 };

    const result = await tracePageCacheGet(
      startSpan,
      '/',
      { kind: 'PAGES' },
      async () => entry
    );

    expect(result).toBe(entry);
    expect(spans[0].attributes['cache.hit']).toBe(true);
  });

  it('leaves everything but pages untraced', async () => {
    const { spans, startSpan } = recordingStartSpan();

    await tracePageCacheGet(
      startSpan,
      'fetch',
      { kind: 'FETCH' },
      async () => null
    );

    expect(spans).toEqual([]);
  });

  it('just reads the cache without Sentry', async () => {
    await expect(
      tracePageCacheGet(undefined, '/', { kind: 'PAGES' }, async () => null)
    ).resolves.toBeNull();
  });
});
