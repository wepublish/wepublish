import { Injectable, Scope } from '@nestjs/common';
import { Invoice, InvoiceItem, PrismaClient } from '@prisma/client';
import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';

export type GiftCodePurchase = InvoiceItem & { invoices: Invoice | null };

@Injectable({ scope: Scope.REQUEST })
export class GiftCodePurchaseDataloader extends DataLoaderService<GiftCodePurchase> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(invoiceItemIds: string[]) {
    return createOptionalsArray(
      invoiceItemIds,
      await this.prisma.invoiceItem.findMany({
        where: { id: { in: invoiceItemIds } },
        include: { invoices: true },
      }),
      'id'
    );
  }
}
