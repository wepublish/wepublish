import styled from '@emotion/styled';
import { Autocomplete, InputAdornment, TextField } from '@mui/material';
import { fieldComponent, useField } from '@wepublish/form/editor';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';

import { ICON_REGISTRY } from './iconRegistry';

type IconOption = {
  value: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
};

const iconOptions: IconOption[] = Object.entries(ICON_REGISTRY).map(
  ([value, { label, icon }]) => ({ value, label, Icon: icon })
);

const iconsByValue = new Map(iconOptions.map(option => [option.value, option]));

const OptionItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

function IconPicker() {
  const { t } = useTranslation();
  const { ref, ...field } = useField<string | null | undefined>();
  const selected = iconsByValue.get(field.value ?? '') ?? null;
  const helperText = field.invalid ? field.error : field.helperText;

  return (
    <Autocomplete
      id={field.id}
      options={iconOptions}
      value={selected}
      onChange={(_event, option) => field.onChange(option?.value ?? null)}
      getOptionLabel={option => option.label}
      getOptionKey={option => option.value}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      disabled={field.disabled}
      readOnly={field.readOnly}
      noOptionsText={t('form.autocomplete.noOptions')}
      clearText={t('form.autocomplete.clear')}
      openText={t('form.autocomplete.open')}
      closeText={t('form.autocomplete.close')}
      fullWidth
      renderOption={({ key, ...props }, option) => (
        <OptionItem
          key={key}
          {...props}
        >
          <option.Icon size={20} />
          {option.label}
        </OptionItem>
      )}
      renderInput={params => (
        <TextField
          id={params.id}
          disabled={params.disabled}
          fullWidth={params.fullWidth}
          size={params.size}
          name={field.name}
          label={
            field.hideLabel ? undefined : (
              <>
                {field.label}
                {field.required ? '*' : null}
              </>
            )
          }
          helperText={helperText}
          error={field.invalid}
          required={field.required}
          placeholder={field.placeholder}
          inputRef={ref}
          onBlur={field.onBlur}
          slotProps={{
            inputLabel: { ...params.slotProps.inputLabel, required: false },
            input: {
              ...params.slotProps.input,
              startAdornment:
                selected === null ? null : (
                  <InputAdornment
                    position="start"
                    data-icon-preview
                  >
                    <selected.Icon size={20} />
                  </InputAdornment>
                ),
            },
            htmlInput: {
              ...params.slotProps.htmlInput,
              'aria-label':
                field.hideLabel && typeof field.label === 'string' ?
                  field.label
                : undefined,
            },
          }}
        />
      )}
    />
  );
}

export const IconPickerField = fieldComponent<string | null>()(IconPicker);
