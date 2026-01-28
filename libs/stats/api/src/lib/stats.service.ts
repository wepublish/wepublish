import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaClient) {}

  async getAuthorsCount(): Promise<number> {
    return await this.prisma.author.count();
  }

  async getArticlesCount(): Promise<number> {
    return await this.prisma.article.count({
      where: {
        revisions: {
          some: {
            publishedAt: {
              not: null,
            },
          },
        },
      },
    });
  }

  async getFirstArticleDate(): Promise<Date | null> {
    const earliestArticle = await this.prisma.articleRevision.findFirst({
      where: {
        publishedAt: {
          not: null,
        },
      },
      orderBy: {
        publishedAt: 'asc',
      },
      select: {
        publishedAt: true,
      },
    });

    return earliestArticle?.publishedAt || null;
  }
}
