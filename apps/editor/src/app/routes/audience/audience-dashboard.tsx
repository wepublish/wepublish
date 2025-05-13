import styled from '@emotion/styled'
import {
  DailySubscriptionStats,
  DailySubscriptionStatsUser,
  getApiClientV2,
  useDailySubscriptionStatsLazyQuery
} from '@wepublish/editor/api-v2'
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  TableWrapper
} from '@wepublish/ui/editor'
import {useCallback, useMemo, useReducer, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {DateRange} from 'rsuite/esm/DateRangePicker'

import {AudienceChart} from './audience-chart'
import {AudienceFilter} from './audience-filter'
import {AudienceTable} from './audience-table'

export type Resolution = 'daily' | 'monthly'

export type AudienceClientFilter = Pick<
  {
    [K in keyof DailySubscriptionStats]: boolean
  },
  | 'totalActiveSubscriptionCount'
  | 'createdSubscriptionCount'
  | 'createdUnpaidSubscriptionCount'
  | 'deactivatedSubscriptionCount'
  | 'renewedSubscriptionCount'
  | 'replacedSubscriptionCount'
>

type SumUpCount = keyof Pick<
  AudienceStatsComputed,
  | 'createdSubscriptionCount'
  | 'createdUnpaidSubscriptionCount'
  | 'deactivatedSubscriptionCount'
  | 'renewedSubscriptionCount'
  | 'replacedSubscriptionCount'
>

type AggregatedUsers = keyof Pick<
  AudienceStatsComputed,
  | 'createdSubscriptionUsers'
  | 'createdUnpaidSubscriptionUsers'
  | 'deactivatedSubscriptionUsers'
  | 'renewedSubscriptionUsers'
  | 'replacedSubscriptionUsers'
>

interface RenewalFigures {
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

export type DateResolution = 'week' | 'month' | 'day'
export interface AudienceApiFilter {
  dateRange?: DateRange | null
  memberPlanIds?: string[]
}

const AudienceChartWrapper = styled('div')`
  margin-top: ${({theme}) => theme.spacing(4)};
  padding-top: ${({theme}) => theme.spacing(2)};
  padding-right: ${({theme}) => theme.spacing(4)};
  height: 100%;
  width: 100%;
  min-height: 40vh;
  border: 1px solid ${({theme}) => theme.palette.grey[500]};
`

const TableWrapperStyled = styled(TableWrapper)`
  margin-top: ${({theme}) => theme.spacing(8)};
`

function AudienceDashboard() {
  const {t} = useTranslation()
  const client = getApiClientV2()

  const [resolution, setResolution] = useState<Resolution>('daily')
  const [fetchStats, {data: rawAudienceStats, loading}] = useDailySubscriptionStatsLazyQuery({
    client
  })

  const [audienceApiFilter, setAudienceApiFilter] = useReducer(
    (state: AudienceApiFilter, action: AudienceApiFilter) => {
      const dateRange = action.dateRange || state.dateRange
      const memberPlanIds = action.memberPlanIds || state.memberPlanIds

      if (!dateRange || dateRange.length < 2) {
        return action
      }

      fetchStats({
        variables: {
          start: dateRange[0].toISOString(),
          end: dateRange[1].toISOString(),
          memberPlanIds
        },
        fetchPolicy: 'cache-first'
      })
      return {
        dateRange,
        memberPlanIds
      }
    },
    {}
  )

  const [audienceClientFilter, setAudienceClientFilter] = useState<AudienceClientFilter>({
    totalActiveSubscriptionCount: false,
    createdSubscriptionCount: true,
    createdUnpaidSubscriptionCount: false,
    deactivatedSubscriptionCount: true,
    renewedSubscriptionCount: true,
    replacedSubscriptionCount: true
  })

  const getTotalNewSubscriptionsByDay = useCallback(
    (dailyStat: DailySubscriptionStats): number => {
      let totalNew = 0
      if (audienceClientFilter.createdSubscriptionCount) {
        totalNew += dailyStat.createdSubscriptionCount
      }
      if (audienceClientFilter.createdUnpaidSubscriptionCount) {
        totalNew += dailyStat.createdUnpaidSubscriptionCount
      }
      if (audienceClientFilter.renewedSubscriptionCount) {
        totalNew += dailyStat.renewedSubscriptionCount
      }
      if (audienceClientFilter.replacedSubscriptionCount) {
        totalNew += dailyStat.replacedSubscriptionCount
      }
      return totalNew
    },
    [audienceClientFilter]
  )

  const getRenewalFigures = useCallback(
    (dailyStat: DailySubscriptionStats): RenewalFigures => {
      let totalToBeRenewed = 0
      let renewedAndReplaced = 0
      if (audienceClientFilter.renewedSubscriptionCount) {
        totalToBeRenewed += dailyStat.renewedSubscriptionCount
        renewedAndReplaced += dailyStat.renewedSubscriptionCount
      }
      if (audienceClientFilter.replacedSubscriptionCount) {
        totalToBeRenewed += dailyStat.replacedSubscriptionCount
        renewedAndReplaced += dailyStat.replacedSubscriptionCount
      }
      if (audienceClientFilter.deactivatedSubscriptionCount) {
        totalToBeRenewed += dailyStat.deactivatedSubscriptionCount
      }

      const cancellationRate =
        Math.round(((dailyStat.deactivatedSubscriptionCount * 100) / totalToBeRenewed) * 100) /
          100 || 0
      const renewalRate = totalToBeRenewed === 0 ? 0 : 100 - cancellationRate

      return {
        totalToBeRenewed,
        renewedAndReplaced,
        cancellationRate,
        renewalRate
      }
    },
    [audienceClientFilter]
  )

  const audienceStatsComputed = useMemo<AudienceStatsComputed[]>(() => {
    return (
      rawAudienceStats?.dailySubscriptionStats.map(dailyStat => {
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
  }, [rawAudienceStats, getTotalNewSubscriptionsByDay, getRenewalFigures])

  const sumUpCounts = useCallback((monthStats: AudienceStatsComputed[], sumUpCount: SumUpCount) => {
    return monthStats.reduce((sum, stat) => sum + stat[sumUpCount], 0)
  }, [])

  const mergeUsers = useCallback(
    (monthStats: AudienceStatsComputed[], userProperty: AggregatedUsers) => {
      let mergedUsers: DailySubscriptionStatsUser[] = []

      for (const stat of monthStats) {
        mergedUsers = [...mergedUsers, ...(stat[userProperty] as DailySubscriptionStatsUser[])]
      }
    },
    []
  )

  const audienceStatsAggregatedByMonth = useMemo<AudienceStatsComputed[]>(() => {
    const aggregatedStats: AudienceStatsComputed[] = []

    // get unique month out of all the dates
    const months = new Set<number>()

    for (const stat of audienceStatsComputed) {
      const date = new Date(stat.date)
      months.add(date.getMonth())
    }

    // aggregate data per month
    for (const month of months) {
      const monthStats = audienceStatsComputed
        .filter(stat => new Date(stat.date).getMonth() === month)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const lastDayOfMonth = monthStats[monthStats.length - 1]

      // sum up the count figures
      const summedUpCounts = (
        [
          'createdSubscriptionCount',
          'createdUnpaidSubscriptionCount',
          'deactivatedSubscriptionCount',
          'renewedSubscriptionCount',
          'replacedSubscriptionCount'
        ] as SumUpCount[]
      ).reduce((acc, key) => ({...acc, [key]: sumUpCounts(monthStats, key)}), {})

      // merge the user
      const mergedUsers = (
        [
          'createdSubscriptionUsers',
          'createdUnpaidSubscriptionUsers',
          'deactivatedSubscriptionUsers',
          'renewedSubscriptionUsers',
          'replacedSubscriptionUsers'
        ] as AggregatedUsers[]
      ).reduce((acc, key) => ({...acc, [key]: mergeUsers(monthStats, key)}), {})

      aggregatedStats.push({
        ...lastDayOfMonth, // TODO
        date: lastDayOfMonth.date,
        ...summedUpCounts,
        ...mergedUsers
      })
    }

    return aggregatedStats
  }, [audienceStatsComputed, sumUpCounts, mergeUsers])

  const audienceStats = useMemo(
    () => (resolution === 'daily' ? audienceStatsComputed : audienceStatsAggregatedByMonth),
    [resolution, audienceStatsComputed, audienceStatsAggregatedByMonth]
  )

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('audienceDashboard.title')}</h2>
        </ListViewHeader>

        <ListViewFilterArea style={{alignItems: 'center'}}>
          <AudienceFilter
            resolution={resolution}
            setResolution={setResolution}
            clientFilter={audienceClientFilter}
            setClientFilter={setAudienceClientFilter}
            apiFilter={audienceApiFilter}
            setApiFilter={setAudienceApiFilter}
          />
        </ListViewFilterArea>
      </ListViewContainer>

      <AudienceChartWrapper>
        <AudienceChart audienceStats={audienceStats} clientFilter={audienceClientFilter} />
      </AudienceChartWrapper>

      <TableWrapperStyled>
        <AudienceTable audienceStats={audienceStats} clientFilter={audienceClientFilter} />
      </TableWrapperStyled>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent(['CAN_GET_AUDIENCE_STATS'])(
  AudienceDashboard
)
export {CheckedPermissionComponent as AudienceDashboard}
