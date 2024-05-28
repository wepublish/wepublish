import {Injectable} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {
  CreateMemberPlanInput,
  GetMemberPlansArgs,
  MemberPlansFilter,
  MemberPlanSort,
  UpdateMemberPlanInput
} from './member-plan.model'
import {graphQLSortOrderToPrisma, PrimeDataLoader, SortOrder} from '@wepublish/utils/api'
import {MemberPlanDataloader} from './member-plan.dataloader'

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

const createNameFilter = (filter: Partial<MemberPlansFilter>): Prisma.MemberPlanWhereInput => {
  if (filter?.name) {
    return {
      name: filter.name
    }
  }

  return {}
}

const createActiveFilter = (filter: Partial<MemberPlansFilter>): Prisma.MemberPlanWhereInput => {
  if (filter?.active != null) {
    return {
      active: filter.active
    }
  }

  return {}
}

const createTagsFilter = (filter: Partial<MemberPlansFilter>): Prisma.MemberPlanWhereInput => {
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
  filter: Partial<MemberPlansFilter>
): Prisma.MemberPlanWhereInput => ({
  AND: [createNameFilter(filter), createActiveFilter(filter), createTagsFilter(filter)]
})

@Injectable()
export class MemberPlanService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlanBySlug(slug: string) {
    return this.prisma.memberPlan.findUnique({where: {slug}})
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlans({filter, order, sort, skip, take, cursorId}: GetMemberPlansArgs) {
    return this.prisma.memberPlan.findMany({
      where: filter ? createMemberPlanFilter(filter) : {},
      orderBy: sort ? createMemberPlanOrder(sort, order as SortOrder) : {},
      skip,
      take,
      cursor: cursorId ? {id: cursorId} : undefined,
      include: {availablePaymentMethods: true}
    })
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async getActiveMemberPlans(args: GetMemberPlansArgs) {
    const filter = {...args.filter, active: true}
    return this.getMemberPlans({...args, filter})
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async createMemberPlan(data: CreateMemberPlanInput) {
    return this.prisma.memberPlan.create({
      data,
      include: {availablePaymentMethods: true}
    })
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async updateMemberPlan({id, ...data}: UpdateMemberPlanInput) {
    return this.prisma.memberPlan.update({
      where: {id},
      data,
      include: {availablePaymentMethods: true}
    })
  }

  async deleteMemberPlanById(id: string) {
    return this.prisma.memberPlan.delete({
      where: {id},
      include: {availablePaymentMethods: true}
    })
  }
}
