import { ApolloClient } from '@apollo/client';
import { useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { MeDocument, SessionInfoDocument } from '@wepublish/website/api';

import { Welcome } from '../../lib/components/welcome/welcome';
import { withAuthGuard } from '../auth-guard';
import { useQueryParams } from '../router-hooks';
import {
  createAuthenticatedSsrClient,
  extractCache,
  getRequestSessionToken,
} from '../ssr';

export type WelcomePageOptions = {
  profilePath?: string;
};

/**
 * What the welcome steps render, fetched on the server: the reader, and what
 * their session may do. Without the session the first render shows the steps
 * of one that is not restricted.
 */
export const prefetchWelcome = (client: ApolloClient) =>
  Promise.all([
    client.query({ query: MeDocument }),
    client.query({ query: SessionInfoDocument }),
  ]);

/**
 * TanStack port of `WelcomePage.getInitialProps`. A `createServerFn` because
 * it needs the auth cookie; the route merges the returned cache into the
 * router client with `mergeApolloCache`. Its page is the reader's own:
 * `no-store`.
 */
export const loadWelcome = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { client } = createAuthenticatedSsrClient();
    const sessionToken = getRequestSessionToken();

    if (sessionToken) {
      await prefetchWelcome(client);
    }

    return { sessionToken, apollo: extractCache(client) };
  }
);

/** `next/pages/welcome/welcome-page.tsx` for TanStack Start. */
export const createWelcomePage = ({
  profilePath = '/profile',
}: WelcomePageOptions = {}) =>
  withAuthGuard(function WelcomePage({ className }: { className?: string }) {
    const navigate = useNavigate();
    const query = useQueryParams();

    return (
      <Welcome
        className={className}
        emailConfirmed={!!query.emailConfirmed}
        onDone={() => navigate({ href: profilePath, replace: true })}
      />
    );
  });
