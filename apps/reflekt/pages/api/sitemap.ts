import { NextApiRequest, NextApiResponse } from 'next';

import { getSitemap } from '../../src/sitemap';

export const config = {
  regions: ['all'],
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res
    .status(200)
    .setHeader('Content-Type', 'application/xml')
    .setHeader('Cache-Control', 'public, s-maxage=60')
    .setHeader('CDN-Cache-Control', 'public, s-maxage=60')
    .setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600')
    .send(await getSitemap(req));
}
