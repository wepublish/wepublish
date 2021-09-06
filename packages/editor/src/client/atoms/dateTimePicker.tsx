import React, {useState} from 'react'

import './dateTimePicker.less'

import DatePicker from 'react-datepicker'
import {ControlLabel, Button, ButtonGroup, ButtonToolbar} from 'rsuite'

import {useTranslation} from 'react-i18next'

export interface DateTimePreset {
  label: string
  offset: number
}

export interface DateTimePickerProps {
  dateTime: Date | undefined
  label: string
  changeDate(publishDate: any): void

  dateRanges?: DateTimePreset[]
  timeRanges?: DateTimePreset[]
}

export function DateTimePicker({
  dateTime,
  label,
  changeDate,
  dateRanges,
  timeRanges
}: DateTimePickerProps) {
  const {t} = useTranslation()

  const [dateSelection, setDateSelection] = useState<any>(dateTime ?? new Date())

  const dateButtonPresets = dateRanges ?? [
    {label: t('dateTimePicker.today'), offset: 0},
    {label: t('dateTimePicker.tomorrow'), offset: 1},
    {
      label: t('dateTimePicker.nextMonday'),
      offset: new Date().getDay() === 1 ? 7 : (1 - new Date().getDay() + 7) % 7
    },
    {label: t('dateTimePicker.nextSaturday'), offset: 6 - new Date().getDay()}
  ]

  const timeButtonPresets = timeRanges ?? [
    {label: t('dateTimePicker.now'), offset: 0},
    {label: t('dateTimePicker.hour', {hour: '5'}), offset: 5},
    {label: t('dateTimePicker.hour', {hour: '14'}), offset: 14}
  ]

  const handleDatePresetButton = (offset: number) => {
    const day = new Date()
    day.setHours(dateSelection.getHours())
    day.setMinutes(dateSelection.getMinutes())
    day.setDate(day.getDate() + offset)
    setDateSelection(day)
  }

  const handleTimePresetButton = (hour: number) => {
    const day = new Date(dateSelection)
    if (hour === 0) {
      const now = new Date()
      day.setHours(now.getHours())
      day.setMinutes(now.getMinutes())
      setDateSelection(day)
    } else {
      day.setHours(hour, 0, 0)
      setDateSelection(day)
    }
  }

  return (
    <>
      <ControlLabel style={{display: 'block', marginTop: '5px'}}>{label}</ControlLabel>
      <DatePicker
        showPopperArrow
        shouldCloseOnSelect={false}
        selected={dateSelection}
        onChange={value => {
          setDateSelection(value)
          changeDate(value)
        }}
        // eslint-disable-next-line i18next/no-literal-string
        dateFormat="dd MMM yyyy, h:mm"
        isClearable
        showTimeSelect>
        <ButtonToolbar>
          <ButtonGroup justified>
            {dateButtonPresets.map((datePreset, i) => (
              <Button
                style={{overflow: 'visible'}}
                key={i}
                size="xs"
                onClick={() => handleDatePresetButton(datePreset.offset)}>
                {datePreset.label}
              </Button>
            ))}
          </ButtonGroup>
        </ButtonToolbar>
        <ButtonToolbar>
          <ButtonGroup justified>
            {timeButtonPresets.map((timePreset, i) => (
              <Button key={i} size="xs" onClick={() => handleTimePresetButton(timePreset.offset)}>
                {timePreset.label}
              </Button>
            ))}
          </ButtonGroup>
        </ButtonToolbar>
      </DatePicker>
      <br />
    </>
  )
}
