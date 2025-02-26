import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader
} from '@wepublish/ui/editor'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdCalendarMonth, MdCalendarViewWeek} from 'react-icons/md'
import {DateRangePicker, RadioTile, RadioTileGroup} from 'rsuite'
import {DateRange} from 'rsuite/esm/DateRangePicker'

type DateResolution = 'week' | 'month'

function AudienceDashboard() {
  const {t} = useTranslation()

  const [dateResolution, setDateResolution] = useState<DateResolution>('month')
  const [dateRange, setDateRange] = useState<DateRange | null | undefined>(undefined)

  function onChangeResolution(dateResolution: DateResolution) {
    setDateRange(null)
    setDateResolution(dateResolution)
  }

  return (
    <ListViewContainer>
      <ListViewHeader>
        <h2>{t('audienceDashboard.title')}</h2>
      </ListViewHeader>

      <ListViewFilterArea style={{alignItems: 'center'}}>
        <RadioTileGroup
          defaultValue={dateResolution}
          aria-label="Create new project"
          onChange={dateResolution => onChangeResolution(dateResolution as DateResolution)}>
          <RadioTile icon={<MdCalendarMonth />} label="Monatliche Auflösung" value="month" />
          <RadioTile icon={<MdCalendarViewWeek />} label="Wöchentliche Auflösung" value="week" />
        </RadioTileGroup>

        <DateRangePicker
          size="lg"
          value={dateRange}
          hoverRange={dateResolution}
          onChange={newDateRange => setDateRange(newDateRange as DateRange | undefined | null)}
        />
      </ListViewFilterArea>
    </ListViewContainer>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent(['CAN_GET_AUDIENCE_STATS'])(
  AudienceDashboard
)
export {CheckedPermissionComponent as AudienceDashboard}
