import styled from '@emotion/styled';
import {
  Button,
  ButtonGroup,
  Popover as MuiPopover,
  Stack,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker, Form } from 'rsuite';

import { ClickPopover } from '../popover';
import { InfoTrigger } from './infoTooltip';

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
}

const Header = styled.div`
  margin: 5px auto;
`;

const Popover = styled(MuiPopover)`
  max-width: 300px;
`;

const Presets = styled.div`
  display: grid;
  gap: 3px;
  min-width: 260px;
  padding: 5px 0;
`;

const PresetsButton = styled(Button)`
  white-space: break-spaces;
  padding: 3px;
  margin: 1px;
`;

export function DateTimePicker({
  dateTime,
  label,
  changeDate,
  dateRanges,
  timeRanges,
  helpInfo,
  disabled,
}: DateTimePickerProps) {
  const { t } = useTranslation();

  const [dateSelection, setDateSelection] = useState<Date | null>(
    dateTime ?? null
  );

  useEffect(() => {
    setDateSelection(dateTime ?? null);
  }, [dateTime]);

  const dateButtonPresets = dateRanges ?? [
    { label: t('dateTimePicker.today'), offset: 0 },
    { label: t('dateTimePicker.tomorrow'), offset: 1 },
    {
      label: t('dateTimePicker.nextMonday'),
      offset: new Date().getDay() === 1 ? 7 : (1 - new Date().getDay() + 7) % 7,
    },
    {
      label: t('dateTimePicker.nextSaturday'),
      offset: 6 - new Date().getDay(),
    },
  ];

  const timeButtonPresets = timeRanges ?? [
    { label: t('dateTimePicker.now'), offset: 0 },
    { label: t('dateTimePicker.hour', { hour: '5' }), offset: 5 },
    { label: t('dateTimePicker.hour', { hour: '14' }), offset: 14 },
  ];

  const handleDatePresetButton = (offset: number) => {
    const day = new Date();
    if (dateSelection) {
      day.setHours(dateSelection.getHours());
      day.setMinutes(dateSelection.getMinutes());
    }
    day.setDate(day.getDate() + offset);
    setDateSelection(day);
    changeDate(day);
  };

  const handleChange = (value: Date | null) => {
    setDateSelection(value ?? null);
    changeDate(value ?? undefined);
  };

  const handleTimePresetButton = (hour: number) => {
    const day = dateSelection ? new Date(dateSelection) : new Date();
    if (hour === 0) {
      const now = new Date();
      day.setHours(now.getHours());
      day.setMinutes(now.getMinutes());
      setDateSelection(day);
      changeDate(day);
    } else {
      day.setHours(hour, 0, 0);
      setDateSelection(day);
      changeDate(day);
    }
  };

  return (
    <>
      <Header>
        <Form.Label>{label}</Form.Label>
        {helpInfo ?
          <ClickPopover
            trigger={<InfoTrigger aria-label={helpInfo} />}
            anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
            transformOrigin={{ vertical: 'center', horizontal: 'left' }}
          >
            <p>{helpInfo}</p>
          </ClickPopover>
        : ''}
      </Header>

      <DatePicker
        block
        disabled={disabled}
        cleanable
        format="dd.MM.yyyy HH:mm"
        value={dateSelection}
        onSelect={handleChange}
        onChange={handleChange}
        renderExtraFooter={() => (
          <Presets>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: 'wrap' }}
            >
              <ButtonGroup fullWidth>
                {dateButtonPresets.map((datePreset, i) => (
                  <PresetsButton
                    variant="outlined"
                    key={i}
                    size="small"
                    onClick={() => handleDatePresetButton(datePreset.offset)}
                  >
                    {datePreset.label}
                  </PresetsButton>
                ))}
              </ButtonGroup>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: 'wrap' }}
            >
              <ButtonGroup fullWidth>
                {timeButtonPresets.map((timePreset, i) => (
                  <PresetsButton
                    variant="outlined"
                    key={i}
                    size="small"
                    onClick={() => handleTimePresetButton(timePreset.offset)}
                  >
                    {timePreset.label}
                  </PresetsButton>
                ))}
              </ButtonGroup>
            </Stack>
          </Presets>
        )}
      />
    </>
  );
}
