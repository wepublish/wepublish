import {Injectable} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {SubscriptionFlowModelCreateInput} from './subscription-flow.model'
import {PaymentMethodRefInput} from '@wepublish/editor/api-v2'
import {PaymentPeriodicity} from '@prisma/client'

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
    if (
      await this.filterHasOverlap(
        flow.memberPlan.id,
        flow.paymentMethods,
        flow.periodicities,
        flow.autoRenewal
      )
    ) {
      throw new Error('There is a filter overlap!')
    }

    await this.prismaService.subscriptionFlow.create({
      data: {
        default: false,
        memberPlan: {
          connect: flow.memberPlan
        },
        paymentMethods: {
          connect: flow.paymentMethods
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
          connect: flow.renewalSuccessMailTemplate
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
    })
    return this.getFlow(false)
  }
  async filterHasOverlap(
    memberPlanId: string,
    paymentMethods: PaymentMethodRefInput[],
    periodicities: PaymentPeriodicity[],
    autoRenewal: boolean[],
    excludeFlowId: number | null = null
  ) {
    let idFilter = {}
    if (excludeFlowId) {
      idFilter = {
        id: {
          not: excludeFlowId
        }
      }
    }

    const overlaps = await this.prismaService.subscriptionFlow.findMany({
      where: {
        AND: [
          idFilter,
          {
            default: false
          },
          {
            memberPlanId
          },
          {
            paymentMethods: {
              some: {
                id: {
                  in: paymentMethods.map(paymentMethode => paymentMethode.id)
                }
              }
            }
          },
          {
            periodicities: {
              hasSome: periodicities
            }
          },
          {
            autoRenewal: {
              hasSome: autoRenewal
            }
          }
        ]
      },
      include: {
        paymentMethods: true
      }
    })
    if (overlaps.length > 0) return true
    return false
  }
}
