import {PrismaService} from '@wepublish/api'

export class SubscriptionFlowController {
  constructor(private readonly prismaService: PrismaService) {}
  async getFlow(defaultFlowOnly: boolean) {
    let where = {}
    if (defaultFlowOnly) {
      where = {
        default: true
      }
    }

    return this.prismaService['subscriptionFlow'].findMany({
      where,
      include: {
        memberPlan: true,
        subscribeMailTemplate: true,
        paymentMethods: true,
        invoiceCreationMailTemplate: {
          include: {
            mailTemplate: true
          }
        },
        renewalSuccessMailTemplate: true,
        renewalFailedMailTemplate: true,
        deactivationUnpaidMailTemplate: {
          include: {
            mailTemplate: true
          }
        },
        deactivationByUserMailTemplate: true,
        reactivationMailTemplate: true,
        additionalIntervals: {
          include: {
            mailTemplate: true
          }
        }
      }
    })
  }
}
