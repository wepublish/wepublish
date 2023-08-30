import {MutationResult} from '@apollo/client'
import {
  FullImageFragment,
  UpdatePasswordMutationVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
  UploadImageInput
} from '@wepublish/website/api'
import {OptionalKeysOf} from 'type-fest'
import z from 'zod'

type AddressShape = z.ZodObject<{
  streetAddress: z.ZodString | z.ZodOptional<z.ZodString>
  zipCode: z.ZodString | z.ZodOptional<z.ZodString>
  city: z.ZodString | z.ZodOptional<z.ZodString>
  country: z.ZodString | z.ZodOptional<z.ZodString>
}>

export type PersonalDataFormFields = UpdateUserMutationVariables['input'] &
  Partial<UpdatePasswordMutationVariables> & {image?: FullImageFragment}

export type BuilderPersonalDataFormProps<
  T extends OptionalKeysOf<PersonalDataFormFields> = OptionalKeysOf<PersonalDataFormFields>
> = {
  fields?: T[]
  schema?: z.ZodObject<
    Partial<{
      password: z.ZodString | z.ZodOptional<z.ZodString>
      passwordRepeated: z.ZodString | z.ZodOptional<z.ZodString>
      preferredName: z.ZodString | z.ZodOptional<z.ZodString>
      firstName: z.ZodString | z.ZodOptional<z.ZodString>
      lastName: z.ZodString | z.ZodOptional<z.ZodString>
      flair: z.ZodString | z.ZodOptional<z.ZodString>
      address: AddressShape | z.ZodOptional<AddressShape>
    }>
  >
  initialUser: UpdateUserMutationVariables['input'] & {image?: FullImageFragment}
  update: Pick<MutationResult<UpdateUserMutation>, 'data' | 'loading' | 'error'>
  className?: string
  onUpdate?: (
    data: UpdateUserMutationVariables['input'] & Partial<UpdatePasswordMutationVariables>
  ) => void
  onImageUpload: (image: UploadImageInput) => void
  mediaEmail?: string
}
