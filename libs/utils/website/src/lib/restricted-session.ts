import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { SessionInfoDocument } from '@wepublish/website/api';
import { useEffect } from 'react';

/**
 * Whether the reader's session is a restricted one: opened by a personal
 * login code and not yet past the welcome steps. Asked again when the window
 * gets the focus back, because the steps may be finished in another tab (the
 * confirmation link in the mail opens one).
 *
 * Shared by the Next and the TanStack redirect, which only differ in how they
 * read the current page and navigate.
 */
export const useRestrictedSession = (): boolean => {
  const { hasUser } = useUser();
  const { data, refetch } = useQuery(SessionInfoDocument, {
    skip: !hasUser,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!hasUser) {
      return;
    }

    const onFocus = () => {
      refetch();
    };

    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, [hasUser, refetch]);

  return data?.sessionInfo.restricted ?? false;
};
