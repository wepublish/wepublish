import {Injectable} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalCreateInput,
  SubscriptionIntervalUpdateInput
} from './subscription-flow.model'

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
      orderBy: {
        default: 'desc'
      },
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
    if (await this.filterHasOverlap(flow.memberPlan.id, flow)) {
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
        invoiceCreationMailTemplate:
          flow.invoiceCreationMailTemplate == null
            ? {}
            : {create: this.nestMailInterval(flow.invoiceCreationMailTemplate)},
        renewalSuccessMailTemplate: {
          connect: flow.renewalSuccessMailTemplate
        },
        renewalFailedMailTemplate: {
          connect: flow.renewalFailedMailTemplate
        },
        deactivationUnpaidMailTemplate:
          flow.deactivationUnpaidMailTemplate == null
            ? {}
            : {create: this.nestMailInterval(flow.deactivationUnpaidMailTemplate)},
        deactivationByUserMailTemplate:
          flow.deactivationByUserMailTemplate == null
            ? {}
            : {connect: flow.deactivationByUserMailTemplate},
        reactivationMailTemplate: {
          connect: flow.reactivationMailTemplate
        },
        additionalIntervals: {
          create: flow.additionalIntervals.map(this.nestMailInterval)
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

    if (await this.filterHasOverlap(originalFlow.memberPlanId, flow)) {
      throw new Error('You cant update this flow because there is a filter overlap!')
    }

    await this.prismaService.subscriptionFlow.update({
      where: {id: flow.id},
      data: {
        paymentMethods: {
          connect: flow.paymentMethods,
          disconnect: originalFlow.paymentMethods.map(paymentMethod => ({id: paymentMethod.id}))
        },
        periodicities: flow.periodicities,
        autoRenewal: flow.autoRenewal,
        subscribeMailTemplate: flow.subscribeMailTemplate
          ? {
              connect: flow.subscribeMailTemplate
            }
          : undefined,
        invoiceCreationMailTemplate: flow.invoiceCreationMailTemplate
          ? {
              upsert: {
                create: this.nestMailInterval(flow.invoiceCreationMailTemplate),
                update: this.nestMailInterval(flow.invoiceCreationMailTemplate)
              }
            }
          : originalFlow.invoiceCreationMailTemplateId
          ? {delete: true}
          : {},
        renewalSuccessMailTemplate: flow.renewalSuccessMailTemplate
          ? {
              connect: flow.renewalSuccessMailTemplate
            }
          : undefined,
        renewalFailedMailTemplate: flow.renewalFailedMailTemplate
          ? {
              connect: flow.renewalFailedMailTemplate
            }
          : undefined,
        deactivationUnpaidMailTemplate: flow.deactivationUnpaidMailTemplate
          ? {
              upsert: {
                create: this.nestMailInterval(flow.deactivationUnpaidMailTemplate),
                update: this.nestMailInterval(flow.deactivationUnpaidMailTemplate)
              }
            }
          : originalFlow.deactivationUnpaidMailTemplateId
          ? {delete: true}
          : {},
        deactivationByUserMailTemplate: flow.deactivationByUserMailTemplate
          ? {
              connect: flow.deactivationByUserMailTemplate
            }
          : undefined,
        reactivationMailTemplate: flow.reactivationMailTemplate
          ? {
              connect: flow.reactivationMailTemplate
            }
          : undefined,
        additionalIntervals: {
          delete: originalFlow.additionalIntervals.map(additionalInterval => ({
            id: additionalInterval.id
          })),
          create: flow.additionalIntervals.map(this.nestMailInterval)
        }
      }
    })
    return this.getFlow(false)
  }

  async updateSubscriptionInterval(subscriptionInterval: SubscriptionIntervalUpdateInput) {
    await this.prismaService.subscriptionInterval.update({
      where: {
        id: subscriptionInterval.id
      },
      data: {
        daysAwayFromEnding: subscriptionInterval.daysAwayFromEnding,
        mailTemplate: { connect: subscriptionInterval.mailTemplate }
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
    memberPlanId: string | null,
    newFlow: Partial<SubscriptionFlowModelUpdateInput>
  ) {
    const whereClause = memberPlanId ? {memberPlan: {id: memberPlanId}} : {memberPlan: null}

    const allFlows = await this.prismaService.subscriptionFlow.findMany({
      where: whereClause,
      select: {
        id: true,
        paymentMethods: {
          select: {
            id: true
          }
        },
        periodicities: true,
        autoRenewal: true
      }
    })

    for (const flow of allFlows) {
      // skip itself
      if (newFlow.id === flow.id) {
        continue
      }
      const existingPM = new Set(flow.paymentMethods.map(pm => pm.id))
      const newPM = new Set((newFlow.paymentMethods || []).map(pm => pm.id))

      const existingPe = new Set(flow.periodicities)
      const newPe = new Set(newFlow.periodicities)

      const existingAr = new Set(flow.autoRenewal)
      const newAr = new Set(newFlow.autoRenewal)

      // find filter values that are distinct from the existing values
      const pmDifference = new Set([...newPM].filter(x => !existingPM.has(x)))
      const peDifference = new Set([...newPe].filter(x => !existingPe.has(x)))
      const arDifference = new Set([...newAr].filter(x => !existingAr.has(x)))

      if (pmDifference.size === 0 && peDifference.size === 0 && arDifference.size === 0) {
        return true
      }
    }
    return false
  }

  private nestMailInterval(
    interval: SubscriptionIntervalCreateInput | SubscriptionIntervalUpdateInput
  ) {
    return {
      daysAwayFromEnding: interval.daysAwayFromEnding!,
      mailTemplate: {
        connect: {
          id: interval.mailTemplate!.id
        }
      }
    }
  }
}
