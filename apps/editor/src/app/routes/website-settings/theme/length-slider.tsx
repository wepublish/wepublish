/* eslint-disable i18next/no-literal-string */
import { MenuItem, Select, Slider, Stack, TextField } from '@mui/material';
import {
  ChangeEventHandler,
  FocusEventHandler,
  forwardRef,
  ReactNode,
} from 'react';
import { FieldError } from 'react-hook-form';

type CssUnit = 'em' | 'rem' | 'px';
export type UnitConfig = Record<
  CssUnit,
  { min: number; max: number; step: number }
>;

function parseCssLength(
  value: string | number | null | undefined,
  defaultUnit: CssUnit
): { num: number; unit: CssUnit } {
  if (!value) {
    return { num: 0, unit: defaultUnit };
  }

  if (typeof value === 'number') {
    return { num: value, unit: defaultUnit };
  }

  if (value.endsWith('rem')) {
    return { num: parseFloat(value), unit: 'rem' };
  }

  if (value.endsWith('px')) {
    return { num: parseFloat(value), unit: 'px' };
  }

  return { num: parseFloat(value) || 0, unit: 'em' };
}

function convertCssLength(num: number, from: CssUnit, to: CssUnit): number {
  if (from === to) {
    return num;
  }

  if (['em', 'rem'].includes(from) && ['em', 'rem'].includes(to)) {
    return num;
  }

  const px = from === 'px' ? num : num * 16;

  return to === 'px' ? px : px / 16;
}

function formatCssLength(num: number, unit: CssUnit): string {
  const decimals = unit === 'px' ? 1 : 3;
  return `${parseFloat(num.toFixed(decimals))}${unit}`;
}

type CssLengthSliderProps = {
  name: string;
  value?: string;
  defaultUnit: CssUnit;
  unitConfig: UnitConfig;
  helperText?: ReactNode;
  onBlur: FocusEventHandler<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: FieldError;
};

export const LengthSlider = forwardRef<HTMLInputElement, CssLengthSliderProps>(
  ({ name, value, defaultUnit, unitConfig, onChange, onBlur, error }, ref) => {
    const { num, unit } = parseCssLength(value, defaultUnit);
    const config = unitConfig[unit];

    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', width: '100%' }}
      >
        <Slider
          name={name}
          value={num}
          onChange={(_, val) => {
            onChange({
              target: { value: formatCssLength(val as number, unit) },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
          min={config.min}
          max={config.max}
          step={config.step}
          color="primary"
          size="small"
          valueLabelDisplay="auto"
          valueLabelFormat={v => `${v}${unit}`}
          marks={[
            { value: config.min, label: `${config.min}${unit}` },
            { value: config.max, label: `${config.max}${unit}` },
          ]}
          sx={{
            '& .MuiSlider-markLabel[data-index="0"]': {
              transform: 'none',
              top: 20,
            },
            '& .MuiSlider-markLabel[data-index="1"]': {
              transform: 'translateX(-100%)',
              top: 20,
            },
          }}
          onBlur={onBlur}
        />

        <TextField
          ref={ref}
          name={`${name}.input`}
          error={!!error}
          value={num}
          size="small"
          type="number"
          sx={{
            width: 130,
            '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button':
              { display: 'none' },
            'input[type=number]': { MozAppearance: 'textfield' },
          }}
          onChange={e => {
            const parsed = parseFloat(e.target.value);

            if (!isNaN(parsed)) {
              onChange({
                target: { value: formatCssLength(parsed, unit) },
              } as React.ChangeEvent<HTMLInputElement>);
            }
          }}
          onBlur={onBlur}
        />

        <Select
          name={`${name}.unit`}
          value={unit}
          size="small"
          onChange={e => {
            const newUnit = e.target.value as CssUnit;
            const converted = convertCssLength(num, unit, newUnit);

            onChange({
              target: { value: formatCssLength(converted, newUnit) },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
          onBlur={onBlur}
          sx={{ width: 100 }}
        >
          <MenuItem value="em">em</MenuItem>
          <MenuItem value="rem">rem</MenuItem>
          <MenuItem value="px">px</MenuItem>
        </Select>
      </Stack>
    );
  }
);
