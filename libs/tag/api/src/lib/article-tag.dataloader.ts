import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Tag } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticleTagDataloader extends DataLoaderService<Tag[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(articleIds: string[]) {
    const tags = groupBy(
      tag => tag.articleId!,
      await this.prisma.taggedArticles.findMany({
        where: {
          articleId: {
            in: articleIds,
          },
        },
        include: {
          tag: true,
        },
      })
    );

    return articleIds.map(
      articleId => tags[articleId]?.map(tag => tag.tag) ?? []
    );
  }
}
