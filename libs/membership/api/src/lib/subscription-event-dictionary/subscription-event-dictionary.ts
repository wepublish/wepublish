import {
  Action,
  LookupActionInput,
  Store,
  StoreInterval,
  StoreTimeline
} from './subscription-event-dictionary.type'
import {PrismaService} from '@wepublish/api'
import {startOfDay, subDays, subMinutes} from 'date-fns'
import {SubscriptionEvent} from '@prisma/client'

export class SubscriptionEventDictionary {
  private store: Store = {
    customFlow: {},
    defaultFlow: {
      onUserAction: []
    }
  }
  private storeIsBuild = false
  private daysAwayFromEndingCustomEventList: number[] = [0]
  private dateAwayFromEndingList: Date[] = []

  private earliestInvoiceCreationDate: null | number = null
  constructor(private readonly prismaService: PrismaService) {}

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
      const intervals = subscriptionFlow.intervals.map(int => ({
        event: int.event,
        daysAwayFromEnding: int.daysAwayFromEnding,
        externalMailTemplate: int.mailTemplate ? int.mailTemplate.externalMailTemplateId : null
      }))

      if (subscriptionFlow.default) {
        this.assignActions(this.store.defaultFlow, intervals)
        defaultFlowInitialized = true
        continue
      }
      if (!subscriptionFlow.memberPlanId) {
        continue
      }

      if (!this.store.customFlow[subscriptionFlow.memberPlanId])
        this.store.customFlow[subscriptionFlow.memberPlanId] = {}

      for (const pm of subscriptionFlow.paymentMethods.map(pm => pm.id)) {
        if (!this.store.customFlow[subscriptionFlow.memberPlanId][pm])
          this.store.customFlow[subscriptionFlow.memberPlanId][pm] = {}
        for (const periodicity of subscriptionFlow.periodicities) {
          if (!this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity])
            this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity] = {}
          for (const ar of subscriptionFlow.autoRenewal) {
            if (
              !this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity]![ar.toString()]
            )
              this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity]![
                ar.toString()
              ] = {onUserAction: []}
            this.assignActions(
              this.store.customFlow[subscriptionFlow.memberPlanId][pm][periodicity]![ar.toString()],
              intervals
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
  private assignActions(storeTimeline: StoreTimeline | undefined, intervals: StoreInterval[]) {
    if (!storeTimeline) {
      throw new Error(
        'StoreTimeline is undefined, this should not happen! You should never see this'
      )
    }
    for (const interval of intervals) {
      if (!interval.daysAwayFromEnding) {
        storeTimeline.onUserAction.push({
          type: interval.event,
          daysAwayFromEnding: interval.daysAwayFromEnding,
          externalMailTemplate: interval.externalMailTemplate
        })
        continue
      }
      if (!storeTimeline[interval.daysAwayFromEnding]) {
        storeTimeline[interval.daysAwayFromEnding] = []
      }
      storeTimeline[interval.daysAwayFromEnding].push({
        type: interval.event,
        daysAwayFromEnding: interval.daysAwayFromEnding,
        externalMailTemplate: interval.externalMailTemplate
      })

      // Store earliest invoice creation date
      if (interval.event === SubscriptionEvent.INVOICE_CREATION) {
        if (
          !this.earliestInvoiceCreationDate ||
          interval.daysAwayFromEnding < this.earliestInvoiceCreationDate
        )
          this.earliestInvoiceCreationDate = interval.daysAwayFromEnding
      }

      if (interval.event === SubscriptionEvent.CUSTOM) {
        if (!this.daysAwayFromEndingCustomEventList.includes(interval.daysAwayFromEnding)) {
          this.daysAwayFromEndingCustomEventList.push(interval.daysAwayFromEnding)
        }
      }
    }
  }
  public getEarliestInvoiceCreationDate(date: Date) {
    if (!this.earliestInvoiceCreationDate) throw new Error('No invoice cration date found!')
    return subDays(this.normalizeDate(date), this.earliestInvoiceCreationDate)
  }
  public buildCustomEventDateList(date: Date) {
    if (!this.storeIsBuild) {
      throw new Error('Tried to access store before it was successfully initialized!')
    }
    const normalizedDate = this.normalizeDate(date)

    for (const daysAwayFromEnding of this.daysAwayFromEndingCustomEventList) {
      this.dateAwayFromEndingList.push(subDays(normalizedDate, daysAwayFromEnding))
    }
  }

  public getDatesWithCustomEvent(): Date[] {
    if (this.dateAwayFromEndingList.length === 0) {
      throw new Error('Tried to access eventDataList before it was successfully initialized!')
    }
    return this.dateAwayFromEndingList
  }

  public getActionFromStore(query: LookupActionInput): Action[] {
    if (!this.storeIsBuild) {
      throw new Error('Tried to access store before it was successfully initialized!')
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

  private getActionByDay(
    timeline: StoreTimeline,
    daysAwayFromEnding: number | undefined,
    lookupEvents: SubscriptionEvent[] | undefined
  ): Action[] {
    if (lookupEvents) {
      let events: Action[] = []
      let k: keyof typeof timeline
      for (k in timeline) {
        events = events.concat(timeline[k].filter(e => lookupEvents.includes(e.type)))
      }
      return events
    }
    // Return user actions for null and 0!
    if (!daysAwayFromEnding) {
      return timeline.onUserAction
    }
    if (timeline[daysAwayFromEnding]) {
      return timeline[daysAwayFromEnding]
    }
    return []
  }

  private normalizeDate(date: Date): Date {
    return new Date(subMinutes(startOfDay(date), date.getTimezoneOffset()))
  }
}
