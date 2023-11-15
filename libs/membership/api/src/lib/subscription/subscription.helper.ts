import {Injectable} from '@nestjs/common'
import {PrismaService} from '@wepublish/nest-modules'
import {Invoice, Prisma, SubscriptionDeactivationReason} from '@prisma/client'

@Injectable()
export class SubscriptionHelper {
  constructor(private prismaService: PrismaService) {}

  /**
   * Function to fully cancel subscription by subscriptionId
   * @param subscriptionID id of subscription to cancel
   * @param reason pass the reseon of the subscripion cancelation
   */

  async cancelSubscriptionById(subscriptionID: string, reason: SubscriptionDeactivationReason) {
    const deactivatePromise = this.prismaService.subscriptionDeactivation.create({
      data: {
        subscriptionID: subscriptionID,
        date: new Date(),
        reason
      }
    })
    const promises = [
      deactivatePromise,
      ...(await this.cancelInvoicesForSubscription(subscriptionID))
    ]
    await this.prismaService.$transaction(promises)
  }

  /**
   * Function that cancels all invoices for a specific subscription
   * @param subscriptionID id of subscription to cancel
   */
  async cancelInvoicesForSubscription(
    subscriptionID: string
  ): Promise<Prisma.Prisma__InvoiceClient<Invoice>[]> {
    // Cancel invoices when subscription is canceled
    const invoices = await this.prismaService.invoice.findMany({
      where: {
        subscriptionID
      }
    })
    const promises: Prisma.Prisma__InvoiceClient<Invoice>[] = []
    for (const invoice of invoices) {
      if (invoice.paidAt !== null || invoice.canceledAt !== null) continue
      promises.push(
        this.prismaService.invoice.update({
          where: {
            id: invoice.id
          },
          data: {
            canceledAt: new Date()
          }
        })
      )
    }
    return promises
  }
}
