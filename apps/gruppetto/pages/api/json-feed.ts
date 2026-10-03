import { NextApiRequest, NextApiResponse } from 'next';

import { getFeed } from '../../src/feed';

export const config = {
  regions: ['all'],
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res
    .status(200)
    .setHeader('Content-Type', 'application/json')
    .setHeader(
      'Cache-Control',
      's-maxage=599, stale-while-revalidate=599, max-age=599, stale-while-revalidate=604800, stale-if-error=86400, public'
    )
    .setHeader(
      'CDN-Cache-Control',
      's-maxage=599, stale-while-revalidate=599, max-age=599, stale-while-revalidate=604800, stale-if-error=86400, public'
    )
    .setHeader(
      'Vercel-CDN-Cache-Control',
      's-maxage=599, stale-while-revalidate=599, max-age=599, stale-while-revalidate=604800, stale-if-error=86400, public'
    )
    .send((await getFeed(req)).json1());
}
