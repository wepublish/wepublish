import type {
  CreateUserConsentMutationVariables,
  FullConsentFragment,
  FullUserConsentFragment,
} from '@wepublish/editor/api';
import {
  formFields,
  type FormDefaultValues,
  type FormOutput,
} from '@wepublish/form/editor';
import type { UserSearchValue } from '@wepublish/ui/editor';
import { z } from 'zod/v4';

export const userConsentSchema = z.object({
  user: formFields.user<UserSearchValue>().meta({ label: 'userConsents.user' }),
  consent: formFields
    .entity<FullConsentFragment>()
    .meta({ label: 'consents.consent' }),
  value: z.boolean().default(true).meta({ label: 'consents.accepted' }),
});

export type UserConsentOutput = FormOutput<typeof userConsentSchema>;

export const fromUserConsent = ({
  user,
  consent,
  value,
}: FullUserConsentFragment): FormDefaultValues<typeof userConsentSchema> => ({
  user,
  consent,
  value,
});

export const toCreateUserConsentVariables = ({
  user,
  consent,
  value,
}: UserConsentOutput): CreateUserConsentMutationVariables => ({
  userId: user.id,
  consentId: consent.id,
  value,
});
