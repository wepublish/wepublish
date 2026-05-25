import { Autocomplete, TextField } from '@mui/material';
import {
  FontStyle,
  FontWeight,
  WebsiteRemoteFont,
} from '@wepublish/editor/api';
import { forwardRef, memo, ReactNode } from 'react';
import { FieldError } from 'react-hook-form';

import fontsData from './all-fonts.json';

type FontOption = {
  family: string;
  category: string;
  variants: string[];
  regular: string;
};

const FONTS: FontOption[] = fontsData.items.map(
  ({ family, category, variants, files: { regular = '' } }) => ({
    family,
    category,
    variants,
    regular,
  })
);

const fontFamilyMap = new Map(FONTS.map(f => [f.family, f]));

const weightMap: Record<string, FontWeight> = {
  regular: FontWeight.Regular,
  '100': FontWeight.Thin,
  '200': FontWeight.ExtraLight,
  '300': FontWeight.Light,
  '500': FontWeight.Medium,
  '600': FontWeight.SemiBold,
  '700': FontWeight.Bold,
  '800': FontWeight.ExtraBold,
  '900': FontWeight.Black,
};

function getSupportedWeights(font: FontOption): FontWeight[] {
  const weights = new Set<FontWeight>();

  for (const variant of font.variants) {
    const numericPart = variant.replace('italic', '') || 'regular';
    const weight = weightMap[numericPart];

    if (weight) {
      weights.add(weight);
    }
  }

  return Array.from(weights);
}

function getSupportedStyles(font: FontOption): FontStyle[] {
  const styles = new Set<FontStyle>();

  for (const variant of font.variants) {
    if (variant.includes('italic')) {
      styles.add(FontStyle.Italic);
    }

    if (variant !== 'italic') {
      styles.add(FontStyle.Normal);
    }
  }

  return Array.from(styles);
}

const loadedFonts = new Set<string>();

function loadFont(family: string, menuUrl: string) {
  if (loadedFonts.has(family)) {
    return;
  }

  loadedFonts.add(family);

  new FontFace(family, `url(${menuUrl})`)
    .load()
    .then(font => document.fonts.add(font));
}

type FontPickerProps = {
  name: string;
  helperText?: ReactNode;
  value: string;
  onBlur: () => void;
  onChange: (value: WebsiteRemoteFont | null) => void;
  error?: FieldError;
};

export const FontPicker = memo(
  forwardRef<HTMLInputElement, FontPickerProps>(
    ({ value, onChange, onBlur, error, name }, ref) => {
      const selectedFont = fontFamilyMap.get(value) ?? null;

      if (selectedFont) {
        loadFont(selectedFont.family, selectedFont.regular);
      }

      return (
        <Autocomplete
          options={FONTS}
          getOptionLabel={option => option.family}
          value={selectedFont}
          onChange={(_, newValue) => {
            if (!newValue) {
              onChange(null);
              return;
            }

            onChange({
              name: newValue.family,
              weight: getSupportedWeights(newValue),
              style: getSupportedStyles(newValue),
            });
          }}
          onBlur={onBlur}
          renderOption={({ key, ...optionProps }, option) => {
            return (
              <li
                {...optionProps}
                key={key}
                style={{ fontFamily: option.family }}
                onMouseEnter={() => loadFont(option.family, option.regular)}
              >
                {option.family}
              </li>
            );
          }}
          renderInput={params => (
            <TextField
              {...params}
              name={name}
              size="small"
              inputProps={{
                ...params.inputProps,
                style: {
                  ...params.inputProps?.style,
                  ...(value ? { fontFamily: value } : {}),
                },
              }}
              ref={ref}
              error={!!error}
              helperText={error?.message}
            />
          )}
          sx={{ width: '100%' }}
        />
      );
    }
  )
);
