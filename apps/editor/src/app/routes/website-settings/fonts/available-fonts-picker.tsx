import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useWebsiteSettingsQuery } from '@wepublish/editor/api';
import { forwardRef, memo } from 'react';
import { FieldError } from 'react-hook-form';

import fontsData from './all-fonts.json';

const fontFamilyMap = new Map(
  fontsData.items.map(({ family, files: { regular = '' } }) => [
    family,
    { family, regular },
  ])
);

const loadedFonts = new Set<string>();

function loadFont(family: string, url: string) {
  if (loadedFonts.has(family)) {
    return;
  }

  loadedFonts.add(family);

  new FontFace(family, `url(${url})`)
    .load()
    .then(font => document.fonts.add(font));
}

type AvailableFontsPickerProps = {
  name: string;
  value: string;
  onBlur: () => void;
  onChange: (value: string | null) => void;
  error?: FieldError;
};

export const AvailableFontsPicker = memo(
  forwardRef<HTMLDivElement, AvailableFontsPickerProps>(
    ({ name, value, onChange, onBlur, error }, ref) => {
      const { data } = useWebsiteSettingsQuery();
      const fonts = data?.websiteSettings.fonts ?? [];

      for (const font of fonts) {
        const entry = fontFamilyMap.get(font.name);

        if (entry) {
          loadFont(entry.family, entry.regular);
        }
      }

      const handleChange = (e: SelectChangeEvent<string>) => {
        if (!e.target.value) {
          onChange(null);
        } else {
          onChange(`"${e.target.value}, Helvetica, Arial, sans-serif`);
        }
      };

      const cleanValue = value ? value.split(',')[0].replace(/"/g, '') : value;

      return (
        <Select
          ref={ref}
          name={name}
          value={cleanValue}
          size="small"
          displayEmpty
          onChange={handleChange}
          onBlur={onBlur}
          error={!!error}
          sx={{ width: '100%', fontFamily: value || 'inherit' }}
          renderValue={selected =>
            selected ?
              <span style={{ fontFamily: selected }}>{selected}</span>
            : <em>Default</em>
          }
        >
          <MenuItem value="">
            <em>Default</em>
          </MenuItem>

          {fonts.map(font => (
            <MenuItem
              key={font.name}
              value={font.name}
              style={{ fontFamily: font.name }}
            >
              {font.name}
            </MenuItem>
          ))}
        </Select>
      );
    }
  )
);
