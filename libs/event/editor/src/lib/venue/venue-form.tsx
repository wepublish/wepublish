import { useQuery } from '@apollo/client/react';
import {
  Alert,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { EventRegionsDocument } from '@wepublish/editor/api';
import { CanUpdateOtherOrganizations } from '@wepublish/permissions';
import {
  OrganizationSelectPicker,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { ReactNode } from 'react';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { translateFormError } from '../form-error';
import { FormColumn, FormLayout, FormSection } from '../form-layout';
import { VenueFormValues } from './venue-form-schema';

type TextFieldName =
  'name' | 'about' | 'address' | 'zip' | 'city' | 'capacity' | 'website';

const ACCESSIBILITY = [
  'wheelchairAccessible',
  'wheelchairAccessibleToilets',
  'wheelchairAccessibleParking',
] as const;

function VenueTextField({
  name,
  disabled,
  multiline,
  required,
  type,
}: {
  name: TextFieldName;
  disabled: boolean;
  multiline?: boolean;
  required?: boolean;
  type?: string;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<VenueFormValues>();

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
            label={t(`agenda.venues.form.${name}`)}
            disabled={disabled}
            required={required}
            multiline={multiline}
            minRows={multiline ? 4 : undefined}
            error={!!error}
            helperText={error}
            fullWidth
          />
        );
      }}
    />
  );
}

export interface VenueFormProps {
  isNew: boolean;
  viewerCan?: { update: boolean } | null;
  aside?: ReactNode;
}

export function VenueForm({ isNew, viewerCan, aside }: VenueFormProps) {
  const { t } = useTranslation();
  const { control } = useFormContext<VenueFormValues>();
  const { errors, submitCount } = useFormState<VenueFormValues>({ control });
  const mayUseAnyOrganization =
    useAuthorisation(CanUpdateOtherOrganizations.id) === true;
  const { data: regionData } = useQuery(EventRegionsDocument);

  const readOnly = !isNew && viewerCan?.update === false;
  const regions = regionData?.eventRegions ?? [];

  return (
    <Stack spacing={2}>
      {readOnly && (
        <Alert severity="info">{t('agenda.venues.form.readOnly')}</Alert>
      )}

      {submitCount > 0 && Object.keys(errors).length > 0 && (
        <Alert severity="warning">{t('agenda.form.invalid')}</Alert>
      )}

      <FormLayout>
        <FormColumn>
          <FormSection title={t('agenda.venues.form.sections.details')}>
            <VenueTextField
              name="name"
              required
              disabled={readOnly}
            />
            <VenueTextField
              name="about"
              multiline
              disabled={readOnly}
            />
            <VenueTextField
              name="capacity"
              disabled={readOnly}
            />
            <VenueTextField
              name="website"
              type="url"
              disabled={readOnly}
            />
          </FormSection>

          <FormSection title={t('agenda.venues.form.sections.address')}>
            <VenueTextField
              name="address"
              required
              disabled={readOnly}
            />
            <VenueTextField
              name="zip"
              required
              disabled={readOnly}
            />
            <VenueTextField
              name="city"
              required
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
                  label={t('agenda.venues.form.region')}
                  value={field.value}
                  disabled={readOnly}
                  onChange={event => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  fullWidth
                >
                  <MenuItem value="">
                    {t('agenda.venues.form.regionNone')}
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

          <FormSection title={t('agenda.venues.form.sections.accessibility')}>
            <FormControl
              component="fieldset"
              disabled={readOnly}
            >
              <FormLabel component="legend">
                {t('agenda.venues.form.accessibility')}
              </FormLabel>
              <FormGroup>
                {ACCESSIBILITY.map(name => (
                  <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <FormControlLabel
                        label={t(`agenda.venues.form.${name}`)}
                        control={
                          <Checkbox
                            name={field.name}
                            checked={field.value}
                            onChange={(_event, checked) =>
                              field.onChange(checked)
                            }
                          />
                        }
                      />
                    )}
                  />
                ))}
              </FormGroup>
              <FormHelperText>
                {t('agenda.venues.form.accessibilityHelp')}
              </FormHelperText>
            </FormControl>
          </FormSection>
        </FormColumn>

        <FormColumn>
          <FormSection title={t('agenda.venues.form.sections.organization')}>
            <Controller
              control={control}
              name="organization"
              render={({ field, fieldState }) => {
                const error = translateFormError(t, fieldState.error?.message);

                return (
                  <OrganizationSelectPicker
                    name={field.name}
                    label={t('agenda.venues.form.organization')}
                    mine={!mayUseAnyOrganization}
                    disabled={readOnly}
                    value={field.value}
                    onChange={organization =>
                      field.onChange(
                        organization ?
                          { id: organization.id, name: organization.name }
                        : null
                      )
                    }
                    error={!!error}
                    helperText={
                      error ??
                      (mayUseAnyOrganization ?
                        t('agenda.venues.form.organizationAnyHelp')
                      : t('agenda.venues.form.organizationMineHelp'))
                    }
                  />
                );
              }}
            />

            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <div>
                  <FormControlLabel
                    label={t('agenda.venues.form.enabled')}
                    control={
                      <Switch
                        name={field.name}
                        checked={field.value}
                        disabled={readOnly}
                        onChange={(_event, checked) => field.onChange(checked)}
                      />
                    }
                  />
                  <FormHelperText>
                    {t('agenda.venues.form.enabledHelp')}
                  </FormHelperText>
                </div>
              )}
            />

            <Controller
              control={control}
              name="private"
              render={({ field }) => (
                <div>
                  <FormControlLabel
                    label={t('agenda.venues.form.private')}
                    control={
                      <Checkbox
                        name={field.name}
                        checked={field.value}
                        disabled={readOnly}
                        onChange={(_event, checked) => field.onChange(checked)}
                      />
                    }
                  />
                  <FormHelperText>
                    {t('agenda.venues.form.privateHelp')}
                  </FormHelperText>
                </div>
              )}
            />
          </FormSection>

          {aside}
        </FormColumn>
      </FormLayout>
    </Stack>
  );
}
