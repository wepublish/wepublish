import {Dispatch, SetStateAction, useEffect} from 'react'
import {Col, DateRangePicker, Grid, Row} from 'rsuite'
import {DateRange} from 'rsuite/esm/DateRangePicker'

import {ActiveAudienceFilters} from './audience-dashboard'
import {AudienceFilterToggle} from './audience-filter-toggle'

export interface AudienceFilterProps {
  activeFilters: ActiveAudienceFilters
  setActiveFilters: Dispatch<SetStateAction<ActiveAudienceFilters>>
  dateRange: DateRange | null | undefined
  setDateRange: (dateRange: DateRange | undefined | null) => void
}

export function AudienceFilter({
  activeFilters,
  setActiveFilters,
  dateRange,
  setDateRange
}: AudienceFilterProps) {
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
    <Grid style={{width: '100%'}}>
      <Row>
        {/* select date range */}
        <Col xs={4}>
          <DateRangePicker
            defaultCalendarValue={[new Date('2025-01-01'), new Date('2025-02-01')]}
            size="lg"
            value={dateRange}
            hoverRange="month"
            onChange={setDateRange}
          />
        </Col>

        {/* select data */}
        <Col xs={20}>
          <Row>
            {Object.keys(activeFilters).map(filterKey => (
              <Col xs={8}>
                <AudienceFilterToggle
                  filterKey={filterKey as keyof ActiveAudienceFilters}
                  activeFilters={activeFilters}
                  setActiveFilters={setActiveFilters}
                />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Grid>
  )
}
