import {
  Autocomplete,
  MenuItem,
  TextField as MuiTextField,
} from '@mui/material';
import {
  useField,
  type FieldOptionItem,
  type OptionValue,
} from '@wepublish/form/core';
import { useTranslation } from 'react-i18next';

import { fieldAnatomy, textFieldProps } from '../field-anatomy';

export type SelectFieldProps = {
  searchable?: boolean;
};

type SelectValue = OptionValue | null | undefined;

const optionKey = (value: SelectValue) =>
  value === null || value === undefined ? '' : String(value);

const optionAt = (options: FieldOptionItem[], key: string) =>
  options.find(option => optionKey(option.value) === key)?.value ?? null;

const optionText = (option: FieldOptionItem) =>
  typeof option.label === 'string' ? option.label : String(option.value);

function MenuSelect() {
  const { t } = useTranslation();
  const { ref, ...field } = useField<SelectValue>();

  return (
    <MuiTextField
      {...textFieldProps(field, { select: true })}
      select
      inputRef={ref}
      value={optionKey(field.value)}
      onChange={event =>
        field.onChange(optionAt(field.options, event.target.value))
      }
      onBlur={field.onBlur}
    >
      {field.required ? null : (
        <MenuItem value="">
          <em>{t('form.select.empty')}</em>
        </MenuItem>
      )}
      {field.options.map(option => (
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

function SearchableSelect() {
  const { t } = useTranslation();
  const { ref, ...field } = useField<SelectValue>();
  const anatomy = fieldAnatomy(field);
  const selected =
    field.options.find(option => option.value === field.value) ?? null;

  return (
    <Autocomplete
      id={field.id}
      options={field.options}
      value={selected}
      onChange={(_event, option) => field.onChange(option?.value ?? null)}
      getOptionLabel={optionText}
      getOptionKey={option => optionKey(option.value)}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      disabled={field.disabled}
      readOnly={field.readOnly}
      noOptionsText={t('form.autocomplete.noOptions')}
      clearText={t('form.autocomplete.clear')}
      openText={t('form.autocomplete.open')}
      closeText={t('form.autocomplete.close')}
      fullWidth
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

export function SelectField({ searchable = false }: SelectFieldProps) {
  return searchable ? <SearchableSelect /> : <MenuSelect />;
}
