import Box from '@mui/material/Box';

import { userCountries, selectCountryName } from '@wepublish/user';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { Autocomplete, Divider, InputAdornment } from '@mui/material';
import { ComponentProps, forwardRef } from 'react';
import { ControllerRenderProps } from 'react-hook-form';

export const countryOptions = Object.entries(userCountries).map(
  ([code, names]) => ({
    code,
    names,
    label: selectCountryName(names),
    suggested: ['ch', 'de', 'at', 'li'].includes(code.toLowerCase()),
  })
);

export const CountrySelect = forwardRef<
  HTMLSelectElement,
  Omit<
    ComponentProps<typeof Autocomplete<(typeof countryOptions)[0]>>,
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
  } = useWebsiteBuilder();

  return (
    <Autocomplete
      {...props}
      ref={ref}
      value={countryOptions.find(({ label }) => label === value) ?? null}
      onChange={(_, value) => onChange(value?.label)}
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
            label="Land"
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
      groupBy={option => (option.suggested ? 'Vorgeschlagen' : '')}
      renderGroup={params => (
        <div key={params.key}>
          {params.children}
          {params.group && <Divider />}
        </div>
      )}
    />
  );
});
