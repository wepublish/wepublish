import { TrackingPixelProviderType } from '@wepublish/editor/api';
import { type FormValues, formView } from '@wepublish/form/editor';

import { integrationPaths } from './integrationPaths';
import { trackingPixelSettingSchema } from './trackingPixelIntegration.schema';

type TrackingPixelValues = FormValues<typeof trackingPixelSettingSchema>;

const notProlitteris = ({ type }: TrackingPixelValues) =>
  type !== TrackingPixelProviderType.Prolitteris;

const withPublisherInternalKey = ({
  prolitteris_usePublisherInternalKey,
}: TrackingPixelValues) => !!prolitteris_usePublisherInternalKey;

const withoutPublisherInternalKey = (values: TrackingPixelValues) =>
  !withPublisherInternalKey(values);

export const trackingPixelSettingView = formView(trackingPixelSettingSchema, {
  paths: integrationPaths('tracking-pixel'),
  sections: [
    { fields: ['type', 'name'] },
    {
      hidden: notProlitteris,
      fields: [
        'prolitteris_memberNr',
        'prolitteris_onlyPaidContentAccess',
        'prolitteris_usePublisherInternalKey',
        'prolitteris_publisherInternalKeyDomain',
        'prolitteris_username',
        'prolitteris_password',
      ],
    },
  ],
  fields: {
    type: { disabled: true },
    prolitteris_memberNr: { required: true },
    prolitteris_publisherInternalKeyDomain: {
      required: true,
      hidden: withoutPublisherInternalKey,
    },
    prolitteris_username: { required: true, hidden: withPublisherInternalKey },
    prolitteris_password: {
      hidden: withPublisherInternalKey,
      props: { autoComplete: 'one-time-code' },
    },
  },
});
