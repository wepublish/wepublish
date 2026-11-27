import { useApolloClient, useMutation } from '@apollo/client/react';
import { useNavigate } from '@tanstack/react-router';
import {
  AuthTokenStorageKey,
  useUser,
} from '@wepublish/authentication/website';
import { ConfirmEmailChangeDocument } from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { getCookie } from 'cookies-next';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { sessionSurvivedConfirmation } from '../../lib/confirm-email-outcome';
import { useQueryParams, useReplaceSearch } from '../router-hooks';

export type ConfirmEmailPageOptions = {
  redirectTo?: string;
  loginPath?: string;
};

type Outcome =
  | { state: 'confirming' }
  | { state: 'confirmed' }
  | { state: 'signedOut' }
  | { state: 'failed'; error: string };

/**
 * `next/pages/confirm-email-page.tsx` for TanStack Start. The route (see
 * `confirmEmailRoute`) sends a visit without `?token=` to the login page.
 */
export const createConfirmEmailPage = ({
  redirectTo = '/profile?emailConfirmed=1',
  loginPath = '/login',
}: ConfirmEmailPageOptions = {}) =>
  function ConfirmEmailPage() {
    const {
      elements: { Alert, Paragraph },
    } = useWebsiteBuilder();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const replaceSearch = useReplaceSearch();
    const token = useQueryParams().token;
    const [confirm] = useMutation(ConfirmEmailChangeDocument);
    const client = useApolloClient();
    const { refreshUser, setToken } = useUser();
    const [outcome, setOutcome] = useState<Outcome>({ state: 'confirming' });
    const started = useRef(false);

    // Confirmed from the browser, not the server: the link comes from a mail
    // program, a cross-site visit that doesn't send the strict session cookie
    // along. Here the request carries the session, so the API keeps it and
    // the reader can go straight on.
    useEffect(() => {
      if (typeof token !== 'string' || started.current) {
        return;
      }

      started.current = true;

      replaceSearch(({ token: _, ...rest }) => rest, { resetScroll: false });

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
            // The confirmation frees the session that asked for it and ends
            // the account's other login-code sessions, maybe this browser's.
            sessionSurvivedConfirmation(client).then(survived => {
              if (!survived) {
                setToken(null).finally(() =>
                  setOutcome({ state: 'signedOut' })
                );

                return;
              }

              // The session provider fetched the reader when this page
              // opened, before the address changed. The next page reads them
              // from there.
              refreshUser().finally(() =>
                navigate({ href: redirectTo, replace: true })
              );
            });

            return;
          }

          setOutcome({ state: 'confirmed' });
        },
        (error: Error) => setOutcome({ state: 'failed', error: error.message })
      );
    }, [
      token,
      confirm,
      navigate,
      replaceSearch,
      refreshUser,
      setToken,
      client,
    ]);

    return (
      <>
        {/* The token is in the address until the effect above drops it:
            nothing this page loads may carry it on in a referrer. React
            hoists this into the head. */}
        <meta
          name="referrer"
          content="no-referrer"
        />

        {outcome.state === 'confirming' && (
          <Paragraph>{t('user.emailConfirming')}</Paragraph>
        )}

        {outcome.state === 'confirmed' && (
          <Alert severity="success">{t('user.emailConfirmed')}</Alert>
        )}

        {outcome.state === 'signedOut' && (
          <Alert severity="warning">{t('user.emailConfirmedSignedOut')}</Alert>
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
