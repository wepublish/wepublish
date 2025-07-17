import {Injectable} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder
} from '@wepublish/utils/api'
import {MemberPlanFilter, MemberPlanSort} from './member-plan.model'
import {MemberPlanDataloader} from './member-plan.dataloader'

@Injectable()
export class MemberPlanService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlanById(id: string) {
    return this.prisma.memberPlan.findFirst({
      where: {
        id,
        active: true
      },
      include: {
        availablePaymentMethods: true
      }
    })
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlanBySlug(slug: string) {
    return this.prisma.memberPlan.findFirst({
      where: {
        slug,
        active: true
      },
      include: {
        availablePaymentMethods: true
      }
    })
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlans(
    filter?: MemberPlanFilter,
    sortedField: MemberPlanSort = MemberPlanSort.createdAt,
    order: SortOrder = SortOrder.Descending,
    cursorId?: string,
    skip = 0,
    take = 10
  ) {
    const orderBy = createMemberPlanOrder(sortedField, order)
    const where = createMemberPlanFilter(filter)

    const [totalCount, memberplans] = await Promise.all([
      this.prisma.memberPlan.count({
        where,
        orderBy
      }),
      this.prisma.memberPlan.findMany({
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
}

export const createMemberPlanOrder = (
  field: MemberPlanSort,
  sortOrder: SortOrder
): Prisma.MemberPlanFindManyArgs['orderBy'] => {
  switch (field) {
    case MemberPlanSort.createdAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case MemberPlanSort.modifiedAt:
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
  filter?: Partial<MemberPlanFilter>
): Prisma.MemberPlanWhereInput => {
  if (filter) {
    return {
      AND: [createNameFilter(filter), createActiveFilter(filter), createTagsFilter(filter)]
    }
  }
  return {}
}
