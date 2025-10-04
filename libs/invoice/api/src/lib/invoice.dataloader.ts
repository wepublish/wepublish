import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { Invoice, InvoiceItem, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[];
};

@Injectable({
  scope: Scope.REQUEST,
})
export class InvoiceDataloader extends DataLoaderService<InvoiceWithItems> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.invoice.findMany({
        where: { id: { in: ids } },
        include: {
          items: true,
        },
      }),
      'id'
    );
  }
}
