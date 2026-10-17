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
import { useUser } from '@wepublish/authentication/website';
import { Button, useWebsiteBuilder } from '@wepublish/website/builder';
import { NextPage, NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withAuthGuard } from '../../auth-guard';
import { ssrAuthLink } from '../../auth-link';
import { getSessionTokenProps } from '../../get-session-token-props';
import { getApiUrl } from '../../api-url';
import { WelcomeEmailInfo } from './welcome-email-info';
import { WelcomeIntro } from './welcome-intro';
import { WelcomeText } from './welcome-text';
import { useResendCountdown } from './use-resend-countdown';

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

// Right-aligned and laid out right to left: the main action comes first in
// each row (and keeps the first tab stop) but sits furthest right.
const WelcomeActions = styled('div')`
  display: flex;
  flex-direction: row-reverse;
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
  const { refreshUser } = useUser();
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
  const [resendSeconds, markSent] = useResendCountdown();

  const session = sessionData?.currentSession;
  const placeholderEmail = session?.placeholderEmail ?? false;
  const restricted = session?.restricted ?? false;
  const secondFactor = session?.secondFactor ?? LoginCodeSecondFactor.None;
  // A session from a personal login code proves it holds the letter whenever
  // it enters a new address, placeholder or real.
  const needsSecondFactor =
    restricted &&
    (placeholderEmail || changeEmail) &&
    secondFactor !== LoginCodeSecondFactor.None;
  // Decided by the API, which enforces the same rule on the change itself.
  const canReplaceEmail = session?.canReplaceEmail ?? false;
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

  // The profile reads the user from the session provider, which fetched them
  // when this page opened; the address confirmed since then is not in there.
  useEffect(() => {
    if (step === 'done') {
      refreshUser().finally(() => router.replace(profilePath));
    }
  }, [step, router, profilePath, refreshUser]);

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();

    // A refused request stays on this step, where its message is shown; only
    // a mail that actually went out may be announced as sent.
    const sent = await (
      placeholderEmail || changeEmail ?
        requestEmailChange({
          variables: {
            newEmail,
            secondFactor: needsSecondFactor ? secondFactorAnswer : undefined,
          },
        })
      : requestEmailVerification()).then(
      ({ error }) => !error,
      () => false
    );

    if (!sent) {
      return;
    }

    setSentTo(placeholderEmail || changeEmail ? newEmail : currentEmail);
    markSent();
    setStep('emailSent');
  };

  // Back to where the address entry was opened from: the intro for a
  // placeholder address, the confirmation of the current one otherwise.
  const cancelEmailEntry = () => {
    setNewEmail('');
    setSecondFactorAnswer('');
    emailChange.reset();

    if (changeEmail) {
      setChangeEmail(false);
    } else {
      setStep('intro');
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    await updatePassword({ variables: { password, passwordRepeated } });
    setStep('done');
  };

  const emailError = emailChange.error ?? emailVerification.error;
  // The API allows one confirmation mail a minute. Being asked to wait is
  // not a mistake, so it reads as a note rather than an error.
  const emailCoolingDown = !!emailError?.message.includes(
    'Please wait a moment'
  );
  const emailErrorMessage =
    emailCoolingDown ? null
    : emailError?.message.includes('SECOND_FACTOR_INVALID') ?
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
            <WelcomeIntro placeholderEmail={placeholderEmail} />
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
              <WelcomeEmailInfo email={currentEmail} />
            </Paragraph>
          }

          {emailCoolingDown && (
            <Alert severity="info">{t('welcome.resendTooSoon')}</Alert>
          )}

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

            {/* A session from a personal login code may replace a real address
                only where the API allows it (with the second factor from the
                letter), so a stranger holding the letter can't take the
                account over. */}
            {!placeholderEmail &&
              !changeEmail &&
              (!restricted || canReplaceEmail) && (
                <Button
                  variant="text"
                  onClick={() => setChangeEmail(true)}
                >
                  {restricted ?
                    t('welcome.emailOutdated')
                  : t('welcome.emailChange')}
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

            {(placeholderEmail || changeEmail) && (
              <Button
                variant="text"
                onClick={cancelEmailEntry}
              >
                {t('welcome.back')}
              </Button>
            )}
          </WelcomeActions>
        </WelcomeForm>
      )}

      {step === 'emailSent' && (
        <>
          <H4 component="h1">{t('welcome.emailSentTitle')}</H4>
          <Paragraph>
            <WelcomeEmailInfo
              i18nKey="welcome.emailSent"
              email={sentTo ?? ''}
            />
          </Paragraph>

          <WelcomeActions>
            <Button
              variant="text"
              disabled={resendSeconds > 0}
              onClick={() => setStep('email')}
            >
              {resendSeconds > 0 ?
                t('welcome.resendIn', { seconds: resendSeconds })
              : t('welcome.resend')}
            </Button>
          </WelcomeActions>
        </>
      )}

      {step === 'password' && (
        <WelcomeForm onSubmit={submitPassword}>
          <H4 component="h1">{t('welcome.passwordTitle')}</H4>
          <Paragraph>
            <WelcomeText i18nKey="welcome.passwordInfo" />
          </Paragraph>

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
