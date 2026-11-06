import {
  type TrackingPixelSettingsQuery,
  type UpdateTrackingPixelSettingMutationVariables,
  TrackingPixelProviderType,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  crossField,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const trackingPixelFields = z.object({
  type: z.enum(TrackingPixelProviderType).meta({
    label: 'integrations.trackingPixelSettings.type',
  }),
  name: z.string().nullish().meta({ label: 'name' }),
  prolitteris_memberNr: z.string().nullish().meta({
    label: 'integrations.trackingPixelSettings.prolitterisMemberNr',
    description: 'integrations.trackingPixelSettings.prolitterisMemberNrInfo',
  }),
  prolitteris_onlyPaidContentAccess: z.boolean().nullish().meta({
    label: 'integrations.trackingPixelSettings.prolitterisOnlyPaidContentAccess',
    description:
      'integrations.trackingPixelSettings.prolitterisOnlyPaidContentAccessInfo',
  }),
  prolitteris_usePublisherInternalKey: z.boolean().nullish().meta({
    label:
      'integrations.trackingPixelSettings.prolitterisUsePublisherInternalKey',
    description:
      'integrations.trackingPixelSettings.prolitterisUsePublisherInternalKeyInfo',
  }),
  prolitteris_publisherInternalKeyDomain: z.string().nullish().meta({
    label:
      'integrations.trackingPixelSettings.prolitterisPublisherInternalKeyDomain',
    description:
      'integrations.trackingPixelSettings.prolitterisPublisherInternalKeyDomainInfo',
  }),
  prolitteris_username: z.string().nullish().meta({
    label: 'integrations.trackingPixelSettings.prolitterisUsername',
    description: 'integrations.trackingPixelSettings.prolitterisLoginInfo',
  }),
  prolitteris_password: formFields.secret().meta({
    label: 'integrations.trackingPixelSettings.prolitterisPassword',
    description: 'integrations.trackingPixelSettings.prolitterisLoginInfo',
  }),
});

type TrackingPixelFields = z.output<typeof trackingPixelFields>;

const isProlitteris = ({ type }: Pick<TrackingPixelFields, 'type'>) =>
  type === TrackingPixelProviderType.Prolitteris;

const required = { error: 'form.errors.required' } as const;

export const trackingPixelSettingSchema = crossField(
  crossField(
    crossField(
      trackingPixelFields,
      ['type', 'prolitteris_memberNr'],
      values => !isProlitteris(values) || !!values.prolitteris_memberNr,
      { path: ['prolitteris_memberNr'], ...required }
    ),
    ['type', 'prolitteris_usePublisherInternalKey', 'prolitteris_username'],
    values =>
      !isProlitteris(values) ||
      !!values.prolitteris_usePublisherInternalKey ||
      !!values.prolitteris_username,
    { path: ['prolitteris_username'], ...required }
  ),
  [
    'type',
    'prolitteris_usePublisherInternalKey',
    'prolitteris_publisherInternalKeyDomain',
  ],
  values =>
    !isProlitteris(values) ||
    !values.prolitteris_usePublisherInternalKey ||
    !!values.prolitteris_publisherInternalKeyDomain,
  { path: ['prolitteris_publisherInternalKeyDomain'], ...required }
);

export type TrackingPixelSetting =
  TrackingPixelSettingsQuery['trackingPixelSettings'][number];

export const fromTrackingPixelSetting = (
  setting: TrackingPixelSetting
): FormDefaultValues<typeof trackingPixelSettingSchema> => setting;

export const toTrackingPixelSettingVariables = (
  id: string,
  { type, ...values }: FormOutput<typeof trackingPixelSettingSchema>
): UpdateTrackingPixelSettingMutationVariables => ({ id, ...values });
