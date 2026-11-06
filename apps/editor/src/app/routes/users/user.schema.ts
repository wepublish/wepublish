import type {
  CreateUserMutationVariables,
  FullUserFragment,
  UpdateUserMutationVariables,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
  formFields,
} from '@wepublish/form/editor';
import { userCountryNames } from '@wepublish/user';
import { endOfToday } from 'date-fns';
import { z } from 'zod/v4';

const addressSchema = z.object({
  company: z.string().nullish().meta({ label: 'userCreateOrEditView.company' }),
  streetAddress: z
    .string()
    .nullish()
    .meta({ label: 'userCreateOrEditView.streetAddress' }),
  streetAddressNumber: z
    .string()
    .nullish()
    .meta({ label: 'userCreateOrEditView.streetAddressNumber' }),
  streetAddress2: z
    .string()
    .nullish()
    .meta({ label: 'userCreateOrEditView.streetAddress2' }),
  streetAddress2Number: z
    .string()
    .nullish()
    .meta({ label: 'userCreateOrEditView.streetAddress2Number' }),
  zipCode: z.string().nullish().meta({ label: 'userCreateOrEditView.zipCode' }),
  city: z.string().nullish().meta({ label: 'userCreateOrEditView.city' }),
  country: z
    .enum(userCountryNames)
    .or(z.literal(''))
    .nullish()
    .meta({ label: 'userCreateOrEditView.country' }),
});

const propertySchema = z.object({
  key: z.string().meta({ label: 'articleEditor.panels.key' }),
  value: z.string().meta({ label: 'articleEditor.panels.value' }),
  public: z.boolean().default(true).meta({ label: 'articleEditor.panels.public' }),
});

export const userSchema = z.object({
  image: formFields
    .image()
    .nullish()
    .meta({ label: 'userCreateOrEditView.selectUserImage' }),
  firstName: z
    .string()
    .nullish()
    .meta({ label: 'userCreateOrEditView.firstName' }),
  name: z.string().min(1).meta({ label: 'userCreateOrEditView.name' }),
  email: z.email().meta({ label: 'userCreateOrEditView.email' }),
  birthday: z
    .date()
    .max(endOfToday())
    .nullish()
    .meta({ label: 'userCreateOrEditView.birthday' }),
  flair: z.string().nullish().meta({
    label: 'userCreateOrEditView.flair',
    description: 'userCreateOrEditView.flairInfo',
  }),
  note: formFields.textarea().nullish().meta({
    label: 'userCreateOrEditView.note',
    helperText: 'userCreateOrEditView.noteHelpText',
  }),
  address: addressSchema,
  properties: z
    .array(propertySchema)
    .meta({ label: 'userCreateOrEditView.properties' }),
  active: z.boolean().default(true).meta({
    label: 'userCreateOrEditView.active',
    description: 'userCreateOrEditView.activeInfo',
  }),
  roleIds: z
    .array(z.string())
    .meta({ label: 'userCreateOrEditView.userRoles' }),
});

export const userCreateSchema = userSchema.extend({
  password: z
    .string()
    .min(12, { error: 'errorMessages.passwordTooShortErrorMessage' })
    .meta({ label: 'userCreateOrEditView.password' }),
});

export type UserFormValues = FormValues<typeof userSchema>;

type UserOutput = FormOutput<typeof userSchema>;

export const userTitleParams = ({ firstName, name }: UserFormValues) => ({
  name: [firstName, name].filter(Boolean).join(' '),
});

export const fromUser = (
  user: FullUserFragment
): FormDefaultValues<typeof userSchema> => ({
  image: user.image ?? null,
  firstName: user.firstName ?? '',
  name: user.name,
  email: user.email,
  birthday: user.birthday ? new Date(user.birthday) : null,
  flair: user.flair ?? '',
  note: user.note ?? '',
  address: {
    company: user.address?.company,
    streetAddress: user.address?.streetAddress,
    streetAddressNumber: user.address?.streetAddressNumber,
    streetAddress2: user.address?.streetAddress2,
    streetAddress2Number: user.address?.streetAddress2Number,
    zipCode: user.address?.zipCode,
    city: user.address?.city,
    country: user.address?.country,
  },
  properties: (user.properties ?? []).map(property => ({
    key: property.key,
    value: property.value,
    public: property.public,
  })),
  active: user.active,
  roleIds: (user.roles ?? []).map(role => role.id),
});

const toAddress = ({ address }: UserOutput) => ({
  company: address.company ?? '',
  streetAddress: address.streetAddress ?? '',
  streetAddressNumber: address.streetAddressNumber ?? '',
  streetAddress2: address.streetAddress2 ?? '',
  streetAddress2Number: address.streetAddress2Number ?? '',
  zipCode: address.zipCode ?? '',
  city: address.city ?? '',
  country: address.country ?? '',
});

const toProperties = ({ properties }: UserOutput) =>
  properties.map(property => ({
    key: property.key,
    public: property.public,
    value: property.value,
  }));

export const toUpdateUserVariables = (
  id: string,
  emailVerifiedAt: string | null,
  values: UserOutput
): UpdateUserMutationVariables => ({
  id,
  name: values.name,
  firstName: values.firstName || undefined,
  note: values.note,
  flair: values.flair,
  birthday: values.birthday?.toISOString() ?? null,
  email: values.email,
  emailVerifiedAt,
  active: values.active,
  userImageID: values.image?.id ?? null,
  roleIDs: values.roleIds,
  properties: toProperties(values),
  address: toAddress(values),
});

export const toCreateUserVariables = (
  values: FormOutput<typeof userCreateSchema>,
  skipMail: boolean
): CreateUserMutationVariables => ({
  name: values.name,
  firstName: values.firstName,
  note: values.note,
  flair: values.flair,
  birthday: values.birthday?.toISOString(),
  email: values.email,
  emailVerifiedAt: null,
  active: values.active,
  properties: toProperties(values),
  roleIDs: values.roleIds,
  address: toAddress(values),
  userImageID: values.image?.id || null,
  password: values.password,
  skipMail,
});
