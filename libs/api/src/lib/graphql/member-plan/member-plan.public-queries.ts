import {MemberPlanFilter, MemberPlanSort} from '../../db/memberPlan'
import {getMemberPlans} from './member-plan.queries'
import {PrismaClient} from '@prisma/client'
import {SortOrder} from '@wepublish/utils/api'

export const getActiveMemberPlans = async (
  filter: Partial<MemberPlanFilter>,
  sortedField: MemberPlanSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  memberPlan: PrismaClient['memberPlan']
) => getMemberPlans({...filter, active: true}, sortedField, order, cursorId, skip, take, memberPlan)
