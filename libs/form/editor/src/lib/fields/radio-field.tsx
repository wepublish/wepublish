import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  useField,
  type FieldOptionItem,
  type OptionValue,
} from '@wepublish/form/core';

import { fieldAnatomy } from '../field-anatomy';

export type RadioFieldProps = {
  row?: boolean;
};

type RadioValue = OptionValue | null | undefined;

const optionKey = (value: RadioValue) =>
  value === null || value === undefined ? '' : String(value);

const optionAt = (options: FieldOptionItem[], key: string) =>
  options.find(option => optionKey(option.value) === key)?.value ?? null;

export function RadioField({ row = false }: RadioFieldProps) {
  const { ref, ...field } = useField<RadioValue>();
  const anatomy = fieldAnatomy(field);
  const labelId = `${field.id}-label`;
  const selected = optionKey(field.value);
  const focusIndex = Math.max(
    0,
    field.options.findIndex(option => optionKey(option.value) === selected)
  );

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
        name={field.name}
        value={selected}
        row={row}
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
        onChange={(_event, value) =>
          field.onChange(optionAt(field.options, value))
        }
        onBlur={field.onBlur}
      >
        {field.options.map((option, index) => (
          <FormControlLabel
            key={optionKey(option.value)}
            value={optionKey(option.value)}
            label={option.label}
            control={
              <Radio
                id={`${field.id}-${optionKey(option.value)}`}
                readOnly={field.readOnly}
                slotProps={{ input: index === focusIndex ? { ref } : {} }}
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
