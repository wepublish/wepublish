import { SitemapClient } from '../sitemap';
import { siteUrlFor } from '../sitemap/site-url';
import { LLMS_TXT_CACHE_CONTROL } from './handlers';
import { LlmsTxtSiteConfig, renderLlmsTxt } from './render';

type Options = {
  getClient: () => SitemapClient;
  now?: () => Date;
};

export const createLlmsTxtFetchHandler =
  (config: LlmsTxtSiteConfig, { getClient, now = () => new Date() }: Options) =>
  async (request: Request) => {
    try {
      const txt = await renderLlmsTxt(config, {
        client: getClient(),
        siteUrl: siteUrlFor(name => request.headers.get(name)),
        now: now(),
      });

      return new Response(txt, {
        headers: {
          'content-type': 'text/markdown; charset=utf-8',
          'cache-control': LLMS_TXT_CACHE_CONTROL,
          'cdn-cache-control': LLMS_TXT_CACHE_CONTROL,
          'vercel-cdn-cache-control': LLMS_TXT_CACHE_CONTROL,
        },
      });
    } catch (error) {
      console.error('Failed to generate llms.txt', error);

      return new Response(null, {
        status: 500,
        headers: { 'cache-control': 'no-store' },
      });
    }
  };
