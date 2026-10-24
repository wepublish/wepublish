import { useQuery } from '@apollo/client/react';
import { MenuItem, TextField } from '@mui/material';
import { EventAudiencesDocument } from '@wepublish/editor/api';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';

const NONE = '';

export function EventAudienceField() {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const { data } = useQuery(EventAudiencesDocument);

  return (
    <Controller
      control={control}
      name="audienceId"
      render={({ field }) => (
        <TextField
          select
          name={field.name}
          inputRef={field.ref}
          label={t('agenda.form.audience')}
          value={field.value ?? NONE}
          onChange={event => field.onChange(event.target.value || null)}
          onBlur={field.onBlur}
        >
          <MenuItem value={NONE}>{t('agenda.form.audienceNone')}</MenuItem>
          {(data?.eventAudiences ?? []).map(audience => (
            <MenuItem
              key={audience.id}
              value={audience.id}
            >
              {audience.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
