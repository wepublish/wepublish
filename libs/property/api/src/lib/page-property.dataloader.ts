import { DataLoaderService } from '@wepublish/utils/api';
import { MetadataProperty, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class PagePropertyDataloader extends DataLoaderService<
  MetadataProperty[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(pageRevisionIds: string[]) {
    const properties = groupBy(
      property => property.pageRevisionId!,
      await this.prisma.metadataProperty.findMany({
        where: {
          pageRevisionId: {
            in: pageRevisionIds,
          },
        },
      })
    );

    return pageRevisionIds.map(revisionId => properties[revisionId] ?? []);
  }
}
