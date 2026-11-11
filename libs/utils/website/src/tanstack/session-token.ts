import { useRouterState } from '@tanstack/react-router';
import { FullSessionWithTokenWithoutUserFragment } from '@wepublish/website/api';
import { useMemo } from 'react';

type WithSessionToken = {
  sessionToken?: FullSessionWithTokenWithoutUserFragment | null;
};

/**
 * The session the route's loader established, for the very first render.
 *
 * `SessionProvider` seeds its state from this and only reads the cookie
 * afterwards, in an effect. Without a value here the first render of a cold
 * entry is always logged out, even for a reader who has a valid cookie — and
 * a second render later is not the same thing:
 *
 * - `SubscribeContainer` runs `useQuery(ChallengeDocument, {skip: hasUser})`.
 *   On render one `hasUser` is false, so the query starts; on render two it
 *   is true, so the query is skipped mid-flight and Apollo leaves it at
 *   `loading: true` forever. `subscribe.tsx` disables the submit button on
 *   `challenge.loading`, so `/mitmachen` becomes unsubscribable — but only
 *   when entered directly, because a client-side navigation already has the
 *   session by the time the component mounts.
 * - The form picks `loggedOutSchema` and renders password and address fields
 *   before swapping to the logged-in one.
 *
 * Next had this for free: `_app` received `pageProps.sessionToken` from the
 * page's `getInitialProps`, so render one already knew. This is the same
 * value from the same place — the authenticated loaders in `routes/account.ts`
 * all return it — just read off the matches instead of threaded through props.
 *
 * Only the `no-store` routes authenticate, so nothing user specific reaches
 * the HTML of a page a CDN may cache.
 */
export const useRouteSessionToken =
  (): FullSessionWithTokenWithoutUserFragment | null => {
    const matches = useRouterState({ select: state => state.matches });

    return useMemo(() => {
      const deepest = [...matches]
        .reverse()
        .find(
          match =>
            (match.loaderData as WithSessionToken | undefined)?.sessionToken
        );

      return (
        (deepest?.loaderData as WithSessionToken | undefined)?.sessionToken ??
        null
      );
    }, [matches]);
  };
