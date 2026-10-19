import { Button } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DatePicker,
  DatePickerDone,
  DatePickerFooter,
  DatePickerShortcuts,
} from './datePicker';

export interface DateTimePreset {
  label: string;
  offset: number;
}

export interface DateTimePickerProps {
  dateTime: Date | undefined;
  label: string;
  changeDate(publishDate: Date | undefined): void;

  dateRanges?: DateTimePreset[];
  timeRanges?: DateTimePreset[];
  helpInfo?: string;
  disabled?: boolean;
  helperText?: string;
}

export function DateTimePicker({
  dateTime,
  label,
  changeDate,
  dateRanges,
  timeRanges,
  helpInfo,
  disabled,
  helperText,
}: DateTimePickerProps) {
  const { t } = useTranslation();

  const [dateSelection, setDateSelection] = useState<Date | null>(
    dateTime ?? null
  );
  const time = dateTime?.getTime() ?? null;
  const [seededTime, setSeededTime] = useState(time);

  if (time !== seededTime) {
    setSeededTime(time);
    setDateSelection(dateTime ?? null);
  }

  const dateButtonPresets = dateRanges ?? [
    { label: t('dateTimePicker.today'), offset: 0 },
    { label: t('dateTimePicker.tomorrow'), offset: 1 },
  ];

  const dayFor = (offset: number) => {
    const day = new Date();

    if (dateSelection) {
      day.setHours(dateSelection.getHours());
      day.setMinutes(dateSelection.getMinutes());
    }

    day.setDate(day.getDate() + offset);

    return day;
  };

  const timeButtonPresets = timeRanges ?? [
    { label: t('dateTimePicker.now'), offset: 0 },
  ];

  const timeNow = () => {
    const day = dateSelection ? new Date(dateSelection) : new Date();
    const now = new Date();

    day.setHours(now.getHours());
    day.setMinutes(now.getMinutes());

    return day;
  };

  const handleChange = (value: Date | null) => {
    setDateSelection(value);
    changeDate(value ?? undefined);
  };

  return (
    <DatePicker
      withTime
      clearable
      fullWidth
      label={label}
      value={dateSelection}
      onChange={handleChange}
      disabled={disabled}
      error={Boolean(helperText)}
      helperText={helperText ?? helpInfo}
    >
      <DatePickerFooter>
        <DatePickerShortcuts>
          {dateButtonPresets.map(preset => (
            <Button
              key={preset.label}
              size="small"
              variant="text"
              onMouseDown={event => event.preventDefault()}
              onClick={() => handleChange(dayFor(preset.offset))}
            >
              {preset.label}
            </Button>
          ))}

          {timeButtonPresets.map(preset => (
            <Button
              key={preset.label}
              size="small"
              variant="text"
              onMouseDown={event => event.preventDefault()}
              onClick={() => handleChange(timeNow())}
            >
              {preset.label}
            </Button>
          ))}
        </DatePickerShortcuts>

        <DatePickerDone />
      </DatePickerFooter>
    </DatePicker>
  );
}
