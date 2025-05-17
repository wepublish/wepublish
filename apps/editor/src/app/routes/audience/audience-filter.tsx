import styled from '@emotion/styled'
import {useMemberPlanListQuery} from '@wepublish/editor/api'
import {Dispatch, SetStateAction, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Col, DateRangePicker, Grid, Panel, Radio, RadioGroup, Row, TagPicker, Toggle} from 'rsuite'
import {RangeType} from 'rsuite/esm/DateRangePicker'

import {AudienceFilterToggle, ToggleLable} from './audience-filter-toggle'
import {
  AudienceApiFilter,
  AudienceClientFilter,
  AudienceComponentFilter,
  preDefinedDates,
  TimeResolution
} from './useAudienceFilter'

const TagPickerStyled = styled(TagPicker)`
  margin-top: ${({theme}) => theme.spacing(2)};
`

const ComponentFilterContainer = styled.div`
  margin-top: ${({theme}) => theme.spacing(2)};
`

const ToggleWithLeftMargin = styled(Toggle)`
  margin-left: ${({theme}) => theme.spacing(2)};
`

export interface AudienceFilterProps {
  resolution: TimeResolution
  setResolution: Dispatch<SetStateAction<TimeResolution>>
  clientFilter: AudienceClientFilter
  setClientFilter: Dispatch<SetStateAction<AudienceClientFilter>>
  apiFilter: AudienceApiFilter
  setApiFilter: (data: AudienceApiFilter) => void
  componentFilter: AudienceComponentFilter
  setComponentFilter: Dispatch<SetStateAction<AudienceComponentFilter>>
}

export function AudienceFilter({
  resolution,
  setResolution,
  clientFilter,
  setClientFilter,
  apiFilter,
  setApiFilter,
  componentFilter,
  setComponentFilter
}: AudienceFilterProps) {
  const {t} = useTranslation()

  // load available subscription plans
  const {data: memberPlans} = useMemberPlanListQuery()

  const memberPlansForPicker = useMemo<{label: string; value: string}[]>(() => {
    return (
      memberPlans?.memberPlans.nodes.map(memberPlan => ({
        label: memberPlan.name,
        value: memberPlan.id
      })) || []
    )
  }, [memberPlans])

  const oneClickDateRanges = useMemo<RangeType[]>(() => {
    const {today, lastWeek, lastMonth, lastQuarter, lastYear} = preDefinedDates()
    return [
      {
        label: t('audienceFilter.rangeLastWeek'),
        value: [lastWeek, today]
      },
      {
        label: t('audienceFilter.rangeLastMonth'),
        value: [lastMonth, today]
      },
      {
        label: t('audienceFilter.rangeLastQuarter'),
        value: [lastQuarter, today]
      },
      {
        label: t('audienceFilter.rangeLastYear'),
        value: [lastYear, today]
      }
    ]
  }, [t])

  return (
    <Grid style={{width: '100%'}}>
      <Row>
        {/* select date range */}
        <Col xs={3}>
          <RadioGroup
            name="aggregation-picker"
            inline
            appearance="picker"
            defaultValue={resolution}
            onChange={newResolution => setResolution(newResolution as TimeResolution)}>
            <Radio value="daily">{t('audienceFilter.daily')}</Radio>
            <Radio value="monthly">{t('audienceFilter.monthly')}</Radio>
          </RadioGroup>
        </Col>

        <Col xs={5}>
          <DateRangePicker
            size="lg"
            value={apiFilter.dateRange}
            onChange={newDateRange => setApiFilter({dateRange: newDateRange})}
            format="dd.MM.yyyy"
            placeholder={t('audienceFilter.rangePickerPlaceholder')}
            style={{width: '100%'}}
            ranges={oneClickDateRanges as RangeType[]}
          />
          <TagPickerStyled
            size="lg"
            data={memberPlansForPicker}
            style={{width: '100%'}}
            placeholder={t('audienceFilter.filterSubscriptionPlans')}
            onChange={newMemberPlanIds => setApiFilter({memberPlanIds: newMemberPlanIds})}
          />

          <ComponentFilterContainer>
            <Toggle
              checked={componentFilter.chart}
              onChange={chart => setComponentFilter({...componentFilter, chart})}
            />{' '}
            <ToggleLable>{t('audienceFilter.chart')}</ToggleLable>
            <ToggleWithLeftMargin
              checked={componentFilter.table}
              onChange={table => setComponentFilter({...componentFilter, table})}
            />{' '}
            <ToggleLable>{t('audienceFilter.table')}</ToggleLable>
          </ComponentFilterContainer>
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
