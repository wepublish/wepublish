import { MutationResult, QueryResult } from '@apollo/client';
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
    MutationResult<LoginWithEmailMutation>,
    'data' | 'loading' | 'error'
  >;
  onSubmitLoginWithEmail: (email: string) => void;

  loginWithCredentials: Pick<
    MutationResult<LoginWithCredentialsMutation>,
    'data' | 'loading' | 'error'
  >;
  onSubmitLoginWithCredentials: (email: string, password: string) => void;
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
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>;
  register: Pick<
    MutationResult<RegisterMutation>,
    'data' | 'loading' | 'error'
  >;
  className?: string;
  onRegister?: (data: RegisterMutationVariables) => void;
};
