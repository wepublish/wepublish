import {Payment, Prisma, PrismaClient} from '@prisma/client'
import {ConnectionResult, MaxResultsPerPage} from '../../db/common'
import {PaymentFilter, PaymentSort} from '../../db/payment'
import {getSortOrder, SortOrder} from '../queries/sort'

export const createPaymentOrder = (
  field: PaymentSort,
  sortOrder: SortOrder
): Prisma.PaymentFindManyArgs['orderBy'] => {
  switch (field) {
    case PaymentSort.CreatedAt:
      return {
        createdAt: sortOrder
      }

    case PaymentSort.ModifiedAt:
      return {
        modifiedAt: sortOrder
      }
  }
}

const createItendFilter = (filter: Partial<PaymentFilter>): Prisma.PaymentWhereInput => {
  if (filter?.intentID) {
    return {
      intentID: filter.intentID
    }
  }

  return {}
}

export const createPaymentFilter = (filter: Partial<PaymentFilter>): Prisma.PaymentWhereInput => ({
  AND: [createItendFilter(filter)]
})

export const getPayments = async (
  filter: Partial<PaymentFilter>,
  sortedField: PaymentSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  payment: PrismaClient['payment']
): Promise<ConnectionResult<Payment>> => {
  const orderBy = createPaymentOrder(sortedField, getSortOrder(order))
  const where = createPaymentFilter(filter)

  const [totalCount, payments] = await Promise.all([
    payment.count({
      where,
      orderBy
    }),
    payment.findMany({
      where,
      skip,
      take: Math.min(take, MaxResultsPerPage) + 1,
      orderBy,
      cursor: cursorId ? {id: cursorId} : undefined
    })
  ])

  const nodes = payments.slice(0, take)
  const firstPayment = nodes[0]
  const lastPayment = nodes[nodes.length - 1]

  const hasPreviousPage = Boolean(skip)
  const hasNextPage = payments.length > nodes.length

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstPayment?.id,
      endCursor: lastPayment?.id
    }
  }
}
