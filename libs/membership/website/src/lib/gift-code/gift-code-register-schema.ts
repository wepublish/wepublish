import {
  defaultRegisterSchema,
  requiredRegisterSchema,
  zodAlwaysRefine,
} from '@wepublish/authentication/website';
import {
  BuilderRegistrationFormProps,
  BuilderUserFormFields,
} from '@wepublish/website/builder';
import {
  RegisterMutationVariables,
  UserAddressInput,
} from '@wepublish/website/api';
import { useMemo } from 'react';
import { z } from 'zod';

type Fields = Exclude<BuilderUserFormFields, 'flair'>;

export const useGiftCodeFormSchema = <TShape extends z.ZodRawShape>(
  base: z.ZodObject<TShape>,
  hasUser: boolean,
  fields: Fields[],
  schema: NonNullable<
    BuilderRegistrationFormProps['schema']
  > = defaultRegisterSchema
) =>
  useMemo(() => {
    if (hasUser) {
      return base;
    }

    const fieldsToDisplay = fields.reduce(
      (obj, field) => ({ ...obj, [field]: true }),
      {} as Record<Fields, true>
    );

    let result: z.ZodEffects<any> | z.ZodObject<any> =
      requiredRegisterSchema.merge(schema.pick(fieldsToDisplay).merge(base));

    if (fieldsToDisplay.passwordRepeated) {
      result = zodAlwaysRefine(result).refine(
        data => data.password === data.passwordRepeated,
        {
          message: 'Passwörter stimmen nicht überein.',
          path: ['passwordRepeated'],
        }
      );
    }

    if (fieldsToDisplay.emailRepeated) {
      result = zodAlwaysRefine(result).refine(
        data => data.email === data.emailRepeated,
        {
          message: 'E-Mailadressen stimmen nicht überein.',
          path: ['emailRepeated'],
        }
      );
    }

    return result;
  }, [base, hasUser, fields, schema]);

export const toRegisterVariables = ({
  address,
  challengeAnswer,
  email,
  birthday,
  password,
  name,
  firstName,
}: Record<string, any>) =>
  ({
    birthday,
    email,
    password,
    name,
    firstName,
    address: address as UserAddressInput,
    challengeAnswer,
  }) as RegisterMutationVariables;
