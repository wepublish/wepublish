import { DataLoaderService } from '@wepublish/utils/api';
import { Payment, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

/** The payments of each invoice, oldest first. */
@Injectable({
  scope: Scope.REQUEST,
})
export class InvoicePaymentsDataloader extends DataLoaderService<Payment[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(invoiceIds: string[]) {
    const payments = groupBy(
      payment => payment.invoiceID,
      await this.prisma.payment.findMany({
        where: {
          invoiceID: {
            in: invoiceIds,
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    );

    return invoiceIds.map(invoiceId => payments[invoiceId] ?? []);
  }
}
