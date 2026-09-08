import { Injectable } from '@nestjs/common';
import { Article, PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import { URLAdapter } from './url-adapter';

export const ARCHIVED_TAG = 'archiviert';

@Injectable()
export class HauptstadtURLAdapter extends URLAdapter {
  // the adapter is a singleton, so the loader disables caching and only
  // batches lookups happening in the same tick (e.g. all teasers of a page)
  private archivedLoader = new DataLoader<string, boolean>(
    async articleIds => {
      const archivedRows = await this.prisma.taggedArticles.findMany({
        where: {
          articleId: { in: [...articleIds] },
          tag: {
            tag: { equals: ARCHIVED_TAG, mode: 'insensitive' },
          },
        },
        select: { articleId: true },
      });
      const archivedIds = new Set(archivedRows.map(row => row.articleId));

      return articleIds.map(articleId => archivedIds.has(articleId));
    },
    { cache: false }
  );

  constructor(
    baseURL: string,
    private prisma: PrismaClient
  ) {
    super(baseURL);
  }

  override async getArticleUrl(article: Article) {
    const isArchived = await this.archivedLoader.load(article.id);

    if (isArchived && article.slug) {
      return `${this.baseURL}/archive/${article.slug}?articleId=${article.id}`;
    }

    return `${this.baseURL}/a/${article.slug}?articleId=${article.id}`;
  }

  override async getArticlePreviewUrl(article: Article) {
    return `${await this.getArticleUrl(article)}&preview`;
  }
}
