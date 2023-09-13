import {
  Image,
  UpdatePasswordMutationVariables,
  UpdateUserMutationVariables,
  User
} from '@wepublish/website/api'
import {ChangeEvent} from 'react'
import {OptionalKeysOf} from 'type-fest'
import z from 'zod'

export type BuilderImageUploadProps = {
  image?: Image | null
  onUpload: (image: ChangeEvent<HTMLInputElement> | null) => void
  className?: string
}

type AddressShape = z.ZodObject<{
  streetAddress: z.ZodString | z.ZodOptional<z.ZodString>
  zipCode: z.ZodString | z.ZodOptional<z.ZodString>
  city: z.ZodString | z.ZodOptional<z.ZodString>
  country: z.ZodString | z.ZodOptional<z.ZodString>
}>

export type PersonalDataFormFields = UpdateUserMutationVariables['input'] &
  Partial<UpdatePasswordMutationVariables> & {image?: Image}

export type BuilderPersonalDataFormFields = OptionalKeysOf<
  Omit<PersonalDataFormFields, 'uploadImageInput' | 'passwordRepeated'>
>

export type BuilderPersonalDataFormProps<
  T extends BuilderPersonalDataFormFields = BuilderPersonalDataFormFields
> = {
  fields?: T[]
  schema?: z.ZodObject<
    Partial<{
      password: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>
      passwordRepeated: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>
      preferredName: z.ZodString | z.ZodOptional<z.ZodString>
      firstName: z.ZodString | z.ZodOptional<z.ZodString>
      lastName: z.ZodString | z.ZodOptional<z.ZodString>
      flair: z.ZodString | z.ZodOptional<z.ZodString>
      address: AddressShape | z.ZodOptional<AddressShape>
    }>
  >
  initialUser: User
  className?: string
  onUpdate?: (
    data: UpdateUserMutationVariables['input'] & Partial<UpdatePasswordMutationVariables>
  ) => Promise<void>
  onImageUpload: (image: ChangeEvent<HTMLInputElement> | null) => Promise<void>
  mediaEmail?: string
}
