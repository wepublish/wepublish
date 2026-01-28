import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { Payment, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class PaymentDataloader extends DataLoaderService<Payment> {
  constructor(protected prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      (await this.prisma.payment.findMany({
        where: { id: { in: ids } },
      })) as Payment[],
      'id'
    );
  }
}
