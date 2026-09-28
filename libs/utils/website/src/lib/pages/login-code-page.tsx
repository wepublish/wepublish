import {
  AuthTokenStorageKey,
  useUser,
} from '@wepublish/authentication/website';
import {
  getApiClient,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { setCookie } from 'cookies-next';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../api-url';
import { redeemLoginCode } from '../handle-login-code';

export type LoginCodePageProps = {
  sessionToken: SessionWithTokenWithoutUser;
  next: string;
};

export type LoginCodePageOptions = {
  next?: string;
  loginPath?: string;
};

export const createLoginCodePage = ({
  next = '/welcome?src=purl',
  loginPath = '/login',
}: LoginCodePageOptions = {}) => {
  const Page: NextPage<LoginCodePageProps> = ({
    sessionToken,
    next: target,
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
      return {
        redirect: {
          destination: `${loginPath}?error=${encodeURIComponent(result.message)}`,
          permanent: false,
        },
      };
    }

    const sessionToken: SessionWithTokenWithoutUser = {
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
