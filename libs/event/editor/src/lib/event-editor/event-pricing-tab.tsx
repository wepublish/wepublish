import { TextField } from '@mui/material';
import { TICKETING_URL_SCHEMES } from '@wepublish/event/schedule';
import { FormFields } from '@wepublish/ui/editor';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';
import { translateFormError } from '../form-error';
import { EventRatesField } from '../pricing/event-rates-field';
import { EventSpecialRateField } from '../pricing/event-special-rate-field';

export function EventPricingTab() {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();

  return (
    <FormFields>
      <EventRatesField />
      <EventSpecialRateField />

      <Controller
        control={control}
        name="ticketingUrl"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            inputRef={field.ref}
            type="url"
            label={t('agenda.editor.ticketingUrl')}
            error={!!fieldState.error}
            helperText={
              translateFormError(t, fieldState.error?.message) ??
              t('agenda.editor.ticketingUrlHelp', {
                schemes: TICKETING_URL_SCHEMES.join(', '),
              })
            }
            fullWidth
          />
        )}
      />
    </FormFields>
  );
}
