import 'react-datepicker/dist/react-datepicker.css';

import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { MdInfo } from 'react-icons/md';
import {
  Button,
  ButtonGroup,
  ButtonToolbar,
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
      <Global
        styles={css`
          .react-datepicker {
            color: darkgray;
            padding: 10px;
            font-family: arial;
            border: none;
            box-shadow: 0 0 5px 0 gray;
            right: -10px;
            min-width: 366px;

            &-popper {
              padding-top: 0;
              z-index: 5;
            }
            &__header {
              background-color: transparent;
              border-bottom: none;
            }
            &__navigation {
              height: 70px;
              width: 66px;
            }
            &__time-container {
              right: -90px;
              border: none;
              box-shadow: 0 0 5px 0 gray;
              margin-bottom: 5px;
              margin-left: 10px;
            }
            &__month-container {
              padding: 5px;
            }
            &__day {
              &-name {
                color: #8e8e99;
              }
              &-names {
                border: none;
              }
              &:not(&--selected):hover {
                background-color: #f2faff;
              }
            }
            &__today-button {
              background-color: transparent;
              color: #216ba5;
              &:hover {
                text-decoration: underline;
              }
            }
            &__current-month,
            &-time__header,
            &-year-header {
              color: #8e8e99;
              font-weight: unset;
            }

            &__close-icon::after {
              padding: unset;
            }

            &__input-container {
              margin-bottom: 10px;
              width: unset;
              input {
                background-color: white;
                outline: none;
                padding: 7px;
                border-radius: 5px;
                border: 1px solid #e5e5ea;
                &:hover,
                &:focus-visible {
                  border: 1px solid #1675e0;
                  transition: border-color 0.3s;
                }
              }
            }
          }

          .react-datepicker__time-container
            .react-datepicker__time
            .react-datepicker__time-box
            ul.react-datepicker__time-list
            li.react-datepicker__time-list-item {
            &:not(&--selected) {
              color: #000;
              &:hover {
                background-color: #f2faff;
              }
            }
          }
        `}
      />
      <Header>
        <Form.ControlLabel>{label}</Form.ControlLabel>
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
        disabled={disabled}
        isClearable
        showPopperArrow
        shouldCloseOnSelect={false}
        selected={dateSelection}
        onChange={value => {
          setDateSelection(value instanceof Date ? value : null);
          changeDate(value instanceof Date ? value : undefined);
        }}
        dateFormat="Pp"
        showTimeSelect
      >
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
      </DatePicker>
    </>
  );
}
