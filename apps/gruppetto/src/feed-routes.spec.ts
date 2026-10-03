// @vitest-environment node
import { NextApiRequest, NextApiResponse } from 'next';

import atomFeed from '../pages/api/atom-feed';
import jsonFeed from '../pages/api/json-feed';
import rssFeed from '../pages/api/rss-feed';

vi.mock('./feed', () => ({
  getFeed: async () => ({
    atom1: () => '<feed />',
    json1: () => '{}',
    rss2: () => '<rss />',
  }),
}));

const SHARED_CACHE =
  's-maxage=599, stale-while-revalidate=599, max-age=599, stale-while-revalidate=604800, stale-if-error=86400, public';

const respond = async (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) => {
  const headers = new Map<string, string>();
  const res = {
    status: () => res,
    setHeader: (name: string, value: string) => {
      headers.set(name.toLowerCase(), value);

      return res;
    },
    send: () => res,
  };

  await handler(
    { url: '/api/feed' } as NextApiRequest,
    res as unknown as NextApiResponse
  );

  return headers;
};

describe('feeds', () => {
  it.each([
    ['rss', rssFeed],
    ['atom', atomFeed],
    ['json', jsonFeed],
  ])(
    'lets the CDN keep the %s feed like on every other website, instead of the no-store of /api',
    async (_, handler) => {
      const headers = await respond(handler);

      expect(headers.get('cache-control')).toBe(SHARED_CACHE);
      expect(headers.get('cdn-cache-control')).toBe(SHARED_CACHE);
      expect(headers.get('vercel-cdn-cache-control')).toBe(SHARED_CACHE);
    }
  );
});
