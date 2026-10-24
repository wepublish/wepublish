import { z } from 'zod';

export const ORGANIZATION_TAGS_MAX = 3;
export const ORGANIZATION_CONTACTS_MAX = 6;
export const ORGANIZATION_CONTACT_LABEL_MAX_LENGTH = 24;

const isFilled = (value: string | null | undefined) => !!value?.trim();

const distinct = (ids: string[]) => new Set(ids).size === ids.length;

export const organizationContactSchema = z
  .object({
    label: z
      .string()
      .trim()
      .max(ORGANIZATION_CONTACT_LABEL_MAX_LENGTH, {
        message: `Must be at most ${ORGANIZATION_CONTACT_LABEL_MAX_LENGTH} characters`,
      })
      .nullish(),
    email: z.string().trim().email().or(z.literal('')).nullish(),
    phone: z.string().trim().nullish(),
  })
  .refine(({ email, phone }) => isFilled(email) || isFilled(phone), {
    message: 'Needs an email or a phone number',
    path: ['email'],
  });

export type OrganizationContactRule = z.infer<typeof organizationContactSchema>;

export const organizationContactsSchema = z
  .array(organizationContactSchema)
  .max(ORGANIZATION_CONTACTS_MAX, {
    message: `At most ${ORGANIZATION_CONTACTS_MAX} contacts`,
  });

export const organizationTagIdsSchema = z
  .array(z.string())
  .max(ORGANIZATION_TAGS_MAX, {
    message: `At most ${ORGANIZATION_TAGS_MAX} tags`,
  })
  .refine(distinct, { message: 'Tags must be distinct' });

export const organizationAffiliationIdsSchema = z
  .array(z.string())
  .refine(distinct, { message: 'Affiliations must be distinct' });
