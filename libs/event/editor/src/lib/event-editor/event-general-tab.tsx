import { Checkbox, FormControlLabel, MenuItem, TextField } from '@mui/material';
import { EditorEventFragment, EventStatus } from '@wepublish/editor/api';
import {
  characterCount,
  EVENT_PRINT_DESCRIPTION_MAX_LENGTH,
} from '@wepublish/event/schedule';
import { FormFields, FormSectionTitle } from '@wepublish/ui/editor';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';
import { EventAudienceField } from '../facts/event-audience-field';
import { EventOrganizationField } from '../facts/event-organization-field';
import { EventOwnerField } from '../facts/event-owner-field';
import { EventPlaceField } from '../facts/event-place-field';
import { EventTagsField } from '../facts/event-tags-field';
import { translateFormError } from '../form-error';
import { EventImagesField } from '../images/event-images-field';

export function EventGeneralTab({
  event,
}: {
  event: EditorEventFragment | undefined;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const isNew = !event;

  return (
    <FormFields>
      <FormSectionTitle>{t('agenda.editor.sections.content')}</FormSectionTitle>

      <Controller
        control={control}
        name="printDescription"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            inputRef={field.ref}
            label={t('agenda.editor.printDescription')}
            multiline
            minRows={3}
            error={!!fieldState.error}
            helperText={
              translateFormError(t, fieldState.error?.message) ??
              t('agenda.editor.printDescriptionHelp', {
                current: characterCount(field.value),
                max: EVENT_PRINT_DESCRIPTION_MAX_LENGTH,
              })
            }
            fullWidth
          />
        )}
      />

      <EventImagesField />

      <FormSectionTitle>{t('agenda.editor.sections.facts')}</FormSectionTitle>

      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <TextField
            select
            name={field.name}
            inputRef={field.ref}
            label={t('agenda.editor.status')}
            value={field.value}
            onChange={event => field.onChange(event.target.value)}
            onBlur={field.onBlur}
            helperText={t('agenda.editor.statusHelp')}
          >
            {Object.values(EventStatus).map(status => (
              <MenuItem
                key={status}
                value={status}
              >
                {t(`agenda.status.${status}`)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      <EventPlaceField />

      <EventTagsField defaultTags={event?.tags ?? []} />

      <EventAudienceField />

      <EventOrganizationField
        isNew={isNew}
        viewerCan={event?.viewerCan}
      />

      <EventOwnerField
        isNew={isNew}
        viewerCan={event?.viewerCan}
      />

      <Controller
        control={control}
        name="showInPrint"
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                name={field.name}
                slotProps={{ input: { ref: field.ref } }}
                checked={field.value}
                onChange={(_event, checked) => field.onChange(checked)}
              />
            }
            label={t('agenda.editor.showInPrint')}
          />
        )}
      />
    </FormFields>
  );
}
