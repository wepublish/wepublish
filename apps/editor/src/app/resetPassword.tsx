import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { SendPasswordResetEmailDocument } from '@wepublish/editor/api';
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

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [sent, setSent] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [sendPasswordReset, { loading }] = useMutation(
    SendPasswordResetEmailDocument
  );

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email) return;

    try {
      await sendPasswordReset({ variables: { email } });
    } catch (error: any) {
      // If template not configured, show the actual error
      if (error?.message?.includes('not configured')) {
        enqueueSnackbar(t('resetPassword.notConfigured'), {
          variant: 'error',
          autoHideDuration: null,
        });
        return;
      }
      // For any other error, still show success (anti-enumeration)
    }

    setSent(true);
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      <Form>
        <RForm.Stack fluid>
          <Description>
            {sent ? t('resetPassword.sent') : t('resetPassword.description')}
          </Description>

          {!sent && (
            <>
              <Group controlId="resetEmail">
                <Label>{t('login.email')}</Label>
                <Control
                  inputRef={emailInputRef}
                  name="email"
                  value={email}
                  autoComplete="email"
                  onChange={(value: string) => setEmail(value)}
                />
              </Group>

              <Button
                variant="contained"
                type="submit"
                disabled={loading || !email}
                onClick={handleSubmit}
              >
                {t('resetPassword.submit')}
              </Button>
            </>
          )}

          <BackLink href="/login">{t('resetPassword.backToLogin')}</BackLink>
        </RForm.Stack>
      </Form>
    </LoginTemplate>
  );
}
