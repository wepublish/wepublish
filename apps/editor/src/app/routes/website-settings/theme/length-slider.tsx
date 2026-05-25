/* eslint-disable i18next/no-literal-string */
import styled from '@emotion/styled';
import {
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Stack,
  TextField,
} from '@mui/material';
import {
  ChangeEvent,
  ChangeEventHandler,
  FocusEventHandler,
  forwardRef,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { FieldError } from 'react-hook-form';

type CssUnit = 'em' | 'rem' | 'px';
export type UnitConfig = Record<
  CssUnit,
  { min: number; max: number; step: number }
>;

const StyledSlider = styled(Slider)`
  & .MuiSlider-markLabel[data-index='0'] {
    transform: none;
    top: 20px;
  }
  & .MuiSlider-markLabel[data-index='1'] {
    transform: translateX(-100%);
    top: 20px;
  }
`;

const StyledTextField = styled(TextField)`
  width: 130px;

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    display: none;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }
`;

const StyledSelect = styled(Select)`
  width: 100px;
`;

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

const stackSx = { alignItems: 'center', width: '100%' };

export const LengthSlider = forwardRef<HTMLInputElement, CssLengthSliderProps>(
  ({ name, value, defaultUnit, unitConfig, onChange, onBlur, error }, ref) => {
    const { num, unit } = useMemo(
      () => parseCssLength(value, defaultUnit),
      [value, defaultUnit]
    );

    const config = unitConfig[unit];

    const marks = useMemo(
      () => [
        { value: config.min, label: `${config.min}${unit}` },
        { value: config.max, label: `${config.max}${unit}` },
      ],
      [config.min, config.max, unit]
    );

    const valueLabelFormat = useCallback((v: number) => `${v}${unit}`, [unit]);

    const handleSliderChange = useCallback(
      (_: Event, val: number | number[]) => {
        onChange({
          target: { value: formatCssLength(val as number, unit) },
        } as ChangeEvent<HTMLInputElement>);
      },
      [onChange, unit]
    );

    const handleTextChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const parsed = parseFloat(e.target.value);

        if (!isNaN(parsed)) {
          onChange({
            target: { value: formatCssLength(parsed, unit) },
          } as ChangeEvent<HTMLInputElement>);
        }
      },
      [onChange, unit]
    );

    const handleUnitChange = useCallback(
      (e: SelectChangeEvent<unknown>) => {
        const newUnit = e.target.value as CssUnit;
        const converted = convertCssLength(num, unit, newUnit);

        onChange({
          target: { value: formatCssLength(converted, newUnit) },
        } as ChangeEvent<HTMLInputElement>);
      },
      [onChange, num, unit]
    );

    return (
      <Stack
        direction="row"
        spacing={1}
        sx={stackSx}
      >
        <StyledSlider
          name={name}
          value={num}
          onChange={handleSliderChange}
          min={config.min}
          max={config.max}
          step={config.step}
          color="primary"
          size="small"
          valueLabelDisplay="auto"
          valueLabelFormat={valueLabelFormat}
          marks={marks}
          onBlur={onBlur}
        />

        <StyledTextField
          ref={ref}
          name={`${name}.input`}
          error={!!error}
          value={num}
          size="small"
          type="number"
          onChange={handleTextChange}
          onBlur={onBlur}
        />

        <StyledSelect
          name={`${name}.unit`}
          value={unit}
          size="small"
          onChange={handleUnitChange}
          onBlur={onBlur}
        >
          <MenuItem value="em">em</MenuItem>
          <MenuItem value="rem">rem</MenuItem>
          <MenuItem value="px">px</MenuItem>
        </StyledSelect>
      </Stack>
    );
  }
);
