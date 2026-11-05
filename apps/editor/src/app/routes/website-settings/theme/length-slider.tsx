/* eslint-disable i18next/no-literal-string */
import styled from '@emotion/styled';
import {
  FormControl,
  FormHelperText,
  InputAdornment,
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
  FocusEvent,
  FocusEventHandler,
  forwardRef,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react';
import { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type CssUnit = 'em' | 'rem' | 'px';
export type UnitConfig = Record<
  CssUnit,
  { min: number; max: number; step: number }
>;

const StyledTextField = styled(TextField)`
  width: 136px;
  flex-shrink: 0;

  .MuiInputBase-root {
    padding-right: 6px;
  }
`;

const unitSelectSx = {
  fontSize: '0.875rem',
  color: 'text.secondary',
  '& .MuiSelect-select': { py: 0, pl: 0.5 },
  '& .MuiSelect-select:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
    borderRadius: 1,
  },
};

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

function roundCssLength(num: number, unit: CssUnit): number {
  const decimals = unit === 'px' ? 1 : 3;

  return parseFloat(num.toFixed(decimals));
}

function formatCssLength(num: number, unit: CssUnit): string {
  return `${roundCssLength(num, unit)}${unit}`;
}

function clamp(num: number, { min, max }: { min: number; max: number }) {
  return Math.min(max, Math.max(min, num));
}

function parseDraft(draft: string | null) {
  const trimmed = draft?.trim().replace(',', '.');

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : undefined;
}

type CssLengthSliderProps = {
  name: string;
  value?: string | null;
  defaultUnit: CssUnit;
  unitConfig: UnitConfig;
  helperText?: ReactNode;
  onBlur: FocusEventHandler<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: FieldError;
  disabled?: boolean;
  label?: string;
  unitLabel?: string;
  describedBy?: string;
};

const rootSx = { width: '100%' };
const stackSx = { alignItems: 'center', width: '100%', gap: 2 };
const sliderSx = { flex: 1, minWidth: 0 };

export const LengthSlider = forwardRef<HTMLInputElement, CssLengthSliderProps>(
  (
    {
      name,
      value,
      defaultUnit,
      unitConfig,
      onChange,
      onBlur,
      error,
      disabled,
      label,
      unitLabel,
      describedBy,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const errorId = useId();
    const isEmpty = value == null || value === '';
    const notSet = t('websiteSettings.theme.typography.notSet');
    const { num, unit } = useMemo(
      () => parseCssLength(value, defaultUnit),
      [value, defaultUnit]
    );
    const [draft, setDraft] = useState<string | null>(null);

    const config = unitConfig[unit];
    const shown = roundCssLength(num, unit);
    const errorMessage = error?.message;
    const ariaDescribedBy =
      [describedBy, errorMessage ? errorId : undefined]
        .filter(Boolean)
        .join(' ') || undefined;

    const emit = useCallback(
      (next: string) =>
        onChange({
          target: { value: next },
        } as ChangeEvent<HTMLInputElement>),
      [onChange]
    );

    const valueLabelFormat = useCallback((v: number) => `${v}${unit}`, [unit]);

    const handleSliderChange = useCallback(
      (_: Event, val: number | number[]) => {
        emit(formatCssLength(val as number, unit));
      },
      [emit, unit]
    );

    const handleTextChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setDraft(e.target.value);

        const parsed = parseDraft(e.target.value);

        if (parsed !== undefined) {
          emit(formatCssLength(parsed, unit));
        }
      },
      [emit, unit]
    );

    const handleTextBlur = useCallback(
      (e: FocusEvent<HTMLInputElement>) => {
        const parsed = parseDraft(draft);

        if (parsed !== undefined) {
          const clamped = clamp(roundCssLength(parsed, unit), config);

          if (clamped !== roundCssLength(parsed, unit)) {
            emit(formatCssLength(clamped, unit));
          }
        }

        setDraft(null);
        onBlur(e);
      },
      [config, draft, emit, onBlur, unit]
    );

    const notSetText = useCallback(() => notSet, [notSet]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
          return;
        }

        e.preventDefault();

        const current = parseDraft(draft) ?? num;
        const step = config.step * (e.shiftKey ? 10 : 1);
        const next = clamp(
          roundCssLength(current + (e.key === 'ArrowUp' ? step : -step), unit),
          config
        );

        setDraft(null);
        emit(formatCssLength(next, unit));
      },
      [config, draft, emit, num, unit]
    );

    const handleUnitChange = useCallback(
      (e: SelectChangeEvent<unknown>) => {
        const newUnit = e.target.value as CssUnit;
        const converted = roundCssLength(
          convertCssLength(num, unit, newUnit),
          newUnit
        );

        setDraft(null);
        emit(formatCssLength(clamp(converted, unitConfig[newUnit]), newUnit));
      },
      [emit, num, unit, unitConfig]
    );

    return (
      <Stack
        direction="column"
        sx={rootSx}
      >
        <Stack
          direction="row"
          sx={stackSx}
        >
          <Slider
            name={name}
            value={isEmpty ? config.min : num}
            onChange={handleSliderChange}
            min={config.min}
            max={config.max}
            step={config.step}
            color="primary"
            size="small"
            valueLabelDisplay="auto"
            valueLabelFormat={valueLabelFormat}
            onBlur={onBlur}
            disabled={disabled}
            aria-label={label}
            getAriaValueText={isEmpty ? notSetText : undefined}
            slotProps={{ input: { 'aria-describedby': ariaDescribedBy } }}
            sx={sliderSx}
          />

          <StyledTextField
            inputRef={ref}
            name={`${name}.input`}
            error={!!error}
            value={draft ?? (isEmpty ? '' : String(shown))}
            placeholder={isEmpty ? notSet : undefined}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            disabled={disabled}
            slotProps={{
              htmlInput: {
                role: 'spinbutton',
                inputMode: 'decimal',
                autoComplete: 'off',
                onKeyDown: handleKeyDown,
                'aria-label': label,
                'aria-describedby': ariaDescribedBy,
                'aria-valuenow': isEmpty ? undefined : shown,
                'aria-valuemin': config.min,
                'aria-valuemax': config.max,
                'aria-valuetext': isEmpty ? notSet : `${shown}${unit}`,
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <FormControl
                      variant="standard"
                      size="small"
                      disabled={disabled}
                    >
                      <Select
                        name={`${name}.unit`}
                        value={unit}
                        onChange={handleUnitChange}
                        onBlur={onBlur}
                        disableUnderline
                        inputProps={{ 'aria-label': unitLabel }}
                        sx={unitSelectSx}
                      >
                        <MenuItem value="em">em</MenuItem>
                        <MenuItem value="rem">rem</MenuItem>
                        <MenuItem value="px">px</MenuItem>
                      </Select>
                    </FormControl>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        {errorMessage && (
          <FormHelperText
            id={errorId}
            error
          >
            {errorMessage}
          </FormHelperText>
        )}
      </Stack>
    );
  }
);
