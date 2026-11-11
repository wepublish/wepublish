import styled from '@emotion/styled';
import { Button } from '@mui/material';

import { DateRangePicker, useCloseCalendar } from './datePicker';

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

export interface DateRangePreset {
  label: string;
  value: [Date, Date];
}

export interface DateRangeFilterProps {
  presets?: DateRangePreset[];
  value: DateRange;
  onChange(range: DateRange): void;
  label: string;
  disabled?: boolean;
  disableFuture?: boolean;
  className?: string;
}

const Presets = styled.div`
  display: grid;
  grid-template-columns: repeat(4, max-content);
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1)};
  border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const sameDay = (a: Date | null, b: Date) =>
  a != null && a.getTime() === b.getTime();

function PresetButtons({
  presets,
  value,
  onChange,
}: Required<Pick<DateRangeFilterProps, 'presets' | 'value' | 'onChange'>>) {
  const close = useCloseCalendar();

  return (
    <Presets>
      {presets.map(preset => {
        const active =
          sameDay(value.from, preset.value[0]) &&
          sameDay(value.to, preset.value[1]);

        return (
          <Button
            key={preset.label}
            size="small"
            variant={active ? 'contained' : 'text'}
            aria-pressed={active}
            onClick={() => {
              onChange({ from: preset.value[0], to: preset.value[1] });
              close();
            }}
          >
            {preset.label}
          </Button>
        );
      })}
    </Presets>
  );
}

export function DateRangeFilter({
  value,
  onChange,
  label,
  disabled,
  disableFuture,
  presets,
  className,
}: DateRangeFilterProps) {
  return (
    <DateRangePicker
      className={className}
      label={label}
      from={value.from}
      to={value.to}
      onChange={onChange}
      disabled={disabled}
      disableFuture={disableFuture}
      size="small"
      fullWidth
      clearable
    >
      {presets?.length ?
        <PresetButtons
          presets={presets}
          value={value}
          onChange={onChange}
        />
      : null}
    </DateRangePicker>
  );
}
