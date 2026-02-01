import { zodResolver } from '@hookform/resolvers/zod';
import styled from '@emotion/styled';
import { RegisterMutationVariables } from '@wepublish/website/api';
import {
  BuilderRegistrationFormProps,
  BuilderUserFormFields,
  Button,
} from '@wepublish/website/builder';
import { PropsWithChildren, useEffect, useMemo } from 'react';
import { Controller, DeepPartial, useForm } from 'react-hook-form';
import { z } from 'zod';
import { UserForm } from './user-form';
import { ApiAlert } from '@wepublish/errors/website';
import { userCountryNames } from '@wepublish/user';
import { Challenge } from '../challenge/challenge';

export const RegistrationFormWrapper = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const RegistrationFormButton = styled(Button)`
  justify-self: flex-end;
`;

/**
 * Zod only runs refine once the full schema is valid.
 * This is an issue as a user might be midway through the form and wants to get feedback.
 *
 * Usually this is solved by splitting the schema into multiple and then using z.intersection,
 * but this turns it into a z.ZodIntersection which does not allow to omit or pick. We need this
 * functionality to allow not showing certain fields.
 */
export function zodAlwaysRefine<T extends z.ZodTypeAny>(zodType: T) {
  return z.any().superRefine(async (value, ctx) => {
    const res = await zodType.safeParseAsync(value);

    if (res.success === false)
      for (const issue of res.error.issues) {
        ctx.addIssue(issue);
      }
  }) as unknown as T;
}

export const requiredRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().min(1),
  challengeAnswer: z.object({
    challengeSolution: z.string().min(1),
    challengeID: z.string().min(1),
  }),
});

export const defaultRegisterSchema = z.object({
  firstName: z.string().min(1),
  address: z.object({
    streetAddress: z.string().min(1),
    streetAddressNumber: z.string().min(1),
    zipCode: z.string().min(1),
    city: z.string().min(1),
    country: z.enum(userCountryNames),
  }),
  password: z.string().min(8),
  passwordRepeated: z.string().min(8),
  emailRepeated: z.string().email().min(1),
  birthday: z.coerce.date().max(new Date()),
});

export function RegistrationForm<
  T extends Exclude<BuilderUserFormFields, 'flair'>,
>({
  challenge,
  fields = ['firstName', 'address', 'password', 'passwordRepeated'] as T[],
  register,
  className,
  schema = defaultRegisterSchema,
  onRegister,
  onChange,
  children,
}: PropsWithChildren<
  BuilderRegistrationFormProps<T> & {
    onChange?: (values: DeepPartial<RegisterMutationVariables>) => void;
  }
>) {
  const fieldsToDisplay = fields.reduce(
    (obj, field) => ({ ...obj, [field]: true }),
    {} as Record<Exclude<BuilderUserFormFields, 'flair'>, true>
  );

  /**
   * Done like this to avoid type errors due to z.ZodObject vs z.ZodEffect<z.ZodObject>.
   * [Fixed with Zod 4](https://github.com/colinhacks/zod/issues/2474)
   */
  const validationSchema = useMemo(() => {
    const result = requiredRegisterSchema.merge(schema.pick(fieldsToDisplay));

    if (fieldsToDisplay.passwordRepeated) {
      return zodAlwaysRefine(result).refine(
        data => data.password === data.passwordRepeated,
        {
          message: 'Passwörter stimmen nicht überein.',
          path: ['passwordRepeated'],
        }
      );
    }

    return result;
  }, [fieldsToDisplay, schema]);

  const { handleSubmit, control, setValue, watch } =
    useForm<RegisterMutationVariables>({
      resolver: zodResolver(validationSchema),
      defaultValues: {
        challengeAnswer: {
          challengeID: '',
          challengeSolution: '',
        },
      },
      mode: 'onTouched',
      reValidateMode: 'onChange',
    });

  useEffect(() => {
    const subscription = watch(value => {
      onChange?.(value);
    });

    return () => subscription.unsubscribe();
  }, [onChange, watch]);

  const onSubmit = handleSubmit(data => onRegister?.(data));

  useEffect(() => {
    setValue(
      'challengeAnswer.challengeID',
      challenge.data?.challenge.challengeID ?? ''
    );
  }, [challenge, setValue]);

  return (
    <RegistrationFormWrapper
      className={className}
      onSubmit={onSubmit}
    >
      <UserForm
        control={control}
        fields={fields}
      />

      {challenge.data?.challenge && (
        <Controller
          name={'challengeAnswer.challengeSolution'}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Challenge
              {...field}
              value={field.value || ''}
              onChange={field.onChange}
              challenge={challenge.data!.challenge}
              label={'Captcha'}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      )}
      {children}

      {challenge.error && (
        <ApiAlert
          error={challenge.error}
          severity="error"
        />
      )}
      {register.error && (
        <ApiAlert
          error={register.error}
          severity="error"
        />
      )}

      <RegistrationFormButton
        disabled={register.loading || challenge.loading}
        type="submit"
      >
        Registrieren
      </RegistrationFormButton>
    </RegistrationFormWrapper>
  );
}
