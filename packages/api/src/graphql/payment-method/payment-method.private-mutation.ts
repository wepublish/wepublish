import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanCreatePaymentMethod, CanDeletePaymentMethod} from '../permissions'

export const deletePaymentMethodById = (
  id: string,
  authenticate: Context['authenticate'],
  paymentMethod: PrismaClient['paymentMethod']
) => {
  const {roles} = authenticate()
  authorise(CanDeletePaymentMethod, roles)

  return paymentMethod.delete({
    where: {
      id
    }
  })
}

export const createPaymentMethod = (
  input: Omit<Prisma.PaymentMethodUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  paymentMethod: PrismaClient['paymentMethod']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePaymentMethod, roles)

  return paymentMethod.create({
    data: {...input, modifiedAt: new Date()}
  })
}
