import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdInfo } from 'react-icons/md';
import {
  Button,
  ButtonGroup,
  ButtonToolbar,
  DatePicker,
  Form,
  IconButton,
  Popover as RPopover,
  Whisper,
} from 'rsuite';

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

const Popover = styled(RPopover)`
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
          <Whisper
            placement="right"
            trigger="hover"
            controlId="control-id-hover"
            speaker={
              <Popover>
                <p>{helpInfo}</p>
              </Popover>
            }
          >
            <IconButton
              icon={<MdInfo />}
              circle
              size="xs"
            />
          </Whisper>
        : ''}
      </Header>

      <DatePicker
        block
        disabled={disabled}
        cleanable
        format="dd.MM.yyyy HH:mm"
        value={dateSelection}
        onChange={value => {
          setDateSelection(value ?? null);
          changeDate(value ?? undefined);
        }}
        renderExtraFooter={() => (
          <Presets>
            <ButtonToolbar>
              <ButtonGroup justified>
                {dateButtonPresets.map((datePreset, i) => (
                  <PresetsButton
                    key={i}
                    size="xs"
                    onClick={() => handleDatePresetButton(datePreset.offset)}
                  >
                    {datePreset.label}
                  </PresetsButton>
                ))}
              </ButtonGroup>
            </ButtonToolbar>

            <ButtonToolbar>
              <ButtonGroup justified>
                {timeButtonPresets.map((timePreset, i) => (
                  <PresetsButton
                    key={i}
                    size="xs"
                    onClick={() => handleTimePresetButton(timePreset.offset)}
                  >
                    {timePreset.label}
                  </PresetsButton>
                ))}
              </ButtonGroup>
            </ButtonToolbar>
          </Presets>
        )}
      />
    </>
  );
}
