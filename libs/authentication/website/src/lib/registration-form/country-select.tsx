import Box from '@mui/material/Box';

import {
  selectCountryName,
  userCountries,
  userCountriesForLanguage,
} from '@wepublish/user';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { Autocomplete, Divider, InputAdornment } from '@mui/material';
import { ComponentProps, forwardRef } from 'react';
import { ControllerRenderProps } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type CountryOption = {
  code: string;
  label: string;
  value: string;
  suggested: boolean;
};

export const CountrySelect = forwardRef<
  HTMLSelectElement,
  Omit<
    ComponentProps<typeof Autocomplete<CountryOption>>,
    'renderInput' | 'options' | 'value' | 'onChange'
  > & {
    value: string;
    onChange: ControllerRenderProps['onChange'];
    error?: boolean;
    helperText?: string;
  }
>(function CountrySelect(
  { value, onChange, error, helperText, ...props },
  ref
) {
  const {
    elements: { TextField },
    meta: { locale },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const localizedCountries = userCountriesForLanguage(locale.split('-')[0]);

  const countryOptions = Object.entries(userCountries).map(([code, names]) => {
    const localizedNames = localizedCountries[code];

    return {
      code,
      // Only use localized name for label, in most places the german name is required
      label: selectCountryName(localizedNames ?? names),
      value: selectCountryName(names),
      suggested: ['ch', 'de', 'at', 'li', 'fr'].includes(code.toLowerCase()),
    };
  });

  return (
    <Autocomplete
      {...props}
      ref={ref}
      value={countryOptions.find(option => option.value === value) ?? null}
      onChange={(_, value) => {
        onChange(value?.value);
      }}
      options={countryOptions.sort((a, b) =>
        a.suggested ?
          b.suggested ?
            0
          : -1
        : 1
      )}
      autoHighlight
      getOptionLabel={option => option.label}
      renderOption={({ key, ...optionProps }, option) => (
        <Box
          key={key}
          component="li"
          sx={{ img: { mr: 2 } }}
          {...optionProps}
        >
          <img
            loading="lazy"
            width="20"
            srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.webp 2x`}
            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.webp`}
            alt={option.label}
          />

          {option.label}
        </Box>
      )}
      renderInput={params => {
        const option = countryOptions.find(
          ({ label }) => label === params.inputProps.value
        );

        return (
          <TextField
            {...params}
            label={t('user.form.country')}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              startAdornment: !!option && (
                <InputAdornment position="start">
                  <img
                    loading="lazy"
                    width="20"
                    srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.webp 2x`}
                    src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.webp`}
                    alt={option.label}
                  />
                </InputAdornment>
              ),
            }}
            inputProps={{
              ...params.inputProps,
              autoComplete: 'nothing', // disable autocomplete and autofill
            }}
          />
        );
      }}
      groupBy={option => (option.suggested ? t('user.form.suggested') : '')}
      renderGroup={params => (
        <div key={params.key}>
          {params.children}
          {params.group && <Divider />}
        </div>
      )}
    />
  );
});
