import { useApolloClient } from '@apollo/client/react';
import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { Button, useWebsiteBuilder } from '@wepublish/website/builder';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { redeemLoginCode } from '../../handle-login-code';

export type LoginCodeFailure =
  'invalid' | 'disabled' | 'inactive' | 'tooManyAttempts';

/** Why the API refused a login code, as far as the reader needs to know. */
export const loginCodeFailure = (message: string): LoginCodeFailure => {
  if (message.includes('LOGIN_CODE_DISABLED')) {
    return 'disabled';
  }

  if (message.includes('not active')) {
    return 'inactive';
  }

  if (message.includes('TOO_MANY_ATTEMPTS')) {
    return 'tooManyAttempts';
  }

  // Used up, revoked, expired or mistyped: the reader can't tell them apart
  // and has the same way out.
  return 'invalid';
};

/** What the login page has to ask for before the code logs anyone in. */
export type LoginCodeStep = 'totpRequired' | 'challenge';

export type LoginCodeConfirmProps = {
  code: string;
  loginPath: string;
  /** The session is stored; go on to the next page. */
  onRedeemed: () => void;
  onStep: (step: LoginCodeStep) => void;
};

const Actions = styled('div')`
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
`;

type State =
  | { state: 'waiting' }
  | { state: 'redeeming' }
  | { state: 'failed'; failure: LoginCodeFailure };

/**
 * The page behind a personal login link. Opening it redeems nothing: mail
 * programs and link scanners open every link before the reader does, and each
 * redemption costs the code one of its uses and hands out a session. Only the
 * reader's click logs in, from the browser, so the API also counts attempts
 * against the visitor and not against the website's server.
 */
export const LoginCodeConfirm = ({
  code,
  loginPath,
  onRedeemed,
  onStep,
}: LoginCodeConfirmProps) => {
  const client = useApolloClient();
  const { hasUser, setToken } = useUser();
  const { t } = useTranslation();
  const {
    elements: { H4, Paragraph, Link },
  } = useWebsiteBuilder();
  const [current, setCurrent] = useState<State>({ state: 'waiting' });

  const logIn = async () => {
    setCurrent({ state: 'redeeming' });

    const result = await redeemLoginCode(client, code);

    if (result.kind === 'totpRequired') {
      return onStep('totpRequired');
    }

    if (result.kind === 'challengeRequired') {
      return onStep('challenge');
    }

    if (result.kind === 'failed') {
      return setCurrent({
        state: 'failed',
        failure: loginCodeFailure(result.message),
      });
    }

    const sessionToken: SessionWithTokenWithoutUser = {
      __typename: 'SessionWithTokenWithoutUser',
      token: result.session.token,
      createdAt: result.session.createdAt,
      expiresAt: result.session.expiresAt,
    };

    await setToken(sessionToken);
    onRedeemed();
  };

  // Says why the link didn't work instead of passing the reader on: an open
  // session is offered, not silently continued.
  if (current.state === 'failed') {
    return (
      <>
        <H4 component="h1">{t('login.code.failed.title')}</H4>
        <Paragraph>{t(`login.code.failed.${current.failure}`)}</Paragraph>

        <Actions>
          {hasUser && (
            <Button
              LinkComponent={Link}
              href="/"
            >
              {t('login.code.failed.continue')}
            </Button>
          )}

          <Button
            LinkComponent={Link}
            href={loginPath}
            variant={hasUser ? 'text' : 'contained'}
          >
            {t('login.code.failed.toLogin')}
          </Button>
        </Actions>
      </>
    );
  }

  return (
    <>
      <H4 component="h1">{t('login.code.confirm.title')}</H4>
      <Paragraph>{t('login.code.confirm.info')}</Paragraph>

      <Actions>
        <Button
          onClick={logIn}
          disabled={current.state === 'redeeming'}
        >
          {t('login.code.submit')}
        </Button>
      </Actions>
    </>
  );
};
