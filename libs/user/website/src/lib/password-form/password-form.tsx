import { zodResolver } from '@hookform/resolvers/zod';
import styled from '@emotion/styled';
import { useAsyncAction, useWebsiteBuilder } from '@wepublish/website/builder';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { PasswordFields } from '../password-fields/password-fields';

export const PasswordFormWrapper = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-self: stretch;

  & > button {
    justify-self: end;
  }
`;

type PasswordValues = { password: string; passwordRepeated: string };

const defaultSchema = z.object({
  password: z.string().min(12).optional().or(z.literal('')),
  passwordRepeated: z.string().min(12).optional().or(z.literal('')),
});

export type PasswordFormProps = {
  onUpdate: (values: PasswordValues) => Promise<void>;
  /**
   * The profile's schema; its password rules apply here too (e.g. a tenant's
   * stricter minimum length).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: z.ZodObject<any>;
  className?: string;
};

/** Changes the reader's password, apart from the other personal data. */
export function PasswordForm({
  onUpdate,
  schema = defaultSchema,
  className,
}: PasswordFormProps) {
  const {
    elements: { Alert, Button },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [success, setSuccess] = useState(false);
  const callAction = useAsyncAction(setLoading, setError, setSuccess);

  const validationSchema = useMemo(
    () =>
      schema
        .pick({ password: true, passwordRepeated: true })
        // here, unlike in the personal data, a new password is the point
        .refine((data: Partial<PasswordValues>) => !!data.password, {
          message: t('zod.errors.invalid_type_received_undefined'),
          path: ['password'],
        })
        .refine(
          (data: Partial<PasswordValues>) =>
            data.password === data.passwordRepeated,
          {
            message: t('user.form.passwordsDoNotMatch'),
            path: ['passwordRepeated'],
          }
        ),
    [schema, t]
  );

  const { handleSubmit, control, reset } = useForm<PasswordValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: { password: '', passwordRepeated: '' },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(values =>
    callAction(async () => {
      await onUpdate(values);
      reset();
    })()
  );

  return (
    <PasswordFormWrapper
      className={className}
      onSubmit={onSubmit}
    >
      <PasswordFields control={control} />

      {error && <Alert severity="error">{error.message}</Alert>}
      {success && <Alert severity="success">{t('user.saveSuccess')}</Alert>}

      <Button
        disabled={loading}
        type="submit"
      >
        {t('user.save')}
      </Button>
    </PasswordFormWrapper>
  );
}
