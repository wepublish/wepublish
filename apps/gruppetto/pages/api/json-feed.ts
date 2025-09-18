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
    .send((await getFeed(req)).json1());
}
