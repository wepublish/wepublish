import {
  DailySubscriptionStats,
  DailySubscriptionStatsQuery,
  DailySubscriptionStatsUser
} from '@wepublish/editor/api-v2'
import {useCallback, useMemo} from 'react'

import {AudienceClientFilter} from './useAudienceFilter'

export interface RenewalFigures {
  totalToBeRenewed: number
  renewedAndReplaced: number
  cancellationRate: number
  renewalRate: number
}

export interface AudienceStatsComputed extends DailySubscriptionStats, RenewalFigures {
  totalNewSubscriptions: number
  renewalRate: number
  cancellationRate: number
}

type SumUpCount = Pick<
  AudienceStatsComputed,
  | 'createdSubscriptionCount'
  | 'createdUnpaidSubscriptionCount'
  | 'deactivatedSubscriptionCount'
  | 'renewedSubscriptionCount'
  | 'replacedSubscriptionCount'
>

type SumUpCountKeys = keyof SumUpCount

export type AggregatedUsers = keyof Pick<
  AudienceStatsComputed,
  | 'createdSubscriptionUsers'
  | 'createdUnpaidSubscriptionUsers'
  | 'deactivatedSubscriptionUsers'
  | 'renewedSubscriptionUsers'
  | 'replacedSubscriptionUsers'
>

interface UseAudienceProps {
  audienceClientFilter: AudienceClientFilter
  audienceStats: DailySubscriptionStatsQuery | undefined
}

export function useAudience({audienceStats, audienceClientFilter}: UseAudienceProps) {
  const getTotalNewSubscriptionsByDay = useCallback(
    (dailyStat: Partial<DailySubscriptionStats>): number => {
      let totalNew = 0
      if (audienceClientFilter.createdSubscriptionCount) {
        totalNew += dailyStat?.createdSubscriptionCount || 0
      }
      if (audienceClientFilter.createdUnpaidSubscriptionCount) {
        totalNew += dailyStat?.createdUnpaidSubscriptionCount || 0
      }
      if (audienceClientFilter.renewedSubscriptionCount) {
        totalNew += dailyStat?.renewedSubscriptionCount || 0
      }
      if (audienceClientFilter.replacedSubscriptionCount) {
        totalNew += dailyStat?.replacedSubscriptionCount || 0
      }
      return totalNew
    },
    [audienceClientFilter]
  )

  const getRenewalFigures = useCallback(
    (dailyStat: Partial<DailySubscriptionStats>): RenewalFigures => {
      const totalToBeRenewed = dailyStat
        ? (dailyStat.renewedSubscriptionCount || 0) +
          (dailyStat.replacedSubscriptionCount || 0) +
          (dailyStat.deactivatedSubscriptionCount || 0)
        : 0

      const renewedAndReplaced = dailyStat
        ? totalToBeRenewed - (dailyStat.deactivatedSubscriptionCount || 0)
        : 0

      const cancellationRate = Math.round(
        ((dailyStat?.deactivatedSubscriptionCount || 0) * 100) / totalToBeRenewed || 0
      )

      const renewalRate = totalToBeRenewed === 0 ? 0 : 100 - cancellationRate

      return {
        totalToBeRenewed,
        renewedAndReplaced,
        cancellationRate,
        renewalRate
      }
    },
    []
  )

  const audienceStatsComputed = useMemo<AudienceStatsComputed[]>(() => {
    return (
      audienceStats?.dailySubscriptionStats.map(dailyStat => {
        const totalNewSubscriptions = getTotalNewSubscriptionsByDay(dailyStat)
        const renewalFigures = getRenewalFigures(dailyStat)

        return {
          ...dailyStat,
          deactivatedSubscriptionCount: -dailyStat.deactivatedSubscriptionCount,
          totalNewSubscriptions,
          ...renewalFigures
        }
      }) || []
    )
  }, [audienceStats, getTotalNewSubscriptionsByDay, getRenewalFigures])

  const sumUpCounts = useCallback(
    (monthStats: AudienceStatsComputed[], sumUpCountKey: SumUpCountKeys) => {
      return monthStats.reduce((sum, stat) => sum + stat[sumUpCountKey], 0)
    },
    []
  )

  const mergeUsers = useCallback(
    (monthStats: AudienceStatsComputed[], userProperty: AggregatedUsers) => {
      let mergedUsers: DailySubscriptionStatsUser[] = []

      for (const stat of monthStats) {
        mergedUsers = [...mergedUsers, ...(stat[userProperty] as DailySubscriptionStatsUser[])]
      }
      return mergedUsers
    },
    []
  )

  const getLastDaysOfMonths = useCallback(() => {
    return new Set(
      audienceStatsComputed.map(stat => {
        const date = new Date(stat.date)
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
      })
    )
  }, [audienceStatsComputed])

  const getStatsByMonth = useCallback(
    (lastDayOfMonthIso: string) => {
      const lastDayOfMonthDate = new Date(lastDayOfMonthIso)
      return audienceStatsComputed.filter(stat => {
        const statDate = new Date(stat.date)
        return (
          statDate.getMonth() === lastDayOfMonthDate.getMonth() &&
          statDate.getFullYear() === lastDayOfMonthDate.getFullYear()
        )
      })
    },
    [audienceStatsComputed]
  )

  const getCountsByMonth = useCallback(
    (statsByMonth: AudienceStatsComputed[]) => {
      return (
        [
          'createdSubscriptionCount',
          'createdUnpaidSubscriptionCount',
          'deactivatedSubscriptionCount',
          'renewedSubscriptionCount',
          'replacedSubscriptionCount'
        ] as SumUpCountKeys[]
      ).reduce((acc, key) => ({...acc, [key]: sumUpCounts(statsByMonth, key)}), {})
    },
    [sumUpCounts]
  )

  const getUsersByMonth = useCallback(
    (statsByMonth: AudienceStatsComputed[]) => {
      return (
        [
          'createdSubscriptionUsers',
          'createdUnpaidSubscriptionUsers',
          'deactivatedSubscriptionUsers',
          'renewedSubscriptionUsers',
          'replacedSubscriptionUsers'
        ] as AggregatedUsers[]
      ).reduce((acc, key) => ({...acc, [key]: mergeUsers(statsByMonth, key)}), {})
    },
    [mergeUsers]
  )

  const audienceStatsAggregatedByMonth = useMemo<AudienceStatsComputed[]>(() => {
    const aggregatedStats: AudienceStatsComputed[] = []
    const lastDaysOfMonths = getLastDaysOfMonths()

    // aggregate data month by month
    for (const lastDayOfMonthIso of lastDaysOfMonths) {
      const statsByMonth: AudienceStatsComputed[] = getStatsByMonth(lastDayOfMonthIso)

      const lastDayOfMonthWithStats = statsByMonth[statsByMonth.length - 1]

      const countsByMonth = getCountsByMonth(statsByMonth)

      const usersByMonth = getUsersByMonth(statsByMonth)

      const totalNewSubscriptions = getTotalNewSubscriptionsByDay(countsByMonth)
      const renewalFigures = getRenewalFigures({
        ...countsByMonth,
        deactivatedSubscriptionCount:
          (countsByMonth as SumUpCount).deactivatedSubscriptionCount * -1
      })

      aggregatedStats.push({
        ...lastDayOfMonthWithStats,
        date: lastDayOfMonthWithStats.date,
        ...countsByMonth,
        ...usersByMonth,
        totalNewSubscriptions,
        ...renewalFigures
      })
    }

    return aggregatedStats
  }, [
    getLastDaysOfMonths,
    getStatsByMonth,
    getCountsByMonth,
    getUsersByMonth,
    getTotalNewSubscriptionsByDay,
    getRenewalFigures
  ])

  return {
    audienceStatsComputed,
    audienceStatsAggregatedByMonth
  }
}
