import { CanUpdateOtherOrganizationEvents } from '@wepublish/permissions';
import {
  OrganizationSelectPicker,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';

export function EventOrganizationField({
  isNew,
  viewerCan,
}: {
  isNew: boolean;
  viewerCan?: { moveOrganization: boolean; clearOrganization: boolean } | null;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const mayChooseAny =
    useAuthorisation(CanUpdateOtherOrganizationEvents.id) === true;
  const locked = !isNew && viewerCan?.moveOrganization !== true;
  const keepsOrganization = !isNew && viewerCan?.clearOrganization !== true;

  const helperText =
    viewerCan?.moveOrganization === false ? t('agenda.form.organizationLocked')
    : locked ? undefined
    : keepsOrganization ? t('agenda.form.organizationKeep')
    : mayChooseAny ? t('agenda.form.organizationHelpAll')
    : t('agenda.form.organizationHelpMine');

  return (
    <Controller
      control={control}
      name="organization"
      render={({ field }) => (
        <OrganizationSelectPicker
          name={field.name}
          label={t('agenda.form.organization')}
          mine={!mayChooseAny}
          disabled={locked}
          disableClearable={keepsOrganization}
          helperText={helperText}
          value={field.value}
          onChange={field.onChange}
        />
      )}
    />
  );
}
