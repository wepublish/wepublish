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
    .setHeader('Cache-Control', 'public, s-maxage=60')
    .setHeader('CDN-Cache-Control', 'public, s-maxage=60')
    .setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600')
    .send((await getFeed(req)).json1());
}
