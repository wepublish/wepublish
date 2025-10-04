import { DataLoaderService, Property } from '@wepublish/utils/api';
import { PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class SubscriptionPropertyDataloader extends DataLoaderService<
  Property[]
> {
  constructor(protected prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(subscriptionIds: string[]) {
    const properties = await this.prisma.metadataProperty.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
      },
    });

    return subscriptionIds.map(subscriptionId =>
      properties.filter(property => subscriptionId === property.subscriptionId)
    );
  }
}
