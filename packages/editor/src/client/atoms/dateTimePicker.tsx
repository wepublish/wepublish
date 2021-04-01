import React from 'react'
import {DatePicker, FormGroup, ControlLabel, Form} from 'rsuite'
import {useTranslation} from 'react-i18next'

export interface DateTimeProps {
  dateTime: Date
  label: String
  setNewDate(publishDate: Date): void
}

export function DateTimePicker({dateTime, label, setNewDate}: DateTimeProps) {
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
              label: t('today'),
              value: new Date()
            },
            {
              label: t('tomorrow'),
              // TODO Change date
              value: new Date()
            },
            {
              label: t('nextSaturday'),
              // TODO Change date
              value: new Date()
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
              label: t('now'),
              value: new Date()
            },
            {
              label: t('am', {hour: 6}),
              // TODO Change time
              value: new Date()
            },
            {
              label: t('pm', {hour: 2}),
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
