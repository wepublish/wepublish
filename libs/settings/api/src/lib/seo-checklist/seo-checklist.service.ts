import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { URLAdapter } from '@wepublish/nest-modules';
import { promisify } from 'node:util';
import { gunzip } from 'node:zlib';
import {
  deriveSeoChecks,
  getSeoUrls,
  parseSitemap,
  SEO_CHECKLIST_ITEM_ID,
  SeoProbeResult,
  SitemapResult,
} from './seo-checklist';
import { SeoChecklist, SeoChecklistItem } from './seo-checklist.model';

const PROBE_TIMEOUT = 5000;
const MAX_NESTED_SITEMAPS = 50;
const MAX_CONCURRENT_PROBES = 4;
// The sitemap protocol's limit for an uncompressed sitemap.
const MAX_SITEMAP_SIZE = 50 * 1024 * 1024;

const gunzipAsync = promisify(gunzip);

const isGzip = (body: Buffer) => body[0] === 0x1f && body[1] === 0x8b;

const mapConcurrently = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
) => {
  const results: R[] = new Array(items.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    })
  );

  return results;
};

@Injectable()
export class SeoChecklistService {
  constructor(
    private prisma: PrismaClient,
    private urlAdapter: URLAdapter
  ) {}

  async getChecklist(): Promise<SeoChecklist> {
    const websiteUrl = this.urlAdapter.getWebsiteUrl();
    const urls = getSeoUrls(websiteUrl);

    const [latestArticle, peerProfile, completedItems] = await Promise.all([
      this.prisma.article.findFirst({
        where: {
          hidden: false,
          peerId: null,
          publishedAt: { not: null, lte: new Date() },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.peerProfile.findFirst({}),
      this.getCompletedItems(),
    ]);

    const latestArticleUrl =
      latestArticle ? await this.urlAdapter.getArticleUrl(latestArticle) : null;

    const [sitemaps, rssFeed, latestArticleProbe] = await Promise.all([
      this.probeSitemaps(urls.sitemapUrl),
      this.probe(urls.rssFeedUrl),
      latestArticleUrl ? this.probe(latestArticleUrl) : null,
    ]);

    return {
      websiteUrl,
      ...urls,
      checks: deriveSeoChecks({
        websiteUrl,
        sitemaps,
        rssFeed,
        latestArticleUrl,
        latestArticle: latestArticleProbe,
        publication:
          peerProfile ?
            { name: peerProfile.name, hasLogo: !!peerProfile.logoID }
          : null,
      }),
      completedItems,
    };
  }

  async getCompletedItems(): Promise<SeoChecklistItem[]> {
    const items = await this.prisma.seoChecklistItem.findMany({
      include: { completedBy: true },
      orderBy: { createdAt: 'asc' },
    });

    return items.map(item => ({
      itemId: item.itemId,
      completedAt: item.modifiedAt,
      completedBy:
        item.completedBy ?
          [item.completedBy.firstName, item.completedBy.name]
            .filter(Boolean)
            .join(' ')
        : undefined,
    }));
  }

  async updateItem(
    itemId: string,
    completed: boolean,
    userId: string | undefined
  ): Promise<SeoChecklistItem[]> {
    if (!SEO_CHECKLIST_ITEM_ID.test(itemId)) {
      throw new BadRequestException('Invalid checklist item');
    }

    if (completed) {
      await this.prisma.seoChecklistItem.upsert({
        where: { itemId },
        create: { itemId, completedByUserId: userId },
        update: { completedByUserId: userId },
      });
    } else {
      await this.prisma.seoChecklistItem.deleteMany({ where: { itemId } });
    }

    return this.getCompletedItems();
  }

  private async probeSitemaps(url: string): Promise<SitemapResult[]> {
    const sitemap = await this.readSitemap(url);

    if (!('locs' in sitemap)) {
      return [sitemap];
    }

    // Children must live on the index's origin (sitemap protocol), so a
    // tampered index can't make the API fetch arbitrary hosts.
    const { origin } = new URL(sitemap.url);
    const nestedUrls = [
      ...new Set(
        sitemap.locs.map(loc => URL.parse(loc, sitemap.url)?.href ?? loc)
      ),
    ].slice(0, MAX_NESTED_SITEMAPS);

    if (!nestedUrls.length) {
      return [{ url, error: 'No <urlset> found' }];
    }

    return mapConcurrently(
      nestedUrls,
      MAX_CONCURRENT_PROBES,
      async (nestedUrl): Promise<SitemapResult> => {
        if (URL.parse(nestedUrl)?.origin !== origin) {
          return { url: nestedUrl, error: `Not on ${origin}` };
        }

        const nested = await this.readSitemap(nestedUrl);

        return 'locs' in nested ?
            { url: nestedUrl, error: 'Nested sitemap index' }
          : nested;
      }
    );
  }

  private async readSitemap(url: string) {
    return parseSitemap(url, await this.probe(url));
  }

  private async probe(url: string): Promise<SeoProbeResult> {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(PROBE_TIMEOUT),
      });
      const body = Buffer.from(await response.arrayBuffer());

      return {
        reachable: true,
        status: response.status,
        url: response.url || url,
        // `.xml.gz` sitemaps are often served without Content-Encoding.
        body: (isGzip(body) ?
          await gunzipAsync(body, { maxOutputLength: MAX_SITEMAP_SIZE })
        : body
        ).toString('utf8'),
      };
    } catch (error) {
      return {
        reachable: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
