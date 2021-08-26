import React, {useState} from 'react'

import './dateTimePicker.less'

import DatePicker from 'react-datepicker'
import {ControlLabel, Button, ButtonGroup, ButtonToolbar} from 'rsuite'

import {useTranslation} from 'react-i18next'

export interface DateTimePreset {
  label: string
  offset: number
}

export interface KeyboardDateTimePickerProps {
  dateTime: Date | undefined
  label: string
  changeDate(publishDate: any): void

  dateRanges?: DateTimePreset[]
  timeRanges?: DateTimePreset[]
}

export function KeyboardDateTimePicker({
  dateTime,
  label,
  changeDate,
  dateRanges,
  timeRanges
}: KeyboardDateTimePickerProps) {
  const {t} = useTranslation()

  const initialDate = new Date(dateTime ?? new Date())

  const [startDate, setStartDate] = useState<any>(initialDate)

  const dateButtonPresets = dateRanges ?? [
    {label: t('dateTimePicker.today'), offset: 0},
    {label: t('dateTimePicker.tomorrow'), offset: 1},
    {label: t('dateTimePicker.nextSaturday'), offset: 6 - new Date().getDay()}
  ]

  const timeButtonPresets = timeRanges ?? [
    {label: t('dateTimePicker.now'), offset: 0},
    {label: t('dateTimePicker.hour', {hour: '5'}), offset: 5},
    {label: t('dateTimePicker.hour', {hour: '14'}), offset: 14}
  ]

  const handleDatePresetButton = (offset: number) => {
    const day = new Date()
    day.setHours(startDate.getHours())
    day.setMinutes(startDate.getMinutes())
    day.setDate(day.getDate() + offset)
    setStartDate(day)
  }

  const handleTimePresetButton = (hour: number) => {
    const day = new Date(startDate)
    if (hour === 0) {
      const now = new Date()
      day.setHours(now.getHours())
      day.setMinutes(now.getMinutes())
      setStartDate(day)
    } else {
      day.setHours(hour, 0, 0)
      setStartDate(day)
    }
  }

  return (
    <>
      <ControlLabel style={{display: 'block', marginTop: '5px'}}>{label}</ControlLabel>
      <DatePicker
        showPopperArrow
        shouldCloseOnSelect={false}
        selected={startDate}
        onChange={value => {
          setStartDate(value)
          changeDate(value)
        }}
        // eslint-disable-next-line i18next/no-literal-string
        dateFormat="dd MMM yyyy, h:mm"
        isClearable
        showTimeSelect>
        <ButtonToolbar>
          <ButtonGroup justified>
            {dateButtonPresets.map((datePreset, i) => (
              <Button key={i} size="xs" onClick={() => handleDatePresetButton(datePreset.offset)}>
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
