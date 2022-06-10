import {Context} from '../../context'
import {authorise, CanDeletePaymentMethod} from '../permissions'
import {PrismaClient} from '@prisma/client'

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
