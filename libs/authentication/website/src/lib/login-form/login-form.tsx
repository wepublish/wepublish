import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, FormControlLabel } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderLoginFormProps,
  Button,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
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

const withEmailFormSchema = z.object({
  email: z.string().email().min(1),
  requirePassword: z.literal(false),
  password: z.string().optional(),
});

const withCredentialsFormSchema = z.object({
  email: z.string().email().min(1),
  requirePassword: z.literal(true),
  password: z.string().min(1),
});

const loginFormSchema = z.union([
  withEmailFormSchema,
  withCredentialsFormSchema,
]);

export function LoginForm({
  loginWithCredentials,
  onSubmitLoginWithCredentials,
  loginWithEmail,
  onSubmitLoginWithEmail,
  defaults,
  disablePasswordLogin,
  className,
}: BuilderLoginFormProps) {
  const {
    elements: { Alert, TextField },
  } = useWebsiteBuilder();
  const [showStandByMessage, setShowStandByMessage] = useState(false);

  type FormInput = z.infer<typeof loginFormSchema>;
  const { handleSubmit, control, watch, setValue, setFocus, register } =
    useForm<FormInput>({
      resolver: zodResolver(loginFormSchema),
      defaultValues: {
        email: defaults?.email || '',
        password: '',
        requirePassword: defaults?.requirePassword || false,
      },
      mode: 'onSubmit',
      reValidateMode: 'onBlur',
    });

  const onSubmit = handleSubmit(({ email, requirePassword, password }) => {
    if (requirePassword) {
      setShowStandByMessage(true);
      return onSubmitLoginWithCredentials(email, password);
    }

    return onSubmitLoginWithEmail(email);
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

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

  return (
    <LoginFormWrapper className={className}>
      {!disablePasswordLogin && (
        <FormControlLabel
          control={
            <Checkbox
              checked={loginWithPassword}
              onChange={event =>
                setValue('requirePassword', event.target.checked)
              }
            />
          }
          label="Login mit Passwort"
        />
      )}

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
              label={'Email'}
              error={!!error}
              helperText={error?.message}
              {...register('email')}
            />
          )}
        />

        {watch('requirePassword') && (
          <Controller
            name={'password'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                autoComplete="current-password"
                type={'password'}
                fullWidth
                label={'Passwort'}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        )}

        {showStandByMessage && !error && !loginLinkSent && (
          <Alert severity="info">
            Einen Moment bitte, die eingegebenen Anmeldedaten werden
            überprüft...
          </Alert>
        )}

        {error && (
          <Alert severity="error">
            Die eingegebenen Anmeldedaten sind ungültig.
          </Alert>
        )}

        {loginLinkSent && (
          <Alert severity="success">
            Falls ein Account unter der Email &quot;
            {loginWithEmail.data?.sendWebsiteLogin}&quot; besteht, sollte bald
            ein Login-Link in deinem Email Postfach sein. Dies kann einen Moment
            dauern. Bitte prüfe auch deinen Spam-Ordner.
          </Alert>
        )}

        <LoginFormButton
          disabled={loading || loginLinkSent}
          type="submit"
          onClick={onSubmit}
        >
          {!loginWithPassword &&
            (loginLinkSent ? 'Login-Link versendet' : 'Login-Link anfordern')}

          {loginWithPassword && 'Login'}
        </LoginFormButton>
      </LoginFormForm>
    </LoginFormWrapper>
  );
}
