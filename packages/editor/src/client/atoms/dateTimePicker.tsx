import React from 'react'
import {DatePicker, FormGroup, ControlLabel, Form} from 'rsuite'
import {useTranslation} from 'react-i18next'

export interface DateTimeProps {
  dateTime: Date
  label: string
  setNewDate(publishDate: Date): void
}

export function DateTimePicker({dateTime, label, setNewDate}: DateTimeProps) {
  const {t} = useTranslation()

  //const now = new Date()

  const tomorrow = new Date()
  tomorrow.setDate(new Date().getDate() + 1)

  const nextSaturday = new Date()
  const i = 6 - new Date().getDay()
  nextSaturday.setDate(i ? nextSaturday.getDate() + i : nextSaturday.getDate() + 7)

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
              value: tomorrow
            },
            {
              label: t('timeDatePicker.nextSaturday'),
              value: nextSaturday
            }
          ]}
          onChange={value => {
            setNewDate(new Date(Date.parse(value.toDateString() + ' ' + dateTime.toTimeString())))
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
              // TODO Change time
              value: new Date()
            },
            {
              label: t('timeDatePicker.pm', {hour: 2}),
              // TODO Change time
              value: new Date()
            }
          ]}
          onChange={value => {
            setNewDate(new Date(Date.parse(dateTime.toDateString() + ' ' + value.toTimeString())))
          }}
        />
      </FormGroup>
    </Form>
  )
}
