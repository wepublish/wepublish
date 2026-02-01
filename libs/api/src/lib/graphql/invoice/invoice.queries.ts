import { Invoice, Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { InvoiceFilter, InvoiceSort } from '../../db/invoice';
import {
  SortOrder,
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
} from '@wepublish/utils/api';

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

export const getInvoices = async (
  filter: Partial<InvoiceFilter>,
  sortedField: InvoiceSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  invoice: PrismaClient['invoice']
): Promise<ConnectionResult<Invoice>> => {
  const orderBy = createInvoiceOrder(sortedField, order);
  const where = createInvoiceFilter(filter);

  const [totalCount, invoices] = await Promise.all([
    invoice.count({
      where,
      orderBy,
    }),
    invoice.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? { id: cursorId } : undefined,
      include: {
        items: true,
        subscription: true,
      },
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
};
