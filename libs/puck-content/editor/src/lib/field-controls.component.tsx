import { Switch, Tooltip } from '@mui/material';
import { FieldLabel } from '@puckeditor/core';
import { ComponentProps, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';

import {
  fromSpacingParts,
  SpacingUnit,
  SpacingValue,
  toSpacingParts,
} from './spacing/spacing';
import { useWebsiteTheme } from './website-theme';
import {
  FieldInput,
  NativeSelect,
  NumberInputUnit,
  NumberInputWrapper,
  SelectIcon,
  SelectWrapper,
  ToggleableFieldWrapper,
  ToggleOption,
  ToggleOptions,
  UnitSelect,
} from './field-controls';

export const FieldSelect = (props: ComponentProps<typeof NativeSelect>) => (
  <SelectWrapper>
    <NativeSelect {...props} />

    <SelectIcon
      viewBox="0 0 10 6"
      aria-hidden="true"
    >
      <path d="M0 0h10L5 6z" />
    </SelectIcon>
  </SelectWrapper>
);

export type FieldToggleOption<Value extends string> = {
  value: Value;
  label: string;
  icon: ReactNode;
};

export type FieldToggleGroupProps<Value extends string> = {
  name: string;
  options: FieldToggleOption<Value>[];
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  readOnly?: boolean;
  deselectable?: boolean;
};

export const FieldToggleGroup = <Value extends string>({
  name,
  options,
  value,
  onChange,
  readOnly,
  deselectable = false,
}: FieldToggleGroupProps<Value>) => (
  <ToggleOptions role="radiogroup">
    {options.map(option => {
      const active = value === option.value;

      return (
        <Tooltip
          key={option.value}
          title={option.label}
          disableInteractive
        >
          <ToggleOption
            active={active}
            disabled={!!readOnly}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              aria-label={option.label}
              checked={active}
              disabled={readOnly}
              onChange={() => onChange(option.value)}
              onClick={() => deselectable && active && onChange(undefined)}
            />

            {option.icon}
          </ToggleOption>
        </Tooltip>
      );
    })}
  </ToggleOptions>
);

export type FieldNumberInputProps = {
  label: string;
  icon: IconType;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  readOnly?: boolean;
  unit?: string;
  min?: number;
};

const toNumber = (raw: string) => {
  if (raw.trim() === '') {
    return undefined;
  }

  const parsed = Number(raw);

  return Number.isNaN(parsed) ? undefined : parsed;
};

export const FieldNumberInput = ({
  label,
  icon: Icon,
  value,
  onChange,
  readOnly,
  unit = 'px',
  min = 0,
}: FieldNumberInputProps) => (
  <Tooltip
    title={label}
    disableInteractive
  >
    <NumberInputWrapper>
      <Icon aria-hidden />

      <FieldInput
        type="number"
        inputMode="numeric"
        min={min}
        aria-label={label}
        value={value ?? ''}
        disabled={readOnly}
        onChange={event => onChange(toNumber(event.currentTarget.value))}
      />

      <NumberInputUnit>{unit}</NumberInputUnit>
    </NumberInputWrapper>
  </Tooltip>
);

export type ToggleableFieldProps<Value> = {
  label: string;
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  readOnly?: boolean;
  children: ReactNode;
};

export const ToggleableField = <Value,>({
  label,
  value,
  onChange,
  readOnly,
  children,
}: ToggleableFieldProps<Value>) => {
  const [enabled, setEnabled] = useState(value !== undefined);

  const toggle = (next: boolean) => {
    setEnabled(next);

    if (!next) {
      onChange(undefined);
    }
  };

  return (
    <ToggleableFieldWrapper>
      <Switch
        size="small"
        checked={enabled}
        disabled={readOnly}
        onChange={(_event, checked) => toggle(checked)}
        slotProps={{ input: { 'aria-label': label } }}
      />

      <FieldLabel
        label={label}
        readOnly={readOnly}
        el="div"
      >
        {enabled && children}
      </FieldLabel>
    </ToggleableFieldWrapper>
  );
};

export type FieldSpacingInputProps = {
  label: string;
  icon: IconType;
  value: SpacingValue | undefined;
  onChange: (value: SpacingValue | undefined) => void;
  readOnly?: boolean;
};

export const FieldSpacingInput = ({
  label,
  icon: Icon,
  value,
  onChange,
  readOnly,
}: FieldSpacingInputProps) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();
  const parts = toSpacingParts(value);
  const [unit, setUnit] = useState<SpacingUnit>(parts.unit);
  const unitPx = parseFloat(theme.spacing(1)) || 8;

  const changeUnit = (next: SpacingUnit) => {
    setUnit(next);

    if (parts.amount === undefined || next === parts.unit) {
      return;
    }

    const amount =
      next === 'px' ? parts.amount * unitPx : parts.amount / unitPx;

    onChange(fromSpacingParts(Math.round(amount * 100) / 100, next));
  };

  return (
    <Tooltip
      title={label}
      disableInteractive
    >
      <NumberInputWrapper>
        <Icon aria-hidden />

        <FieldInput
          type="number"
          inputMode="decimal"
          min={0}
          step={unit === 'px' ? 1 : 0.5}
          aria-label={label}
          value={parts.amount ?? ''}
          disabled={readOnly}
          onChange={event =>
            onChange(
              fromSpacingParts(toNumber(event.currentTarget.value), unit)
            )
          }
        />

        <UnitSelect
          aria-label={t('', 'Unit')}
          value={unit}
          disabled={readOnly}
          onChange={event =>
            changeUnit(event.currentTarget.value as SpacingUnit)
          }
        >
          <option value="spacing">{t('', 'units')}</option>
          <option value="px">px</option>
        </UnitSelect>
      </NumberInputWrapper>
    </Tooltip>
  );
};
