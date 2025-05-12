import {useMemberPlanListQuery} from '@wepublish/editor/api'
import {Dispatch, SetStateAction, useEffect, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Col, DateRangePicker, Grid, Panel, Row, TagPicker} from 'rsuite'
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
  const {t} = useTranslation()

  // set initial date range
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

  // load available subscription plans
  const {data: memberPlans, loading: loadingMemberPlans} = useMemberPlanListQuery()

  const memberPlansForPicker = useMemo<{label: string; value: string}[]>(() => {
    return (
      memberPlans?.memberPlans.nodes.map(memberPlan => ({
        label: memberPlan.name,
        value: memberPlan.id
      })) || []
    )
  }, [memberPlans])

  return (
    <Grid style={{width: '100%'}}>
      <Row>
        {/* select date range */}
        <Col xs={4}>
          <DateRangePicker
            size="lg"
            value={dateRange}
            onChange={setDateRange}
            format="dd.MM.yyyy"
            placeholder={t('audienceFilter.rangePickerPlaceholder')}
            style={{width: '100%'}}
          />
        </Col>

        <Col xs={4}>
          <TagPicker
            size="lg"
            data={memberPlansForPicker}
            style={{width: '100%'}}
            placeholder={t('audienceFilter.filterSubscriptionPlans')}
          />
        </Col>

        {/* filter data */}
        <Col xs={16}>
          <Panel header="Daten filtern" bordered>
            <Row>
              {Object.keys(activeFilters).map(filterKey => (
                <Col xs={12}>
                  <AudienceFilterToggle
                    filterKey={filterKey as keyof ActiveAudienceFilters}
                    activeFilters={activeFilters}
                    setActiveFilters={setActiveFilters}
                  />
                </Col>
              ))}
            </Row>
          </Panel>
        </Col>
      </Row>
    </Grid>
  )
}
