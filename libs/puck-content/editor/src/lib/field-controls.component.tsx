import { Switch, Tooltip } from '@mui/material';
import { FieldLabel } from '@puckeditor/core';
import { ComponentProps, KeyboardEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';

import {
  formatSpacingInput,
  parseSpacingInput,
  stepSpacingValue,
} from './box-model/box-model';
import { BoxModelHint } from './box-model/box-model.styles';
import { SpacingValue } from './spacing/spacing';
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
  label?: string;
  describedBy?: string;
};

export const FieldToggleGroup = <Value extends string>({
  name,
  options,
  value,
  onChange,
  readOnly,
  deselectable = false,
  label,
  describedBy,
}: FieldToggleGroupProps<Value>) => (
  <ToggleOptions
    role="radiogroup"
    aria-label={label}
    aria-describedby={describedBy}
  >
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
  max?: number;
  placeholder?: string;
  describedBy?: string;
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
  max,
  placeholder,
  describedBy,
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
        max={max}
        placeholder={placeholder}
        aria-label={label}
        aria-describedby={describedBy}
        value={value ?? ''}
        disabled={readOnly}
        onChange={event => onChange(toNumber(event.currentTarget.value))}
      />

      {unit && <NumberInputUnit>{unit}</NumberInputUnit>}
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
  describedBy?: string;
};

export const FieldSpacingInput = ({
  label,
  icon: Icon,
  value,
  onChange,
  readOnly,
  describedBy,
}: FieldSpacingInputProps) => {
  const [draft, setDraft] = useState<string>();
  const invalid = draft !== undefined && !parseSpacingInput(draft).valid;

  const change = (raw: string) => {
    const result = parseSpacingInput(raw);
    setDraft(raw);

    if (result.valid && result.value !== value) {
      onChange(result.value);
    }
  };

  const step = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }

    event.preventDefault();
    setDraft(undefined);
    onChange(
      stepSpacingValue(
        value,
        (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1)
      )
    );
  };

  return (
    <Tooltip
      title={label}
      disableInteractive
    >
      <NumberInputWrapper>
        <Icon aria-hidden />

        <FieldInput
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={label}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          value={draft ?? formatSpacingInput(value)}
          disabled={readOnly}
          onChange={event => change(event.currentTarget.value)}
          onKeyDown={step}
          onBlur={() => setDraft(undefined)}
        />
      </NumberInputWrapper>
    </Tooltip>
  );
};

export const FieldSpacingHint = ({
  id,
  visible = true,
}: {
  id: string;
  visible?: boolean;
}) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();
  const unit = parseFloat(theme.spacing(1)) || 8;

  return (
    <BoxModelHint
      id={id}
      data-visible={visible}
    >
      {t(
        '',
        'Numbers are theme units (1 = {{unit}}px). Add a unit like px, rem or vh for an exact size. Arrow keys change the value.',
        { unit }
      )}
    </BoxModelHint>
  );
};
