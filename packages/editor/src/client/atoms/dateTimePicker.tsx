import React, {useState} from 'react'

import './dateTimePicker.less'

import DatePicker from 'react-datepicker'
import {DatePicker as DT, FormGroup, ControlLabel, Form} from 'rsuite'
import {useTranslation} from 'react-i18next'

export interface DateTimeRange {
  label: string
  value: Date
}

export interface DateTimePickerProps {
  dateTime: Date | undefined
  label: string

  dateRanges?: DateTimeRange[]
  timeRanges?: DateTimeRange[]

  changeDate(publishDate: Date): void
}
// New date picker component
export function KeyboardDateTimePicker({dateTime, label, changeDate}: any) {
  const {t} = useTranslation()
  const date = new Date(dateTime ?? new Date())

  const [startDate, setStartDate] = useState<any>(date)

  return (
    <>
      <p>{label}</p>
      <DatePicker
        selected={startDate}
        onChange={value => {
          setStartDate(value)
          console.log('change value ', value)
          changeDate(value)
        }}
        dateFormat="dd/MM/yyyy h:mm"
        isClearable
        showTimeSelect
        // popperClassName="cal"
        todayButton={t('dateTimePicker.today')}
      />
    </>
  )
}
// Old date picker component - to remove
export function DateTimePicker({
  dateTime,
  label,
  dateRanges,
  timeRanges,
  changeDate
}: DateTimePickerProps) {
  const {t} = useTranslation()

  const date = new Date(dateTime?.getTime() ?? new Date())

  return (
    <Form fluid={true}>
      <FormGroup>
        <ControlLabel>{label}</ControlLabel>
        <DT
          style={{marginRight: 8}}
          placement="auto"
          value={date}
          cleanable={false}
          format="DD MMM YYYY"
          ranges={
            dateRanges ?? [
              {
                label: t('dateTimePicker.today'),
                value: new Date()
              },
              {
                label: t('dateTimePicker.tomorrow'),
                value: () => {
                  const tomorrow = new Date()
                  tomorrow.setDate(new Date().getDate() + 1)
                  return tomorrow
                }
              },
              {
                label: t('dateTimePicker.nextSaturday'),
                value: () => {
                  const nextSaturday = new Date()
                  const remainingDaysInWeek = 6 - new Date().getDay()
                  nextSaturday.setDate(
                    remainingDaysInWeek
                      ? nextSaturday.getDate() + remainingDaysInWeek
                      : nextSaturday.getDate() + 7
                  )
                  return nextSaturday
                }
              }
            ]
          }
          onChange={value => {
            if (date && value) {
              date.setFullYear(value?.getFullYear())
              date.setMonth(value?.getMonth())
              date.setDate(value?.getDate())
              changeDate(new Date(date))
            }
          }}
        />
        <DT
          placement="auto"
          format="HH:mm"
          value={date}
          cleanable={false}
          ranges={
            timeRanges ?? [
              {
                label: t('dateTimePicker.now'),
                value: new Date()
              },
              {
                label: t('dateTimePicker.hour', {hour: '5'}),
                value: () => {
                  const time = new Date()
                  time.setHours(5, 0, 0)
                  return time
                }
              },
              {
                label: t('dateTimePicker.hour', {hour: '14'}),
                value: () => {
                  const two = new Date()
                  two.setHours(14, 0, 0)
                  return two
                }
              }
            ]
          }
          onChange={value => {
            if (date && value) {
              date.setHours(value?.getHours())
              date.setMinutes(value?.getMinutes())
              changeDate(new Date(date))
            }
          }}
        />
      </FormGroup>
    </Form>
  )
}
