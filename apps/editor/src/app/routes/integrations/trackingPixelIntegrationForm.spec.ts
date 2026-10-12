import { TrackingPixelProviderType } from '@wepublish/editor/api';

import { createTrackingPixelSettingsSchema } from './trackingPixelIntegrationForm';

const schema = createTrackingPixelSettingsSchema(key => key);

const prolitteris = {
  type: TrackingPixelProviderType.Prolitteris,
  name: 'ProLitteris',
  prolitteris_memberNr: '770005',
  prolitteris_username: 'user@example.ch',
  prolitteris_usePublisherInternalKey: null,
  prolitteris_publisherInternalKeyDomain: null,
};

const failingFields = (values: object) => {
  const result = schema.safeParse(values);

  return result.success ? [] : result.error.issues.map(({ path }) => path[0]);
};

describe('trackingPixelSettingsSchema', () => {
  it('accepts a ProLitteris login without re-entering the stored password', () => {
    expect(failingFields(prolitteris)).toEqual([]);
  });

  it('needs the member number, which every ProLitteris pixel is built from', () => {
    expect(failingFields({ ...prolitteris, prolitteris_memberNr: '' })).toEqual(
      ['prolitteris_memberNr']
    );
  });

  it('needs the username when the pixels are fetched from ProLitteris', () => {
    expect(
      failingFields({ ...prolitteris, prolitteris_username: null })
    ).toEqual(['prolitteris_username']);
  });

  it('needs the domain instead of the username for the publisher internal key', () => {
    expect(
      failingFields({
        ...prolitteris,
        prolitteris_username: null,
        prolitteris_usePublisherInternalKey: true,
      })
    ).toEqual(['prolitteris_publisherInternalKeyDomain']);
  });
});
