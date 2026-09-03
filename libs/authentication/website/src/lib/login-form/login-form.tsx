import { zodResolver } from '@hookform/resolvers/zod';
import styled from '@emotion/styled';
import {
  BuilderLoginFormProps,
  Button,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export const LoginFormWrapper = styled('div')`
  display: grid;
  width: 100%;
  max-width: 600px;
  justify-self: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const LoginFormForm = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const LoginFormButton = styled(Button)`
  justify-self: flex-end;
`;

/**
 * Secondary actions that switch the login method. Kept separate from
 * {@link LoginFormButton} so themes can style the primary action without
 * flattening the hierarchy between the two.
 */
export const LoginFormSecondaryButton = styled(Button)`
  justify-self: flex-end;
`;

export const LoginFormActions = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const withEmailFormSchema = z.object({
  email: z.string().email().min(1),
  requirePassword: z.literal(false),
  password: z.string().optional(),
  totpToken: z.string().optional(),
});

const withCredentialsFormSchema = z.object({
  email: z.string().email().min(1),
  requirePassword: z.literal(true),
  password: z.string().min(1),
  totpToken: z.string().optional(),
});

const loginFormSchema = z.union([
  withEmailFormSchema,
  withCredentialsFormSchema,
]);

const autofocus = (node: HTMLElement | null) => {
  const inputNode = node?.querySelector('input') ?? node;
  inputNode?.focus();
};

export function LoginForm({
  loginWithCredentials,
  onSubmitLoginWithCredentials,
  loginWithEmail,
  onSubmitLoginWithEmail,
  defaults,
  disablePasswordLogin,
  otpRequired,
  onEmailChange,
  totpRedirectToPassword,
  className,
}: BuilderLoginFormProps) {
  const {
    elements: { Alert, TextField },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  type FormInput = z.infer<typeof loginFormSchema>;
  const { handleSubmit, control, watch, setValue } = useForm<FormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: defaults?.email || '',
      password: '',
      totpToken: '',
      requirePassword: defaults?.requirePassword || false,
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  // Only autofocus the password once the reader actively chose password login,
  // otherwise the email stays the first field to fill in.
  const [autofocusPassword, setAutofocusPassword] = useState(false);

  const emailValue = watch('email');

  // Notify parent when email changes so it can check OTP requirement
  useEffect(() => {
    onEmailChange?.(emailValue);
  }, [emailValue, onEmailChange]);

  // Auto-switch to password mode when 2FA redirect is triggered
  useEffect(() => {
    if (totpRedirectToPassword) {
      setValue('requirePassword', true);
    }
  }, [totpRedirectToPassword, setValue]);

  const onSubmit = handleSubmit(
    ({ email, requirePassword, password, totpToken }) => {
      if (requirePassword) {
        return onSubmitLoginWithCredentials(
          email,
          password,
          totpToken || undefined
        );
      }

      return onSubmitLoginWithEmail(email);
    }
  );

  const loginWithPassword = watch('requirePassword');
  const loginLinkSent =
    !loginWithPassword &&
    loginWithEmail.data?.sendWebsiteLogin === watch('email');
  const error =
    (!loginWithPassword && loginWithEmail.error) ||
    (loginWithPassword && loginWithCredentials.error);
  const loading =
    (!loginWithPassword && loginWithEmail.loading) ||
    (loginWithPassword && loginWithCredentials.loading);
  const awaitingLoginConfirmed = loginWithPassword && loading;
  // With 2FA the login link is not an option, so there is nothing to go back to.
  const canSwitchToLinkLogin = !totpRedirectToPassword;

  const switchToPasswordLogin = () => {
    setAutofocusPassword(true);
    setValue('requirePassword', true);
  };

  const switchToLinkLogin = () => {
    setValue('requirePassword', false);
  };

  return (
    <LoginFormWrapper className={className}>
      <LoginFormForm onSubmit={onSubmit}>
        <Controller
          name={'email'}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              autoComplete="email"
              type={'email'}
              fullWidth
              label={t('login.email')}
              error={!!error}
              helperText={error?.message}
              inputRef={autofocus}
            />
          )}
        />

        {loginWithPassword && (
          <Controller
            name={'password'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                autoComplete="current-password"
                type={'password'}
                fullWidth
                label={t('login.password')}
                error={!!error}
                helperText={error?.message}
                inputRef={autofocusPassword ? autofocus : undefined}
              />
            )}
          />
        )}

        {loginWithPassword && otpRequired && (
          <Controller
            name={'totpToken'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                autoComplete="one-time-code"
                type={'text'}
                fullWidth
                label={t('login.totp.code')}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        )}

        {totpRedirectToPassword && (
          <Alert severity="info">{t('login.totp.emailLoginDisabled')}</Alert>
        )}

        {awaitingLoginConfirmed && (
          <Alert severity="info">{t('login.verifyingCredentials')}</Alert>
        )}

        {error && <Alert severity="error">{error.message}</Alert>}

        {loginLinkSent && (
          <Alert severity="success">
            <span data-sentry-mask>
              {t('login.alertLoginLinkSent', {
                email: loginWithEmail.data?.sendWebsiteLogin,
              })}
            </span>
          </Alert>
        )}

        <LoginFormActions>
          {loginWithPassword ?
            <>
              {canSwitchToLinkLogin && (
                <LoginFormSecondaryButton
                  variant="text"
                  type="button"
                  onClick={switchToLinkLogin}
                >
                  {t('login.useLinkInstead')}
                </LoginFormSecondaryButton>
              )}

              <LoginFormButton
                disabled={loading}
                type="submit"
              >
                {t('login.submit')}
              </LoginFormButton>
            </>
          : <>
              {!disablePasswordLogin && (
                <LoginFormSecondaryButton
                  variant="outlined"
                  type="button"
                  onClick={switchToPasswordLogin}
                >
                  {t('login.loginWithPassword')}
                </LoginFormSecondaryButton>
              )}

              <LoginFormButton
                disabled={loading || loginLinkSent}
                type="submit"
              >
                {loginLinkSent ?
                  t('login.loginLinkSent')
                : t('login.loginWithLink')}
              </LoginFormButton>
            </>
          }
        </LoginFormActions>
      </LoginFormForm>
    </LoginFormWrapper>
  );
}
