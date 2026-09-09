import { Injectable, Scope } from '@nestjs/common';
import { Goodie, PrismaClient } from '@prisma/client';
import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';

@Injectable({ scope: Scope.REQUEST })
export class GoodieDataloader extends DataLoaderService<Goodie> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.goodie.findMany({
        where: { id: { in: ids } },
      }),
      'id'
    );
  }
}
