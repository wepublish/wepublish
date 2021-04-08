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

  return (
    <Form fluid={true}>
      <FormGroup>
        <ControlLabel>{label}</ControlLabel>
        <DatePicker
          style={{marginRight: 8}}
          placement="auto"
          value={dateTime ? dateTime : undefined}
          cleanable={false}
          format="DD MMM YYYY"
          ranges={
            dateRanges
              ? dateRanges
              : [
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
            if (dateTime && value) {
              dateTime.setFullYear(value?.getFullYear())
              dateTime.setMonth(value?.getMonth())
              dateTime.setDate(value?.getDate())
              changeDate(new Date(dateTime))
            }
          }}
        />
        <DatePicker
          placement="auto"
          format="HH:mm"
          value={dateTime ? dateTime : undefined}
          cleanable={false}
          ranges={
            timeRanges
              ? timeRanges
              : [
                  {
                    label: t('dateTimePicker.now'),
                    value: new Date()
                  },
                  {
                    label: t('dateTimePicker.hour', {hour: '6'}),
                    value: () => {
                      const six = new Date()
                      six.setHours(6, 0, 0)
                      return six
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
            if (dateTime && value) {
              dateTime.setHours(value?.getHours())
              dateTime.setMinutes(value?.getMinutes())
              changeDate(new Date(dateTime))
            }
          }}
        />
      </FormGroup>
    </Form>
  )
}
