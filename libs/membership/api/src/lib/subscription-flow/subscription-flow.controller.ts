import {PrismaService} from '@wepublish/api'
import {SubscriptionFlowModelCreateInput} from './subscription-flow.model'

export class SubscriptionFlowController {
  constructor(private readonly prismaService: PrismaService) {}
  async getFlow(defaultFlowOnly: boolean) {
    let where = {}
    if (defaultFlowOnly) {
      where = {
        default: true
      }
    }

    return await this.prismaService['subscriptionFlow'].findMany({
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
    this.prismaService.subscriptionFlow.create({
      data: {
        default: false,
        memberPlanId: flow.memberPlan.id,
        periodicities: flow.periodicities,
        autoRenewal: flow.autoRenewal,
        subscribeMailTemplateId: flow.subscribeMailTemplate.id,
        invoiceCreationMailTemplate: {
          create: {
            daysAwayFromEnding: flow.invoiceCreationMailTemplate.daysAwayFromEnding,
            mailTemplateId: flow.invoiceCreationMailTemplate.mailTemplateId
          }
        },
        renewalSuccessMailTemplateId: flow.renewalSuccessMailTemplate.id,
        renewalFailedMailTemplateId: flow.renewalFailedMailTemplate.id,
        deactivationUnpaidMailTemplate: {
          create: {
            daysAwayFromEnding: flow.deactivationUnpaidMailTemplate.daysAwayFromEnding,
            mailTemplateId: flow.deactivationUnpaidMailTemplate.mailTemplateId
          }
        },
        deactivationByUserMailTemplateId: flow.deactivationByUserMailTemplate.id,
        reactivationMailTemplateId: flow.reactivationMailTemplate.id,
        additionalIntervals: {
          createMany: {data: flow.additionalIntervals}
        }
      }
    })
     **/
    return flow
  }
}
