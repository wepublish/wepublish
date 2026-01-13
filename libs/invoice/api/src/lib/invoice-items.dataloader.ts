import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, InvoiceItem } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class InvoiceItemDataloader extends DataLoaderService<InvoiceItem[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(invoiceIds: string[]) {
    const items = groupBy(
      item => item.invoiceId!,
      await this.prisma.invoiceItem.findMany({
        where: {
          invoiceId: {
            in: invoiceIds,
          },
        },
      })
    );

    return invoiceIds.map(invoiceId => items[invoiceId] ?? []);
  }
}
