import React from 'react'
import {DatePicker, FormGroup, ControlLabel, Form} from 'rsuite'
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
        <DatePicker
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
        <DatePicker
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
