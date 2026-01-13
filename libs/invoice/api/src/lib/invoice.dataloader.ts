import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Invoice } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class InvoiceDataloader extends DataLoaderService<Invoice> {
  constructor(protected prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.invoice.findMany({
        where: { id: { in: ids } },
      }),
      'id'
    );
  }
}
