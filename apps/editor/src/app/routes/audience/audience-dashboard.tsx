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

export type TimeResolution = 'daily' | 'monthly'

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

export interface AudienceApiFilter {
  dateRange?: DateRange | null
  memberPlanIds?: string[]
}

export interface AudienceComponentFilter {
  filter: boolean
  chart: boolean
  table: boolean
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

  const [resolution, setResolution] = useState<TimeResolution>('daily')
  const [audienceClientFilter, setAudienceClientFilter] = useState<AudienceClientFilter>({
    totalActiveSubscriptionCount: false,
    createdSubscriptionCount: true,
    createdUnpaidSubscriptionCount: false,
    deactivatedSubscriptionCount: true,
    renewedSubscriptionCount: true,
    replacedSubscriptionCount: true
  })
  const [audienceComponentFilter, setAudienceComponentFilter] = useState<AudienceComponentFilter>({
    chart: true,
    table: false,
    filter: true
  })
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
      let totalToBeRenewed = 0
      let renewedAndReplaced = 0
      if (audienceClientFilter.renewedSubscriptionCount) {
        totalToBeRenewed += dailyStat?.renewedSubscriptionCount || 0
        renewedAndReplaced += dailyStat?.renewedSubscriptionCount || 0
      }
      if (audienceClientFilter.replacedSubscriptionCount) {
        totalToBeRenewed += dailyStat?.replacedSubscriptionCount || 0
        renewedAndReplaced += dailyStat?.replacedSubscriptionCount || 0
      }
      if (audienceClientFilter.deactivatedSubscriptionCount) {
        totalToBeRenewed += dailyStat?.deactivatedSubscriptionCount || 0
      }

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

  const audienceStatsAggregatedByMonth = useMemo<AudienceStatsComputed[]>(() => {
    const aggregatedStats: AudienceStatsComputed[] = []

    // unique last days of every month
    const lastDaysOfMonths = new Set(
      audienceStatsComputed.map(stat => {
        const date = new Date(stat.date)
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
      })
    )

    // aggregate data per month
    for (const lastDayOfMonthIso of lastDaysOfMonths) {
      const lastDayOfMonthDate = new Date(lastDayOfMonthIso)
      const monthStats: AudienceStatsComputed[] = audienceStatsComputed.filter(stat => {
        const statDate = new Date(stat.date)
        return (
          statDate.getMonth() === lastDayOfMonthDate.getMonth() &&
          statDate.getFullYear() === lastDayOfMonthDate.getFullYear()
        )
      })

      const lastDayOfMonthWithStats = monthStats[monthStats.length - 1]

      // sum up the count figures
      const summedUpCounts = (
        [
          'createdSubscriptionCount',
          'createdUnpaidSubscriptionCount',
          'deactivatedSubscriptionCount',
          'renewedSubscriptionCount',
          'replacedSubscriptionCount'
        ] as SumUpCountKeys[]
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

      const totalNewSubscriptions = getTotalNewSubscriptionsByDay(summedUpCounts)
      const renewalFigures = getRenewalFigures({
        ...summedUpCounts,
        deactivatedSubscriptionCount:
          (summedUpCounts as SumUpCount).deactivatedSubscriptionCount * -1
      })

      aggregatedStats.push({
        ...lastDayOfMonthWithStats,
        date: lastDayOfMonthWithStats.date,
        ...summedUpCounts,
        ...mergedUsers,
        totalNewSubscriptions,
        ...renewalFigures
      })
    }

    return aggregatedStats
  }, [
    audienceStatsComputed,
    sumUpCounts,
    mergeUsers,
    getTotalNewSubscriptionsByDay,
    getRenewalFigures
  ])

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

        {audienceComponentFilter.filter && (
          <ListViewFilterArea style={{alignItems: 'center'}}>
            <AudienceFilter
              resolution={resolution}
              setResolution={setResolution}
              clientFilter={audienceClientFilter}
              setClientFilter={setAudienceClientFilter}
              apiFilter={audienceApiFilter}
              setApiFilter={setAudienceApiFilter}
              componentFilter={audienceComponentFilter}
              setComponentFilter={setAudienceComponentFilter}
            />
          </ListViewFilterArea>
        )}
      </ListViewContainer>

      {audienceComponentFilter.chart && (
        <AudienceChartWrapper>
          <AudienceChart audienceStats={audienceStats} clientFilter={audienceClientFilter} />
        </AudienceChartWrapper>
      )}

      {audienceComponentFilter.table && (
        <TableWrapperStyled>
          <AudienceTable
            audienceStats={audienceStats}
            clientFilter={audienceClientFilter}
            timeResolution={resolution}
          />
        </TableWrapperStyled>
      )}
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent(['CAN_GET_AUDIENCE_STATS'])(
  AudienceDashboard
)
export {CheckedPermissionComponent as AudienceDashboard}
