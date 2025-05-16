import styled from '@emotion/styled'
import {
  DailySubscriptionStats,
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
import {useMemo, useReducer, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {DateRange} from 'rsuite/esm/DateRangePicker'

import {AudienceChart} from './audience-chart'
import {AudienceFilter} from './audience-filter'
import {AudienceTable} from './audience-table'
import {useAudience} from './useAudience'

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

const AudienceChartWrapper = styled('div')`
  margin-top: ${({theme}) => theme.spacing(4)};
  padding-top: ${({theme}) => theme.spacing(2)};
  padding-right: ${({theme}) => theme.spacing(4)};
  height: 100%;
  width: 100%;
  min-height: 40vh;
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
  const [fetchStats, {data: rawAudienceStats}] = useDailySubscriptionStatsLazyQuery({
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

  const {audienceStatsComputed, audienceStatsAggregatedByMonth} = useAudience({
    audienceClientFilter,
    audienceStats: rawAudienceStats
  })

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
