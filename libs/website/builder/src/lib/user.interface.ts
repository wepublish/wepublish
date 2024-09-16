import {
  Image,
  RegisterMutationVariables,
  UpdatePasswordMutationVariables,
  UpdateUserMutationVariables,
  User
} from '@wepublish/website/api'
import {ChangeEvent} from 'react'
import {OptionalKeysOf} from 'type-fest'
import z from 'zod'
import {Control} from 'react-hook-form'

export type BuilderUserFormFields =
  | OptionalKeysOf<RegisterMutationVariables>
  | 'passwordRepeated'
  | 'flair'

export type BuilderUserFormProps<T extends BuilderUserFormFields> = {
  fields: T[]
  className?: string
  control: Control<any>
  hideEmail?: boolean
}

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
  Partial<UpdatePasswordMutationVariables>

export type BuilderPersonalDataFormFields =
  | Exclude<BuilderUserFormFields, 'passwordRepeated'>
  | 'image'

export type BuilderPersonalDataFormProps<
  T extends BuilderPersonalDataFormFields = BuilderPersonalDataFormFields
> = {
  fields?: T[]
  schema?: z.ZodObject<
    Partial<{
      password: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>
      passwordRepeated: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>
      preferredName: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>
      firstName: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>
      lastName: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>
      flair: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>
      address: AddressShape | z.ZodOptional<AddressShape>
      birthday: z.ZodDate | z.ZodOptional<z.ZodDate>
    }>
  >
  user: User
  className?: string
  onUpdate?: (
    data: UpdateUserMutationVariables['input'] & Partial<UpdatePasswordMutationVariables>
  ) => Promise<void>
  onImageUpload: (image: ChangeEvent<HTMLInputElement> | null) => Promise<void>
  mediaEmail?: string
}
