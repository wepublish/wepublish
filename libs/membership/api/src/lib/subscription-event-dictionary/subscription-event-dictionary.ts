import {
  Action,
  LookupActionInput,
  Store as SubscriptionFlowStore
} from './subscription-event-dictionary.type'
import {startOfDay, subDays, subMinutes} from 'date-fns'
import {PrismaClient, Subscription, SubscriptionEvent} from '@prisma/client'

/**
 * This class stores all possible SubscriptionFlows in a single tree
 * data structure. The structure of the tree is as follows:
 * @example
 * customFlow: {
 *   [memberPlanId]: {
 *     [paymentMethodId]: {
 *       [periodicity]: {
 *         [autoRenew]: [
 *           Action[]
 *         ]
 *       }
 *     }
 *   }
 * },
 * defaultFlow: {
 *   Action[]
 * }
 *
 * The Action array is a list of all MailTemplates where the settings
 * match the given tree hierarchy.
 *
 * @example
 * customFlow: { "mp1": { "payrexx": { "monthly": { "true": [{ event: "RENEWAL", externalMailTemplate: "template1" }] } } } }
 *
 * The method {@link getActionFromStore} can be used to query a specific leaf
 * by providing filter values for member plan, payment method, periodicity,
 * renewal and EITHER the daysAwayFromEnding or a list of event names.
 */
export class SubscriptionEventDictionary {
  private store: SubscriptionFlowStore = {
    customFlow: {},
    defaultFlow: []
  }
  private storeIsBuild = false
  private daysAwayFromEndingCustomEventList: number[] = [0]
  private dateAwayFromEndingList: Date[] = []

  private earliestInvoiceCreationDate: null | number = null
  constructor(private readonly prismaService: PrismaClient) {}

  /**
   * Generate the tree structure mentioned in the docs of {@link SubscriptionEventDictionary}.
   */
  public async initialize() {
    let defaultFlowInitialized = false
    const subscriptionFlows = await this.prismaService.subscriptionFlow.findMany({
      include: {
        paymentMethods: true,
        intervals: {
          include: {
            mailTemplate: true
          }
        }
      }
    })
    for (const subscriptionFlow of subscriptionFlows) {
      const actions = subscriptionFlow.intervals.map(int => ({
        type: int.event,
        daysAwayFromEnding: int.daysAwayFromEnding,
        externalMailTemplate: int.mailTemplate ? int.mailTemplate.externalMailTemplateId : null
      }))

      if (subscriptionFlow.default) {
        if (defaultFlowInitialized) {
          throw new Error('Multiple default memberplans found! This is a data integrity error!')
        }
        this.assignActions(this.store.defaultFlow, actions)
        defaultFlowInitialized = true
        continue
      }
      if (!subscriptionFlow.memberPlanId) {
        throw new Error(
          'Subscription Flow with no memberplan found that is not default! This is a data integrity error!'
        )
      }

      if (!this.store.customFlow[subscriptionFlow.memberPlanId]) {
        this.store.customFlow[subscriptionFlow.memberPlanId] = {}
      }

      for (const pm of subscriptionFlow.paymentMethods.map(pm => pm.id)) {
        if (!this.store.customFlow[subscriptionFlow.memberPlanId][pm]) {
          this.store.customFlow[subscriptionFlow.memberPlanId][pm] = {}
        }
        for (const periodicity of subscriptionFlow.periodicities) {
          if (!this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity]) {
            this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity] = {}
          }
          for (const ar of subscriptionFlow.autoRenewal) {
            if (
              !this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity]![ar.toString()]
            )
              this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity]![
                ar.toString()
              ] = []
            this.assignActions(
              this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity]![ar.toString()],
              actions
            )
          }
        }
      }
    }
    if (!defaultFlowInitialized) {
      throw new Error('Default user subscription flow not found!')
    }
    this.storeIsBuild = true
  }

  /**
   * Store the provided intervals in the specified leaf of the tree structure.
   * @param treeLeaf The leaf to store the actions in.
   * @param intervals The actions to store.
   */
  private assignActions(treeLeaf: Action[], actions: Action[]) {
    for (const action of actions) {
      treeLeaf.push(action)
      if (!action.daysAwayFromEnding) {
        continue
      }

      // Store earliest invoice creation date
      if (action.type === SubscriptionEvent.INVOICE_CREATION) {
        if (
          !this.earliestInvoiceCreationDate ||
          action.daysAwayFromEnding < this.earliestInvoiceCreationDate
        ) {
          this.earliestInvoiceCreationDate = action.daysAwayFromEnding
        }
      }

      if (action.type === SubscriptionEvent.CUSTOM) {
        if (!this.daysAwayFromEndingCustomEventList.includes(action.daysAwayFromEnding)) {
          this.daysAwayFromEndingCustomEventList.push(action.daysAwayFromEnding)
        }
      }
    }
  }

  public getEarliestInvoiceCreationDate(date: Date) {
    if (!this.earliestInvoiceCreationDate) throw new Error('No invoice creation date found!')
    return subDays(this.normalizeDate(date), this.earliestInvoiceCreationDate)
  }

  /**
   * Build the list of custom events for {@link getDatesWithCustomEvent}.
   * @param date The date for which to calculate the offsets for the custom events.
   */
  public buildCustomEventDateList(date: Date) {
    if (!this.storeIsBuild) {
      throw new Error('Tried to access store before it was successfully initialized!')
    }
    const normalizedDate = this.normalizeDate(date)

    for (const daysAwayFromEnding of this.daysAwayFromEndingCustomEventList) {
      this.dateAwayFromEndingList.push(subDays(normalizedDate, daysAwayFromEnding))
    }
  }

  /**
   * Get an array of the dates where custom events have been defined.
   * @returns An array of dates.
   */
  public getDatesWithCustomEvent(): Date[] {
    if (this.dateAwayFromEndingList.length === 0) {
      throw new Error('Tried to access eventDataList before it was successfully initialized!')
    }
    return this.dateAwayFromEndingList
  }

  /**
   * Try to get the MailTemplates for a specific filter of [memberPlan,
   * paymentMethod, periodicity, autoRenewal]. You additionally need to pass
   * either `daysAwayFromEnding` or `events` to filter further. If any
   * filter leads to an empty result set, the templates of the default flow are
   * returned.
   * @param query The filter of the above properties.
   * @returns An array of MailTemplates.
   */
  public getActionFromStore(query: LookupActionInput): Action[] {
    if (!this.storeIsBuild) {
      throw new Error('Tried to access store before it was successfully initialized!')
    }
    if (query.daysAwayFromEnding && query.events) {
      throw new Error(
        'Its not supported to query for daysAwayFromEnding combined with an event list'
      )
    }

    let path = this.store.customFlow
    const pathElements = [
      query.memberplanId,
      query.paymentmethodeId,
      query.periodicity,
      query.autorenwal.toString()
    ]
    for (const pathElement of pathElements) {
      if (!(pathElement in path)) {
        return this.getActionByDay(this.store.defaultFlow, query.daysAwayFromEnding, query.events)
      }
      path = path[pathElement]
    }
    const custom_path =
      this.store.customFlow![query.memberplanId]![query.paymentmethodeId]![query.periodicity]![
        query.autorenwal.toString()
      ]
    return this.getActionByDay(custom_path, query.daysAwayFromEnding, query.events)
  }

  /**
   * Filter the MailTemplates stored in a leaf of the store. They can either be
   * filtered by `daysAwayFromEnding` or by `lookupEvents`.
   * @param timeline The leaf of the store.
   * @param daysAwayFromEnding Number of days away from ending.
   * @param lookupEvents The event identifiers.
   * @returns Array of mail templates.
   */
  private getActionByDay(
    timeline: Action[],
    daysAwayFromEnding: number | undefined,
    lookupEvents: SubscriptionEvent[] | undefined
  ): Action[] {
    if (lookupEvents) {
      return timeline.filter(e => lookupEvents.includes(e.type))
    }
    // Return user actions for null and 0!
    if (!daysAwayFromEnding) {
      return timeline.filter(t => t.daysAwayFromEnding === 0 || t.daysAwayFromEnding === null)
    }
    return timeline.filter(t => t.daysAwayFromEnding === daysAwayFromEnding)
  }

  private normalizeDate(date: Date): Date {
    return new Date(subMinutes(startOfDay(date), date.getTimezoneOffset()))
  }

  /**
   * Get the External Mail Template name for a specific subscription and subscription event.
   * @param prisma The Prisma client.
   * @param subsciption The subscription to search for.
   * @param subscriptionEvent The event to search for.
   * @returns The external template identifier OR undefined of none was found.
   */
  public static async getSubsciptionTemplateIdentifier(
    prisma: PrismaClient,
    subsciption: Subscription,
    subscriptionEvent: SubscriptionEvent
  ): Promise<string | undefined> {
    let flow = await prisma.subscriptionFlow.findFirst({
      where: {
        default: false,
        memberPlan: {
          id: subsciption.memberPlanID
        },
        autoRenewal: {
          has: subsciption.autoRenew
        },
        periodicities: {
          has: subsciption.paymentPeriodicity
        },
        paymentMethods: {
          some: {
            id: subsciption.paymentMethodID
          }
        }
      },
      include: {
        intervals: {
          where: {
            event: subscriptionEvent
          },
          include: {
            mailTemplate: true
          }
        }
      }
    })
    if (!flow) {
      flow = await prisma.subscriptionFlow.findFirst({
        where: {
          default: true
        },
        include: {
          intervals: {
            where: {
              event: subscriptionEvent
            },
            include: {
              mailTemplate: true
            }
          }
        }
      })
    }
    if (flow && flow.intervals[0]) {
      if (!flow.intervals[0].mailTemplate) {
        return undefined
      }
      return flow.intervals[0].mailTemplate.externalMailTemplateId
    }
    return undefined
  }
}
