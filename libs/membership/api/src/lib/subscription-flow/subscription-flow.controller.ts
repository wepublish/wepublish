import {Injectable} from '@nestjs/common'
import {
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalCreateInput,
  SubscriptionIntervalDeleteInput,
  SubscriptionIntervalUpdateInput
} from './subscription-flow.model'
import {
  subscriptionFlowDaysAwayFromEndingNeedToBeNull,
  subscriptionFlowNonUniqueEvents,
  subscriptionFlowRequiredEvents
} from './subscription-flow.type'
import {SubscriptionEvent} from '@prisma/client'
import {PrismaService} from '@wepublish/nest-modules'
const SUBSCRIPTION_EVENT_MAX_DAYS_BEFORE = -25
const SUBSCRIPTION_EVENT_MAX_DAYS_AFTER = 90

@Injectable()
export class SubscriptionFlowController {
  constructor(private readonly prismaService: PrismaService) {}
  async getFlows(defaultFlowOnly: boolean, memberPlanId?: string) {
    let where = {}
    if (defaultFlowOnly) {
      where = {
        default: true
      }
    } else if (memberPlanId !== undefined) {
      // do not pass undefined member plan id.
      where = {
        OR: [
          {
            memberPlanId
          },
          {
            memberPlanId: null
          }
        ]
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
    if (
      flow.periodicities.length === 0 ||
      flow.autoRenewal.length === 0 ||
      flow.paymentMethodIds.length === 0
    ) {
      throw new Error(
        'Its not allowed to create subscription flow with no periodicities OR autoRenewal OR paymentMethods'
      )
    }

    if (await this.filterHasOverlap(flow.memberPlanId, flow)) {
      throw new Error("You can't create this flow because there is a filter overlap!")
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
          connect: flow.paymentMethodIds.map(paymentMethodId => ({id: paymentMethodId}))
        },
        periodicities: flow.periodicities,
        autoRenewal: flow.autoRenewal,
        intervals: {
          create: [
            {
              daysAwayFromEnding: -14,
              event: SubscriptionEvent.INVOICE_CREATION,
              mailTemplate: undefined
            },
            {
              daysAwayFromEnding: 5,
              event: SubscriptionEvent.DEACTIVATION_UNPAID,
              mailTemplate: undefined
            }
          ]
        }
      }
    })
    return this.getFlows(false)
  }

  async updateFlow(flow: SubscriptionFlowModelUpdateInput) {
    if (
      flow.periodicities.length === 0 ||
      flow.autoRenewal.length === 0 ||
      flow.paymentMethodIds.length === 0
    ) {
      throw new Error(
        'Its not allowed to update subscription flow with no periodicities OR autoRenewal OR paymentMethods'
      )
    }
    const originalFlow = await this.prismaService.subscriptionFlow.findUnique({
      where: {
        id: flow.id
      },
      include: {
        paymentMethods: true
      }
    })
    if (!originalFlow) throw new Error('The given filter is not found!')

    if (await this.filterHasOverlap(originalFlow.memberPlanId, flow)) {
      throw new Error("You can't update this flow because there is a filter overlap!")
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
            connect: flow.paymentMethodIds.map(paymentMethodId => ({id: paymentMethodId}))
          },
          periodicities: flow.periodicities,
          autoRenewal: flow.autoRenewal
        }
      })
    ])
    return this.getFlows(false)
  }

  async deleteFlow(subscriptionFlowId: string) {
    const originalFlow = await this.prismaService.subscriptionFlow.findUnique({
      where: {
        id: subscriptionFlowId
      },
      include: {
        paymentMethods: true,
        intervals: true
      }
    })
    if (!originalFlow) throw new Error('The given filter is not found!')

    if (originalFlow.default) throw new Error('Its not allowed to delete default flow!')

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
    return this.getFlows(false)
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
        mailTemplate: interval.mailTemplateId
          ? {
              connect: {
                id: interval.mailTemplateId
              }
            }
          : {}
      }
    })
    return this.getFlows(false)
  }

  async updateIntervals(intervals: SubscriptionIntervalUpdateInput[]) {
    for (const interval of intervals) {
      await this.updateInterval(interval)
    }
    return this.getFlows(false)
  }

  async updateInterval(interval: SubscriptionIntervalUpdateInput) {
    const eventToUpdate = await this.prismaService.subscriptionInterval.findUnique({
      where: {
        id: interval.id
      }
    })
    if (!eventToUpdate) {
      throw new Error('The given interval not found!')
    }
    await this.isIntervalValid(
      {
        event: eventToUpdate.event,
        subscriptionFlowId: eventToUpdate.subscriptionFlowId,
        ...interval
      },
      false
    )

    await this.prismaService.$transaction([
      this.prismaService.subscriptionInterval.update({
        where: {id: interval.id},
        data: {mailTemplate: {disconnect: true}}
      }),
      this.prismaService.subscriptionInterval.update({
        where: {
          id: interval.id
        },
        data: {
          mailTemplate: interval.mailTemplateId
            ? {
                connect: {
                  id: interval.mailTemplateId
                }
              }
            : {},
          daysAwayFromEnding: interval.daysAwayFromEnding
        }
      })
    ])
    return this.getFlows(false)
  }

  async deleteInterval(interval: SubscriptionIntervalDeleteInput) {
    const intervalToDelete = await this.prismaService.subscriptionInterval.findUnique({
      where: {
        id: interval.id
      }
    })
    if (!intervalToDelete) {
      throw new Error('The given interval not found!')
    }

    if (subscriptionFlowRequiredEvents.includes(intervalToDelete.event)) {
      throw new Error(`Its not allowed to delete a required ${intervalToDelete.event} event! `)
    }

    await this.prismaService.subscriptionInterval.delete({
      where: {
        id: interval.id
      }
    })
    return this.getFlows(false)
  }

  async paymentMethods() {
    return this.prismaService.paymentMethod.findMany({})
  }

  private async filterHasOverlap(
    memberPlanId: string | null,
    newFlow: Partial<SubscriptionFlowModelUpdateInput>
  ) {
    const whereClause = memberPlanId ? {memberPlan: {id: memberPlanId}} : {}
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
      const newPM = new Set((newFlow.paymentMethodIds || []).map(pm => pm))

      const existingPe = new Set(flow.periodicities)
      const newPe = new Set(newFlow.periodicities)

      const existingAr = new Set(flow.autoRenewal)
      const newAr = new Set(newFlow.autoRenewal)

      // find filter values that are the same as the existing filter values
      const pmIntersection = new Set([...newPM].filter(x => existingPM.has(x)))
      const peIntersection = new Set([...newPe].filter(x => existingPe.has(x)))
      const arIntersection = new Set([...newAr].filter(x => existingAr.has(x)))

      // if any of the filter intersection are not empty, means that the filter combination exists already.
      if (pmIntersection.size !== 0 && peIntersection.size !== 0 && arIntersection.size !== 0) {
        return true
      }
    }
    return false
  }

  private async isIntervalValid(
    interval: SubscriptionIntervalCreateInput,
    checkEventUniqueConstraint = true
  ) {
    if (interval.daysAwayFromEnding === null || interval.daysAwayFromEnding === undefined) {
      if (!subscriptionFlowDaysAwayFromEndingNeedToBeNull.includes(interval.event)) {
        throw new Error(`For event ${interval.event} daysAwayFromEnding can not be null!`)
      }
    } else {
      if (subscriptionFlowDaysAwayFromEndingNeedToBeNull.includes(interval.event)) {
        throw new Error(`For event ${interval.event} daysAwayFromEnding needs to be null!`)
      }
    }

    if (checkEventUniqueConstraint && !subscriptionFlowNonUniqueEvents.includes(interval.event)) {
      const dbIntervals = await this.prismaService.subscriptionInterval.findMany({
        where: {
          subscriptionFlow: {
            id: interval.subscriptionFlowId
          }
        }
      })
      for (const dbInterval of dbIntervals) {
        if (dbInterval.event === interval.event) {
          throw new Error(
            `For each subscription flow its not allowed to have more than one events of the type ${interval.event}`
          )
        }
      }
    }

    // Limit daysAwayFromEnding
    if (
      !!interval.daysAwayFromEnding &&
      (interval.daysAwayFromEnding < SUBSCRIPTION_EVENT_MAX_DAYS_BEFORE ||
        interval.daysAwayFromEnding > SUBSCRIPTION_EVENT_MAX_DAYS_AFTER)
    ) {
      throw new Error(
        `daysAwayFromEnding is not in allowed range ${SUBSCRIPTION_EVENT_MAX_DAYS_BEFORE} to ${SUBSCRIPTION_EVENT_MAX_DAYS_AFTER}: ${interval.daysAwayFromEnding}`
      )
    }

    // check for special daysAwayFromEnding event constraints
    if (interval.event === SubscriptionEvent.INVOICE_CREATION) {
      if (!!interval.daysAwayFromEnding && interval.daysAwayFromEnding > 0) {
        throw new Error(
          `Its not possible to set event ${interval.event} to a date later as the subscription is renewed`
        )
      }
    }
    if (interval.event === SubscriptionEvent.DEACTIVATION_UNPAID) {
      if (!!interval.daysAwayFromEnding && interval.daysAwayFromEnding < 0) {
        throw new Error(
          `Its not possible to set event ${interval.event} to a date before as the subscription is renewed`
        )
      }
    }
  }
}
