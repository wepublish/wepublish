import {
  emptyOrganizationForm,
  LEGAL_STATUSES,
  organizationFormFromOrganization,
  organizationFormSchema,
  organizationVariables,
} from './organization-form-schema';
import { testOrganization } from './test-helpers';

const contact = (value: Record<string, string>, id = 'c') => ({
  id,
  value: { label: '', email: '', phone: '', ...value },
});

const issues = (values: object) => {
  const result = organizationFormSchema.safeParse({
    ...emptyOrganizationForm(),
    name: 'Equilibre',
    ...values,
  });

  return result.success ?
      []
    : result.error.issues.map(({ path, message }) => ({
        path: path.join('.'),
        message,
      }));
};

describe('organizationFormSchema', () => {
  it('offers the ten legal forms BKa knows', () => {
    expect(LEGAL_STATUSES).toEqual([
      'association',
      'entreprise_individuelle',
      'societe_simple',
      'societe_collectif',
      'societe_commandite',
      'societe_anonyme',
      'societe_responsabilite_limitee',
      'societe_cooperative',
      'fondation',
      'collectif',
    ]);
  });

  it('needs a name of at most 100 characters', () => {
    expect(issues({ name: '  ' })).toEqual([
      { path: 'name', message: 'agenda.organizations.errors.nameRequired' },
    ]);
    expect(issues({ name: 'x'.repeat(101) })).toEqual([
      { path: 'name', message: 'agenda.organizations.errors.nameTooLong' },
    ]);
  });

  it('takes a Swiss postcode of at most four characters', () => {
    expect(issues({ zip: '30111' })).toEqual([
      { path: 'zip', message: 'agenda.organizations.errors.zipTooLong' },
    ]);
  });

  it('caps the tags at three', () => {
    expect(issues({ tagIds: ['a', 'b', 'c', 'd'] })).toEqual([
      { path: 'tagIds', message: 'agenda.organizations.errors.tagsTooMany' },
    ]);
  });

  it('checks each contact with the shared rules and points at the field', () => {
    expect(
      issues({
        contacts: [
          contact({ label: 'Box office' }, 'a'),
          contact({ email: 'foo@' }, 'b'),
          contact({ phone: '031 000 00 00', label: 'x'.repeat(25) }, 'c'),
        ],
      })
    ).toEqual([
      {
        path: 'contacts.0.value.email',
        message: 'agenda.organizations.errors.contactNeedsEmailOrPhone',
      },
      {
        path: 'contacts.1.value.email',
        message: 'agenda.organizations.errors.contactEmailInvalid',
      },
      {
        path: 'contacts.2.value.label',
        message: 'agenda.organizations.errors.contactLabelTooLong',
      },
    ]);
  });

  it('refuses a seventh contact', () => {
    expect(
      issues({
        contacts: Array.from({ length: 7 }, (_, index) =>
          contact({ phone: `031 ${index}` }, `c${index}`)
        ),
      })
    ).toEqual([
      {
        path: 'contacts',
        message: 'agenda.organizations.errors.contactsTooMany',
      },
    ]);
  });
});

describe('organizationFormFromOrganization', () => {
  it('fills the form from the editor view, sensitive fields included', () => {
    const form = organizationFormFromOrganization(testOrganization());

    expect(form).toMatchObject({
      name: 'Equilibre',
      subTitle: 'Théâtre',
      legalStatus: 'association',
      postOfficeBox: 'Postfach 12',
      zip: '1700',
      regionId: 'region-1',
      tagIds: ['tag-1'],
      affiliationIds: ['aff-1'],
      partner: true,
      enabled: true,
    });
    expect(form.contacts.map(({ value }) => value)).toEqual([
      { label: 'Kasse', email: 'kasse@equilibre.ch', phone: '' },
    ]);
  });

  it('leaves the sensitive fields at their defaults for the public type', () => {
    const form = organizationFormFromOrganization(
      testOrganization({ __typename: 'Organization' })
    );

    expect(form).toMatchObject({ postOfficeBox: '', partner: false });
  });
});

describe('organizationVariables', () => {
  it('sends blanks as null and every list whole', () => {
    expect(
      organizationVariables({
        ...emptyOrganizationForm(),
        name: ' Equilibre ',
        website: '',
        tagIds: ['tag-1'],
        affiliationIds: ['aff-1'],
        contacts: [contact({ email: 'kasse@equilibre.ch', label: 'Kasse' })],
        partner: true,
      })
    ).toEqual({
      name: 'Equilibre',
      subTitle: null,
      about: null,
      website: null,
      legalStatus: null,
      address: null,
      postOfficeBox: null,
      zip: null,
      city: null,
      regionId: null,
      tagIds: ['tag-1'],
      affiliationIds: ['aff-1'],
      contacts: [{ label: 'Kasse', email: 'kasse@equilibre.ch', phone: null }],
      enabled: true,
      partner: true,
    });
  });
});
