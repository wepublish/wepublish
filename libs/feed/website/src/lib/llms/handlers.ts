import { getApiUrl } from '@wepublish/utils/website';
import { getApiClient } from '@wepublish/website/api';
import { NextApiRequest, NextApiResponse } from 'next';
import { SitemapClient } from '../sitemap';
import { siteUrlFor } from '../sitemap/site-url';
import { LlmsTxtSiteConfig, renderLlmsTxt } from './render';

export const LLMS_TXT_CACHE_CONTROL =
  'public, max-age=600, s-maxage=600, stale-while-revalidate=3600, stale-if-error=86400';

type Options = {
  getClient?: () => SitemapClient;
};

export const createLlmsTxtHandler =
  (
    config: LlmsTxtSiteConfig,
    {
      getClient = () => getApiClient(getApiUrl(), [], { typePolicies: {} }),
    }: Options = {}
  ) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const txt = await renderLlmsTxt(config, {
        client: getClient(),
        siteUrl: siteUrlFor(name => req.headers[name]),
      });

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Cache-Control', LLMS_TXT_CACHE_CONTROL);
      res.setHeader('CDN-Cache-Control', LLMS_TXT_CACHE_CONTROL);
      res.setHeader('Vercel-CDN-Cache-Control', LLMS_TXT_CACHE_CONTROL);
      res.status(200).send(txt);
    } catch (error) {
      console.error('Failed to generate llms.txt', error);
      res.setHeader('Cache-Control', 'no-store');
      res.status(500).end();
    }
  };
