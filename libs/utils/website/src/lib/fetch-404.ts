import { NextApiRequest, NextApiResponse, NextPageContext } from 'next';

export const fetch404 = async (ctx: NextPageContext): Promise<void> => {
  if (!ctx.req || !ctx.res) {
    console.error('Could not fetch 404 page - no req or res in page-context.');
    return;
  }

  const fourOhFourSlug = '404';

  const res = ctx.res as NextApiResponse;
  const req = ctx.req as NextApiRequest;
  try {
    res.statusCode = 404;
    const key = Reflect.ownKeys(req).find(
      s => String(s) === 'Symbol(NextInternalRequestMeta)'
    ) as keyof typeof req;
    const NextInternalRequestMeta = req[key];
    const proto =
      NextInternalRequestMeta.initProtocol ?
        NextInternalRequestMeta.initProtocol
      : 'https';
    const url = `${proto}://${ctx.req?.headers?.host}/${fourOhFourSlug}`;
    const fetchRes = await fetch(url);
    const notFoundPage = await fetchRes.text();
    res.write(notFoundPage);
    res.end();
  } catch (error) {
    console.error('Error fetching 404 page:', error);
    res.statusCode = 500;
    res.end();
  }
};
