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
import {useReducer, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {DateRange} from 'rsuite/esm/DateRangePicker'

import {AudienceChart} from './audience-chart'
import {AudienceFilter} from './audience-filter'
import {AudienceTable} from './audience-table'

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

  const [fetchStats, {data: audienceStats, loading}] = useDailySubscriptionStatsLazyQuery({
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
    replacedSubscriptionCount: false
  })

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('audienceDashboard.title')}</h2>
        </ListViewHeader>

        <ListViewFilterArea style={{alignItems: 'center'}}>
          <AudienceFilter
            clientFilter={audienceClientFilter}
            setClientFilter={setAudienceClientFilter}
            apiFilter={audienceApiFilter}
            setApiFilter={setAudienceApiFilter}
          />
        </ListViewFilterArea>
      </ListViewContainer>

      <AudienceChartWrapper>
        <AudienceChart activeFilters={audienceClientFilter} audienceStats={audienceStats} />
      </AudienceChartWrapper>

      <TableWrapperStyled>
        <AudienceTable audienceStats={audienceStats} />
      </TableWrapperStyled>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent(['CAN_GET_AUDIENCE_STATS'])(
  AudienceDashboard
)
export {CheckedPermissionComponent as AudienceDashboard}
