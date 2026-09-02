import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, DiscountCode } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class DiscountCodeDataloader extends DataLoaderService<DiscountCode> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.discountCode.findMany({
        where: { id: { in: ids } },
      }),
      'id'
    );
  }
}
