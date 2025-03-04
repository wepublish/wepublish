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
import {DateRangePicker, RadioTile, RadioTileGroup, Table} from 'rsuite'
import {DateRange} from 'rsuite/esm/DateRangePicker'
import {RowDataType} from 'rsuite/esm/Table'

import {AudienceStat, getAudienceStats} from './audience-data-mocker'

export type DateResolution = 'week' | 'month' | 'day'

const {Column, HeaderCell, Cell} = Table

function AudienceDashboard() {
  const {t} = useTranslation()

  const [dateResolution, setDateResolution] = useState<DateResolution>('month')
  const [dateRange, setDateRange] = useState<DateRange | null | undefined>(undefined)
  const [audienceStat, setAudienceStat] = useState<AudienceStat[]>([])

  function loadAudienceStats(): void {
    const audienceStats = getAudienceStats({groupBy: dateResolution})
    setAudienceStat(audienceStats)
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
      <TableWrapper>
        <Table data={audienceStat} style={{width: '100%'}}>
          <Column resizable>
            <HeaderCell>{'Monat'}</HeaderCell>
            <Cell dataKey="date" />
          </Column>
          <Column resizable width={150}>
            <HeaderCell>{'Laufende Abos'}</HeaderCell>
            <Cell dataKey="ongoingSubscriptions" />
          </Column>
          <Column resizable>
            <HeaderCell>{'Erneuerungen'}</HeaderCell>
            <Cell dataKey="renewedSubscriptions" />
          </Column>
          <Column resizable>
            <HeaderCell>{'Kündigungen'}</HeaderCell>
            <Cell dataKey="cancelledSubscriptions" />
          </Column>
          <Column resizable width={150}>
            <HeaderCell>{'Erneuerungsrate'}</HeaderCell>
            <Cell dataKey="renewalRate">
              {(rowData: RowDataType<AudienceStat>) => <>{rowData.renewalRate}%</>}
            </Cell>
          </Column>
          <Column resizable width={150}>
            <HeaderCell>{'Kündigungsrate'}</HeaderCell>
            <Cell dataKey="cancellationRate">
              {(rowData: RowDataType<AudienceStat>) => <>{rowData.cancellationRate}%</>}
            </Cell>
          </Column>
          <Column resizable width={150}>
            <HeaderCell>{'Total aktive Abos'}</HeaderCell>
            <Cell dataKey="totalActiveSubscriptions" />
          </Column>
        </Table>
      </TableWrapper>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent(['CAN_GET_AUDIENCE_STATS'])(
  AudienceDashboard
)
export {CheckedPermissionComponent as AudienceDashboard}
