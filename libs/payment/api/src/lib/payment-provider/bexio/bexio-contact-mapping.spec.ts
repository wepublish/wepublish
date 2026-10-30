import { bexioContactFields } from './bexio-contact-mapping';

const address = {
  company: null,
  streetAddress: 'Musterstrasse',
  streetAddressNumber: '7',
  streetAddress2: null,
  streetAddress2Number: null,
  zipCode: '8000',
  city: 'Zürich',
  country: 'Schweiz',
};

const reader = (
  overrides: Record<string, unknown> = {},
  addressOverrides: Record<string, unknown> | null = {}
) =>
  ({
    id: 'user-1',
    email: 'jane@example.com',
    name: 'Doe',
    firstName: 'Jane',
    address: addressOverrides && { ...address, ...addressOverrides },
    ...overrides,
  }) as any;

describe('bexioContactFields', () => {
  it('maps a person with their address', () => {
    expect(bexioContactFields(reader(), 1)).toEqual({
      name_1: 'Doe',
      name_2: 'Jane',
      contact_type_id: 2,
      mail: 'jane@example.com',
      street_name: 'Musterstrasse',
      house_number: '7',
      address_addition: '',
      postcode: '8000',
      city: 'Zürich',
      country_id: 1,
    });
  });

  it('maps a company under its name', () => {
    const fields = bexioContactFields(reader({}, { company: 'ACME AG' }), 1);

    expect(fields).toMatchObject({
      name_1: 'ACME AG',
      name_2: '',
      contact_type_id: 1,
    });
  });

  it('puts the second street line into the address addition', () => {
    const fields = bexioContactFields(
      reader({}, { streetAddress2: 'Postfach', streetAddress2Number: '12' }),
      1
    );

    expect(fields.address_addition).toBe('Postfach 12');
  });

  it('clears the address of a reader without one', () => {
    expect(bexioContactFields(reader({}, null), 1)).toMatchObject({
      street_name: '',
      house_number: '',
      address_addition: '',
      postcode: '',
      city: '',
      country_id: 1,
    });
  });

  // bexio owns the rest of the contact: groups, phone, second mail, owner.
  it('sends nothing bexio owns', () => {
    const keys = Object.keys(bexioContactFields(reader(), 1));

    expect(keys).not.toContain('contact_group_ids');
    expect(keys).not.toContain('owner_id');
    expect(keys).not.toContain('user_id');
    expect(keys).not.toContain('nr');
  });
});
