import {Injectable} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput
} from './subscription-flow.model'
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
      throw new Error('You cant create this flow because there is a filter overlap!')
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

  async updateFlow(flow: SubscriptionFlowModelUpdateInput) {
    const originalFlow = await this.prismaService.subscriptionFlow.findUnique({
      where: {
        id: flow.id
      },
      include: {
        paymentMethods: true,
        additionalIntervals: true
      }
    })
    if (!originalFlow) throw Error('The given filter is not found!')

    if (
      await this.filterHasOverlap(
        originalFlow.memberPlanId || '',
        flow.paymentMethods,
        flow.periodicities,
        flow.autoRenewal
      )
    ) {
      throw new Error('You cant update this flow because there is a filter overlap!')
    }

    await this.prismaService.subscriptionFlow.update({
      where: {id: flow.id},
      data: {
        paymentMethods: {
          connect: flow.paymentMethods,
          disconnect: originalFlow.paymentMethods
        },
        periodicities: flow.periodicities,
        autoRenewal: flow.autoRenewal,
        subscribeMailTemplate: {
          connect: flow.subscribeMailTemplate
        },
        invoiceCreationMailTemplate: {
          update: flow.invoiceCreationMailTemplate
        },
        renewalSuccessMailTemplate: {
          connect: flow.renewalSuccessMailTemplate
        },
        renewalFailedMailTemplate: {
          connect: flow.renewalFailedMailTemplate
        },
        deactivationUnpaidMailTemplate: {
          update: flow.deactivationUnpaidMailTemplate
        },
        deactivationByUserMailTemplate: {
          connect: flow.deactivationByUserMailTemplate
        },
        reactivationMailTemplate: {
          connect: flow.reactivationMailTemplate
        },
        additionalIntervals: {
          delete: originalFlow.additionalIntervals.map(additionalInterval => ({
            id: additionalInterval.id
          })),
          create: flow.additionalIntervals
        }
      }
    })
    return this.getFlow(false)
  }

  async deleteFlow(subscriptionFlowId: number) {
    const originalFlow = await this.prismaService.subscriptionFlow.findUnique({
      where: {
        id: subscriptionFlowId
      },
      include: {
        paymentMethods: true,
        additionalIntervals: true
      }
    })
    if (!originalFlow) throw Error('The given filter is not found!')

    if (originalFlow.default) throw Error('Its not allowed to delete default flow!')

    let subscriptionIntervalToDelete = [
      originalFlow.deactivationUnpaidMailTemplateId,
      originalFlow.invoiceCreationMailTemplateId
    ]
    subscriptionIntervalToDelete = subscriptionIntervalToDelete.concat(
      originalFlow.additionalIntervals.map(additionalInterval => additionalInterval.id)
    )
    subscriptionIntervalToDelete = subscriptionIntervalToDelete.filter(elements => {
      return elements !== null
    })

    await this.prismaService.$transaction([
      this.prismaService.subscriptionFlow.delete({
        where: {
          id: subscriptionFlowId
        }
      }),
      this.prismaService.subscriptionInterval.deleteMany({
        where: {
          id: {
            in: subscriptionIntervalToDelete as number[]
          }
        }
      })
    ])

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
