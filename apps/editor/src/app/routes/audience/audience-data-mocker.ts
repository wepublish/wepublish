import {DateResolution} from './audience-dashboard'

export interface AudienceStat {
  date: string
  ongoingSubscriptions: number
  renewedSubscriptions: number
  newSubscriptions: number
  cancelledSubscriptions: number
  renewalRate: number
  cancellationRate: number
  totalActiveSubscriptions: number
}

export function getAudienceStats({groupBy}: {groupBy: DateResolution}): AudienceStat[] {
  return [
    {
      date: 'Januar',
      ongoingSubscriptions: 150,
      renewedSubscriptions: 10,
      newSubscriptions: 13,
      cancelledSubscriptions: 10,
      renewalRate: 10,
      cancellationRate: 5,
      totalActiveSubscriptions: 200
    },
    {
      date: 'Februar',
      ongoingSubscriptions: 140,
      renewedSubscriptions: 20,
      newSubscriptions: 25,
      cancelledSubscriptions: 10,
      renewalRate: 10,
      cancellationRate: 5,
      totalActiveSubscriptions: 200
    },
    {
      date: 'März',
      ongoingSubscriptions: 140,
      renewedSubscriptions: 20,
      newSubscriptions: 35,
      cancelledSubscriptions: 10,
      renewalRate: 10,
      cancellationRate: 5,
      totalActiveSubscriptions: 200
    }
  ]
}
