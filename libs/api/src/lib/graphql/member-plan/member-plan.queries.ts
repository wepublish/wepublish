import {MemberPlan, Prisma, PrismaClient} from '@prisma/client'
import {ConnectionResult} from '../../db/common'
import {MemberPlanFilter, MemberPlanSort} from '../../db/memberPlan'
import {SortOrder, getMaxTake, graphQLSortOrderToPrisma} from '@wepublish/utils/api'

export const createMemberPlanOrder = (
  field: MemberPlanSort,
  sortOrder: SortOrder
): Prisma.MemberPlanFindManyArgs['orderBy'] => {
  switch (field) {
    case MemberPlanSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case MemberPlanSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder)
      }
  }
}

const createNameFilter = (filter: Partial<MemberPlanFilter>): Prisma.MemberPlanWhereInput => {
  if (filter?.name) {
    return {
      name: filter.name
    }
  }

  return {}
}

const createActiveFilter = (filter: Partial<MemberPlanFilter>): Prisma.MemberPlanWhereInput => {
  if (filter?.active != null) {
    return {
      active: filter.active
    }
  }

  return {}
}

const createTagsFilter = (filter: Partial<MemberPlanFilter>): Prisma.MemberPlanWhereInput => {
  if (filter?.tags?.length) {
    return {
      tags: {
        hasSome: filter.tags
      }
    }
  }

  return {}
}

export const createMemberPlanFilter = (
  filter: Partial<MemberPlanFilter>
): Prisma.MemberPlanWhereInput => ({
  AND: [createNameFilter(filter), createActiveFilter(filter), createTagsFilter(filter)]
})

export const getMemberPlans = async (
  filter: Partial<MemberPlanFilter>,
  sortedField: MemberPlanSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  memberPlan: PrismaClient['memberPlan']
): Promise<ConnectionResult<MemberPlan>> => {
  const orderBy = createMemberPlanOrder(sortedField, order)
  const where = createMemberPlanFilter(filter)

  const [totalCount, memberplans] = await Promise.all([
    memberPlan.count({
      where,
      orderBy
    }),
    memberPlan.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? {id: cursorId} : undefined,
      include: {
        availablePaymentMethods: true
      }
    })
  ])

  const nodes = memberplans.slice(0, take)
  const firstMemberPlan = nodes[0]
  const lastMemberPlan = nodes[nodes.length - 1]

  const hasPreviousPage = Boolean(skip)
  const hasNextPage = memberplans.length > nodes.length

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstMemberPlan?.id,
      endCursor: lastMemberPlan?.id
    }
  }
}
