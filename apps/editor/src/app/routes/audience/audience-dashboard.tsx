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

export type ActiveAudienceFilters = Pick<
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

  const [dateRange, setDateRange] = useReducer(
    (_state: DateRange | null | undefined, action: DateRange | null | undefined) => {
      if (!action || action.length < 2) {
        return action
      }

      fetchStats({
        variables: {
          start: action[0].toISOString(),
          end: action[1].toISOString()
        },
        fetchPolicy: 'cache-first'
      })
      return action
    },
    undefined
  )

  const [activeFilters, setActiveFilters] = useState<ActiveAudienceFilters>({
    totalActiveSubscriptionCount: true,
    createdSubscriptionCount: true,
    createdUnpaidSubscriptionCount: true,
    deactivatedSubscriptionCount: true,
    renewedSubscriptionCount: true,
    replacedSubscriptionCount: true
  })

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('audienceDashboard.title')}</h2>
        </ListViewHeader>

        <ListViewFilterArea style={{alignItems: 'center'}}>
          <AudienceFilter
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
          {/* <RadioTileGroup
            inline
            defaultValue={dateResolution}
            aria-label="Create new project"
            onChange={dateResolution => onChangeResolution(dateResolution as DateResolution)}>
            <RadioTile icon={<MdCalendarToday />} label="Tägliche Auflösung" value="day" />
            <RadioTile icon={<MdCalendarViewWeek />} label="Wöchentliche Auflösung" value="week" />
            <RadioTile icon={<MdCalendarMonth />} label="Monatliche Auflösung" value="month" />
          </RadioTileGroup> */}

          {/* <DateRangePicker
            size="lg"
            value={dateRange}
            hoverRange={dateResolution === 'day' ? undefined : dateResolution}
            onChange={newDateRange => setDateRange(newDateRange as DateRange | undefined | null)}
          /> */}
        </ListViewFilterArea>
      </ListViewContainer>

      <AudienceChartWrapper>
        <AudienceChart activeFilters={activeFilters} audienceStats={audienceStats} />
      </AudienceChartWrapper>

      {/* <TableWrapperStyled>
        <AudienceTable audienceStats={audienceStats} />
      </TableWrapperStyled> */}
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent(['CAN_GET_AUDIENCE_STATS'])(
  AudienceDashboard
)
export {CheckedPermissionComponent as AudienceDashboard}
