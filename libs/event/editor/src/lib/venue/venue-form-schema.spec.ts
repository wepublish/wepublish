import { testPlace } from './test-helpers';
import {
  emptyVenueForm,
  placeVariables,
  venueFormFromPlace,
  venueFormSchema,
} from './venue-form-schema';

const valid = {
  ...emptyVenueForm(),
  name: 'Nuithonie',
  address: 'Rue du Centre 7',
  zip: '1752',
  city: 'Villars-sur-Glâne',
  organization: { id: 'org-1', name: 'Equilibre' },
};

const issues = (values: object, organizationRequired = true) => {
  const result = venueFormSchema({ organizationRequired }).safeParse({
    ...valid,
    ...values,
  });

  return result.success ?
      []
    : result.error.issues.map(({ path, message }) => ({
        path: path.join('.'),
        message,
      }));
};

describe('venueFormSchema', () => {
  it('needs a name of at most 90 characters, an address, a postcode and a city', () => {
    expect(issues({ name: 'x'.repeat(91) })).toEqual([
      { path: 'name', message: 'agenda.venues.errors.nameTooLong' },
    ]);
    expect(issues({ name: ' ', address: '', zip: '', city: '' })).toEqual([
      { path: 'name', message: 'agenda.venues.errors.nameRequired' },
      { path: 'address', message: 'agenda.venues.errors.addressRequired' },
      { path: 'zip', message: 'agenda.venues.errors.zipRequired' },
      { path: 'city', message: 'agenda.venues.errors.cityRequired' },
    ]);
    expect(issues({ zip: '17520' })).toEqual([
      { path: 'zip', message: 'agenda.venues.errors.zipTooLong' },
    ]);
  });

  it('needs an organisation unless the caller may file venues without one', () => {
    expect(issues({ organization: null })).toEqual([
      {
        path: 'organization',
        message: 'agenda.venues.errors.organizationRequired',
      },
    ]);
    expect(issues({ organization: null }, false)).toEqual([]);
  });
});

describe('venueFormFromPlace', () => {
  it('fills the form from the editor view', () => {
    expect(venueFormFromPlace(testPlace())).toEqual({
      name: 'Nuithonie',
      about: 'A theatre',
      address: 'Rue du Centre 7',
      zip: '1752',
      city: 'Villars-sur-Glâne',
      capacity: '500 seats',
      website: 'https://nuithonie.ch',
      regionId: 'region-1',
      organization: { id: 'org-1', name: 'Equilibre' },
      enabled: true,
      private: false,
      wheelchairAccessible: true,
      wheelchairAccessibleParking: false,
      wheelchairAccessibleToilets: true,
    });
  });
});

describe('placeVariables', () => {
  it('trims, sends blanks as null and the organisation as its id', () => {
    expect(
      placeVariables({ ...valid, name: ' Nuithonie ', capacity: '' })
    ).toEqual({
      name: 'Nuithonie',
      about: null,
      address: 'Rue du Centre 7',
      zip: '1752',
      city: 'Villars-sur-Glâne',
      capacity: null,
      website: null,
      regionId: null,
      organizationId: 'org-1',
      enabled: true,
      private: false,
      wheelchairAccessible: false,
      wheelchairAccessibleParking: false,
      wheelchairAccessibleToilets: false,
    });
  });
});
