import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  TextField as MuiTextField,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  useField,
  type FieldOptionItem,
  type FieldPresentation,
  type OptionValue,
} from '@wepublish/form/core';
import type { RefCallBack } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { fieldAnatomy, textFieldProps } from '../field-anatomy';
import { hasText } from './field-group';

export type DiscriminatorControl = 'select' | 'radio';

export type DiscriminatorFieldProps = {
  control?: DiscriminatorControl;
  onClear?: () => void;
};

const RADIO_LIMIT = 3;

type Discriminant = OptionValue | null | undefined;

type ControlProps = {
  field: FieldPresentation;
  inputRef: RefCallBack;
  value: Discriminant;
  options: FieldOptionItem[];
  emptyLabel: string;
  onChange: (next: Discriminant) => void;
  onBlur: () => void;
};

const optionKey = (value: Discriminant) =>
  value === null || value === undefined ? '' : String(value);

const optionAt = (options: FieldOptionItem[], key: string) =>
  options.find(option => optionKey(option.value) === key)?.value ?? null;

function DiscriminatorSelect({
  field,
  inputRef,
  value,
  options,
  emptyLabel,
  onChange,
  onBlur,
}: ControlProps) {
  return (
    <MuiTextField
      {...textFieldProps(field, { select: true })}
      select
      inputRef={inputRef}
      value={optionKey(value)}
      onChange={event => onChange(optionAt(options, event.target.value))}
      onBlur={onBlur}
    >
      {field.required ? null : (
        <MenuItem value="">
          <em>{emptyLabel}</em>
        </MenuItem>
      )}
      {options.map(option => (
        <MenuItem
          key={optionKey(option.value)}
          value={optionKey(option.value)}
        >
          {option.label}
        </MenuItem>
      ))}
    </MuiTextField>
  );
}

function DiscriminatorRadios({
  field,
  inputRef,
  value,
  options,
  emptyLabel,
  onChange,
  onBlur,
}: ControlProps) {
  const anatomy = fieldAnatomy(field);
  const labelId = `${field.id}-label`;
  const selected = optionKey(value);
  const offersEmpty = !field.required;
  const selectedIndex = options.findIndex(
    option => optionKey(option.value) === selected
  );
  const focusIndex =
    selectedIndex === -1 && offersEmpty ? -1 : Math.max(0, selectedIndex);

  return (
    <FormControl
      error={field.invalid}
      disabled={field.disabled}
    >
      {anatomy.label === undefined ? null : (
        <FormLabel
          id={labelId}
          required={false}
        >
          {anatomy.label}
        </FormLabel>
      )}
      <RadioGroup
        row
        name={field.name}
        value={selected}
        aria-labelledby={
          anatomy.label === undefined || anatomy.ariaLabel !== undefined ?
            undefined
          : labelId
        }
        aria-label={anatomy.ariaLabel}
        aria-describedby={anatomy.helperTextId}
        aria-invalid={field.invalid || undefined}
        aria-required={field.required || undefined}
        aria-readonly={field.readOnly || undefined}
        onChange={(_event, next) => onChange(optionAt(options, next))}
        onBlur={onBlur}
      >
        {offersEmpty ?
          <FormControlLabel
            value=""
            label={emptyLabel}
            control={
              <Radio
                id={`${field.id}-empty`}
                readOnly={field.readOnly}
                slotProps={{
                  input: focusIndex === -1 ? { ref: inputRef } : {},
                }}
              />
            }
          />
        : null}
        {options.map((option, index) => (
          <FormControlLabel
            key={optionKey(option.value)}
            value={optionKey(option.value)}
            label={option.label}
            control={
              <Radio
                id={`${field.id}-${optionKey(option.value)}`}
                readOnly={field.readOnly}
                slotProps={{
                  input: index === focusIndex ? { ref: inputRef } : {},
                }}
              />
            }
          />
        ))}
      </RadioGroup>
      {anatomy.helperText === undefined ? null : (
        <FormHelperText id={anatomy.helperTextId}>
          {anatomy.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export function DiscriminatorField({
  control,
  onClear,
}: DiscriminatorFieldProps) {
  const { t } = useTranslation();
  const {
    ref,
    value,
    onChange: change,
    onBlur,
    options,
    ...field
  } = useField<Discriminant>();
  const onChange = (next: Discriminant) => {
    if (next === null && onClear) {
      onClear();
    } else {
      change(next);
    }
  };
  const labelled = {
    ...field,
    label: hasText(field.label) ? field.label : t('form.union.type'),
  };
  const radio =
    (control ?? (options.length <= RADIO_LIMIT ? 'radio' : 'select')) ===
    'radio';
  const emptyLabel = t('form.select.empty');

  return radio ?
      <DiscriminatorRadios
        field={labelled}
        inputRef={ref}
        value={value}
        options={options}
        emptyLabel={emptyLabel}
        onChange={onChange}
        onBlur={onBlur}
      />
    : <DiscriminatorSelect
        field={labelled}
        inputRef={ref}
        value={value}
        options={options}
        emptyLabel={emptyLabel}
        onChange={onChange}
        onBlur={onBlur}
      />;
}
