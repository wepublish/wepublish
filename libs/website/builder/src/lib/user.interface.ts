import {
  Image,
  RegisterMutationVariables,
  UpdatePasswordMutationVariables,
  UpdateUserMutationVariables,
  SensitiveDataUser,
} from '@wepublish/website/api';
import { ChangeEvent } from 'react';
import { OptionalKeysOf } from 'type-fest';
import z from 'zod';
import { Control } from 'react-hook-form';
import { AddressShape } from './authentication.interface';

export type BuilderUserFormFields =
  | OptionalKeysOf<RegisterMutationVariables>
  | 'passwordRepeated'
  | 'emailRepeated'
  | 'flair';

export type BuilderUserFormProps<T extends BuilderUserFormFields> = {
  fields: T[];
  className?: string;
  control: Control<any>;
  hideEmail?: boolean;
};

export type BuilderImageUploadProps = {
  image?: Image | null;
  onUpload: (image: ChangeEvent<HTMLInputElement> | null) => void;
  className?: string;
};

export type PersonalDataFormFields = UpdateUserMutationVariables['input'] &
  Partial<UpdatePasswordMutationVariables>;

export type BuilderPersonalDataFormFields =
  | Exclude<BuilderUserFormFields, 'passwordRepeated'>
  | 'image';

export type BuilderPersonalDataFormProps<
  T extends BuilderPersonalDataFormFields = BuilderPersonalDataFormFields,
> = {
  fields?: T[];
  schema?: z.ZodObject<
    Partial<{
      password: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>;
      passwordRepeated: z.ZodUnion<
        [z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]
      >;
      firstName: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>;
      name: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>;
      flair: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>;
      address: AddressShape | z.ZodOptional<AddressShape>;
      birthday: z.ZodDate | z.ZodOptional<z.ZodDate>;
    }>
  >;
  user: SensitiveDataUser;
  className?: string;
  onUpdate?: (
    data: UpdateUserMutationVariables['input'] &
      Partial<UpdatePasswordMutationVariables>
  ) => Promise<void>;
  onImageUpload: (image: ChangeEvent<HTMLInputElement> | null) => Promise<void>;
  mediaEmail?: string;
};
