import { captureException } from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { createFeedHandler, FEED_CACHE_CONTROL } from './feed-handler';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const feed = {
  rss2: () => '<rss />',
  atom1: () => '<feed />',
  json1: () => '{}',
};

const request = (method = 'GET') =>
  ({ method, url: '/api/rss-feed', headers: {} }) as unknown as NextApiRequest;

const response = () => {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    body: undefined as string | undefined,
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(body: string) {
      res.body = body;
      return res;
    },
    end() {
      return res;
    },
  };

  return res as typeof res & NextApiResponse;
};

describe('createFeedHandler', () => {
  beforeEach(() => {
    vi.mocked(captureException).mockClear();
  });

  it.each([
    ['rss2', '<rss />', 'application/xml'],
    ['atom1', '<feed />', 'application/xml'],
    ['json1', '{}', 'application/json'],
  ] as const)(
    'serves the %s feed with the shared cache policy',
    async (format, body, contentType) => {
      const res = response();

      await createFeedHandler(async () => feed, format)(request(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(body);
      expect(res.headers['content-type']).toBe(contentType);
      expect(res.headers['cache-control']).toBe(FEED_CACHE_CONTROL);
      expect(res.headers['cdn-cache-control']).toBe(FEED_CACHE_CONTROL);
      expect(res.headers['vercel-cdn-cache-control']).toBe(FEED_CACHE_CONTROL);
    }
  );

  it('lets a tenant keep its own cache policy', async () => {
    const res = response();

    await createFeedHandler(async () => feed, 'rss2', {
      cacheControl: 'public, s-maxage=60',
      cdnCacheControl: 'public, s-maxage=60',
      vercelCdnCacheControl: 'public, s-maxage=3600',
    })(request(), res);

    expect(res.headers['cache-control']).toBe('public, s-maxage=60');
    expect(res.headers['cdn-cache-control']).toBe('public, s-maxage=60');
    expect(res.headers['vercel-cdn-cache-control']).toBe(
      'public, s-maxage=3600'
    );
  });

  it('answers 502 without caching and reports to Sentry when the API rejects the feed query', async () => {
    const res = response();
    const error = new Error(
      'Response not successful: Received status code 400'
    );

    await expect(
      createFeedHandler(async () => {
        throw error;
      }, 'rss2')(request(), res)
    ).resolves.toBeUndefined();

    expect(res.statusCode).toBe(502);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toBeUndefined();
    expect(captureException).toHaveBeenCalledWith(error);
  });

  it('does not report a feed that was served', async () => {
    await createFeedHandler(async () => feed, 'rss2')(request(), response());

    expect(captureException).not.toHaveBeenCalled();
  });

  it.each(['POST', 'PUT', 'DELETE'])(
    'rejects %s with 405 without building the feed',
    async method => {
      const res = response();
      const getFeed = vi.fn(async () => feed);

      await createFeedHandler(getFeed, 'atom1')(request(method), res);

      expect(res.statusCode).toBe(405);
      expect(res.headers['allow']).toBe('GET, HEAD');
      expect(getFeed).not.toHaveBeenCalled();
    }
  );

  it('serves HEAD like GET', async () => {
    const res = response();

    await createFeedHandler(async () => feed, 'rss2')(request('HEAD'), res);

    expect(res.statusCode).toBe(200);
  });
});
