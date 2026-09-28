import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { URLAdapter } from '@wepublish/nest-modules';
import {
  deriveSeoChecklist,
  getRobotsUrl,
  getSitemapUrl,
  SeoProbeResult,
} from './seo-checklist';

const PROBE_TIMEOUT = 5000;

@Injectable()
export class SeoChecklistService {
  constructor(
    private prisma: PrismaClient,
    private urlAdapter: URLAdapter
  ) {}

  async getChecklist() {
    const websiteUrl = this.urlAdapter.getWebsiteUrl();

    const [latestArticle, peerProfile] = await Promise.all([
      this.prisma.article.findFirst({
        where: {
          hidden: false,
          peerId: null,
          publishedAt: { not: null, lte: new Date() },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.peerProfile.findFirst({}),
    ]);

    const latestArticleUrl =
      latestArticle ? await this.urlAdapter.getArticleUrl(latestArticle) : null;

    const [robots, sitemap, latestArticleProbe] = await Promise.all([
      this.probe(getRobotsUrl(websiteUrl)),
      this.probe(getSitemapUrl(websiteUrl)),
      latestArticleUrl ? this.probe(latestArticleUrl) : null,
    ]);

    return deriveSeoChecklist({
      websiteUrl,
      robots,
      sitemap,
      latestArticleUrl,
      latestArticle: latestArticleProbe,
      publication:
        peerProfile ?
          { name: peerProfile.name, hasLogo: !!peerProfile.logoID }
        : null,
    });
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
