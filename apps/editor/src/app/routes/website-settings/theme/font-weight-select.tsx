import { MenuItem, Select } from '@mui/material';
import { forwardRef, memo } from 'react';
import { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const fontWeights = [
  { value: 100, labelKey: 'websiteSettings.theme.typography.fontWeightThin' },
  {
    value: 200,
    labelKey: 'websiteSettings.theme.typography.fontWeightExtraLight',
  },
  { value: 300, labelKey: 'websiteSettings.theme.typography.fontWeightLight' },
  { value: 400, labelKey: 'websiteSettings.theme.typography.fontWeightNormal' },
  { value: 500, labelKey: 'websiteSettings.theme.typography.fontWeightMedium' },
  {
    value: 600,
    labelKey: 'websiteSettings.theme.typography.fontWeightSemiBold',
  },
  { value: 700, labelKey: 'websiteSettings.theme.typography.fontWeightBold' },
  {
    value: 800,
    labelKey: 'websiteSettings.theme.typography.fontWeightExtraBold',
  },
  { value: 900, labelKey: 'websiteSettings.theme.typography.fontWeightBlack' },
] as const;

type FontWeightSelectProps = {
  name: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  error?: FieldError;
};

export const FontWeightSelect = memo(
  forwardRef<HTMLDivElement, FontWeightSelectProps>(
    ({ name, value, onChange, onBlur, error }, ref) => {
      const { t } = useTranslation();

      return (
        <Select
          ref={ref}
          name={name}
          value={value ?? ''}
          size="small"
          displayEmpty
          error={!!error}
          onChange={e => {
            const newValue = e.target.value as number | '';
            onChange(newValue === '' ? null : Number(newValue));
          }}
          onBlur={onBlur}
          sx={{ width: '100%' }}
        >
          <MenuItem value="">
            <em>
              {t('websiteSettings.theme.typography.textTransformDefault')}
            </em>
          </MenuItem>

          {fontWeights.map(({ value: fw, labelKey }) => (
            <MenuItem
              key={fw}
              value={fw}
              sx={{ fontWeight: fw }}
            >
              {t(labelKey)}
            </MenuItem>
          ))}
        </Select>
      );
    }
  )
);
