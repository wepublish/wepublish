import { NextApiRequest, NextApiResponse } from 'next';

const oembedUrl = (vimeoId: string) =>
  `https://vimeo.com/api/oembed.json?width=1920&url=${encodeURIComponent(
    `https://vimeo.com/${vimeoId}`
  )}`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const vimeoId = Array.isArray(id) ? id[0] : id;

  if (!vimeoId || !/^\d+$/.test(vimeoId)) {
    res.status(400).end();

    return;
  }

  try {
    const response = await fetch(oembedUrl(vimeoId));
    const data = response.ok ? await response.json() : null;
    const thumbnail = data?.thumbnail_url;

    if (typeof thumbnail !== 'string' || !thumbnail.startsWith('https://')) {
      res.status(404).end();

      return;
    }

    res
      .setHeader(
        'Cache-Control',
        'public, s-maxage=86400, stale-while-revalidate=604800'
      )
      .setHeader('CDN-Cache-Control', 'public, s-maxage=86400')
      .redirect(307, thumbnail);
  } catch {
    res.status(502).end();
  }
}
