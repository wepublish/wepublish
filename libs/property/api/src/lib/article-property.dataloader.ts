import { DataLoaderService } from '@wepublish/utils/api';
import { MetadataProperty, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticlePropertyDataloader extends DataLoaderService<
  MetadataProperty[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(articleRevisionIds: string[]) {
    const properties = groupBy(
      property => property.articleRevisionId!,
      await this.prisma.metadataProperty.findMany({
        where: {
          articleRevisionId: {
            in: articleRevisionIds,
          },
        },
      })
    );

    return articleRevisionIds.map(revisionId => properties[revisionId] ?? []);
  }
}
