import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { EventSpecialRate } from '@wepublish/editor/api';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';

const NONE = 'none';

export function EventSpecialRateField() {
  const { t } = useTranslation();
  const labelId = useId();
  const { control } = useFormContext<EventFormValues>();

  return (
    <Controller
      control={control}
      name="specialRate"
      render={({ field }) => (
        <FormControl>
          <FormLabel id={labelId}>{t('agenda.rates.specialRate')}</FormLabel>
          <RadioGroup
            aria-labelledby={labelId}
            name={field.name}
            value={field.value ?? NONE}
            onChange={(_event, value) =>
              field.onChange(value === NONE ? null : value)
            }
          >
            <FormControlLabel
              value={NONE}
              control={<Radio />}
              label={t('agenda.rates.special.none')}
            />
            {Object.values(EventSpecialRate).map(rate => (
              <FormControlLabel
                key={rate}
                value={rate}
                control={<Radio />}
                label={t(`agenda.rates.special.${rate}`)}
              />
            ))}
          </RadioGroup>
        </FormControl>
      )}
    />
  );
}
