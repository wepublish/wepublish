import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { PaymentMethod, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class PaymentMethodDataloader extends DataLoaderService<PaymentMethod> {
  constructor(protected prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.paymentMethod.findMany({
        where: { id: { in: ids } },
      }),
      'id'
    );
  }
}
