import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { ResetPasswordWithTokenDocument } from '@wepublish/editor/api';
import { LoginTemplate } from '@wepublish/ui/editor';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { Background } from './ui/loginBackground';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin: 0;
`;

const Description = styled.p`
  text-align: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.vars.palette.primary.main};
  cursor: pointer;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export function SetNewPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('jwt');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [success, setSuccess] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [error, setError] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const passwordRepeatInputRef = useRef<HTMLInputElement>(null);
  const goToLoginRef = useRef<HTMLAnchorElement>(null);
  const { t } = useTranslation();

  const [resetPassword, { loading }] = useMutation(
    ResetPasswordWithTokenDocument
  );

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (success) {
      goToLoginRef.current?.focus();
    }
  }, [success]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!password || !passwordRepeat) {
      return;
    }

    setError('');

    if (password !== passwordRepeat) {
      setMismatch(true);
      passwordRepeatInputRef.current?.focus();
      return;
    }

    if (!token) {
      setError(t('setNewPassword.invalidLink'));
      return;
    }

    try {
      await resetPassword({ variables: { token, password } });
      setSuccess(true);
    } catch (error: any) {
      setError(error?.message || t('setNewPassword.error'));
    }
  }

  return (
    <LoginTemplate
      title={t('setNewPassword.submit')}
      backgroundChildren={<Background />}
    >
      <Form>
        <Stack
          direction="column"
          spacing={3}
        >
          <Description role="status">
            {success ?
              t('setNewPassword.success')
            : t('setNewPassword.description')}
          </Description>

          {success ?
            <BackLink
              ref={goToLoginRef}
              href="/login"
            >
              {t('setNewPassword.goToLogin')}
            </BackLink>
          : <>
              <TextField
                label={<>{t('setNewPassword.password')}</>}
                inputRef={passwordInputRef}
                name="password"
                type="password"
                value={password}
                autoComplete="new-password"
                onChange={event => {
                  setPassword(event.target.value);
                  setMismatch(false);
                }}
                fullWidth
              />

              <TextField
                label={<>{t('setNewPassword.passwordRepeat')}</>}
                inputRef={passwordRepeatInputRef}
                name="passwordRepeat"
                type="password"
                value={passwordRepeat}
                autoComplete="new-password"
                error={mismatch}
                helperText={mismatch ? t('setNewPassword.mismatch') : undefined}
                onChange={event => {
                  setPasswordRepeat(event.target.value);
                  setMismatch(false);
                }}
                fullWidth
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Button
                variant="contained"
                type="submit"
                disabled={loading || !password || !passwordRepeat}
                onClick={handleSubmit}
              >
                {t('setNewPassword.submit')}
              </Button>

              <BackLink href="/login">
                {t('resetPassword.backToLogin')}
              </BackLink>
            </>
          }
        </Stack>
      </Form>
    </LoginTemplate>
  );
}
