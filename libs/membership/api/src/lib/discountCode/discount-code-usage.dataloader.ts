import { Injectable, Scope } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';

export type DiscountCodeUsage = {
  total: number;
  paid: number;
};

@Injectable({
  scope: Scope.REQUEST,
})
export class DiscountCodeUsageDataloader extends DataLoaderService<DiscountCodeUsage> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  private async countUsages(
    discountCodeIds: string[],
    where?: Prisma.InvoiceItemWhereInput
  ) {
    const counts = await this.prisma.invoiceItem.groupBy({
      by: ['discountCodeId'],
      where: {
        discountCodeId: {
          in: discountCodeIds,
        },
        ...where,
      },
      _count: true,
    });

    return new Map(
      counts.map(({ discountCodeId, _count }) => [discountCodeId, _count])
    );
  }

  protected async loadByKeys(discountCodeIds: string[]) {
    const [totalCounts, paidCounts] = await Promise.all([
      this.countUsages(discountCodeIds),
      this.countUsages(discountCodeIds, {
        invoices: {
          paidAt: {
            not: null,
          },
        },
      }),
    ]);

    return discountCodeIds.map(discountCodeId => ({
      total: totalCounts.get(discountCodeId) ?? 0,
      paid: paidCounts.get(discountCodeId) ?? 0,
    }));
  }
}
