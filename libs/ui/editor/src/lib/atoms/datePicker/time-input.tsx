import styled from '@emotion/styled';
import { TextField } from '@mui/material';
import { useState } from 'react';

const Field = styled.div`
  .MuiInputBase-root {
    width: 88px;
  }

  input {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }
`;

const COMPLETE = 5;

export function maskTime(input: string): string {
  let digits = input.replace(/\D/g, '').slice(0, 4);

  if (digits.length === 1 && Number(digits) > 2) {
    digits = `0${digits}`;
  }

  if (digits.length > 1 && Number(digits.slice(0, 2)) > 23) {
    digits = `0${digits}`.slice(0, 4);
  }

  const hours = digits.slice(0, 2);
  let minutes = digits.slice(2);

  if (minutes.length && Number(minutes[0]) > 5) {
    minutes = `0${minutes[0]}`;
  }

  return minutes.length ? `${hours}:${minutes}` : hours;
}

export interface CalendarTimeInputProps {
  value?: string;
  onChange?: (time: string) => void;
}

export function CalendarTimeInput({ value, onChange }: CalendarTimeInputProps) {
  const [time, setTime] = useState(value ?? '');
  const [seeded, setSeeded] = useState(value);

  if (value !== seeded) {
    setSeeded(value);
    setTime(value ?? '');
  }

  const handleChange = (input: string) => {
    const masked = maskTime(input);
    setTime(masked);

    if (masked.length === COMPLETE) {
      onChange?.(masked);
    }
  };

  return (
    <Field>
      <TextField
        size="small"
        value={time}
        placeholder="HH:MM"
        onChange={event => handleChange(event.target.value)}
        slotProps={{
          htmlInput: {
            'aria-label': 'time',
            inputMode: 'numeric',
            maxLength: COMPLETE,
          },
        }}
      />
    </Field>
  );
}
