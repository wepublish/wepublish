import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, Stack, TextField } from '@mui/material';
import { SendPasswordResetEmailDocument } from '@wepublish/editor/api';
import { enqueueSnackbar, LoginTemplate } from '@wepublish/ui/editor';
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

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [sent, setSent] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const backLinkRef = useRef<HTMLAnchorElement>(null);
  const { t } = useTranslation();

  const [sendPasswordReset, { loading }] = useMutation(
    SendPasswordResetEmailDocument
  );

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (sent) {
      backLinkRef.current?.focus();
    }
  }, [sent]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email) {
      return;
    }

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
    <LoginTemplate
      title={t('resetPassword.title')}
      backgroundChildren={<Background />}
    >
      <Form>
        <Stack
          direction="column"
          spacing={3}
        >
          <Description role="status">
            {sent ? t('resetPassword.sent') : t('resetPassword.description')}
          </Description>

          {!sent && (
            <>
              <TextField
                label={<>{t('login.email')}</>}
                inputRef={emailInputRef}
                name="email"
                value={email}
                autoComplete="email"
                onChange={event => setEmail(event.target.value)}
                fullWidth
              />

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

          <BackLink
            ref={backLinkRef}
            href="/login"
          >
            {t('resetPassword.backToLogin')}
          </BackLink>
        </Stack>
      </Form>
    </LoginTemplate>
  );
}
