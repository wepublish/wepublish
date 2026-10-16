import styled from '@emotion/styled';
import { MenuItem, TextField } from '@mui/material';

const Fields = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};

  .MuiInputBase-root {
    min-width: 72px;
  }
`;

const Separator = styled.span`
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const MINUTE_STEP = 5;

const pad = (value: number) => String(value).padStart(2, '0');

const HOURS = Array.from({ length: 24 }, (_, hour) => pad(hour));
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) =>
  pad(index * MINUTE_STEP)
);

export interface CalendarTimeInputProps {
  value?: string;
  onChange?: (time: string) => void;
}

export function CalendarTimeInput({ value, onChange }: CalendarTimeInputProps) {
  const [hours = '', minutes = ''] = (value ?? '').split(':');
  const nearestMinute =
    minutes ?
      pad((Math.round(Number(minutes) / MINUTE_STEP) * MINUTE_STEP) % 60)
    : '';

  const report = (nextHours: string, nextMinutes: string) =>
    onChange?.(`${nextHours || '00'}:${nextMinutes || '00'}`);

  return (
    <Fields>
      <TextField
        select
        size="small"
        label={undefined}
        value={HOURS.includes(hours) ? hours : ''}
        onChange={event => report(event.target.value, nearestMinute)}
        slotProps={{ htmlInput: { 'aria-label': 'hours' } }}
      >
        {HOURS.map(hour => (
          <MenuItem
            key={hour}
            value={hour}
          >
            {hour}
          </MenuItem>
        ))}
      </TextField>

      <Separator>:</Separator>

      <TextField
        select
        size="small"
        value={MINUTES.includes(nearestMinute) ? nearestMinute : ''}
        onChange={event => report(hours, event.target.value)}
        slotProps={{ htmlInput: { 'aria-label': 'minutes' } }}
      >
        {MINUTES.map(minute => (
          <MenuItem
            key={minute}
            value={minute}
          >
            {minute}
          </MenuItem>
        ))}
      </TextField>
    </Fields>
  );
}
