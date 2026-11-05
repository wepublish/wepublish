import { captureException } from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

export type FeedFormat = 'rss2' | 'atom1' | 'json1';

type RenderableFeed = Record<FeedFormat, () => string>;

type CacheHeaders = {
  cacheControl?: string;
  cdnCacheControl?: string;
  vercelCdnCacheControl?: string;
};

export const FEED_CACHE_CONTROL =
  's-maxage=599, stale-while-revalidate=599, max-age=599, stale-if-error=86400, public';

const CONTENT_TYPE: Record<FeedFormat, string> = {
  rss2: 'application/xml',
  atom1: 'application/xml',
  json1: 'application/json',
};

const ALLOWED_METHODS = ['GET', 'HEAD'];

export const createFeedHandler =
  (
    getFeed: (req: NextApiRequest) => Promise<RenderableFeed>,
    format: FeedFormat,
    {
      cacheControl = FEED_CACHE_CONTROL,
      cdnCacheControl = cacheControl,
      vercelCdnCacheControl = cdnCacheControl,
    }: CacheHeaders = {}
  ) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (!ALLOWED_METHODS.includes(req.method ?? 'GET')) {
      res.setHeader('Allow', ALLOWED_METHODS.join(', '));
      res.status(405).end();
      return;
    }

    let body: string;

    try {
      body = (await getFeed(req))[format]();
    } catch (error) {
      captureException(error);
      res.setHeader('Cache-Control', 'no-store');
      res.status(502).end();
      return;
    }

    res
      .status(200)
      .setHeader('Content-Type', CONTENT_TYPE[format])
      .setHeader('Cache-Control', cacheControl)
      .setHeader('CDN-Cache-Control', cdnCacheControl)
      .setHeader('Vercel-CDN-Cache-Control', vercelCdnCacheControl)
      .send(body);
  };
