import {NextApiRequest, NextApiResponse} from 'next'
import {getFeed} from '../../components/should-be-website-builder/feed'

export const config = {
  regions: ['all']
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res
    .status(200)
    .setHeader('Content-Type', 'application/xml')
    .send((await getFeed(req)).atom1())
}
