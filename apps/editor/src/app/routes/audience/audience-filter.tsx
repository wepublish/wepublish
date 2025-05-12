import {useMemberPlanListQuery} from '@wepublish/editor/api'
import {Dispatch, SetStateAction, useEffect, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Col, DateRangePicker, Grid, Panel, Row, TagPicker} from 'rsuite'

import {AudienceApiFilter, AudienceClientFilter} from './audience-dashboard'
import {AudienceFilterToggle} from './audience-filter-toggle'

export interface AudienceFilterProps {
  clientFilter: AudienceClientFilter
  setClientFilter: Dispatch<SetStateAction<AudienceClientFilter>>
  apiFilter: AudienceApiFilter
  setApiFilter: (data: AudienceApiFilter) => void
}

export function AudienceFilter({
  clientFilter,
  setClientFilter,
  apiFilter,
  setApiFilter
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
    setApiFilter({dateRange: [startDateOfTwoMonthsBefore, endDateOfCurrentMonth]})
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
            value={apiFilter.dateRange}
            onChange={newDateRange => setApiFilter({dateRange: newDateRange})}
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
            onChange={newMemberPlanIds => setApiFilter({memberPlanIds: newMemberPlanIds})}
          />
        </Col>

        {/* filter data */}
        <Col xs={16}>
          <Panel header={t('audienceFilter.panelHeader')} bordered>
            <Row>
              {Object.keys(clientFilter).map(filterKey => (
                <Col xs={12}>
                  <AudienceFilterToggle
                    filterKey={filterKey as keyof AudienceClientFilter}
                    clientFilter={clientFilter}
                    setClientFilter={setClientFilter}
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
