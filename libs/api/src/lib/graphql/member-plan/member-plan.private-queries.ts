import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {MemberPlanFilter, MemberPlanSort} from '../../db/memberPlan'
import {UserInputError} from '../../error'
import {authorise} from '../permissions'
import {CanGetMemberPlan, CanGetMemberPlans} from '@wepublish/permissions/api'
import {getMemberPlans} from './member-plan.queries'

export const getMemberPlanByIdOrSlug = (
  id: string | null,
  slug: string | null,
  authenticate: Context['authenticate'],
  memberPlansByID: Context['loaders']['memberPlansByID'],
  memberPlansBySlug: Context['loaders']['memberPlansBySlug']
) => {
  const {roles} = authenticate()
  authorise(CanGetMemberPlan, roles)

  if ((!id && !slug) || (id && slug)) {
    throw new UserInputError('You must provide either `id` or `slug`.')
  }

  return id ? memberPlansByID.load(id) : memberPlansBySlug.load(slug!)
}

export const getAdminMemberPlans = async (
  filter: Partial<MemberPlanFilter>,
  sortedField: MemberPlanSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const {roles} = authenticate()
  authorise(CanGetMemberPlans, roles)

  return getMemberPlans(filter, sortedField, order, cursorId, skip, take, memberPlan)
}
