import React from 'react'
import {DatePicker, FormGroup, ControlLabel, Form} from 'rsuite'
import {useTranslation} from 'react-i18next'

export interface DateTimeProps {
  dateTime?: Date
  label: string
  changeDate(publishDate?: Date): void
}

export function DateTimePicker({dateTime, label, changeDate}: DateTimeProps) {
  const {t} = useTranslation()

  return (
    <Form fluid={true}>
      <FormGroup>
        <ControlLabel>{label}</ControlLabel>
        <DatePicker
          style={{marginRight: 8}}
          placement="auto"
          value={dateTime}
          format="DD MMM YYYY"
          ranges={[
            {
              label: t('timeDatePicker.today'),
              value: new Date()
            },
            {
              label: t('timeDatePicker.tomorrow'),
              value: () => {
                const tomorrow = new Date()
                tomorrow.setDate(new Date().getDate() + 1)
                return tomorrow
              }
            },
            {
              label: t('timeDatePicker.nextSaturday'),
              value: () => {
                const nextSaturday = new Date()
                const i = 6 - new Date().getDay()
                nextSaturday.setDate(i ? nextSaturday.getDate() + i : nextSaturday.getDate() + 7)
                return nextSaturday
              }
            }
          ]}
          onChange={value => {
            if (dateTime) {
              dateTime.setFullYear(value?.getFullYear())
              dateTime.setMonth(value?.getMonth())
              dateTime.setDate(value?.getDate())
              changeDate(new Date(dateTime))
            }
          }}
        />
        <DatePicker
          placement="auto"
          value={dateTime}
          format="HH:mm"
          ranges={[
            {
              label: t('timeDatePicker.now'),
              value: new Date()
            },
            {
              label: t('timeDatePicker.am', {hour: 6}),
              value: () => {
                const six = new Date()
                six.setHours(6, 0, 0)
                return six
              }
            },
            {
              label: t('timeDatePicker.pm', {hour: 2}),
              value: () => {
                const two = new Date()
                two.setHours(14, 0, 0)
                return two
              }
            }
          ]}
          onChange={value => {
            if (dateTime) {
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
