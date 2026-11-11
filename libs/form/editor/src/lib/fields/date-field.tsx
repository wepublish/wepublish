import {
  Box,
  Button,
  InputAdornment,
  TextField as MuiTextField,
} from '@mui/material';
import { useField } from '@wepublish/form/core';
import {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  DatePicker,
  DatePickerDone,
  DatePickerFooter,
  DatePickerShortcuts,
} from '@wepublish/ui/editor';
import { format } from 'date-fns';
import type { FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEvent } from 'react-icons/md';

import { fieldAnatomy, textFieldProps } from '../field-anatomy';

const CALENDAR = '.react-datepicker';

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const dateOrNull = (value: unknown) => (isValidDate(value) ? value : null);

const dateBound = (bound: unknown) =>
  bound instanceof Date ? bound : undefined;

const leavesPicker = (event: FocusEvent<HTMLElement>) => {
  const next = event.relatedTarget;

  return !(
    next instanceof Element &&
    (event.currentTarget.contains(next) || next.closest(CALENDAR) !== null)
  );
};

const shiftedDay = (selected: Date | null, offset: number) => {
  const day = new Date();

  if (selected) {
    day.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  }

  day.setDate(day.getDate() + offset);

  return day;
};

const clockNow = (selected: Date | null) => {
  const day = selected ? new Date(selected) : new Date();
  const now = new Date();

  day.setHours(now.getHours(), now.getMinutes(), 0, 0);

  return day;
};

function DatePickerField({ withTime }: { withTime: boolean }) {
  const { t } = useTranslation();
  const { ref, ...field } = useField<Date | null | undefined>();
  const anatomy = fieldAnatomy(field);
  const value = dateOrNull(field.value);
  const pattern = withTime ? DATE_TIME_FORMAT : DATE_FORMAT;

  const change = (next: Date | null) => {
    if (next === null || isValidDate(next)) {
      field.onChange(next);
    }
  };

  if (field.readOnly) {
    return (
      <MuiTextField
        {...textFieldProps(field, {
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <MdEvent />
              </InputAdornment>
            ),
          },
        })}
        inputRef={ref}
        value={value ? format(value, pattern) : ''}
        onBlur={field.onBlur}
      />
    );
  }

  return (
    <Box
      ref={(element: HTMLDivElement | null) => {
        if (element) {
          ref({ focus: () => element.querySelector('input')?.focus() });
        }
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (leavesPicker(event)) {
          field.onBlur();
        }
      }}
    >
      <DatePicker
        id={field.id}
        name={field.name}
        label={anatomy.label}
        helperText={anatomy.helperText}
        error={field.invalid}
        disabled={field.disabled}
        placeholder={field.placeholder}
        minDate={dateBound(field.info.minimum)}
        maxDate={dateBound(field.info.maximum)}
        withTime={withTime}
        value={value}
        onChange={change}
        clearable
        fullWidth
      >
        {withTime ?
          <DatePickerFooter>
            <DatePickerShortcuts>
              <Button
                size="small"
                variant="text"
                onMouseDown={event => event.preventDefault()}
                onClick={() => change(shiftedDay(value, 0))}
              >
                {t('form.date.today')}
              </Button>
              <Button
                size="small"
                variant="text"
                onMouseDown={event => event.preventDefault()}
                onClick={() => change(shiftedDay(value, 1))}
              >
                {t('form.date.tomorrow')}
              </Button>
              <Button
                size="small"
                variant="text"
                onMouseDown={event => event.preventDefault()}
                onClick={() => change(clockNow(value))}
              >
                {t('form.date.now')}
              </Button>
            </DatePickerShortcuts>
            <DatePickerDone />
          </DatePickerFooter>
        : null}
      </DatePicker>
    </Box>
  );
}

export function DateField() {
  return <DatePickerField withTime={false} />;
}

export function DateTimeField() {
  return <DatePickerField withTime />;
}
