import {Context} from '../../context'
import {PrismaClient} from '@prisma/client'

export const getPublicInvoices = async (
  authenticateUser: Context['authenticateUser'],
  subscription: PrismaClient['subscription'],
  invoice: PrismaClient['invoice']
) => {
  const {
    user: {id: userId}
  } = authenticateUser()

  const subscriptions = await subscription.findMany({
    where: {
      userID: userId
    }
  })

  const invoices = await invoice.findMany({
    where: {
      subscriptionID: {
        in: subscriptions.map(({id}) => id)
      }
    },
    include: {
      items: true
    }
  })

  return invoices
}
