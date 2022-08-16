import {MemberPlanFilter, MemberPlanSort} from '../../db/memberPlan'
import {getMemberPlans} from './member-plan.queries'
import {PrismaClient} from '@prisma/client'

export const getActiveMemberPlans = async (
  filter: Partial<MemberPlanFilter>,
  sortedField: MemberPlanSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  memberPlan: PrismaClient['memberPlan']
) => getMemberPlans({...filter, active: true}, sortedField, order, cursorId, skip, take, memberPlan)
