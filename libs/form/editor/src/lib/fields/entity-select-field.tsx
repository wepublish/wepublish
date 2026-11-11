import { Autocomplete, TextField as MuiTextField } from '@mui/material';
import { useField } from '@wepublish/form/core';
import { useTranslation } from 'react-i18next';

import { fieldAnatomy } from '../field-anatomy';

export type EntitySelectFieldProps<T extends object = object> = {
  options: readonly T[];
  getOptionLabel: (option: T) => string;
  isOptionEqualToValue?: (option: T, value: T) => boolean;
  loading?: boolean;
};

export type EntityProps<T extends object> = {
  options: readonly T[];
  getOptionLabel: (option: NoInfer<T>) => string;
  isOptionEqualToValue?: (option: NoInfer<T>, value: NoInfer<T>) => boolean;
  loading?: boolean;
};

export const entityProps = <T extends object>(props: EntityProps<T>) =>
  props as unknown as EntitySelectFieldProps;

const sameEntity = (option: object, value: object) =>
  'id' in option && 'id' in value ? option.id === value.id : option === value;

export function EntitySelectField({
  options,
  getOptionLabel,
  isOptionEqualToValue = sameEntity,
  loading = false,
}: EntitySelectFieldProps) {
  const { t } = useTranslation();
  const { ref, ...field } = useField<object | null | undefined>();
  const anatomy = fieldAnatomy(field);

  return (
    <Autocomplete
      id={field.id}
      options={options}
      value={field.value ?? null}
      onChange={(_event, option) => field.onChange(option)}
      getOptionLabel={getOptionLabel}
      getOptionKey={option =>
        'id' in option ? String(option.id) : getOptionLabel(option)
      }
      isOptionEqualToValue={isOptionEqualToValue}
      loading={loading}
      disabled={field.disabled}
      readOnly={field.readOnly}
      forcePopupIcon={field.readOnly ? false : 'auto'}
      noOptionsText={t('form.autocomplete.noOptions')}
      loadingText={t('form.autocomplete.loading')}
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
