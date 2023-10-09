import {getFeed} from '../../src/feed'
import {NextApiRequest, NextApiResponse} from 'next'

export const config = {
  regions: ['all']
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res
    .status(200)
    .setHeader('Content-Type', 'application/xml')
    .send((await getFeed(req)).rss2())
}
