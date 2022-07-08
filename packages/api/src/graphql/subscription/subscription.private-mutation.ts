import {Context} from '../../context'
import {authorise, CanDeleteSubscription} from '../permissions'
import {PrismaClient} from '@prisma/client'

export const deleteSubscriptionById = (
  id: string,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteSubscription, roles)

  return subscription.delete({
    where: {
      id
    }
  })
}
