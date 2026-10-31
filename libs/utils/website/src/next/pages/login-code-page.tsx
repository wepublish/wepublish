import {
  AuthTokenStorageKey,
  useUser,
} from '@wepublish/authentication/website';
import {
  getApiClient,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import styled from '@emotion/styled';
import { Button, useWebsiteBuilder } from '@wepublish/website/builder';
import { setCookie } from 'cookies-next';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../../lib/api-url';
import { redeemLoginCode } from '../../lib/handle-login-code';

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

export type LoginCodePageProps =
  | { sessionToken: SessionWithTokenWithoutUser; next: string }
  | { failure: LoginCodeFailure };

export type LoginCodePageOptions = {
  next?: string;
  loginPath?: string;
};

const FailedActions = styled('div')`
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const createLoginCodePage = ({
  next = '/welcome?src=purl',
  loginPath = '/login',
}: LoginCodePageOptions = {}) => {
  const Redeemed = ({
    sessionToken,
    next: target,
  }: {
    sessionToken: SessionWithTokenWithoutUser;
    next: string;
  }) => {
    const { setToken } = useUser();
    const router = useRouter();
    const { t } = useTranslation();
    const {
      elements: { Paragraph },
    } = useWebsiteBuilder();

    useEffect(() => {
      setToken(sessionToken).then(() => router.replace(target));
    }, [sessionToken, setToken, router, target]);

    return <Paragraph>{t('welcome.redirecting')}</Paragraph>;
  };

  // Says why the link didn't work instead of passing the reader on: an open
  // session is offered, not silently continued.
  const Failed = ({ failure }: { failure: LoginCodeFailure }) => {
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

  const Page: NextPage<LoginCodePageProps> = props =>
    'failure' in props ?
      <Failed failure={props.failure} />
    : <Redeemed {...props} />;

  const getServerSideProps: GetServerSideProps<LoginCodePageProps> = async ({
    params,
    req,
    res,
  }) => {
    const code = typeof params?.code === 'string' ? params.code : '';
    const client = getApiClient(getApiUrl(), []);
    const result = await redeemLoginCode(client, code);

    if (result.kind === 'totpRequired') {
      return {
        redirect: {
          destination: `${loginPath}?loginCode=${encodeURIComponent(code)}&totpRequired=1`,
          permanent: false,
        },
      };
    }

    if (result.kind === 'challengeRequired') {
      return {
        redirect: {
          destination: `${loginPath}?loginCode=${encodeURIComponent(code)}&challenge=1`,
          permanent: false,
        },
      };
    }

    if (result.kind === 'failed') {
      return { props: { failure: loginCodeFailure(result.message) } };
    }

    const sessionToken: SessionWithTokenWithoutUser = {
      __typename: 'SessionWithTokenWithoutUser',
      token: result.session.token,
      createdAt: result.session.createdAt,
      expiresAt: result.session.expiresAt,
    };

    setCookie(AuthTokenStorageKey, JSON.stringify(sessionToken), {
      req,
      res,
      expires: new Date(sessionToken.expiresAt),
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return { props: { sessionToken, next } };
  };

  return { Page, getServerSideProps };
};
