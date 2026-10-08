import type { OperationVariables } from '@apollo/client';
import type { useMutation, useQuery } from '@apollo/client/react';
import {
  ChallengeQuery,
  LoginWithCredentialsMutation,
  LoginWithEmailMutation,
  RegisterMutation,
  RegisterMutationVariables,
} from '@wepublish/website/api';
import z from 'zod';
import { BuilderUserFormFields } from './user.interface';

export type BuilderLoginFormProps = {
  className?: string;

  defaults?: Partial<{
    email: string;
    requirePassword: boolean;
  }>;

  disablePasswordLogin?: boolean;

  loginWithEmail: Pick<
    useMutation.Result<LoginWithEmailMutation>,
    'data' | 'loading' | 'error'
  >;
  onSubmitLoginWithEmail: (email: string) => void;
  loginLinkCooldownSeconds?: number;

  loginWithCredentials: Pick<
    useMutation.Result<LoginWithCredentialsMutation>,
    'data' | 'loading' | 'error'
  >;
  onSubmitLoginWithCredentials: (
    email: string,
    password: string,
    totpToken?: string
  ) => void;

  otpRequired?: boolean;
  onEmailChange?: (email: string) => void;

  /** When true, email login was blocked because the user has 2FA. The form auto-switches to password mode. */
  totpRedirectToPassword?: boolean;
};

export type AddressShape = z.ZodObject<{
  streetAddress: z.ZodString | z.ZodOptional<z.ZodString>;
  streetAddressNumber: z.ZodString | z.ZodOptional<z.ZodString>;
  zipCode: z.ZodString | z.ZodOptional<z.ZodString>;
  city: z.ZodString | z.ZodOptional<z.ZodString>;
  country:
    | z.ZodEnum<[string, ...string[]]>
    | z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
}>;

export type BuilderRegistrationFormProps<
  T extends Exclude<BuilderUserFormFields, 'flair'> = Exclude<
    BuilderUserFormFields,
    'flair'
  >,
> = {
  fields?: T[];
  schema?: z.ZodObject<
    Partial<{
      password: z.ZodString | z.ZodOptional<z.ZodString>;
      passwordRepeated: z.ZodString | z.ZodOptional<z.ZodString>;
      firstName: z.ZodString | z.ZodOptional<z.ZodString>;
      address: AddressShape | z.ZodOptional<AddressShape>;
      birthday: z.ZodDate | z.ZodOptional<z.ZodDate>;
      emailRepeated: z.ZodString | z.ZodOptional<z.ZodString>;
    }>
  >;
  challenge: Pick<
    useQuery.Result<ChallengeQuery, OperationVariables, 'complete' | 'empty'>,
    'data' | 'loading' | 'error'
  >;
  register: Pick<
    useMutation.Result<RegisterMutation>,
    'data' | 'loading' | 'error'
  >;
  className?: string;
  onRegister?: (data: RegisterMutationVariables) => void;
};
