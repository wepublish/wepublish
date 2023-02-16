import {
  Action,
  LookupActionInput,
  Store,
  StoreInterval,
  StoreTimeline
} from './subscription-event-dictionary.type'
import {PrismaService} from '@wepublish/api'

export class SubscriptionEventDictionary {
  private store: Store = {
    customFlow: {},
    defaultFlow: {
      onUserAction: []
    }
  }
  private storeIsBuild = false
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
      throw Error('Default user subscription flow not found!')
    }
    this.storeIsBuild = true
  }
  private assignActions(storeTimeline: StoreTimeline | undefined, intervals: StoreInterval[]) {
    if (!storeTimeline) {
      throw Error('StoreTimeline is undefined, this should not happen! You should never see this')
    }
    for (const interval of intervals) {
      if (!interval.daysAwayFromEnding) {
        storeTimeline.onUserAction.push({
          type: interval.event,
          externalMailTemplate: interval.externalMailTemplate
        })
        continue
      }
      if (!storeTimeline[interval.daysAwayFromEnding])
        storeTimeline[interval.daysAwayFromEnding] = []
      storeTimeline[interval.daysAwayFromEnding].push({
        type: interval.event,
        externalMailTemplate: interval.externalMailTemplate
      })
    }
  }
  public getActionFromStore(query: LookupActionInput): Action[] {
    if (!this.storeIsBuild) {
      throw Error('Tried to access store before it was successfully initialized!')
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
        return this.getActionByDay(this.store.defaultFlow, query.daysAwayFromEnding)
      }
      path = path[pathElement]
    }
    const custom_path =
      this.store.customFlow![query.memberplanId]![query.paymentmethodeId]![query.periodicity]![
        query.autorenwal.toString()
      ]
    return this.getActionByDay(custom_path, query.daysAwayFromEnding)
  }

  private getActionByDay(timeline: StoreTimeline, daysAwayFromEnding: number | null): Action[] {
    if (!daysAwayFromEnding) {
      return timeline.onUserAction
    }
    if (timeline[daysAwayFromEnding]) {
      return timeline[daysAwayFromEnding]
    }
    return []
  }
}
