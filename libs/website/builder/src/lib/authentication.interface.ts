import {MutationResult, QueryResult} from '@apollo/client'
import {
  ChallengeQuery,
  LoginWithCredentialsMutation,
  LoginWithEmailMutation,
  RegisterMutation,
  RegisterMutationVariables
} from '@wepublish/website/api'
import {OptionalKeysOf} from 'type-fest'
import z from 'zod'

export type BuilderLoginFormProps = {
  className?: string

  loginWithEmail: Pick<MutationResult<LoginWithEmailMutation>, 'data' | 'loading' | 'error'>
  onSubmitLoginWithEmail: (email: string) => void

  loginWithCredentials: Pick<
    MutationResult<LoginWithCredentialsMutation>,
    'data' | 'loading' | 'error'
  >
  onSubmitLoginWithCredentials: (email: string, password: string) => void
}

type AddressShape = z.ZodObject<{
  streetAddress: z.ZodString | z.ZodOptional<z.ZodString>
  zipCode: z.ZodString | z.ZodOptional<z.ZodString>
  city: z.ZodString | z.ZodOptional<z.ZodString>
  country: z.ZodString | z.ZodOptional<z.ZodString>
}>

export type BuilderRegistrationFormProps<
  T extends OptionalKeysOf<RegisterMutationVariables> = OptionalKeysOf<RegisterMutationVariables>
> = {
  fields?: T[]
  schema?: z.ZodObject<
    Partial<{
      password: z.ZodString | z.ZodOptional<z.ZodString>
      preferredName: z.ZodString | z.ZodOptional<z.ZodString>
      firstName: z.ZodString | z.ZodOptional<z.ZodString>
      address: AddressShape | z.ZodOptional<AddressShape>
    }>
  >
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>
  register: Pick<MutationResult<RegisterMutation>, 'data' | 'loading' | 'error'>
  className?: string
  onRegister?: (data: RegisterMutationVariables) => void
}
