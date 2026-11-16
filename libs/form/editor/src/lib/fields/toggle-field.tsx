import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
} from '@mui/material';
import { useField } from '@wepublish/form/core';

import { fieldAnatomy } from '../field-anatomy';

export type ToggleFieldProps = {
  control: 'switch' | 'checkbox';
};

export function ToggleField({ control }: ToggleFieldProps) {
  const { ref, ...field } = useField<boolean | null | undefined>();
  const anatomy = fieldAnatomy(field);
  const input = {
    ref,
    'aria-label': anatomy.ariaLabel,
    'aria-describedby': anatomy.helperTextId,
    'aria-invalid': field.invalid || undefined,
    required: field.required,
  };
  const toggle =
    control === 'switch' ?
      <Switch
        id={field.id}
        name={field.name}
        checked={field.value === true}
        readOnly={field.readOnly}
        disabled={field.disabled}
        onChange={(_event, checked) => field.onChange(checked)}
        onBlur={field.onBlur}
        slotProps={{ input }}
      />
    : <Checkbox
        id={field.id}
        name={field.name}
        checked={field.value === true}
        readOnly={field.readOnly}
        disabled={field.disabled}
        onChange={(_event, checked) => field.onChange(checked)}
        onBlur={field.onBlur}
        slotProps={{ input }}
      />;

  return (
    <FormControl
      error={field.invalid}
      disabled={field.disabled}
    >
      {anatomy.label === undefined ?
        toggle
      : <FormControlLabel
          control={toggle}
          label={anatomy.label}
          required={false}
          disabled={field.disabled}
        />
      }
      {anatomy.helperText === undefined ? null : (
        <FormHelperText id={anatomy.helperTextId}>
          {anatomy.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export function SwitchField() {
  return <ToggleField control="switch" />;
}

export function CheckboxField() {
  return <ToggleField control="checkbox" />;
}
