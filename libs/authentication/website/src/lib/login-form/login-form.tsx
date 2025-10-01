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
import { useCallback } from 'react';

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

const autofocus = (node: HTMLElement | null, focusDelay?: number) => {
  const inputNode = node?.querySelector('input') ?? node;

  if (focusDelay && focusDelay > 0) {
    (async () => {
      await new Promise(resolve => setTimeout(resolve, focusDelay));
      inputNode?.focus();
    })();

    return;
  }

  inputNode?.focus();
};

export function LoginForm({
  loginWithCredentials,
  onSubmitLoginWithCredentials,
  loginWithEmail,
  onSubmitLoginWithEmail,
  defaults,
  disablePasswordLogin,
  className,
  focusDelay,
}: BuilderLoginFormProps) {
  const {
    elements: { Alert, TextField },
  } = useWebsiteBuilder();

  type FormInput = z.infer<typeof loginFormSchema>;
  const { handleSubmit, control, watch, setValue } = useForm<FormInput>({
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
      onSubmitLoginWithCredentials(email, password);
    }

    return onSubmitLoginWithEmail(email);
  });

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

  const delayedAutofocus = useCallback(
    (node: HTMLElement | null) => {
      autofocus(node, Number(focusDelay));
    },
    [focusDelay]
  );

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
              ref={Number(focusDelay) > 0 ? delayedAutofocus : autofocus}
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

        {awaitingLoginConfirmed && (
          <Alert severity="info">
            Einen Moment bitte, die eingegebenen Anmeldedaten werden
            überprüft...
          </Alert>
        )}

        {error && <Alert severity="error">{error.message}</Alert>}

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
