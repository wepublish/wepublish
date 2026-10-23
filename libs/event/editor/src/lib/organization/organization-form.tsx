import { useQuery } from '@apollo/client/react';
import {
  Alert,
  Autocomplete,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import {
  EventAffiliationsDocument,
  EventRegionsDocument,
  FullTagFragment,
  TagType,
} from '@wepublish/editor/api';
import { ORGANIZATION_TAGS_MAX } from '@wepublish/event/schedule';
import { CanUpdateOtherOrganizations } from '@wepublish/permissions';
import { SelectTags, useAuthorisation } from '@wepublish/ui/editor';
import { ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { translateFormError } from '../form-error';
import { FormColumn, FormLayout, FormSection } from '../form-layout';
import { OrganizationContactsField } from './organization-contacts-field';
import {
  LEGAL_STATUSES,
  OrganizationFormValues,
} from './organization-form-schema';

type TextFieldName = Exclude<
  keyof OrganizationFormValues,
  | 'tagIds'
  | 'affiliationIds'
  | 'contacts'
  | 'enabled'
  | 'partner'
  | 'legalStatus'
  | 'regionId'
>;

function OrganizationTextField({
  name,
  disabled,
  multiline,
  helperText,
  type,
}: {
  name: TextFieldName;
  disabled: boolean;
  multiline?: boolean;
  helperText?: string;
  type?: string;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<OrganizationFormValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const error = translateFormError(t, fieldState.error?.message);

        return (
          <TextField
            {...field}
            type={type}
            label={t(`agenda.organizations.form.${name}`)}
            disabled={disabled}
            multiline={multiline}
            minRows={multiline ? 4 : undefined}
            error={!!error}
            helperText={error ?? helperText}
            fullWidth
          />
        );
      }}
    />
  );
}

function PrivilegedSwitch({
  name,
  disabled,
  mayChange,
  help,
}: {
  name: 'enabled' | 'partner';
  disabled: boolean;
  mayChange: boolean;
  help: string;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<OrganizationFormValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div>
          <FormControlLabel
            label={t(`agenda.organizations.form.${name}`)}
            control={
              <Switch
                name={field.name}
                checked={field.value}
                disabled={disabled || !mayChange}
                onChange={(_event, checked) => field.onChange(checked)}
              />
            }
          />
          <FormHelperText>
            {mayChange ? help : t('agenda.organizations.form.privilegedLocked')}
          </FormHelperText>
        </div>
      )}
    />
  );
}

export interface OrganizationFormProps {
  isNew: boolean;
  sensitive: boolean;
  defaultTags: Pick<FullTagFragment, 'id' | 'tag'>[];
  viewerCan?: { update: boolean; updatePrivileged: boolean } | null;
  aside?: ReactNode;
}

export function OrganizationForm({
  isNew,
  sensitive,
  defaultTags,
  viewerCan,
  aside,
}: OrganizationFormProps) {
  const { t } = useTranslation();
  const { control } = useFormContext<OrganizationFormValues>();
  const mayUpdateAny =
    useAuthorisation(CanUpdateOtherOrganizations.id) === true;

  const { data: regionData } = useQuery(EventRegionsDocument);
  const { data: affiliationData } = useQuery(EventAffiliationsDocument);

  const readOnly = !isNew && viewerCan?.update === false;
  const mayChangePrivileged =
    isNew ? mayUpdateAny : viewerCan?.updatePrivileged === true;
  const regions = regionData?.eventRegions ?? [];
  const affiliations = affiliationData?.eventAffiliations ?? [];

  return (
    <Stack spacing={2}>
      {readOnly && (
        <Alert severity="info">{t('agenda.organizations.form.readOnly')}</Alert>
      )}

      <FormLayout>
        <FormColumn>
          <FormSection title={t('agenda.organizations.form.sections.details')}>
            <OrganizationTextField
              name="name"
              disabled={readOnly}
            />
            <OrganizationTextField
              name="subTitle"
              disabled={readOnly}
            />
            <OrganizationTextField
              name="about"
              disabled={readOnly}
              multiline
            />
            <OrganizationTextField
              name="website"
              type="url"
              disabled={readOnly}
            />

            <Controller
              control={control}
              name="legalStatus"
              render={({ field }) => (
                <TextField
                  select
                  name={field.name}
                  inputRef={field.ref}
                  label={t('agenda.organizations.form.legalStatus')}
                  value={field.value}
                  disabled={readOnly}
                  onChange={event => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  fullWidth
                >
                  <MenuItem value="">
                    {t('agenda.organizations.form.legalStatusNone')}
                  </MenuItem>
                  {LEGAL_STATUSES.map(status => (
                    <MenuItem
                      key={status}
                      value={status}
                    >
                      {t(`agenda.organizations.legalStatus.${status}`)}
                    </MenuItem>
                  ))}
                  {field.value &&
                    !(LEGAL_STATUSES as readonly string[]).includes(
                      field.value
                    ) && <MenuItem value={field.value}>{field.value}</MenuItem>}
                </TextField>
              )}
            />
          </FormSection>

          <FormSection title={t('agenda.organizations.form.sections.address')}>
            <OrganizationTextField
              name="address"
              disabled={readOnly}
            />
            {(isNew || sensitive) && (
              <OrganizationTextField
                name="postOfficeBox"
                disabled={readOnly}
              />
            )}
            <OrganizationTextField
              name="zip"
              disabled={readOnly}
            />
            <OrganizationTextField
              name="city"
              disabled={readOnly}
            />

            <Controller
              control={control}
              name="regionId"
              render={({ field }) => (
                <TextField
                  select
                  name={field.name}
                  inputRef={field.ref}
                  label={t('agenda.organizations.form.region')}
                  value={field.value}
                  disabled={readOnly}
                  onChange={event => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  fullWidth
                >
                  <MenuItem value="">
                    {t('agenda.organizations.form.regionNone')}
                  </MenuItem>
                  {regions
                    .filter(
                      region =>
                        region.enabled !== false || region.id === field.value
                    )
                    .map(region => (
                      <MenuItem
                        key={region.id}
                        value={region.id}
                      >
                        {region.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
          </FormSection>

          <FormSection
            title={t('agenda.organizations.form.sections.categories')}
          >
            <Controller
              control={control}
              name="tagIds"
              render={({ field, fieldState }) => {
                const error = translateFormError(t, fieldState.error?.message);

                return (
                  <SelectTags
                    name={field.name}
                    tagType={TagType.Event}
                    defaultTags={defaultTags}
                    selectedTags={field.value}
                    setSelectedTags={field.onChange}
                    maxTags={ORGANIZATION_TAGS_MAX}
                    disabled={readOnly}
                    label={t('agenda.organizations.form.tags')}
                    error={!!error}
                    helperText={
                      error ??
                      (field.value.length >= ORGANIZATION_TAGS_MAX ?
                        t('agenda.organizations.form.tagsAtMax', {
                          max: ORGANIZATION_TAGS_MAX,
                        })
                      : t('agenda.organizations.form.tagsHelp', {
                          max: ORGANIZATION_TAGS_MAX,
                        }))
                    }
                  />
                );
              }}
            />

            <Controller
              control={control}
              name="affiliationIds"
              render={({ field }) => (
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  disabled={readOnly}
                  options={affiliations.map(({ id }) => id)}
                  getOptionLabel={id =>
                    affiliations.find(affiliation => affiliation.id === id)
                      ?.name ?? id
                  }
                  value={field.value}
                  onChange={(_event, ids) => field.onChange(ids)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      name={field.name}
                      inputRef={field.ref}
                      label={t('agenda.organizations.form.affiliations')}
                      helperText={t(
                        'agenda.organizations.form.affiliationsHelp'
                      )}
                    />
                  )}
                />
              )}
            />
          </FormSection>

          <FormSection title={t('agenda.organizations.form.sections.contacts')}>
            <OrganizationContactsField disabled={readOnly} />
          </FormSection>
        </FormColumn>

        <FormColumn>
          <FormSection title={t('agenda.organizations.form.sections.status')}>
            <PrivilegedSwitch
              name="enabled"
              disabled={readOnly}
              mayChange={mayChangePrivileged}
              help={t('agenda.organizations.form.enabledHelp')}
            />
            <PrivilegedSwitch
              name="partner"
              disabled={readOnly}
              mayChange={mayChangePrivileged}
              help={t('agenda.organizations.form.partnerHelp')}
            />
          </FormSection>

          {aside}
        </FormColumn>
      </FormLayout>
    </Stack>
  );
}
