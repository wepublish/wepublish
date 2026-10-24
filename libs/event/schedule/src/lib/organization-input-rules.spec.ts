import {
  ORGANIZATION_CONTACT_LABEL_MAX_LENGTH,
  ORGANIZATION_CONTACTS_MAX,
  ORGANIZATION_TAGS_MAX,
  organizationAffiliationIdsSchema,
  organizationContactSchema,
  organizationContactsSchema,
  organizationTagIdsSchema,
} from './organization-input-rules';

const contact = (overrides: Record<string, unknown> = {}) => ({
  label: 'Kasse',
  email: 'kasse@dampfzentrale.ch',
  phone: null,
  ...overrides,
});

describe('organizationContactSchema', () => {
  it('accepts a contact with an email, a phone or both', () => {
    expect(organizationContactSchema.safeParse(contact()).success).toBe(true);
    expect(
      organizationContactSchema.safeParse(
        contact({ email: null, phone: '031 311 05 05' })
      ).success
    ).toBe(true);
    expect(
      organizationContactSchema.safeParse(contact({ phone: '031 311 05 05' }))
        .success
    ).toBe(true);
  });

  it('refuses a contact with neither email nor phone', () => {
    expect(
      organizationContactSchema.safeParse(contact({ email: null, phone: null }))
        .success
    ).toBe(false);
    expect(
      organizationContactSchema.safeParse(contact({ email: '', phone: '  ' }))
        .success
    ).toBe(false);
  });

  it('refuses an email that is not one', () => {
    expect(
      organizationContactSchema.safeParse(contact({ email: 'foo@' })).success
    ).toBe(false);
  });

  it(`takes a label of at most ${ORGANIZATION_CONTACT_LABEL_MAX_LENGTH} characters`, () => {
    expect(
      organizationContactSchema.safeParse(
        contact({ label: 'a'.repeat(ORGANIZATION_CONTACT_LABEL_MAX_LENGTH) })
      ).success
    ).toBe(true);
    expect(
      organizationContactSchema.safeParse(
        contact({
          label: 'a'.repeat(ORGANIZATION_CONTACT_LABEL_MAX_LENGTH + 1),
        })
      ).success
    ).toBe(false);
  });

  it('accepts a contact without a label', () => {
    expect(
      organizationContactSchema.safeParse(contact({ label: null })).success
    ).toBe(true);
  });
});

describe('organizationContactsSchema', () => {
  it(`takes at most ${ORGANIZATION_CONTACTS_MAX} contacts`, () => {
    expect(ORGANIZATION_CONTACTS_MAX).toBe(6);
    expect(
      organizationContactsSchema.safeParse(
        Array.from({ length: 6 }, () => contact())
      ).success
    ).toBe(true);
    expect(
      organizationContactsSchema.safeParse(
        Array.from({ length: 7 }, () => contact())
      ).success
    ).toBe(false);
  });

  it('accepts no contacts', () => {
    expect(organizationContactsSchema.safeParse([]).success).toBe(true);
  });

  it('refuses the list when one contact is invalid', () => {
    expect(
      organizationContactsSchema.safeParse([
        contact(),
        contact({ email: null, phone: null }),
      ]).success
    ).toBe(false);
  });
});

describe('organizationTagIdsSchema', () => {
  it(`takes up to ${ORGANIZATION_TAGS_MAX} distinct tags, or none`, () => {
    expect(ORGANIZATION_TAGS_MAX).toBe(3);
    expect(organizationTagIdsSchema.safeParse([]).success).toBe(true);
    expect(organizationTagIdsSchema.safeParse(['a', 'b', 'c']).success).toBe(
      true
    );
  });

  it('refuses four tags', () => {
    expect(
      organizationTagIdsSchema.safeParse(['a', 'b', 'c', 'd']).success
    ).toBe(false);
  });

  it('refuses a repeated tag', () => {
    expect(organizationTagIdsSchema.safeParse(['a', 'a']).success).toBe(false);
  });
});

describe('organizationAffiliationIdsSchema', () => {
  it('takes distinct affiliations, or none', () => {
    expect(organizationAffiliationIdsSchema.safeParse([]).success).toBe(true);
    expect(organizationAffiliationIdsSchema.safeParse(['a', 'b']).success).toBe(
      true
    );
  });

  it('refuses a repeated affiliation', () => {
    expect(organizationAffiliationIdsSchema.safeParse(['a', 'a']).success).toBe(
      false
    );
  });
});
