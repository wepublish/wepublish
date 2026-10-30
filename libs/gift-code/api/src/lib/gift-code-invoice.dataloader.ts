import { Injectable, Scope } from '@nestjs/common';
import { Invoice, PrismaClient } from '@prisma/client';
import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';

@Injectable({ scope: Scope.REQUEST })
export class GiftCodeInvoiceDataloader extends DataLoaderService<Invoice> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(invoiceIds: string[]) {
    return createOptionalsArray(
      invoiceIds,
      await this.prisma.invoice.findMany({
        where: { id: { in: invoiceIds } },
      }),
      'id'
    );
  }
}
