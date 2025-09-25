import { Injectable, Scope } from '@nestjs/common';
import { ArticleRevision, PrismaClient } from '@prisma/client';
import { Primeable } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

type RevisionMap = Partial<{
  draft: ArticleRevision;
  pending: ArticleRevision;
  published: ArticleRevision;
}>;

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticleRevisionDataloaderService
  implements Primeable<RevisionMap>
{
  private dataloader = new DataLoader<string, RevisionMap>(
    async (articleIds: readonly string[]) => {
      const articles = await this.prisma.article.findMany({
        where: {
          id: {
            in: articleIds as string[],
          },
        },
        include: {
          ArticleRevisionPublished: {
            include: {
              articleRevision: true,
            },
          },
          ArticleRevisionDraft: {
            include: {
              articleRevision: true,
            },
          },
          ArticleRevisionPending: {
            include: {
              articleRevision: true,
            },
          },
        },
      });

      return articleIds.map((articleId): RevisionMap => {
        const rev = articles.find(rev => rev.id === articleId);
        const published = rev?.ArticleRevisionPublished?.articleRevision;
        const draft = rev?.ArticleRevisionDraft?.articleRevision;
        const pending = rev?.ArticleRevisionPending?.articleRevision;

        return { draft, pending, published };
      });
    },
    { name: 'ArticleRevisionDataloader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, RevisionMap>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, RevisionMap>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, RevisionMap>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
