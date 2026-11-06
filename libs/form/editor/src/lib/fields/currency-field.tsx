import { InputAdornment, TextField as MuiTextField } from '@mui/material';
import { useField } from '@wepublish/form/core';
import { useState } from 'react';

import { fieldAnatomy, textFieldProps } from '../field-anatomy';

export type CurrencyFieldProps = {
  currency: string;
  scale?: number;
};

const amountText = (raw: string) => raw.match(/\d*[.,]?\d{0,2}/)?.[0] ?? '';

const centsFrom = (text: string, scale: number): number | null => {
  const amount = Number(text.replace(',', '.'));

  return text === '' || Number.isNaN(amount) ?
      null
    : Math.round(amount * 100) / scale;
};

const textFrom = (cents: unknown, scale: number) =>
  typeof cents === 'number' ? ((cents * scale) / 100).toFixed(2) : '';

export function CurrencyField({ currency, scale = 1 }: CurrencyFieldProps) {
  const { ref, ...field } = useField<number | null | undefined>();
  const [draft, setDraft] = useState<string | null>(null);
  const currencyId = `${field.id}-currency`;
  const describedBy = [currencyId, fieldAnatomy(field).helperTextId]
    .filter(id => id !== undefined)
    .join(' ');

  return (
    <MuiTextField
      {...textFieldProps(field, {
        input: {
          endAdornment: (
            <InputAdornment
              position="end"
              id={currencyId}
            >
              {currency}
            </InputAdornment>
          ),
        },
        htmlInput: { inputMode: 'decimal', 'aria-describedby': describedBy },
      })}
      inputRef={ref}
      value={draft ?? textFrom(field.value, scale)}
      onChange={event => {
        const text = amountText(event.target.value);

        setDraft(text);
        field.onChange(centsFrom(text, scale));
      }}
      onBlur={() => {
        setDraft(null);
        field.onBlur();
      }}
    />
  );
}
