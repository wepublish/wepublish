import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { URLAdapter } from '@wepublish/nest-modules';
import {
  deriveSeoChecks,
  getSeoUrls,
  SEO_CHECKLIST_ITEM_ID,
  SeoProbeResult,
} from './seo-checklist';
import { SeoChecklist, SeoChecklistItem } from './seo-checklist.model';

const PROBE_TIMEOUT = 5000;

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

    const [sitemap, rssFeed, latestArticleProbe] = await Promise.all([
      this.probe(urls.sitemapUrl),
      this.probe(urls.rssFeedUrl),
      latestArticleUrl ? this.probe(latestArticleUrl) : null,
    ]);

    return {
      websiteUrl,
      ...urls,
      checks: deriveSeoChecks({
        websiteUrl,
        sitemap,
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

  private async probe(url: string): Promise<SeoProbeResult> {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(PROBE_TIMEOUT),
      });

      return {
        reachable: true,
        status: response.status,
        body: await response.text(),
      };
    } catch (error) {
      return {
        reachable: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
