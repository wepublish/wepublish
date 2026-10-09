import {
  ConfirmEmailChangeDocument,
  getApiClient,
} from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { NextPage, NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ssrAuthLink } from '../auth-link';
import { getSessionTokenProps } from '../get-session-token-props';
import { getApiUrl } from '../api-url';

export type ConfirmEmailPageProps = {
  confirmed?: boolean;
  error?: string | null;
};

export type ConfirmEmailPageOptions = {
  redirectTo?: string;
  loginPath?: string;
};

const redirect = (ctx: NextPageContext, location: string) => {
  if (ctx.res && !ctx.res.headersSent) {
    ctx.res.writeHead(302, { Location: location });
    ctx.res.end();
  }
};

export const createConfirmEmailPage = ({
  redirectTo = '/profile?emailConfirmed=1',
  loginPath = '/login',
}: ConfirmEmailPageOptions = {}) => {
  const ConfirmEmailPage: NextPage<ConfirmEmailPageProps> = ({
    confirmed,
    error,
  }) => {
    const {
      elements: { Alert },
    } = useWebsiteBuilder();
    const { t } = useTranslation();
    const router = useRouter();

    useEffect(() => {
      if (router.query.token) {
        const { token: _, ...query } = router.query;
        router.replace({ pathname: router.pathname, query }, undefined, {
          shallow: true,
        });
      }
    }, [router]);

    return (
      <>
        {confirmed && (
          <Alert severity="success">{t('user.emailChangeConfirmed')}</Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        <Link href={loginPath}>{t('user.emailConfirmedLogin')}</Link>
      </>
    );
  };

  ConfirmEmailPage.getInitialProps = async (
    ctx: NextPageContext
  ): Promise<ConfirmEmailPageProps> => {
    if (typeof window !== 'undefined') {
      return {};
    }

    const token = typeof ctx.query.token === 'string' ? ctx.query.token : null;

    if (!token) {
      redirect(ctx, loginPath);
      return {};
    }

    const { sessionToken } = await getSessionTokenProps(ctx);
    const client = getApiClient(getApiUrl(), [
      ssrAuthLink(sessionToken?.token),
    ]);

    const { data, error } = await client.mutate({
      mutation: ConfirmEmailChangeDocument,
      variables: { token },
      errorPolicy: 'all',
    });

    if (error || !data?.confirmEmailChange) {
      return {
        error: error?.message || 'Invalid or expired confirmation link.',
      };
    }

    if (sessionToken) {
      redirect(ctx, redirectTo);
    }

    return { confirmed: true };
  };

  return ConfirmEmailPage;
};

export const ConfirmEmailPage = createConfirmEmailPage();
