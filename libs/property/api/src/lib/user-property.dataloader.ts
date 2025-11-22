import { DataLoaderService } from '@wepublish/utils/api';
import { MetadataProperty, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class UserPropertyDataloader extends DataLoaderService<
  MetadataProperty[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(userIds: string[]) {
    const properties = groupBy(
      property => property.userId!,
      await this.prisma.metadataProperty.findMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      })
    );

    return userIds.map(userId => properties[userId] ?? []);
  }
}
