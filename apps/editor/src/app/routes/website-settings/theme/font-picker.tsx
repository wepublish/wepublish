import { Autocomplete, TextField } from '@mui/material';
import {
  FontStyle,
  FontWeight,
  WebsiteRemoteFont,
} from '@wepublish/editor/api';
import {
  forwardRef,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { FieldError } from 'react-hook-form';

import fontsData from './all-fonts.json';

type FontOption = {
  family: string;
  category: string;
  variants: string[];
};

const FONTS: FontOption[] = fontsData.items.map(
  ({ family, category, variants }) => ({
    family,
    category,
    variants,
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

type FontListItemProps = {
  optionProps: React.HTMLAttributes<HTMLLIElement>;
  optionKey: string;
  option: FontOption;
  onVisible: (family: string) => void;
};

const FontListItem = memo(
  ({ optionProps, optionKey, option, onVisible }: FontListItemProps) => {
    const ref = useRef<HTMLLIElement>(null);

    useEffect(() => {
      const el = ref.current;
      if (!el) {
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            onVisible(option.family);
            observer.disconnect();
          }
        },
        { threshold: 0 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [option.family, onVisible]);

    return (
      <li
        {...optionProps}
        key={optionKey}
        ref={ref}
        style={{ fontFamily: option.family }}
      >
        {option.family}
      </li>
    );
  }
);

type FontPickerProps = {
  name: string;
  helperText?: ReactNode;
  value: string | null | undefined;
  onBlur: () => void;
  onChange: (value: WebsiteRemoteFont | null) => void;
  error?: FieldError;
};

export const FontPicker = memo(
  forwardRef<HTMLInputElement, FontPickerProps>(
    ({ value, onChange, onBlur, error, name }, ref) => {
      const selectedFont = fontFamilyMap.get(value ?? '') ?? null;

      const [fontFamilies, setFontFamilies] = useState(() =>
        Array.from(loadedFonts)
      );

      const loadFont = useCallback((family: string) => {
        if (loadedFonts.has(family)) {
          return;
        }

        loadedFonts.add(family);
        setFontFamilies(Array.from(loadedFonts));
      }, []);

      useEffect(() => {
        if (selectedFont) {
          loadFont(selectedFont.family);
        }
      }, [selectedFont, loadFont]);

      return (
        <>
          {createPortal(
            fontFamilies.map(family => (
              <link
                key={family}
                rel="stylesheet"
                href={`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}&display=swap`}
              />
            )),
            document.head
          )}

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
            renderOption={({ key, ...optionProps }, option) => (
              <FontListItem
                key={key}
                optionKey={key ?? option.family}
                optionProps={optionProps}
                option={option}
                onVisible={loadFont}
              />
            )}
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
        </>
      );
    }
  )
);
