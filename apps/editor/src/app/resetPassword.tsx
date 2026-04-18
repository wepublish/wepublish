import styled from '@emotion/styled';
import { useSendWebsiteLoginMutation } from '@wepublish/editor/api';
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

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [sent, setSent] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [sendLoginLink, { loading }] = useSendWebsiteLoginMutation();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email) return;

    try {
      await sendLoginLink({ variables: { email } });
    } catch {
      // Swallow error - always show success to prevent enumeration
    }

    setSent(true);
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      <Form fluid>
        <Description>
          {sent ? t('resetPassword.sent') : t('resetPassword.description')}
        </Description>

        {!sent && (
          <>
            <Group controlId="resetEmail">
              <ControlLabel>{t('login.email')}</ControlLabel>
              <Control
                inputRef={emailInputRef}
                name="email"
                value={email}
                autoComplete="email"
                onChange={(value: string) => setEmail(value)}
              />
            </Group>
            <Button
              appearance="primary"
              type="submit"
              disabled={loading || !email}
              onClick={handleSubmit}
            >
              {t('resetPassword.submit')}
            </Button>
          </>
        )}

        <BackLink href="/login">{t('resetPassword.backToLogin')}</BackLink>
      </Form>
    </LoginTemplate>
  );
}
