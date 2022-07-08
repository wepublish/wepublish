import {Context} from '../../context'
import {authorise, CanDeleteMemberPlan} from '../permissions'
import {PrismaClient} from '@prisma/client'

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
