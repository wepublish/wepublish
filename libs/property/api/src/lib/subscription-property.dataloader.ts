import { DataLoaderService } from '@wepublish/utils/api';
import { MetadataProperty, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class SubscriptionPropertyDataloader extends DataLoaderService<
  MetadataProperty[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(subscriptionIds: string[]) {
    const properties = groupBy(
      property => property.subscriptionId!,
      await this.prisma.metadataProperty.findMany({
        where: {
          subscriptionId: {
            in: subscriptionIds,
          },
        },
      })
    );

    return subscriptionIds.map(
      subscriptionId => properties[subscriptionId] ?? []
    );
  }
}
