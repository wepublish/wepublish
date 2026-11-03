import { Autocomplete, TextField } from '@mui/material';
import { fieldComponent, useField } from '@wepublish/form/editor';
import { type HTMLAttributes, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type GoogleFont,
  googleFont,
  googleFonts,
  loadGoogleFont,
} from './google-fonts';

type FontOptionProps = {
  optionProps: HTMLAttributes<HTMLLIElement>;
  font: GoogleFont;
};

function FontOption({ optionProps, font }: FontOptionProps) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (element === null) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadGoogleFont(font.family);
        observer.disconnect();
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [font.family]);

  return (
    <li
      {...optionProps}
      ref={ref}
      style={{ fontFamily: font.family }}
    >
      {font.family}
    </li>
  );
}

function FontPicker() {
  const { t } = useTranslation();
  const { ref, ...field } = useField<string | null | undefined>();
  const family = field.value ?? '';
  const listed = googleFont(family);
  const selected = listed ?? (family === '' ? null : { family, variants: [] });
  const options =
    listed === undefined && selected !== null ?
      [selected, ...googleFonts]
    : googleFonts;
  const helperText = field.invalid ? field.error : field.helperText;

  useEffect(() => {
    if (listed !== undefined) {
      loadGoogleFont(listed.family);
    }
  }, [listed]);

  return (
    <Autocomplete
      id={field.id}
      options={options}
      value={selected}
      onChange={(_event, option) => field.onChange(option?.family ?? null)}
      getOptionLabel={option => option.family}
      getOptionKey={option => option.family}
      isOptionEqualToValue={(option, value) => option.family === value.family}
      disabled={field.disabled}
      readOnly={field.readOnly}
      noOptionsText={t('form.autocomplete.noOptions')}
      clearText={t('form.autocomplete.clear')}
      openText={t('form.autocomplete.open')}
      closeText={t('form.autocomplete.close')}
      fullWidth
      renderOption={({ key, ...props }, option) => (
        <FontOption
          key={key}
          optionProps={props}
          font={option}
        />
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
            input: params.slotProps.input,
            htmlInput: {
              ...params.slotProps.htmlInput,
              style: {
                ...params.slotProps.htmlInput?.style,
                fontFamily: family === '' ? undefined : family,
              },
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

export const FontPickerField = fieldComponent<string | null>()(FontPicker);
