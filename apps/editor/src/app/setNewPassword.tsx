import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { ResetPasswordWithTokenDocument } from '@wepublish/editor/api';
import { enqueueSnackbar, LoginTemplate } from '@wepublish/ui/editor';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Form as RForm } from 'rsuite';

import { Background } from './ui/loginBackground';

const { Group, Label, Control } = RForm;

const Form = styled(RForm)`
  display: flex;
  flex-direction: column;
  margin: 0;
`;

const Description = styled.p`
  text-align: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--rs-text-secondary);
`;

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 12px;
  font-size: 13px;
  color: var(--rs-text-link);
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
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [resetPassword, { loading }] = useMutation(
    ResetPasswordWithTokenDocument
  );

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!password || !passwordRepeat) return;

    if (password !== passwordRepeat) {
      enqueueSnackbar(t('setNewPassword.mismatch'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
      return;
    }

    if (!token) {
      enqueueSnackbar(t('setNewPassword.invalidLink'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
      return;
    }

    try {
      await resetPassword({ variables: { token, password } });
      setSuccess(true);
    } catch (error: any) {
      enqueueSnackbar(error?.message || t('setNewPassword.error'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      <Form>
        <RForm.Stack fluid>
          {success ?
            <>
              <Description>{t('setNewPassword.success')}</Description>
              <BackLink href="/login">{t('setNewPassword.goToLogin')}</BackLink>
            </>
          : <>
              <Description>{t('setNewPassword.description')}</Description>

              <Group controlId="newPassword">
                <Label>{t('setNewPassword.password')}</Label>
                <Control
                  inputRef={passwordInputRef}
                  name="password"
                  type="password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(value: string) => setPassword(value)}
                />
              </Group>

              <Group controlId="newPasswordRepeat">
                <Label>{t('setNewPassword.passwordRepeat')}</Label>

                <Control
                  name="passwordRepeat"
                  type="password"
                  value={passwordRepeat}
                  autoComplete="new-password"
                  onChange={(value: string) => setPasswordRepeat(value)}
                />
              </Group>

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
        </RForm.Stack>
      </Form>
    </LoginTemplate>
  );
}
