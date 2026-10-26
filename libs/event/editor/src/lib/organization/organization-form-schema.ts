import { EditorOrganizationFragment } from '@wepublish/editor/api';
import {
  ORGANIZATION_CONTACT_LABEL_MAX_LENGTH,
  ORGANIZATION_CONTACTS_MAX,
  ORGANIZATION_TAGS_MAX,
  organizationContactSchema,
} from '@wepublish/event/schedule';
import { z } from 'zod';

export const ORGANIZATION_NAME_MAX_LENGTH = 100;
export const ORGANIZATION_ZIP_MAX_LENGTH = 4;

export const LEGAL_STATUSES = [
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
] as const;

export const ORGANIZATION_ERROR_VALUES: Record<
  string,
  Record<string, unknown>
> = {
  'agenda.organizations.errors.nameTooLong': {
    max: ORGANIZATION_NAME_MAX_LENGTH,
  },
  'agenda.organizations.errors.zipTooLong': {
    max: ORGANIZATION_ZIP_MAX_LENGTH,
  },
  'agenda.organizations.errors.tagsTooMany': { max: ORGANIZATION_TAGS_MAX },
  'agenda.organizations.errors.contactsTooMany': {
    max: ORGANIZATION_CONTACTS_MAX,
  },
  'agenda.organizations.errors.contactLabelTooLong': {
    max: ORGANIZATION_CONTACT_LABEL_MAX_LENGTH,
  },
};

const contactValue = z.object({
  label: z.string(),
  email: z.string(),
  phone: z.string(),
});

export type OrganizationContactForm = z.infer<typeof contactValue>;

const contactIssueMessage = (issue: z.ZodIssue) => {
  if (issue.path[0] === 'label') {
    return 'agenda.organizations.errors.contactLabelTooLong';
  }

  return issue.code === z.ZodIssueCode.custom ?
      'agenda.organizations.errors.contactNeedsEmailOrPhone'
    : 'agenda.organizations.errors.contactEmailInvalid';
};

const contacts = z
  .array(z.object({ id: z.string(), value: contactValue }))
  .max(ORGANIZATION_CONTACTS_MAX, 'agenda.organizations.errors.contactsTooMany')
  .superRefine((rows, ctx) =>
    rows.forEach(({ value }, index) => {
      const result = organizationContactSchema.safeParse(value);

      if (!result.success) {
        const [issue] = result.error.issues;

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: contactIssueMessage(issue),
          path: [index, 'value', String(issue.path[0] ?? 'email')],
        });
      }
    })
  );

export const organizationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'agenda.organizations.errors.nameRequired')
    .max(
      ORGANIZATION_NAME_MAX_LENGTH,
      'agenda.organizations.errors.nameTooLong'
    ),
  subTitle: z.string(),
  about: z.string(),
  website: z.string(),
  legalStatus: z.string(),
  address: z.string(),
  postOfficeBox: z.string(),
  zip: z
    .string()
    .trim()
    .max(ORGANIZATION_ZIP_MAX_LENGTH, 'agenda.organizations.errors.zipTooLong'),
  city: z.string(),
  regionId: z.string(),
  tagIds: z
    .array(z.string())
    .max(ORGANIZATION_TAGS_MAX, 'agenda.organizations.errors.tagsTooMany'),
  affiliationIds: z.array(z.string()),
  contacts,
  enabled: z.boolean(),
  partner: z.boolean(),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

export const emptyOrganizationForm = (): OrganizationFormValues => ({
  name: '',
  subTitle: '',
  about: '',
  website: '',
  legalStatus: '',
  address: '',
  postOfficeBox: '',
  zip: '',
  city: '',
  regionId: '',
  tagIds: [],
  affiliationIds: [],
  contacts: [],
  enabled: true,
  partner: false,
});

export const organizationFormFromOrganization = (
  organization: EditorOrganizationFragment
): OrganizationFormValues => {
  const sensitive =
    organization.__typename === 'SensitiveDataOrganization' ?
      organization
    : null;

  return {
    name: organization.name,
    subTitle: organization.subTitle ?? '',
    about: organization.about ?? '',
    website: organization.website ?? '',
    legalStatus: organization.legalStatus ?? '',
    address: organization.address ?? '',
    postOfficeBox: sensitive?.postOfficeBox ?? '',
    zip: organization.zip ?? '',
    city: organization.city ?? '',
    regionId: organization.regionId ?? '',
    tagIds: organization.tags.map(({ id }) => id),
    affiliationIds: organization.affiliations.map(({ id }) => id),
    contacts: organization.contacts.map(contact => ({
      id: contact.id,
      value: {
        label: contact.label ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
      },
    })),
    enabled: organization.enabled,
    partner: sensitive?.partner ?? false,
  };
};

const orNull = (value: string) => value.trim() || null;

export const organizationVariables = (values: OrganizationFormValues) => ({
  name: values.name.trim(),
  subTitle: orNull(values.subTitle),
  about: orNull(values.about),
  website: orNull(values.website),
  legalStatus: orNull(values.legalStatus),
  address: orNull(values.address),
  postOfficeBox: orNull(values.postOfficeBox),
  zip: orNull(values.zip),
  city: orNull(values.city),
  regionId: orNull(values.regionId),
  tagIds: values.tagIds,
  affiliationIds: values.affiliationIds,
  contacts: values.contacts.map(({ value }) => ({
    label: orNull(value.label),
    email: orNull(value.email),
    phone: orNull(value.phone),
  })),
  enabled: values.enabled,
  partner: values.partner,
});
