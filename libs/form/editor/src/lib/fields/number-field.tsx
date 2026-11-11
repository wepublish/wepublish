import { InputAdornment, TextField as MuiTextField } from '@mui/material';
import { useField } from '@wepublish/form/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { fieldAnatomy, textFieldProps } from '../field-anatomy';

export type NumberFieldProps = {
  unit?: ReactNode;
};

const numberFrom = (raw: string): number | null => {
  if (raw.trim() === '') {
    return null;
  }

  const parsed = Number(raw);

  return Number.isNaN(parsed) ? null : parsed;
};

const numeric = (bound: unknown) =>
  typeof bound === 'number' ? bound : undefined;

export function NumberField({ unit }: NumberFieldProps) {
  const { t } = useTranslation();
  const { ref, ...field } = useField<number | null | undefined>();
  const unitId = `${field.id}-unit`;
  const hasUnit = unit !== undefined && unit !== null;
  const describedBy = [
    hasUnit ? unitId : undefined,
    fieldAnatomy(field).helperTextId,
  ]
    .filter(id => id !== undefined)
    .join(' ');

  return (
    <MuiTextField
      {...textFieldProps(field, {
        input:
          hasUnit ?
            {
              endAdornment: (
                <InputAdornment
                  position="end"
                  id={unitId}
                >
                  {typeof unit === 'string' ? t(unit) : unit}
                </InputAdornment>
              ),
            }
          : {},
        htmlInput: {
          'aria-describedby': describedBy === '' ? undefined : describedBy,
          min: numeric(field.info.minimum),
          max: numeric(field.info.maximum),
          step: numeric(field.info.multipleOf),
        },
      })}
      type="number"
      inputRef={ref}
      value={field.value ?? ''}
      onChange={event => field.onChange(numberFrom(event.target.value))}
      onBlur={field.onBlur}
    />
  );
}
