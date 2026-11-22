import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import {
  getApiClient,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { setCookie } from 'cookies-next';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getApiUrl } from '../../lib/api-url';
import {
  LoginCodeFailed,
  LoginCodeFailure,
  loginCodeOutcome,
  LoginCodeRedeemed,
  loginCodeStepHref,
} from '../../lib/components/login-code/login-code';
import { redeemLoginCode } from '../../lib/handle-login-code';

export {
  loginCodeFailure,
  type LoginCodeFailure,
} from '../../lib/components/login-code/login-code';

export type LoginCodePageProps =
  | { sessionToken: SessionWithTokenWithoutUser; next: string }
  | { failure: LoginCodeFailure };

export type LoginCodePageOptions = {
  next?: string;
  loginPath?: string;
};

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
    const router = useRouter();

    return (
      <LoginCodeRedeemed
        sessionToken={sessionToken}
        onRedeemed={() => router.replace(target)}
      />
    );
  };

  const Page: NextPage<LoginCodePageProps> = props =>
    'failure' in props ?
      <LoginCodeFailed
        failure={props.failure}
        loginPath={loginPath}
      />
    : <Redeemed {...props} />;

  const getServerSideProps: GetServerSideProps<LoginCodePageProps> = async ({
    params,
    req,
    res,
  }) => {
    const code = typeof params?.code === 'string' ? params.code : '';
    const client = getApiClient(getApiUrl(), []);
    const outcome = loginCodeOutcome(await redeemLoginCode(client, code));

    if (outcome.kind === 'totpRequired' || outcome.kind === 'challengeRequired') {
      return {
        redirect: {
          destination: loginCodeStepHref(loginPath, code, outcome.kind),
          permanent: false,
        },
      };
    }

    if (outcome.kind === 'failed') {
      return { props: { failure: outcome.failure } };
    }

    const { sessionToken } = outcome;

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
