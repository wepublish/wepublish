import {
  type AutocompleteRenderInputParams,
  TextField as MuiTextField,
} from '@mui/material';
import type { FieldPresentation } from '@wepublish/form/core';
import type { RefCallBack } from 'react-hook-form';

import { fieldAnatomy } from '../field-anatomy';

export type PickerInputField = FieldPresentation & { onBlur: () => void };

export type PickerInputProps = {
  field: PickerInputField;
  inputRef: RefCallBack;
  params: AutocompleteRenderInputParams;
};

export function PickerInput({ field, inputRef, params }: PickerInputProps) {
  const anatomy = fieldAnatomy(field);

  return (
    <MuiTextField
      id={params.id}
      disabled={params.disabled}
      fullWidth={params.fullWidth}
      size={params.size}
      name={field.name}
      label={anatomy.label}
      helperText={anatomy.helperText}
      error={field.invalid}
      required={field.required}
      placeholder={field.placeholder}
      inputRef={inputRef}
      onBlur={field.onBlur}
      slotProps={{
        inputLabel: { ...params.slotProps.inputLabel, required: false },
        input: {
          ...params.slotProps.input,
          label: anatomy.notchLabel,
          ...(field.readOnly ? { endAdornment: null } : {}),
        },
        htmlInput: {
          ...params.slotProps.htmlInput,
          'aria-label': anatomy.ariaLabel,
        },
      }}
    />
  );
}

export const pickerInput =
  (field: PickerInputField, inputRef: RefCallBack) =>
  (params: AutocompleteRenderInputParams) => (
    <PickerInput
      field={field}
      inputRef={inputRef}
      params={params}
    />
  );
