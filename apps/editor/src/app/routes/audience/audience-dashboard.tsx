import {styled} from '@mui/material'
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  TableWrapper
} from '@wepublish/ui/editor'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdCalendarMonth, MdCalendarToday, MdCalendarViewWeek} from 'react-icons/md'
import {DateRangePicker, Divider, RadioTile, RadioTileGroup} from 'rsuite'
import {DateRange} from 'rsuite/esm/DateRangePicker'

import {AudienceChart} from './audience-chart'
import {AudienceStat, getAudienceStats} from './audience-data-mocker'
import {AudienceTable} from './audience-table'

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

  const [dateResolution, setDateResolution] = useState<DateResolution>('month')
  const [dateRange, setDateRange] = useState<DateRange | null | undefined>(undefined)
  const [audienceStats, setAudienceStats] = useState<AudienceStat[]>([])

  function loadAudienceStats(): void {
    const audienceStats = getAudienceStats({groupBy: dateResolution})
    setAudienceStats(audienceStats)
  }

  function onChangeResolution(dateResolution: DateResolution) {
    setDateRange(null)
    setDateResolution(dateResolution)
    loadAudienceStats()
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('audienceDashboard.title')}</h2>
        </ListViewHeader>

        <ListViewFilterArea style={{alignItems: 'center'}}>
          <RadioTileGroup
            inline
            defaultValue={dateResolution}
            aria-label="Create new project"
            onChange={dateResolution => onChangeResolution(dateResolution as DateResolution)}>
            <RadioTile icon={<MdCalendarToday />} label="Tägliche Auflösung" value="day" />
            <RadioTile icon={<MdCalendarViewWeek />} label="Wöchentliche Auflösung" value="week" />
            <RadioTile icon={<MdCalendarMonth />} label="Monatliche Auflösung" value="month" />
          </RadioTileGroup>

          <DateRangePicker
            size="lg"
            value={dateRange}
            hoverRange={dateResolution === 'day' ? undefined : dateResolution}
            onChange={newDateRange => setDateRange(newDateRange as DateRange | undefined | null)}
          />
        </ListViewFilterArea>
      </ListViewContainer>

      <AudienceChartWrapper>
        <AudienceChart audienceStats={audienceStats} />
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
