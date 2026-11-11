import { InputAdornment, TextField } from '@mui/material';
import { ReactNode, useState } from 'react';

import { useSeededState } from '../hooks/use-seeded-state';

export interface CurrencyInputProps {
  currency: string;
  centAmount: number | null;
  onChange(centAmount: number | null): void;
  disabled?: boolean;
  name: string;
  label?: ReactNode;
  'aria-labelledby'?: string;
}

const toDisplayValue = (value: number | null) =>
  value != null ? (value / 100).toFixed(2) : '';

export function CurrencyInput({
  currency,
  centAmount,
  disabled,
  name,
  label,
  onChange,
  'aria-labelledby': ariaLabelledBy,
}: CurrencyInputProps) {
  const [amount, setAmount] = useState(() => toDisplayValue(centAmount));
  useSeededState(centAmount, cents => setAmount(toDisplayValue(cents)));

  const toFloat = (text: string) =>
    text
      .match(/[\d]*[.,]?[\d]{0,2}/)![0]
      .replace(',', '.')
      .replace(/^\./, '');

  return (
    <TextField
      value={amount}
      name={name}
      label={label}
      disabled={disabled}
      onChange={event => setAmount(toFloat(event.target.value))}
      onBlur={() => onChange(amount ? parseFloat(amount) * 100 : null)}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">{currency}</InputAdornment>
          ),
        },
        htmlInput: { 'aria-labelledby': ariaLabelledBy },
      }}
      fullWidth
    />
  );
}
