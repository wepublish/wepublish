import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { InvoiceDataloader } from './invoice.dataloader';
import {
  CreateInvoiceInput,
  InvoiceFilter,
  InvoiceListArgs,
  InvoiceSort,
  UpdateInvoiceInput,
} from './invoice.model';
import {
  PAYMENT_METHOD_CONFIG,
  PaymentMethodConfig,
} from '@wepublish/payment/api';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaClient,
    @Inject(PAYMENT_METHOD_CONFIG)
    private paymentMethodConfig: PaymentMethodConfig
  ) {}

  @PrimeDataLoader(InvoiceDataloader)
  async getInvoices({
    filter,
    sort = InvoiceSort.CreatedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: InvoiceListArgs) {
    const where = createInvoiceFilter(filter ?? {});
    const orderBy = createInvoiceOrder(sort, order);

    const [totalCount, invoices] = await Promise.all([
      this.prisma.invoice.count({
        where,
        orderBy,
      }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = invoices.slice(0, getMaxTake(take));
    const firstInvoice = nodes[0];
    const lastInvoice = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = invoices.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstInvoice?.id,
        endCursor: lastInvoice?.id,
      },
    };
  }

  @PrimeDataLoader(InvoiceDataloader)
  async updateInvoice({ id, items, ...input }: UpdateInvoiceInput) {
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...input,
        items:
          items ?
            {
              deleteMany: {
                invoiceId: {
                  equals: id,
                },
              },
              createMany: {
                data: items,
              },
            }
          : undefined,
      },
      include: {
        items: true,
      },
    });
  }

  @PrimeDataLoader(InvoiceDataloader)
  async createInvoice({ items, ...input }: CreateInvoiceInput) {
    return this.prisma.invoice.create({
      data: {
        ...input,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
  }

  async deleteInvoice(id: string) {
    return this.prisma.invoice.delete({
      where: {
        id,
      },
    });
  }

  @PrimeDataLoader(InvoiceDataloader)
  async markInvoiceAsPaid(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id,
      },
      include: {
        subscriptionPeriods: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.subscriptionID) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.update({
      where: { id: invoice.subscriptionID },
      data: {
        confirmed: true,
      },
    });

    // Should not happen since an invoice is limited to one subscription
    if (invoice.subscriptionPeriods.length !== 1) {
      throw new InternalServerErrorException(
        'Not one period is linked to the invoice'
      );
    }

    if (!invoice.subscriptionID) {
      throw new InternalServerErrorException('Invoice has no subscriptionID');
    }

    await this.prisma.subscription.update({
      where: {
        id: invoice.subscriptionID,
      },
      data: {
        paidUntil: invoice.subscriptionPeriods[0].endsAt,
      },
    });

    return this.prisma.invoice.update({
      where: { id },
      data: {
        manuallySetAsPaidByUserId: userId,
        paidAt: new Date(),
      },
      include: {
        items: true,
      },
    });
  }

  @PrimeDataLoader(InvoiceDataloader)
  async getUserInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: {
        subscription: {
          userID: userId,
        },
      },
      include: {
        items: true,
      },
    });
  }

  @PrimeDataLoader(InvoiceDataloader)
  async checkInvoiceStatus(id: string, userId: string) {
    const { paymentProviders } = this.paymentMethodConfig;

    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id,
      },
      include: {
        subscription: true,
      },
    });

    if (
      !invoice ||
      !invoice.subscription ||
      invoice.subscription.userID !== userId
    ) {
      throw new NotFoundException(`Invoice with id ${id} was not found`);
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        invoiceID: invoice.id,
      },
    });

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    for (const payment of payments) {
      if (!payment.intentID) {
        continue;
      }

      const paymentMethod = paymentMethods.find(
        pm => pm.id === payment.paymentMethodID
      );

      if (!paymentMethod) {
        continue; // TODO: what happens if we don't find a paymentMethod
      }

      const paymentProvider = paymentProviders.find(
        pp => pp.id === paymentMethod.paymentProviderID
      );

      if (!paymentProvider) {
        continue; // TODO: what happens if we don't find a paymentProvider
      }

      const intentState = await paymentProvider.checkIntentStatus({
        intentID: payment.intentID,
        paymentID: payment.id,
      });

      await paymentProvider.updatePaymentWithIntentState({
        intentState,
      });
    }

    // FIXME: We need to implement a way to wait for all the database
    //  event hooks to finish before we return data. Will be solved in WPC-498
    await new Promise(resolve => setTimeout(resolve, 100));

    return this.prisma.invoice.findUnique({
      where: {
        id,
      },
      include: {
        items: true,
      },
    });
  }
}

export const createInvoiceOrder = (
  field: InvoiceSort,
  sortOrder: SortOrder
): Prisma.InvoiceFindManyArgs['orderBy'] => {
  switch (field) {
    case InvoiceSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case InvoiceSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case InvoiceSort.PaidAt:
      return {
        paidAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createUserFilter = (
  filter: Partial<InvoiceFilter>
): Prisma.InvoiceWhereInput => {
  if (filter?.userID) {
    return {
      subscription: {
        userID: filter.userID,
      },
    };
  }

  return {};
};

const createMailFilter = (
  filter: Partial<InvoiceFilter>
): Prisma.InvoiceWhereInput => {
  if (filter?.mail) {
    return {
      mail: {
        contains: filter.mail,
        mode: 'insensitive',
      },
    };
  }

  return {};
};

const createPaidAtFilter = (
  filter: Partial<InvoiceFilter>
): Prisma.InvoiceWhereInput => {
  if (filter?.paidAt) {
    const { comparison, date } = filter.paidAt;
    const mappedComparison = mapDateFilterToPrisma(comparison);

    return {
      paidAt: {
        [mappedComparison]: date,
      },
    };
  }

  return {};
};

const createCancelledAtFilter = (
  filter: Partial<InvoiceFilter>
): Prisma.InvoiceWhereInput => {
  if (filter?.canceledAt) {
    const { comparison, date } = filter.canceledAt;
    const mappedComparison = mapDateFilterToPrisma(comparison);

    return {
      canceledAt: {
        [mappedComparison]: date,
      },
    };
  }

  return {};
};

const createSubscriptionFilter = (
  filter: Partial<InvoiceFilter>
): Prisma.InvoiceWhereInput => {
  if (filter?.subscriptionID) {
    return {
      subscriptionID: filter.subscriptionID,
    };
  }

  return {};
};

export const createInvoiceFilter = (
  filter: Partial<InvoiceFilter>
): Prisma.InvoiceWhereInput => ({
  AND: [
    createUserFilter(filter),
    createMailFilter(filter),
    createPaidAtFilter(filter),
    createCancelledAtFilter(filter),
    createSubscriptionFilter(filter),
  ],
});
