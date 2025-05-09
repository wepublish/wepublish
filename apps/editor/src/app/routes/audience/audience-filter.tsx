import {useEffect} from 'react'
import {DateRangePicker} from 'rsuite'
import {DateRange} from 'rsuite/esm/DateRangePicker'

export interface AudienceFilterProps {
  dateRange: DateRange | null | undefined
  setDateRange: (dateRange: DateRange | undefined | null) => void
}

export function AudienceFilter({dateRange, setDateRange}: AudienceFilterProps) {
  useEffect(() => {
    const currentDate = new Date()
    const endDateOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDateOfTwoMonthsBefore = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 2,
      1
    )
    setDateRange([startDateOfTwoMonthsBefore, endDateOfCurrentMonth])
  }, [])

  return (
    <div>
      <DateRangePicker
        defaultCalendarValue={[new Date('2025-01-01'), new Date('2025-02-01')]}
        size="lg"
        value={dateRange}
        hoverRange="month"
        onChange={setDateRange}
      />
    </div>
  )
}
