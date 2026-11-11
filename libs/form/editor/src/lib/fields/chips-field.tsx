import { Autocomplete, TextField as MuiTextField } from '@mui/material';
import { useField } from '@wepublish/form/core';
import { useTranslation } from 'react-i18next';

import { fieldAnatomy } from '../field-anatomy';

type ChipsValue = readonly string[] | null | undefined;

const NO_SUGGESTIONS: string[] = [];

const isNeverSelected = () => false;

const tidy = (entries: readonly string[]) => [
  ...new Set(entries.map(entry => entry.trim()).filter(entry => entry !== '')),
];

export function ChipsField() {
  const { t } = useTranslation();
  const { ref, ...field } = useField<ChipsValue>();
  const anatomy = fieldAnatomy(field);

  return (
    <Autocomplete
      multiple
      freeSolo
      autoSelect
      forcePopupIcon={false}
      id={field.id}
      options={NO_SUGGESTIONS}
      value={[...(field.value ?? [])]}
      onChange={(_event, next) => field.onChange(tidy(next))}
      isOptionEqualToValue={isNeverSelected}
      disabled={field.disabled}
      readOnly={field.readOnly}
      fullWidth
      clearText={t('form.autocomplete.clear')}
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
