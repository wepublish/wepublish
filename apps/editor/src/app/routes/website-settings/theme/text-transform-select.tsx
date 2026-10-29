import { MenuItem, Select } from '@mui/material';
import { forwardRef, memo } from 'react';
import { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type TextTransformValue = 'capitalize' | 'uppercase' | 'lowercase';

const textTransformValues: TextTransformValue[] = [
  'capitalize',
  'uppercase',
  'lowercase',
];

type TextTransformSelectProps = {
  name: string;
  value: TextTransformValue | null | undefined;
  onChange: (value: TextTransformValue | null) => void;
  onBlur?: () => void;
  error?: FieldError;
  labelId?: string;
};

export const TextTransformSelect = memo(
  forwardRef<HTMLDivElement, TextTransformSelectProps>(
    ({ name, value, onChange, onBlur, error, labelId }, ref) => {
      const { t } = useTranslation();

      return (
        <Select
          ref={ref}
          name={name}
          labelId={labelId}
          value={value ?? ''}
          displayEmpty
          error={!!error}
          onChange={e =>
            onChange((e.target.value as TextTransformValue) || null)
          }
          onBlur={onBlur}
          sx={{ width: '100%' }}
        >
          <MenuItem value="">
            <em>
              {t('websiteSettings.theme.typography.textTransformDefault')}
            </em>
          </MenuItem>

          {textTransformValues.map(v => (
            <MenuItem
              key={v}
              value={v}
              sx={{ textTransform: v }}
            >
              {t(
                `websiteSettings.theme.typography.textTransform${v.charAt(0).toUpperCase()}${v.slice(1)}`
              )}
            </MenuItem>
          ))}
        </Select>
      );
    }
  )
);
