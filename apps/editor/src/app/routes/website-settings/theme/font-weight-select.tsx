import { MenuItem, Select } from '@mui/material';
import { forwardRef, memo } from 'react';
import { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const fontWeights = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
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
          onChange={e =>
            onChange(e.target.value === '' ? null : Number(e.target.value))
          }
          onBlur={onBlur}
          sx={{ width: '100%' }}
        >
          <MenuItem value="">
            <em>
              {t('websiteSettings.theme.typography.textTransformDefault')}
            </em>
          </MenuItem>

          {fontWeights.map(({ value: fw, label }) => (
            <MenuItem
              key={fw}
              value={fw}
              sx={{ fontWeight: fw }}
            >
              {label}
            </MenuItem>
          ))}
        </Select>
      );
    }
  )
);
