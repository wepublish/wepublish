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
  getClient: () => SitemapClient;
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
 * The client comes from the caller because it is framework specific. The
 * site URL does not: it is read off the request exactly as the Next handlers
 * read it — `WEBSITE_URL`, else the proxy's `x-forwarded-host` and
 * `x-forwarded-proto`, else `host` — so a sitemap behind the ingress names the
 * public host, not the pod's.
 */
export const createSitemapFetchHandlers = (
  config: SitemapSiteConfig,
  { getClient, now = () => new Date() }: Options
) => {
  const respond = async (
    request: Request,
    sitemap: CacheableSitemap,
    render: (context: SitemapContext) => Promise<string | null>
  ) => {
    const context = {
      client: getClient(),
      siteUrl: siteUrlFor(name => request.headers.get(name)),
      now: now(),
    };

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
    sitemap: (request: Request) =>
      respond(request, { type: 'index' }, context =>
        renderSitemap(config, context)
      ),

    sitemapChunk: async (request: Request, name: string | undefined) => {
      const chunk = parseChunk(name);

      return chunk ?
          respond(request, chunk, context =>
            renderSitemapChunk(config, chunk, context)
          )
        : NOT_FOUND();
    },
  };
};
