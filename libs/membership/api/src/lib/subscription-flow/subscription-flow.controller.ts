import {Injectable} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {SubscriptionFlowModelCreateInput} from './subscription-flow.model'

@Injectable()
export class SubscriptionFlowController {
  constructor(private readonly prismaService: PrismaService) {}
  async getFlow(defaultFlowOnly: boolean) {
    let where = {}
    if (defaultFlowOnly) {
      where = {
        default: true
      }
    }

    return await this.prismaService.subscriptionFlow.findMany({
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
  async createFlow(flow: SubscriptionFlowModelCreateInput) {
    /**
    await this.prismaService.subscriptionFlow.create({
      data: {
        default: false,
        memberPlan: {
          connect: flow.memberPlan
        },
        paymentMethods: {
          connect: flow.memberPlan
        },
        periodicities: flow.periodicities,
        autoRenewal: flow.autoRenewal,
        subscribeMailTemplate: {
          connect: flow.subscribeMailTemplate
        },
        invoiceCreationMailTemplate: {
          create: flow.invoiceCreationMailTemplate
        },
        renewalSuccessMailTemplate: {
          connect:  flow.renewalSuccessMailTemplate
        },
        renewalFailedMailTemplate: {
          connect: flow.renewalFailedMailTemplate
        },
        deactivationUnpaidMailTemplate: {
          create: flow.deactivationUnpaidMailTemplate
        },
        deactivationByUserMailTemplate: {
          connect: flow.deactivationByUserMailTemplate
        },
        reactivationMailTemplate: {
          connect: flow.reactivationMailTemplate
        },
        additionalIntervals: {
          create: flow.additionalIntervals
        }
      }
    }) **/
    return this.getFlow(false)
  }
}
