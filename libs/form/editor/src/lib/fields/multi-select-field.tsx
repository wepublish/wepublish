import { Autocomplete, TextField as MuiTextField } from '@mui/material';
import {
  useField,
  type FieldOptionItem,
  type OptionValue,
} from '@wepublish/form/core';
import { useTranslation } from 'react-i18next';

import { fieldAnatomy } from '../field-anatomy';

type MultiSelectValue = readonly OptionValue[] | null | undefined;

const optionKey = (value: OptionValue) => String(value);

const optionText = (option: FieldOptionItem) =>
  typeof option.label === 'string' ? option.label : String(option.value);

const selectedOptions = (
  options: FieldOptionItem[],
  values: readonly OptionValue[]
) =>
  values.map(
    value =>
      options.find(option => option.value === value) ?? {
        value,
        label: String(value),
      }
  );

export function MultiSelectField() {
  const { t } = useTranslation();
  const { ref, ...field } = useField<MultiSelectValue>();
  const anatomy = fieldAnatomy(field);

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      id={field.id}
      options={field.options}
      value={selectedOptions(field.options, field.value ?? [])}
      onChange={(_event, next) =>
        field.onChange(next.map(option => option.value))
      }
      getOptionLabel={optionText}
      getOptionKey={option => optionKey(option.value)}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderOption={({ key, ...props }, option) => (
        <li
          key={key}
          {...props}
        >
          {option.label}
        </li>
      )}
      disabled={field.disabled}
      readOnly={field.readOnly}
      fullWidth
      noOptionsText={t('form.autocomplete.noOptions')}
      clearText={t('form.autocomplete.clear')}
      openText={t('form.autocomplete.open')}
      closeText={t('form.autocomplete.close')}
      renderInput={params => (
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
          inputRef={ref}
          onBlur={field.onBlur}
          slotProps={{
            inputLabel: { ...params.slotProps.inputLabel, required: false },
            input: { ...params.slotProps.input, label: anatomy.notchLabel },
            htmlInput: {
              ...params.slotProps.htmlInput,
              'aria-label': anatomy.ariaLabel,
            },
          }}
        />
      )}
    />
  );
}
