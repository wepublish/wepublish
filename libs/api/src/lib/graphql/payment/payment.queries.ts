import { Payment, Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { PaymentFilter, PaymentSort } from '../../db/payment';
import {
  SortOrder,
  getMaxTake,
  graphQLSortOrderToPrisma,
} from '@wepublish/utils/api';

export const createPaymentOrder = (
  field: PaymentSort,
  sortOrder: SortOrder
): Prisma.PaymentFindManyArgs['orderBy'] => {
  switch (field) {
    case PaymentSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case PaymentSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createItendFilter = (
  filter: Partial<PaymentFilter>
): Prisma.PaymentWhereInput => {
  if (filter?.intentID) {
    return {
      intentID: filter.intentID,
    };
  }

  return {};
};

export const createPaymentFilter = (
  filter: Partial<PaymentFilter>
): Prisma.PaymentWhereInput => ({
  AND: [createItendFilter(filter)],
});

export const getPayments = async (
  filter: Partial<PaymentFilter>,
  sortedField: PaymentSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  payment: PrismaClient['payment']
): Promise<ConnectionResult<Payment>> => {
  const orderBy = createPaymentOrder(sortedField, order);
  const where = createPaymentFilter(filter);

  const [totalCount, payments] = await Promise.all([
    payment.count({
      where,
      orderBy,
    }),
    payment.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? { id: cursorId } : undefined,
    }),
  ]);

  const nodes = payments.slice(0, take);
  const firstPayment = nodes[0];
  const lastPayment = nodes[nodes.length - 1];

  const hasPreviousPage = Boolean(skip);
  const hasNextPage = payments.length > nodes.length;

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstPayment?.id,
      endCursor: lastPayment?.id,
    },
  };
};
