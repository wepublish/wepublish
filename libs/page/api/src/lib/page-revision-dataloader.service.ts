import { Injectable, Scope } from '@nestjs/common';
import { PageRevision, PrismaClient } from '@prisma/client';
import { Primeable } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

type RevisionMap = Partial<{
  draft: PageRevision;
  pending: PageRevision;
  published: PageRevision;
}>;

@Injectable({
  scope: Scope.REQUEST,
})
export class PageRevisionDataloaderService implements Primeable<RevisionMap> {
  private dataloader = new DataLoader<string, RevisionMap>(
    async (pageIds: readonly string[]) => {
      const pages = await this.prisma.page.findMany({
        where: {
          id: {
            in: pageIds as string[],
          },
        },
        include: {
          PagesRevisionPublished: {
            include: {
              pageRevision: true,
            },
          },
          PagesRevisionDraft: {
            include: {
              pageRevision: true,
            },
          },
          PagesRevisionPending: {
            include: {
              pageRevision: true,
            },
          },
        },
      });

      return pageIds.map((pageIds): RevisionMap => {
        const rev = pages.find(rev => rev.id === pageIds);
        const published = rev?.PagesRevisionPublished?.pageRevision;
        const draft = rev?.PagesRevisionDraft?.pageRevision;
        const pending = rev?.PagesRevisionPending?.pageRevision;

        return { draft, pending, published };
      });
    },
    { name: 'PageRevisionDataloader' }
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
