import { useMutation } from '@apollo/client/react';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { ConfirmEmailChangeDocument } from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useUser } from '@wepublish/authentication/website';
import { getCookie } from 'cookies-next';
import { NextPage, NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type ConfirmEmailPageProps = {
  token?: string | null;
};

export type ConfirmEmailPageOptions = {
  redirectTo?: string;
  loginPath?: string;
};

type Outcome =
  | { state: 'confirming' }
  | { state: 'confirmed' }
  | { state: 'failed'; error: string };

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
  const ConfirmEmailPage: NextPage<ConfirmEmailPageProps> = ({ token }) => {
    const {
      elements: { Alert, Paragraph },
    } = useWebsiteBuilder();
    const { t } = useTranslation();
    const router = useRouter();
    const [confirm] = useMutation(ConfirmEmailChangeDocument);
    const { refreshUser } = useUser();
    const [outcome, setOutcome] = useState<Outcome>({ state: 'confirming' });
    const started = useRef(false);

    // Confirmed from the browser, not the server: the link comes from a mail
    // program, a cross-site visit that doesn't send the strict session cookie
    // along. Here the request carries the session, so the API keeps it and
    // the reader can go straight on.
    useEffect(() => {
      if (!token || started.current) {
        return;
      }

      started.current = true;

      const { token: _, ...query } = router.query;
      router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });

      confirm({ variables: { token } }).then(
        ({ data, error }) => {
          if (error || !data?.confirmEmailChange) {
            setOutcome({
              state: 'failed',
              error: error?.message || 'Invalid or expired confirmation link.',
            });

            return;
          }

          if (getCookie(AuthTokenStorageKey)) {
            // The session provider fetched the reader when this page opened,
            // before the address changed. The next page reads them from there.
            refreshUser().finally(() => router.replace(redirectTo));

            return;
          }

          setOutcome({ state: 'confirmed' });
        },
        (error: Error) => setOutcome({ state: 'failed', error: error.message })
      );
    }, [token, confirm, router, refreshUser]);

    return (
      <>
        {outcome.state === 'confirming' && (
          <Paragraph>{t('user.emailConfirming')}</Paragraph>
        )}

        {outcome.state === 'confirmed' && (
          <Alert severity="success">{t('user.emailConfirmed')}</Alert>
        )}

        {outcome.state === 'failed' && (
          <Alert severity="error">{outcome.error}</Alert>
        )}

        {outcome.state !== 'confirming' && (
          <Link href={loginPath}>{t('user.emailConfirmedLogin')}</Link>
        )}
      </>
    );
  };

  ConfirmEmailPage.getInitialProps = async (
    ctx: NextPageContext
  ): Promise<ConfirmEmailPageProps> => {
    const token = typeof ctx.query.token === 'string' ? ctx.query.token : null;

    if (!token) {
      redirect(ctx, loginPath);
    }

    return { token };
  };

  return ConfirmEmailPage;
};

export const ConfirmEmailPage = createConfirmEmailPage();
