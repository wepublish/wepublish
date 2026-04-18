import styled from '@emotion/styled';
import { useResetPasswordWithTokenMutation } from '@wepublish/editor/api';
import { LoginTemplate } from '@wepublish/ui/editor';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button, Form as RForm, Message, toaster } from 'rsuite';
import { Background } from './ui/loginBackground';

const { Group, ControlLabel, Control } = RForm;

const Form = styled(RForm)`
  display: flex;
  flex-direction: column;
  margin: 0;
`;

const Description = styled.p`
  text-align: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: #555;
`;

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 12px;
  font-size: 13px;
  color: #1675e0;
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

  const [resetPassword, { loading }] = useResetPasswordWithTokenMutation();

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!password || !passwordRepeat) return;

    if (password !== passwordRepeat) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={5000}
        >
          {t('setNewPassword.mismatch')}
        </Message>
      );
      return;
    }

    if (!token) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={5000}
        >
          {t('setNewPassword.invalidLink')}
        </Message>
      );
      return;
    }

    try {
      await resetPassword({ variables: { token, password } });
      setSuccess(true);
    } catch (error: any) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={5000}
        >
          {error?.message || t('setNewPassword.error')}
        </Message>
      );
    }
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      <Form fluid>
        {success ?
          <>
            <Description>{t('setNewPassword.success')}</Description>
            <BackLink href="/login">{t('setNewPassword.goToLogin')}</BackLink>
          </>
        : <>
            <Description>{t('setNewPassword.description')}</Description>

            <Group controlId="newPassword">
              <ControlLabel>{t('setNewPassword.password')}</ControlLabel>
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
              <ControlLabel>{t('setNewPassword.passwordRepeat')}</ControlLabel>
              <Control
                name="passwordRepeat"
                type="password"
                value={passwordRepeat}
                autoComplete="new-password"
                onChange={(value: string) => setPasswordRepeat(value)}
              />
            </Group>
            <Button
              appearance="primary"
              type="submit"
              disabled={loading || !password || !passwordRepeat}
              onClick={handleSubmit}
            >
              {t('setNewPassword.submit')}
            </Button>
            <BackLink href="/login">{t('resetPassword.backToLogin')}</BackLink>
          </>
        }
      </Form>
    </LoginTemplate>
  );
}
