import { getApiUrl } from '@wepublish/utils/website';
import { getApiClient } from '@wepublish/website/api';
import { NextApiRequest, NextApiResponse } from 'next';
import { CacheableSitemap, cacheControlFor, parseChunk } from './partition';
import {
  renderSitemap,
  renderSitemapChunk,
  SitemapClient,
  SitemapContext,
  SitemapSiteConfig,
} from './render';
import { siteUrlFor } from './site-url';

type Options = {
  getClient?: () => SitemapClient;
  now?: () => Date;
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const createSitemapHandlers = (
  config: SitemapSiteConfig,
  {
    getClient = () => getApiClient(getApiUrl(), [], { typePolicies: {} }),
    now = () => new Date(),
  }: Options = {}
) => {
  const respond = async (
    req: NextApiRequest,
    res: NextApiResponse,
    sitemap: CacheableSitemap,
    render: (context: SitemapContext) => Promise<string | null>
  ) => {
    const context = {
      client: getClient(),
      siteUrl: siteUrlFor(name => req.headers[name]),
      now: now(),
    };

    try {
      const xml = await render(context);

      if (xml === null) {
        res.status(404).end();
        return;
      }

      const cacheControl = cacheControlFor(sitemap, context.now);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', cacheControl);
      res.setHeader('CDN-Cache-Control', cacheControl);
      res.setHeader('Vercel-CDN-Cache-Control', cacheControl);
      res.status(200).send(xml);
    } catch (error) {
      console.error('Failed to generate the sitemap', error);
      res.setHeader('Cache-Control', 'no-store');
      res.status(500).end();
    }
  };

  return {
    sitemap: (req: NextApiRequest, res: NextApiResponse) =>
      respond(req, res, { type: 'index' }, context =>
        renderSitemap(config, context)
      ),

    sitemapChunk: async (req: NextApiRequest, res: NextApiResponse) => {
      const chunk = parseChunk(firstValue(req.query['chunk']));

      if (!chunk) {
        res.status(404).end();
        return;
      }

      return respond(req, res, chunk, context =>
        renderSitemapChunk(config, chunk, context)
      );
    },
  };
};
