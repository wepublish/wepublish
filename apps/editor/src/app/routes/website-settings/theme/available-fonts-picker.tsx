import { useQuery } from '@apollo/client/react';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { WebsiteSettingsDocument } from '@wepublish/editor/api';
import { forwardRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { fontFamilyName } from './font-family-name';

type AvailableFontsPickerProps = {
  name: string;
  value: string;
  onBlur: () => void;
  onChange: (value: string | '') => void;
  error?: FieldError;
  labelId?: string;
};

export const AvailableFontsPicker = memo(
  forwardRef<HTMLDivElement, AvailableFontsPickerProps>(
    ({ name, value, onChange, onBlur, error, labelId }, ref) => {
      const { t } = useTranslation();
      const { data } = useQuery(WebsiteSettingsDocument);
      const fonts = data?.websiteSettings.fonts ?? [];

      const handleChange = (e: SelectChangeEvent<string>) => {
        if (!e.target.value) {
          onChange('');
        } else {
          onChange(`"${e.target.value}", Helvetica, Arial, sans-serif`);
        }
      };

      const cleanValue = fontFamilyName(value);

      return (
        <>
          {createPortal(
            fonts.map(font => (
              <link
                key={font.name}
                rel="stylesheet"
                href={`https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, '+')}&display=swap`}
              />
            )),
            document.head
          )}
          <Select
            ref={ref}
            name={name}
            labelId={labelId}
            value={cleanValue}
            displayEmpty
            onChange={handleChange}
            onBlur={onBlur}
            error={!!error}
            sx={{ width: '100%', fontFamily: value || 'inherit' }}
            renderValue={selected =>
              selected ?
                <span style={{ fontFamily: selected }}>{selected}</span>
              : <em>{t('websiteSettings.fonts.default')}</em>
            }
          >
            <MenuItem value="">
              <em>{t('websiteSettings.fonts.default')}</em>
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
        </>
      );
    }
  )
);
