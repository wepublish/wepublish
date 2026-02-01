import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

export interface PaymentProvider {
  id: string;
  name: string;
}

@Injectable({ scope: Scope.REQUEST })
export class PaymentProviderDataloader extends DataLoaderService<PaymentProvider> {
  constructor(protected prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.settingPaymentProvider.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
        },
      }),
      'id'
    );
  }
}
