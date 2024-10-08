import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanCreateMemberPlan, CanDeleteMemberPlan} from '@wepublish/permissions/api'
import {PrismaClient, Prisma} from '@prisma/client'
import {InvalidMemberPlanSettings} from '../../error'

export const deleteMemberPlanById = async (
  id: string,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteMemberPlan, roles)

  return memberPlan.delete({
    where: {
      id
    },
    include: {
      availablePaymentMethods: true
    }
  })
}

type CreateMemberPlanInput = Omit<
  Prisma.MemberPlanUncheckedCreateInput,
  'availablePaymentMethods' | 'modifiedAt'
> & {
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[]
}

export const createMemberPlan = (
  {availablePaymentMethods, ...input}: CreateMemberPlanInput,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const {roles} = authenticate()
  authorise(CanCreateMemberPlan, roles)

  checkMemberPlanIntegrity(availablePaymentMethods, input.extendable)

  return memberPlan.create({
    data: {
      ...input,
      availablePaymentMethods: {
        createMany: {
          data: availablePaymentMethods
        }
      }
    },
    include: {
      availablePaymentMethods: true
    }
  })
}

type UpdateMemberPlanInput = Omit<
  Prisma.MemberPlanUncheckedUpdateInput,
  'availablePaymentMethods' | 'modifiedAt' | 'createdAt'
> & {
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[]
}

export const updateMemberPlan = async (
  id: string,
  {availablePaymentMethods, ...input}: UpdateMemberPlanInput,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const {roles} = authenticate()
  authorise(CanCreateMemberPlan, roles)

  checkMemberPlanIntegrity(availablePaymentMethods, input.extendable as boolean)

  return memberPlan.update({
    where: {id},
    data: {
      ...input,
      availablePaymentMethods: {
        deleteMany: {
          memberPlanId: {
            equals: id
          }
        },
        createMany: {
          data: availablePaymentMethods
        }
      }
    },
    include: {
      availablePaymentMethods: true
    }
  })
}

function checkMemberPlanIntegrity(
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[],
  extendable: boolean
): void {
  const hasForceAutoRenew = !!availablePaymentMethods.find(apm => apm.forceAutoRenewal)

  if (!extendable && hasForceAutoRenew) {
    throw new InvalidMemberPlanSettings()
  }
}
