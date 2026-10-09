import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  addClientCacheToProps,
  CurrentSessionDocument,
  getApiClient,
  LoginCodeSecondFactor,
  MeDocument,
  RequestEmailChangeDocument,
  RequestEmailVerificationDocument,
  UpdatePasswordDocument,
} from '@wepublish/website/api';
import { Button, useWebsiteBuilder } from '@wepublish/website/builder';
import { NextPage, NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withAuthGuard } from '../../auth-guard';
import { ssrAuthLink } from '../../auth-link';
import { getSessionTokenProps } from '../../get-session-token-props';
import { getApiUrl } from '../../api-url';

type Step = 'intro' | 'email' | 'emailSent' | 'password' | 'done';

const SECOND_FACTOR_AUTOCOMPLETE: Record<LoginCodeSecondFactor, string> = {
  [LoginCodeSecondFactor.None]: 'off',
  [LoginCodeSecondFactor.PostalCode]: 'postal-code',
  [LoginCodeSecondFactor.City]: 'address-level2',
  [LoginCodeSecondFactor.FirstName]: 'given-name',
  [LoginCodeSecondFactor.LastName]: 'family-name',
};

export type WelcomePageProps = {
  className?: string;
  profilePath?: string;
};

const WelcomeWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 600px;
  justify-self: center;
  width: 100%;
`;

const WelcomeForm = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const WelcomeActions = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
`;

function WelcomePageComponent({
  className,
  profilePath = '/profile',
}: WelcomePageProps) {
  const {
    elements: { Alert, H4, Paragraph, TextField },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: meData } = useQuery(MeDocument);
  const { data: sessionData, refetch: refetchSession } = useQuery(
    CurrentSessionDocument,
    { fetchPolicy: 'network-only' }
  );
  const [requestEmailChange, emailChange] = useMutation(
    RequestEmailChangeDocument
  );
  const [requestEmailVerification, emailVerification] = useMutation(
    RequestEmailVerificationDocument
  );
  const [updatePassword, passwordUpdate] = useMutation(UpdatePasswordDocument);

  const [step, setStep] = useState<Step>(
    router.query.emailConfirmed ? 'password' : 'intro'
  );
  const [changeEmail, setChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [secondFactorAnswer, setSecondFactorAnswer] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeated, setPasswordRepeated] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const session = sessionData?.currentSession;
  const placeholderEmail = session?.placeholderEmail ?? false;
  const restricted = session?.restricted ?? false;
  const secondFactor = session?.secondFactor ?? LoginCodeSecondFactor.None;
  const needsSecondFactor =
    restricted &&
    placeholderEmail &&
    secondFactor !== LoginCodeSecondFactor.None;
  const currentEmail = meData?.me?.email ?? '';

  useEffect(() => {
    if (step !== 'emailSent') {
      return;
    }

    const interval = setInterval(() => refetchSession(), 5000);
    const onFocus = () => refetchSession();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [step, refetchSession]);

  useEffect(() => {
    if (step === 'emailSent' && session && !restricted) {
      setStep('password');
    }
  }, [step, session, restricted]);

  useEffect(() => {
    if (step === 'done') {
      router.replace(profilePath);
    }
  }, [step, router, profilePath]);

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();

    if (placeholderEmail || changeEmail) {
      await requestEmailChange({
        variables: {
          newEmail,
          secondFactor: needsSecondFactor ? secondFactorAnswer : undefined,
        },
      });
      setSentTo(newEmail);
    } else {
      await requestEmailVerification();
      setSentTo(currentEmail);
    }

    setStep('emailSent');
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    await updatePassword({ variables: { password, passwordRepeated } });
    setStep('done');
  };

  const emailError = emailChange.error ?? emailVerification.error;
  const emailErrorMessage =
    emailError?.message.includes('SECOND_FACTOR_INVALID') ?
      t('welcome.secondFactorInvalid')
    : emailError?.message.includes('TOO_MANY_ATTEMPTS') ?
      t('welcome.tooManyAttempts')
    : emailError?.message;

  return (
    <WelcomeWrapper className={className}>
      {step === 'intro' && (
        <>
          <H4 component="h1">{t('welcome.title')}</H4>
          <Paragraph>
            {placeholderEmail ?
              t('welcome.introPlaceholder')
            : t('welcome.intro')}
          </Paragraph>

          <WelcomeActions>
            <Button onClick={() => setStep('email')}>
              {t('welcome.continue')}
            </Button>

            {!restricted && (
              <Button
                variant="text"
                onClick={() => setStep('done')}
              >
                {t('welcome.toProfile')}
              </Button>
            )}
          </WelcomeActions>
        </>
      )}

      {step === 'email' && (
        <WelcomeForm onSubmit={submitEmail}>
          <H4 component="h1">{t('welcome.emailTitle')}</H4>

          {placeholderEmail || changeEmail ?
            <>
              <Paragraph>{t('welcome.emailPlaceholderInfo')}</Paragraph>
              <TextField
                value={newEmail}
                onChange={event => setNewEmail(event.target.value)}
                type="email"
                autoComplete="email"
                fullWidth
                label={t('welcome.emailLabel')}
              />

              {needsSecondFactor && (
                <>
                  <Paragraph>{t('welcome.secondFactorInfo')}</Paragraph>
                  <TextField
                    value={secondFactorAnswer}
                    onChange={event =>
                      setSecondFactorAnswer(event.target.value)
                    }
                    autoComplete={SECOND_FACTOR_AUTOCOMPLETE[secondFactor]}
                    fullWidth
                    label={t(`welcome.secondFactor.${secondFactor}`)}
                  />
                </>
              )}
            </>
          : <Paragraph>
              {t('welcome.emailVerifyInfo', { email: currentEmail })}
            </Paragraph>
          }

          {emailErrorMessage && (
            <Alert severity="error">{emailErrorMessage}</Alert>
          )}

          <WelcomeActions>
            <Button
              type="submit"
              disabled={
                emailChange.loading ||
                emailVerification.loading ||
                ((placeholderEmail || changeEmail) && !newEmail) ||
                (needsSecondFactor && !secondFactorAnswer.trim())
              }
            >
              {placeholderEmail || changeEmail ?
                t('welcome.emailSubmit')
              : t('welcome.emailVerify')}
            </Button>

            {!placeholderEmail && !changeEmail && (
              <Button
                variant="text"
                onClick={() => setChangeEmail(true)}
              >
                {t('welcome.emailChange')}
              </Button>
            )}

            {!restricted && (
              <Button
                variant="text"
                onClick={() => setStep('password')}
              >
                {t('welcome.skip')}
              </Button>
            )}
          </WelcomeActions>
        </WelcomeForm>
      )}

      {step === 'emailSent' && (
        <>
          <H4 component="h1">{t('welcome.emailSentTitle')}</H4>
          <Paragraph>{t('welcome.emailSent', { email: sentTo })}</Paragraph>

          <WelcomeActions>
            <Button
              variant="text"
              onClick={() => setStep('email')}
            >
              {t('welcome.resend')}
            </Button>
          </WelcomeActions>
        </>
      )}

      {step === 'password' && (
        <WelcomeForm onSubmit={submitPassword}>
          <H4 component="h1">{t('welcome.passwordTitle')}</H4>
          <Paragraph>{t('welcome.passwordInfo')}</Paragraph>

          <TextField
            value={password}
            onChange={event => setPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            fullWidth
            label={t('welcome.password')}
          />
          <TextField
            value={passwordRepeated}
            onChange={event => setPasswordRepeated(event.target.value)}
            type="password"
            autoComplete="new-password"
            fullWidth
            label={t('welcome.passwordRepeat')}
          />

          {passwordUpdate.error && (
            <Alert severity="error">{passwordUpdate.error.message}</Alert>
          )}

          <WelcomeActions>
            <Button
              type="submit"
              disabled={
                passwordUpdate.loading ||
                !password ||
                password !== passwordRepeated
              }
            >
              {t('welcome.passwordSubmit')}
            </Button>

            <Button
              variant="text"
              onClick={() => setStep('done')}
            >
              {t('welcome.skip')}
            </Button>
          </WelcomeActions>
        </WelcomeForm>
      )}

      {step === 'done' && <Paragraph>{t('welcome.redirecting')}</Paragraph>}
    </WelcomeWrapper>
  );
}

const GuardedWelcome = withAuthGuard(
  WelcomePageComponent
) as NextPage<WelcomePageProps>;

GuardedWelcome.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }

  const sessionProps = await getSessionTokenProps(ctx);
  const client = getApiClient(getApiUrl(), [
    ssrAuthLink(sessionProps.sessionToken?.token),
  ]);

  if (sessionProps.sessionToken) {
    await Promise.all([
      client.query({ query: MeDocument }),
      client.query({ query: CurrentSessionDocument }),
    ]);
  }

  return addClientCacheToProps(client, sessionProps);
};

export { GuardedWelcome as WelcomePage };
