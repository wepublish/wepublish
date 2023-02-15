import {Injectable} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalCreateInput,
  SubscriptionIntervalDeleteInput,
  SubscriptionIntervalUpdateInput
} from './subscription-flow.model'
import {SubscriptionEvent} from '@prisma/client'
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
        paymentMethods: true,
        intervals: {
          include: {
            mailTemplate: true
          }
        }
      }
    })
  }

  async createFlow(flow: SubscriptionFlowModelCreateInput) {
    if (await this.filterHasOverlap(flow.memberPlanId, flow)) {
      throw new Error('You cant create this flow because there is a filter overlap!')
    }

    await this.prismaService.subscriptionFlow.create({
      data: {
        default: false,
        memberPlan: {
          connect: {
            id: flow.memberPlanId
          }
        },
        paymentMethods: {
          connect: flow.paymentMethodIds.map(paymentMethodeId => ({id: paymentMethodeId}))
        },
        periodicities: flow.periodicities,
        autoRenewal: flow.autoRenewal
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
        paymentMethods: true
      }
    })
    if (!originalFlow) throw Error('The given filter is not found!')

    if (await this.filterHasOverlap(originalFlow.memberPlanId, flow)) {
      throw new Error('You cant update this flow because there is a filter overlap!')
    }

    await this.prismaService.$transaction([
      this.prismaService.subscriptionFlow.update({
        where: {id: flow.id},
        data: {
          paymentMethods: {
            disconnect: originalFlow.paymentMethods.map(paymentMethod => ({id: paymentMethod.id}))
          }
        }
      }),
      this.prismaService.subscriptionFlow.update({
        where: {id: flow.id},
        data: {
          paymentMethods: {
            connect: flow.paymentMethodIds.map(paymentMethodeId => ({id: paymentMethodeId}))
          },
          periodicities: flow.periodicities,
          autoRenewal: flow.autoRenewal
        }
      })
    ])

    return this.getFlow(false)
  }

  async deleteFlow(subscriptionFlowId: number) {
    const originalFlow = await this.prismaService.subscriptionFlow.findUnique({
      where: {
        id: subscriptionFlowId
      },
      include: {
        paymentMethods: true,
        intervals: true
      }
    })
    if (!originalFlow) throw Error('The given filter is not found!')

    if (originalFlow.default) throw Error('Its not allowed to delete default flow!')

    await this.prismaService.$transaction([
      this.prismaService.subscriptionFlow.delete({
        where: {
          id: subscriptionFlowId
        }
      }),
      this.prismaService.subscriptionInterval.deleteMany({
        where: {
          id: {
            in: originalFlow.intervals.map(additionalInterval => additionalInterval.id)
          }
        }
      })
    ])

    return this.getFlow(false)
  }

  async createInterval(interval: SubscriptionIntervalCreateInput) {
    await this.isIntervalValid(interval)
    await this.prismaService.subscriptionInterval.create({
      data: {
        daysAwayFromEnding: interval.daysAwayFromEnding,
        subscriptionFlow: {
          connect: {
            id: interval.subscriptionFlowId
          }
        },
        event: interval.event,
        mailTemplate: {
          connect: {
            id: interval.mailTemplateId
          }
        }
      }
    })
    return this.getFlow(false)
  }

  async updateInterval(interval: SubscriptionIntervalUpdateInput) {
    const eventToUpdate = await this.prismaService.subscriptionInterval.findUnique({
      where: {
        id: interval.id
      }
    })
    if (!eventToUpdate) {
      throw Error('The given interval not found!')
    }
    await this.isIntervalValid({event: eventToUpdate.event, ...interval}, false)
    await this.prismaService.subscriptionInterval.update({
      where: {
        id: interval.id
      },
      data: {
        mailTemplate: {
          connect: {
            id: interval.mailTemplateId
          }
        },
        daysAwayFromEnding: interval.daysAwayFromEnding
      }
    })
    return this.getFlow(false)
  }

  async deleteInterval(interval: SubscriptionIntervalDeleteInput) {
    await this.prismaService.subscriptionInterval.delete({
      where: {
        id: interval.id
      }
    })
    return this.getFlow(false)
  }

  async filterHasOverlap(
    memberPlanId: string | null,
    newFlow: Partial<SubscriptionFlowModelUpdateInput>
  ) {
    //const whereClause = memberPlanId ? {memberPlan: {id: memberPlanId}} : {}

    const allFlows = await this.prismaService.subscriptionFlow.findMany({
      //where: whereClause,
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
      const newPM = new Set((newFlow.paymentMethodIds || []).map(pm => pm))

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

  async isIntervalValid(
    interval: SubscriptionIntervalCreateInput,
    checkEventUniqueConstraint = true
  ) {
    const daysAwayFromEndingNeedToBeNull: SubscriptionEvent[] = [
      SubscriptionEvent.SUBSCRIBE,
      SubscriptionEvent.REACTIVATION,
      SubscriptionEvent.DEACTIVATION_BY_USER,
      SubscriptionEvent.RENEWAL_FAILED,
      SubscriptionEvent.RENEWAL_SUCCESS
    ]
    const NonUniqueEvents: SubscriptionEvent[] = [SubscriptionEvent.CUSTOM]
    if (interval.daysAwayFromEnding === null) {
      if (!daysAwayFromEndingNeedToBeNull.includes(interval.event)) {
        throw Error(`For event ${interval.event} daysAwayFromEnding can not be null!`)
      }
    } else {
      if (daysAwayFromEndingNeedToBeNull.includes(interval.event)) {
        throw Error(`For event ${interval.event} daysAwayFromEnding needs to be null!`)
      }
    }

    if (checkEventUniqueConstraint && !NonUniqueEvents.includes(interval.event)) {
      const dbIntervals = await this.prismaService.subscriptionInterval.findMany({
        where: {
          subscriptionFlow: {
            every: {
              id: interval.subscriptionFlowId
            }
          }
        }
      })
      for (const dbInterval of dbIntervals) {
        if (dbInterval.event === interval.event) {
          throw Error(
            `For each subscription flow its not allowed to have more than one events of the type ${interval.event}`
          )
        }
      }
    }
  }
  /**
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

  private async deleteUnusedSubscriptionInterval(intervalId: number) {
    if (!(await this.isSubscriptionIntervalInUse(intervalId))) {
      await this.prismaService.subscriptionInterval.delete({
        where: {
          id: intervalId
        }
      })
    }
  }

  private async isSubscriptionIntervalInUse(intervalId: number) {
    const flows = await this.getFlow(false)
    for (const flow of flows) {
      if (flow.invoiceCreationMailTemplateId === intervalId) {
        return true
      }
      if (flow.deactivationUnpaidMailTemplateId === intervalId) {
        return true
      }
      for (const addtionalInterval of flow.additionalIntervals) {
        if (addtionalInterval.id === intervalId) {
          return true
        }
      }
    }
    return false
  }
**/
}
