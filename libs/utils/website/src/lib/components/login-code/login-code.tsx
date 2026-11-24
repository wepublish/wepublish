import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { Button, useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginCodeRedemption } from '../../handle-login-code';

/**
 * The personal login link (`/l/<code>`), as far as it does not depend on the
 * framework: what became of the code, and the two things the page can show.
 * The Next and the TanStack page redeem the code on the server and wrap these.
 */

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

/** What the server hands the page once it has tried the code. */
export type LoginCodeOutcome =
  | { kind: 'ok'; sessionToken: SessionWithTokenWithoutUser }
  | { kind: 'totpRequired' }
  | { kind: 'challengeRequired' }
  | { kind: 'failed'; failure: LoginCodeFailure };

export const loginCodeOutcome = (
  redemption: LoginCodeRedemption
): LoginCodeOutcome => {
  if (redemption.kind === 'failed') {
    return { kind: 'failed', failure: loginCodeFailure(redemption.message) };
  }

  if (redemption.kind !== 'ok') {
    return { kind: redemption.kind };
  }

  return {
    kind: 'ok',
    sessionToken: {
      __typename: 'SessionWithTokenWithoutUser',
      token: redemption.session.token,
      createdAt: redemption.session.createdAt,
      expiresAt: redemption.session.expiresAt,
    },
  };
};

/** Where a code that needs another step is finished: the login form. */
export const loginCodeStepHref = (
  loginPath: string,
  code: string,
  step: 'totpRequired' | 'challengeRequired'
) =>
  `${loginPath}?loginCode=${encodeURIComponent(code)}&${
    step === 'totpRequired' ? 'totpRequired=1' : 'challenge=1'
  }`;

const FailedActions = styled('div')`
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
`;

/** Takes over the session the code opened, then lets the page move on. */
export const LoginCodeRedeemed = ({
  sessionToken,
  onRedeemed,
}: {
  sessionToken: SessionWithTokenWithoutUser;
  onRedeemed: () => void;
}) => {
  const { setToken } = useUser();
  const { t } = useTranslation();
  const {
    elements: { Paragraph },
  } = useWebsiteBuilder();

  useEffect(() => {
    setToken(sessionToken).then(onRedeemed);
    // `onRedeemed` navigates: once per session, whatever identity it has.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, setToken]);

  return <Paragraph>{t('welcome.redirecting')}</Paragraph>;
};

// Says why the link didn't work instead of passing the reader on: an open
// session is offered, not silently continued.
export const LoginCodeFailed = ({
  failure,
  loginPath = '/login',
}: {
  failure: LoginCodeFailure;
  loginPath?: string;
}) => {
  const { hasUser } = useUser();
  const { t } = useTranslation();
  const {
    elements: { H4, Paragraph, Link },
  } = useWebsiteBuilder();

  return (
    <>
      <H4 component="h1">{t('login.code.failed.title')}</H4>
      <Paragraph>{t(`login.code.failed.${failure}`)}</Paragraph>

      <FailedActions>
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
      </FailedActions>
    </>
  );
};
