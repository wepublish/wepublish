import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DatePicker, useCloseCalendar } from './datePicker';

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

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(1)};
  border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
`;

const Shortcuts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

function DoneButton({ label }: { label: string }) {
  const close = useCloseCalendar();

  return (
    <Button
      size="small"
      variant="contained"
      onClick={close}
    >
      {label}
    </Button>
  );
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
      <Footer>
        <Shortcuts>
          {dateButtonPresets.map(preset => (
            <Button
              key={preset.label}
              size="small"
              variant="text"
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
              onClick={() => handleChange(timeNow())}
            >
              {preset.label}
            </Button>
          ))}
        </Shortcuts>

        <DoneButton label={t('dateTimePicker.done')} />
      </Footer>
    </DatePicker>
  );
}
