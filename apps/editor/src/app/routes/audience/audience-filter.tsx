import styled from '@emotion/styled'
import {Dispatch, SetStateAction, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {MdInfo} from 'react-icons/md'
import {Col, DateRangePicker, Form as RForm, Grid, Row, Toggle, Tooltip, Whisper} from 'rsuite'
import {DateRange} from 'rsuite/esm/DateRangePicker'

import {ActiveAudienceFilters} from './audience-dashboard'

const {ControlLabel} = RForm

const Label = styled(ControlLabel)`
  padding-left: ${({theme}) => theme.spacing(1)};
`

const Info = styled.div`
  margin-left: ${({theme}) => theme.spacing(1)};
  position: relative;
  display: inline-block;
`

const FilterInfo = ({text}: {text: string}) => (
  <Whisper trigger="hover" speaker={<Tooltip>{text}</Tooltip>} placement="top">
    <Info>
      <MdInfo size={24} />
    </Info>
  </Whisper>
)

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
            <Col xs={8}>
              <Toggle
                checked={activeFilters.totalActiveSubscriptionCount}
                onChange={(totalActiveSubscriptionCount: boolean) =>
                  setActiveFilters({
                    ...activeFilters,
                    totalActiveSubscriptionCount
                  })
                }
              />
              <Label>{t('audienceFilter.totalSubscriptions')}</Label>
              <FilterInfo text={'Test'} />
            </Col>
            <Col xs={8}>
              <Toggle />
              <Label>{t('audienceFilter.totalSubscriptions')}</Label>
            </Col>
            <Col xs={8}>
              <Toggle />
              <Label>{t('audienceFilter.totalSubscriptions')}</Label>
            </Col>
            <Col xs={8}>
              <Toggle />
              <Label>{t('audienceFilter.totalSubscriptions')}</Label>
            </Col>
          </Row>
        </Col>
      </Row>
    </Grid>
  )
}
