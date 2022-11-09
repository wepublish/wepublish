import {Prisma, PrismaClient, Subscription} from '@prisma/client'
import {ConnectionResult, MaxResultsPerPage} from '../../db/common'
import {SubscriptionFilter, SubscriptionSort} from '../../db/subscription'
import {getSortOrder, SortOrder} from '../queries/sort'
import {mapDateFilterToPrisma} from '../utils'

export const createSubscriptionOrder = (
  field: SubscriptionSort,
  sortOrder: SortOrder
): Prisma.SubscriptionFindManyArgs['orderBy'] => {
  switch (field) {
    case SubscriptionSort.CreatedAt:
      return {
        createdAt: sortOrder
      }

    case SubscriptionSort.ModifiedAt:
      return {
        modifiedAt: sortOrder
      }
  }
}

const createStartsAtFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.startsAtFrom) {
    const {comparison, date} = filter.startsAtFrom
    const compare = mapDateFilterToPrisma(comparison)

    return {
      startsAt: {
        [compare]: date
      }
    }
  }

  return {}
}

const createStartsAtToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.startsAtTo) {
    const {comparison, date} = filter.startsAtTo
    const compare = mapDateFilterToPrisma(comparison)

    return {
      startsAt: {
        [compare]: date
      }
    }
  }

  return {}
}

const createPaidUntilFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paidUntilFrom) {
    const {comparison, date} = filter.paidUntilFrom
    const compare = mapDateFilterToPrisma(comparison)

    return {
      paidUntil: {
        [compare]: date
      }
    }
  }

  return {}
}

const createPaidUntilToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paidUntilTo) {
    const {comparison, date} = filter.paidUntilTo
    const compare = mapDateFilterToPrisma(comparison)

    return {
      paidUntil: {
        [compare]: date
      }
    }
  }

  return {}
}

const createDeactivationDateFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationDateFrom) {
    const {comparison, date} = filter.deactivationDateFrom
    const compare = mapDateFilterToPrisma(comparison)

    return {
      deactivation: {
        is: {
          date: {
            [compare]: date
          }
        }
      }
    }
  }

  return {}
}

const createDeactivationDateToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationDateTo) {
    const {comparison, date} = filter.deactivationDateTo
    const compare = mapDateFilterToPrisma(comparison)

    return {
      deactivation: {
        is: {
          date: {
            [compare]: date
          }
        }
      }
    }
  }

  return {}
}

const createDeactivationReasonFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationReason) {
    return {
      deactivation: {
        reason: filter.deactivationReason as any
      }
    }
  }

  return {}
}

const createAutoRenewFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.autoRenew != null) {
    return {
      autoRenew: filter.autoRenew
    }
  }

  return {}
}

const createPaymentPeriodicityFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paymentPeriodicity) {
    return {
      paymentPeriodicity: filter.paymentPeriodicity
    }
  }

  return {}
}

const createPaymentMethodFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paymentMethodID) {
    return {
      paymentMethodID: filter.paymentMethodID
    }
  }

  return {}
}

const createMemberPlanFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.memberPlanID) {
    return {
      memberPlanID: filter.memberPlanID
    }
  }

  return {}
}

const createHasAddressFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.userHasAddress) {
    return {
      user: {
        isNot: {
          address: null
        }
      }
    }
  }

  return {}
}

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
    createDeactivationReasonFilter(filter),
    createAutoRenewFilter(filter),
    createPaymentPeriodicityFilter(filter),
    createPaymentMethodFilter(filter),
    createMemberPlanFilter(filter),
    createHasAddressFilter(filter)
  ]
})

export const getSubscriptions = async (
  filter: Partial<SubscriptionFilter>,
  sortedField: SubscriptionSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  subscription: PrismaClient['subscription']
): Promise<ConnectionResult<Subscription>> => {
  const orderBy = createSubscriptionOrder(sortedField, getSortOrder(order))
  const where = createSubscriptionFilter(filter)

  const [totalCount, subscriptions] = await Promise.all([
    subscription.count({
      where,
      orderBy
    }),
    subscription.findMany({
      where,
      skip,
      take: Math.min(take, MaxResultsPerPage) + 1,
      orderBy,
      cursor: cursorId ? {id: cursorId} : undefined,
      include: {
        deactivation: true,
        periods: true,
        properties: true
      }
    })
  ])

  const nodes = subscriptions.slice(0, take)
  const firstSubscription = nodes[0]
  const lastSubscription = nodes[nodes.length - 1]

  const hasPreviousPage = Boolean(skip)
  const hasNextPage = subscriptions.length > nodes.length

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstSubscription?.id,
      endCursor: lastSubscription?.id
    }
  }
}
