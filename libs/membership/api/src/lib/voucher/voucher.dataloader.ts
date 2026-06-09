import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Voucher } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class VoucherDataloader extends DataLoaderService<Voucher> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.voucher.findMany({
        where: { id: { in: ids } },
      }),
      'id'
    );
  }
}
