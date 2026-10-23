import { CacheableSitemap, cacheControlFor, parseChunk } from './partition';
import {
  renderSitemap,
  renderSitemapChunk,
  SitemapClient,
  SitemapContext,
  SitemapSiteConfig,
} from './render';

type Options = {
  getClient: () => SitemapClient;
  getSiteUrl: () => string;
  now?: () => Date;
};

const NOT_FOUND = () => new Response(null, { status: 404 });

/**
 * The Fetch API half of {@link createSitemapHandlers}, for tenants whose
 * server routes speak `Request`/`Response` rather than
 * `NextApiRequest`/`NextApiResponse` — today gruppetto, on TanStack Start.
 *
 * Only the transport differs: the rendering, the chunk parsing and the cache
 * policy are the same modules the Next tenants run, so a sitemap looks the
 * same on either stack.
 *
 * The client and the site URL come from the caller because they are
 * framework specific — TanStack reads the host off the ambient request, Next
 * off `req.headers`.
 */
export const createSitemapFetchHandlers = (
  config: SitemapSiteConfig,
  { getClient, getSiteUrl, now = () => new Date() }: Options
) => {
  const respond = async (
    sitemap: CacheableSitemap,
    render: (context: SitemapContext) => Promise<string | null>
  ) => {
    const context = { client: getClient(), siteUrl: getSiteUrl(), now: now() };

    try {
      const xml = await render(context);

      if (xml === null) {
        return NOT_FOUND();
      }

      const cacheControl = cacheControlFor(sitemap, context.now);

      return new Response(xml, {
        headers: {
          'content-type': 'application/xml',
          // Cloudflare ignores `cache-control` once `cdn-cache-control` is
          // present on any route, and Vercel reads its own. All three or the
          // sitemap falls back to the origin policy.
          'cache-control': cacheControl,
          'cdn-cache-control': cacheControl,
          'vercel-cdn-cache-control': cacheControl,
        },
      });
    } catch (error) {
      console.error('Failed to generate the sitemap', error);

      return new Response(null, {
        status: 500,
        headers: { 'cache-control': 'no-store' },
      });
    }
  };

  return {
    sitemap: () =>
      respond({ type: 'index' }, context => renderSitemap(config, context)),

    sitemapChunk: async (name: string | undefined) => {
      const chunk = parseChunk(name);

      return chunk ?
          respond(chunk, context => renderSitemapChunk(config, chunk, context))
        : NOT_FOUND();
    },
  };
};
