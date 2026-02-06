import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Tag } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class PageTagDataloader extends DataLoaderService<Tag[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(pageIds: string[]) {
    const tags = groupBy(
      tag => tag.pageId!,
      await this.prisma.taggedPages.findMany({
        where: {
          pageId: {
            in: pageIds,
          },
        },
        include: {
          tag: true,
        },
      })
    );

    return pageIds.map(pageId => tags[pageId]?.map(tag => tag.tag) ?? []);
  }
}
