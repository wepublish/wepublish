import { Prisma, PrismaClient, Subscription } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { SubscriptionFilter, SubscriptionSort } from '../../db/subscription';
import {
  SortOrder,
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
} from '@wepublish/utils/api';

export const createSubscriptionOrder = (
  field: SubscriptionSort,
  sortOrder: SortOrder
): Prisma.SubscriptionFindManyArgs['orderBy'] => {
  switch (field) {
    case SubscriptionSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case SubscriptionSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createStartsAtFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.startsAtFrom) {
    const { comparison, date } = filter.startsAtFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      startsAt: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createStartsAtToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.startsAtTo) {
    const { comparison, date } = filter.startsAtTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      startsAt: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createPaidUntilFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paidUntilFrom) {
    const { comparison, date } = filter.paidUntilFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      paidUntil: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createPaidUntilToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paidUntilTo) {
    const { comparison, date } = filter.paidUntilTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      paidUntil: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createDeactivationDateFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationDateFrom) {
    const { comparison, date } = filter.deactivationDateFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      deactivation: {
        is: {
          date: {
            [compare]: date,
          },
        },
      },
    };
  }

  return {};
};

const createDeactivationDateToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationDateTo) {
    const { comparison, date } = filter.deactivationDateTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      deactivation: {
        is: {
          date: {
            [compare]: date,
          },
        },
      },
    };
  }

  return {};
};

const createCancellationDateFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.cancellationDateFrom) {
    const { comparison, date } = filter.cancellationDateFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      deactivation: {
        is: {
          createdAt: {
            [compare]: date,
          },
        },
      },
    };
  }

  return {};
};

const createCancellationDateToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.cancellationDateTo) {
    const { comparison, date } = filter.cancellationDateTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      deactivation: {
        is: {
          createdAt: {
            [compare]: date,
          },
        },
      },
    };
  }

  return {};
};

const createDeactivationReasonFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationReason) {
    return {
      deactivation: {
        reason: filter.deactivationReason as any,
      },
    };
  }

  return {};
};

const createAutoRenewFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.autoRenew != null) {
    return {
      autoRenew: filter.autoRenew,
    };
  }

  return {};
};

const createExtendableFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.extendable != null) {
    return {
      extendable: filter.extendable,
    };
  }

  return {};
};

const createPaymentPeriodicityFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paymentPeriodicity) {
    return {
      paymentPeriodicity: filter.paymentPeriodicity,
    };
  }

  return {};
};

const createPaymentMethodFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paymentMethodID) {
    return {
      paymentMethodID: filter.paymentMethodID,
    };
  }

  return {};
};

const createMemberPlanFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.memberPlanID) {
    return {
      memberPlanID: filter.memberPlanID,
    };
  }

  return {};
};

const createHasAddressFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.userHasAddress) {
    return {
      user: {
        isNot: {
          address: null,
        },
      },
    };
  }

  return {};
};

const createUserIDsFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.userIDs) {
    if (filter.userIDs.length > 0) {
      return {
        userID: {
          in: filter.userIDs,
        },
      };
    } else {
      return {
        userID: {
          in: ['___none___'],
        },
      };
    }
  }
  return {};
};

const createSubscriptionIDsFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.subscriptionIDs) {
    if (filter.subscriptionIDs.length > 0) {
      return {
        id: {
          in: filter.subscriptionIDs,
        },
      };
    } else {
      return {
        id: {
          in: ['___none___'],
        },
      };
    }
  }
  return {};
};

const createUserFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.userID) {
    return {
      user: {
        id: filter.userID,
      },
    };
  }
  return {};
};

export const createSubscriptionFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => ({
  AND: [
    createStartsAtFromFilter(filter),
    createStartsAtToFilter(filter),
    createPaidUntilFromFilter(filter),
    createPaidUntilToFilter(filter),
    createDeactivationDateFromFilter(filter),
    createDeactivationDateToFilter(filter),
    createCancellationDateToFilter(filter),
    createCancellationDateFromFilter(filter),
    createDeactivationReasonFilter(filter),
    createAutoRenewFilter(filter),
    createPaymentPeriodicityFilter(filter),
    createPaymentMethodFilter(filter),
    createMemberPlanFilter(filter),
    createHasAddressFilter(filter),
    createUserFilter(filter),
    createExtendableFilter(filter),
    createUserIDsFilter(filter),
    createSubscriptionIDsFilter(filter),
  ],
});

export const getSubscriptions = async (
  filter: Partial<SubscriptionFilter>,
  sortedField: SubscriptionSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  subscription: PrismaClient['subscription']
): Promise<ConnectionResult<Subscription>> => {
  const orderBy = createSubscriptionOrder(sortedField, order);
  const where = createSubscriptionFilter(filter);
  const [totalCount, subscriptions] = await Promise.all([
    subscription.count({
      where,
      orderBy,
    }),
    subscription.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? { id: cursorId } : undefined,
      include: {
        deactivation: true,
        periods: true,
        properties: true,
      },
    }),
  ]);

  const nodes = subscriptions.slice(0, getMaxTake(take));
  const firstSubscription = nodes[0];
  const lastSubscription = nodes[nodes.length - 1];

  const hasPreviousPage = Boolean(skip);
  const hasNextPage = subscriptions.length > nodes.length;

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstSubscription?.id,
      endCursor: lastSubscription?.id,
    },
  };
};
