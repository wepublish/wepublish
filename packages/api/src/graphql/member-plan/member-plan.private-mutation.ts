import {Context} from '../../context'
import {authorise, CanCreateMemberPlan, CanDeleteMemberPlan} from '../permissions'
import {Prisma, PrismaClient} from '@prisma/client'

export const deleteMemberPlanById = (
  id: string,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteMemberPlan, roles)

  return memberPlan.delete({
    where: {
      id
    }
  })
}

export const createMemberPlan = (
  input: Omit<Prisma.MemberPlanUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const {roles} = authenticate()
  authorise(CanCreateMemberPlan, roles)

  return memberPlan.create({
    data: {...input, modifiedAt: new Date()}
  })
}

export const updateMemberPlan = (
  id: string,
  input: Omit<Prisma.MemberPlanUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const {roles} = authenticate()
  authorise(CanCreateMemberPlan, roles)

  return memberPlan.update({
    where: {id},
    data: input
  })
}
